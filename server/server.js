const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const seedDatabase = require('./config/seed');

// ── Startup environment validation ─────────────────────────────────────────────
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[Server] FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('[Server] Please configure your .env file. See .env.example for reference.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  const JWT_DEFAULTS = ['super_secret_aj_portfolio_key_13579', 'REPLACE_WITH_A_LONG_RANDOM_SECRET_64_CHARS_MIN'];
  if (JWT_DEFAULTS.includes(process.env.JWT_SECRET)) {
    console.error('[Server] FATAL: JWT_SECRET is using a default/placeholder value in production. Generate a real secret.');
    process.exit(1);
  }
}

// Initialize server
const app = express();

// Connect to MongoDB Atlas / Local Database
connectDB().then(() => {
  // Run startup seeding routine
  seedDatabase();
});

// Configure Cloudinary media uploads
configureCloudinary();

// ── Security middlewares ───────────────────────────────────────────────────────
// Helmet with CSP tuned for: Cloudinary CDN, Google Fonts, flag-icons CDN
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src':  ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
      'style-src':   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      'font-src':    ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src':     [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://assets.mixkit.co',
        'https://flagcdn.com',         // react-phone-number-input flag images
        'https://raw.githubusercontent.com',
      ],
      'media-src':   [
        "'self'",
        'blob:',
        'https://res.cloudinary.com',
        'https://assets.mixkit.co',
      ],
      'connect-src': [
        "'self'",
        'https://res.cloudinary.com',
        'https://api.cloudinary.com',
      ],
      'worker-src':  ["'self'", 'blob:'],
      'frame-src':   ["'none'"],
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── Performance Compression (gzip) ────────────────────────────────────────────
app.use(compression());

// ── CORS Configuration ────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, cb) => {
        // In production, only allow configured origins (or same-origin requests with no Origin header)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: Origin ${origin} not allowed`));
      }
    : '*', // Dev: allow all
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again after 15 minutes'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500, // allow chunked video uploads (many small requests)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many upload requests from this IP, please try again after 15 minutes'
});

app.use('/api/auth',        generalLimiter);
app.use('/api/settings',    generalLimiter);
app.use('/api/skills',      generalLimiter);
app.use('/api/categories',  generalLimiter);
app.use('/api/submissions', generalLimiter);
app.use('/api/videos',      uploadLimiter);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Serve temporary uploads directory statically (local testing only)
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// ── Register API Routes ───────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/skills',      require('./routes/skills'));
app.use('/api/categories',  require('./routes/categories'));
// Chunk upload routes — mounted before /videos to avoid route conflicts
app.use('/api/videos',      require('./routes/chunkUpload'));
app.use('/api/videos',      require('./routes/videos'));
app.use('/api/submissions', require('./routes/submissions'));

// ── Serve frontend in production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));

  // SPA fallback — all non-API routes return index.html (fixes 404 on refresh)
  app.get('*', (req, res) => {
    // Exclude API routes from the catch-all (already handled above)
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('AJ Cinematic Portfolio API is running in development mode.');
  });
}

// ── Global 404 handler ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred',
    ...(isDev && { stack: err.stack }),
  });
});

// ── Start listening ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   API: http://localhost:${PORT}`);
  }
});

// ── API Health Check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Akshat Portfolio API Running',
    environment: process.env.NODE_ENV || 'development'
  });
});
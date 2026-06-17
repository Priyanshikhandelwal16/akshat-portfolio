const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Standard Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback: query param token for SSE/EventSource which cannot set custom headers
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_aj_portfolio_key_13579');
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Authentication check failed:', error.message);
      res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};



module.exports = { protect };


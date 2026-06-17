const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both username and password' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'super_secret_aj_portfolio_key_13579',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth check error:', error.message);
    res.status(500).json({ success: false, message: 'Server auth validation failure' });
  }
});

// @route   PUT /api/auth/update-password
// @desc    Update administrator password
// @access  Private
router.put('/update-password', protect, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password; // pre-save hook will encrypt this
    await user.save();

    res.json({ success: true, message: 'Administrative password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password update' });
  }
});

module.exports = router;

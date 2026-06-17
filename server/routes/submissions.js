const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
const Submission = require('../models/Submission');
const { protect } = require('../middleware/auth');

// ─── Rate limiter to prevent contact spam ─────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 submissions per 15 minutes
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many messages sent from this IP. Please wait 15 minutes and try again.'
    });
  }
});

// @route   POST /api/submissions
// @desc    Log a new contact form message & dispatch email via Resend
// @access  Public
router.post('/', contactLimiter, async (req, res) => {
  const { name, email, phone, subject, message, website } = req.body;

  // 1. Spam protection honeypot
  if (website) {
    console.log('[Spam Alert] Honeypot field filled. Rejecting submission.');
    return res.json({ success: true, message: 'Your message has been transmitted successfully!' });
  }

  // 2. Strict Input validation
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide your name.' });
  }
  if (name.length > 100) {
    return res.status(400).json({ success: false, message: 'Name must be under 100 characters.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter a message.' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters).' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? phone.trim() : '';
  const cleanSubject = subject ? subject.trim() : '';
  const cleanMessage = message.trim();

  try {
    // 3. Save submission to MongoDB
    const submission = new Submission({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage
    });
    await submission.save();

    // 4. Dispatch email via Resend if credentials are set
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.startsWith('your_') || apiKey === 'YOUR_RESEND_API_KEY') {
      console.warn('[Resend] Warning: RESEND_API_KEY environment variable is not set or using placeholder. Skipping email dispatch.');
    } else {
      const resend = new Resend(apiKey);
      
      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 20px; }
          .card { background-color: #141414; border: 1px solid #FFB800; border-radius: 8px; padding: 25px; max-width: 600px; margin: 0 auto; }
          h2 { color: #FFB800; border-bottom: 1px solid #222; padding-bottom: 10px; margin-top: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .field { margin-bottom: 18px; }
          .label { font-size: 11px; color: #A8A8A8; text-transform: uppercase; font-family: monospace; letter-spacing: 1.5px; display: block; margin-bottom: 4px; }
          .val { font-size: 15px; color: #FFFFFF; line-height: 1.5; }
          .message-box { background-color: #0A0A0A; border-left: 3px solid #FFB800; padding: 15px; border-radius: 4px; font-style: italic; white-space: pre-wrap; color: #F3F3F3; }
          .footer { margin-top: 25px; font-size: 10px; color: #A8A8A8; text-align: center; border-top: 1px solid #222; padding-top: 15px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>New Contact Inquiry Received</h2>
          
          <div class="field">
            <span class="label">Name</span>
            <span class="val">${cleanName}</span>
          </div>
          
          <div class="field">
            <span class="label">Email</span>
            <span class="val"><a href="mailto:${cleanEmail}" style="color: #FFB800; text-decoration: none;">${cleanEmail}</a></span>
          </div>
          
          <div class="field">
            <span class="label">Phone</span>
            <span class="val">${cleanPhone || 'Not provided'}</span>
          </div>
          
          <div class="field">
            <span class="label">Subject</span>
            <span class="val">${cleanSubject || 'General Inquiry'}</span>
          </div>
          
          <div class="field">
            <span class="label">Message</span>
            <div class="message-box">${cleanMessage}</div>
          </div>
          
          <div class="footer">
            This notification was securely forwarded by Resend from your Cinematic Portfolio CMS.
          </div>
        </div>
      </body>
      </html>
      `;

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const toEmail   = process.env.RESEND_TO_EMAIL   || 'creatorakshat7@gmail.com';

      await resend.emails.send({
        from: `AJ Portfolio <${fromEmail}>`,
        to: toEmail,
        subject: `AJ Portfolio: ${cleanSubject || 'New Contact Inquiry'}`,
        html: emailHtml
      });
      console.log(`[Resend] Successfully dispatched contact email from ${cleanEmail}`);
    }

    res.status(201).json({ 
      success: true, 
      submission, 
      message: 'Your message has been transmitted successfully!' 
    });

  } catch (error) {
    console.error('Create submission error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to transmit contact inquiry' });
  }
});

// @route   GET /api/submissions
// @desc    Retrieve list of all contact inquiries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Fetch submissions error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to query contact submissions list' });
  }
});

// @route   DELETE /api/submissions/:id
// @desc    Delete a single submission
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission record not found' });
    }

    await submission.deleteOne();
    res.json({ success: true, message: 'Submission record deleted' });
  } catch (error) {
    console.error('Delete submission error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete submission record' });
  }
});

// @route   DELETE /api/submissions
// @desc    Clear all submissions
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await Submission.deleteMany({});
    res.json({ success: true, message: 'All contact submissions cleared from database' });
  } catch (error) {
    console.error('Clear submissions error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to purge submissions logs' });
  }
});

module.exports = router;

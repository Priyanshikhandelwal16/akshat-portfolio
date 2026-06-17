const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// Helper to fetch or create the singleton settings document
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// @route   GET /api/settings
// @desc    Retrieve site settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to fetch site settings' });
  }
});

// @route   PUT /api/settings/hero
// @desc    Update hero presentation content
// @access  Private
router.put('/hero', protect, async (req, res) => {
  const { name, subtitles, heroDesc, heroSubDesc, heroCtaText, heroBgVideoUrl, heroBgPosterUrl } = req.body;

  try {
    const settings = await getOrCreateSettings();

    if (name !== undefined) settings.name = name;
    if (subtitles !== undefined) settings.subtitles = Array.isArray(subtitles) ? subtitles : subtitles.split(',').map(s => s.trim());
    if (heroDesc !== undefined) settings.heroDesc = heroDesc;
    if (heroSubDesc !== undefined) settings.heroSubDesc = heroSubDesc;
    if (heroCtaText !== undefined) settings.heroCtaText = heroCtaText;
    if (heroBgVideoUrl !== undefined) settings.heroBgVideoUrl = heroBgVideoUrl;
    if (heroBgPosterUrl !== undefined) settings.heroBgPosterUrl = heroBgPosterUrl;

    await settings.save();
    res.json({ success: true, message: 'Hero settings updated', settings });
  } catch (error) {
    console.error('Update hero settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update hero settings' });
  }
});

// @route   PUT /api/settings/about
// @desc    Update bio text, highlight, and stats counters
// @access  Private
router.put('/about', protect, async (req, res) => {
  const { bioText, bioHighlight, portraitUrl, stats } = req.body;

  try {
    const settings = await getOrCreateSettings();

    if (bioText !== undefined) settings.bioText = bioText;
    if (bioHighlight !== undefined) settings.bioHighlight = bioHighlight;
    if (portraitUrl !== undefined) settings.portraitUrl = portraitUrl;
    if (stats !== undefined) {
      settings.stats = stats;
    }

    await settings.save();
    res.json({ success: true, message: 'About settings updated', settings });
  } catch (error) {
    console.error('Update about settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update about settings' });
  }
});

// @route   PUT /api/settings/contact
// @desc    Update contact details and social media links
// @access  Private
router.put('/contact', protect, async (req, res) => {
  const { email, instagram, linkedin, whatsapp, phone, contactCta, facebook } = req.body;

  try {
    const settings = await getOrCreateSettings();

    if (!settings.socials) settings.socials = {};
    
    if (email !== undefined) settings.socials.email = email;
    if (instagram !== undefined) settings.socials.instagram = instagram;
    if (linkedin !== undefined) settings.socials.linkedin = linkedin;
    if (whatsapp !== undefined) settings.socials.whatsapp = whatsapp;
    if (phone !== undefined) settings.socials.phone = phone;
    if (facebook !== undefined) settings.socials.facebook = facebook;
    if (contactCta !== undefined) settings.socials.contactCta = contactCta;

    await settings.save();
    res.json({ success: true, message: 'Contact settings updated', settings });
  } catch (error) {
    console.error('Update contact settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update contact settings' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Hero Section Config
  name: {
    type: String,
    default: 'Akshat Jain'
  },
  subtitles: {
    type: [String],
    default: ['VIDEO EDITOR', 'CONTENT CREATOR']
  },
  heroDesc: {
    type: String,
    default: 'Turning Footage Into Stories People Remember.'
  },
  heroSubDesc: {
    type: String,
    default: 'From wedding films to brand campaigns and viral reels, I create edits that capture attention and drive engagement.'
  },
  heroCtaText: {
    type: String,
    default: 'View Projects'
  },
  heroBgVideoUrl: {
    type: String,
    default: 'https://assets.mixkit.co/videos/preview/mixkit-creative-video-editor-at-workplace-41662-large.mp4'
  },
  heroBgPosterUrl: {
    type: String,
    default: ''
  },
  
  // About Section Config
  bioText: {
    type: String,
    default: "Hi, I'm Akshat Jain, a passionate Video Editor and Content Creator focused on creating engaging visual stories that connect with audiences and help brands stand out."
  },
  bioHighlight: {
    type: String,
    default: "I believe editing is not just cutting clips—it's about creating emotions, increasing engagement, and turning ordinary footage into memorable content."
  },
  portraitUrl: {
    type: String,
    default: '' // Can store local assets or Cloudinary URLs
  },
  stats: {
    type: [{
      id: String,
      number: Number,
      label: String,
      suffix: String
    }],
    default: [
      { id: 'stat1', number: 100, label: 'Projects Delivered', suffix: '+' },
      { id: 'stat2', number: 50, label: 'Happy Clients', suffix: '+' },
      { id: 'stat3', number: 3, label: 'Years Experience', suffix: '+' },
      { id: 'stat4', number: 1.5, label: 'Million+ Views', suffix: 'M+' }
    ]
  },

  // Contact Links Config
  socials: {
    email: {
      type: String,
      default: 'hello@akshatjain.com'
    },
    instagram: {
      type: String,
      default: 'https://instagram.com'
    },
    linkedin: {
      type: String,
      default: 'https://linkedin.com'
    },
    whatsapp: {
      type: String,
      default: 'https://wa.me/919999999999'
    },
    phone: {
      type: String,
      default: '+91 99999 99999'
    },
    facebook: {
      type: String,
      default: 'https://facebook.com'
    },
    contactCta: {
      type: String,
      default: "LET'S WORK TOGETHER"
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);

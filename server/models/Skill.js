const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  iconType: {
    type: String,
    required: true,
    enum: ['after-effects', 'premiere-pro', 'capcut', 'video', 'typography', 'wedding', 'brand', 'commercial', 'trending', 'motion'],
    default: 'video'
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Skill', SkillSchema);

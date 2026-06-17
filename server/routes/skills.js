const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const { protect } = require('../middleware/auth');

// @route   GET /api/skills
// @desc    Get all skills ordered by display index
// @access  Public
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, skills });
  } catch (error) {
    console.error('Fetch skills error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to retrieve skills' });
  }
});

// @route   POST /api/skills
// @desc    Create a new skill
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, iconType, order } = req.body;

  if (!name || !iconType) {
    return res.status(400).json({ success: false, message: 'Please provide both name and iconType' });
  }

  try {
    const skill = new Skill({
      name,
      iconType,
      order: order || 0
    });

    await skill.save();
    res.status(201).json({ success: true, skill, message: 'Skill created successfully' });
  } catch (error) {
    console.error('Create skill error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create skill record' });
  }
});

// @route   PUT /api/skills/:id
// @desc    Update an existing skill
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, iconType, order } = req.body;

  try {
    let skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill record not found' });
    }

    if (name !== undefined) skill.name = name;
    if (iconType !== undefined) skill.iconType = iconType;
    if (order !== undefined) skill.order = order;

    await skill.save();
    res.json({ success: true, skill, message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update skill error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update skill record' });
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete a skill
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill record not found' });
    }

    await skill.deleteOne();
    res.json({ success: true, message: 'Skill record removed' });
  } catch (error) {
    console.error('Delete skill error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete skill record' });
  }
});

module.exports = router;

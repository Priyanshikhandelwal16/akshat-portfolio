const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Video = require('../models/Video');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Retrieve all categories sorted by order sequence
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch categories error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to retrieve categories' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category node
// @access  Private
router.post('/', protect, async (req, res) => {
  const { title, key, description, coverUrl, vertical, order } = req.body;

  if (!title || !key) {
    return res.status(400).json({ success: false, message: 'Please provide both title and key slug' });
  }

  try {
    // Check if key slug is already in use
    const existing = await Category.findOne({ key: key.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'slug key must be unique, this one is already in use' });
    }

    const category = new Category({
      title,
      key: key.toLowerCase().trim(),
      description: description || '',
      coverUrl: coverUrl || '',
      vertical: !!vertical,
      order: order || 0
    });

    await category.save();
    res.status(201).json({ success: true, category, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to create category node' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category node
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { title, key, description, coverUrl, vertical, order } = req.body;

  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (key !== undefined) {
      const slug = key.toLowerCase().trim();
      if (slug !== category.key) {
        const existing = await Category.findOne({ key: slug });
        if (existing) {
          return res.status(400).json({ success: false, message: 'slug key already in use by another category' });
        }
        category.key = slug;
      }
    }

    if (title !== undefined) category.title = title;
    if (description !== undefined) category.description = description;
    if (coverUrl !== undefined) category.coverUrl = coverUrl;
    if (vertical !== undefined) category.vertical = !!vertical;
    if (order !== undefined) category.order = order;

    await category.save();
    res.json({ success: true, category, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to update category node' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category node and clean up all associated videos from DB & Cloudinary
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category node not found' });
    }

    // Find all videos inside this category
    const videos = await Video.find({ category: category._id });

    const hasCloudinaryKeys = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    // Destroy every associated media asset in Cloudinary
    if (hasCloudinaryKeys) {
      for (const video of videos) {
        try {
          if (video.publicId) {
            await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
          }
          if (video.posterPublicId) {
            await cloudinary.uploader.destroy(video.posterPublicId);
          }
        } catch (cloudinaryErr) {
          console.error(`Failed to delete Cloudinary asset for video ${video._id}:`, cloudinaryErr.message);
        }
      }
    } else {
      console.warn('Skipping Cloudinary assets cleanup during category deletion: credentials not configured.');
    }

    // Delete associated video documents from database
    await Video.deleteMany({ category: category._id });

    // Delete category
    await category.deleteOne();

    res.json({ success: true, message: 'Category and all associated video files cleaned up successfully' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during category removal' });
  }
});

module.exports = router;

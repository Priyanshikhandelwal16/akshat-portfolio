/**
 * videos.js  –  Video API routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *   Client uploads file in 5MB chunks → /api/videos/upload-* (chunkUpload.js)
 *   Client POSTs job metadata → POST /process-job
 *   Background queue runs FFmpeg + Cloudinary (videoQueue.js)
 *   Client polls SSE → GET /job-status/:jobId (reconnectable, no timeout risk)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { enqueueJob, getJob, addSSEListener, removeSSEListener, retryJob, getQueueStats } = require('../services/videoQueue');
const { destroyAsset } = require('../services/cloudinaryService');

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn('[Videos] Could not delete file:', filePath, e.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/videos
// @desc    Retrieve all video items (grouped by category and ordered)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find({ uploadStatus: 'completed' })
      .populate('category', 'title key vertical')
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    console.error('Fetch videos error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to retrieve videos' });
  }
});

// @route   GET /api/videos/category/:catKey
// @desc    Retrieve completed videos inside a specific category.
//          Accepts both a MongoDB ObjectId (used by admin panel) and a string key (used by public portfolio).
// @access  Public
router.get('/category/:catKey', async (req, res) => {
  try {
    const param = req.params.catKey;
    // Detect MongoDB ObjectId (24-char hex string)
    const isObjectId = /^[a-f\d]{24}$/i.test(param);
    const query = isObjectId ? { _id: param } : { key: param.toLowerCase() };

    const category = await Category.findOne(query);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const videos = await Video.find({
      category: category._id,
      uploadStatus: 'completed',
    }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, category, videos });
  } catch (error) {
    console.error('Fetch category videos error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to query category videos' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PIPELINE ROUTES (Private)
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/videos/process-job
// @desc    Submit a finalized upload for background processing. Returns jobId immediately.
// @access  Private
router.post('/process-job', protect, async (req, res) => {
  const { tempId, rawPath, originalName, title, description, tag, aspectRatio, categoryId, sizeMB } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!tempId || !rawPath || !title || !categoryId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: tempId, rawPath, title, categoryId',
    });
  }
  if (!fs.existsSync(rawPath)) {
    return res.status(400).json({
      success: false,
      message: 'Uploaded file not found on server. Please re-upload.',
    });
  }

  const category = await Category.findById(categoryId).catch(() => null);
  if (!category) {
    safeUnlink(rawPath);
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  // ── Enqueue job (returns immediately) ─────────────────────────────────────
  const jobId = enqueueJob({
    rawPath,
    originalName: originalName || path.basename(rawPath),
    title,
    description: description || '',
    tag: tag || '',
    aspectRatio: aspectRatio || '16/9',
    categoryId,
    sizeMB: parseFloat(sizeMB) || 0,
  });

  console.log(`[Videos] Job enqueued: ${jobId} for "${title}" (${sizeMB}MB)`);

  res.json({
    success: true,
    jobId,
    message: 'Job queued — processing will begin shortly',
  });
});

// @route   GET /api/videos/job-status/:jobId
// @desc    SSE stream for job progress. Reconnectable — replays current state on connect.
// @access  Private (token as query param for EventSource compatibility)
router.get('/job-status/:jobId', protect, (req, res) => {
  const { jobId } = req.params;

  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found. It may have expired or the server restarted.',
    });
  }

  // ── Set up SSE headers ────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // ── Attach listener (replays current state immediately) ───────────────────
  addSSEListener(jobId, res);

  // ── Heartbeat to keep connection alive through proxies ────────────────────
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (_) {}
  }, 25000);

  // ── Cleanup on client disconnect ──────────────────────────────────────────
  req.on('close', () => {
    clearInterval(heartbeat);
    removeSSEListener(jobId, res);
  });
});

// @route   POST /api/videos/retry-job/:jobId
// @desc    Retry a failed pipeline job
// @access  Private
router.post('/retry-job/:jobId', protect, (req, res) => {
  const result = retryJob(req.params.jobId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }
  res.json({ success: true, message: result.message });
});

// @route   GET /api/videos/queue-stats
// @desc    Monitor queue health (for admin dashboard)
// @access  Private
router.get('/queue-stats', protect, (req, res) => {
  res.json({ success: true, stats: getQueueStats() });
});

// ─────────────────────────────────────────────────────────────────────────────
// MANAGEMENT ROUTES (Private)
// ─────────────────────────────────────────────────────────────────────────────

// @route   PUT /api/videos/:id
// @desc    Update video details (title, description, tag, aspectRatio, category)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { title, description, tag, aspectRatio, category } = req.body;
  try {
    let video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video record not found' });
    }
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (tag !== undefined) video.tag = tag;
    if (aspectRatio !== undefined) video.aspectRatio = aspectRatio;
    if (category !== undefined) video.category = category;
    await video.save();
    res.json({ success: true, video, message: 'Video details updated successfully' });
  } catch (error) {
    console.error('Update video error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update video record details' });
  }
});

// @route   POST /api/videos/reorder
// @desc    Update sequence order of multiple videos
// @access  Private
router.post('/reorder', protect, async (req, res) => {
  const { videoIds } = req.body;
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid array of videoIds' });
  }
  try {
    const operations = videoIds.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { order: index } },
    }));
    if (operations.length > 0) await Video.bulkWrite(operations);
    res.json({ success: true, message: 'Project display sequence updated' });
  } catch (error) {
    console.error('Reorder videos error:', error.message);
    res.status(500).json({ success: false, message: 'Server failed to save layout orders' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video from DB and destroy Cloudinary assets
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video record not found' });
    }

    const hasCloudinaryKeys =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinaryKeys) {
      // Destroy video and thumbnail assets in parallel
      await Promise.allSettled([
        video.publicId     ? destroyAsset(video.publicId, 'video')     : Promise.resolve(),
        video.posterPublicId ? destroyAsset(video.posterPublicId, 'image') : Promise.resolve(),
      ]);
    } else {
      console.warn('[Videos] Skipping Cloudinary cleanup: credentials not configured.');
    }

    await video.deleteOne();
    res.json({ success: true, message: 'Video asset and catalog entry deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete video asset' });
  }
});

module.exports = router;

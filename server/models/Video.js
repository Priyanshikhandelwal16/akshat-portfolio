const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  // ── Core ──────────────────────────────────────────────────────────────────
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },

  // ── Cloudinary assets ─────────────────────────────────────────────────────
  videoUrl: {
    type: String,
    required: true,
  },
  posterUrl: {
    type: String,
    default: '',
  },
  publicId: {
    type: String,
    default: '',
  },
  posterPublicId: {
    type: String,
    default: '',
  },

  // ── Display metadata ──────────────────────────────────────────────────────
  tag: {
    type: String,
    default: '',
  },
  aspectRatio: {
    type: String,
    enum: ['16/9', '9/16'],
    default: '16/9',
  },
  order: {
    type: Number,
    default: 0,
  },

  // ── Upload pipeline tracking ──────────────────────────────────────────────
  uploadStatus: {
    type: String,
    enum: [
      'uploading',             // Client is sending file chunks
      'queued',                // File received, job queued for processing
      'compressing',           // FFmpeg is transcoding
      'uploading_to_cloudinary', // Sending optimized file to Cloudinary
      'processing',            // Saving to database
      'completed',             // Pipeline finished successfully
      'failed',                // Pipeline failed (see error field)
    ],
    default: 'completed',      // Default completed for backwards compat with old records
  },
  jobId: {
    type: String,
    default: '',
    index: true,
  },

  // ── Source video metadata (populated after FFmpeg probe) ──────────────────
  originalMetadata: {
    filename: { type: String, default: '' },
    sizeMB:   { type: Number, default: 0 },
    codec:    { type: String, default: '' },
    duration: { type: Number, default: 0 },   // seconds
    width:    { type: Number, default: 0 },
    height:   { type: Number, default: 0 },
    format:   { type: String, default: '' },
  },

  // ── Optimized output metadata (populated after FFmpeg transcode) ──────────
  optimizedMetadata: {
    sizeMB:   { type: Number, default: 0 },
    codec:    { type: String, default: 'h264' },
    bitrate:  { type: String, default: '' },
    duration: { type: Number, default: 0 },
    width:    { type: Number, default: 0 },
    height:   { type: Number, default: 0 },
  },

}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);

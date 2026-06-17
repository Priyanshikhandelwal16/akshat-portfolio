/**
 * videoQueue.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Background job queue for the video media pipeline.
 *
 * Architecture:
 *  - Jobs stored in a Map (survives SSE disconnects, lost on server restart)
 *  - Native concurrency limiter (no external deps — CJS compatible)
 *  - Each job progresses through states and broadcasts to SSE listeners
 *  - SSE listeners attach/detach independently — queue runs regardless
 *
 * States: queued → compressing → uploading_to_cloudinary → processing → completed
 *                                                                      ↘ failed
 */

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const { probeVideo, transcodeVideo, generateThumbnail } = require('./ffmpegService');
const { uploadVideo, uploadThumbnail } = require('./cloudinaryService');
const Video = require('../models/Video');
const Category = require('../models/Category');

// ─── Temp directory ────────────────────────────────────────────────────────────
const TEMP_DIR = path.join(__dirname, '../temp');

// ─── In-memory job store ───────────────────────────────────────────────────────
// jobId → jobState
const jobs = new Map();

// ─── Native concurrency limiter ───────────────────────────────────────────────
// Runs at most MAX_CONCURRENT jobs simultaneously (1 = serialized, CPU-safe)
const MAX_CONCURRENT = 1;
let running = 0;
const waitQueue = []; // Array of () => Promise<void>

function scheduleNext() {
  while (running < MAX_CONCURRENT && waitQueue.length > 0) {
    const task = waitQueue.shift();
    running++;
    Promise.resolve(task()).finally(() => {
      running--;
      scheduleNext();
    });
  }
}

function enqueueTask(fn) {
  waitQueue.push(fn);
  scheduleNext();
}

function getQueueStats() {
  return {
    running,
    queued: waitQueue.length,
    totalJobs: jobs.size,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn('[Queue] Could not delete temp file:', filePath, e.message);
  }
}

function safeRmdirRecursive(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn('[Queue] Could not delete temp dir:', dirPath, e.message);
  }
}

// ─── SSE broadcast ────────────────────────────────────────────────────────────
function broadcastJobEvent(jobId, data) {
  const job = jobs.get(jobId);
  if (!job) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  job.sseClients.forEach((client) => {
    try { client.write(payload); } catch (_) { /* disconnected */ }
  });
}

// ─── Job state updater ────────────────────────────────────────────────────────
function updateJobState(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return;
  Object.assign(job, updates);
  broadcastJobEvent(jobId, {
    status:   job.status,
    progress: job.progress,
    message:  job.message,
    ...(job.video ? { video: job.video } : {}),
    ...(job.error ? { error: job.error } : {}),
  });
}

// ─── Core pipeline ────────────────────────────────────────────────────────────
async function runPipeline(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  const { rawPath, title, description, tag, aspectRatio, categoryId } = job;
  let transcodedPath = null;
  let thumbPath     = null;
  let thumbDir      = null;

  try {
    // ── STAGE 1: Validate category ─────────────────────────────────────────
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    // ── STAGE 2: Probe source video ────────────────────────────────────────
    updateJobState(jobId, { status: 'compressing', progress: 0, message: 'Analyzing source video...' });
    console.log(`[Queue] [${jobId.slice(0, 8)}] Probing: ${path.basename(rawPath)}`);

    const sourceInfo = await probeVideo(rawPath);
    console.log(`[Queue] [${jobId.slice(0, 8)}] Source: ${sourceInfo.duration}s, ${sourceInfo.width}x${sourceInfo.height}, ${sourceInfo.codec}, ${sourceInfo.sizeMB}MB`);

    job.originalMetadata = {
      filename: job.originalName,
      sizeMB:   sourceInfo.sizeMB,
      codec:    sourceInfo.codec,
      duration: sourceInfo.duration,
      width:    sourceInfo.width,
      height:   sourceInfo.height,
      format:   sourceInfo.format,
    };

    // ── STAGE 3: Transcode to H.264 MP4 ───────────────────────────────────
    // Build output path alongside the raw file
    const rawBasename = path.basename(rawPath, path.extname(rawPath));
    transcodedPath = path.join(TEMP_DIR, `${rawBasename.replace('raw-', 'optimized-')}.mp4`);

    await transcodeVideo(rawPath, transcodedPath, sourceInfo, (percent, message) => {
      updateJobState(jobId, { status: 'compressing', progress: percent, message });
    });

    const optimizedInfo = await probeVideo(transcodedPath).catch(() => ({}));
    job.optimizedMetadata = {
      sizeMB:   optimizedInfo.sizeMB   || 0,
      codec:    'h264',
      duration: optimizedInfo.duration || sourceInfo.duration,
      width:    optimizedInfo.width    || sourceInfo.width,
      height:   optimizedInfo.height   || sourceInfo.height,
      bitrate:  optimizedInfo.bitrate  || 'auto',
    };

    // Delete raw file now that transcode succeeded
    safeUnlink(rawPath);
    job.rawPath = null;

    // ── STAGE 4: Generate thumbnail ────────────────────────────────────────
    updateJobState(jobId, { status: 'compressing', progress: 99, message: 'Generating thumbnail...' });
    thumbDir  = path.join(TEMP_DIR, `thumb-${jobId}`);
    thumbPath = await generateThumbnail(transcodedPath, thumbDir, sourceInfo.duration).catch((err) => {
      console.warn(`[Queue] [${jobId.slice(0, 8)}] Thumbnail failed (non-fatal): ${err.message}`);
      return null;
    });

    // ── STAGE 5: Upload video to Cloudinary ────────────────────────────────
    updateJobState(jobId, { status: 'uploading_to_cloudinary', progress: 0, message: 'Uploading optimized video to Cloudinary...' });
    console.log(`[Queue] [${jobId.slice(0, 8)}] Uploading video...`);
    const cloudinaryVideo = await uploadVideo(transcodedPath);
    safeUnlink(transcodedPath);
    transcodedPath = null;

    // ── STAGE 6: Upload thumbnail to Cloudinary ────────────────────────────
    let posterUrl      = '';
    let posterPublicId = '';

    if (thumbPath) {
      updateJobState(jobId, { status: 'uploading_to_cloudinary', progress: 80, message: 'Uploading thumbnail...' });
      try {
        const cloudinaryThumb = await uploadThumbnail(thumbPath);
        posterUrl      = cloudinaryThumb.secure_url;
        posterPublicId = cloudinaryThumb.public_id;
        console.log(`[Queue] [${jobId.slice(0, 8)}] Thumbnail uploaded`);
      } catch (thumbErr) {
        console.warn(`[Queue] [${jobId.slice(0, 8)}] Thumbnail upload failed (non-fatal): ${thumbErr.message}`);
        // Fallback: Cloudinary auto-generates a jpg preview from the video
        posterUrl = cloudinaryVideo.secure_url.replace(/\.[^/.]+$/, '.jpg');
      }
    } else {
      posterUrl = cloudinaryVideo.secure_url.replace(/\.[^/.]+$/, '.jpg');
    }

    safeRmdirRecursive(thumbDir);
    thumbDir = null;

    // ── STAGE 7: Save to MongoDB ───────────────────────────────────────────
    updateJobState(jobId, { status: 'processing', progress: 95, message: 'Saving to database...' });

    const currentCount = await Video.countDocuments({ category: categoryId });
    const newVideo = new Video({
      category:          categoryId,
      title,
      description:       description || '',
      videoUrl:          cloudinaryVideo.secure_url,
      posterUrl,
      tag:               tag || category.title.replace(/s$/i, ''),
      aspectRatio:       aspectRatio || '16/9',
      publicId:          cloudinaryVideo.public_id,
      posterPublicId,
      order:             currentCount,
      uploadStatus:      'completed',
      jobId,
      originalMetadata:  job.originalMetadata,
      optimizedMetadata: job.optimizedMetadata,
    });
    await newVideo.save();
    await newVideo.populate('category', 'title key vertical');

    // ── STAGE 8: Done ──────────────────────────────────────────────────────
    console.log(`[Queue] [${jobId.slice(0, 8)}] Pipeline complete ✓`);
    updateJobState(jobId, {
      status:   'completed',
      progress: 100,
      message:  'Video uploaded and optimized successfully!',
      video:    newVideo,
    });

    // Gracefully close SSE connections after flush delay
    setTimeout(() => {
      const j = jobs.get(jobId);
      if (j) j.sseClients.forEach((c) => { try { c.end(); } catch (_) {} });
    }, 3000);

  } catch (err) {
    console.error(`[Queue] [${jobId.slice(0, 8)}] Pipeline FAILED:`, err.message);

    // Cleanup transient files; preserve rawPath for retry capability
    if (transcodedPath) safeUnlink(transcodedPath);
    if (thumbPath)      safeUnlink(thumbPath);
    if (thumbDir)       safeRmdirRecursive(thumbDir);

    updateJobState(jobId, {
      status:   'failed',
      progress: 0,
      message:  err.message || 'Upload pipeline failed',
      error:    err.message,
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enqueue a new video processing job.
 * Returns jobId immediately — processing starts in background.
 */
function enqueueJob(jobData) {
  const jobId = randomUUID();

  jobs.set(jobId, {
    jobId,
    status:    'queued',
    progress:  0,
    message:   'Job queued — waiting for processor...',
    sseClients: [],
    createdAt: new Date(),
    error:     null,
    video:     null,
    // Pipeline inputs
    rawPath:      jobData.rawPath,
    originalName: jobData.originalName,
    title:        jobData.title,
    description:  jobData.description || '',
    tag:          jobData.tag || '',
    aspectRatio:  jobData.aspectRatio || '16/9',
    categoryId:   jobData.categoryId,
    // Filled during pipeline
    originalMetadata:  null,
    optimizedMetadata: null,
  });

  console.log(`[Queue] Enqueued job ${jobId.slice(0, 8)} | running:${running} queued:${waitQueue.length}`);

  // Schedule via native concurrency limiter
  enqueueTask(() => runPipeline(jobId));

  return jobId;
}

/**
 * Get current job state (for SSE reconnect replay).
 */
function getJob(jobId) {
  return jobs.get(jobId) || null;
}

/**
 * Attach an SSE response — immediately replays current state to new listener.
 */
function addSSEListener(jobId, res) {
  const job = jobs.get(jobId);
  if (!job) return false;

  job.sseClients.push(res);

  // Replay current state immediately
  const payload = `data: ${JSON.stringify({
    status:   job.status,
    progress: job.progress,
    message:  job.message,
    ...(job.video ? { video: job.video } : {}),
    ...(job.error ? { error: job.error } : {}),
  })}\n\n`;
  try { res.write(payload); } catch (_) {}

  return true;
}

/**
 * Remove SSE response on client disconnect.
 */
function removeSSEListener(jobId, res) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.sseClients = job.sseClients.filter((c) => c !== res);
}

/**
 * Retry a failed job. Preserves original file for re-processing.
 */
function retryJob(jobId) {
  const job = jobs.get(jobId);
  if (!job)                    return { success: false, message: 'Job not found' };
  if (job.status !== 'failed') return { success: false, message: 'Only failed jobs can be retried' };
  if (!job.rawPath || !fs.existsSync(job.rawPath)) {
    return { success: false, message: 'Original file no longer available — please re-upload the video' };
  }

  console.log(`[Queue] Retrying job: ${jobId.slice(0, 8)}`);
  Object.assign(job, {
    status:            'queued',
    progress:          0,
    message:           'Retrying — job re-queued...',
    error:             null,
    video:             null,
    optimizedMetadata: null,
  });

  broadcastJobEvent(jobId, { status: 'queued', progress: 0, message: 'Retrying — job re-queued...' });
  enqueueTask(() => runPipeline(jobId));

  return { success: true, message: 'Job re-queued for retry' };
}

module.exports = {
  enqueueJob,
  getJob,
  addSSEListener,
  removeSSEListener,
  retryJob,
  getQueueStats,
};

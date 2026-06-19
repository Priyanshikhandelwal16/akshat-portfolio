/**
 * cloudinaryService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper around Cloudinary SDK with retry logic for large file uploads.
 */

const { cloudinary } = require('../config/cloudinary');

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for Cloudinary upload_large
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Utility: sleep ───────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function withRetry(fn, retries = MAX_RETRIES, label = 'operation') {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === retries;
      console.warn(`[Cloudinary] ${label} attempt ${attempt}/${retries} failed: ${err.message}`);
      if (isLast) throw err;
      await sleep(RETRY_DELAY_MS * attempt); // exponential-ish backoff
    }
  }
}

// ─── Upload video ─────────────────────────────────────────────────────────────
/**
 * Uploads a local video file to Cloudinary using chunked upload_large.
 * @param {string} filePath   Absolute path to the optimized .mp4 file
 * @param {object} [extra]    Extra options to merge into upload config
 * @returns {Promise<object>} Cloudinary upload result (secure_url, public_id, etc.)
 */
function uploadVideo(filePath, extra = {}) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const options = {
          resource_type: 'video',
          folder: 'akshat_portfolio/videos',
          chunk_size: CHUNK_SIZE,
          timeout: 600000, // 10 minutes timeout limit for uploads
          // No eager transformations — FFmpeg handles all processing
          ...extra,
        };
        cloudinary.uploader.upload_large(filePath, options, (error, result) => {
          if (error) return reject(new Error(`Cloudinary video upload failed: ${error.message}`));
          resolve(result);
        });
      }),
    MAX_RETRIES,
    'video upload'
  );
}

// ─── Upload thumbnail ─────────────────────────────────────────────────────────
/**
 * Uploads a locally-generated JPEG thumbnail to Cloudinary as an image.
 * @param {string} filePath   Absolute path to the .jpg thumbnail
 * @param {object} [extra]    Extra options
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadThumbnail(filePath, extra = {}) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const options = {
          resource_type: 'image',
          folder: 'akshat_portfolio/thumbnails',
          ...extra,
        };
        cloudinary.uploader.upload(filePath, options, (error, result) => {
          if (error) return reject(new Error(`Cloudinary thumbnail upload failed: ${error.message}`));
          resolve(result);
        });
      }),
    MAX_RETRIES,
    'thumbnail upload'
  );
}

// ─── Destroy asset ────────────────────────────────────────────────────────────
/**
 * Deletes a Cloudinary asset by public_id. Silent on failure (logs warning).
 * @param {string} publicId
 * @param {'video'|'image'} resourceType
 */
async function destroyAsset(publicId, resourceType = 'video') {
  if (!publicId) return;
  try {
    await withRetry(
      () =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        }),
      2,
      `destroy ${resourceType} ${publicId}`
    );
    console.log(`[Cloudinary] Destroyed ${resourceType}: ${publicId}`);
  } catch (err) {
    console.warn(`[Cloudinary] Could not destroy ${publicId}: ${err.message}`);
  }
}

module.exports = { uploadVideo, uploadThumbnail, destroyAsset };

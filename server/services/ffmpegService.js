/**
 * ffmpegService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolated FFmpeg logic: transcode, thumbnail generation, and video probing.
 * All functions return Promises and are safe to run in a background worker.
 */

const path = require('path');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const ffmpeg = require('fluent-ffmpeg');

// Point fluent-ffmpeg at the auto-installed static binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// ─── Adaptive encode settings based on source file size & duration ───────────
// Cloudinary free plan hard limit: 100 MB. We target 95 MB to leave headroom.
const CLOUDINARY_TARGET_MB  = 95;
const AUDIO_BITRATE_KBPS    = 192;

/**
 * Returns { crf, videoBitrate, preset }
 * @param {number} fileSizeBytes  Raw input file size in bytes
 * @param {number} duration       Video duration in seconds (0 = unknown)
 */
function getEncodeSettings(fileSizeBytes, duration = 0) {
  const MB = fileSizeBytes / (1024 * 1024);

  // ── Cloudinary size cap: derive max video kbps from duration ─────────────
  // targetBits = 95 MB × 8 × 1024 × 1024
  // videoBits  = targetBits − (audioBitrate × duration)
  // videoKbps  = videoBits / duration / 1000
  let sizeCapKbps = null;
  if (duration > 0) {
    const targetBits = CLOUDINARY_TARGET_MB * 8 * 1024 * 1024;
    const audioBits  = AUDIO_BITRATE_KBPS * 1000 * duration;
    sizeCapKbps = Math.max(300, Math.floor((targetBits - audioBits) / duration / 1000));
  }

  // Helper: pick the lower of two kbps values (null = no cap)
  function minKbps(configuredKbps) {
    if (!sizeCapKbps) return `${configuredKbps}k`;
    return `${Math.min(configuredKbps, sizeCapKbps)}k`;
  }

  if (MB < 50) {
  return {
    crf: 28,
    videoBitrate: '4000k',
    preset: 'ultrafast'
  };
}
  if (MB < 150) {
    // Medium files — 4 Mbps cap or size cap, whichever is lower
    return { crf: 23, videoBitrate: minKbps(4000), preset: 'veryfast' };
  }
  // Large files — 6 Mbps cap or size cap, whichever is lower
  return { crf: 22, videoBitrate: minKbps(6000), preset: 'veryfast' };
}

// ─── Probe video metadata ─────────────────────────────────────────────────────
/**
 * Returns { duration, width, height, codec, bitrate, format, sizeMB }
 */
function probeVideo(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const format = metadata.format;

      resolve({
        duration:  parseFloat(format.duration) || 0,
        width:     videoStream?.width  || 0,
        height:    videoStream?.height || 0,
        codec:     videoStream?.codec_name || 'unknown',
        bitrate:   format.bit_rate ? `${Math.round(format.bit_rate / 1000)}k` : 'unknown',
        format:    format.format_name || 'unknown',
        sizeMB:    parseFloat((format.size / (1024 * 1024)).toFixed(2)),
      });
    });
  });
}

// ─── Transcode to H.264 MP4 ───────────────────────────────────────────────────
/**
 * @param {string}   inputPath    Absolute path to raw input file
 * @param {string}   outputPath   Absolute path for .mp4 output
 * @param {object}   sourceInfo   Result from probeVideo() (for adaptive bitrate)
 * @param {Function} onProgress   Called with (percent: number, message: string)
 * @returns {Promise<{outputPath, sizeMB}>}
 */
// How long (ms) to wait without a progress event before declaring a stall
const STALL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

function transcodeVideo(inputPath, outputPath, sourceInfo, onProgress) {
  return new Promise((resolve, reject) => {
    const fileSizeBytes = (sourceInfo.sizeMB || 0) * 1024 * 1024;
    const duration      = sourceInfo.duration || 0;
    const { crf, videoBitrate, preset } = getEncodeSettings(fileSizeBytes, duration);

    console.log(`[FFmpeg] Transcode: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`[FFmpeg] Settings: CRF=${crf}, bitrate=${videoBitrate || 'auto'}, preset=${preset}, duration=${duration}s`);
    if (videoBitrate) {
      console.log(`[FFmpeg] Size cap: targeting <${CLOUDINARY_TARGET_MB}MB for Cloudinary free plan`);
    }

    const outputOptions = [
      `-preset ${preset}`,
      `-crf ${crf}`,
      '-threads 1',

      '-map 0:v:0',
      '-map 0:a:0?',
      '-ignore_unknown',

      '-movflags +faststart',
      '-pix_fmt yuv420p',
      '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
    ];

    let lastPercent = -1;

    const command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions(outputOptions)
      .output(outputPath);

    // Apply video bitrate cap only for larger files
    if (videoBitrate) {
      command.videoBitrate(videoBitrate);
    }

    // ── Stall watchdog ───────────────────────────────────────────────────────
    // If FFmpeg emits no progress for STALL_TIMEOUT_MS, kill it and fail cleanly.
    let stallTimer = null;
    let settled    = false;

    function resetStallTimer() {
      if (settled) return;
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.error(`[FFmpeg] Stall detected — no progress for ${STALL_TIMEOUT_MS / 1000}s. Killing process.`);
        try { command.kill('SIGKILL'); } catch (_) {}
        reject(new Error(`FFmpeg stalled (no progress for ${STALL_TIMEOUT_MS / 1000}s). The file may be corrupt or the system is overloaded.`));
      }, STALL_TIMEOUT_MS);
    }

    command
      .on('start', () => {
        resetStallTimer(); // arm watchdog on start
        if (onProgress) onProgress(0, 'Starting compression...');
      })
      .on('progress', (progress) => {
        resetStallTimer(); // reset watchdog on each progress tick
        let percent = 0;
        if (progress.percent != null && !isNaN(progress.percent)) {
          percent = Math.min(99, Math.round(progress.percent));
        } else if (duration > 0 && progress.timemark) {
          // Fallback: parse hh:mm:ss.ms timemark
          const parts = progress.timemark.split(':');
          const secs = (+parts[0]) * 3600 + (+parts[1]) * 60 + parseFloat(parts[2] || 0);
          percent = Math.min(99, Math.round((secs / duration) * 100));
        }
        if (percent !== lastPercent) {
          lastPercent = percent;
          if (onProgress) onProgress(percent, `Compressing video... ${percent}%`);
        }
      })
      .on('end', () => {
        if (settled) return;
        settled = true;
        clearTimeout(stallTimer);
        try {
          const stats = fs.statSync(outputPath);
          const sizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
          console.log(`[FFmpeg] Transcode complete → ${sizeMB}MB`);
          resolve({ outputPath, sizeMB });
        } catch (e) {
          resolve({ outputPath, sizeMB: 0 });
        }
      })
      .on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(stallTimer);
        console.error(`[FFmpeg] Transcode failed: ${err.message}`);
        reject(new Error(`FFmpeg transcode failed: ${err.message}`));
      })

      .on('start', (cmd) => {
  console.log('[FFmpeg CMD]', cmd);
})

/*
.on('stderr', (line) => {
  console.log('[FFmpeg STDERR]', line);
})
*/

      .run();

    resetStallTimer(); // arm immediately in case 'start' never fires
  });
}

// ─── Generate poster thumbnail ────────────────────────────────────────────────
/**
 * Extracts a single JPEG frame at ~10% of video duration.
 * @param {string} inputPath    Absolute path to video (raw or transcoded)
 * @param {string} outputDir    Directory where thumb.jpg will be written
 * @param {number} duration     Video duration in seconds (from probeVideo)
 * @returns {Promise<string>}   Absolute path to the generated thumbnail
 */
function generateThumbnail(inputPath, outputDir, duration) {
  return new Promise((resolve, reject) => {
    // Pick frame at 10% of duration, minimum 1 second in
    const timestamp = Math.max(1, Math.floor((duration || 10) * 0.1));
    const thumbFilename = `thumb-${Date.now()}.jpg`;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: thumbFilename,
        folder: outputDir,
        size: '1280x?',        // preserve aspect ratio, 1280px wide
      })
      .on('end', () => {
        const thumbPath = path.join(outputDir, thumbFilename);
        if (fs.existsSync(thumbPath)) {
          console.log(`[FFmpeg] Thumbnail generated: ${thumbFilename}`);
          resolve(thumbPath);
        } else {
          reject(new Error('Thumbnail file was not created by FFmpeg'));
        }
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] Thumbnail generation failed: ${err.message}`);
        reject(new Error(`FFmpeg thumbnail failed: ${err.message}`));
      });
  });
}

module.exports = { probeVideo, transcodeVideo, generateThumbnail, getEncodeSettings };

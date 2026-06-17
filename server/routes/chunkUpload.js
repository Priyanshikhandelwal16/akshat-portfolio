/**
 * chunkUpload.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Three-route handler for resumable chunked file uploads.
 *
 * Flow:
 *  POST /upload-init      → create upload session, return uploadId
 *  POST /upload-chunk     → receive one 5MB chunk, store to disk
 *  POST /upload-finalize  → assemble all chunks into final raw file, return tempId
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { protect } = require('../middleware/auth');

// ─── Directory setup ──────────────────────────────────────────────────────────
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─── In-memory upload session registry ───────────────────────────────────────
// uploadId → { totalChunks, receivedChunks: Set, originalName, chunkDir, expiresAt }
const uploadSessions = new Map();

// Clean up stale sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of uploadSessions) {
    if (session.expiresAt < now) {
      try {
        if (fs.existsSync(session.chunkDir)) {
          fs.rmSync(session.chunkDir, { recursive: true, force: true });
        }
      } catch (_) {}
      uploadSessions.delete(id);
      console.log(`[ChunkUpload] Cleaned up stale session: ${id}`);
    }
  }
}, 30 * 60 * 1000);

// ─── Multer for chunk binary data ─────────────────────────────────────────────
const chunkStorage = multer.memoryStorage(); // chunks go into memory, written manually
const chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per chunk
});

// ─── Allowed video extensions ─────────────────────────────────────────────────
const ALLOWED_EXTENSIONS = /\.(mp4|mkv|mov|avi|webm|wmv|flv|m4v)$/i;

// ─────────────────────────────────────────────────────────────────────────────
// POST /upload-init
// Body: { filename, totalChunks, fileSizeMB }
// Returns: { uploadId }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload-init', protect, (req, res) => {
  const { filename, totalChunks, fileSizeMB } = req.body;

  if (!filename || !totalChunks) {
    return res.status(400).json({ success: false, message: 'filename and totalChunks are required' });
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.test(ext)) {
    return res.status(400).json({ success: false, message: 'File type not supported. Use MP4, MOV, MKV, AVI, WebM.' });
  }

  const chunks = parseInt(totalChunks, 10);
  if (isNaN(chunks) || chunks < 1 || chunks > 200) {
    return res.status(400).json({ success: false, message: 'totalChunks must be between 1 and 200' });
  }

  const uploadId = randomUUID();
  const chunkDir = path.join(TEMP_DIR, `chunks-${uploadId}`);
  fs.mkdirSync(chunkDir, { recursive: true });

  uploadSessions.set(uploadId, {
    totalChunks: chunks,
    receivedChunks: new Set(),
    originalName: filename,
    fileSizeMB: parseFloat(fileSizeMB) || 0,
    ext,
    chunkDir,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2-hour expiry
  });

  console.log(`[ChunkUpload] Init: ${uploadId} | ${filename} | ${chunks} chunks | ${fileSizeMB}MB`);

  res.json({ success: true, uploadId });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /upload-chunk
// FormData: chunk (binary), uploadId, chunkIndex
// Returns: { received, total }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload-chunk', protect, chunkUpload.single('chunk'), (req, res) => {
  const { uploadId, chunkIndex } = req.body;

  if (!uploadId || chunkIndex === undefined) {
    return res.status(400).json({ success: false, message: 'uploadId and chunkIndex are required' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No chunk data received' });
  }

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Upload session not found. Please restart the upload.' });
  }

  const index = parseInt(chunkIndex, 10);
  if (isNaN(index) || index < 0 || index >= session.totalChunks) {
    return res.status(400).json({ success: false, message: `Invalid chunkIndex: ${chunkIndex}` });
  }

  // Write chunk to disk
  const chunkPath = path.join(session.chunkDir, `chunk-${String(index).padStart(6, '0')}`);
  try {
    fs.writeFileSync(chunkPath, req.file.buffer);
    session.receivedChunks.add(index);
    // Refresh session expiry on activity
    session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  } catch (err) {
    console.error(`[ChunkUpload] Failed to write chunk ${index} for ${uploadId}:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to store chunk on server' });
  }

  res.json({
    success: true,
    received: session.receivedChunks.size,
    total: session.totalChunks,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /upload-finalize
// Body: { uploadId }
// Returns: { tempId, originalName, sizeMB }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload-finalize', protect, async (req, res) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    return res.status(400).json({ success: false, message: 'uploadId is required' });
  }

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Upload session not found or expired. Please re-upload.' });
  }

  // Verify all chunks received
  const missing = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!session.receivedChunks.has(i)) missing.push(i);
  }
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing chunks: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`,
      missingChunks: missing,
    });
  }

  // Assemble chunks in order into a single raw file
  const tempId = `raw-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const rawFilePath = path.join(TEMP_DIR, `${tempId}${session.ext}`);

  try {
    const writeStream = fs.createWriteStream(rawFilePath);

    await new Promise((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);

      const assembleChunks = (index) => {
        if (index >= session.totalChunks) {
          writeStream.end();
          return;
        }
        const chunkPath = path.join(session.chunkDir, `chunk-${String(index).padStart(6, '0')}`);
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData, (err) => {
          if (err) return reject(err);
          assembleChunks(index + 1);
        });
      };

      assembleChunks(0);
    });

    // Get assembled file size
    const stats = fs.statSync(rawFilePath);
    const sizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

    // Cleanup chunk directory
    try {
      fs.rmSync(session.chunkDir, { recursive: true, force: true });
    } catch (_) {}
    uploadSessions.delete(uploadId);

    console.log(`[ChunkUpload] Assembled: ${rawFilePath} (${sizeMB}MB)`);

    res.json({
      success: true,
      tempId,
      rawPath: rawFilePath,
      originalName: session.originalName,
      sizeMB,
    });

  } catch (err) {
    console.error(`[ChunkUpload] Assembly failed for ${uploadId}:`, err.message);
    // Clean up partial raw file if it exists
    try { if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath); } catch (_) {}
    res.status(500).json({ success: false, message: `File assembly failed: ${err.message}` });
  }
});

module.exports = router;

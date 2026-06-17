import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Reorder } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
  Upload,
  Film,
  Menu,
  ArrowUpDown,
  Save,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Cloud,
  Database,
  ChevronRight,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CHUNK_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per chunk

// ─── Upload state config ──────────────────────────────────────────────────────
// ─── Upload state config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  uploading: {
    label: 'Uploading',
    icon: Upload,
    color: 'text-blue-400',
    barColor: 'bg-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    description: 'Sending file chunks to server...',
  },
  queued: {
    label: 'Processing',
    icon: Clock,
    color: 'text-amber-400',
    barColor: 'bg-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    description: 'Queued for background processing...',
  },
  compressing: {
    label: 'Compressing',
    icon: Zap,
    color: 'text-yellow-400',
    barColor: 'bg-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    description: 'Running FFmpeg H.264 compression...',
  },
  uploading_to_cloudinary: {
    label: 'Publishing',
    icon: Cloud,
    color: 'text-purple-400',
    barColor: 'bg-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    description: 'Uploading optimized video to CDN...',
  },
  processing: {
    label: 'Processing',
    icon: Database,
    color: 'text-cyan-400',
    barColor: 'bg-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    description: 'Saving asset to portfolio database...',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    barColor: 'bg-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/30',
    description: 'Video uploaded and published successfully!',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    color: 'text-red-400',
    barColor: 'bg-red-500',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    description: 'Upload failed — see details below',
  },
};

// ─── Progress bar component ───────────────────────────────────────────────────
function UploadProgressPanel({ uploadState, onRetry, onClose }) {
  const { status, progress, message, error, jobId } = uploadState;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const StatusIcon = cfg.icon;
  const isIndeterminate = ['queued', 'uploading_to_cloudinary', 'processing'].includes(status);
  const isFailed = status === 'failed';
  const isDone = status === 'completed';

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
            <StatusIcon
              className={`w-4 h-4 ${cfg.color} ${!isDone && !isFailed ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <p className={`font-mono text-xs font-bold uppercase tracking-widest ${cfg.color}`}>
              {cfg.label}
            </p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">
              {message || cfg.description}
            </p>
          </div>
        </div>
        {!isDone && !isFailed && (
          <span className={`font-mono text-sm font-bold ${cfg.color}`}>
            {isIndeterminate ? '···' : `${progress}%`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden border border-white/5">
        {isIndeterminate && !isFailed ? (
          <div
            className={`h-full w-1/3 rounded-full ${cfg.barColor} opacity-80`}
            style={{ animation: 'indeterminate-slide 1.4s ease-in-out infinite' }}
          />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${isFailed ? 'bg-red-500' : cfg.barColor}`}
            style={{ width: `${isFailed ? 100 : progress}%` }}
          />
        )}
      </div>

      {/* Stage pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['uploading', 'compressing', 'uploading_to_cloudinary', 'processing'].map((stage) => {
          const sCfg = STATUS_CONFIG[stage];
          const SIcon = sCfg.icon;
          const stageOrder = {
            uploading: 0,
            compressing: 1,
            uploading_to_cloudinary: 2,
            processing: 3,
          }[stage];

          const currentOrder = {
            uploading: 0,
            queued: 1,
            compressing: 1,
            uploading_to_cloudinary: 2,
            processing: 3,
            completed: 4,
          }[status] ?? 0;

          const isActive = !isFailed && (
            status === stage || 
            (status === 'queued' && stage === 'compressing')
          );
          const isPast = !isFailed && (currentOrder > stageOrder || status === 'completed');

          return (
            <span
              key={stage}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase tracking-widest transition-all ${
                isActive
                  ? `${sCfg.bg} ${sCfg.border} ${sCfg.color} font-bold`
                  : isPast
                  ? 'bg-green-400/10 border-green-400/20 text-green-400'
                  : 'bg-bg-primary/30 border-white/5 text-text-muted'
              }`}
            >
              <SIcon className="w-2.5 h-2.5" />
              {sCfg.label}
            </span>
          );
        })}
      </div>

      {/* Error + retry */}
      {isFailed && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="font-mono text-[10px] text-red-400">
              ⚠ {error || message || 'Upload pipeline failed'}
            </p>
            {!jobId && (
              <p className="font-mono text-[9px] text-text-muted mt-1">
                File was lost before processing started. Please re-select and upload again.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {jobId && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[10px] font-bold text-bg-primary bg-red-500 hover:bg-red-400 transition-all uppercase"
              >
                <RefreshCw className="w-3 h-3" /> Retry Processing
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[10px] font-bold text-text-muted border border-white/10 hover:border-white/20 hover:text-text-primary transition-all uppercase"
            >
              <X className="w-3 h-3" /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VideosPanel({ triggerToast }) {
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Upload state
  const [uploadState, setUploadState] = useState(null); // null = idle
  // { status, progress, message, error, jobId }

  const evtSourceRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    tag: '',
    aspectRatio: '16/9',
    file: null,
  });

  const [editingVideo, setEditingVideo] = useState({
    _id: '',
    title: '',
    description: '',
    tag: '',
    aspectRatio: '16/9',
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const catsRes = await axios.get('/api/categories');
      if (catsRes.data.success && catsRes.data.categories.length > 0) {
        setCategories(catsRes.data.categories);
        setSelectedCatId(catsRes.data.categories[0]._id);
      }
    } catch (err) {
      console.error('Fetch categories error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!selectedCatId) return;
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`/api/videos/category/${selectedCatId}`);
        if (res.data.success) {
          const sorted = res.data.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
          setVideos(sorted);
        }
      } catch (err) {
        console.error('Fetch videos failed:', err.message);
      }
    };
    fetchVideos();
  }, [selectedCatId]);

  // ── Cleanup SSE on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }
    };
  }, []);

  // ── Connect to job SSE ─────────────────────────────────────────────────────
  const connectJobSSE = useCallback((jobId) => {
    if (evtSourceRef.current) {
      evtSourceRef.current.close();
    }

    const token = localStorage.getItem('admin_token');
    const evtSource = new EventSource(
      `/api/videos/job-status/${encodeURIComponent(jobId)}?token=${encodeURIComponent(token)}`
    );
    evtSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUploadState(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress ?? prev?.progress ?? 0,
          message: data.message || '',
          error: data.error || null,
          jobId,
        }));

        if (data.status === 'completed') {
          evtSource.close();
          evtSourceRef.current = null;
          triggerToast('Video uploaded and optimized successfully!');
          if (data.video) {
            setVideos(prev => [...prev, data.video]);
          }
          // Auto-close modal after success
          setTimeout(() => {
            setModalOpen(false);
            setUploadState(null);
            setNewVideo({ title: '', description: '', tag: '', aspectRatio: '16/9', file: null });
          }, 2000);
        } else if (data.status === 'failed') {
          evtSource.close();
          evtSourceRef.current = null;
        }
      } catch (parseErr) {
        console.error('SSE parse error:', parseErr);
      }
    };

    evtSource.onerror = () => {
      // Don't immediately show error — SSE may reconnect automatically
      console.warn('[SSE] Connection error — browser will attempt reconnect');
    };
  }, [triggerToast]);

  // ── Retry failed job ───────────────────────────────────────────────────────
  const handleRetry = async () => {
    const jobId = uploadState?.jobId;
    if (!jobId) return;

    try {
      const res = await axios.post(`/api/videos/retry-job/${jobId}`);
      if (res.data.success) {
        setUploadState(prev => ({
          ...prev,
          status: 'queued',
          progress: 0,
          message: 'Retrying — job re-queued...',
          error: null,
        }));
        connectJobSSE(jobId);
        triggerToast('Job re-queued for retry');
      } else {
        triggerToast(res.data.message || 'Retry failed');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Retry request failed');
    }
  };

  // ── Close / reset upload ───────────────────────────────────────────────────
  const handleCloseUpload = () => {
    if (evtSourceRef.current) {
      evtSourceRef.current.close();
      evtSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadState(null);
    setNewVideo({ title: '', description: '', tag: '', aspectRatio: '16/9', file: null });
  };

  const isUploading = uploadState && !['completed', 'failed'].includes(uploadState?.status);

  // ── Main upload handler ────────────────────────────────────────────────────
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newVideo.file) return triggerToast('Please select a video file first');
    if (!newVideo.title.trim()) return triggerToast('Please enter a project title');

    const file = newVideo.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);

    // Cancel any ongoing upload loop
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // ── PHASE 1: Init upload session ───────────────────────────────────────
    setUploadState({ status: 'uploading', progress: 0, message: 'Initializing upload...', error: null, jobId: null });

    let uploadId;
    try {
      const initRes = await axios.post('/api/videos/upload-init', {
        filename: file.name,
        totalChunks,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
      }, { signal });
      if (!initRes.data.success) throw new Error(initRes.data.message);
      uploadId = initRes.data.uploadId;
    } catch (err) {
      if (axios.isCancel(err)) return;
      setUploadState({ status: 'failed', progress: 0, message: err.response?.data?.message || err.message, error: err.message, jobId: null });
      return;
    }

    // ── PHASE 2: Send chunks ───────────────────────────────────────────────
    const MAX_CHUNK_RETRIES = 3;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
      const chunk = file.slice(start, end);

      let chunkSuccess = false;
      for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt++) {
        try {
          const fd = new FormData();
          fd.append('chunk', chunk);
          fd.append('uploadId', uploadId);
          fd.append('chunkIndex', i);

          await axios.post('/api/videos/upload-chunk', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal,
            onUploadProgress: (progressEvent) => {
              const chunkLoaded = progressEvent.loaded;
              const totalLoaded = start + chunkLoaded;
              const percent = Math.min(99, Math.round((totalLoaded / file.size) * 100));
              setUploadState(prev => {
                if (signal.aborted) return prev;
                return {
                  ...prev,
                  progress: percent,
                  message: `Uploading... ${percent}% (${(totalLoaded / (1024 * 1024)).toFixed(1)}MB of ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
                };
              });
            }
          });
          chunkSuccess = true;
          break;
        } catch (err) {
          if (axios.isCancel(err)) return;
          if (attempt === MAX_CHUNK_RETRIES) {
            setUploadState({
              status: 'failed',
              progress: 0,
              message: `Chunk ${i + 1}/${totalChunks} failed after ${MAX_CHUNK_RETRIES} attempts`,
              error: err.response?.data?.message || err.message,
              jobId: null,
            });
            return;
          }
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }

      if (!chunkSuccess) return;
    }

    // ── PHASE 3: Finalize assembly ─────────────────────────────────────────
    setUploadState(prev => ({ ...prev, progress: 100, message: 'Assembling file on server...' }));

    let finalizeData;
    try {
      const finalRes = await axios.post('/api/videos/upload-finalize', { uploadId }, { signal });
      if (!finalRes.data.success) throw new Error(finalRes.data.message);
      finalizeData = finalRes.data;
    } catch (err) {
      if (axios.isCancel(err)) return;
      setUploadState({
        status: 'failed',
        progress: 0,
        message: err.response?.data?.message || 'File assembly failed',
        error: err.message,
        jobId: null,
      });
      return;
    }

    // ── PHASE 4: Submit job (returns immediately) ──────────────────────────
    setUploadState({ status: 'queued', progress: 0, message: 'Submitting for processing...', error: null, jobId: null });

    let jobId;
    try {
      const jobRes = await axios.post('/api/videos/process-job', {
        tempId: finalizeData.tempId,
        rawPath: finalizeData.rawPath,
        originalName: finalizeData.originalName,
        sizeMB: finalizeData.sizeMB,
        title: newVideo.title,
        description: newVideo.description || '',
        tag: newVideo.tag || '',
        aspectRatio: newVideo.aspectRatio || '16/9',
        categoryId: selectedCatId,
      }, { signal });
      if (!jobRes.data.success) throw new Error(jobRes.data.message);
      jobId = jobRes.data.jobId;
    } catch (err) {
      if (axios.isCancel(err)) return;
      setUploadState({
        status: 'failed',
        progress: 0,
        message: err.response?.data?.message || 'Failed to submit processing job',
        error: err.message,
        jobId: null,
      });
      return;
    }

    // ── PHASE 5: Connect to SSE for real-time status ───────────────────────
    setUploadState({ status: 'queued', progress: 0, message: 'Job queued — waiting for processor...', error: null, jobId });
    connectJobSSE(jobId);
  };

  // ── Edit handler ───────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/videos/${editingVideo._id}`, editingVideo);
      if (res.data.success) {
        triggerToast('Video details updated');
        setVideos(prev => prev.map(v => v._id === editingVideo._id ? res.data.video : v));
        setEditModalOpen(false);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update video');
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDeleteVideo = async (id) => {
    if (window.confirm('CRITICAL: Delete this video asset permanently from database and Cloudinary?')) {
      try {
        const res = await axios.delete(`/api/videos/${id}`);
        if (res.data.success) {
          setVideos(prev => prev.filter(v => v._id !== id));
          triggerToast('Video deleted successfully');
        }
      } catch (err) {
        triggerToast('Failed to delete video');
      }
    }
  };

  // ── Save order handler ─────────────────────────────────────────────────────
  const handleSaveOrder = async () => {
    const videoIds = videos.map(v => v._id);
    try {
      const res = await axios.post('/api/videos/reorder', { videoIds });
      if (res.data.success) triggerToast('Display order saved successfully');
    } catch (err) {
      triggerToast('Failed to save display order');
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        LOADING PORTFOLIO MEDIA...
      </div>
    );
  }

  const selectedCategoryObj = categories.find(c => c._id === selectedCatId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Indeterminate animation */}
      <style>{`
        @keyframes indeterminate-slide {
          0%   { transform: translateX(-300%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      <div className="flex flex-col gap-10">

        {/* Title block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none">
          <div>
            <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
              Videos Media CMS
            </h2>
            <span className="font-sans text-xs text-text-muted mt-1 block">
              Upload loop previews, change titles, subtags, and drag items to reorder layout.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="bg-bg-secondary border border-white/10 rounded-lg px-4 py-3.5 text-sm font-semibold text-text-primary focus:outline-none transition-colors cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>

            {selectedCatId && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-lg font-mono text-xs font-bold text-bg-primary bg-accent hover:bg-text-primary hover:text-bg-primary transition-all uppercase"
              >
                <Upload className="w-4 h-4" /> Upload Video
              </button>
            )}
          </div>
        </div>

        {/* Video catalog */}
        {selectedCatId && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-bg-secondary/40 border border-white/5 p-4 rounded-xl select-none">
              <span className="font-mono text-xs text-text-muted">
                🎬 Listing <strong className="text-text-primary">{videos.length}</strong> videos under <strong className="text-accent">{selectedCategoryObj?.title}</strong>.
              </span>
              {videos.length > 1 && (
                <button
                  onClick={handleSaveOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded font-mono text-[10px] font-bold text-accent hover:bg-accent/15 transition-all uppercase"
                >
                  <Save className="w-3.5 h-3.5" /> Save Sequence Order
                </button>
              )}
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-20 text-text-muted border border-dashed border-white/10 bg-bg-secondary/20 rounded-xl font-mono text-xs select-none">
                No video assets in this category. Click &ldquo;Upload Video&rdquo; to start.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[9px] text-text-muted/80 tracking-widest uppercase mb-1 flex items-center gap-1.5 select-none">
                  <ArrowUpDown className="w-3 h-3 text-accent" /> Drag and drop cards to reorder display sequence:
                </span>
                <Reorder.Group axis="y" values={videos} onReorder={setVideos} className="flex flex-col gap-3 list-none p-0 m-0">
                  {videos.map((vid) => (
                    <Reorder.Item
                      key={vid._id}
                      value={vid}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-bg-secondary/80 hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-text-muted hover:text-accent p-1">
                          <Menu className="w-4 h-4" />
                        </div>
                        <div className="w-20 aspect-video rounded overflow-hidden bg-bg-primary flex-shrink-0 border border-white/5">
                          {vid.posterUrl ? (
                            <img src={vid.posterUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted/55">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-bold text-text-primary text-sm truncate">{vid.title}</span>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
                            <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-white/5 font-mono">{vid.aspectRatio}</span>
                            <span className="font-mono text-accent">{vid.tag}</span>
                            {vid.optimizedMetadata?.sizeMB > 0 && (
                              <span className="font-mono text-text-muted/60">
                                {vid.optimizedMetadata.sizeMB}MB optimized
                              </span>
                            )}
                            {vid.description && (
                              <span className="hidden md:inline truncate max-w-xs">{vid.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVideo({
                              _id: vid._id,
                              title: vid.title,
                              description: vid.description || '',
                              tag: vid.tag || '',
                              aspectRatio: vid.aspectRatio || '16/9',
                            });
                            setEditModalOpen(true);
                          }}
                          className="text-accent hover:text-text-primary p-2 border border-white/5 hover:border-accent/15 bg-bg-primary/40 rounded transition-colors"
                          title="Edit Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteVideo(vid._id); }}
                          className="text-accent-secondary hover:text-text-primary p-2 border border-white/5 hover:border-accent-secondary/15 bg-bg-primary/40 rounded transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}
          </div>
        )}

        {/* ── Upload Modal ──────────────────────────────────────────────────── */}
        {modalOpen && (
          <div className="modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
            <div className="modal-container w-full max-w-[560px] bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

              <button
                onClick={() => {
                  if (isUploading) {
                    if (window.confirm("Abort the current video upload and processing?")) {
                      handleCloseUpload();
                      setModalOpen(false);
                    }
                  } else {
                    setModalOpen(false);
                    handleCloseUpload();
                  }
                }}
                className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-wider">
                  Upload Video Asset
                </h3>
                <p className="font-mono text-[10px] text-text-muted mt-1">
                  Files up to 500MB — automatic H.264 compression & CDN delivery
                </p>
              </div>

              {/* Upload progress panel — shown when uploading */}
              {uploadState && (
                <UploadProgressPanel
                  uploadState={uploadState}
                  onRetry={handleRetry}
                  onClose={() => { setUploadState(null); setNewVideo({ title: '', description: '', tag: '', aspectRatio: '16/9', file: null }); }}
                />
              )}

              {/* Upload form — shown when not yet uploading */}
              {!uploadState && (
                <form onSubmit={handleUploadSubmit} className="flex flex-col gap-5">

                  <div className="form-group flex flex-col items-start gap-2">
                    <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                      placeholder="e.g. Kurve Chasing Promo"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group flex flex-col items-start gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                        Subtag Label
                      </label>
                      <input
                        type="text"
                        value={newVideo.tag}
                        onChange={(e) => setNewVideo({ ...newVideo, tag: e.target.value })}
                        className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                        placeholder="e.g. Commercial"
                      />
                    </div>
                    <div className="form-group flex flex-col items-start gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                        Aspect Ratio
                      </label>
                      <select
                        value={newVideo.aspectRatio}
                        onChange={(e) => setNewVideo({ ...newVideo, aspectRatio: e.target.value })}
                        className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                        required
                      >
                        <option value="16/9">Horizontal (16/9)</option>
                        <option value="9/16">Vertical (9/16)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group flex flex-col items-start gap-2">
                    <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                      Brief Description
                    </label>
                    <textarea
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      rows="2"
                      className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors resize-none"
                      placeholder="Provide narrative metadata..."
                    />
                  </div>

                  <div className="form-group flex flex-col items-start gap-2 w-full">
                    <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                      Select Video File
                    </label>
                    <div className="w-full relative bg-bg-primary/65 border border-dashed border-white/10 rounded flex flex-col items-center justify-center p-6 text-center hover:border-accent/40 transition-colors">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setNewVideo({ ...newVideo, file: e.target.files[0] })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      <Upload className="w-8 h-8 text-accent/50 mb-3" />
                      <span className="text-xs text-text-primary font-semibold truncate max-w-xs block">
                        {newVideo.file ? newVideo.file.name : 'Drag & drop file or browse'}
                      </span>
                      {newVideo.file ? (
                        <span className="text-[10px] text-accent mt-1 font-mono">
                          {(newVideo.file.size / (1024 * 1024)).toFixed(1)} MB
                          {' · '}
                          {Math.ceil(newVideo.file.size / CHUNK_SIZE_BYTES)} chunks
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted mt-1 font-mono">
                          MP4, MOV, MKV, AVI, WebM · Max 500MB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pipeline info callout */}
                  <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 flex items-start gap-3">
                    <Zap className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                    <div className="font-mono text-[9px] text-text-muted leading-relaxed">
                      <strong className="text-accent">Auto-optimization pipeline:</strong> Your video will be converted to H.264 MP4, optimized for web streaming, and a thumbnail will be generated automatically. This runs in the background — you can close this panel after submission.
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-1">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-3 rounded font-mono text-[10px] font-bold text-text-muted border border-white/10 hover:border-white/20 hover:text-text-primary transition-all uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 rounded font-mono text-[10px] font-bold text-bg-primary bg-accent hover:bg-text-primary hover:text-bg-primary transition-all uppercase"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Start Upload
                    </button>
                  </div>
                </form>
              )}

              {/* After job is queued/processing — close note */}
              {uploadState && !['completed', 'failed'].includes(uploadState?.status) && (
                <p className="font-mono text-[9px] text-text-muted/60 text-center">
                  Processing runs in background. You can safely close this panel and check back later.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Edit Modal ──────────────────────────────────────────────────── */}
        {editModalOpen && (
          <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
            <div className="modal-container w-full max-w-[500px] bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">

              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-6 select-none">
                Edit Video Metadata
              </h3>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={editingVideo.title}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group flex flex-col items-start gap-2">
                    <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                      Subtag Label
                    </label>
                    <input
                      type="text"
                      value={editingVideo.tag}
                      onChange={(e) => setEditingVideo({ ...editingVideo, tag: e.target.value })}
                      className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="form-group flex flex-col items-start gap-2">
                    <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                      Aspect Ratio
                    </label>
                    <select
                      value={editingVideo.aspectRatio}
                      onChange={(e) => setEditingVideo({ ...editingVideo, aspectRatio: e.target.value })}
                      className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                      required
                    >
                      <option value="16/9">Horizontal (16/9)</option>
                      <option value="9/16">Vertical (9/16)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Brief Description
                  </label>
                  <textarea
                    value={editingVideo.description}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                    rows="3"
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-3 rounded font-mono text-[10px] font-bold text-text-muted border border-white/10 hover:border-white/20 hover:text-text-primary transition-all uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 rounded font-mono text-[10px] font-bold text-bg-primary bg-accent hover:bg-text-primary hover:text-bg-primary transition-all uppercase"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

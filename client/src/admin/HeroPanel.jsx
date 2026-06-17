import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function HeroPanel({ triggerToast }) {
  const [formData, setFormData] = useState({
    name: '',
    subtitles: '',
    heroDesc: '',
    heroSubDesc: '',
    heroCtaText: '',
    heroBgVideoUrl: '',
    heroBgPosterUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data.success) {
          const s = res.data.settings;
          setFormData({
            name: s.name || '',
            subtitles: (s.subtitles || []).join(', '),
            heroDesc: s.heroDesc || '',
            heroSubDesc: s.heroSubDesc || '',
            heroCtaText: s.heroCtaText || '',
            heroBgVideoUrl: s.heroBgVideoUrl || '',
            heroBgPosterUrl: s.heroBgPosterUrl || ''
          });
        }
      } catch (err) {
        console.error('Fetch settings in HeroPanel failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Format subtitles string back into array
    const parsedSubtitles = formData.subtitles
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const res = await axios.put('/api/settings/hero', {
        ...formData,
        subtitles: parsedSubtitles
      });

      if (res.data.success) {
        triggerToast('Hero configurations updated successfully');
      } else {
        triggerToast('Failed to update hero configurations');
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Error occurred during save operations');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING HERO CONFIGS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Title */}
      <div className="select-none">
        <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
          Hero Presentation Config
        </h2>
        <span className="font-sans text-xs text-text-muted mt-1 block">
          Modify top entry section texts, taglines, CTA buttons, and background loops.
        </span>
      </div>

      {/* Settings Forms Card */}
      <div className="bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group flex flex-col items-start gap-2">
              <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                Hero Name Title
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                required
                disabled={saving}
              />
            </div>
            
            <div className="form-group flex flex-col items-start gap-2">
              <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                Subtitles list (Comma-separated)
              </label>
              <input 
                type="text" 
                name="subtitles"
                value={formData.subtitles}
                onChange={handleChange}
                className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                placeholder="e.g. VIDEO EDITOR, CONTENT CREATOR"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group flex flex-col items-start gap-2">
            <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
              Primary Headline / Description Tagline
            </label>
            <input 
              type="text" 
              name="heroDesc"
              value={formData.heroDesc}
              onChange={handleChange}
              className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group flex flex-col items-start gap-2">
            <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
              Secondary Description Paragraph
            </label>
            <textarea 
              name="heroSubDesc"
              value={formData.heroSubDesc}
              onChange={handleChange}
              rows="3"
              className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors resize-none"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group flex flex-col items-start gap-2 md:col-span-1">
              <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                CTA Button Caption
              </label>
              <input 
                type="text" 
                name="heroCtaText"
                value={formData.heroCtaText}
                onChange={handleChange}
                className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                required
                disabled={saving}
              />
            </div>
            
            <div className="form-group flex flex-col items-start gap-2 md:col-span-2">
              <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                Background Loop Stream Link (Video URL)
              </label>
              <input 
                type="url" 
                name="heroBgVideoUrl"
                value={formData.heroBgVideoUrl}
                onChange={handleChange}
                className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group flex flex-col items-start gap-2">
            <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
              Video Poster Backup Image (URL) - Optional
            </label>
            <input 
              type="text" 
              name="heroBgPosterUrl"
              value={formData.heroBgPosterUrl}
              onChange={handleChange}
              className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
              placeholder="e.g. https://res.cloudinary.com/..."
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded font-mono text-[11px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary transition-all duration-300 disabled:opacity-50"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING CHANGES...' : 'SAVE CONFIGURATIONS'}
          </button>
        </form>
      </div>

    </div>
  );
}

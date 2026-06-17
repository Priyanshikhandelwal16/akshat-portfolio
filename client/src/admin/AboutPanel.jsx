import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AboutPanel({ triggerToast }) {
  // Config state
  const [bioData, setBioData] = useState({
    bioText: '',
    bioHighlight: '',
    portraitUrl: ''
  });
  const [stats, setStats] = useState([]);
  
  // Skills state
  const [skills, setSkills] = useState([]);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState({ _id: '', name: '', iconType: 'video', order: 0 });

  const [loading, setLoading] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);

  const fetchAboutData = async () => {
    try {
      const [settingsRes, skillsRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('/api/skills')
      ]);

      if (settingsRes.data.success) {
        const s = settingsRes.data.settings;
        setBioData({
          bioText: s.bioText || '',
          bioHighlight: s.bioHighlight || '',
          portraitUrl: s.portraitUrl || ''
        });
        setStats(s.stats || []);
      }

      if (skillsRes.data.success) {
        setSkills(skillsRes.data.skills);
      }
    } catch (err) {
      console.error('Fetch about data error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const handleBioChange = (e) => {
    setBioData({ ...bioData, [e.target.name]: e.target.value });
  };

  const handleStatChange = (index, field, value) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: field === 'number' ? Number(value) : value };
    setStats(updated);
  };

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setSavingBio(true);

    try {
      const res = await axios.put('/api/settings/about', {
        ...bioData,
        stats
      });

      if (res.data.success) {
        triggerToast('Profile bio and stats updated successfully');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Error occurred while saving profile settings');
    } finally {
      setSavingBio(false);
    }
  };

  // --- Skill Registry Actions ---
  const handleOpenSkillModal = (skill = null) => {
    if (skill) {
      setActiveSkill({
        _id: skill._id,
        name: skill.name,
        iconType: skill.iconType,
        order: skill.order || 0
      });
    } else {
      setActiveSkill({ _id: '', name: '', iconType: 'video', order: skills.length });
    }
    setSkillModalOpen(true);
  };

  const handleCloseSkillModal = () => {
    setSkillModalOpen(false);
    setActiveSkill({ _id: '', name: '', iconType: 'video', order: 0 });
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    setSavingSkill(true);

    try {
      if (activeSkill._id) {
        // Edit mode
        const res = await axios.put(`/api/skills/${activeSkill._id}`, activeSkill);
        if (res.data.success) {
          triggerToast('Skill updated successfully');
          setSkills(prev => prev.map(s => s._id === activeSkill._id ? res.data.skill : s));
        }
      } else {
        // Add mode
        const res = await axios.post('/api/skills', activeSkill);
        if (res.data.success) {
          triggerToast('Skill added successfully');
          setSkills(prev => [...prev, res.data.skill].sort((a,b) => a.order - b.order));
        }
      }
      handleCloseSkillModal();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update skill record');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (window.confirm('Delete this skill from arsenal?')) {
      try {
        const res = await axios.delete(`/api/skills/${id}`);
        if (res.data.success) {
          setSkills(prev => prev.filter(s => s._id !== id));
          triggerToast('Skill record deleted');
        }
      } catch (err) {
        triggerToast('Failed to delete skill record');
      }
    }
  };

  const skillIconLabels = {
    'after-effects': 'Adobe After Effects',
    'premiere-pro': 'Adobe Premiere Pro',
    'capcut': 'CapCut PC',
    'video': 'Camcorder / Video',
    'typography': 'Typography / Fonts',
    'wedding': 'Wedding Rings',
    'brand': 'Clapperboard / Movie',
    'commercial': 'Commercial Tag',
    'trending': 'Trending Flame',
    'motion': 'Motion Box Graphics'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING PROFILE DETAILS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Title */}
      <div className="select-none">
        <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
          Biography & Skills CMS
        </h2>
        <span className="font-sans text-xs text-text-muted mt-1 block">
          Manage your personal portrait image, biography narratives, counter numbers, and float skill cards.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Biography Form + Stats Strip Form (Left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <div className="bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-lg">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/5 select-none">
              Biography details
            </h3>
            
            <form onSubmit={handleSaveAbout} className="flex flex-col gap-6">
              
              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Portrait Picture Path (Local path or Cloudinary URL)
                </label>
                <input 
                  type="text" 
                  name="portraitUrl"
                  value={bioData.portraitUrl}
                  onChange={handleBioChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                  placeholder="e.g. /assets/akshat-image.jpeg"
                  disabled={savingBio}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Main About Biography Content
                </label>
                <textarea 
                  name="bioText"
                  value={bioData.bioText}
                  onChange={handleBioChange}
                  rows="4"
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors resize-none"
                  required
                  disabled={savingBio}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Highlights Pitch Phrase (Appears in Gold at the end of bio)
                </label>
                <input 
                  type="text" 
                  name="bioHighlight"
                  value={bioData.bioHighlight}
                  onChange={handleBioChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                  required
                  disabled={savingBio}
                />
              </div>

              {/* Stats Bar Form layout */}
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider mt-4 select-none">
                Stats Counter strip
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div key={stat.id || idx} className="border border-white/5 bg-bg-primary/40 rounded p-4 flex flex-col gap-3">
                    <span className="font-mono text-[8px] text-accent font-bold uppercase tracking-widest block">
                      COUNTER {idx + 1}
                    </span>
                    
                    <div className="flex flex-col gap-1 text-[10px]">
                      <label className="text-text-muted">Target Number</label>
                      <input 
                        type="number" 
                        step="any"
                        value={stat.number}
                        onChange={(e) => handleStatChange(idx, 'number', e.target.value)}
                        className="bg-bg-primary border border-white/10 focus:border-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none"
                        required
                        disabled={savingBio}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 text-[10px]">
                      <label className="text-text-muted">Suffix (e.g. +, M+)</label>
                      <input 
                        type="text" 
                        value={stat.suffix || ''}
                        onChange={(e) => handleStatChange(idx, 'suffix', e.target.value)}
                        className="bg-bg-primary border border-white/10 focus:border-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none"
                        disabled={savingBio}
                      />
                    </div>

                    <div className="flex flex-col gap-1 text-[10px]">
                      <label className="text-text-muted">Label Descriptor</label>
                      <input 
                        type="text" 
                        value={stat.label}
                        onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                        className="bg-bg-primary border border-white/10 focus:border-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none"
                        required
                        disabled={savingBio}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded font-mono text-[11px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary transition-all duration-300 disabled:opacity-50"
                disabled={savingBio}
              >
                <Save className="w-4 h-4" />
                {savingBio ? 'SAVING PROFILE...' : 'SAVE BIO & STATS'}
              </button>

            </form>
          </div>

        </div>

        {/* Skills list Registry Panel (Right 1 col) */}
        <div className="bg-bg-secondary border border-white/5 rounded-xl p-6 shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center select-none">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Skills Arsenal
            </h3>
            <button 
              onClick={() => handleOpenSkillModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded font-mono text-[10px] font-bold text-accent border border-accent/20 hover:bg-accent/5 transition-all uppercase"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[650px] overflow-y-auto pr-2">
            {skills.length === 0 ? (
              <span className="text-center text-text-muted text-xs py-8 font-mono">
                No skill cards listing.
              </span>
            ) : (
              skills.map((s) => (
                <div 
                  key={s._id}
                  className="flex justify-between items-center p-3 rounded-lg border border-white/[0.04] bg-bg-primary/40 text-xs"
                >
                  <div className="flex flex-col gap-1 items-start">
                    <span className="font-semibold text-text-primary">{s.name}</span>
                    <span className="text-[9px] text-text-muted/80 tracking-wider font-mono">
                      {skillIconLabels[s.iconType] || s.iconType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleOpenSkillModal(s)}
                      className="text-accent hover:text-text-primary p-1 transition-colors"
                      title="Edit Skill"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-accent-secondary hover:text-text-primary p-1 transition-colors"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Skills add/edit Modal Dialog */}
      {skillModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="modal-container w-full max-w-[480px] bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
            
            <button 
              onClick={handleCloseSkillModal}
              className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-6 select-none">
              {activeSkill._id ? 'Edit Skill Card' : 'Add Skill Card'}
            </h3>

            <form onSubmit={handleSkillSubmit} className="flex flex-col gap-5">
              
              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Skill Name
                </label>
                <input 
                  type="text" 
                  value={activeSkill.name}
                  onChange={(e) => setActiveSkill({ ...activeSkill, name: e.target.value })}
                  className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  placeholder="e.g. Adobe After Effects"
                  required
                  disabled={savingSkill}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Vector Icon Styling
                </label>
                <select 
                  value={activeSkill.iconType}
                  onChange={(e) => setActiveSkill({ ...activeSkill, iconType: e.target.value })}
                  className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors select-none"
                  required
                  disabled={savingSkill}
                >
                  {Object.entries(skillIconLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Layout Display Index Order
                </label>
                <input 
                  type="number" 
                  value={activeSkill.order}
                  onChange={(e) => setActiveSkill({ ...activeSkill, order: Number(e.target.value) })}
                  className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  required
                  disabled={savingSkill}
                />
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={handleCloseSkillModal}
                  className="px-5 py-3 rounded font-mono text-[10px] font-bold text-text-muted border border-white/10 hover:border-white/20 hover:text-text-primary transition-all uppercase"
                  disabled={savingSkill}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded font-mono text-[10px] font-bold text-bg-primary bg-accent hover:bg-text-primary hover:text-bg-primary transition-all uppercase"
                  disabled={savingSkill}
                >
                  {savingSkill ? 'SAVING...' : 'SAVE SKILL'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

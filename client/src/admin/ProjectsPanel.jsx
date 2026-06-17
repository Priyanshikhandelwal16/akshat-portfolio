import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';

export default function ProjectsPanel({ triggerToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeCategory, setActiveCategory] = useState({
    _id: '',
    title: '',
    key: '',
    description: '',
    coverUrl: '',
    vertical: false,
    order: 0
  });

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setActiveCategory({
        _id: cat._id,
        title: cat.title,
        key: cat.key,
        description: cat.description || '',
        coverUrl: cat.coverUrl || '',
        vertical: !!cat.vertical,
        order: cat.order || 0
      });
    } else {
      setActiveCategory({
        _id: '',
        title: '',
        key: '',
        description: '',
        coverUrl: '',
        vertical: false,
        order: categories.length
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveCategory({ _id: '', title: '', key: '', description: '', coverUrl: '', vertical: false, order: 0 });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActiveCategory({
      ...activeCategory,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (activeCategory._id) {
        // Edit mode
        const res = await axios.put(`/api/categories/${activeCategory._id}`, activeCategory);
        if (res.data.success) {
          triggerToast('Category updated successfully');
          setCategories(prev => prev.map(c => c._id === activeCategory._id ? res.data.category : c).sort((a,b) => a.order - b.order));
        }
      } else {
        // Add mode
        const res = await axios.post('/api/categories', activeCategory);
        if (res.data.success) {
          triggerToast('Category created successfully');
          setCategories(prev => [...prev, res.data.category].sort((a,b) => a.order - b.order));
        }
      }
      handleCloseModal();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const warningText = `CRITICAL WARNING: This will permanently delete the category "${cat.title}" AND erase ALL associated videos from both your MongoDB database and Cloudinary storage!\n\nAre you sure you want to continue?`;
    
    if (window.confirm(warningText)) {
      try {
        const res = await axios.delete(`/api/categories/${cat._id}`);
        if (res.data.success) {
          setCategories(prev => prev.filter(c => c._id !== cat._id));
          triggerToast('Category and videos cleaned up successfully');
        }
      } catch (err) {
        triggerToast('Failed to delete category');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING CATEGORIES TREES...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Title header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
            Portfolio Categories
          </h2>
          <span className="font-sans text-xs text-text-muted mt-1 block">
            Organize video showreels into custom collections (e.g. Commercials, Weddings, UGC).
          </span>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-3.5 rounded-lg font-mono text-xs font-bold text-accent border border-accent/25 hover:bg-accent/5 hover:border-accent transition-all uppercase"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      {/* Categories table grid listing */}
      <div className="bg-bg-secondary border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] font-mono text-[9px] text-text-muted font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Category Title</th>
                <th className="px-6 py-4">Slug Key</th>
                <th className="px-6 py-4">Descriptor Tag</th>
                <th className="px-6 py-4">Aspect Layout</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-text-muted font-mono text-xs select-none">
                    No categories created yet. Click "Create Category".
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-text-muted">
                      {cat.order}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {cat.title}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-accent whitespace-nowrap">
                      {cat.key}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {cat.description || '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        cat.vertical 
                          ? 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20' 
                          : 'bg-accent/10 text-accent border border-accent/20'
                      }`}>
                        {cat.vertical ? 'Vertical (9/16)' : 'Horizontal (16/9)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-4 font-mono text-xs">
                        <button 
                          onClick={() => handleOpenModal(cat)}
                          className="flex items-center gap-1 text-accent hover:underline font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(cat)}
                          className="flex items-center gap-1 text-accent-secondary hover:underline font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Category Modal dialog */}
      {modalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="modal-container w-full max-w-[540px] bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative">
            
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-6 select-none">
              {activeCategory._id ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Category Title
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    value={activeCategory.title}
                    onChange={handleInputChange}
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    placeholder="e.g. Brand Commercials"
                    required
                    disabled={saving}
                  />
                </div>
                
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Unique Slug Key Slug
                  </label>
                  <input 
                    type="text" 
                    name="key"
                    value={activeCategory.key}
                    onChange={handleInputChange}
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    placeholder="e.g. brand-commercials"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Headline Descriptor (e.g. 02 / CAMPAIGNS)
                  </label>
                  <input 
                    type="text" 
                    name="description"
                    value={activeCategory.description}
                    onChange={handleInputChange}
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    placeholder="e.g. 02 / CAMPAIGNS"
                    disabled={saving}
                  />
                </div>
                
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Display Index Order
                  </label>
                  <input 
                    type="number" 
                    name="order"
                    value={activeCategory.order}
                    onChange={handleInputChange}
                    className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Cover Image URL (Optional)
                </label>
                <input 
                  type="text" 
                  name="coverUrl"
                  value={activeCategory.coverUrl}
                  onChange={handleInputChange}
                  className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  placeholder="https://res.cloudinary.com/..."
                  disabled={saving}
                />
              </div>

              <div className="form-group flex items-center gap-3 py-2 select-none">
                <input 
                  type="checkbox" 
                  id="vertical"
                  name="vertical"
                  checked={activeCategory.vertical}
                  onChange={handleInputChange}
                  className="w-4 h-4 bg-bg-primary border border-white/10 text-accent rounded focus:ring-0 focus:outline-none"
                  disabled={saving}
                />
                <label htmlFor="vertical" className="font-mono text-[10px] tracking-widest text-text-muted uppercase font-bold cursor-pointer">
                  Force Vertical Aspect Ratio Cards (9/16 layout style)
                </label>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded font-mono text-[10px] font-bold text-text-muted border border-white/10 hover:border-white/20 hover:text-text-primary transition-all uppercase"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded font-mono text-[10px] font-bold text-bg-primary bg-accent hover:bg-text-primary hover:text-bg-primary transition-all uppercase"
                  disabled={saving}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'SAVING...' : 'SAVE CATEGORY'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

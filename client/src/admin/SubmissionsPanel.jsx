import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Reply } from 'lucide-react';

export default function SubmissionsPanel({ triggerToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get('/api/submissions');
      if (res.data.success) {
        setSubmissions(res.data.submissions);
      }
    } catch (err) {
      console.error('Fetch submissions error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this submission permanently?')) {
      try {
        const res = await axios.delete(`/api/submissions/${id}`);
        if (res.data.success) {
          setSubmissions(prev => prev.filter(s => s._id !== id));
          triggerToast('Submission deleted successfully');
        }
      } catch (err) {
        triggerToast('Failed to delete submission');
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('CRITICAL: Purge ALL inquiries logs from database? This cannot be undone.')) {
      try {
        const res = await axios.delete('/api/submissions');
        if (res.data.success) {
          setSubmissions([]);
          triggerToast('Submissions folder purged successfully');
        }
      } catch (err) {
        triggerToast('Failed to clear submissions');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING INQUIRY MESSAGES...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Title block */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
            Inquiry Submissions
          </h2>
          <span className="font-sans text-xs text-text-muted mt-1 block">
            Messages transmitted by visitors on the contact form.
          </span>
        </div>
        
        {submissions.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-5 py-3 rounded-lg font-mono text-xs font-bold text-accent-secondary bg-accent-secondary/5 border border-accent-secondary/15 hover:bg-accent-secondary/10 transition-all uppercase"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {/* Main submissions board list */}
      <div className="bg-bg-secondary border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] font-mono text-[9px] text-text-muted font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Received On</th>
                <th className="px-6 py-4">Sender Info</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Inquiry details</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted font-mono text-xs select-none">
                    No inquiry submissions registered.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 text-accent">
                      <a href={`mailto:${sub.email}`} className="hover:underline">
                        {sub.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 max-w-[350px] whitespace-pre-wrap text-text-muted text-xs leading-relaxed">
                      {sub.message}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-3 font-mono text-xs">
                        <a 
                          href={`mailto:${sub.email}`}
                          className="flex items-center gap-1 text-accent hover:underline font-semibold"
                        >
                          <Reply className="w-3.5 h-3.5" /> Reply
                        </a>
                        <button 
                          onClick={() => handleDelete(sub._id)}
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

    </div>
  );
}

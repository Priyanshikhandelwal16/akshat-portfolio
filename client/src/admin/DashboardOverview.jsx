import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Film, User, Hash, ArrowRight } from 'lucide-react';

export default function DashboardOverview({ onSwitchTab, triggerToast }) {
  const [stats, setStats] = useState({ submissions: 0, videos: 0, skills: 0, categories: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [subsRes, videosRes, skillsRes, catsRes] = await Promise.all([
          axios.get('/api/submissions'),
          axios.get('/api/videos'),
          axios.get('/api/skills'),
          axios.get('/api/categories')
        ]);

        setStats({
          submissions: subsRes.data.success ? subsRes.data.submissions.length : 0,
          videos: videosRes.data.success ? videosRes.data.videos.length : 0,
          skills: skillsRes.data.success ? skillsRes.data.skills.length : 0,
          categories: catsRes.data.success ? catsRes.data.categories.length : 0
        });

        if (subsRes.data.success) {
          setRecentSubmissions(subsRes.data.submissions.slice(0, 3));
        }
      } catch (err) {
        console.error('Fetch stats failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDeleteSubmission = async (id) => {
    if (window.confirm('Delete this submission inquiry from database?')) {
      try {
        const res = await axios.delete(`/api/submissions/${id}`);
        if (res.data.success) {
          setRecentSubmissions(prev => prev.filter(s => s._id !== id));
          setStats(prev => ({ ...prev, submissions: Math.max(0, prev.submissions - 1) }));
          triggerToast('Submission deleted successfully');
        }
      } catch (err) {
        triggerToast('Failed to delete submission');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING ANALYTIC STATS...
      </div>
    );
  }

  const statCards = [
    { label: 'Inquiries Logged', count: stats.submissions, icon: Mail, color: 'before:bg-accent' },
    { label: 'Videos Showcased', count: stats.videos, icon: Film, color: 'before:bg-accent-secondary' },
    { label: 'Skills Listed', count: stats.skills, icon: User, color: 'before:bg-accent' },
    { label: 'Category Blocks', count: stats.categories, icon: Hash, color: 'before:bg-accent-secondary' },
  ];

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Title */}
      <div className="flex justify-between items-center select-none">
        <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
          Analytics Overview
        </h2>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div 
              key={idx}
              className={`relative overflow-hidden bg-bg-secondary border border-white/5 rounded-xl p-6 flex flex-col items-start select-none before:content-[""] before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] ${c.color}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center text-text-muted mb-4">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-mono text-3xl font-bold text-text-primary block mb-2">
                {c.count}
              </span>
              <span className="font-mono text-[9px] tracking-wider uppercase text-text-muted font-semibold">
                {c.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent submissions table */}
      <div className="bg-bg-secondary border border-white/5 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center select-none">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
            Recent Contact Submissions
          </h3>
          <button 
            onClick={() => onSwitchTab('submissions')}
            className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent hover:text-text-primary transition-colors uppercase"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] font-mono text-[9px] text-text-muted font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Message Summary</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-muted font-mono text-xs">
                    No contact submissions logged in database.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => (
                  <tr key={sub._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 text-accent">
                      <a href={`mailto:${sub.email}`} className="hover:underline">
                        {sub.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 max-w-[250px] truncate text-text-muted">
                      {sub.message}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-4 font-mono text-xs">
                        <a 
                          href={`mailto:${sub.email}`} 
                          className="text-accent hover:underline font-semibold"
                        >
                          Reply
                        </a>
                        <button 
                          onClick={() => handleDeleteSubmission(sub._id)}
                          className="text-accent-secondary hover:underline font-semibold"
                        >
                          Delete
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

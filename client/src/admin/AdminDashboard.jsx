import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  LayoutDashboard, 
  Mail, 
  Home, 
  User, 
  FolderGit, 
  Film, 
  Settings, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';

// Panels
import DashboardOverview from './DashboardOverview';
import SubmissionsPanel from './SubmissionsPanel';
import HeroPanel from './HeroPanel';
import AboutPanel from './AboutPanel';
import ProjectsPanel from './ProjectsPanel';
import VideosPanel from './VideosPanel';
import ContactPanel from './ContactPanel';

export default function AdminDashboard() {
  const { logout, user } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Forcefully clean up any custom cursor and layout styles on admin mount
    document.body.classList.remove('custom-cursor-active');
    document.body.classList.remove('hovering-button');
    document.body.classList.remove('hovering-video');
    document.body.classList.remove('lock-scroll');
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onSwitchTab={setActiveTab} triggerToast={triggerToast} />;
      case 'submissions':
        return <SubmissionsPanel triggerToast={triggerToast} />;
      case 'hero':
        return <HeroPanel triggerToast={triggerToast} />;
      case 'about':
        return <AboutPanel triggerToast={triggerToast} />;
      case 'categories':
        return <ProjectsPanel triggerToast={triggerToast} />;
      case 'videos':
        return <VideosPanel triggerToast={triggerToast} />;
      case 'settings':
        return <ContactPanel triggerToast={triggerToast} />;
      default:
        return <DashboardOverview onSwitchTab={setActiveTab} triggerToast={triggerToast} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submissions', label: 'Submissions', icon: Mail },
    { id: 'hero', label: 'Hero Content', icon: Home },
    { id: 'about', label: 'About & Skills', icon: User },
    { id: 'categories', label: 'Categories', icon: FolderGit },
    { id: 'videos', label: 'Videos CMS', icon: Film },
    { id: 'settings', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary overflow-x-hidden font-sans">
      
      {/* CMS Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-[2000] px-6 py-4 bg-bg-secondary border border-accent rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-mono text-xs text-accent animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 1. Sidebar Nav */}
      <aside className="w-[260px] bg-bg-secondary border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
        <div className="p-8 border-b border-white/5 flex flex-col gap-1">
          <div className="logo text-lg font-mono font-bold tracking-[2px] text-text-primary">
            AJ<span className="text-accent">.</span> CONTROL
          </div>
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
            ADMIN: {user?.username || 'ROOT'}
          </span>
        </div>
        
        <nav className="flex-grow p-4 py-6">
          <ul className="flex flex-col gap-1 list-none p-0 m-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm font-semibold transition-all hover:bg-white/[0.04] hover:text-text-primary ${
                      activeTab === item.id 
                        ? 'bg-accent/10 text-accent border-l-4 border-accent rounded-l-none pl-3' 
                        : 'text-text-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/5 flex flex-col gap-3">
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between text-xs font-semibold text-text-muted hover:text-accent transition-colors"
          >
            <span>View Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold text-accent-secondary bg-accent-secondary/5 border border-accent-secondary/15 hover:bg-accent-secondary/10 transition-all text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            LOCK & EXIT
          </button>
        </div>
      </aside>

      {/* 2. Main Content pane */}
      <main className="flex-grow ml-[260px] p-8 md:p-12 min-h-screen bg-bg-primary overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          {renderActivePanel()}
        </div>
      </main>
    </div>
  );
}

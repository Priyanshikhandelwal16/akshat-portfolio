import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Forcefully clean up any custom cursor and layout styles on admin mount
    document.body.classList.remove('custom-cursor-active');
    document.body.classList.remove('hovering-button');
    document.body.classList.remove('hovering-video');
    document.body.classList.remove('lock-scroll');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message || 'Incorrect credentials');
      }
    } catch (err) {
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-bg-darker flex items-center justify-center p-6 relative">
      {/* Cinematic Film Overlay */}
      <div className="noise-overlay absolute inset-0 z-0 pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-bg-secondary border border-white/5 hover:border-accent/15 rounded-xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mb-4 text-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-mono text-xl md:text-2xl font-bold tracking-widest uppercase">
            AJ<span className="text-accent">.</span> CONTROL
          </h1>
          <span className="font-sans text-[10px] text-text-muted tracking-widest uppercase mt-2">
            Secure Entry Portal
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-4 rounded bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary font-mono text-xs text-center">
              ⚠ {error}
            </div>
          )}

          <div className="form-group flex flex-col items-start gap-2">
            <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
              USERNAME
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
              placeholder="e.g. admin"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group flex flex-col items-start gap-2 relative">
            <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
              PASSWORD
            </label>
            <div className="w-full relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-primary/80 border border-white/10 focus:border-accent hover:border-white/20 rounded pl-4 pr-12 py-3.5 text-sm text-text-primary focus:outline-none transition-colors"
                placeholder="Enter password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded font-mono text-[11px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary hover:text-bg-primary transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-2"
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
      </div>
    </div>
  );
}

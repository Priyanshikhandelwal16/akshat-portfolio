import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';
import { Save, Lock } from 'lucide-react';

export default function ContactPanel({ triggerToast }) {
  const { updatePassword } = useAdmin();
  
  // Form states
  const [socialsData, setSocialsData] = useState({
    email: '',
    phone: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    whatsapp: '',
    contactCta: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [savingSocials, setSavingSocials] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data.success) {
          const s = res.data.settings;
          const soc = s.socials || {};
          const ejs = s.emailjs || {};
          
          setSocialsData({
            email: soc.email || '',
            phone: soc.phone || '',
            instagram: soc.instagram || '',
            linkedin: soc.linkedin || '',
            facebook: soc.facebook || '',
            whatsapp: soc.whatsapp || '',
            contactCta: soc.contactCta || ''
          });
        }
      } catch (err) {
        console.error('Fetch settings in ContactPanel failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSocialsChange = (e) => {
    setSocialsData({ ...socialsData, [e.target.name]: e.target.value });
  };

  const handleSocialsSubmit = async (e) => {
    e.preventDefault();
    setSavingSocials(true);
    try {
      const res = await axios.put('/api/settings/contact', socialsData);
      if (res.data.success) {
        triggerToast('Contact configurations updated successfully');
      } else {
        triggerToast('Failed to update contact configurations');
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Error occurred during save operations');
    } finally {
      setSavingSocials(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      return triggerToast('Password must be at least 6 characters long');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return triggerToast('Passwords do not match');
    }

    setSavingPassword(true);
    try {
      const res = await updatePassword(passwordData.newPassword);
      if (res.success) {
        triggerToast('Administrative password updated successfully');
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        triggerToast(res.message || 'Failed to update administrative password');
      }
    } catch (err) {
      triggerToast('Error during password update');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono text-accent text-xs">
        RETRIEVING COMMUNICATIONS CONFIGS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Title */}
      <div className="select-none">
        <h2 className="font-mono text-2xl md:text-3xl font-extrabold uppercase">
          Configuration & Security
        </h2>
        <span className="font-sans text-xs text-text-muted mt-1 block">
          Update contact targets, direct social profiles, email notifications keys, and control passwords.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Contacts & Social Links form card */}
        <div className="bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-lg flex flex-col gap-6">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider pb-2 border-b border-white/5 select-none">
            Social coordinates
          </h3>

          <form onSubmit={handleSocialsSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Direct Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={socialsData.email}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  required
                  disabled={savingSocials}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Phone Number
                </label>
                <input 
                  type="text" 
                  name="phone"
                  value={socialsData.phone}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  disabled={savingSocials}
                />
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Instagram Link
                </label>
                <input 
                  type="url" 
                  name="instagram"
                  value={socialsData.instagram}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  disabled={savingSocials}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  LinkedIn Link
                </label>
                <input 
                  type="url" 
                  name="linkedin"
                  value={socialsData.linkedin}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  disabled={savingSocials}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  Facebook Link
                </label>
                <input 
                  type="url" 
                  name="facebook"
                  value={socialsData.facebook || ''}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  disabled={savingSocials}
                />
              </div>

              <div className="form-group flex flex-col items-start gap-2">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                  WhatsApp Link (URL format)
                </label>
                <input 
                  type="text" 
                  name="whatsapp"
                  value={socialsData.whatsapp}
                  onChange={handleSocialsChange}
                  className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                  placeholder="e.g. https://wa.me/..."
                  disabled={savingSocials}
                />
              </div>
            </div>

            <div className="form-group flex flex-col items-start gap-2">
              <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                Contact Submit CTA Caption
              </label>
              <input 
                type="text" 
                name="contactCta"
                value={socialsData.contactCta}
                onChange={handleSocialsChange}
                className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                required
                disabled={savingSocials}
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-4 mt-2 rounded font-mono text-[10px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary transition-all duration-300 disabled:opacity-50"
              disabled={savingSocials}
            >
              <Save className="w-4 h-4" />
              {savingSocials ? 'SAVING SOCIALS...' : 'SAVE CONTACT SETTINGS'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-8">
          
          {/* Resend email notifications status card */}
          <div className="bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-lg flex flex-col gap-6 select-none">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider pb-2 border-b border-white/5 text-accent">
              Email Routing Service
            </h3>
            <div className="flex flex-col gap-4">
              <p className="font-sans text-xs text-text-primary leading-relaxed">
                Contact form notifications are processed and sent securely via <strong className="text-accent">Resend</strong> on the backend.
              </p>
              <div className="bg-bg-primary/40 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-text-muted leading-relaxed">
                <span className="text-text-primary font-bold uppercase block mb-1">Status check:</span>
                - Mailing Provider: Resend SDK<br />
                - Routing Target: creatorakshat7@gmail.com<br />
                - API Key Storage: Process Environment Variables<br />
                - Spam Filter: Honeypot trap enabled<br />
                - Rate Limiting: 5 submissions / 15 mins
              </div>
              <p className="font-sans text-[10px] text-text-muted leading-relaxed">
                Note: The mailing API key is stored securely in your server's <code className="text-accent font-mono font-bold bg-bg-primary/45 px-1 py-0.5 rounded">.env</code> file. Do not share or expose this key on the client side.
              </p>
            </div>
          </div>

          {/* Admin security pass update */}
          <div className="bg-bg-secondary border border-white/5 rounded-xl p-8 shadow-lg flex flex-col gap-6">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider pb-2 border-b border-white/5 select-none">
              Administrative Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    placeholder="Min 6 characters"
                    required
                    disabled={savingPassword}
                  />
                </div>

                <div className="form-group flex flex-col items-start gap-2">
                  <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    Confirm Password
                  </label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors"
                    placeholder="Repeat password"
                    required
                    disabled={savingPassword}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-4 rounded font-mono text-[10px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary transition-all duration-300 disabled:opacity-50"
                disabled={savingPassword}
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? 'UPDATING KEY...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}

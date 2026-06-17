import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import PhoneInput, { isValidPhoneNumber, getCountries, getCountryCallingCode } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { parsePhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
// NOTE: We deliberately do NOT import 'react-phone-number-input/style.css'
// All PhoneInput styling is handled custom in index.css + DarkCountrySelect below

// ---------------------------------------------------------------------------
// Custom dark-theme country selector — replaces the native white <select>
// ---------------------------------------------------------------------------
function DarkCountrySelect({ value, onChange, options, iconComponent: FlagIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const filtered = options.filter((opt) => {
    if (!opt.value) return false; // skip the blank "any country" entry
    const label = en[opt.value] || opt.label || opt.value;
    return label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase());
  });

  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected?.value ? (en[selected.value] || selected.label || selected.value) : 'Select';

  return (
    <div ref={containerRef} className="dark-country-select-root">
      {/* Trigger button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="dark-country-trigger"
      >
        {selected?.value && FlagIcon
          ? <FlagIcon country={selected.value} label={selectedLabel} />
          : <span className="dark-country-flag-placeholder" />
        }
        <svg
          className={`dark-country-arrow ${isOpen ? 'dark-country-arrow--open' : ''}`}
          viewBox="0 0 10 6" fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="dark-country-dropdown" role="listbox">
          {/* Search */}
          <div className="dark-country-search-wrapper">
            <svg className="dark-country-search-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dark-country-search"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Country list */}
          <ul ref={listRef} className="dark-country-list">
            {filtered.length === 0 && (
              <li className="dark-country-empty">No results for &quot;{search}&quot;</li>
            )}
            {filtered.map((opt) => {
              const label = en[opt.value] || opt.label || opt.value;
              const code = opt.value ? `+${getCountryCallingCode(opt.value)}` : '';
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`dark-country-option ${isSelected ? 'dark-country-option--active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="dark-country-option-flag">
                    {FlagIcon && <FlagIcon country={opt.value} label={label} />}
                  </span>
                  <span className="dark-country-option-name">{label}</span>
                  <span className="dark-country-option-code">{code}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Contact({ settings }) {
  const sectionRef = useRef(null);
  const glowRef = useRef(null);
  const cardRef = useRef(null);
  const leftPanelRef = useRef(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Fade reveal animations
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo(leftPanelRef.current ? leftPanelRef.current.children : [],
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: leftPanelRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Glow bg coordinate reactive tracking
    let bounds = null;

    const handleMouseEnter = () => {
      if (sectionRef.current) {
        bounds = sectionRef.current.getBoundingClientRect();
      }
    };

    const handleMouseMove = (e) => {
      if (!glowRef.current) return;
      if (!bounds && sectionRef.current) {
        bounds = sectionRef.current.getBoundingClientRect();
      }
      if (!bounds) return;
      const x = e.clientX - bounds.left - bounds.width / 2;
      const y = e.clientY - bounds.top - bounds.height / 2;

      gsap.to(glowRef.current, {
        x: x * 0.45,
        y: y * 0.45,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      bounds = null;
      gsap.to(glowRef.current, { x: 0, y: 0, duration: 1, ease: 'power2.out' });
    };

    const contactSec = sectionRef.current;
    if (contactSec) {
      contactSec.addEventListener('mouseenter', handleMouseEnter);
      contactSec.addEventListener('mousemove', handleMouseMove);
      contactSec.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (contactSec) {
        contactSec.removeEventListener('mouseenter', handleMouseEnter);
        contactSec.removeEventListener('mousemove', handleMouseMove);
        contactSec.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    // Strict client-side validation
    if (!formData.name.trim()) {
      return setStatus({ type: 'error', text: 'Please provide your name.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      return setStatus({ type: 'error', text: 'Please provide a valid email address.' });
    }

    if (formData.phone && formData.phone.trim() !== '') {
      if (!isValidPhoneNumber(formData.phone)) {
        return setStatus({ type: 'error', text: 'Please enter a valid international phone number.' });
      }
    }

    if (!formData.message.trim()) {
      return setStatus({ type: 'error', text: 'Please enter a message.' });
    }

    setSubmitting(true);

    try {
      // Post submission to backend database (which forwards it via Resend securely)
      const response = await axios.post('/api/submissions', formData);
      
      if (response.data.success) {
        setStatus({ type: 'success', text: 'Message sent successfully. We will get back to you soon.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
      } else {
        setStatus({ type: 'error', text: response.data.message || 'Submission failed' });
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to establish connection. Message not sent.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const soc = settings.socials || {};

  return (
    <section ref={sectionRef} id="contact" className="contact-section relative pt-10 pb-20 overflow-hidden bg-bg-primary">
      {/* Moving reactive glow background radial */}
      <div 
        ref={glowRef}
        className="contact-glow-bg absolute w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-[1] left-[calc(50%-250px)] top-[calc(50%-250px)] will-change-transform"
      />
      
      <div className="container max-w-container mx-auto px-6 relative z-10">
        <div className="contact-layout grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left panel info */}
          <div ref={leftPanelRef} className="contact-left flex flex-col items-start select-none">
            <h2 className="contact-headline font-display text-4xl md:text-6xl font-extrabold text-text-primary leading-[1.1] uppercase tracking-tighter mb-8 select-none">
              LET'S CREATE CONTENT THAT <span className="text-accent">PEOPLE ACTUALLY WATCH.</span>
            </h2>
            
            <p className="contact-sub-info text-base md:text-lg text-text-muted leading-relaxed mb-8 max-w-lg select-none">
              Whether you're a creator, brand, or business, let's bring your vision to life through powerful editing that captures attention and drives retention.
            </p>

            <div className="contact-details-list flex flex-col gap-6 mb-8 select-none">
              <div className="contact-info-block flex flex-col items-start gap-1 select-none">
                <span className="contact-info-label font-mono text-[9px] text-text-muted tracking-[2px] uppercase select-none">
                  Email
                </span>
                <a href={`mailto:${soc.email || 'hello@akshatjain.com'}`} className="contact-info-link font-sans text-lg md:text-xl font-bold text-accent hover:text-text-primary transition-colors select-none pointer-events-auto">
                  {soc.email || 'hello@akshatjain.com'}
                </a>
              </div>
            </div>

            {/* Social handles list links */}
            <div className="socials-list flex gap-6 select-none pointer-events-auto">
              {soc.instagram && (
                <a href={soc.instagram} target="_blank" rel="noopener noreferrer" className="social-icon-link text-text-muted hover:text-accent transition-colors p-2 border border-white/5 hover:border-accent/20 bg-bg-secondary/40 rounded-full magnetic-btn" aria-label="Instagram">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </a>
              )}
              {soc.linkedin && (
                <a href={soc.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon-link text-text-muted hover:text-accent transition-colors p-2 border border-white/5 hover:border-accent/20 bg-bg-secondary/40 rounded-full magnetic-btn" aria-label="LinkedIn">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
                  </svg>
                </a>
              )}
              {soc.facebook && (
                <a href={soc.facebook} target="_blank" rel="noopener noreferrer" className="social-icon-link text-text-muted hover:text-accent transition-colors p-2 border border-white/5 hover:border-accent/20 bg-bg-secondary/40 rounded-full magnetic-btn" aria-label="Facebook">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {soc.whatsapp && (
                <a href={soc.whatsapp} target="_blank" rel="noopener noreferrer" className="social-icon-link text-text-muted hover:text-accent transition-colors p-2 border border-white/5 hover:border-accent/20 bg-bg-secondary/40 rounded-full magnetic-btn" aria-label="WhatsApp">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Right glass form panel */}
          <div ref={cardRef} className="contact-right opacity-0 transform-gpu pointer-events-auto">
            <div className="contact-card-glass bg-bg-secondary/45 border border-white/[0.08] backdrop-blur-[10px] rounded-xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {status.text && (
                  <div className={`p-4 rounded-md text-xs font-mono select-none ${
                    status.type === 'success' 
                      ? 'bg-accent/10 text-accent border border-accent/20' 
                      : 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20'
                  }`}>
                    {status.type === 'success' ? '✓ ' : '⚠ '} {status.text}
                  </div>
                )}

                {/* Honeypot spam trap (invisible to human users) */}
                <div style={{ display: 'none' }}>
                  <input
                    type="text"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </div>

                <div className="form-group flex flex-col items-start w-full gap-2 relative">
                  <label htmlFor="formName" className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    YOUR NAME
                  </label>
                  <input 
                    type="text" 
                    id="formName" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary transition-colors focus:outline-none" 
                    placeholder="e.g. Rahul Sharma" 
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group flex flex-col items-start w-full gap-2 relative">
                  <label htmlFor="formEmail" className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    EMAIL ADDRESS
                  </label>
                  <input 
                    type="email" 
                    id="formEmail" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary transition-colors focus:outline-none" 
                    placeholder="e.g. rahul@example.com" 
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group flex flex-col items-start w-full gap-2 relative">
                  <label htmlFor="formPhone" className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    PHONE NUMBER
                  </label>
                  <PhoneInput
                    id="formPhone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val || '' })}
                    defaultCountry="IN"
                    flags={flags}
                    countrySelectComponent={DarkCountrySelect}
                    numberInputProps={{
                      className: 'PhoneInputInput',
                      disabled: submitting
                    }}
                  />
                </div>

                <div className="form-group flex flex-col items-start w-full gap-2 relative">
                  <label htmlFor="formSubject" className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    SUBJECT
                  </label>
                  <input 
                    type="text" 
                    id="formSubject" 
                    name="subject"
                    value={formData.subject || ''}
                    onChange={handleChange}
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary transition-colors focus:outline-none" 
                    placeholder="e.g. Reel Editing Collaboration" 
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group flex flex-col items-start w-full gap-2 relative">
                  <label htmlFor="formMessage" className="font-mono text-[9px] tracking-widest text-text-muted uppercase font-bold">
                    TELL ME ABOUT YOUR PROJECT
                  </label>
                  <textarea 
                    id="formMessage" 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4" 
                    className="w-full bg-bg-primary/60 border border-white/10 focus:border-accent hover:border-white/20 rounded px-4 py-3.5 text-sm text-text-primary transition-colors focus:outline-none resize-none" 
                    placeholder="Tell us about your project..." 
                    required
                    disabled={submitting}
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-btn w-full py-4 rounded font-mono text-[11px] font-bold tracking-[2px] uppercase bg-accent text-bg-primary hover:bg-text-primary transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={submitting}
                >
                  {submitting ? 'SENDING...' : (soc.contactCta || "LET'S WORK TOGETHER")}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Hero({ settings }) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const ctasRef = useRef(null);
  const subtitlesRef = useRef(null);
  const videoBgRef = useRef(null);
  


  // 2. Parallax and GSAP Intro Animations
  useEffect(() => {
    // Hidden initially to prevent FOUC (flash of unstyled content)
    gsap.set([ctasRef.current, subtitlesRef.current], { opacity: 0, y: 20 });
    gsap.set([titleRef.current, descRef.current], { opacity: 0 });

    // Stagger character fades for title
    const titleText = titleRef.current;
    if (titleText) {
      const textContent = titleText.textContent || '';
      titleText.innerHTML = '';
      
      // Split into letters
      textContent.split('').forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.className = 'inline-block transform-gpu will-change-transform';
        titleText.appendChild(span);
      });

      const chars = titleText.querySelectorAll('span');
      
      // Intro timeline
      const tl = gsap.timeline({ delay: 0.5 });
      tl.to(titleText, { opacity: 1, duration: 0.1 })
        .fromTo(chars, 
          { y: '120%', opacity: 0, rotate: 15 },
          { y: '0%', opacity: 1, rotate: 0, stagger: 0.05, duration: 1.2, ease: 'power4.out' }
        )
        .fromTo(descRef.current,
          { y: '30px', opacity: 0 },
          { y: '0px', opacity: 0.85, duration: 1, ease: 'power3.out' },
          '-=0.8'
        )
        .to([subtitlesRef.current, ctasRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1
        }, '-=0.6');
    }

    // 3. Mouse Parallax Effect
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth - 0.5) * 2;
      const yPercent = (clientY / window.innerHeight - 0.5) * 2;

      // Slight tilt on title
      gsap.to(titleRef.current, {
        x: xPercent * 20,
        y: yPercent * 15,
        rotateX: -yPercent * 6,
        rotateY: xPercent * 6,
        duration: 0.8,
        ease: 'power2.out'
      });

      // Video offset opposite to mouse direction
      gsap.to(videoBgRef.current, {
        x: -xPercent * 30,
        y: -yPercent * 25,
        scale: 1.06,
        duration: 1.2,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(titleRef.current, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 1, ease: 'power2.out' });
      gsap.to(videoBgRef.current, { x: 0, y: 0, scale: 1, duration: 1.5, ease: 'power2.out' });
    };

    const heroSec = sectionRef.current;
    if (heroSec) {
      heroSec.addEventListener('mousemove', handleMouseMove);
      heroSec.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (heroSec) {
        heroSec.removeEventListener('mousemove', handleMouseMove);
        heroSec.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [settings]);

  useEffect(() => {
    const video = videoBgRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => {
              console.log('Hero video play prevented:', err.message);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [settings.heroBgVideoUrl]);

  const handleCtaClick = (e) => {
    e.preventDefault();
    const target = document.querySelector('#projects');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef} 
      id="hero" 
      className="hero-section relative w-full h-screen min-h-screen overflow-hidden flex items-center justify-center bg-bg-primary"
    >
      {/* Loop video background */}
      <video 
        ref={videoBgRef}
        className="hero-video-bg absolute top-0 left-0 w-full h-full object-cover opacity-30 saturate-20 contrast-[1.15] brightness-90 pointer-events-none transform-gpu will-change-transform" 
        autoPlay 
        loop 
        muted 
        playsInline 
        id="heroVideoBg"
        src={settings.heroBgVideoUrl}
        poster={settings.heroBgPosterUrl}
      />
      
      {/* Parallax Radial overlays */}
      <div className="hero-gradient-overlay absolute inset-0 bg-radial-gradient from-transparent via-bg-primary/50 to-bg-primary pointer-events-none z-[1]" />
      
      {/* Main Content Area */}
      <div className="hero-content relative z-10 text-center flex flex-col items-center max-w-[950px] px-6 select-none">
        <div className="hero-title-wrapper overflow-hidden mb-6">
          <h1 
            ref={titleRef} 
            className="hero-title font-display text-5xl md:text-8xl lg:text-[115px] font-bold leading-[0.95] tracking-tight uppercase text-text-primary opacity-0 select-none transform-gpu"
            id="heroTitle"
          >
            {settings.name || 'AKSHAT JAIN'}
          </h1>
        </div>
        
        {/* Dynamic Subtitles list */}
        <div 
          ref={subtitlesRef} 
          className="hero-subtitles flex flex-col md:flex-row gap-2 md:gap-5 mb-8 font-mono text-[10px] md:text-sm font-bold text-accent tracking-[2px] uppercase select-none"
        >
          {(settings.subtitles || []).map((sub, idx) => (
            <React.Fragment key={idx}>
              <span>{sub}</span>
              {idx < settings.subtitles.length - 1 && <span className="hidden md:inline">•</span>}
            </React.Fragment>
          ))}
        </div>
        
        <p 
          ref={descRef} 
          className="hero-description text-base md:text-xl lg:text-[22px] text-text-muted max-w-[680px] font-light leading-relaxed mb-10 select-none opacity-0"
          id="heroDesc"
        >
          {settings.heroDesc}
        </p>

        {settings.heroSubDesc && (
          <p className="hero-sub-description text-xs md:text-sm text-text-muted/80 max-w-[620px] leading-relaxed -mt-6 mb-10 block select-none">
            {settings.heroSubDesc}
          </p>
        )}
        
        <div ref={ctasRef} className="hero-ctas opacity-0 pointer-events-auto">
          <a 
            href="#projects" 
            onClick={handleCtaClick} 
            className="btn btn-primary px-8 py-4 text-xs font-bold tracking-[1px] uppercase rounded-[40px] bg-accent text-bg-primary shadow-[0_4px_20px_rgba(255,184,0,0.15)] hover:bg-text-primary hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] transition-all duration-300 magnetic-btn"
          >
            {settings.heroCtaText || 'View Projects'}
          </a>
        </div>
      </div>
    </section>
  );
}

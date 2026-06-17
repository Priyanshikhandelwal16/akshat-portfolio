import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export default function Projects({ categories, videos, onOpenVideo }) {
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const containerRef = useRef(null);

  // Set default active category to first one available
  useEffect(() => {
    if (categories.length > 0) {
      const isValid = categories.some(c => c._id === activeCategoryId);
      if (!isValid) {
        setActiveCategoryId(categories[0]._id);
      }
    } else {
      setActiveCategoryId('');
    }
  }, [categories, activeCategoryId]);

  // Initial scroll reveal for header titles
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.fromTo('.projects-section-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#projects',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Initial load card animation
    if (activeCategoryId) {
      gsap.fromTo('.project-card-animate',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#projects',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }, [activeCategoryId]);

  // Handle category switching with cinematic GSAP fade out/fade in staggers
  const handleCategorySwitch = (catId) => {
    if (isSwitching || catId === activeCategoryId) return;
    setIsSwitching(true);

    const activeBlock = document.querySelector('.category-block-node.active');
    
    // 1. Fade out active block
    gsap.to(activeBlock, {
      opacity: 0,
      y: -15,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        // Set state to mount the new category
        setActiveCategoryId(catId);
        
        // Let React update the DOM, then animate in
        setTimeout(() => {
          const nextBlock = document.querySelector('.category-block-node.active');
          const header = nextBlock.querySelector('.category-header-node');
          const cards = nextBlock.querySelectorAll('.project-card-animate');

          // Reset starting position for new elements
          gsap.set(nextBlock, { opacity: 0 });
          gsap.set(header, { opacity: 0, y: 15 });
          gsap.set(cards, { opacity: 0, y: 30 });

          // Fade block in
          gsap.to(nextBlock, { opacity: 1, duration: 0.1 });

          // Stagger reveal elements
          const tl = gsap.timeline({
            onComplete: () => {
              setIsSwitching(false);
              ScrollTrigger.refresh();
            }
          });

          tl.to(header, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out'
          })
          .to(cards, {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power3.out'
          }, '-=0.25');
        }, 50);
      }
    });
  };

  // Filter videos belonging to active category
  const filteredVideos = videos.filter(v => {
    const vCatId = typeof v.category === 'object' ? v.category?._id : v.category;
    return vCatId === activeCategoryId;
  });

  const activeCategory = categories.find(c => c._id === activeCategoryId);

  return (
    <section id="projects" ref={containerRef} className="works-section pt-10 pb-20 bg-bg-primary">
      <div className="container max-w-container mx-auto px-6">
        <span className="section-num font-mono text-[14px] text-accent tracking-[2px] mb-4 block">
          03 / PORTFOLIO
        </span>
        <h2 className="projects-section-title section-title font-display text-4xl md:text-7xl font-extrabold uppercase leading-[1.1] tracking-tighter mb-12 text-text-primary">
          FEATURED PROJECTS
        </h2>
        
        {/* Category Navigation Bar */}
        <div className="projects-categories-nav flex flex-wrap gap-4 md:gap-8 border-b border-white/10 pb-6 mb-12 select-none">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySwitch(cat._id)}
              className={`category-nav-btn font-sans text-xs md:text-sm font-semibold tracking-wider uppercase pb-2 border-b-2 relative transition-all duration-300 magnetic-btn ${
                activeCategoryId === cat._id 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Categories rendering block */}
        {activeCategory && (
          <div 
            className="category-block-node active transition-all"
            id={`${activeCategory.key}-block`}
          >
            {/* Category header tag details */}
            <div className="category-header-node category-header flex flex-col items-start mb-10 select-none">
              <span className="category-num font-mono text-xs text-accent tracking-widest uppercase mb-2">
                {activeCategory.description || 'SHOWCASE COLLECTION'}
              </span>
              <h3 className="category-title-large font-display text-2xl md:text-4xl font-extrabold text-text-primary uppercase tracking-tight">
                {activeCategory.title}
              </h3>
            </div>

            {/* Grid of videos */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-20 text-text-muted border border-white/5 bg-bg-secondary rounded-lg">
                No editorial videos in this showcase category yet.
              </div>
            ) : (
              <div 
                className={`projects-grid grid gap-8 ${
                  activeCategory.vertical 
                    ? 'grid-cols-2 md:grid-cols-4 vertical-cards justify-center' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {filteredVideos.map((proj) => (
                  <ProjectCard
                    key={proj._id}
                    proj={proj}
                    onOpenVideo={onOpenVideo}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

function ProjectCard({ proj, onOpenVideo }) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const handleMouseEnter = () => {
    // Debounce video loading by 150ms to prevent bandwidth waste on fast swipe-bys
    hoverTimerRef.current = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setShouldLoadVideo(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (shouldLoadVideo && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Video play prevented:', err.message);
      });
    } else if (!shouldLoadVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [shouldLoadVideo]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenVideo(proj.videoUrl)}
      className={`video-project-card project-card-animate group relative overflow-hidden rounded-lg bg-bg-secondary border border-white/[0.03] hover:border-accent/25 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(255,184,0,0.05)] transition-all duration-500 cursor-none select-none ${
        proj.aspectRatio === '9/16' ? 'aspect-vertical aspect-[9/16] w-full max-w-[320px] mx-auto' : 'aspect-video w-full'
      }`}
    >
      {/* Render Phone notch if vertical UGC */}
      {proj.aspectRatio === '9/16' && (
        <div className="phone-notch absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-10" />
      )}

      {/* Static thumbnail image (loaded lazily) */}
      <img 
        src={proj.posterUrl || '/assets/video_placeholder.png'} 
        alt={proj.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-[1]"
      />

      {/* Render video element dynamically only when hovered after debounce delay */}
      {shouldLoadVideo && (
        <video 
          ref={videoRef}
          className="project-card-video absolute inset-0 w-full h-full object-cover z-[2] pointer-events-none" 
          loop 
          muted 
          playsInline 
          src={proj.videoUrl}
        />
      )}

      {/* Gradient Overlay text reveal */}
      <div className="project-card-overlay absolute inset-0 bg-gradient-to-t from-bg-darker/90 via-bg-darker/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity duration-300 z-[3] flex flex-col justify-end p-4 md:p-6 select-none pointer-events-none">
        <span className="project-card-tag font-mono text-[9px] font-bold tracking-widest text-accent uppercase select-none">
          {proj.tag}
        </span>
      </div>
    </div>
  );
}

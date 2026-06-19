import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function VideoModal({ videoUrl, aspectRatio, onClose }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [renderedUrl, setRenderedUrl] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility and URL loading transitions to support fade-out animations
  useEffect(() => {
    if (videoUrl) {
      setRenderedUrl(videoUrl);
      setIsVisible(true);
    } else if (isVisible) {
      // Trigger smooth closing animation
      if (overlayRef.current && containerRef.current) {
        const tl = gsap.timeline({
          onComplete: () => {
            setIsVisible(false);
            setRenderedUrl(null);
            document.body.classList.remove('hovering-button'); // safety cleanup
            if (playerRef.current) {
              playerRef.current.pause();
              playerRef.current.src = '';
            }
          }
        });
        tl.to(containerRef.current, {
          scale: 0.95,
          y: 15,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        });
        tl.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        }, '-=0.25');
      } else {
        setIsVisible(false);
        setRenderedUrl(null);
      }
    }
  }, [videoUrl]);

  // Handle opening animations and event listeners
  useEffect(() => {
    if (isVisible && renderedUrl) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Trigger smooth opening animation
      if (overlayRef.current && containerRef.current) {
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(containerRef.current, { scale: 0.96, y: 15, opacity: 0 });

        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out'
        });
        gsap.to(containerRef.current, {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power4.out',
          delay: 0.05
        });
      }

      if (playerRef.current) {
        playerRef.current.src = renderedUrl;
        playerRef.current.load();
        playerRef.current.play().catch(err => {
          console.warn('Playback error:', err.message);
        });
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, renderedUrl, onClose]);

  if (!isVisible || !renderedUrl) return null;

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleMouseEnterClose = () => {
    document.body.classList.add('hovering-button');
  };

  const handleMouseLeaveClose = () => {
    document.body.classList.remove('hovering-button');
  };

  return (
    <div 
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fullscreen-video-overlay fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-12 cursor-none select-none pointer-events-auto"
    >
      <div 
        ref={containerRef}
        className={`fullscreen-video-container relative rounded-lg overflow-hidden border border-white/5 flex items-center justify-center bg-bg-darker transition-all ${
          aspectRatio === '9/16' 
            ? 'aspect-[9/16] max-h-[85vh] max-w-[420px] w-full' 
            : 'aspect-video max-w-[1280px] w-full'
        }`}
      >
        {/* Premium Close button */}
        <button 
          onClick={onClose}
          onMouseEnter={handleMouseEnterClose}
          onMouseLeave={handleMouseLeaveClose}
          className="close-video-modal absolute top-4 right-4 md:top-6 md:right-6 flex items-center justify-center p-3 border border-white/10 hover:border-accent/40 rounded-full bg-bg-primary/50 backdrop-blur z-20 transition-all duration-300 pointer-events-auto cursor-pointer group animate-fade-in"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-text-primary group-hover:text-accent transition-colors duration-300 transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <video 
          ref={playerRef}
          className="fullscreen-video-player w-full h-full object-contain pointer-events-auto cursor-auto" 
          controls 
          playsInline
          autoPlay
        />
      </div>
    </div>
  );
}

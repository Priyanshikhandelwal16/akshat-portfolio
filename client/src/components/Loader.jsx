import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Loader({ onComplete }) {
  const containerRef = useRef(null);
  const wordRef = useRef(null);
  const topBarRef = useRef(null);
  const bottomBarRef = useRef(null);
  const gridRef = useRef(null);
  const timecodeRef = useRef(null);
  const percentageRef = useRef(null);
  // Guard ref: ensures the loader timeline runs exactly once even in React StrictMode
  const hasStarted = useRef(false);

  useEffect(() => {
    // Prevent double-trigger in React StrictMode dev mode
    if (hasStarted.current) return;
    hasStarted.current = true;

    const progressObj = { value: 0 };
    const loaderTimeline = gsap.timeline({
      onComplete: () => {
        // 1. Fade out core content & viewfinder lines
        gsap.to(['.loader-content-inner', gridRef.current], {
          opacity: 0,
          scale: 0.97,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            // 2. Slide shutters apart vertically (Cinemascope widescreen reveal)
            gsap.to(topBarRef.current, {
              yPercent: -100,
              duration: 0.85,
              ease: 'expo.inOut'
            });
            gsap.to(bottomBarRef.current, {
              yPercent: 100,
              duration: 0.85,
              ease: 'expo.inOut',
              onComplete: () => {
                if (containerRef.current) {
                  containerRef.current.style.display = 'none';
                }
                onComplete();
              }
            });
          }
        });
      }
    });

    // Fade in core contents and viewfinder camera guides at start
    loaderTimeline.to('.loader-content-inner', {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, 0);

    loaderTimeline.fromTo(gridRef.current,
      { opacity: 0, scale: 1.05 },
      { opacity: 0.08, scale: 1, duration: 0.6, ease: 'power2.out' },
      0
    );

    // Animate loading percentage & timecode — runs from 0 to 100 exactly once
    loaderTimeline.to(progressObj, {
      value: 100,
      duration: 1.2,
      ease: 'power1.inOut',
      onUpdate: () => {
        const val = Math.floor(progressObj.value);
        if (percentageRef.current) {
          percentageRef.current.textContent = `${val < 10 ? '0' + val : val}%`;
        }

        // Map 0-100% to 36 frames (1.2 seconds @ 30fps)
        const totalFrames = 36;
        const currentFrame = Math.floor((progressObj.value / 100) * totalFrames);
        const seconds = Math.floor(currentFrame / 30);
        const frames = currentFrame % 30;
        if (timecodeRef.current) {
          timecodeRef.current.textContent = `00:00:0${seconds}:${frames < 10 ? '0' + frames : frames}`;
        }
      }
    }, 0);

    // Sequence word swaps with blur reveals
    if (wordRef.current) {
      loaderTimeline
        .to(wordRef.current, { opacity: 0.7, y: '0px', filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }, 0.05)
        .to(wordRef.current, { opacity: 0, y: '-10px', filter: 'blur(6px)', duration: 0.15, ease: 'power2.in' }, 0.45)
        .add(() => {
          if (wordRef.current) wordRef.current.textContent = 'SOUND SYNTHESIS';
          gsap.set(wordRef.current, { y: '20px', opacity: 0, filter: 'blur(8px)' });
        })
        .to(wordRef.current, { opacity: 0.7, y: '0px', filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }, 0.6)
        .to(wordRef.current, { opacity: 0, y: '-10px', filter: 'blur(6px)', duration: 0.15, ease: 'power2.in' }, 1.0)
        .add(() => {
          if (wordRef.current) wordRef.current.textContent = 'AKSHAT JAIN';
          gsap.set(wordRef.current, { y: '15px', opacity: 0, filter: 'blur(10px)' });
        })
        .to(wordRef.current, { opacity: 1, y: '0px', filter: 'blur(0px)', duration: 0.4, ease: 'power4.out' }, 1.15);
    }

    // Cleanup: kill GSAP animations on unmount
    return () => {
      loaderTimeline.kill();
    };
  }, []); // Empty deps — runs once on mount (guard ref prevents StrictMode double-run)

  return (
    <div ref={containerRef} className="loader-container fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-transparent select-none pointer-events-none">
      {/* Cinematic Shutters (Horizontal black bars) */}
      <div ref={topBarRef} className="loader-shutter absolute top-0 left-0 w-full h-[50.1%] bg-[#000000] z-[1] will-change-transform" />
      <div ref={bottomBarRef} className="loader-shutter absolute bottom-0 left-0 w-full h-[50.1%] bg-[#000000] z-[1] will-change-transform" />

      {/* Focus Viewfinder Camera lines */}
      <div ref={gridRef} style={{ opacity: 0 }} className="loader-focus-grid absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border border-white rounded-full opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[1px] bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[1px] bg-white" />
        <div className="absolute top-10 left-10 w-4 h-4 border-t border-l border-white" />
        <div className="absolute top-10 right-10 w-4 h-4 border-t border-r border-white" />
        <div className="absolute bottom-10 left-10 w-4 h-4 border-b border-l border-white" />
        <div className="absolute bottom-10 right-10 w-4 h-4 border-b border-r border-white" />
      </div>

      {/* Content panel */}
      <div className="loader-content loader-content-inner relative z-10 w-[80%] max-w-[600px] flex flex-col items-center justify-center gap-8 pointer-events-none" style={{ opacity: 0 }}>
        {/* Timecode indicator */}
        <div className="flex flex-col items-center gap-1 opacity-70">
          <span className="font-mono text-[9px] text-text-muted tracking-[3px] uppercase">
            TIMECODE // 30FPS
          </span>
          <span ref={timecodeRef} className="font-mono text-xs text-text-primary font-bold">
            00:00:00:00
          </span>
        </div>

        {/* Rotating aperture ring & percentage */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="absolute w-full h-full animate-spin-slow text-accent/30" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6 16 6" fill="none" />
          </svg>
          <span ref={percentageRef} className="font-mono text-3xl md:text-4xl font-extrabold text-accent">
            00%
          </span>
        </div>

        {/* Word indicator */}
        <div className="overflow-hidden h-10 flex items-center justify-center">
          <h2
            ref={wordRef}
            style={{ opacity: 0, transform: 'translateY(20px)', filter: 'blur(8px)' }}
            className="font-sans text-xs md:text-sm font-bold uppercase text-text-primary tracking-[6px] will-change-transform"
          >
            INITIALIZING
          </h2>
        </div>
      </div>
    </div>
  );
}

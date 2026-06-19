import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export default function GradingShowcase() {
  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const afterWrapperRef = useRef(null);
  const handleRef = useRef(null);
  const cachedRectRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Fade reveal container on scroll
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Resize observer to adapt images and layout dynamically
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          const imgs = entry.target.querySelectorAll('img');
          imgs.forEach(img => {
            img.style.width = `${width}px`;
          });
          cachedRectRef.current = entry.target.getBoundingClientRect();
        }
      }
    });

    if (sliderRef.current) {
      resizeObserver.observe(sliderRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handlePositionUpdate = (clientX) => {
    if (!sliderRef.current || !afterWrapperRef.current || !handleRef.current) return;
    if (!cachedRectRef.current) {
      cachedRectRef.current = sliderRef.current.getBoundingClientRect();
    }
    const rect = cachedRectRef.current;
    let offsetX = clientX - rect.left;

    // Clamp value
    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;

    const percentage = (offsetX / rect.width) * 100;
    afterWrapperRef.current.style.width = `${percentage}%`;
    handleRef.current.style.left = `${percentage}%`;
  };

  const handleStartDrag = () => {
    if (sliderRef.current) {
      cachedRectRef.current = sliderRef.current.getBoundingClientRect();
    }
    setIsDragging(true);
    document.body.classList.add('dragging-slider');
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    if (e.touches && e.cancelable) {
      e.preventDefault(); // touch prevention
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handlePositionUpdate(clientX);
  };

  const handleEndDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      cachedRectRef.current = null; // Clear cache
      document.body.classList.remove('dragging-slider');
    }
  };

  // Add global mousemove/mouseup to handle drag smoothly outside bounding boxes
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleEndDrag);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleEndDrag);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleEndDrag);
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [isDragging]);

  const handleContainerClick = (e) => {
    if (handleRef.current && handleRef.current.contains(e.target)) return;
    const clientX = e.clientX;
    handlePositionUpdate(clientX);
  };

  return (
    <section id="grading" ref={containerRef} className="grading-section pt-10 pb-20 bg-bg-primary opacity-0 transform-gpu">
      <div className="container max-w-container mx-auto px-6">
        <span className="section-num font-mono text-[14px] text-accent tracking-[2px] mb-4 block">
          02 / SERVICES
        </span>
        <h2 className="section-title font-display text-4xl md:text-7xl font-extrabold uppercase leading-[1.1] tracking-tighter mb-12 text-text-primary">
          COLOR GRADING
        </h2>
        
        {/* Interactive Slider comparison container */}
        <div 
          ref={sliderRef}
          onClick={handleContainerClick}
          id="gradingSliderContainer" 
          className="grading-slider-container w-full aspect-video relative overflow-hidden rounded-xl border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.6)] cursor-ew-resize select-none"
        >
          {/* Before: Raw LOG footage */}
          <div className="image-before absolute inset-0 w-full h-full">
            <img 
              src="/assets/project5_before.png" 
              alt="Before Color Grading LOG" 
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
            <div className="label-badge badge-before font-mono text-[7px] xs:text-[8px] md:text-[9px] font-bold tracking-[1px] md:tracking-[2px] text-text-muted absolute top-3 md:top-6 right-3 md:right-6 px-2.5 py-1 md:px-4 md:py-2 bg-bg-primary/75 border border-white/[0.08] rounded z-[4] select-none pointer-events-none">
              RAW LOG
            </div>
          </div>
          
          {/* After: Color Graded Cinematic */}
          <div 
            ref={afterWrapperRef}
            className="image-after absolute top-0 left-0 w-1/2 h-full overflow-hidden z-[2] border-r border-white/10 will-change-[width]"
          >
            <img 
              src="/assets/project5_after.png" 
              alt="After Cinematic Color Grading" 
              className="absolute top-0 left-0 h-full object-cover select-none pointer-events-none max-w-none"
            />
            <div className="label-badge badge-after font-mono text-[7px] xs:text-[8px] md:text-[9px] font-bold tracking-[1px] md:tracking-[2px] text-accent absolute top-3 md:top-6 left-3 md:left-6 px-2.5 py-1 md:px-4 md:py-2 bg-bg-primary/75 border border-white/[0.08] rounded z-[4] select-none pointer-events-none">
              CINEMATIC GRADE
            </div>
          </div>
          
          {/* Slider drag handle */}
          <div 
            ref={handleRef}
            onMouseDown={handleStartDrag}
            onTouchStart={handleStartDrag}
            id="sliderHandle" 
            className="slider-handle absolute top-0 bottom-0 left-1/2 w-0.5 bg-accent z-[3] -translate-x-1/2 flex flex-col items-center justify-center cursor-ew-resize will-change-[left]"
          >
            <div className="handle-line flex-grow w-[1px] bg-accent/60" />
            <div className="handle-button w-11 h-11 rounded-full bg-bg-primary border-2 border-accent text-accent flex items-center justify-between px-2.5 text-[10px] shadow-[0_0_15px_rgba(255,184,0,0.4)] select-none">
              <span>◀</span>
              <span>▶</span>
            </div>
            <div className="handle-line flex-grow w-[1px] bg-accent/60" />
          </div>
        </div>
        
        <div className="grading-description text-center mt-8 text-sm md:text-base text-text-muted leading-relaxed select-none">
          <p>Drag the slider to see the difference between raw camera footage (LOG profile) and the final color-graded cinematic look.</p>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const cursorDot = dotRef.current;
    const cursorRing = ringRef.current;

    if (!cursorDot || !cursorRing) return;

    // Set initial position
    gsap.set([cursorDot, cursorRing], { xPercent: -50, yPercent: -50 });

    const xToDot = gsap.quickTo(cursorDot, 'x', { duration: 0.08, ease: 'power3.out' });
    const yToDot = gsap.quickTo(cursorDot, 'y', { duration: 0.08, ease: 'power3.out' });
    const xToRing = gsap.quickTo(cursorRing, 'x', { duration: 0.28, ease: 'power3.out' });
    const yToRing = gsap.quickTo(cursorRing, 'y', { duration: 0.28, ease: 'power3.out' });

    const handleMouseMove = (e) => {
      xToDot(e.clientX);
      yToDot(e.clientY);
      xToRing(e.clientX);
      yToRing(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const isInteractable = target.closest('a, button, .category-nav-btn, .submit-btn, input, textarea, .skill-floating-card, .magnetic-btn');
      if (isInteractable) {
        document.body.classList.add('hovering-button');
      } else {
        document.body.classList.remove('hovering-button');
      }

      const isVideoCard = target.closest('.video-project-card');
      if (isVideoCard) {
        document.body.classList.add('hovering-video');
      } else {
        document.body.classList.remove('hovering-video');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);

    // Track frame visibility transitions
    const handleMouseLeave = () => {
      gsap.to([cursorDot, cursorRing], { opacity: 0, duration: 0.2 });
    };
    const handleMouseEnter = () => {
      gsap.to([cursorDot, cursorRing], { opacity: 1, duration: 0.2 });
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <>
      <div 
        ref={dotRef} 
        className="cursor-dot fixed pointer-events-none z-[10001] w-2 h-2 bg-accent rounded-full transition-all duration-300 ease-out hidden lg:block"
        id="customCursorDot"
      />
      <div 
        ref={ringRef} 
        className="cursor-ring fixed pointer-events-none z-[10000] w-10 h-10 border border-accent/40 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ease-out hidden lg:flex"
        id="customCursorRing"
      >
        <span className="cursor-text font-mono text-[8px] font-bold text-bg-primary opacity-0 scale-0 transition-all duration-200">
          ▶ PLAY
        </span>
      </div>
    </>
  );
}

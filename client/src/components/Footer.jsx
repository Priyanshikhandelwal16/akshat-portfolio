import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export default function Footer() {
  const lineRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(lineRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.5,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 95%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  return (
    <footer id="mainFooter" className="relative w-full py-8 bg-bg-primary select-none">
      {/* Animated line reveal */}
      <div
        ref={lineRef}
        className="footer-line-reveal w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent absolute top-0 left-0 origin-center"
      />

      <div className="container max-w-container mx-auto px-6 flex items-center justify-center">
        <span className="text-xs text-text-muted">
          Powered by{' '}
          <a
            href="https://jainup.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-text-primary transition-colors duration-300 font-semibold pointer-events-auto"
          >
            JAINUP | Growth Systems
          </a>
        </span>
      </div>
    </footer>
  );
}

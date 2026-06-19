import React, { useState, useEffect } from 'react';
import gsap from 'gsap';

export default function Header({ lenis }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Magnetic Buttons Effect
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    
    const handleMouseMove = (e, btn) => {
      const bounds = btn.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;
      
      const xOffset = (mouseX - bounds.width / 2) * 0.45;
      const yOffset = (mouseY - bounds.height / 2) * 0.45;

      gsap.to(btn, {
        x: xOffset,
        y: yOffset,
        duration: 0.35,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = (btn) => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.35)'
      });
    };

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => handleMouseMove(e, btn));
      btn.addEventListener('mouseleave', () => handleMouseLeave(btn));
    });

    return () => {
      magneticBtns.forEach(btn => {
        btn.removeEventListener('mousemove', (e) => handleMouseMove(e, btn));
        btn.removeEventListener('mouseleave', () => handleMouseLeave(btn));
      });
    };
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const wasOpen = mobileMenuOpen;
    
    if (wasOpen) {
      toggleMobileMenu();
    }

    const target = document.querySelector(targetId);
    if (target) {
      setTimeout(() => {
        if (lenis) {
          lenis.scrollTo(target);
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, wasOpen ? 350 : 0); // slight delay if mobile menu is open to let curtain close
    }
  };

  const toggleMobileMenu = () => {
    const nextState = !mobileMenuOpen;
    setMobileMenuOpen(nextState);

    const links = document.querySelectorAll('.mobile-menu-link');
    if (nextState) {
      if (lenis) lenis.stop();
      document.body.classList.add('lock-scroll');
      
      gsap.to(links, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
        delay: 0.2
      });
    } else {
      if (lenis) lenis.start();
      document.body.classList.remove('lock-scroll');
      
      gsap.to(links, {
        y: 30,
        opacity: 0,
        stagger: 0.05,
        duration: 0.3,
        ease: 'power3.in',
        overwrite: 'auto'
      });
    }
  };

  return (
    <>
      <header className="absolute top-0 left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-[1001] pointer-events-auto">
        <div 
          onClick={(e) => handleNavClick(e, '#hero')} 
          className="logo magnetic-btn text-lg font-mono font-bold tracking-[2px] text-text-primary select-none cursor-pointer"
        >
          AJ<span className="text-accent">.</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="nav-links hidden md:flex items-center gap-10">
          <a href="#hero" onClick={(e) => handleNavClick(e, '#hero')} className="nav-link font-sans text-[13px] font-medium tracking-[1.5px] uppercase text-text-muted hover:text-text-primary transition-colors py-1 relative magnetic-btn">
            Home
          </a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="nav-link font-sans text-[13px] font-medium tracking-[1.5px] uppercase text-text-muted hover:text-text-primary transition-colors py-1 relative magnetic-btn">
            About
          </a>
          <a href="#grading" onClick={(e) => handleNavClick(e, '#grading')} className="nav-link font-sans text-[13px] font-medium tracking-[1.5px] uppercase text-text-muted hover:text-text-primary transition-colors py-1 relative magnetic-btn">
            Color Grade
          </a>
          <a href="#projects" onClick={(e) => handleNavClick(e, '#projects')} className="nav-link font-sans text-[13px] font-medium tracking-[1.5px] uppercase text-text-muted hover:text-text-primary transition-colors py-1 relative magnetic-btn">
            Projects
          </a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="nav-link font-sans text-[13px] font-medium tracking-[1.5px] uppercase text-text-muted hover:text-text-primary transition-colors py-1 relative magnetic-btn">
            Contact
          </a>
        </nav>

        <a 
          href="#contact" 
          onClick={(e) => handleNavClick(e, '#contact')} 
          className="cta-header-btn hidden md:inline-block text-[12px] font-semibold tracking-[1.5px] uppercase text-text-primary border border-accent/25 px-6 py-3 rounded-[30px] bg-bg-secondary/40 backdrop-blur-[5px] hover:border-accent hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(255,184,0,0.1)] transition-all magnetic-btn"
        >
          Collaborate
        </a>
        
        {/* Mobile Hamburger Drawer Trigger */}
        <button 
          onClick={toggleMobileMenu}
          className={`hamburger-btn md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 z-[1002] ${mobileMenuOpen ? 'active' : ''}`}
          aria-label="Toggle Menu"
        >
          <span className={`w-6 h-0.5 bg-text-primary transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-text-primary transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-text-primary transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </header>

      {/* Mobile Navigation Drawer Panel */}
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            toggleMobileMenu();
          }
        }}
        className={`mobile-menu-overlay fixed inset-0 bg-bg-darker/98 z-[1000] flex items-center justify-center ${mobileMenuOpen ? 'active' : ''}`}
      >
        <nav className="mobile-menu-nav flex flex-col items-center gap-8 text-center">
          <a href="#hero" onClick={(e) => handleNavClick(e, '#hero')} className="mobile-menu-link text-2xl font-display font-medium tracking-wide text-text-muted hover:text-text-primary transform translate-y-[30px] opacity-0 transition-colors">
            Home
          </a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="mobile-menu-link text-2xl font-display font-medium tracking-wide text-text-muted hover:text-text-primary transform translate-y-[30px] opacity-0 transition-colors">
            About
          </a>
          <a href="#grading" onClick={(e) => handleNavClick(e, '#grading')} className="mobile-menu-link text-2xl font-display font-medium tracking-wide text-text-muted hover:text-text-primary transform translate-y-[30px] opacity-0 transition-colors">
            Color Grade
          </a>
          <a href="#projects" onClick={(e) => handleNavClick(e, '#projects')} className="mobile-menu-link text-2xl font-display font-medium tracking-wide text-text-muted hover:text-text-primary transform translate-y-[30px] opacity-0 transition-colors">
            Projects
          </a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="mobile-menu-link text-2xl font-display font-medium tracking-wide text-text-muted hover:text-text-primary transform translate-y-[30px] opacity-0 transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </>
  );
}

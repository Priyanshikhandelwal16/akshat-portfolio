import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export default function About({ settings, skills }) {
  const containerRef = useRef(null);
  const portraitMaskRef = useRef(null);
  const portraitImgRef = useRef(null);
  const portraitWrapperRef = useRef(null);
  const statsBarRef = useRef(null);
  const skillsWrapperRef = useRef(null);
  const bioTextRef = useRef(null);

  // Vector SVG lookup based on skill iconType slug
  const getSkillIcon = (type) => {
    const iconClass = "w-5 h-5 flex-shrink-0 transition-transform duration-300";
    
    switch (type) {
      case 'after-effects':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="url(#ae-grad-react)" />
            <text x="12" y="16" fill="#FFF" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="900" textAnchor="middle">Ae</text>
            <defs>
              <linearGradient id="ae-grad-react" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b0066"/><stop offset="1" stopColor="#FFB800"/>
              </linearGradient>
            </defs>
          </svg>
        );
      case 'premiere-pro':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="url(#pr-grad-react)" />
            <text x="12" y="16" fill="#FFF" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="900" textAnchor="middle">Pr</text>
            <defs>
              <linearGradient id="pr-grad-react" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#002244"/><stop offset="1" stopColor="#FF6B35"/>
              </linearGradient>
            </defs>
          </svg>
        );
      case 'capcut':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="url(#cc-grad-react)"/>
            <path d="M7 7L12 12L7 17V7Z" fill="#FFF"/>
            <path d="M17 7L12 12L17 17V7Z" fill="#FFB800"/>
            <defs>
              <linearGradient id="cc-grad-react" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#252525"/><stop offset="1" stopColor="#0f0f0f"/>
              </linearGradient>
            </defs>
          </svg>
        );
      case 'video':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"/>
          </svg>
        );
      case 'typography':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
        );
      case 'wedding':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="12" r="5" stroke="url(#ring-grad1-react)"/>
            <circle cx="16" cy="12" r="5" stroke="url(#ring-grad2-react)"/>
            <defs>
              <linearGradient id="ring-grad1-react" x1="3" y1="7" x2="13" y2="17">
                <stop stopColor="#FFB800"/><stop offset="1" stopColor="#FF6B35"/>
              </linearGradient>
              <linearGradient id="ring-grad2-react" x1="11" y1="7" x2="21" y2="17">
                <stop stopColor="#FFB800"/><stop offset="1" stopColor="#FF6B35"/>
              </linearGradient>
            </defs>
          </svg>
        );
      case 'brand':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 22H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2z"/>
            <path d="M0 7h24"/><path d="M12 2v5"/><path d="M6 2v5"/><path d="M18 2v5"/>
            <path d="M6 2l3 5"/><path d="M12 2l3 5"/><path d="M18 2l3 5"/>
          </svg>
        );
      case 'commercial':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        );
      case 'trending':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        );
      case 'motion':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="21" x2="9" y2="9" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        );
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Portrait mask slide-down reveal
    gsap.fromTo(portraitMaskRef.current, 
      { scaleY: 1 },
      { 
        scaleY: 0,
        duration: 1.5,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: '#about',
          start: 'top 70%',
          end: 'bottom 30%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo(portraitImgRef.current,
      { scale: 1.1 },
      {
        scale: 1,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#about',
          start: 'top 70%',
          end: 'bottom 30%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // 2. 3D Tilt portrait on hover
    const aboutLeft = portraitWrapperRef.current;
    let tiltBounds = null;

    const handleTiltMouseEnter = () => {
      if (aboutLeft) {
        tiltBounds = aboutLeft.getBoundingClientRect();
      }
    };

    const handleMouseMove = (e) => {
      if (!tiltBounds && aboutLeft) {
        tiltBounds = aboutLeft.getBoundingClientRect();
      }
      if (!tiltBounds) return;
      const xPercent = ((e.clientX - tiltBounds.left) / tiltBounds.width - 0.5) * 2;
      const yPercent = ((e.clientY - tiltBounds.top) / tiltBounds.height - 0.5) * 2;

      gsap.to(portraitImgRef.current, {
        x: xPercent * 12,
        y: yPercent * 12,
        scale: 1.06,
        rotateY: xPercent * 5,
        rotateX: -yPercent * 5,
        duration: 0.6,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      tiltBounds = null;
      gsap.to(portraitImgRef.current, { 
        x: 0, 
        y: 0, 
        scale: 1, 
        rotateX: 0, 
        rotateY: 0, 
        duration: 1, 
        ease: 'power2.out' 
      });
    };

    if (aboutLeft) {
      aboutLeft.addEventListener('mouseenter', handleTiltMouseEnter);
      aboutLeft.addEventListener('mousemove', handleMouseMove);
      aboutLeft.addEventListener('mouseleave', handleMouseLeave);
    }

    // 3. Stagger reveal "What I Do" cards
    gsap.fromTo('.what-card-item',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.what-i-do-container',
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // 4. Stagger reveal "Floating Skills" cards
    gsap.fromTo('.skill-card-item',
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.06,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.skills-container-ref',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // 5. Skills drifting micro floats
    const skillsContainer = skillsWrapperRef.current;
    let skillsBounds = null;

    const handleSkillsMouseEnter = () => {
      if (skillsContainer) {
        skillsBounds = skillsContainer.getBoundingClientRect();
      }
    };

    const handleSkillsMouseMove = (e) => {
      if (!skillsBounds && skillsContainer) {
        skillsBounds = skillsContainer.getBoundingClientRect();
      }
      if (!skillsBounds) return;
      const xPercent = (e.clientX - skillsBounds.left) / skillsBounds.width - 0.5;
      const yPercent = (e.clientY - skillsBounds.top) / skillsBounds.height - 0.5;

      const skillCards = skillsContainer.querySelectorAll('.skill-card-item');
      skillCards.forEach((card, idx) => {
        const factor = (idx % 3 + 1) * 8;
        gsap.to(card, {
          x: xPercent * factor,
          y: yPercent * factor,
          duration: 0.8,
          ease: 'power2.out'
        });
      });
    };

    const handleSkillsMouseLeave = () => {
      skillsBounds = null;
      gsap.to('.skill-card-item', {
        x: 0,
        y: 0,
        duration: 1,
        ease: 'power2.out'
      });
    };

    if (skillsContainer) {
      skillsContainer.addEventListener('mouseenter', handleSkillsMouseEnter);
      skillsContainer.addEventListener('mousemove', handleSkillsMouseMove);
      skillsContainer.addEventListener('mouseleave', handleSkillsMouseLeave);
    }

    // 6. Stats Bar numeric counter trigger
    const statItems = statsBarRef.current ? statsBarRef.current.querySelectorAll('.stat-val-number') : [];
    ScrollTrigger.create({
      trigger: '#statsBar',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
      onEnter: () => {
        statItems.forEach(el => {
          const target = parseInt(el.getAttribute('data-target') || '0', 10);
          const suffix = el.getAttribute('data-suffix') || '';
          const counterObj = { val: 0 };
          
          gsap.to(counterObj, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => {
              // format floating point representation for views
              if (target === 1.5) {
                el.textContent = counterObj.value.toFixed(1) + suffix;
              } else {
                el.textContent = Math.round(counterObj.val) + suffix;
              }
            },
            onComplete: () => {
              el.textContent = target + suffix;
            }
          });
        });
      },
      onLeaveBack: () => {
        statItems.forEach(el => {
          const suffix = el.getAttribute('data-suffix') || '';
          el.textContent = '0' + suffix;
        });
      }
    });

    return () => {
      if (aboutLeft) {
        aboutLeft.removeEventListener('mouseenter', handleTiltMouseEnter);
        aboutLeft.removeEventListener('mousemove', handleMouseMove);
        aboutLeft.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (skillsContainer) {
        skillsContainer.removeEventListener('mouseenter', handleSkillsMouseEnter);
        skillsContainer.removeEventListener('mousemove', handleSkillsMouseMove);
        skillsContainer.removeEventListener('mouseleave', handleSkillsMouseLeave);
      }
    };
  }, [skills, settings]);

  const defaultPortrait = "/assets/akshat-image.jpeg";

  return (
    <section id="about" className="about-section pt-10 pb-20 bg-bg-primary">
      <div className="container max-w-container mx-auto px-6">
        <span className="section-num font-mono text-[14px] text-accent tracking-[2px] mb-4 block">
          01 / ABOUT
        </span>
        <h2 className="section-title font-display text-4xl md:text-7xl font-extrabold uppercase leading-[1.1] tracking-tighter mb-16 text-text-primary">
          ABOUT ME
        </h2>
        
        {/* Split Grid */}
        <div className="about-grid grid grid-cols-1 lg:grid-cols-[4.5fr_7.5fr] gap-12 lg:gap-20 items-center mb-20">
          
          {/* Left panel portrait */}
          <div 
            ref={portraitWrapperRef} 
            className="about-left relative w-full h-[300px] sm:h-[400px] md:h-[480px] lg:h-[540px] rounded-lg overflow-hidden bg-bg-secondary shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform-gpu"
          >
            <img 
              ref={portraitImgRef}
              src={settings.portraitUrl || defaultPortrait} 
              alt="Akshat Jain Portrait" 
              loading="lazy"
              className="about-portrait w-full h-full object-cover filter grayscale contrast-[1.1] scale-[1.1]"
              onError={(e) => { e.target.src = defaultPortrait }}
            />
            {/* Reveal Mask curtain */}
            <div 
              ref={portraitMaskRef} 
              className="about-portrait-mask absolute inset-0 bg-bg-primary"
            />
          </div>
          
          {/* Right details content */}
          <div className="about-right flex flex-col justify-center">
            <p 
              ref={bioTextRef}
              className="about-text font-sans text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-light leading-relaxed text-text-primary"
            >
              {settings.bioText || "Hi, I'm Akshat Jain, a passionate Video Editor and Content Creator..."}
              <br /><br />
              <span className="text-accent font-semibold">
                {settings.bioHighlight}
              </span>
            </p>
          </div>
        </div>

        {/* Stats counter strip bar */}
        <div 
          ref={statsBarRef}
          id="statsBar" 
          className="stats-bar grid grid-cols-2 lg:grid-cols-4 gap-0.5 border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.03] mb-24 mt-24"
        >
          {(settings.stats || []).map((stat, idx) => (
            <div 
              key={idx} 
              className="stat-item relative p-4 sm:p-8 md:p-11 text-center bg-bg-primary border-r border-white/[0.06] last:border-r-0 hover:bg-accent/[0.03] transition-colors group"
            >
              {/* Gold line slide on hover */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent-secondary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
              
              <span 
                className="stat-number stat-val-number font-display text-4xl md:text-6xl font-extrabold text-accent block mb-2"
                data-target={stat.number}
                data-suffix={stat.suffix || '+'}
                id={stat.id}
              >
                0{stat.suffix || '+'}
              </span>
              <span className="stat-label font-sans text-[10px] md:text-xs font-semibold tracking-[2px] uppercase text-text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* What I Do features section */}
        <div className="what-i-do-container mt-24">
          <h3 className="about-sub-title font-display text-2xl md:text-[36px] font-bold uppercase mb-10 border-l-[3px] border-accent pl-5">
            WHAT I DO
          </h3>
          <div className="what-i-do-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            
            <div className="what-card-item what-card relative bg-bg-secondary border border-white/[0.03] hover:border-accent/20 rounded-lg p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent-secondary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
              <span className="what-num font-mono text-2xl font-bold text-accent mb-6 block">01</span>
              <h4 className="what-title font-display text-xl font-bold uppercase mb-4">Capture Attention</h4>
              <p className="what-desc text-sm text-text-muted leading-relaxed">Strong hooks and fast-paced editing that stop viewers from scrolling in the first three seconds.</p>
            </div>

            <div className="what-card-item what-card relative bg-bg-secondary border border-white/[0.03] hover:border-accent/20 rounded-lg p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent-secondary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
              <span className="what-num font-mono text-2xl font-bold text-accent mb-6 block">02</span>
              <h4 className="what-title font-display text-xl font-bold uppercase mb-4">Increase Engagement</h4>
              <p className="what-desc text-sm text-text-muted leading-relaxed">Creative transitions, precise narrative pacing, and sound synthesis that keep audiences watching till the end.</p>
            </div>

            <div className="what-card-item what-card relative bg-bg-secondary border border-white/[0.03] hover:border-accent/20 rounded-lg p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent-secondary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
              <span className="what-num font-mono text-2xl font-bold text-accent mb-6 block">03</span>
              <h4 className="what-title font-display text-xl font-bold uppercase mb-4">Build Brand Presence</h4>
              <p className="what-desc text-sm text-text-muted leading-relaxed">Professional aesthetic cuts, professional color grading, and structured layouts that help brands and creators grow online.</p>
            </div>

          </div>
        </div>

        {/* Dynamic floating skill arsenal cards */}
        <div className="skills-container-ref mt-20">
          <h3 className="about-sub-title font-display text-2xl md:text-[36px] font-bold uppercase mb-10 border-l-[3px] border-accent pl-5">
            SKILLS
          </h3>
          <div 
            ref={skillsWrapperRef}
            className="skills-wrapper-floating flex flex-wrap gap-4 md:gap-5 justify-center max-w-4xl mx-auto py-6"
          >
            {skills.map((skill) => (
              <div 
                key={skill._id}
                className="skill-card-item skill-floating-card px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/[0.08] bg-bg-secondary flex items-center gap-3 transition-all duration-300 font-sans text-xs md:text-sm font-semibold tracking-wider text-text-primary select-none opacity-0 transform-gpu"
              >
                {getSkillIcon(skill.iconType)}
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/*
   =========================================
   AKSHAT JAIN - CINEMATIC PORTFOLIO WEBSITE
   =========================================
   Interaction Engine & Premium Motion Core (Awwwards Style)
*/

document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  // Initialize hero elements hidden to prevent visual flash before animation triggers
  gsap.set([".hero-ctas", ".hero-subtitles", "#heroSubDesc"], {
    opacity: 0,
    y: 20
  });
  gsap.set(["#heroTitle", "#heroDesc"], {
    opacity: 0
  });

  // Initialize Smooth Scrolling (Lenis)
  let lenis;
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
    
    // Lock scroll immediately while loading
    if (lenis) lenis.stop();
    document.body.classList.add("lock-scroll");
  } catch (error) {
    console.error("Lenis smooth scroll failed to initialize:", error);
  }
  
  /* ==========================================================
     DATABASE & DYNAMIC RENDERING ENGINE
     ========================================================== */
  const initializeDatabase = () => {
    // Note: Projects data is now loaded dynamically from projects.json.

    if (!localStorage.getItem('portfolio_skills')) {
      const defaultSkills = [
        { id: 'sk1', name: 'After Effects', iconType: 'after-effects' },
        { id: 'sk2', name: 'Premiere Pro', iconType: 'premiere-pro' },
        { id: 'sk3', name: 'CapCut PC', iconType: 'capcut' },
        { id: 'sk4', name: 'Content Creation', iconType: 'video' },
        { id: 'sk5', name: 'Typography Reels', iconType: 'typography' },
        { id: 'sk6', name: 'Wedding Editing', iconType: 'wedding' },
        { id: 'sk7', name: 'Brand Shoot Editing', iconType: 'brand' },
        { id: 'sk8', name: 'Brand Commercial Editing', iconType: 'commercial' },
        { id: 'sk9', name: 'Trending Reel Editing', iconType: 'trending' },
        { id: 'sk10', name: 'Motion Graphics', iconType: 'motion' }
      ];
      localStorage.setItem('portfolio_skills', JSON.stringify(defaultSkills));
    }

    if (!localStorage.getItem('portfolio_config')) {
      const defaultConfig = {
        name: 'Akshat Jain',
        subtitles: ['VIDEO EDITOR', 'CONTENT CREATOR'],
        heroDesc: 'Turning Footage Into Stories People Remember.',
        heroSubDesc: 'From wedding films to brand campaigns and viral reels, I create edits that capture attention and drive engagement.',
        bioText: 'Hi, I\'m Akshat Jain, a passionate Video Editor and Content Creator focused on creating engaging visual stories that connect with audiences and help brands stand out.',
        bioHighlight: 'I believe editing is not just cutting clips—it\'s about creating emotions, increasing engagement, and turning ordinary footage into memorable content.',
        stats: [
          { id: 'stat1', number: 100, label: 'Projects Delivered', suffix: '+' },
          { id: 'stat2', number: 50, label: 'Happy Clients', suffix: '+' },
          { id: 'stat3', number: 3, label: 'Years Experience', suffix: '+' },
          { id: 'stat4', number: 1.5, label: 'Million+ Views', suffix: 'M+' }
        ],
        socials: {
          instagram: 'https://instagram.com',
          linkedin: 'https://linkedin.com',
          whatsapp: 'https://wa.me/919999999999',
          email: 'hello@akshatjain.com'
        },
        emailjs: {
          serviceId: '',
          templateId: '',
          publicKey: ''
        },
        adminPassword: 'admin123'
      };
      localStorage.setItem('portfolio_config', JSON.stringify(defaultConfig));
    }

    if (!localStorage.getItem('portfolio_contact_submissions')) {
      localStorage.setItem('portfolio_contact_submissions', JSON.stringify([]));
    }
  };

  const showToast = (message, type = 'success') => {
    let toast = document.querySelector('.custom-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'custom-toast';
      document.body.appendChild(toast);
    }
    toast.className = `custom-toast custom-toast-${type}`;
    const icon = type === 'success' ? '✓' : '⚠';
    toast.innerHTML = `
      <span class="custom-toast-icon">${icon}</span>
      <span class="custom-toast-text">${message}</span>
    `;
    toast.offsetHeight; // trigger reflow
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  };

  const renderConfig = () => {
    const config = JSON.parse(localStorage.getItem('portfolio_config'));
    if (!config) return;

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle && config.name) heroTitle.textContent = config.name.toUpperCase();

    const heroSubtitles = document.querySelector('.hero-subtitles');
    if (heroSubtitles && config.subtitles) {
      heroSubtitles.innerHTML = config.subtitles.map(s => `<span>${s}</span>`).join(' <span>•</span> ');
    }

    const heroDesc = document.getElementById('heroDesc');
    if (heroDesc && config.heroDesc) {
      heroDesc.textContent = config.heroDesc;
    }

    const heroSubDesc = document.getElementById('heroSubDesc');
    if (heroSubDesc && config.heroSubDesc) {
      heroSubDesc.textContent = config.heroSubDesc;
    }

    const aboutText = document.getElementById('aboutDynamicText');
    if (aboutText && (config.bioText || config.bioHighlight)) {
      aboutText.innerHTML = `${config.bioText || ''}<br><br><span>${config.bioHighlight || ''}</span>`;
    }

    if (config.stats) {
      config.stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (el) {
          el.setAttribute('data-target', stat.number);
          const label = el.nextElementSibling;
          if (label) label.textContent = stat.label;
        }
      });
    }

    if (config.socials) {
      const links = document.querySelectorAll('.social-icon-link');
      links.forEach(link => {
        const label = link.getAttribute('aria-label');
        if (label) {
          const lowerLabel = label.toLowerCase();
          if (config.socials[lowerLabel]) {
            link.href = config.socials[lowerLabel];
          }
        }
      });
    }

    const contactLabelLink = document.querySelector('.contact-info-link');
    if (contactLabelLink && config.socials && config.socials.email) {
      contactLabelLink.href = `mailto:${config.socials.email}`;
      contactLabelLink.textContent = config.socials.email;
    }
  };

  const renderSkills = () => {
    const skills = JSON.parse(localStorage.getItem('portfolio_skills')) || [];
    const wrapper = document.querySelector('.skills-wrapper-floating');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const skillIcons = {
      'after-effects': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="url(#ae-grad-dyn)" /><text x="12" y="16" fill="#FFF" font-family="'Inter', sans-serif" font-size="10" font-weight="900" text-anchor="middle">Ae</text><defs><linearGradient id="ae-grad-dyn" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#3b0066"/><stop offset="1" stop-color="#FFB800"/></linearGradient></defs></svg>`,
      'premiere-pro': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="url(#pr-grad-dyn)" /><text x="12" y="16" fill="#FFF" font-family="'Inter', sans-serif" font-size="10" font-weight="900" text-anchor="middle">Pr</text><defs><linearGradient id="pr-grad-dyn" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#002244"/><stop offset="1" stop-color="#FF6B35"/></linearGradient></defs></svg>`,
      'capcut': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="url(#cc-grad-dyn)"/><path d="M7 7L12 12L7 17V7Z" fill="#FFF"/><path d="M17 7L12 12L17 17V7Z" fill="#FFB800"/><defs><linearGradient id="cc-grad-dyn" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#252525"/><stop offset="1" stop-color="#0f0f0f"/></linearGradient></defs></svg>`,
      'video': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"/></svg>`,
      'typography': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
      'wedding': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="5" stroke="url(#ring-grad1-dyn)"/><circle cx="16" cy="12" r="5" stroke="url(#ring-grad2-dyn)"/><defs><linearGradient id="ring-grad1-dyn" x1="3" y1="7" x2="13" y2="17"><stop stop-color="#FFB800"/><stop offset="1" stop-color="#FF6B35"/></linearGradient><linearGradient id="ring-grad2-dyn" x1="11" y1="7" x2="21" y2="17"><stop stop-color="#FFB800"/><stop offset="1" stop-color="#FF6B35"/></linearGradient></defs></svg>`,
      'brand': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 22H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2z"/><path d="M0 7h24"/><path d="M12 2v5"/><path d="M6 2v5"/><path d="M18 2v5"/><path d="M6 2l3 5"/><path d="M12 2l3 5"/><path d="M18 2l3 5"/></svg>`,
      'commercial': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
      'trending': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      'motion': `<svg class="skill-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
    };

    skills.forEach(skill => {
      const card = document.createElement('div');
      card.className = 'skill-floating-card';
      const iconSvg = skillIcons[skill.iconType] || skillIcons['video'];
      card.innerHTML = `
        ${iconSvg}
        <span>${skill.name}</span>
      `;
      wrapper.appendChild(card);
    });
  };

  const renderProjects = (projects) => {
    const container = document.querySelector('.works-section .container');
    if (!container) return;

    // Remove existing category blocks to rebuild them dynamically
    document.querySelectorAll('.category-block').forEach(el => el.remove());

    const categories = [
      { id: 'weddings-block', title: 'WEDDING FILMS', num: '01 / ELEGANT' },
      { id: 'brands-block', title: 'BRAND SHOOTS', num: '02 / CAMPAIGNS' },
      { id: 'reels-block', title: 'UGC', num: '03 / VIRAL', vertical: true },
      { id: 'commercials-block', title: 'Motion Graphics', num: '04 / COMMERCIAL' },
      // { id: 'social-block', title: 'SOCIAL MEDIA CONTENT', num: '05 / AUDIENCE' }
    ];

    categories.forEach((cat, idx) => {
      // Normalize category names (e.g. "weddings" -> "weddings-block")
      const catProjects = projects.filter(p => {
        const normalizedCat = p.category.endsWith('-block') ? p.category : `${p.category}-block`;
        return normalizedCat === cat.id;
      });
      
      const block = document.createElement('div');
      block.className = `category-block ${idx === 0 ? 'active' : ''}`;
      block.id = cat.id;

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-num">${cat.num}</span>
        <h3 class="category-title-large">${cat.title}</h3>
      `;
      block.appendChild(header);

      const grid = document.createElement('div');
      grid.className = `projects-grid ${cat.vertical ? 'vertical-cards' : ''}`;

      catProjects.forEach(proj => {
        const card = document.createElement('div');
        card.className = `video-project-card ${proj.aspectRatio === '9/16' ? 'aspect-vertical' : ''}`;
        card.setAttribute('data-video', proj.videoUrl);
        card.innerHTML = `
          ${proj.aspectRatio === '9/16' ? '<div class="phone-notch"></div>' : ''}
          <video class="project-card-video" loop muted playsinline poster="${proj.posterUrl || ''}">
            <source src="${proj.videoUrl}" type="video/mp4">
          </video>
          <div class="project-card-overlay">
            <h4 class="project-card-title">${proj.title}</h4>
            <span class="project-card-tag">${proj.tag}</span>
          </div>
        `;
        grid.appendChild(card);
      });

      block.appendChild(grid);
      container.appendChild(block);
    });
  };

  const setupContactForm = () => {
    const form = document.getElementById('collaborationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('formName').value;
      const email = document.getElementById('formEmail').value;
      const message = document.getElementById('formMessage').value;

      // Log submission locally
      const submissions = JSON.parse(localStorage.getItem('portfolio_contact_submissions')) || [];
      const newSubmission = {
        id: Date.now(),
        name,
        email,
        message,
        date: new Date().toLocaleString()
      };
      submissions.push(newSubmission);
      localStorage.setItem('portfolio_contact_submissions', JSON.stringify(submissions));

      const config = JSON.parse(localStorage.getItem('portfolio_config')) || {};
      const ejs = config.emailjs || {};
      const submitBtn = form.querySelector('.submit-btn');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'TRANSMITTING...';

      if (ejs.serviceId && ejs.templateId && ejs.publicKey) {
        emailjs.init({ publicKey: ejs.publicKey });
        emailjs.send(ejs.serviceId, ejs.templateId, {
          from_name: name,
          reply_to: email,
          message: message
        })
        .then(() => {
          showToast('Transmission Received. Let\'s create magic!', 'success');
          form.reset();
        })
        .catch((err) => {
          console.error("EmailJS Error:", err);
          showToast('Direct transmission failed, but message saved locally!', 'error');
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
      } else {
        setTimeout(() => {
          showToast('Message saved! (Set up EmailJS keys in Admin to receive email alerts).', 'success');
          form.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }, 800);
      }
    });
  };

  // Run dynamic setup
  initializeDatabase();
  renderConfig();
  renderSkills();
  setupContactForm();

  // Dynamic Fetching Flow
  fetch("projects.json")
    .then(response => response.json())
    .then(projects => {
      renderProjects(projects);
      initAnimationsAndInteractions();
    })
    .catch(error => {
      console.error("Failed to load projects.json:", error);
      renderProjects([]); // Empty fallback
      initAnimationsAndInteractions();
    });

  const initAnimationsAndInteractions = () => {
    ScrollTrigger.refresh();

  /* ==========================================================
     1. TYPOGRAPHIC CURTAIN LOADER SEQUENCE
     ========================================================== */
  const loaderWord = document.getElementById("loaderWord");
  const loaderPercentage = document.getElementById("loaderPercentage");
  const loaderTimecode = document.getElementById("loaderTimecode");

  const progressObj = { value: 0 };
  const loaderTimeline = gsap.timeline({
    onComplete: () => {
      // Fade out the loader content panel
      gsap.to(".loader-content", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Slide up the panels with a stagger
          document.body.classList.add("app-loaded");
          document.body.classList.remove("lock-scroll");
          if (lenis) lenis.start();

          gsap.to(".loader-panel", {
            yPercent: -100,
            duration: 1.2,
            stagger: 0.12,
            ease: "power4.inOut",
            onComplete: () => {
              const container = document.getElementById("loaderContainer");
              if (container) container.style.display = "none";
              triggerHeroIntro();
              ScrollTrigger.refresh();
            }
          });
        }
      });
    }
  });

  // Timeline progress and stat updates
  loaderTimeline.to(progressObj, {
    value: 100,
    duration: 3.5,
    ease: "power1.inOut",
    onUpdate: () => {
      const val = Math.floor(progressObj.value);
      if (loaderPercentage) {
        loaderPercentage.textContent = `${val < 10 ? '0' + val : val}%`;
      }
      if (loaderTimecode) {
        // Map 0-100% to 0-90 frames (3 seconds @ 30fps)
        const totalFrames = 90;
        const currentFrame = Math.floor((progressObj.value / 100) * totalFrames);
        const seconds = Math.floor(currentFrame / 30);
        const frames = currentFrame % 30;
        loaderTimecode.textContent = `00:00:0${seconds}:${frames < 10 ? '0' + frames : frames}`;
      }
    }
  }, 0);

  // Changing words in loader
  if (loaderWord) {
    // Initial state
    gsap.set(loaderWord, { opacity: 0, y: "60%", filter: "blur(8px)" });
    
    loaderTimeline
      .to(loaderWord, { opacity: 1, y: "0%", filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, 0.1)
      .to(loaderWord, { opacity: 0, y: "-50%", filter: "blur(6px)", duration: 0.45, ease: "power2.in" }, 1.0)
      .add(() => {
        loaderWord.textContent = "TEMPO";
        gsap.set(loaderWord, { y: "60%", opacity: 0, filter: "blur(8px)" });
      })
      .to(loaderWord, { opacity: 1, y: "0%", filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, 1.45)
      .to(loaderWord, { opacity: 0, y: "-50%", filter: "blur(6px)", duration: 0.45, ease: "power2.in" }, 2.2)
      .add(() => {
        loaderWord.textContent = "AKSHAT JAIN";
        gsap.set(loaderWord, { y: "40%", opacity: 0, filter: "blur(10px)" });
      })
      // AKSHAT JAIN comes in slowly and gracefully — stays visible till loader exits
      .to(loaderWord, { opacity: 1, y: "0%", filter: "blur(0px)", duration: 1.4, ease: "power4.out" }, 2.65);
  }

  /* ==========================================================
     2. HERO INTRO & PARALLAX ANIMATION
     ========================================================== */
  const triggerHeroIntro = () => {
    // Reveal Nav elements
    gsap.from("header > *", {
      y: -50,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: "power4.out"
    });

    // Split title and animate characters
    const heroTitle = document.getElementById("heroTitle");
    if (heroTitle) {
      gsap.set(heroTitle, { opacity: 1 });
      const split = new SplitType(heroTitle, { types: "chars,words" });
      gsap.from(split.chars, {
        y: "120%",
        opacity: 0,
        rotate: 15,
        stagger: 0.05,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.2
      });
    }

    // Split description and animate words
    const heroDesc = document.getElementById("heroDesc");
    if (heroDesc) {
      gsap.set(heroDesc, { opacity: 1 });
      const splitDesc = new SplitType(heroDesc, { types: "words,lines" });
      gsap.from(splitDesc.words, {
        y: "80%",
        opacity: 0,
        stagger: 0.015,
        duration: 1,
        ease: "power3.out",
        delay: 0.6
      });
    }

    // Reveal Hero CTA and subtitles
    gsap.to(".hero-ctas, .hero-subtitles", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 1
    });

    // Reveal Hero subtext description
    gsap.to("#heroSubDesc", {
      opacity: 0.85,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 1
    });

    // Hero timeline overlay animations removed
  };

  // Hero Mouse Parallax Effect
  const heroSection = document.querySelector(".hero-section");
  if (heroSection) {
    heroSection.addEventListener("mousemove", (e) => {
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth - 0.5) * 2;
      const yPercent = (clientY / window.innerHeight - 0.5) * 2;

      // Slight tilt on title
      gsap.to(".hero-title", {
        x: xPercent * 20,
        y: yPercent * 15,
        rotateX: -yPercent * 6,
        rotateY: xPercent * 6,
        duration: 0.8,
        ease: "power2.out"
      });

      // Video offset opposite to mouse direction
      gsap.to(".hero-video-bg", {
        x: -xPercent * 30,
        y: -yPercent * 25,
        scale: 1.06,
        duration: 1.2,
        ease: "power2.out"
      });

    });

    heroSection.addEventListener("mouseleave", () => {
      gsap.to(".hero-title", { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 1, ease: "power2.out" });
      gsap.to(".hero-video-bg", { x: 0, y: 0, scale: 1, duration: 1.5, ease: "power2.out" });
    });
  }

  // Hero Live Timecode update
  const heroTimecode = document.getElementById("heroTimecode");
  if (heroTimecode) {
    setInterval(() => {
      const now = new Date();
      const hrs = String(now.getHours() % 12 || 12).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const frames = String(Math.floor(now.getMilliseconds() / 33)).padStart(2, '0');
      heroTimecode.textContent = `${hrs}:${mins}:${secs}:${frames}`;
    }, 33);
  }

  /* ==========================================================
     3. INTERACTIVE CUSTOM CURSOR & MAGNETIC BUTTONS
     ========================================================== */
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");

  if (cursorDot && cursorRing) {
    const dotPos = { x: 0, y: 0 };
    const ringPos = { x: 0, y: 0 };

    const dotXTo = gsap.quickTo(cursorDot, "left", { duration: 0.1, ease: "power3.out" });
    const dotYTo = gsap.quickTo(cursorDot, "top", { duration: 0.1, ease: "power3.out" });
    const ringXTo = gsap.quickTo(cursorRing, "left", { duration: 0.3, ease: "power3.out" });
    const ringYTo = gsap.quickTo(cursorRing, "top", { duration: 0.3, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      dotPos.x = e.clientX;
      dotPos.y = e.clientY;
      ringPos.x = e.clientX;
      ringPos.y = e.clientY;

      dotXTo(dotPos.x);
      dotYTo(dotPos.y);
      ringXTo(ringPos.x);
      ringYTo(ringPos.y);
    });

    // Hover triggers setup
    const bindCursorHoverEvents = () => {
      const hoverButtons = document.querySelectorAll("a, button, .category-nav-btn, .submit-btn, input, textarea, .skill-floating-card, .magnetic-btn");
      hoverButtons.forEach(btn => {
        btn.addEventListener("mouseenter", () => {
          document.body.classList.add("hovering-button");
        });
        btn.addEventListener("mouseleave", () => {
          document.body.classList.remove("hovering-button");
        });
      });

      const hoverVideos = document.querySelectorAll(".video-project-card");
      hoverVideos.forEach(vid => {
        vid.addEventListener("mouseenter", () => {
          document.body.classList.add("hovering-video");
        });
        vid.addEventListener("mouseleave", () => {
          document.body.classList.remove("hovering-video");
        });
      });
    };

    bindCursorHoverEvents();
    window.addEventListener("resize", bindCursorHoverEvents);
  }

  // Magnetic Button Interactions
  const setupMagneticButtons = () => {
    const magneticBtns = document.querySelectorAll(".magnetic-btn");
    
    magneticBtns.forEach(btn => {
      btn.addEventListener("mousemove", (e) => {
        const bounds = btn.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;
        
        // Calculate offsets relative to the element center
        const xOffset = (mouseX - bounds.width / 2) * 0.45;
        const yOffset = (mouseY - bounds.height / 2) * 0.45;

        gsap.to(btn, {
          x: xOffset,
          y: yOffset,
          duration: 0.35,
          ease: "power2.out"
        });
      });

      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.35)"
        });
      });
    });
  };
  setupMagneticButtons();

  /* ==========================================================
     4. ABOUT SECTION SCROLL EFFECTS & 3D TILT
     ========================================================== */
  // Portrait reveal mask ScrollTrigger
  gsap.to(".about-portrait-mask", {
    scaleY: 0,
    duration: 1.5,
    ease: "power3.inOut",
    scrollTrigger: {
      trigger: ".about-section",
      start: "top 70%",
      end: "bottom 30%",
      toggleActions: "play none none reverse"
    }
  });

  gsap.to(".about-portrait", {
    scale: 1,
    duration: 1.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".about-section",
      start: "top 70%",
      end: "bottom 30%",
      toggleActions: "play none none reverse"
    }
  });

  // Portrait 3D depth mouse tilt
  const aboutLeft = document.querySelector(".about-left");
  if (aboutLeft) {
    aboutLeft.addEventListener("mousemove", (e) => {
      const bounds = aboutLeft.getBoundingClientRect();
      const xPercent = ((e.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const yPercent = ((e.clientY - bounds.top) / bounds.height - 0.5) * 2;

      gsap.to(".about-portrait", {
        x: xPercent * 12,
        y: yPercent * 12,
        scale: 1.06,
        rotateY: xPercent * 5,
        rotateX: -yPercent * 5,
        duration: 0.6,
        ease: "power2.out"
      });
    });

    aboutLeft.addEventListener("mouseleave", () => {
      gsap.to(".about-portrait", { 
        x: 0, 
        y: 0, 
        scale: 1, 
        rotateX: 0, 
        rotateY: 0, 
        duration: 1, 
        ease: "power2.out" 
      });
    });
  }

  // Bio Dynamic Text Split reveal
  const aboutText = document.getElementById("aboutDynamicText");
  if (aboutText) {
    const splitText = new SplitType(aboutText, { types: "words" });
    gsap.from(splitText.words, {
      opacity: 0.2,
      stagger: 0.015,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".about-section",
        start: "top 65%",
        end: "top 20%",
        scrub: true
      }
    });
  }

  // Stagger reveal of What I Do cards
  gsap.to(".what-card", {
    opacity: 1,
    y: 0,
    stagger: 0.15,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".what-i-do-container",
      start: "top 75%",
      toggleActions: "play none none reverse"
    }
  });

  // Floating skills cards entry - use ScrollTrigger for reliable reveal
  gsap.to(".skill-floating-card", {
    opacity: 1,
    y: 0,
    scale: 1,
    stagger: 0.06,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".skills-container",
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });

  // Micro floating drifts for skills on mouse movement
  const skillsContainer = document.querySelector(".skills-wrapper-floating");
  if (skillsContainer) {
    skillsContainer.addEventListener("mousemove", (e) => {
      const bounds = skillsContainer.getBoundingClientRect();
      const xPercent = (e.clientX - bounds.left) / bounds.width - 0.5;
      const yPercent = (e.clientY - bounds.top) / bounds.height - 0.5;

      const skillCards = document.querySelectorAll(".skill-floating-card");
      skillCards.forEach((card, idx) => {
        const factor = (idx % 3 + 1) * 8;
        gsap.to(card, {
          x: xPercent * factor,
          y: yPercent * factor,
          duration: 0.8,
          ease: "power2.out"
        });
      });
    });

    skillsContainer.addEventListener("mouseleave", () => {
      gsap.to(".skill-floating-card", {
        x: 0,
        y: 0,
        duration: 1,
        ease: "power2.out"
      });
    });
  }

  // Stats Counter Scroll Animation
  const statNumbers = document.querySelectorAll(".stat-number");
  if (statNumbers.length) {
    ScrollTrigger.create({
      trigger: "#statsBar",
      start: "top 80%",
      toggleActions: "play none none reverse",
      onEnter: () => {
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute("data-target"), 10);
          const suffix = el.id === "stat4" ? "M+" : "+";
          gsap.to({ val: 0 }, {
            val: target,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: function() {
              el.textContent = Math.round(this.targets()[0].val) + suffix;
            },
            onComplete: function() {
              el.textContent = target + suffix;
            }
          });
        });
      },
      onLeaveBack: () => {
        statNumbers.forEach(el => {
          const suffix = el.id === "stat4" ? "M+" : "+";
          el.textContent = "0" + suffix;
        });
      }
    });
  }

  /* ==========================================================
     5. PROJECTS SEQUENTIAL SHOWCASE LAYOUT ANIMATIONS
     ========================================================== */
  
  // Premium General Scroll-Reveal for Section Headings
  document.querySelectorAll(".section-title, .contact-headline").forEach(title => {
    const split = new SplitType(title, { types: "chars,words" });
    gsap.from(split.chars, {
      opacity: 0,
      y: 40,
      rotate: 4,
      stagger: 0.02,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: title,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // --- Category Showcase Grid Entry Animations ---
  gsap.from("#weddings-block .video-project-card", {
    opacity: 0,
    y: 40,
    stagger: 0.08,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "#projects",
      start: "top 75%",
      toggleActions: "play none none reverse"
    }
  });

  // --- Category Active Navigation Tab Switcher ---
  const categoryBlocks = document.querySelectorAll(".category-block");
  const categoryNavBtns = document.querySelectorAll(".projects-categories-nav .category-nav-btn");

  let isSwitchingCategory = false;

  categoryNavBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (isSwitchingCategory) return;

      const targetId = btn.getAttribute("data-target");
      const targetBlock = document.getElementById(targetId);
      const activeBlock = document.querySelector(".category-block.active");

      if (activeBlock === targetBlock) return;

      isSwitchingCategory = true;

      // Update active nav button class
      categoryNavBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // 1. Fade out currently active block
      gsap.to(activeBlock, {
        opacity: 0,
        y: -15,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          activeBlock.classList.remove("active");
          activeBlock.style.display = "none";

          // 2. Prepare target block state (hidden but set to display: block)
          targetBlock.style.display = "block";
          targetBlock.classList.add("active");

          const targetHeader = targetBlock.querySelector(".category-header");
          const targetCards = targetBlock.querySelectorAll(".video-project-card");

          // Set starting position for target block elements
          gsap.set(targetBlock, { opacity: 0 });
          gsap.set(targetHeader, { opacity: 0, y: 15 });
          gsap.set(targetCards, { opacity: 0, y: 30 });

          // 3. Fade in target block container
          gsap.to(targetBlock, {
            opacity: 1,
            duration: 0.1
          });

          // 4. Stagger reveal header and project cards
          const tl = gsap.timeline({
            onComplete: () => {
              isSwitchingCategory = false;
              ScrollTrigger.refresh();
            }
          });

          tl.to(targetHeader, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out"
          })
          .to(targetCards, {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: "power3.out"
          }, "-=0.25");
        }
      });
    });
  });

  // Card Hover to play and pause video logic
  const projectCards = document.querySelectorAll(".video-project-card");
  projectCards.forEach(card => {
    const video = card.querySelector(".project-card-video");
    
    if (video) {
      card.addEventListener("mouseenter", () => {
        video.play().catch(err => {
          console.log("Hover video play blocked, waiting for user action.", err);
        });
      });

      card.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0; // Reset
      });
    }
  });

  /* ==========================================================
     6. FULL-SCREEN VIDEO MODAL PLAYBACK
     ========================================================== */
  const videoOverlay = document.getElementById("fullscreenVideoOverlay");
  const modalPlayer = document.getElementById("fullscreenVideoPlayer");
  const closeModalBtn = document.getElementById("closeVideoModal");

  // Open overlay on card click
  projectCards.forEach(card => {
    card.addEventListener("click", () => {
      const videoSrc = card.getAttribute("data-video");
      if (videoOverlay && modalPlayer && videoSrc) {
        modalPlayer.src = videoSrc;
        modalPlayer.load();
        
        videoOverlay.classList.add("active");
        modalPlayer.play().catch(e => console.warn("Player play error:", e));

        if (lenis) lenis.stop();
      }
    });
  });

  // Close player
  const closeVideoModalOverlay = () => {
    if (videoOverlay && modalPlayer) {
      videoOverlay.classList.remove("active");
      modalPlayer.pause();
      modalPlayer.src = "";
      
      if (lenis) lenis.start();
    }
  };

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeVideoModalOverlay();
    });
  }

  if (videoOverlay) {
    videoOverlay.addEventListener("click", () => {
      closeVideoModalOverlay();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeVideoModalOverlay();
    }
  });

  /* ==========================================================
     7. CONTACT GLOW REACTION
     ========================================================== */
  const contactSection = document.querySelector(".contact-section");
  const glowBg = document.querySelector(".contact-glow-bg");

  if (contactSection && glowBg) {
    contactSection.addEventListener("mousemove", (e) => {
      const bounds = contactSection.getBoundingClientRect();
      // Track coordinates relative to center of the contact box
      const x = e.clientX - bounds.left - bounds.width / 2;
      const y = e.clientY - bounds.top - bounds.height / 2;

      gsap.to(glowBg, {
        x: x * 0.45,
        y: y * 0.45,
        duration: 0.5,
        ease: "power2.out"
      });
    });

    contactSection.addEventListener("mouseleave", () => {
      gsap.to(glowBg, { x: 0, y: 0, duration: 1, ease: "power2.out" });
    });
  }

  /* ==========================================================
     8. FOOTER LINE ANGLE REVEAL
     ========================================================== */
  gsap.to(".footer-line-reveal", {
    scaleX: 1,
    duration: 1.5,
    ease: "power3.inOut",
    scrollTrigger: {
      trigger: "footer",
      start: "top 95%",
      toggleActions: "play none none reverse"
    }
  });

  /* ==========================================================
     9. COLOR GRADING SLIDER INTERACTION
     ========================================================== */
  const sliderContainer = document.getElementById("gradingSliderContainer");
  const gradedImageWrapper = document.getElementById("gradedImageWrapper");
  const sliderHandle = document.getElementById("sliderHandle");

  if (sliderContainer && gradedImageWrapper && sliderHandle) {
    let isDragging = false;

    const updateImageWidths = () => {
      const containerWidth = sliderContainer.offsetWidth;
      const images = sliderContainer.querySelectorAll("img");
      images.forEach(img => {
        img.style.width = `${containerWidth}px`;
      });
    };

    const setSliderPosition = (clientX) => {
      const rect = sliderContainer.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      
      // Clamp values between 0 and container width
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      gradedImageWrapper.style.width = `${percentage}%`;
      sliderHandle.style.left = `${percentage}%`;
    };

    const startDrag = (e) => {
      isDragging = true;
      document.body.classList.add("dragging-slider");
      if (typeof lenis !== "undefined" && lenis) lenis.stop(); // Stop scroll when dragging
    };

    const drag = (e) => {
      if (!isDragging) return;
      if (e.touches && e.cancelable) {
        e.preventDefault();
      }
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setSliderPosition(clientX);
    };

    const endDrag = () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove("dragging-slider");
        if (typeof lenis !== "undefined" && lenis) lenis.start(); // Resume scroll
      }
    };

    // Mouse Listeners
    sliderHandle.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", endDrag);

    // Touch Listeners
    sliderHandle.addEventListener("touchstart", startDrag, { passive: true });
    window.addEventListener("touchmove", drag, { passive: false });
    window.addEventListener("touchend", endDrag);

    // Click inside container to jump slider
    sliderContainer.addEventListener("click", (e) => {
      if (e.target !== sliderHandle && !sliderHandle.contains(e.target)) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setSliderPosition(clientX);
      }
    });

    // Initial setup and responsive update
    updateImageWidths();
    window.addEventListener("resize", updateImageWidths);

    // Register with ScrollTrigger refresh to recalculate on layout changes
    ScrollTrigger.addEventListener("refresh", updateImageWidths);
  }

  /* ==========================================================
     MOBILE HAMBURGER MENU INTERACTION
     ========================================================== */
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const mobileMenuLinks = document.querySelectorAll(".mobile-menu-link");

  const toggleMobileMenu = () => {
    const isOpen = mobileMenuBtn.classList.toggle("active");
    mobileNavOverlay.classList.toggle("active", isOpen);

    if (isOpen) {
      if (typeof lenis !== "undefined" && lenis) lenis.stop();
      document.body.classList.add("lock-scroll");
      
      // Animate overlay menu items
      gsap.to(mobileMenuLinks, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto"
      });
    } else {
      if (typeof lenis !== "undefined" && lenis) lenis.start();
      document.body.classList.remove("lock-scroll");
      
      // Hide overlay menu items
      gsap.to(mobileMenuLinks, {
        y: 30,
        opacity: 0,
        stagger: 0.05,
        duration: 0.3,
        ease: "power3.in",
        overwrite: "auto"
      });
    }
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", toggleMobileMenu);
  }

  // Close menu & smooth scroll on clicking menu item
  mobileMenuLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (mobileMenuBtn.classList.contains("active")) {
        toggleMobileMenu();
      }

      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        setTimeout(() => {
          if (typeof lenis !== "undefined" && lenis) lenis.scrollTo(target);
        }, 350); // Small delay for menu close curtain
      }
    });
  });

  // Mobile overlay close button
  const mobileCloseBtn = document.getElementById("mobileCloseBtn");
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener("click", () => {
      if (mobileMenuBtn.classList.contains("active")) {
        toggleMobileMenu();
      }
    });
  }

  /* ==========================================================
     LENIS SMOOTH SCROLL ANCHOR CLICKS
     ========================================================== */
  document.querySelectorAll('a[href^="#"]:not(.mobile-menu-link)').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId.length <= 1) return;
      e.preventDefault();
      
      const target = document.querySelector(targetId);
      if (target && typeof lenis !== "undefined" && lenis) {
        lenis.scrollTo(target);
      }
    });
  });

  /* ==========================================================
     CUSTOM CURSOR BOUNDS VISIBILITY CLEANUP
     ========================================================== */
  const cursorElements = [document.querySelector(".cursor-dot"), document.querySelector(".cursor-ring")].filter(Boolean);
  
  document.addEventListener("mouseleave", () => {
    gsap.to(cursorElements, { opacity: 0, duration: 0.2 });
  });

  document.addEventListener("mouseenter", () => {
    gsap.to(cursorElements, { opacity: 1, duration: 0.2 });
  });

  /* ==========================================================
     EXTRA PREMIUM SCROLL REVEALS
     ========================================================== */
  // Grading Slider reveal
  gsap.to(".grading-slider-container", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".grading-slider-container",
      start: "top 85%",
      toggleActions: "play none none reverse"
    }
  });

  // Contact page grids reveal
  gsap.to(".contact-card-glass", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".contact-card-glass",
      start: "top 85%",
      toggleActions: "play none none reverse"
    }
  });

  gsap.from(".contact-left > *", {
    opacity: 0,
    x: -30,
    stagger: 0.1,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".contact-left",
      start: "top 85%",
      toggleActions: "play none none reverse"
    }
  });
  };
});

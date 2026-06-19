import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// Import Visual Assets and Subcomponents
import NoiseOverlay from './NoiseOverlay';
import CustomCursor from './CustomCursor';
import Loader from './Loader';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import GradingShowcase from './GradingShowcase';
import Projects from './Projects';
import Contact from './Contact';
import Footer from './Footer';
import VideoModal from './VideoModal';

// Seeding Fallback Configs
const defaultFallbackSettings = {
  name: 'Akshat Jain',
  subtitles: ['VIDEO EDITOR', 'CONTENT CREATOR'],
  heroDesc: 'Turning Footage Into Stories Remembered.',
  heroSubDesc: 'From wedding films to brand campaigns and viral reels, I create edits that capture attention and drive engagement.',
  heroCtaText: 'View Projects',
  heroBgVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-creative-video-editor-at-workplace-41662-large.mp4',
  heroBgPosterUrl: '',
  bioText: "Hi, I'm Akshat Jain, a passionate Video Editor and Content Creator focused on creating engaging visual stories that connect with audiences and help brands stand out.",
  bioHighlight: "I believe editing is not just cutting clips—it's about creating emotions, increasing engagement, and turning ordinary footage into memorable content.",
  portraitUrl: '',
  stats: [
    { id: 'stat1', number: 100, label: 'Projects Delivered', suffix: '+' },
    { id: 'stat2', number: 50, label: 'Happy Clients', suffix: '+' },
    { id: 'stat3', number: 3, label: 'Years Experience', suffix: '+' },
    { id: 'stat4', number: 1.5, label: 'Million+ Views', suffix: 'M+' }
  ],
  socials: {
    email: 'hello@akshatjain.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    whatsapp: 'https://wa.me/919999999999',
    facebook: 'https://facebook.com',
    phone: '+91 99999 99999',
    contactCta: "LET'S WORK TOGETHER"
  }
};

const defaultFallbackSkills = [
  { _id: 'sk1', name: 'After Effects', iconType: 'after-effects' },
  { _id: 'sk2', name: 'Premiere Pro', iconType: 'premiere-pro' },
  { _id: 'sk3', name: 'CapCut PC', iconType: 'capcut' },
  { _id: 'sk4', name: 'Content Creation', iconType: 'video' },
  { _id: 'sk5', name: 'Typography Reels', iconType: 'typography' },
  { _id: 'sk6', name: 'Wedding Editing', iconType: 'wedding' },
  { _id: 'sk7', name: 'Brand Shoot Editing', iconType: 'brand' },
  { _id: 'sk8', name: 'Brand Commercial Editing', iconType: 'commercial' },
  { _id: 'sk9', name: 'Trending Reel Editing', iconType: 'trending' },
  { _id: 'sk10', name: 'Motion Graphics', iconType: 'motion' }
];

const defaultFallbackCategories = [
  { _id: 'c1', title: 'Wedding Films', key: 'wedding-films', description: '01 / ELEGANT', vertical: false },
  { _id: 'c2', title: 'Brand Shoots', key: 'brand-shoots', description: '02 / CAMPAIGNS', vertical: false },
  { _id: 'c3', title: 'UGC', key: 'trending-reels', description: '03 / VIRAL', vertical: true },
  { _id: 'c4', title: 'Motion Graphics', key: 'commercial-edits', description: '04 / COMMERCIAL', vertical: false },
  { _id: 'c5', title: 'Social Content', key: 'social-media-content', description: '05 / AUDIENCE', vertical: false }
];

const defaultFallbackVideos = [
  { _id: 'w1', title: 'Forest Vows', category: { _id: 'c1', key: 'wedding-films' }, videoUrl: '/assets/videos/wedding-shoot-1.mp4', posterUrl: '/assets/project4.png', tag: 'Wedding Film', aspectRatio: '16/9' },
  { _id: 'w2', title: 'The Promise', category: { _id: 'c1', key: 'wedding-films' }, videoUrl: '/assets/videos/wedding-shoot-2.mp4', posterUrl: '/assets/wedding_poster.png', tag: 'Wedding Short', aspectRatio: '16/9' },
  { _id: 'w3', title: 'Winter Embrace', category: { _id: 'c1', key: 'wedding-films' }, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-couple-kissing-under-the-snow-at-night-44330-large.mp4', posterUrl: '/assets/wedding_poster.png', tag: 'Wedding Narrative', aspectRatio: '16/9' },
  { _id: 'b1', title: 'Elegance Editorial', category: { _id: 'c2', key: 'brand-shoots' }, videoUrl: '/assets/videos/tharva.mp4', posterUrl: '/assets/fashion_editorial.png', tag: 'Brand Campaign', aspectRatio: '16/9' },
  { _id: 'b2', title: 'Glass & Focus', category: { _id: 'c2', key: 'brand-shoots' }, videoUrl: '/assets/videos/indus-01.mp4', posterUrl: '/assets/project3.png', tag: 'Product Shoot', aspectRatio: '16/9' },
  { _id: 'r1', title: 'Creator Hooks', category: { _id: 'c3', key: 'trending-reels' }, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-recording-video-with-camera-on-tripod-41660-large.mp4', posterUrl: '/assets/project3.png', tag: 'Trending Reel', aspectRatio: '9/16' },
  { _id: 'r2', title: 'Neon Pulse', category: { _id: 'c3', key: 'trending-reels' }, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-42030-large.mp4', posterUrl: '/assets/project2.png', tag: 'Music Reel', aspectRatio: '9/16' }
];

export default function PortfolioHome() {
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState({
    settings: defaultFallbackSettings,
    skills: defaultFallbackSkills,
    categories: defaultFallbackCategories,
    videos: defaultFallbackVideos
  });

  const [activeModalVideo, setActiveModalVideo] = useState({ url: null, aspectRatio: '16/9' });
  
  const lenisRef = useRef(null);
  const mainWrapperRef = useRef(null);

  // Toggle class for custom cursor visibility to prevent hiding standard cursor in Admin Panel
  useEffect(() => {
    document.body.classList.add('custom-cursor-active');
    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  // 1. Fetch Dynamic Data from Express Server
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const [settingsRes, skillsRes, categoriesRes, videosRes] = await Promise.all([
          axios.get('/api/settings').catch(() => ({ data: { success: false } })),
          axios.get('/api/skills').catch(() => ({ data: { success: false } })),
          axios.get('/api/categories').catch(() => ({ data: { success: false } })),
          axios.get('/api/videos').catch(() => ({ data: { success: false } }))
        ]);

        const newData = {};
        newData.settings = settingsRes.data?.success ? settingsRes.data.settings : defaultFallbackSettings;
        newData.skills = skillsRes.data?.success && skillsRes.data.skills.length > 0 ? skillsRes.data.skills : defaultFallbackSkills;
        newData.categories = categoriesRes.data?.success && categoriesRes.data.categories.length > 0 ? categoriesRes.data.categories : defaultFallbackCategories;
        newData.videos = videosRes.data?.success && videosRes.data.videos.length > 0 ? videosRes.data.videos : defaultFallbackVideos;

        setDbData(newData);
      } catch (err) {
        console.warn('Backend connection failed, loading local portfolio backups:', err.message);
      }
    };

    fetchPortfolioData();
  }, []);

  // 2. Initialize GSAP ScrollTrigger & Lenis Smooth Scroll
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const isDesktop = window.innerWidth >= 1025;
    let lenisInst;
    if (isDesktop) {
      try {
        lenisInst = new Lenis({
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

        lenisRef.current = lenisInst;

        lenisInst.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenisInst.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
        
        // Stop scrolling while loader is running
        if (loading) {
          lenisInst.stop();
          document.body.classList.add('lock-scroll');
        }
      } catch (error) {
        console.error('Lenis smooth scroll failed to initialize:', error);
      }
    } else {
      if (loading) {
        document.body.classList.add('lock-scroll');
      }
    }

    return () => {
      try {
        if (lenisInst) {
          lenisInst.destroy();
        }
      } catch (err) {
        console.warn('Failed to destroy Lenis:', err);
      }
      try {
        ScrollTrigger.getAll().forEach(t => t.kill());
      } catch (err) {
        console.warn('Failed to kill ScrollTriggers:', err);
      }
      document.body.classList.remove('lock-scroll');
    };
  }, []);

  // 3. Unlock scrolling when loader finishes
  const handleLoaderComplete = () => {
    setLoading(false);
    document.body.classList.remove('lock-scroll');
    if (lenisRef.current) {
      lenisRef.current.start();
      // Ensure layout triggers calculations correctly
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
    }
  };

  const handleOpenVideoModal = (videoUrl, aspectRatio) => {
    setActiveModalVideo({ url: videoUrl, aspectRatio: aspectRatio || '16/9' });
    if (lenisRef.current) lenisRef.current.stop();
  };

  const handleCloseVideoModal = () => {
    setActiveModalVideo({ url: null, aspectRatio: '16/9' });
    if (lenisRef.current) lenisRef.current.start();
  };

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      {/* 1. Cinematic Film Overlays */}
      <NoiseOverlay />
      
      {/* 2. Custom Cinematic Cursor */}
      <CustomCursor />

      {/* 3. Loader Curtain (removes itself after animate completes) */}
      <Loader onComplete={handleLoaderComplete} />

      {/* 4. Top Header & Nav */}
      <Header lenis={lenisRef.current} />

      {/* 5. Smooth Scroll Wrapper */}
      <main ref={mainWrapperRef} id="smoothScrollWrapper" className="w-full">
        {/* Home/Hero */}
        <Hero settings={dbData.settings} />

        {/* About & Arsenal */}
        <About settings={dbData.settings} skills={dbData.skills} />

        {/* Color Grading Swipe Slider */}
        <GradingShowcase />

        {/* Dynamic Categorized Videos Showcase */}
        <Projects 
          categories={dbData.categories} 
          videos={dbData.videos} 
          onOpenVideo={handleOpenVideoModal}
        />

        {/* Glass Form Contact Inquiries */}
        <Contact settings={dbData.settings} />

        {/* Bottom footer credit */}
        <Footer />
      </main>

      {/* 6. Fullscreen Modal Player popup */}
      <VideoModal videoUrl={activeModalVideo.url} aspectRatio={activeModalVideo.aspectRatio} onClose={handleCloseVideoModal} />
    </div>
  );
}

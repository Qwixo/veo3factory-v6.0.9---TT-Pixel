import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Brain, Shield, Bot, DollarSign } from 'lucide-react';
import './HomePage.css';
import '../styles/timeline.css';
import { Modal } from "./Modal";
import { useAccumulatedTimer, useExitIntent, hasSeenWithin, markSeenFor } from "./hooks";



// TikTok tracking helper
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void };
  }
}
const ttqTrack = (
  name: string,
  props: Record<string, any> = {},
  opts?: Record<string, any>
) => {
  try {
    if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track(name, props, opts);
    }
  } catch {}
};



// --- dev-helper: clear popup locks via console or querystring ---
if (typeof window !== "undefined") {
  (window as any).__pop = {
    reset() {
      ["modal_why_until","modal_late_until","modal_wait_until","modal_checkout_until"]
        .forEach(k => localStorage.removeItem(k));
      console.log("[popups] reset done");
    }
  };
  // e.g. /?debugPopups=1 forces a reset on load
  if (new URLSearchParams(location.search).get("debugPopups") === "1") (window as any).__pop.reset();
}


function SlimStickyNotice() {


  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const hero = document.querySelector(".hero-section");
    if (!hero) return;

    // Reveal when <60% of hero remains in view (~40% scrolled)
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio < 0.6),
      { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className={`ssn ${visible ? "ssn--on" : "ssn--off"}`} aria-live="polite">
        <div className="ssn__wrap">
          <div className="ssn__inner">
            <span className="ssn__label">EARLY ACCESS (100 SPOTS)</span>
            <span className="ssn__sep" aria-hidden="true">|</span>
            <span className="ssn__count">
              <span className="ssn__num">17 LEFT</span>
              <span className="ssn__dot" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .ssn{
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 9999;
          background: rgba(15,15,15,0.96);
          backdrop-filter: saturate(120%) blur(2px);
          border-bottom: 1px solid rgba(255,215,0,0.18);
          transform: translateY(-100%);
          transition: transform .25s ease;
          font-family: inherit; /* <- use the same font as the site */
        }
        .ssn--on  { transform: translateY(0); }

        .ssn__wrap{
          max-width: 1200px; margin: 0 auto;
        }
        .ssn__inner{
          display: flex; align-items: center; justify-content: center;
          gap: 12px;
          min-height: 40px;
          padding: 8px 12px;
          color: #fff;                 /* white text */
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: .01em;
          text-align: center;
        }
        .ssn__sep{
          opacity: .6;
          padding: 0 2px;
        }
        .ssn__count{
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ssn__num{ color: #fff; }
        .ssn__suffix{ color: #fff; opacity: .95; }

        /* Bigger dot, smaller pulse */
        .ssn__dot{
          width: 10px; height: 10px; border-radius: 50%;
          background: #ff4d4d; /* red */
          box-shadow: 0 0 0 0 rgba(255,77,77,0.0);
          animation: pulseSmall 1.9s ease-in-out infinite;
          flex: 0 0 10px;
        }
        @keyframes pulseSmall{
          0%   { transform: scale(1);   box-shadow: 0 0 0 0   rgba(255,77,77,0.00); }
          50%  { transform: scale(1.03); box-shadow: 0 0 0 3px rgba(255,77,77,0.18); }
          100% { transform: scale(1);   box-shadow: 0 0 0 0   rgba(255,77,77,0.00); }
        }

        @media (max-width: 768px){
          .ssn__inner{ font-size: 12.5px; gap: 10px; min-height: 36px; padding: 7px 10px; }
          .ssn__dot{ width: 9px; height: 9px; }
        }
        @media (prefers-reduced-motion: reduce){
          .ssn{ transition: none; }
          .ssn__dot{ animation: none; }
        }
      `}</style>
    </>
  );
}







export default function HomePage() {
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  // remember when the page was loaded
const pageLoadAt = React.useRef(Date.now()).current;





  



  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: '23',
    minutes: '47',
    seconds: '33'
  });

  // Screenshots gallery state
  const [isScrolling, setIsScrolling] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

// this is for smooth scrolling with the buttons in the social proof section
const smoothScrollBy = (distance: number, duration: number = 500) => {
  const start = galleryRef.current.scrollLeft;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    galleryRef.current.scrollLeft = start + distance * progress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

  

  // Spots counter state
  const [spotsLeft, setSpotsLeft] = useState(17);

// HANDLE ADD TO CART FOR FB + TIKTOK
const handleAddToCart = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddToCart');
    console.log('fbq: AddToCart sent');
  }
  // TikTok mirror
  ttqTrack('AddToCart', {
    contents: [{
      content_id: 'veo3factory',
      content_type: 'product',
      content_name: 'Veo3Factory Lifetime'
    }],
    value: 97,
    currency: 'USD',
    status: 'initiated'
  });
};



const heroContainerRef = useRef<HTMLDivElement | null>(null); // the <div id="heroPlayer">
const heroPlayerRef = useRef<any>(null);                       // the YT.Player instance

const [showOverlayPlay, setShowOverlayPlay] = useState(true);

// optional: loop just the “hook” before click (seconds)
const HOOK_START = 0;
const HOOK_END = 999999; // set to a large number to disable the loop 


// after 10s, allow exit-intent detection
useEffect(() => {
  const id = setTimeout(() => {
    setReadyForExitIntent(true);
    setExitIntent(false); // 🔥 clear stale signal triggered before 10s
  }, 10000);
  return () => clearTimeout(id);
}, []);




useEffect(() => {
  let animationFrameId: number;
  const scrollSpeed = 0.5;

  const scrollGallery = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollLeft += scrollSpeed;

      const scrollWidth = galleryRef.current.scrollWidth / 2;
      if (galleryRef.current.scrollLeft >= scrollWidth) {
        galleryRef.current.scrollLeft = 0;
      }
    }
    animationFrameId = requestAnimationFrame(scrollGallery);
  };

  animationFrameId = requestAnimationFrame(scrollGallery);



  
  return () => cancelAnimationFrame(animationFrameId);
}, []);

  

const thStyle = {
  padding: '12px 8px',
  textAlign: 'center',
  color: '#FFD700',
  fontWeight: '700',
  fontSize: '16px'
};

const tdStyle = {
  padding: '12px 8px',
  color: '#e0e0e0',
  fontWeight: '600',
  fontSize: '14px'
};

const tdCenterStyle = {
  ...tdStyle,
  textAlign: 'center',
  color: '#cccccc'
};

const trStyle = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'background 0.3s ease'
};


  // Countdown timer effect
  useEffect(() => {
    const now = new Date().getTime();
    const endTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    const timer = setInterval(() => {
      const currentTime = new Date().getTime();
      const timeLeft = endTime - currentTime;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setTimeLeft({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);






// ✅ build the YT player once
useEffect(() => {
  let endedWatcher: number | null = null;
  let destroyed = false;

  const ensureYT = () =>
    new Promise<void>((resolve) => {
      if ((window as any).YT?.Player) return resolve();
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => resolve();
    });

  ensureYT().then(() => {
    if (destroyed) return;
    const YT = (window as any).YT as typeof window.YT;
    const el = heroContainerRef.current || document.getElementById("heroPlayer");
    if (!el) return;

    heroPlayerRef.current = new YT.Player(el as any, {
      videoId: "1RSQWAuBVnE",
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        start: HOOK_START,
      },
      events: {
        onReady: (e: YT.PlayerEvent) => {
          e.target.playVideo();
          setIsWatchingVideo(false);
          endedWatcher = window.setInterval(() => {
            try {
              const p = heroPlayerRef.current;
              if (!p) return;
              if (typeof HOOK_END === "number" && showOverlayPlay) {
                const t = typeof p.getCurrentTime === "function" ? p.getCurrentTime() : 0;
                if (t >= HOOK_END) p.seekTo(HOOK_START, true);
              }
            } catch {}
          }, 250);
        },
        onStateChange: (e: YT.OnStateChangeEvent) => {
          const p = heroPlayerRef.current;
          const playing = e.data === YT.PlayerState.PLAYING;
          const canCheckMute = p && typeof p.isMuted === "function";
          const watching = !!p && playing && canCheckMute && !p.isMuted();
          setIsWatchingVideo(watching);

          // once overlay is gone, show controls on the SAME player
          if (!showOverlayPlay) {
            e.target.setOption?.("playerVars", "controls", 1);
          }
        },
      },
    });
  });

  return () => {
    destroyed = true;
    if (endedWatcher) window.clearInterval(endedWatcher);
    try { heroPlayerRef.current?.destroy?.(); } catch {}
    heroPlayerRef.current = null;
  };
}, []); // ← empty deps (IMPORTANT)







  // Screenshots gallery functions
  const handleGalleryMouseDown = (e: React.MouseEvent) => {
    if (!galleryRef.current) return;
    
    setIsScrolling(true);
    const startX = e.pageX - galleryRef.current.offsetLeft;
    const scrollLeft = galleryRef.current.scrollLeft;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!galleryRef.current || !isScrolling) return;
      e.preventDefault();
      const x = e.pageX - galleryRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      galleryRef.current.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      setIsScrolling(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (!galleryRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    galleryRef.current.scrollLeft += scrollAmount;
  };

  const handleScreenshotClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };
// --- POPUP STATE ---
const [isWatchingVideo, setIsWatchingVideo] = React.useState(false); // real watching = playing & unmuted (NOT autoplay)
const [lastModalAt, setLastModalAt] = React.useState(0);
const cooldownOk = (gapMs = 90000) => Date.now() - lastModalAt > gapMs;
const [readyForExitIntent, setReadyForExitIntent] = React.useState(false);

const [realExitIntent, setRealExitIntent] = React.useState(false);


// Accumulate only while NOT watching
const whyTimer = useAccumulatedTimer({ running: !isWatchingVideo, targetMs: 120000 });      // 2 min non-watching
const lateTimer = useAccumulatedTimer({ running: !isWatchingVideo, targetMs: 480000 });    // 10 min non-watching

const [showWHY, setShowWHY] = React.useState(false);
const [showLATE, setShowLATE] = React.useState(false);
const [showWAIT, setShowWAIT] = React.useState(false);


// Capture UTM params on first page load
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const utmData = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
  };

  // If any UTM exists, save it for later pages
  if (Object.values(utmData).some(v => v)) {
    localStorage.setItem("utm_data", JSON.stringify(utmData));
    console.log("UTM data stored:", utmData);
  }
}, []);


const whySeen = hasSeenWithin("modal_why_until");
const lateSeen = hasSeenWithin("modal_late_until");
const waitSeen = hasSeenWithin("modal_wait_until");
const exitIntent = useExitIntent();

// Only pass through exitIntent if guard time passed
useEffect(() => {
  if (readyForExitIntent && exitIntent) {
    setRealExitIntent(true);
  } else {
    setRealExitIntent(false);
  }
}, [exitIntent, readyForExitIntent]);


  const toggleFaq = (faqId: string) => {
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  const screenshots = [
    { src: "https://i.imgur.com/UiDY9Tm.jpeg", alt: "TikTok Success Story 0", link: "https://www.tiktok.com/@getsocialwithab" },
    { src: "https://i.imgur.com/qVInXF9.jpeg", alt: "TikTok Success Story 1", link: "https://www.tiktok.com/@euph0r_" },
    { src: "https://i.imgur.com/MWQh3nO.jpeg", alt: "TikTok Success Story 2", link: "https://www.tiktok.com/@getsocialwithab" },
    { src: "https://i.imgur.com/LPYcnue.jpeg", alt: "TikTok Success Story 3", link: "https://www.tiktok.com/@slovakaibot" },
    { src: "https://i.imgur.com/V0YjfsM.jpeg", alt: "TikTok Success Story 4", link: "https://www.tiktok.com/@panda.herbert" },
    { src: "https://i.imgur.com/ikXM0S0.jpeg", alt: "TikTok Success Story 5", link: "https://www.tiktok.com/@sneznyclovek" },
    { src: "https://i.imgur.com/zzV6GNP.jpeg", alt: "TikTok Success Story 6", link: "https://www.tiktok.com/@hela_ai" },
    { src: "https://i.imgur.com/sbUHsPO.jpeg", alt: "TikTok Success Story 7", link: "https://www.tiktok.com/@hanyys__" },
    { src: "https://i.imgur.com/sWNqvo5.jpeg", alt: "TikTok Success Story 8", link: "https://www.tiktok.com/@mesiaczabavy" },
    { src: "https://i.imgur.com/9zJGHSI.jpeg", alt: "TikTok Success Story 9", link: "https://www.tiktok.com/@pjacefilms" },
    { src: "https://i.imgur.com/9qtQCnF.jpeg", alt: "TikTok Success Story 10", link: "https://www.tiktok.com/@ai_shorts_sk" },
    { src: "https://i.imgur.com/hJNEGMT.jpeg", alt: "TikTok Success Story 11", link: "https://www.tiktok.com/@Gonko0" },
    { src: "https://i.imgur.com/UjB5Ppf.jpeg", alt: "Instagram Success Story 1", link: "https://www.instagram.com/ai_mazinggg/" },
    { src: "https://i.imgur.com/sNmJx6Q.jpeg", alt: "Instagram Success Story 2", link: "https://www.instagram.com/tomlikesrobots/" },
    { src: "https://i.imgur.com/icKxXWx.jpeg", alt: "Instagram Success Story 3", link: "https://www.instagram.com/caquinhoia/" },
    { src: "https://i.imgur.com/4fUTqfi.jpeg", alt: "Instagram Success Story 4", link: "https://www.instagram.com/pabloprompt/" },
    { src: "https://i.imgur.com/hdYGC6V.jpeg", alt: "Instagram Success Story 5", link: "https://www.instagram.com/tomlikesrobots/" },
    { src: "https://i.imgur.com/TZ4Rha5.jpeg", alt: "Instagram Success Story 6", link: "https://www.instagram.com/world.ai.asmr/" },
    { src: "https://i.imgur.com/wwHzVsi.jpeg", alt: "Instagram Success Story 7", link: "https://www.instagram.com/ai.sources/" },
    { src: "https://i.imgur.com/7C6gGYf.jpeg", alt: "Instagram Success Story 8", link: "https://www.instagram.com/pov__sensei/" },
    { src: "https://i.imgur.com/FivCbwT.jpeg", alt: "Success Story 20" },
    { src: "https://i.imgur.com/vipESJP.jpeg", alt: "Success Story 21" }
    
  ];

const faqData = [
  {
    id: '1',
    icon: <Brain className="w-5 h-5" />,
    question: 'Do I need to know how to code?',
    answer: 'Nope. You don\'t need to write a single line of code. The system is pre-built. You just connect your accounts using copy-paste API keys — we show you how.'
  },
  {
    id: '2',
    icon: <Bot className="w-5 h-5" />,
    question: 'What do I actually get?',
    answer: 'You get a fully automated video content factory inside n8n. It creates stunning AI reels using Veo 3, GROK, GPT, and auto-posts them to TikTok, Instagram, or YouTube — without you touching anything.'
  },
  {
    id: '3',
    icon: <Shield className="w-5 h-5" />,
    question: 'What is n8n?',
    answer: 'n8n is the platform where your automation runs. Think of it like a smart robot that follows instructions 24/7. You don\'t need to build anything inside it — the whole workflow is already done for you.'
  },
  {
    id: '4',
    icon: <Bot className="w-5 h-5" />,
    question: 'Is this plug-and-play?',
    answer: 'Yes, once you connect your own API keys (we guide you), the system runs by itself. You don\'t need to design prompts, schedule posts, or generate videos — it handles all of that.'
  },
  {
    id: '5',
    icon: <DollarSign className="w-5 h-5" />,
    question: 'What if I don\'t have Veo 3 or GROK?',
    answer: 'You\'ll need to create your own accounts for Veo 3, GROK 4, and GPT. We\'ll show you where to get them and how to paste in your keys. It\'s quick and only needs to be done once.'
  },
  {
    id: '6',
    icon: <Bot className="w-5 h-5" />,
    question: 'How often does it post?',
    answer: 'Every 8 hours by default — you can change this easily in one setting. It auto-generates new, unique AI reels each time.'
  },
  {
    id: '7',
    icon: <DollarSign className="w-5 h- " />,
    question: 'How much does it cost to run the system?',
    answer: `It depends on your setup, but here’s the breakdown:
- **n8n**: Free if you self-host (0–15 USD/month on a server) or 20 USD/month on official n8n cloud.  
- **OpenAI (ChatGPT API)**: Around 0.01 USD per message. Most people spend ~1 USD/month unless you scale massively.  
- **KIA AI (Veo 3)**: 0.40 USD per 8s generation with the fast model, or 2 USD with the quality model. For most use cases, the fast model is more than enough.  
- **Postiz**: Free trials are possible, or 29 USD/month for full automation of scheduling & posting across all platforms.  

So overall, most users spend in the range of **$30–100/month** to keep everything running smoothly. - 3x/day every single day with the Veo3 FAST model.`
  }
];



// WHY (30s non-watching)
React.useEffect(() => {
  if (
    !showWHY &&
    !whySeen &&
    whyTimer.hit &&
    !isWatchingVideo &&   // suppress while video is playing
    cooldownOk() &&
    !showLATE &&
    !showWAIT
  ) {
    setShowWHY(true);
    setLastModalAt(Date.now());
  }
}, [showWHY, whySeen, whyTimer.hit, isWatchingVideo, showLATE, showWAIT]);

// LATE (3 min non-watching, spaced 60s from previous)
React.useEffect(() => {
  if (
    !showLATE &&
    !lateSeen &&
    lateTimer.hit &&
    !isWatchingVideo &&   // suppress while video is playing
    cooldownOk(60000) &&
    !showWHY &&
    !showWAIT
  ) {
    setShowLATE(true);
    setLastModalAt(Date.now());
  }
}, [showLATE, lateSeen, lateTimer.hit, isWatchingVideo, showWHY, showWAIT]);





// WAIT (exit-intent, desktop), one-shot — 10s guard + no fire while video is playing
React.useEffect(() => {
if (
  realExitIntent &&
  !isWatchingVideo &&
  !waitSeen &&
  !showWHY &&
  !showLATE
) {
    setShowWAIT(true);
    setLastModalAt(Date.now());
  }
}, [readyForExitIntent, exitIntent, waitSeen, showWHY, showLATE, isWatchingVideo]);


  return (
    <div className="min-h-screen bg-black text-white">
      <SlimStickyNotice />

<style>{`
  @keyframes continuousScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`}</style>



      
      
      {/* Yellow Cross */}
      <div className="yellow-cross hidden md:block">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0H14V10H24V14H14V32H10V14H0V10H10V0Z" fill="#FFD700"/>
        </svg>
      </div>
      
{/* 1. HERO SECTION */}
<section className="hero-section hero-fix" style={{ minHeight: 'auto', padding: '30px 0 50px 0' }}>
  {/* Scoped styles just for this section */}
  <style>{`
    .hero-fix .video-frame {
      position: relative;
      width: 100%;
      max-width: 800px;
      margin: 8px auto;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(255, 215, 0, 0.2);
    }
    .hero-fix .video-frame::before { content: ''; display: block; padding-top: 56.25%; } /* 16:9 */
    .hero-fix .video-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

    /* Guaranteed gaps (spacers) */
    .hero-fix .gap-headline-sub { height: 18px; }      /* between headline and subheadline */
    .hero-fix .gap-video-cta   { height: 26px; }      /* between video and CTA button   */

    @media (max-width: 768px) {
      .hero-fix { padding: 20px 0 32px 0 !important; }
      .hero-fix .hero-headline {
        margin-bottom: 6px !important;
        line-height: 1.15 !important;
        font-size: clamp(24px, 6vw, 32px);
      }
      .hero-fix .hero-subtext {
        margin-bottom: 12px !important;
        line-height: 1.4 !important;
        font-size: clamp(14px, 3.8vw, 16px);
      }
      .hero-fix .hero-headline br { display: none; }
      .hero-fix .gap-headline-sub { height: 12px; }
      .hero-fix .gap-video-cta   { height: 18px; }
    }

    @media (max-width: 1024px) {
      .hero-fix { padding-bottom: 36px !important; }
    }
  `}</style>

  <div className="container">
    {/* Main Headline */}
    <h1 className="hero-headline" style={{ marginBottom: 0 }}>
      AI Runs Your Social Media.<br />
      So You Can <span className="highlight">Earn While You Sleep</span>.
    </h1>

    {/* --- GAP 1: Headline -> Subheadline --- */}
    <div className="gap-headline-sub" aria-hidden="true" />

    {/* Subheadline */}
    <p
      className="hero-subtext"
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
        lineHeight: "1.45",
      }}
    >
      The first fully automated system that creates, edits, and posts viral content 24/7.
    </p>

    {/* Video */}
{/* Video with custom overlay play */}
<div className="video-frame hero-video">
<div id="heroPlayer" ref={heroContainerRef} />

  {/* Center play overlay (shows until user clicks) */}
{showOverlayPlay && (
  <button
    className="hero-video-overlay"
onClick={() => {
  const p = heroPlayerRef.current;
  if (!p) return;
  if (typeof p.unMute === "function") p.unMute();
  if (typeof p.setVolume === "function") p.setVolume(100); // optional but helpful
  if (typeof p.seekTo === "function") p.seekTo(0, true);
  if (typeof p.playVideo === "function") p.playVideo();
  setShowOverlayPlay(false);
}}

    aria-label="Play with sound from start"
  >
    ▶
  </button>
)}
</div>

{/* Scoped styles for overlay */}
<style>{`
  .hero-video { position: relative; }
  .hero-video #heroPlayer { position:absolute; inset:0; }
  .hero-video::before { content:''; display:block; padding-top:56.25%; } /* 16:9 */

  .hero-video .hero-video-overlay{
    position:absolute; inset:0; margin:auto; width:74px; height:74px;
    border-radius:50%; border:1px solid rgba(255,215,0,.55);
    background:rgba(0,0,0,.55);
    color:#FFD700; font-size:28px; line-height:74px; text-align:center;
    cursor:pointer; transition:transform .12s ease, background .12s ease;
  }
  .hero-video .hero-video-overlay:hover{
    transform:scale(1.04); background:rgba(0,0,0,.7);
  }
`}</style>

    {/* --- GAP 2: Video -> CTA --- */}
    <div className="gap-video-cta" aria-hidden="true" />

    {/* CTA */}
{/* HERO CTAs */}
<div
  style={{
    display: "flex",
    flexDirection: "column",   // stack the row + note vertically
    alignItems: "center",      // center the whole block
    gap: 10,
    marginTop: 12
  }}
>
  {/* Row: two buttons side-by-side */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,                 // exact spacing BETWEEN the buttons
      flexWrap: "wrap",
      maxWidth: 980,           // keeps row from stretching too wide
      margin: "0 auto"
    }}
  >
    {/* Left: main consumer CTA */}
    <Link
      to="/checkout"
      id="hero-cta"
      className="cta-button primary"
      onClick={handleAddToCart}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 28px",
        minWidth: 240,
        whiteSpace: "nowrap",
        margin: 0
      }}
    >
      Build My Viral AI Machine
    </Link>

{/* Business/demo CTA */}
<a
  href="/b2b-form.html"
  className="cta-button"
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 28px",
    minWidth: 240,
    whiteSpace: "nowrap",
    background: "transparent",
    border: "2px solid #fff",
    color: "#fff",
    fontWeight: 700,
    borderRadius: 8,
    textDecoration: "none",
    margin: 0
  }}
  onClick={(e) => {
    e.preventDefault(); // delay nav so tracking can fire
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead");
    }
    ttqTrack("ClickButton", {
      contents: [{ content_id: "b2b_demo_cta", content_type: "button", content_name: "B2B Demo" }],
      value: 0,
      currency: "USD"
    });
    setTimeout(() => { window.location.href = "/b2b-form.html"; }, 180);
  }}
>
  For Businesses: Request Custom Demo
</a>

  </div>

  {/* Note: sits UNDER the buttons, always centered */}
  <p
    style={{
      textAlign: "center",
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: 13,
      marginTop: 8,
      letterSpacing: "0.01em"
    }}
  >
    ⚡ Only {spotsLeft} spots left — don’t miss out
  </p>
</div>


  </div>
</section>




{/* 2. SOCIAL PROOF SECTION (fully working with requestAnimationFrame) */}
<section className="use-cases-section section-bg-blue" style={{ padding: '80px 0 60px 0', position: 'relative' }}>
  <div className="container">
    <h2 className="section-headline">
      <span>AI CONTENT <span className="highlight">SIMPLY WORKS</span></span>
    </h2>

    <div style={{
      width: '100vw',
      margin: '24px calc(-50vw + 50%) 32px calc(-50vw + 50%)',
      height: '500px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Shadows */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100px',
        height: '100%',
        background: 'linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100%',
        background: 'linear-gradient(to left, rgba(0, 0, 0, 0.8), transparent)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />

<button
  onClick={() => smoothScrollBy(-400)}
  style={{
    position: 'absolute',
    top: '50%',
    left: '20px',
    transform: 'translateY(-50%)',
    zIndex: 3,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '2px solid #FFD700',
    color: '#FFD700',
    fontSize: '24px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  }}
>
  ‹
</button>

<button
  onClick={() => smoothScrollBy(400)}
  style={{
    position: 'absolute',
    top: '50%',
    right: '20px',
    transform: 'translateY(-50%)',
    zIndex: 3,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '2px solid #FFD700',
    color: '#FFD700',
    fontSize: '24px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  }}
>
  ›
</button>


      {/* Scrolling gallery */}
      <div
        ref={galleryRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'hidden',
          height: '100%',
          padding: '20px 0',
        }}
      >
        {/* Double images for loop */}
        {[...screenshots, ...screenshots].map((screenshot, index) => (
          <div
            key={index}
            onClick={() => handleScreenshotClick(screenshot.link)}
            style={{
              flexShrink: 0,
              width: '260px',
              height: '460px',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '2px solid rgba(255, 215, 0, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            <img
              src={screenshot.src}
              alt={screenshot.alt}
              loading="eager"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                objectPosition: '0px -20px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
<p style={{
  color: '#ccc',
  fontSize: '14px',
  textAlign: 'center',
  maxWidth: '600px',
  margin: '16px auto 0',
  fontStyle: 'italic',
  lineHeight: '1.5'
}}>
  We’re just getting started. More videos = more views, followers, and income opportunities. Watch from the sidelines — or take the chance to build something real.
</p>

    <Link
      to="/checkout"
      className="cta-button secondary"
      style={{ marginTop: '24px' }}
      onClick={handleAddToCart}
    >
      Let AI grow your socials too 👇
    </Link>
  </div>
</section>

 

{/* 3. HOW IT WORKS SECTION */}
<section
  className="video-usecase-section section-bg-green howitworks-fix"
  style={{ padding: '80px 0 60px 0' }}
>
  {/* Scoped styles: responsive 16:9 video + tighter mobile spacing */}
  <style>{`
    .howitworks-fix .video-frame {
      position: relative;
      width: 100%;
      max-width: 900px;
      margin: 32px auto;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(255, 215, 0, 0.2);
    }
    .howitworks-fix .video-frame::before {
      content: '';
      display: block;
      padding-top: 56.25%; /* 16:9 */
    }
    .howitworks-fix .video-frame iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }

    @media (max-width: 768px) {
      .howitworks-fix { padding: 40px 0 40px 0 !important; }
      .howitworks-fix .section-headline {
        margin-bottom: 8px !important;
        line-height: 1.15 !important;
        font-size: clamp(22px, 6vw, 28px);
      }
      .howitworks-fix .video-frame {
        margin: 16px auto 24px auto;
      }
    }

    @media (max-width: 1024px) {
      .howitworks-fix { padding-bottom: 48px !important; }
    }
  `}</style>

  <div className="container">
    <h2 className="section-headline">
      <span className="highlight">HOW IT WORKS</span>
    </h2>

    <div className="video-frame">
      <iframe
        src="https://www.youtube.com/embed/rWkjq27XeDw"
        title="How VEO 3 Factory Works"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>

    <Link to="/checkout" className="cta-button primary" onClick={handleAddToCart}>
      START NOW
    </Link>
  </div>
</section>

{/* 4. INCOME OPPORTUNITIES SECTION */}
<section className="social-proof-section section-bg-purple income-section" style={{ padding: '80px 0 60px 0' }}>
  {/* Scoped styles to control the breakpoint + visibility */}
  <style>{`
    .income-section .desktop-only { display: block; }
    .income-section .mobile-only { display: none; }
    /* Switch to mobile layout EARLIER to avoid any horizontal scroll */
    @media (max-width: 1024px) {
      .income-section .desktop-only { display: none !important; }
      .income-section .mobile-only { display: block !important; }
    }
  `}</style>

  <div className="container">
    <h2 className="section-headline">
      How Can You <span className="highlight">Make Money</span> With This?
    </h2>

    {/* Desktop Table (hidden <= 1024px) */}
    <div className="desktop-only">
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '2px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        overflowX: 'auto',
        marginTop: '32px',
        maxWidth: '900px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #FFD700' }}>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: '#FFD700',
                fontWeight: '700',
                fontSize: '16px'
              }}>Monetization Methods</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                color: '#FFD700',
                fontWeight: '700',
                fontSize: '16px'
              }}>TikTok</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                color: '#FFD700',
                fontWeight: '700',
                fontSize: '16px'
              }}>Instagram</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                color: '#FFD700',
                fontWeight: '700',
                fontSize: '16px'
              }}>YouTube</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Ad Revenue', '✅', '❌', '✅'],
              ['Brand Sponsorships', '✅', '✅', '✅'],
              ['Affiliate Marketing (AFM)', '✅', '✅', '✅'],
              ['Selling Your Own Products', '✅', '✅', '✅'],
              ['Paid Promotions / Shoutouts', '✅', '✅', '✅']
            ].map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{ padding: '12px 8px', color: '#e0e0e0', fontWeight: 600, fontSize: '14px' }}>{row[0]}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '18px', color: '#cccccc' }}>{row[1]}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '18px', color: '#cccccc' }}>{row[2]}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '18px', color: '#cccccc' }}>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Mobile Cards (shown <= 1024px) */}
    <div className="mobile-only" style={{ marginTop: '24px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
      {[
        ['Ad Revenue', '✅', '❌', '✅'],
        ['Brand Sponsorships', '✅', '✅', '✅'],
        ['Affiliate Marketing (AFM)', '✅', '✅', '✅'],
        ['Selling Your Own Products', '✅', '✅', '✅'],
        ['Paid Promotions / Shoutouts', '✅', '✅', '✅']
      ].map((row, index) => (
        <div key={index} style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{ color: '#FFD700', fontWeight: 700, marginBottom: '8px', fontSize: '15px' }}>
            {row[0]}
          </div>
          <div style={{ color: '#cccccc', fontSize: '14px' }}>TikTok: {row[1]}</div>
          <div style={{ color: '#cccccc', fontSize: '14px' }}>Instagram: {row[2]}</div>
          <div style={{ color: '#cccccc', fontSize: '14px' }}>YouTube: {row[3]}</div>
        </div>
      ))}
    </div>

    {/* Shared text + CTA (shows for both) */}
    <p style={{
      textAlign: 'center',
      color: '#cccccc',
      fontSize: '14px',
      fontStyle: 'italic',
      marginTop: '24px',
      marginBottom: '32px'
    }}>
      *These are just the most common. Our users have found even more ways to monetize.
    </p>

    <div style={{
      background: 'rgba(255, 215, 0, 0.1)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      marginBottom: '32px',
      maxWidth: '900px',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      <p style={{
        color: '#FFD700',
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '8px'
      }}>
        You can start making money in less than a month of running the system 3x/day.
      </p>
    </div>

    <Link to="/checkout" className="cta-button accent" onClick={handleAddToCart}>
      LET AI HELP YOU MAKE MONEY
    </Link>
  </div>
</section>




      {/* 5. TIMELINE SECTION */}
      <section className="use-cases-section section-bg-dark-blue">
        <div className="container">
          <h2 className="section-headline">
            <span className="highlight">WHAT HAPPENS NEXT</span>
          </h2>
          
          <div style={{ maxWidth: '1000px', margin: '0 auto 48px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {[
                { step: '1', title: 'Setup', desc: 'Connect tools & paste API keys', time: '30–60 minutes' },
                { step: '2', title: 'Automation', desc: 'Reels post 3x / day', time: 'week 1–2' },
                { step: '3', title: 'Growth', desc: 'Continue posting. Growth starts to take place faster.', time: '2–6 weeks' },
                { step: '4', title: 'Monetization', desc: 'Brand deals, ad revenue, products, etc.', time: 'ongoing' },
                { step: '5', title: 'Scale', desc: 'Turn it into a business, portfolio, or client service', time: 'unlimited' }
              ].map((item, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                  border: '2px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }} className="timeline-card">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#000000',
                    fontWeight: '800',
                    fontSize: '18px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ 
                    color: '#FFD700', 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    marginBottom: '8px' 
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    color: '#e0e0e0', 
                    fontSize: '14px', 
                    lineHeight: '1.5',
                    marginBottom: '8px'
                  }}>
                    {item.desc}
                  </p>
                  <span style={{ 
                    color: '#cccccc', 
                    fontSize: '12px', 
                    fontStyle: 'italic' 
                  }}>
                    ({item.time})
                  </span>
                </div>
              ))}
            </div>
            
            <p style={{ 
              textAlign: 'center', 
              color: '#FFD700', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              Go from no content to a full AI growth engine — faster than you can say AI.
            </p>
          </div>
          
          <Link to="/checkout" className="cta-button primary" onClick={handleAddToCart}>
            START YOUR AI ENGINE
          </Link>
        </div>
      </section>

{/* 6. VALUE STACK SECTION */}
<section className="social-proof-section section-bg-green">
  <div className="container">
    <h2 className="section-headline">
      What You Get Inside<br />
      <span style={{ fontSize: '0.6em', color: '#cccccc' }}>(Total value: 2,199+ USD)</span>
    </h2>

    <div style={{ maxWidth: '700px', margin: '0 auto 32px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '2px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        {[
          { text: 'Complete n8n Automation Workflow', value: '650 USD', icon: '✅' },
          { text: 'Step-by-Step Setup Guide', value: '49 USD', icon: '✅' },
          { text: 'Direct Access to Team of AI Automation Experts', value: '1,500 USD', icon: '✅' },
          { text: 'GROK + GPT Integration', value: '🎁 BONUS', icon: '✅' },
          { text: 'Auto-posting to 3 Platforms', value: '🎁 BONUS', icon: '✅' },
          { text: 'Viral ASMR Video Templates', value: '🎁 BONUS', icon: '✅' },
          { text: 'A Clear Roadmap to Monetization on Social Media', value: '🌟 INVALUABLE', icon: '📈' }
        ].map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < 6 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span style={{
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {item.text}
              </span>
            </div>
            <span style={{
              color:
                item.value.includes('BONUS')
                  ? '#00BFFF'
                  : item.value.includes('INVALUABLE')
                  ? '#FFD700'
                  : '#4CAF50',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {item.value}
            </span>
          </div>
        ))}

        {/* Total Value Display */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '2px solid #FFD700',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#FFD700'
          }}>
            TOTAL VALUE: 2,199+ USD
          </span>
        </div>
      </div>
    </div>




    {/* Special Offer Section */}
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '24px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #111, #1a1a1a)',
      border: '2px solid #4CAF50',
      textAlign: 'center'
    }}>
<h3 style={{
  fontSize: '22px',
  fontWeight: '700',
  color: 'white',
  marginBottom: '12px'
}}>
  <span style={{ color: 'white' }}>First </span>
  <span style={{ color: 'red' }}>100 </span>
  <span style={{ color: 'white' }}>People Only:</span>
</h3>

      <span style={{
        fontSize: '36px',
        fontWeight: '900',
        color: '#4CAF50',
        display: 'inline-block',
        background: '#000',
        padding: '10px 24px',
        borderRadius: '12px',
        border: '2px solid #4CAF50'
      }}>
        Just 97 USD
      </span>

      <p style={{
        color: '#cccccc',
        fontSize: '14px',
        marginTop: '12px'
      }}>
        After that, price increases to 650 USD. This is your chance to lock in early and start growing now.
      </p>
    </div>

    {/* CTA Button */}
    <Link to="/checkout" className="cta-button primary" style={{ marginTop: '32px' }} onClick={handleAddToCart}>
      TAKE THE OPPORTUNITY
    </Link>
  </div>
</section>


{/* 7. COMPARISON SECTION */}
<section
  className="use-cases-section section-bg-purple comparison-section"
  style={{ padding: '80px 0 60px 0' }}
>
  {/* Scoped styles: show mobile earlier (≤1024px) and ensure only one layout is visible */}
  <style>{`
    .comparison-section .desktop-only { display: block; }
    .comparison-section .mobile-only { display: none; }
    @media (max-width: 1024px) {
      .comparison-section .desktop-only { display: none !important; }
      .comparison-section .mobile-only { display: block !important; }
    }
  `}</style>

  <div className="container">
    <h2 className="section-headline">
      <span className="highlight">OTHER OPTIONS?</span>
    </h2>

    {/* Desktop Table (hidden ≤1024px) */}
    <div className="desktop-only" style={{ maxWidth: '900px', margin: '0 auto 32px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          border: '2px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #FFD700' }}>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  color: '#FFD700',
                  fontWeight: 700,
                  fontSize: '16px'
                }}
              >
                Feature
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  color: '#FFD700',
                  fontWeight: 700,
                  fontSize: '16px',
                  background: 'rgba(255, 215, 0, 0.1)'
                }}
              >
                Veo3Factory
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  color: '#cccccc',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Hiring Editor
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  color: '#cccccc',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Doing It Yourself
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Cost', '97 USD', '800+/mo USD', 'Time-sucking'],
              ['AI-Powered', '✅', '❌', '❌'],
              ['Viral Optimization', '✅', '🟡', '🟡'],
              ['Set & Forget', '✅', '✅', '❌'],
              ['Fastest path to monetization', '✅', '❌', '❌']
            ].map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td
                  style={{
                    padding: '12px 8px',
                    color: '#e0e0e0',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {row[0]}
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: index === 0 ? '#FFD700' : 'inherit',
                    background: 'rgba(255, 215, 0, 0.05)'
                  }}
                >
                  {row[1]}
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#cccccc'
                  }}
                >
                  {row[2]}
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#cccccc'
                  }}
                >
                  {row[3]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Mobile Cards (shown ≤1024px) */}
    <div className="mobile-only" style={{ maxWidth: '900px', margin: '24px auto 0' }}>
      {[
        ['Cost', '97 USD', '800+/mo USD', 'Time-sucking'],
        ['AI-Powered', '✅', '❌', '❌'],
        ['Viral Optimization', '✅', '🟡', '🟡'],
        ['Set & Forget', '✅', '✅', '❌'],
        ['Fastest path to monetization', '✅', '❌', '❌']
      ].map((row, index) => (
        <div
          key={index}
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px'
          }}
        >
          <div style={{ color: '#FFD700', fontWeight: 700, marginBottom: '10px', fontSize: '15px' }}>
            {row[0]}
          </div>

          <div style={{ display: 'grid', rowGap: '8px' }}>
            <div>
              <span style={{ color: '#FFD700', fontWeight: 700 }}>Veo3Factory:</span>{' '}
              <span style={{ color: '#e0e0e0' }}>{row[1]}</span>
            </div>
            <div>
              <span style={{ color: '#aaaaaa' }}>Hiring Editor:</span>{' '}
              <span style={{ color: '#cccccc' }}>{row[2]}</span>
            </div>
            <div>
              <span style={{ color: '#aaaaaa' }}>Doing It Yourself:</span>{' '}
              <span style={{ color: '#cccccc' }}>{row[3]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* 8. FOMO / PRICING SECTION */}
      <section className="fomo-section" style={{ padding: '80px 0 60px 0' }}>
        <div className="container">
          <h2 className="section-headline" style={{
            marginTop: '12px',
            marginBottom: '24px'
          }}>
            Get In Before It's Gone <span className="highlight">(Only {spotsLeft} Spots Left)</span>
          </h2>
          
          <div className="fomo-content">
            <div className="fomo-text">
              <p className="urgency-text" style={{ fontSize: '16px', marginBottom: '12px' }}>
                Companies hire for <strong>2,000+ USD/month</strong> to post on their social media, or to run a system like this.
              </p>
              <p className="value-prop" style={{ fontSize: '16px', marginBottom: '12px' }}>
                Our system alone sells for <strong>650 USD.</strong>
              </p>
              <p className="social-proof" style={{ fontSize: '18px', marginBottom: '24px' }}>
                But first 100 people can get lifetime access for just <span className="highlight" style={{ fontSize: '24px', fontWeight: '800' }}>97 USD</span>, if you act fast.
              </p>
              <p className="final-warning" style={{ fontSize: '16px', marginBottom: '24px' }}>
                Once it's gone, it's gone. Remaining early access spots:
              </p>
            </div>
            
            {/* Spots Counter */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                background: '#1a1a1a',
                border: '2px solid #FFD700',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'inline-block',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '40px',
                  fontWeight: '800',
                  color: '#FFD700',
                  lineHeight: '1',
                  marginBottom: '6px',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}>
                  {spotsLeft}/100
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  SPOTS LEFT
                </div>
              </div>
            </div>
            
            <Link to="/checkout" className="cta-button urgent" onClick={handleAddToCart}>
              Secure My Spot – 97 USD
            </Link>
          </div>
        </div>
      </section>

{/* 10. FINAL CLOSER SECTION - Two-Path Closer */}
<section
  className="final-closer"
  style={{
    padding: '72px 0',
    background: 'linear-gradient(135deg, #111, #1a1a1a)',
    borderTop: '2px solid #FFD700'
  }}
>
  <div
    className="final-closer__container"
    style={{
      maxWidth: 1120,
      margin: '0 auto',
      padding: '0 20px',
      textAlign: 'center'
    }}
  >

    {/* Headline */}
    <h1
      className="final-closer__headline"
      style={{
        margin: '0 0 12px',
        fontSize: 40,
        lineHeight: 1.15,
        fontWeight: 900,
        color: '#fff',
        textAlign: 'center'
      }}
    >
      90 Days Till{' '}
      <span
        className="headline-positive"
        style={{
          color: '#FFD700',
          fontSize: '1.1em',
          textShadow: '0 0 12px rgba(255, 215, 0, 0.75)'
        }}
      >
        COMPOUNDING
      </span>{' '}
      <span
        className="headline-positive underline"
        style={{
          color: '#FFD700',
          textDecoration: 'underline',
          fontSize: '1.1em',
          textShadow: '0 0 12px rgba(255, 215, 0, 0.75)'
        }}
      >
        GROWTH
      </span>{' '}
      or{' '}
      <span style={{ color: '#e50000ff' }}>REGRET</span>
    </h1>

    {/* Subtext */}
    <p
      className="final-closer__subtext"
      style={{
        fontSize: 18,
        color: '#cfcfcf',
        margin: '0 auto 40px',
        maxWidth: 780
      }}
    >
      You’ve seen how it works. You’ve seen what’s inside. Now it comes down to one choice.
      In 90 days, you can be landing your first brand deals with an audience that grows by the day, or still promising yourself you will start tomorrow.
    </p>

    {/* Cards grid wrapper (relative to position the VS badge) */}
    <div
      className="final-closer__grid"
      style={{
        position: 'relative'
        // note: grid columns are defined in CSS below (so we can switch to 1-col on mobile)
      }}
    >
      {/* Center divider line */}
      <div
        className="final-closer__divider"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 1,
          background:
            'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.25) 20%, rgba(255,215,0,0.25) 80%, rgba(255,215,0,0) 100%)',
          transform: 'translateX(-0.5px)'
        }}
      />
      {/* VS badge */}
      <div
        className="final-closer__vs"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(17,17,17,0.9)',
          border: '1px solid rgba(255,215,0,0.5)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          color: '#FFD700',
          fontWeight: 900,
          letterSpacing: 1.5,
          padding: '8px 14px',
          borderRadius: 999,
          fontSize: 12,
          textTransform: 'uppercase',
          userSelect: 'none'
        }}
      >
        VS
      </div>

{/* LEFT: Status-quo path */}
<div
  className="final-closer__card final-closer__card--left"
  role="group"
  style={{
    background:
      'radial-gradient(900px 240px at 0% 0%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'transform 160ms ease, box-shadow 160ms ease',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
>
  {/* Label */}
  <div
    style={{
      fontSize: 11,
      letterSpacing: 2,
      color: '#a4a4a4',
      marginBottom: 12
    }}
  >
    DO NOTHING
  </div>

  {/* Heading */}
  <h2
    style={{
      fontSize: 34,
      margin: '6px 0 12px',
      color: '#fff',
      fontWeight: 800
    }}
  >
    Stay Manual
  </h2>

  {/* Paragraph */}
  <p
    style={{
      color: '#cfcfcf',
      lineHeight: 1.6,
      marginBottom: 20,
      maxWidth: 420
    }}
  >
    Keep editing at midnight. Keep guessing what to post. Keep watching others win while you fall behind.
    The cost is not only your time. It is the opportunities that vanish with it.
  </p>

  {/* Button */}
  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    style={{
      borderRadius: 48,
      padding: '14px 20px',
      background: 'linear-gradient(180deg, #232323, #1a1a1a)',
      border: '2px solid rgba(255,255,255,0.18)',
      color: '#d7d7d7',
      fontWeight: 700,
      fontSize: 16,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      cursor: 'pointer',
      width: '100%'
    }}
  >
    I’ll Keep Struggling Alone
  </button>
</div>

      {/* RIGHT: Action path */}
      <div
        className="final-closer__card final-closer__card--right"
        role="group"
        style={{
          background:
            'radial-gradient(900px 240px at 100% 0%, rgba(255,215,0,0.10), rgba(0,0,0,0) 60%)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 20,
          padding: 28,
          textAlign: 'left',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div
          className="price-row"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 6
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: '#FFD700'
            }}
          >
            ACT NOW
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 16, color: '#cfcfcf', letterSpacing: 2 }}>
              PAY
            </div>
            <div style={{ fontSize: 36, color: '#FFD700', fontWeight: 900 }}>
              $97 <span style={{ fontSize: 14, color: '#ffd36a' }}>USD</span>
            </div>
          </div>
        </div>

        <p style={{ color: '#eaeaea', lineHeight: 1.6 }}>
          Turn on a machine that works while you sleep. Shorts, Reels, TikToks: created, scheduled, posted.
          Your audience compounds. Your presence grows. You finally get ahead.
        </p>

        <ul
          style={{
            margin: '12px 0 0',
            paddingLeft: 18,
            color: '#cbcbcb',
            lineHeight: 1.7
          }}
        >
          <li>Set it up once and content flows 24/7</li>
          <li>Eliminate editing, burnout, and wasted hours</li>
          <li>
            Secure <span style={{ color: '#FFD700', fontWeight: 700 }}>early access pricing</span> before it is gone
          </li>
        </ul>

        {/* If Link is not in scope, replace with <a href="/checkout"> */}
{/* CTA row: two buttons side-by-side */}
<div
  style={{
    display: 'flex',
    gap: 12,
    marginTop: 22,
    flexWrap: 'wrap',
    justifyContent: 'center'
  }}
>
  {/* Main consumer CTA */}
  <Link
    to="/checkout"
    onClick={typeof handleAddToCart === 'function' ? handleAddToCart : undefined}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      flex: '1 1 240px',
      borderRadius: 48,
      padding: '18px 24px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      fontWeight: 900,
      fontSize: 18,
      boxShadow: '0 14px 36px rgba(255, 183, 0, 0.35)',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    }}
  >
    Automate Social Media →
  </Link>

{/* Business/demo CTA */}
<a
  href="/b2b-form.html"
  onClick={(e) => {
    e.preventDefault();
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead');
    }
    // TikTok mirror on click
    ttqTrack('ClickButton', {
      contents: [{
        content_id: 'b2b_demo_cta',
        content_type: 'button',
        content_name: 'B2B Demo'
      }],
      value: 0,
      currency: 'USD'
    });

    // Continue navigation after short delay
    setTimeout(() => {
      window.location.href = '/b2b-form.html';
    }, 180);
  }}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '1 1 240px',
    borderRadius: 48,
    padding: '18px 24px',
    background: 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    fontWeight: 900,
    fontSize: 18,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer'
  }}
>
  For Businesses: Request Custom Demo
</a>
</div>

{/* Note under both buttons */}
<div
  style={{
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    color: '#a0a0a0'
  }}
>
  Only a few early access spots left.
</div>
      </div>
    </div>

    {/* Mobile helper text */}
    <div
      style={{
        marginTop: 20,
        textAlign: 'center',
        fontSize: 12,
        color: '#9b9b9b'
      }}
    >
      Not sure? Scroll up and watch the How It Works video, then choose.
    </div>
  </div>

  {/* Responsive tweaks */}
  <style>{`
    /* Desktop default */
    .final-closer__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 28px;
      align-items: stretch;
    }

    /* Mobile stack */
    @media (max-width: 980px) {
      .final-closer { padding: 56px 0; }
      .final-closer__headline { font-size: 34px; }
      .final-closer__subtext { font-size: 16px; max-width: 92%; }

      .final-closer__grid {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      /* Hide center line and VS on stack */
      .final-closer__divider,
      .final-closer__vs { display: none; }

      /* Card polish for mobile */
      .final-closer__card {
        padding: 22px !important;
        border-radius: 16px !important;
      }

      /* Price row becomes vertical with price emphasized */
      .price-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      /* Tame the glow/size on small screens */
      .headline-positive {
        font-size: 1.06em !important;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.55) !important;
      }
    }

    /* Very small phones */
    @media (max-width: 560px) {
      .final-closer__headline { font-size: 28px; line-height: 1.2; }
      .final-closer__container { padding: 0 16px; }
      .headline-positive.underline { text-decoration-thickness: 2px; }
    }
  `}</style>
</section>



{/* WHY_POPUP — scarcity explanation */} 
<Modal
  open={showWHY}
  onClose={() => { setShowWHY(false); markSeenFor("modal_why_until"); }}
  title=""
>
  <h2 style={{
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: "12px"
  }}>
    WHY ONLY 100?
  </h2>

  <div style={{
    textAlign:"center",
    lineHeight:"1.7",
    fontSize:"16px",
    marginBottom:"20px"
  }}>
    This system <span style={{ fontWeight: 700, color:"#FFD700" }}>only works while it’s rare</span>.<br/>
    If everybody starts running it, the advantage disappears.<br/><br/>
    That’s why we’re limiting it to <span style={{ fontWeight: 700, color:"#FFD700" }}>the first 100 people</span> — the ones who believe in us early, and get rewarded with results nobody else has.<br/><br/>
    <span style={{ fontWeight: 800, color:"#FFD700" }}>Right now there are only 17 spots left at 97 USD.</span>
  </div>

  <div style={{ display:"flex", gap:10 }}>
<a
  href="/checkout"
  onClick={(e) => {
    e.preventDefault();            // preserve pixel hits
    handleAddToCart();             // fires FB + TikTok
    markSeenFor("modal_why_until");
    setTimeout(() => { window.location.href = "/checkout"; }, 180);
  }}
  className="cta-button primary"
  style={{
    flex:1, textAlign:"center", padding:"12px 14px",
    background:"linear-gradient(135deg,#FFD700,#EFB600)",
    color:"#000", fontWeight:900, borderRadius:10,
    textTransform:"uppercase", letterSpacing:".02em", fontSize:12
  }}
>
  SECURE MY SPOT
</a>


    <button onClick={() => { setShowWHY(false); markSeenFor("modal_why_until"); }}
       className="cta-button outline"
       style={{
         flex:1, padding:"12px 14px", background:"transparent",
         color:"#FFD700", border:"1px solid rgba(255,215,0,.6)",
         fontWeight:800, borderRadius:10,
         textTransform:"uppercase", letterSpacing:".02em", fontSize:12
       }}>
      Keep exploring
    </button>
  </div>
</Modal>





{/* LATE_POPUP — final fallback */} 
<Modal
  open={showLATE}
  onClose={() => { setShowLATE(false); markSeenFor("modal_late_until"); }}
  title=""
>
  <h2 style={{
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: "12px"
  }}>
    ARE YOU READY FOR...
  </h2>

  <div style={{
    textAlign:"center",
    lineHeight:"1.7",
    fontSize:"16px",
    marginBottom:"20px"
  }}>
    No filming. No editing. AI posts for you <span style={{ fontWeight: 700, color:"#FFD700" }}>24/7</span>.<br/>
    Setup takes just <span style={{ fontWeight: 700, color:"#FFD700" }}>30–60 minutes</span>.<br/><br/>
    Want us to handle everything for you?<br/>
    You can either <span style={{ fontWeight: 700 }}>email us</span> at <a href="mailto:jan@veo3factory.com" style={{ color:"#FFD700", fontWeight:700 }}>jan@veo3factory.com</a><br/>
    or book a <a href="https://calendar.app.google/M23nEg8JyLnTTAk87" target="_blank" style={{ color:"#FFD700", fontWeight:700 }}>30-minute call here</a>.
  </div>

  <div style={{ display:"flex", gap:10 }}>
<a
  href="/checkout"
  onClick={(e) => {
    e.preventDefault();
    handleAddToCart();                 // fires FB + TikTok AddToCart
    markSeenFor("modal_late_until");
    setTimeout(() => { window.location.href = "/checkout"; }, 180);
  }}
  className="cta-button primary"
  style={{
    flex:1, textAlign:"center", padding:"12px 14px",
    background:"linear-gradient(135deg,#FFD700,#EFB600)",
    color:"#000", fontWeight:900, borderRadius:10,
    textTransform:"uppercase", letterSpacing:".02em", fontSize:12
  }}
>
  START YOUR AI ENGINE
</a>


    <a href="https://calendar.app.google/M23nEg8JyLnTTAk87"
       target="_blank"
       className="cta-button outline"
       style={{
         flex:1, padding:"12px 14px", background:"transparent",
         color:"#FFD700", border:"1px solid rgba(255,215,0,.6)",
         fontWeight:800, borderRadius:10,
         textTransform:"uppercase", letterSpacing:".02em", fontSize:12
       }}>
      BOOK A CALL
    </a>
  </div>
</Modal>





{/* LATE_POPUP — B2B Done-for-you angle */} 
<Modal
  open={showLATE}
  onClose={() => { setShowLATE(false); markSeenFor("modal_late_until"); }}
  title=""
>
  <h2 style={{
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: "12px"
  }}>
    WANT US TO RUN IT FOR YOU?
  </h2>

  <div style={{
    textAlign:"center",
    lineHeight:"1.7",
    fontSize:"16px",
    marginBottom:"20px"
  }}>
    Not every business has the time to set this up themselves.<br/>
    That’s why we offer a <span style={{ fontWeight: 700, color:"#FFD700" }}>done-for-you option</span>.<br/><br/>
    If you’d like to see how this system can plug directly into your business:<br/>
    <span style={{ fontWeight: 700 }}>Email us</span> at 
    <a href="mailto:jan@veo3factory.com" style={{ color:"#FFD700", fontWeight:700 }}> jan@veo3factory.com</a><br/>
    or <a href="https://calendar.app.google/M23nEg8JyLnTTAk87" target="_blank" style={{ color:"#FFD700", fontWeight:700 }}>book a 30-minute strategy call here</a>.
  </div>

  <div style={{ display:"flex", gap:10 }}>
    <a href="https://calendar.app.google/M23nEg8JyLnTTAk87"
       target="_blank"
       className="cta-button primary"
       style={{
         flex:1, textAlign:"center", padding:"12px 14px",
         background:"linear-gradient(135deg,#FFD700,#EFB600)",
         color:"#000", fontWeight:900, borderRadius:10,
         textTransform:"uppercase", letterSpacing:".02em", fontSize:12
       }}>
      BOOK A CALL
    </a>
    <button onClick={() => { setShowLATE(false); markSeenFor("modal_late_until"); }}
       className="cta-button outline"
       style={{
         flex:1, padding:"12px 14px", background:"transparent",
         color:"#FFD700", border:"1px solid rgba(255,215,0,.6)",
         fontWeight:800, borderRadius:10,
         textTransform:"uppercase", letterSpacing:".02em", fontSize:12
       }}>
      Keep exploring
    </button>
  </div>
</Modal>




      {/* Footer */}
      <footer
        style={{
          background: '#111',
          color: '#aaa',
          padding: '16px 5%',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderTop: '1px solid #222',
        }}
      >
        {/* Left */}
        <span>
          © 2025 Veo3Factory &nbsp;•&nbsp;
          Contact us at jan@veo3factory.com
        </span>

        {/* Right */}
        <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="privacy-policy.html" style={{ color: '#aaa' }}>Privacy</a>
          <a href="cookie-policy.html" style={{ color: '#aaa' }}>Cookies</a>
          <a href="terms-conditions.html" style={{ color: '#aaa' }}>Terms</a>
        </nav>
      </footer>

    </div>
  );
}
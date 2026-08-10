import { useState, useEffect, useRef } from "react";
import heroImg from "./assets/smart_security_hero.png";
import logoImg from "./assets/logo.png";

// Custom Futuristic Pointer Cursor Component (With Ambient Glow, Trailing Lag, and Ripple Effects)
function CustomCursor() {
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState([]);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [clickRipple, setClickRipple] = useState(null);

  const ringRef = useRef({ x: 0, y: 0 });
  const glowRef = useRef({ x: 0, y: 0 });
  const dotRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef();

  useEffect(() => {
    // Check prefers-reduced-motion media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      dotRef.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
      
      // Update trail (only if motion is not reduced)
      if (!reducedMotion) {
        setTrail((prev) => {
          const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
          if (newTrail.length > 3) newTrail.shift();
          return newTrail;
        });
      }
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);
    
    const handleMouseDown = (e) => {
      setClicked(true);
      if (!reducedMotion) {
        setClickRipple({ x: e.clientX, y: e.clientY, id: Date.now() });
        setTimeout(() => {
          setClickRipple(null);
        }, 400); // Ripple animates and vanishes
      }
    };
    
    const handleMouseUp = () => setClicked(false);

    // Track active interactions
    const handleMouseOver = (e) => {
      const target = e.target.closest("a, button, [role='button'], input, select, textarea, .group, [data-interactive]");
      if (target) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [reducedMotion]);

  // RequestAnimationFrame loop for trailing lag
  useEffect(() => {
    const updatePosition = () => {
      const easingRing = reducedMotion ? 1 : 0.18;
      const easingGlow = reducedMotion ? 1 : 0.08; // Slower, more delayed/smooth glow movement
      
      const targetX = dotRef.current.x;
      const targetY = dotRef.current.y;

      ringRef.current.x += (targetX - ringRef.current.x) * easingRing;
      ringRef.current.y += (targetY - ringRef.current.y) * easingRing;

      glowRef.current.x += (targetX - glowRef.current.x) * easingGlow;
      glowRef.current.y += (targetY - glowRef.current.y) * easingGlow;

      setRingPos({ x: ringRef.current.x, y: ringRef.current.y });
      setGlowPos({ x: glowRef.current.x, y: glowRef.current.y });
      
      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, [reducedMotion]);

  // Verify pointer support (disable custom cursors on touchscreen tablets and mobile devices)
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(!window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  if (isTouchDevice || !visible) return null;

  // Scales & dimensions based on interactions
  const ringScale = clicked ? 0.82 : (hovered ? 1.45 : 1.0);
  const dotScale = clicked ? 0.8 : (hovered ? 1.3 : 1.0);
  const glowScale = clicked ? 1.15 : (hovered ? 1.25 : 1.0);
  const glowOpacity = clicked ? 0.26 : (hovered ? 0.22 : 0.13); // Brighter on click and hover

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* 1. Custom Ambient Glow (Positioned BEHIND all cursor elements, GPU-eased) */}
      <div 
        className="fixed top-0 left-0 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-out"
        style={{
          left: glowPos.x,
          top: glowPos.y,
          width: "110px",
          height: "110px",
          transform: `translate3d(-50%, -50%, 0) scale(${glowScale})`,
          opacity: glowOpacity,
          background: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(99,102,241,0.25) 35%, rgba(168,85,247,0.08) 55%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      ></div>

      {/* 2. Click Ripple Effect */}
      {clickRipple && (
        <div 
          className="fixed top-0 left-0 rounded-full border-[1.8px] border-purple-500/60 bg-purple-500/5 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ripple z-40"
          style={{
            left: clickRipple.x,
            top: clickRipple.y,
          }}
        />
      )}

      {/* 3. 2-3 trailing fading dots */}
      {!reducedMotion && trail.map((pt, i) => (
        <div 
          key={pt.id}
          className="fixed top-0 left-0 rounded-full bg-purple-500/20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: pt.x,
            top: pt.y,
            width: `${4 - i}px`,
            height: `${4 - i}px`,
            opacity: (i + 1) / 4 * 0.45,
          }}
        />
      ))}

      {/* 4. Ring (Smooth Eased Following) */}
      <div 
        className="fixed top-0 left-0 rounded-full border-[1.8px] border-purple-500 bg-transparent pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-100 ease-out shadow-[0_0_8px_rgba(168,85,247,0.35)]"
        style={{
          left: ringPos.x,
          top: ringPos.y,
          width: "20px",
          height: "20px",
          transform: `translate3d(-50%, -50%, 0) scale(${ringScale})`,
        }}
      ></div>

      {/* 5. Center Dot (Instant Response) */}
      <div 
        className="fixed top-0 left-0 rounded-full bg-white pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out shadow-[0_0_4px_rgba(168,85,247,0.6)]"
        style={{
          left: dotRef.current.x,
          top: dotRef.current.y,
          width: "4.5px",
          height: "4.5px",
          transform: `translate3d(-50%, -50%, 0) scale(${dotScale})`,
        }}
      ></div>
    </div>
  );
}

export default function App() {
  // Page load experience animation flag
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Viewport scroll progress depth
  const [scrollProgress, setScrollProgress] = useState(0);

  // Navbar states
  const [navbarShrunk, setNavbarShrunk] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mouse parallax offset state for Hero Mockup (Desktop only)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Simulator States
  const [childSafeMode, setChildSafeMode] = useState(true);
  const [sensorTriggered, setSensorTriggered] = useState(false);
  const [visitorType, setVisitorType] = useState("stranger"); // "homeowner" | "stranger"
  const [doorState, setDoorState] = useState("LOCKED"); // "LOCKED" | "UNLOCKED"
  const [audioActive, setAudioActive] = useState(false);
  const [systemMessage, setSystemMessage] = useState("System Armed. Proximity sensor scanning...");
  
  // Multi-step simulator recognition status stages: "IDLE" | "INITIALIZING" | "SCANNING" | "ANALYZING" | "VERIFIED" | "DENIED"
  const [simStep, setSimStep] = useState("IDLE");

  const [log, setLog] = useState([
    {
      id: 1,
      time: "10:15 AM",
      visitor: "Parent (John)",
      status: "VERIFIED",
      action: "Unlocked via Auto-Approve",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    {
      id: 2,
      time: "11:42 AM",
      visitor: "Stranger (Unknown)",
      status: "FLAGGED",
      action: "Blocked (Parent Denied via Bot)",
      color: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    },
    {
      id: 3,
      time: "02:10 PM",
      visitor: "Child (Emily)",
      status: "VERIFIED",
      action: "Access Logged (No Lock Override)",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    },
  ]);

  // Handle Initial Load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle Scroll progress depth
  useEffect(() => {
    const handleScrollProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener("scroll", handleScrollProgress);
    return () => window.removeEventListener("scroll", handleScrollProgress);
  }, []);

  // Handle Sticky Navbar Resize & Background Shrinkage
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setNavbarShrunk(true);
      } else {
        setNavbarShrunk(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll Reveal Observer & Navigation Section Active Tracker
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      revealObserver.observe(el);
    });

    const sections = ["hero", "features", "simulator", "architecture", "specs"];
    const sectionElements = sections.map((id) => document.getElementById(id)).filter(Boolean);

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.25, rootMargin: "-25% 0px -55% 0px" }
    );

    sectionElements.forEach((el) => navObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      navObserver.disconnect();
    };
  }, []);

  // Mouse Parallax movement tracker inside the Hero Section (Only desktop pointer devices)
  const handleHeroMouseMove = (e) => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5 offset
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setParallaxOffset({ x: x * 14, y: y * 14 }); // Limit maximum Y/X shift to 7px
    }
  };

  const handleHeroMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  // Multi-step System Simulator Sequence (Scanning -> Analyzing -> Lock actuation)
  const triggerSensor = () => {
    setSensorTriggered(true);
    setDoorState("LOCKED");
    setSimStep("INITIALIZING");
    setSystemMessage("Proximity Alert: Visitor approaching threshold. Booting ESP32-CAM...");

    // Stage 1: Scanning (500ms)
    setTimeout(() => {
      setSimStep("SCANNING");
      setSystemMessage("Camera active: Scanning facial landmarks. Running range analysis...");
    }, 600);

    // Stage 2: AI Analyzing landmarks (1400ms)
    setTimeout(() => {
      setSimStep("ANALYZING");
      setSystemMessage("AI Core match: Matching landmarks against saved homeowner Prisma database...");
    }, 1500);

    // Stage 3: Verification verdict (2300ms)
    setTimeout(() => {
      if (visitorType === "homeowner") {
        setSimStep("VERIFIED");
        setDoorState("UNLOCKED");
        setSystemMessage("Prisma mapping: Homeowner (John) matched! Relay activated. Lock: UNLOCKED.");
        addLogEntry("Homeowner (John)", "ACCESS ALLOWED");
      } else {
        setSimStep("DENIED");
        setDoorState("LOCKED");
        if (childSafeMode) {
          setSystemMessage(
            "Security Action: Unknown visitor matches 0% database profiles. CHILD SAFETY TRIGGERED: Overrides locked. Snapshot dispatched."
          );
        } else {
          setSystemMessage(
            "Security warning: Stranger matching threshold failed. Snapshot sent to parent. Awaiting remote allowance command..."
          );
        }
        addLogEntry("Stranger (Unknown)", "ACCESS BLOCKED");
      }
    }, 2500);
  };

  const handleManualAction = (action) => {
    if (!sensorTriggered) {
      setSystemMessage("Cannot operate lock. No visitor detected at the door.");
      return;
    }
    if (action === "ALLOW") {
      if (visitorType === "stranger" && childSafeMode) {
        setSystemMessage("COMMAND BLOCKED: Cannot allow strangers while Child Safety Mode is active.");
        return;
      }
      setDoorState("UNLOCKED");
      setSystemMessage("Manual Override: Access Approved by parent. Lock: UNLOCKED.");
      addLogEntry(visitorType === "homeowner" ? "Homeowner" : "OVERRIDE ALLOWED");
    } else {
      setDoorState("LOCKED");
      setSystemMessage("Manual Override: Access Denied. Lock remains secured.");
      addLogEntry(visitorType === "homeowner" ? "Homeowner" : "OVERRIDE DENIED");
    }
  };

  const resetSimulator = () => {
    setSensorTriggered(false);
    setDoorState("LOCKED");
    setAudioActive(false);
    setSimStep("IDLE");
    setSystemMessage("System Armed. Proximity sensor scanning...");
  };

  const addLogEntry = (visitor, result) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isStranger = visitor.includes("Stranger");
    const status = isStranger ? "FLAGGED" : "VERIFIED";
    const color = isStranger 
      ? (result.includes("ALLOW") ? "text-amber-400 border-amber-500/20 bg-amber-500/5 translate-x-2 opacity-0" : "text-rose-400 border-rose-500/20 bg-rose-500/5 translate-x-2 opacity-0")
      : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 translate-x-2 opacity-0";

    const newId = Date.now();
    setLog((prev) => [
      {
        id: newId,
        time,
        visitor,
        status,
        action: result,
        color,
      },
      ...prev,
    ]);

    // Animate list item entrance sliding in via state delay
    setTimeout(() => {
      setLog((currentLog) => 
        currentLog.map(item => 
          item.id === newId 
            ? { ...item, color: item.color.replace("translate-x-2 opacity-0", "translate-x-0 opacity-100 transition-all duration-300 ease-out") }
            : item
        )
      );
    }, 50);
  };

  // Clear events helper
  const clearLogs = () => {
    setLog([]);
    setSystemMessage("System Log database cleared.");
  };

  // Close Mobile Menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Specs Table Data structure
  const hardwareSpecs = [
    { name: "ESP32-CAM", role: "Captures high-resolution visitor frames and transmits data via dual-band Wi-Fi." },
    { name: "HC-SR04 Sensor", role: "Ultrasonic range calculation module. Limits power by booting camera on movement." },
    { name: "High-Torque Servo", role: "Actuates lock gears physically. Runs on wireless 5V logic." },
    { name: "Mic & Speaker Modules", role: "Enables point-to-point analog audio routing for remote intercom dialogue." }
  ];

  const softwareSpecs = [
    { name: "AI Recognition", role: "@vladmandic/face-api, TensorFlow.js framework utilizing native CPU nodes." },
    { name: "Backend Router", role: "Node.js with Express controller handling base64 conversion and matching logic." },
    { name: "Data Mapping Layer", role: "Prisma client integrated with stable PostgreSQL schemas." },
    { name: "Client Panel", role: "React (Vite-bundler) powered with Tailwind CSS v4 styling properties." }
  ];

  const featuresList = [
    {
      title: "AI Face Recognition",
      desc: "Processes captured visitor images against authorized homeowners using @vladmandic/face-api and TensorFlow neural models.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Child Safety Mode",
      desc: "Automatically isolates unlocking commands. Denies access overrides for unknown visitor profiles when kids are home alone.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Wireless ESP32 Lock",
      desc: "Interprets wireless commands sent over local secure Wi-Fi and actuates servo physical components to turn lock deadbolt.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Instant Smart Alerts",
      desc: "Dispatches instantaneous notifications containing visitor snapshots, logs, and verification confidence metrics to parent devices.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      title: "HC-SR04 Proximity",
      desc: "Ultrasonic waves calculate caller distance. Saves energy by waking camera and computer nodes only when a guest approaches.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "Two-Way Intercom",
      desc: "Integrates direct microphone and speaker stream paths for remote visual verification and safe vocal confirmation.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      title: "Stranger Diagnostics",
      desc: "Applies strict safety measures to detect unknown profiles, preventing automatic door releases for unrecognized people.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      title: "Auditable System Logs",
      desc: "Saves images and owner responses inside relational PostgreSQL schemas (via Prisma), constructing a clear access timeline.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-purple-500 selection:text-white bg-grid-pattern relative box-border overflow-x-hidden">
      
      {/* 1. Custom Futuristic Pointer Cursor component (Hidden on touch screens) */}
      <CustomCursor />

      {/* Viewport Scroll Depth Progress Bar (2.5px height, purple accent) */}
      <div 
        className="fixed top-0 left-0 h-[2.5px] bg-purple-500 z-[60] transition-all duration-100 ease-out" 
        style={{ width: `${scrollProgress}%` }}
      ></div>

      {/* Background radial lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1300px] h-[700px] bg-purple-900/5 rounded-full blur-[140px] pointer-events-none z-0"></div>
      
      {/* Sticky Navigation Header (Enlarged v3 navbar, h-[84px] -> h-[72px] shrink transition on scroll) */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-premium border-b flex items-center ${
          navbarShrunk 
            ? "h-[70px] bg-slate-950/95 shadow-lg shadow-purple-500/5 border-slate-900 backdrop-blur-md" 
            : "h-[84px] bg-slate-950/20 border-transparent backdrop-blur-sm"
        } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        <div className="w-full max-w-[1340px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 flex justify-between items-center box-border">
          {/* Brand Logo and Name (Scale transition: 200-250ms, hover glow pulse) */}
          <a href="#hero" className="flex items-center space-x-2.5 sm:space-x-3.5 group" style={{ transition: 'all 250ms cubic-bezier(0.22, 1, 0.36, 1)' }} data-interactive>
            <img 
              src={logoImg} 
              alt="SafeEntry AI logo" 
              className="h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] md:h-[48px] md:w-[48px] lg:h-[52px] lg:w-[52px] object-contain transition-all duration-250 ease-premium group-hover:scale-[1.04] group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
            />
            <span className="font-extrabold text-[17px] sm:text-[19px] md:text-[21px] tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent group-hover:brightness-110 transition-all select-none">
              SafeEntry AI
            </span>
          </a>

          {/* Desktop Navigation Links (Expand underlines 0 -> 100%) */}
          <nav className="hidden md:flex items-center space-x-[32px] text-[15.5px] font-semibold">
            {[
              { id: "features", label: "Features" },
              { id: "simulator", label: "Interactive Demo" },
              { id: "architecture", label: "System Flow" },
              { id: "specs", label: "Specifications" }
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative py-1 tracking-wider uppercase transition-all duration-200 ease-premium ${
                  activeSection === link.id
                    ? "text-white font-bold"
                    : "text-slate-400 hover:text-slate-100 hover:-translate-y-[1px]"
                }`}
                data-interactive
              >
                {link.label}
                {/* Underline indicator */}
                <span 
                  className={`absolute bottom-0 left-0 h-[2px] bg-purple-500 transition-all duration-300 ease-premium ${
                    activeSection === link.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            ))}
          </nav>

          {/* Badge & Hamburger Menu target area */}
          <div className="flex items-center space-x-4">
            {/* Version Badge (Enlarged touch/height: 28-32px, font 11-12px, padding 8px 12px) */}
            <span className="hidden sm:inline-block h-8 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[11px] font-bold tracking-widest uppercase flex items-center justify-center">
              IoT Security v1.0
            </span>

            {/* Mobile menu hamburger button (44x44px touch target with active transforms) */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden flex-col items-center justify-center w-11 h-11 z-50 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg border border-slate-900 bg-slate-950/40 cursor-pointer"
              aria-label="Toggle Navigation Drawer"
            >
              <div className="flex flex-col justify-between w-5 h-3.5">
                <span className={`h-0.5 w-full bg-slate-300 rounded-full transition-all duration-300 ease-premium origin-left ${mobileMenuOpen ? 'rotate-45 translate-x-1 -translate-y-0.5' : ''}`}></span>
                <span className={`h-0.5 w-full bg-slate-300 rounded-full transition-all duration-300 ease-premium ${mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`}></span>
                <span className={`h-0.5 w-full bg-slate-300 rounded-full transition-all duration-300 ease-premium origin-left ${mobileMenuOpen ? '-rotate-45 translate-x-1 translate-y-0.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu (Staggered fade-up link transitions) */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className={`absolute right-5 left-5 top-20 bg-slate-900/95 border border-purple-500/20 backdrop-blur-xl rounded-xl p-6 shadow-2xl transition-all duration-300 transform origin-top ${
            mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <nav className="flex flex-col space-y-5 text-sm font-semibold">
            {[
              { id: "features", label: "Features" },
              { id: "simulator", label: "Interactive Demo" },
              { id: "architecture", label: "System Flow" },
              { id: "specs", label: "Specifications" }
            ].map((link, idx) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2.5 border-b border-slate-800/40 block text-[17px] tracking-wider uppercase transition-all duration-500 ease-premium ${
                  activeSection === link.id ? "text-purple-400 font-bold" : "text-slate-300 hover:text-slate-100"
                } ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 text-center">
              <span className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold tracking-widest uppercase">
                SECURITY ACCESS CONTROL
              </span>
            </div>
          </nav>
        </div>
      </div>

      {/* Hero Section (Parallax visual area on mouse move) */}
      <section 
        id="hero" 
        className="relative min-h-[78vh] lg:min-h-[88vh] flex items-center pt-32 pb-16 md:pt-44 md:pb-28 max-w-[1280px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 border-b border-slate-900/60 box-border"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-16 items-center w-full relative z-10">
          {/* Column 1: text content (Mask reveal line-by-line) */}
          <div className="w-full lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-7 max-w-[600px] mx-auto lg:mx-0 order-1 lg:order-none">
            
            {/* Logo Intro Animation: Brand Badge */}
            <div 
              className={`inline-flex items-center space-x-3 bg-slate-900/50 border border-slate-900 px-4 py-2 rounded-full relative group transition-all duration-700 ease-premium transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[8px]"
              }`}
              style={{ transitionDelay: '180ms' }}
            >
              {/* Soft glow behind the logo */}
              <div className="absolute -inset-px bg-purple-500/5 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src={logoImg} 
                alt="SafeEntry AI logo" 
                className="h-[34px] w-[34px] sm:h-[48px] sm:w-[48px] lg:h-[56px] lg:w-[56px] object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]" 
              />
              <span className="font-extrabold text-[10px] sm:text-xs tracking-[0.25em] text-purple-400 uppercase select-none">
                SafeEntry AI
              </span>
            </div>

            {/* Title (Masked line-by-line reveal) */}
            <h1 className="text-[clamp(1.9rem,7.5vw,3.75rem)] font-black tracking-tight text-white leading-[1.15]">
              <span className="block overflow-hidden py-1">
                <span 
                  className={`block transition-all duration-800 ease-premium ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: '250ms' }}
                >
                  AI-Powered Door Lock &
                </span>
              </span>
              <span className="block overflow-hidden py-1">
                <span 
                  className={`block bg-gradient-to-r from-purple-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent text-sweep transition-all duration-800 ease-premium ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: '320ms' }}
                >
                  & Child Safety Security
                </span>
              </span>
            </h1>

            {/* Description */}
            <p 
              className={`text-[15px] sm:text-[16.5px] text-slate-400 w-full max-w-xl mx-auto lg:mx-0 leading-[1.65] transition-all duration-800 ease-premium transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              An intelligent, integrated home security system built for science & STEM presentations. Fuses real-time neural face matching, ultrasonic range finding, and parental locking algorithms to prevent children from opening doors to strangers.
            </p>

            {/* CTA Buttons (Hover sweep & Click bounce) */}
            <div 
              className={`flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2 transition-all duration-800 ease-premium transform w-full max-w-md mx-auto lg:mx-0 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              <a
                href="#simulator"
                className="hover-shine-effect w-full sm:w-auto h-[48px] px-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 hover:-translate-y-[2px] active:scale-[0.97] hover:scale-[1.02] text-white text-xs tracking-wider uppercase font-bold rounded-lg shadow-lg shadow-purple-600/15 transition-all duration-200 ease-premium"
                data-interactive
              >
                Launch Sandbox Demo
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto h-[48px] px-8 flex items-center justify-center bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 hover:-translate-y-[2px] active:scale-[0.97] hover:scale-[1.02] text-slate-300 text-xs tracking-wider uppercase font-bold rounded-lg transition-all duration-200 ease-premium"
                data-interactive
              >
                Learn Features
              </a>
            </div>
          </div>

          {/* Column 2: Hero Mockup Image (Glow pulse float + subtle pointer-parallax offsets) */}
          <div 
            className={`w-full lg:col-span-5 flex justify-center order-2 lg:order-none transition-all duration-800 ease-premium transform ${
              isLoaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
            }`}
            style={{ transitionDelay: '450ms' }}
          >
            <div 
              className="relative group w-full max-w-[420px] mx-auto animate-float transition-transform duration-300"
              style={{
                transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) rotateX(${-parallaxOffset.y * 0.15}deg) rotateY(${parallaxOffset.x * 0.15}deg)`
              }}
              data-interactive
            >
              {/* Pulsing purple backing glow */}
              <div className="absolute -inset-4 bg-purple-600/10 rounded-full blur-2xl group-hover:scale-105 transition-transform duration-700 animate-pulse-glow"></div>
              {/* Image Frame */}
              <div className="relative rounded-2xl border border-slate-800/80 bg-slate-950 p-2 sm:p-2.5 shadow-2xl shadow-purple-500/5 group-hover:border-slate-700 transition-all duration-500">
                <img
                  src={heroImg}
                  alt="Smart Security Dashboard System"
                  className="rounded-xl w-full h-auto object-cover filter brightness-95 group-hover:scale-[1.01] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Section (Completely redesigned compact security console dashboard container E:\stem-project-main\stem-project-main\presentation-site\src\App.jsx) */}
      <section id="simulator" className="py-16 sm:py-24 max-w-[1240px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 box-border reveal-on-scroll">
        
        {/* Unified Simulator Dashboard Container */}
        <div className="bg-[#050916] border border-slate-900 shadow-2xl rounded-2xl p-4 sm:p-6 w-full relative overflow-hidden">
          
          {/* Subtle ambient light inside simulator */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* 1. TOP SYSTEM STATUS BAR */}
          <div className="relative z-10 w-full mb-6 p-3 sm:px-4 sm:py-2.5 bg-[#02050f]/80 rounded-xl border border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-500 tracking-wider">
            <div className="flex items-center space-x-2.5">
              <span className="text-purple-400 font-extrabold text-xs">SafeEntry AI</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400 font-bold uppercase select-none">Security Console Dashboard</span>
            </div>
            
            <div className="flex items-center flex-wrap justify-center gap-3">
              <span className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                <span className="text-slate-400 font-semibold select-none">SYSTEM ONLINE</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                <span className="text-slate-400 font-semibold select-none">AI CORE READY</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                <span className="text-slate-400 font-semibold select-none">NET CONNECTED</span>
              </span>
            </div>

            <div className="hidden sm:inline-block px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[9px] font-bold tracking-widest uppercase">
              SIMULATION CONSOLE
            </div>
          </div>

          {/* Grid Layout (Desktop: 3 cols Control | Camera | Status; Mobile: vertical order stacking) */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch relative z-10">
            
            {/* COLUMN 1: CONTROL CENTER (lg:col-span-3, order-4 on mobile) */}
            <div className="lg:col-span-3 col-span-12 order-4 lg:order-2 bg-[#090d19]/80 border border-slate-900/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative group">
              <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-500/3 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="space-y-5 relative z-10">
                <h3 className="font-bold text-[11px] tracking-widest text-slate-400 border-b border-slate-900 pb-2.5 flex items-center space-x-2.5 uppercase">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Control Center</span>
                </h3>

                {/* Child Safety Toggle */}
                <div className="bg-slate-950/70 border border-slate-900/80 px-3 py-2.5 rounded-lg flex items-center justify-between min-h-[46px]" data-interactive>
                  <span className="font-bold text-[10px] text-slate-300 uppercase tracking-wide">Child Safety Mode</span>
                  <button
                    onClick={() => setChildSafeMode(!childSafeMode)}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${childSafeMode ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400' : 'bg-slate-800/40 border border-slate-800 text-slate-500'}`}
                  >
                    {childSafeMode ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Visitor Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Visitor Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setVisitorType("homeowner")}
                      className={`h-[44px] text-[10px] font-bold rounded-lg border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${visitorType === "homeowner" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm" : "bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-400"}`}
                      data-interactive
                    >
                      🏡 Homeowner
                    </button>
                    <button
                      onClick={() => setVisitorType("stranger")}
                      className={`h-[44px] text-[10px] font-bold rounded-lg border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer ${visitorType === "stranger" ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-sm" : "bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-400"}`}
                      data-interactive
                    >
                      👤 Stranger
                    </button>
                  </div>
                </div>

                {/* HC-SR04 Proximity Sensor */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Proximity Sensor</label>
                  <button
                    onClick={triggerSensor}
                    className="hover-shine-effect w-full h-[46px] bg-purple-600 hover:bg-purple-700 active:scale-[0.97] hover:scale-[1.01] text-white text-[11px] tracking-wider uppercase font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md shadow-purple-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
                    data-interactive
                  >
                    <span>◎ Trigger Sensor</span>
                  </button>
                </div>

                {/* Parent Override Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Parent Override</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleManualAction("ALLOW")}
                      className="h-[44px] bg-emerald-600/80 hover:bg-emerald-700 active:scale-95 disabled:opacity-20 disabled:pointer-events-none text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                      disabled={!sensorTriggered}
                      data-interactive
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => handleManualAction("DENY")}
                      className="h-[44px] bg-rose-600/80 hover:bg-rose-700 active:scale-95 disabled:opacity-20 disabled:pointer-events-none text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                      disabled={!sensorTriggered}
                      data-interactive
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset / Intercom buttons */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-900/60 mt-4 relative z-10">
                <button
                  onClick={() => setAudioActive(!audioActive)}
                  className={`h-11 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer ${audioActive ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-400"}`}
                  data-interactive
                >
                  🎙️ Intercom
                </button>
                <button
                  onClick={resetSimulator}
                  className="h-11 bg-slate-950/40 border border-slate-900 hover:bg-slate-900 text-slate-500 hover:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 cursor-pointer"
                  data-interactive
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* COLUMN 2: CAMERA VIDEO FEED PANEL (lg:col-span-6, order-2 on mobile) */}
            <div className="lg:col-span-6 col-span-12 order-2 lg:order-3 bg-[#090d19]/80 border border-slate-900/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative group">
              <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-500/3 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="space-y-4 w-full relative z-10">
                <div className="border-b border-slate-900 pb-2.5 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5 uppercase tracking-wider">
                    <span className={`h-1.5 w-1.5 rounded-full ${sensorTriggered ? "bg-red-500 animate-pulse" : "bg-slate-600"}`}></span>
                    <span>Camera Video Feed</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">CAM-01 // WIFI FEED</span>
                </div>

                {/* Camera Viewport (16:9 Aspect ratio) */}
                <div className="aspect-video w-full bg-[#02050e] flex flex-col items-center justify-center relative overflow-hidden rounded-xl border border-slate-900/60 p-4">
                  
                  {/* Subtle technical corner brackets */}
                  <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-slate-800"></span>
                  <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-800"></span>
                  <span className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-800"></span>
                  <span className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-slate-800"></span>

                  {/* Faint technical HUD elements */}
                  <span className="absolute top-2 left-6 text-[8px] font-mono text-slate-700 tracking-widest">30 FPS // SENSOR-01</span>
                  <span className="absolute bottom-2 right-6 text-[8px] font-mono text-slate-700 tracking-widest">ISO 400 // F/1.8</span>

                  {/* Scanning sweep line */}
                  {["SCANNING", "ANALYZING"].includes(simStep) && (
                    <div className="animate-scan-line z-20"></div>
                  )}

                  {sensorTriggered ? (
                    <div className="text-center space-y-4 relative z-10">
                      
                      {/* Bounding box corners overlay target lock */}
                      {["ANALYZING", "VERIFIED", "DENIED"].includes(simStep) && (
                        <div className={`absolute border-[1.8px] rounded-lg w-20 h-20 transition-all duration-300 ease-premium ${
                          simStep === "VERIFIED" 
                            ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-100" 
                            : simStep === "DENIED" 
                              ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)] scale-100" 
                              : "border-purple-500 animate-pulse scale-95"
                        }`}
                        style={{
                          top: "calc(50% - 40px)",
                          left: "calc(50% - 40px)",
                        }}>
                          <span className={`absolute top-[-1px] left-[-1px] w-2.5 h-2.5 border-t border-l ${simStep === "VERIFIED" ? "border-emerald-500" : simStep === "DENIED" ? "border-rose-500" : "border-purple-500"}`}></span>
                          <span className={`absolute top-[-1px] right-[-1px] w-2.5 h-2.5 border-t border-r ${simStep === "VERIFIED" ? "border-emerald-500" : simStep === "DENIED" ? "border-rose-500" : "border-purple-500"}`}></span>
                          <span className={`absolute bottom-[-1px] left-[-1px] w-2.5 h-2.5 border-b border-l ${simStep === "VERIFIED" ? "border-emerald-500" : simStep === "DENIED" ? "border-rose-500" : "border-purple-500"}`}></span>
                          <span className={`absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 border-b border-r ${simStep === "VERIFIED" ? "border-emerald-500" : simStep === "DENIED" ? "border-rose-500" : "border-purple-500"}`}></span>
                        </div>
                      )}

                      {/* Small circular AI processing indicator (rotates slowly during analyzing) */}
                      {simStep === "ANALYZING" && (
                        <div className="absolute top-[calc(50%-44px)] left-[calc(50%-44px)] border-t-2 border-r-2 border-indigo-400/80 rounded-full w-22 h-22 animate-spin-slow"></div>
                      )}

                      <svg className={`w-12 h-12 mx-auto transition-transform duration-300 ${simStep === "VERIFIED" ? "text-emerald-400 scale-105" : simStep === "DENIED" ? "text-rose-400 scale-105" : "text-purple-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>

                      <div className="text-[10px] font-mono select-none">
                        {simStep === "INITIALIZING" && (
                          <span className="text-purple-400/90 font-bold bg-purple-500/5 border border-purple-500/10 px-2 py-1 rounded">
                            CAMERA INITIALIZING...
                          </span>
                        )}
                        {simStep === "SCANNING" && (
                          <span className="text-purple-400 font-bold bg-purple-500/5 border border-purple-500/10 px-2 py-1 rounded animate-pulse">
                            AI: ACTIVE SCANNING...
                          </span>
                        )}
                        {simStep === "ANALYZING" && (
                          <span className="text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-500/10 px-2 py-1 rounded">
                            MATCHING: LANDMARKS...
                          </span>
                        )}
                        {simStep === "VERIFIED" && (
                          <div className="space-y-1">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded block">
                              ✓ VERIFIED // JOHN (HOMEOWNER)
                            </span>
                            <span className="text-[8px] text-emerald-500 font-mono uppercase tracking-widest block pt-0.5">Confidence: High</span>
                          </div>
                        )}
                        {simStep === "DENIED" && (
                          <div className="space-y-1">
                            <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded block">
                              ! UNVERIFIED // ACCESS BLOCKED
                            </span>
                            <span className="text-[8px] text-rose-500 font-mono uppercase tracking-widest block pt-0.5">Confidence: Mismatch</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-700 space-y-2 relative z-10">
                      <svg className="w-10 h-10 mx-auto opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span className="text-[11px] block font-mono text-slate-600 font-semibold uppercase tracking-wider">Awaiting Proximity Event</span>
                    </div>
                  )}

                  {audioActive && (
                    <div className="absolute bottom-2 left-6 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded text-[8px] text-cyan-400 font-bold flex items-center space-x-1 animate-pulse z-20">
                      <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></span>
                      <span>INTERCOM CHANNEL ACTIVE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: SYSTEM STATUS / ACTUATOR PANEL (lg:col-span-3, order-3 on mobile, pulses on denied states) */}
            <div className={`lg:col-span-3 col-span-12 order-3 lg:order-4 bg-[#090d19]/80 border rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative group ${
              simStep === "DENIED" ? "border-rose-500/40 bg-rose-950/5 animate-denied-glow" : "border-slate-900/80"
            }`}>
              <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-500/3 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="space-y-4 relative z-10 w-full flex-1 flex flex-col justify-between">
                <h3 className="font-bold text-[11px] tracking-widest text-slate-400 border-b border-slate-900 pb-2.5 flex items-center space-x-2.5 uppercase">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Actuator Status</span>
                </h3>

                {/* Central Dynamic Lock Status (Pulsing states) */}
                <div className="text-center py-5 flex-1 flex flex-col justify-center items-center">
                  
                  {/* Padlock Icon toggle */}
                  <div className="mb-2">
                    {doorState === "UNLOCKED" ? (
                      <svg className="w-12 h-12 text-emerald-400 transition-transform duration-300 scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className={`w-12 h-12 transition-transform duration-300 ${simStep === "DENIED" ? "text-rose-500 animate-pulse" : simStep === "ANALYZING" ? "text-amber-400 animate-pulse" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>

                  {/* Primary text */}
                  <div className={`font-mono font-black text-xl tracking-widest ${doorState === "UNLOCKED" ? "text-emerald-400" : simStep === "DENIED" ? "text-rose-500" : "text-slate-300"}`}>
                    {getLockStatusText(simStep, doorState)}
                  </div>
                  
                  {/* Subtitle */}
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest pt-1">
                    {doorState === "UNLOCKED" ? "RELAY ENGAGED" : "RELAY SECURED"}
                  </div>
                </div>

                {/* Technical Diagnostic Fields */}
                <div className="space-y-2 text-[10px] font-mono border-t border-slate-900 pt-3.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PHYSICAL LOCK:</span>
                    <span className={`font-bold ${doorState === "UNLOCKED" ? "text-emerald-400" : "text-slate-400"}`}>
                      {doorState === "UNLOCKED" ? "ACTUATED" : "SECURED"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RELAY MODULE:</span>
                    <span className="text-slate-400 font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CHILD SAFETY:</span>
                    <span className={`font-bold ${childSafeMode ? "text-purple-400" : "text-slate-500"}`}>
                      {childSafeMode ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LAST ACTION:</span>
                    <span className={`font-bold uppercase ${simStep === "VERIFIED" ? "text-emerald-400" : simStep === "DENIED" ? "text-rose-400" : "text-slate-500"}`}>
                      {simStep === "VERIFIED" ? "ACCESS ALLOWED" : simStep === "DENIED" ? "ACCESS BLOCKED" : "IDLE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spec identifiers */}
              <div className="flex justify-between text-[9px] font-mono text-slate-600 border-t border-slate-900/60 pt-3 mt-3 relative z-10 w-full select-none">
                <span>RELAY-01</span>
                <span>NET // OK</span>
              </div>
            </div>

            {/* COLUMN 4: EVENT LOG STREAM PANEL (lg:col-span-12, order-5 on mobile, full width at the bottom) */}
            <div className="col-span-12 order-5 bg-[#090d19]/80 border border-slate-900/80 rounded-xl p-5 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between">
              
              {/* Header and Log clear console overrides */}
              <div className="border-b border-slate-900 pb-3 mb-4 flex justify-between items-center w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                  <svg className="w-3.5 h-3.5 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Live Security Event Stream</span>
                </span>
                
                {/* Clear Log Console Button (Height 28px) */}
                <button 
                  onClick={clearLogs}
                  className="h-7 px-3 bg-slate-950/60 border border-slate-900 hover:bg-slate-900 hover:text-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer"
                  data-interactive
                >
                  Clear Event Logs
                </button>
              </div>

              {/* Event Stream Log Rows (Fully responsive, slides and fades in) */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto w-full bg-slate-950/10 p-1.5 rounded-lg border border-slate-900/40">
                {log.length > 0 ? (
                  log.map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${entry.color}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-slate-500 font-bold text-[10.5px] whitespace-nowrap">{entry.time}</span>
                        <span className="text-slate-700 font-mono">|</span>
                        
                        <div className="flex items-center space-x-2.5">
                          <span className="text-white font-extrabold text-[12px]">{entry.visitor}</span>
                          
                          {/* Event type tags */}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            entry.status === "VERIFIED" 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-300 font-mono text-[11px] sm:text-right bg-slate-950/50 px-3 py-1 rounded border border-slate-900/60 max-w-full sm:max-w-md truncate">
                        {entry.action}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-600 font-mono text-xs uppercase tracking-wider select-none">
                    No active events in local memory stream.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Feature Cards Section (Grid layout 4cols desktop, 2cols tablet, 1col mobile) */}
      <section id="features" className="py-16 sm:py-28 max-w-[1200px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 border-b border-slate-900/60 reveal-on-scroll box-border">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span className="text-purple-400">✦</span> SAFEENTRY AI ARCHITECTURE
          </span>
          <h2 className="text-[clamp(1.6rem,7vw,2.25rem)] font-extrabold tracking-tight text-white">
            System Features
          </h2>
          <div className="h-0.5 w-16 bg-purple-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Explaining the primary modules of our cyber-physical home safety design.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((feat, idx) => (
            <div 
              key={idx}
              className="group bg-slate-950/40 border border-slate-900/80 hover:border-purple-500/20 hover:bg-slate-900/20 rounded-xl p-6 sm:p-7 space-y-4 hover:-translate-y-[5px] transition-all duration-300 flex flex-col justify-between reveal-on-scroll"
              style={{ transitionDelay: `${idx * 70}ms` }}
              data-interactive
            >
              <div className="space-y-4">
                <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  {feat.icon}
                </div>
                <h3 className="font-extrabold text-white text-[18px] sm:text-[19px] tracking-wide">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Flow / Architecture Timeline (With running pulses on vertical connector line) */}
      <section id="architecture" className="py-16 sm:py-28 bg-slate-900/15 border-b border-slate-900/60 reveal-on-scroll box-border">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 box-border">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="text-purple-400">✦</span> HARDWARE ROUTING SIGNAL PATH
            </span>
            <h2 className="text-[clamp(1.6rem,7vw,2.25rem)] font-extrabold tracking-tight text-white">
              System Execution Flow
            </h2>
            <div className="h-0.5 w-16 bg-purple-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Trace the signal sequence from visitor proximity detection to smart lock control.
            </p>
          </div>

          <div className="relative ml-4 sm:ml-24 md:ml-32 space-y-12">
            
            {/* Animated data flow connector line overlay */}
            <div className="absolute left-[6.5px] top-3.5 bottom-3.5 w-[2px] animate-flow-line pointer-events-none"></div>

            {/* Step 1 */}
            <div className="relative pl-8 sm:pl-12 group reveal-on-scroll" data-interactive>
              {/* Timeline marker with glow shadow */}
              <div className="absolute -left-[6.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/50 z-10"></div>
              <div className="grid md:grid-cols-12 gap-2 md:gap-4">
                <div className="md:col-span-3 text-[11px] font-extrabold text-purple-400 tracking-widest uppercase md:text-right md:absolute md:-left-40 md:w-32 md:top-1 select-none">
                  1. Proximity
                </div>
                <div className="md:col-span-9 space-y-1.5">
                  <h4 className="font-bold text-white text-base">Visitor Approaches Entrance</h4>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                    The HC-SR04 ultrasonic range calculation module computes object distance. When a person steps within range, the module sends an interrupt pin trigger to wake up the ESP32-CAM controller.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-8 sm:pl-12 group reveal-on-scroll" data-interactive>
              <div className="absolute -left-[6.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/50 z-10"></div>
              <div className="grid md:grid-cols-12 gap-2 md:gap-4">
                <div className="md:col-span-3 text-[11px] font-extrabold text-purple-400 tracking-widest uppercase md:text-right md:absolute md:-left-40 md:w-32 md:top-1 select-none">
                  2. Capture
                </div>
                <div className="md:col-span-9 space-y-1.5">
                  <h4 className="font-bold text-white text-base">Image Transmission & AI Processing</h4>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                    The camera lens takes a visitor JPEG frame and transmits it over HTTP to the backend server. The Express controller loads face landmarks using `@vladmandic/face-api` (built on TensorFlow.js) to match embeddings against saved profile records.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8 sm:pl-12 group reveal-on-scroll" data-interactive>
              <div className="absolute -left-[6.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/50 z-10"></div>
              <div className="grid md:grid-cols-12 gap-2 md:gap-4">
                <div className="md:col-span-3 text-[11px] font-extrabold text-purple-400 tracking-widest uppercase md:text-right md:absolute md:-left-40 md:w-32 md:top-1 select-none">
                  3. Evaluation
                </div>
                <div className="md:col-span-9 space-y-1.5">
                  <h4 className="font-bold text-white text-base">Authentication & Child Shield Evaluation</h4>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                    If verified as a parent, the system unlocks. If unrecognized or stranger, the system invokes the child safety filter: it flags the event, locks the door, and sends an interactive snapshot notification containing action buttons directly to the parent.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative pl-8 sm:pl-12 group reveal-on-scroll" data-interactive>
              <div className="absolute -left-[6.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/50 z-10"></div>
              <div className="grid md:grid-cols-12 gap-2 md:gap-4">
                <div className="md:col-span-3 text-[11px] font-extrabold text-purple-400 tracking-widest uppercase md:text-right md:absolute md:-left-40 md:w-32 md:top-1 select-none">
                  4. Actuation
                </div>
                <div className="md:col-span-9 space-y-1.5">
                  <h4 className="font-bold text-white text-base">Wireless Actuation & Audit Logging</h4>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                    Upon receiving parental permission via bot click, the Node.js API sends a secure TCP request to the ESP32 smart lock. The lock rotates the physical servo motor to release the deadbolt, while Prisma logs the audit path.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications Section (Two side-by-side cards on desktop, stacked on mobile) */}
      <section id="specs" className="py-16 sm:py-28 max-w-[1240px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 reveal-on-scroll box-border">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span className="text-purple-400">✦</span> COMPONENT SPECS
          </span>
          <h2 className="text-[clamp(1.6rem,7vw,2.25rem)] font-extrabold tracking-tight text-white">
            Technical Specification Stack
          </h2>
          <div className="h-0.5 w-16 bg-purple-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            A comprehensive breakdown of the hardware modules and software libraries configured in this project.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Hardware List Card */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 lg:p-8 shadow-xl hover:border-slate-800 transition-all duration-300">
            <h3 className="font-bold text-sm tracking-wider text-white mb-6 flex items-center space-x-2.5 uppercase">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>Hardware Modules</span>
            </h3>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-900/60 bg-slate-950/60">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-950">
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Engineering Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {hardwareSpecs.map((spec, i) => (
                    <tr key={i} className="hover:bg-slate-900/35 transition-colors" data-interactive>
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">{spec.name}</td>
                      <td className="py-3.5 px-4 text-slate-400 leading-relaxed">{spec.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block sm:hidden space-y-4">
              {hardwareSpecs.map((spec, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-900/80 bg-slate-950/50 space-y-1">
                  <div className="text-[13px] font-extrabold text-purple-400 uppercase tracking-wide">{spec.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{spec.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Software Stack Card */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 lg:p-8 shadow-xl hover:border-slate-800 transition-all duration-300">
            <h3 className="font-bold text-sm tracking-wider text-white mb-6 flex items-center space-x-2.5 uppercase">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Software Library Stack</span>
            </h3>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-900/60 bg-slate-950/60">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-950">
                    <th className="py-3.5 px-4">Dependency</th>
                    <th className="py-3.5 px-4">Implementation Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {softwareSpecs.map((spec, i) => (
                    <tr key={i} className="hover:bg-slate-900/35 transition-colors" data-interactive>
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">{spec.name}</td>
                      <td className="py-3.5 px-4 text-slate-400 leading-relaxed">{spec.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block sm:hidden space-y-4">
              {softwareSpecs.map((spec, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-900/80 bg-slate-950/50 space-y-1">
                  <div className="text-[13px] font-extrabold text-purple-400 uppercase tracking-wide">{spec.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{spec.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-sm py-12 text-center text-xs text-slate-500 box-border">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 space-y-5">
          {/* Footer Logo Layout */}
          <div className="flex items-center justify-center space-x-3">
            <img 
              src={logoImg} 
              alt="SafeEntry AI logo" 
              className="h-[30px] w-[30px] md:h-[34px] md:w-[34px] object-contain" 
            />
            <span className="font-extrabold text-white text-sm tracking-wide uppercase select-none">SafeEntry AI</span>
          </div>
          
          <p className="max-w-md mx-auto leading-relaxed text-[11.5px] px-2">
            Fostering security solutions for STEM exhibitions and science fairs. Formulating cyber-physical door safeguards for households.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] uppercase font-bold tracking-widest pt-2">
            <a href="#features" className="hover:text-slate-300 transition-colors" data-interactive>Features</a>
            <span className="hidden sm:inline">•</span>
            <a href="#simulator" className="hover:text-slate-300 transition-colors" data-interactive>Sandbox Demo</a>
            <span className="hidden sm:inline">•</span>
            <a href="#architecture" className="hover:text-slate-300 transition-colors" data-interactive>Execution Flow</a>
          </div>

          <div className="text-[10px] text-slate-600 pt-4 border-t border-slate-900/60 max-w-xl mx-auto px-4">
            © 2026 SafeEntry AI. Licensed under standard academic and project guidelines.
          </div>
        </div>
      </footer>
    </div>
  );
}
function getLockStatusText(simStep, doorState) {
  if (simStep === "INITIALIZING" || simStep === "SCANNING") return "SECURED";
  if (simStep === "ANALYZING") return "AUTHORIZING";
  if (simStep === "VERIFIED") return "UNLOCKED";
  if (simStep === "DENIED") return "DENIED";
  return doorState; // "LOCKED" or "UNLOCKED"
}

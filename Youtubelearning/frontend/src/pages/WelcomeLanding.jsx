import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";
import "./WelcomeLanding.css";

export default function WelcomeLanding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Navigation scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero collage mouse tilt ref
  const heroStageRef = useRef(null);
  const [activeHeroTag, setActiveHeroTag] = useState("coding");

  // Workspace mock interactive player state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(1122); // 18:42
  const [activeTimestamp, setActiveTimestamp] = useState("2"); // '1', '2', '3', '4'
  const [bookmarkToast, setBookmarkToast] = useState("");

  // AI Assistant tab state
  const [aiTab, setAiTab] = useState("summary"); // 'summary' | 'ask' | 'quiz' | 'flash'
  const [typedAnswer, setTypedAnswer] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null); // 'correct' | 'wrong'

  // Flashcards state
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlashFlipped, setIsFlashFlipped] = useState(false);
  const flashcardsData = [
    {
      q: "What is the primary role of the useEffect dependency array?",
      a: "It controls when the effect executes by comparing current values to previous values by reference.",
    },
    {
      q: "What is the time complexity of QuickSort average vs worst case?",
      a: "Average: O(N log N). Worst case: O(N²) when the pivot selection is unbalanced.",
    },
    {
      q: "What is the key benefit of React memoization (useMemo)?",
      a: "It caches expensive function results between renders when dependencies have not changed.",
    },
  ];

  // Developer Arena Code Editor state
  const [codeLang, setCodeLang] = useState("javascript");
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeOutput, setCodeOutput] = useState("");
  const codeSnippets = {
    javascript: [
      "function maxSubarray(nums, k) {",
      "  let left = 0, sum = 0, best = 0;",
      "  // two-pointer sliding window",
      "  for (let right = 0; right < nums.length; right++) {",
      "    sum += nums[right];",
      "    while (sum > k) sum -= nums[left++];",
      "    best = Math.max(best, right - left + 1);",
      "  }",
      "  return best;",
      "}",
    ],
    python: [
      "def max_subarray(nums, k):",
      "    left = sum_val = best = 0",
      "    # two-pointer sliding window",
      "    for right, val in enumerate(nums):",
      "        sum_val += val",
      "        while sum_val > k:",
      "            sum_val -= nums[left]",
      "            left += 1",
      "        best = max(best, right - left + 1)",
      "    return best",
    ],
    cpp: [
      "int maxSubarray(vector<int>& nums, int k) {",
      "    int left = 0, sum = 0, best = 0;",
      "    // two-pointer sliding window",
      "    for (int right = 0; right < nums.size(); right++) {",
      "        sum += nums[right];",
      "        while (sum > k) sum -= nums[left++];",
      "        best = max(best, right - left + 1);",
      "    }",
      "    return best;",
      "}",
    ],
  };

  // Contest countdowns & reminders
  const [reminders, setReminders] = useState({ 1: false, 2: true, 3: false, 4: false });
  const [countdowns, setCountdowns] = useState({
    1: { d: "01", h: "12", m: "30", s: "45" },
    2: { d: "03", h: "04", m: "15", s: "12" },
    3: { d: "06", h: "18", m: "45", s: "30" },
    4: { d: "09", h: "09", m: "00", s: "08" },
  });

  // Planner state
  const [plannerTasks, setPlannerTasks] = useState({
    mon: [
      { id: "t-1", text: "Watch React lecture", c: "1" },
      { id: "t-2", text: "Solve 2 DSA problems", c: "2" },
    ],
    tue: [
      { id: "t-3", text: "Revise notes", c: "3" },
      { id: "t-4", text: "Take quiz", c: "1" },
    ],
    wed: [{ id: "t-5", text: "Review weak topics", c: "4" }],
    thu: [
      { id: "t-6", text: "Codeforces round", c: "2" },
      { id: "t-7", text: "Flashcard review", c: "3" },
    ],
    fri: [{ id: "t-8", text: "Mock quiz — full module", c: "1" }],
  });
  const [draggedItem, setDraggedItem] = useState(null);

  // Buddy connect buttons state & live chat
  const [connectedBuddies, setConnectedBuddies] = useState({ 1: false, 2: true, 3: false });
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "RK", name: "Riya", text: "Stuck on the useEffect cleanup part — got a sec?", isMe: false },
    { id: 2, sender: "You", name: "You", text: "Yep, sending my notes on it now", isMe: true },
  ]);

  // How it works path fill percentage
  const [pathFillPercent, setPathFillPercent] = useState(30);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Video playback ticker
  useEffect(() => {
    let interval;
    if (isVideoPlaying) {
      interval = setInterval(() => {
        setVideoSeconds((prev) => {
          if (prev >= 1810) return 490; // loop back to 08:10
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  // Scroll listener for nav and parallax blob
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      const heroBlob = document.querySelector(".welcome-scope .hero-bg-blob");
      if (heroBlob) {
        const y = Math.min(window.scrollY, 700);
        heroBlob.style.transform = `translate3d(0,${y * 0.18}px,0) rotate(${y * 0.02}deg) scale(${1 + y * 0.0003})`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for scroll reveals
  useEffect(() => {
    const revealEls = document.querySelectorAll(".welcome-scope .reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hero collage mousemove 3D tilt with depth and specular highlights
  useEffect(() => {
    const stage = heroStageRef.current;
    if (!stage || !window.matchMedia("(hover:hover)").matches) return;

    const handleMouseMove = (ev) => {
      stage.querySelectorAll(".c-card").forEach((card) => {
        const r = card.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        const inside =
          ev.clientX > r.left &&
          ev.clientX < r.right &&
          ev.clientY > r.top &&
          ev.clientY < r.bottom;
        const strength = inside ? 1.2 : 0.45;
        card.style.transform = `perspective(900px) rotateX(${py * -10 * strength}deg) rotateY(${px * 12 * strength}deg) translateY(${inside ? -6 : 0}px) scale3d(${inside ? 1.02 : 1}, ${inside ? 1.02 : 1}, 1)`;
      });
    };

    const handleMouseLeave = () => {
      stage.querySelectorAll(".c-card").forEach((card) => {
        card.style.transform = "";
      });
    };

    stage.addEventListener("mousemove", handleMouseMove);
    stage.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // AI typing simulation when switching to "ask" tab
  useEffect(() => {
    if (aiTab === "ask" && !typedAnswer) {
      const timer = setTimeout(() => {
        setTypedAnswer(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [aiTab, typedAnswer]);

  // Live countdown timer ticker (seconds tick down)
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          let s = parseInt(next[k].s, 10) - 1;
          let m = parseInt(next[k].m, 10);
          if (s < 0) {
            s = 59;
            m = Math.max(0, m - 1);
          }
          next[k] = {
            ...next[k],
            s: String(s).padStart(2, "0"),
            m: String(m).padStart(2, "0"),
          };
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // How it works scroll observer for progress line
  useEffect(() => {
    const steps = document.querySelectorAll(".welcome-scope .how-step");
    if (!steps.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            const idx = Array.from(steps).indexOf(entry.target);
            setPathFillPercent(Math.round(((idx + 1) / steps.length) * 100));
          }
        });
      },
      { threshold: 0.5 }
    );

    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Jump to video timestamp
  const handleSeek = (tsId, seconds) => {
    setActiveTimestamp(tsId);
    setVideoSeconds(seconds);
    setIsVideoPlaying(true);
  };

  // Run Code Execution Simulator
  const handleExecuteCode = () => {
    setCodeRunning(true);
    setCodeOutput("Compiling in isolated sandbox environment...");
    setTimeout(() => {
      setCodeRunning(false);
      setCodeOutput("✓ 3/3 Test cases passed! [Target: 9] Runtime: 12ms (Faster than 96.4%)");
    }, 600);
  };

  // Chat message send handler
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "You", name: "You", text: chatInput.trim(), isMe: true },
    ]);
    setChatInput("");
  };

  // Drag-and-drop task reordering
  const handleDragStart = (e, task, day) => {
    setDraggedItem({ task, fromDay: day });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, toDay) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { task, fromDay } = draggedItem;
    if (fromDay === toDay) return;

    setPlannerTasks((prev) => {
      const nextFrom = prev[fromDay].filter((t) => t.id !== task.id);
      const nextTo = [...prev[toDay], task];
      return { ...prev, [fromDay]: nextFrom, [toDay]: nextTo };
    });
    setDraggedItem(null);
  };

  const handleAddTask = (day) => {
    const text = prompt("Enter new study task title:", "Revise lecture module");
    if (!text || !text.trim()) return;
    const newTask = {
      id: `t-${Date.now()}`,
      text: text.trim(),
      c: String(1 + Math.floor(Math.random() * 4)),
    };
    setPlannerTasks((prev) => ({
      ...prev,
      [day]: [...prev[day], newTask],
    }));
  };

  const startLearningRoute = isAuthenticated ? "/workspace" : "/register";

  return (
    <div className="welcome-scope">
      {/* SVG Sprite Definitions */}
      <svg className="hidden" aria-hidden="true">
        <defs>
          <symbol id="i-play" viewBox="0 0 24 24" fill="none">
            <path d="M6 4l14 8-14 8V4z" fill="currentColor" />
          </symbol>
          <symbol id="i-pause" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </symbol>
          <symbol id="i-prev" viewBox="0 0 24 24" fill="none">
            <path d="M6 4v16M18 5l-10 7 10 7V5z" fill="currentColor" />
          </symbol>
          <symbol id="i-next" viewBox="0 0 24 24" fill="none">
            <path d="M18 4v16M6 5l10 7-10 7V5z" fill="currentColor" />
          </symbol>
          <symbol id="i-vol" viewBox="0 0 24 24" fill="none">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          </symbol>
          <symbol id="i-check" viewBox="0 0 24 24" fill="none">
            <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </symbol>
          <symbol id="i-chev-r" viewBox="0 0 24 24" fill="none">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </symbol>
          <symbol id="i-flame" viewBox="0 0 24 24" fill="none">
            <path d="M12 2c1 4-4 5-4 9a4 4 0 108 0c0-1.5-1-2-1-3.5 1.5 1 3 2.8 3 5.5a6 6 0 11-12 0c0-5 3-7 6-11z" fill="currentColor" />
          </symbol>
          <symbol id="i-trophy" viewBox="0 0 24 24" fill="none">
            <path d="M7 4h10v4a5 5 0 01-5 5 5 5 0 01-5-5V4z" fill="currentColor" />
            <path d="M5 5H3v2a4 4 0 004 4M19 5h2v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <path d="M10 15h4v3h-4z" fill="currentColor" />
            <path d="M7 21h10v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1z" fill="currentColor" />
          </symbol>
          <symbol id="i-star" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" fill="currentColor" />
          </symbol>
          <symbol id="i-mail" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M4 6l8 7 8-7" stroke="currentColor" strokeWidth="1.7" fill="none" />
          </symbol>
          <symbol id="i-key" viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M12 12h9m-4 0v4m-2-4v3" stroke="currentColor" strokeWidth="1.7" />
          </symbol>
          <symbol id="i-lock" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.7" fill="none" />
          </symbol>
          <symbol id="i-gauge" viewBox="0 0 24 24" fill="none">
            <path d="M4 15a8 8 0 1116 0" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M12 15l4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </symbol>
          <symbol id="i-server" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <rect x="4" y="14" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <circle cx="7.5" cy="7" r="1" fill="currentColor" />
            <circle cx="7.5" cy="17" r="1" fill="currentColor" />
          </symbol>
          <symbol id="i-sparkle" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" fill="currentColor" />
          </symbol>
          <symbol id="i-search" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </symbol>
          <symbol id="i-note" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </symbol>
          <symbol id="i-quiz" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M9.5 9a2.5 2.5 0 015 .3c0 1.7-2.2 1.7-2.5 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="16.3" r="1" fill="currentColor" />
          </symbol>
          <symbol id="i-progress" viewBox="0 0 24 24" fill="none">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </symbol>
          <symbol id="i-medal" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="14" r="6" fill="currentColor" />
            <path d="M9 4l3 6 3-6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </symbol>
          <symbol id="i-file" viewBox="0 0 24 24" fill="none">
            <path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </symbol>
          <symbol id="i-image" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </symbol>
          <symbol id="i-bell" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </symbol>
          <symbol id="i-steps" viewBox="0 0 24 24" fill="none">
            <path d="M3 19h4v-4h4v-4h4V7h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </symbol>
          <symbol id="i-target" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </symbol>
          <symbol id="i-calendar" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </symbol>
          <symbol id="i-menu" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </symbol>
          <symbol id="i-yt" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <path d="M10 9l6 3-6 3V9z" fill="currentColor" />
          </symbol>
        </defs>
      </svg>

      {/* ============ NAVIGATION ============ */}
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`} id="nav">
        <div className="container nav-row">
          <Link to="/" className="brand">
            <svg className="brand-mark" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="10" fill="url(#brandGrad)" />
              <path d="M13 11l9 6-9 6V11z" fill="white" />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="34" y2="34">
                  <stop stopColor="#2563eb" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col leading-none">
              <span className="brand-word font-bold tracking-tight">LearnSphere</span>
              <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">Interactive Studio</span>
            </div>
          </Link>

          <ul className="nav-links">
            <li><a href="#workspace">Workspace</a></li>
            <li><a href="#ai">AI Assistant</a></li>
            <li><a href="#dev">Developer Arena</a></li>
            <li><a href="#analytics">Progress</a></li>
            <li><a href="#social">Community</a></li>
          </ul>

          <div className="nav-cta">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/workspace" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  Workspace
                </Link>
                <Link to="/dashboard" className="btn btn-dark btn-sm">
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-dark btn-sm">
                  Start Free
                </Link>
              </div>
            )}
          </div>

          <button
            className="nav-menu-btn"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <svg width="18" height="18"><use href="#i-menu" /></svg>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
          <a href="#workspace" onClick={() => setMobileMenuOpen(false)}>Workspace</a>
          <a href="#ai" onClick={() => setMobileMenuOpen(false)}>AI Assistant</a>
          <a href="#dev" onClick={() => setMobileMenuOpen(false)}>Developer Arena</a>
          <a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Progress</a>
          <a href="#social" onClick={() => setMobileMenuOpen(false)}>Community</a>
          <div className="flex flex-col gap-2 pt-2">
            {isAuthenticated ? (
              <>
                <Link to="/workspace" className="btn btn-ghost btn-sm w-full" onClick={() => setMobileMenuOpen(false)}>
                  Open Workspace
                </Link>
                <Link to="/dashboard" className="btn btn-dark btn-sm w-full" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm w-full" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-dark btn-sm w-full" onClick={() => setMobileMenuOpen(false)}>
                  Start Learning
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <header className="hero" id="hero">
        <div className="hero-bg-blob" aria-hidden="true"></div>
        <div className="container hero-grid">
          <div>
            {isAuthenticated && user && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Welcome, <strong>{user.name || user.email?.split("@")[0]}</strong>! Your workspace is ready.</span>
              </div>
            )}
            <span className="hero-eyebrow">
              <span className="dot">
                <svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg>
              </span>
              Your Intelligent Learning Operating System
            </span>
            <h1 className="reveal in">Turn every video into knowledge you actually retain.</h1>
            <p className="lead reveal in">
              Turn tutorials into real mastery with synced live transcripts, AI notes, and instant coding sandboxes.
            </p>
            <div className="flex flex-wrap gap-2 my-4 reveal in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><use href="#i-yt" /></svg> Video + Transcript Sync
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><use href="#i-sparkle" /></svg> AI Notes &amp; Flashcards
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><use href="#i-code" /></svg> In-Browser Code Sandbox
              </span>
            </div>
            <div className="hero-cta-row reveal in">
              {isAuthenticated ? (
                <>
                  <Link to="/workspace" className="btn btn-dark">
                    Open Workspace <svg viewBox="0 0 24 24"><use href="#i-chev-r" /></svg>
                  </Link>
                  <Link to="/dashboard" className="btn btn-ghost">Go to Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-dark">
                    Start Learning Free <svg viewBox="0 0 24 24"><use href="#i-chev-r" /></svg>
                  </Link>
                  <a href="#workspace" className="btn btn-ghost">Explore Studio</a>
                </>
              )}
            </div>
            <div className="hero-trust reveal in">
              <div className="avatar-stack">
                <span className="av" style={{ background: "var(--sage-deep)" }}>RK</span>
                <span className="av" style={{ background: "var(--sky-deep)" }}>MS</span>
                <span className="av" style={{ background: "var(--lav-deep)" }}>PT</span>
              </div>
              <span>10,000+ developers &amp; students learning daily</span>
            </div>
          </div>

          {/* 3D Interactive Perspective Collage */}
          <div className="collage-stage" ref={heroStageRef}>
            <div className="collage">
              {/* 3D Path Card */}
              <div className="c-card c-path">
                <div>
                  <span className="c-kicker">Interactive Tracks</span>
                  <h3>Explore courses built around you</h3>
                </div>
                <svg className="c-path-figure" viewBox="0 0 160 160" fill="none">
                  <ellipse cx="80" cy="150" rx="55" ry="8" fill="rgba(44,36,22,0.12)" />
                  <rect x="30" y="95" width="70" height="46" rx="6" fill="#1e3a8a" fillOpacity="0.85" />
                  <rect x="36" y="101" width="58" height="34" rx="3" fill="#60a5fa" fillOpacity="0.9" />
                  <circle cx="95" cy="55" r="22" fill="#2563eb" fillOpacity="0.85" />
                  <path d="M95 74c-16 0-26 10-26 22h52c0-12-10-22-26-22z" fill="#1d4ed8" fillOpacity="0.85" />
                </svg>
                <div className="c-tags">
                  <button
                    type="button"
                    onClick={() => setActiveHeroTag("coding")}
                    className={`c-tag ${activeHeroTag === "coding" ? "on" : ""}`}
                  >
                    Coding
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTag("design")}
                    className={`c-tag ${activeHeroTag === "design" ? "on" : ""}`}
                  >
                    System Design
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTag("ai")}
                    className={`c-tag ${activeHeroTag === "ai" ? "on" : ""}`}
                  >
                    AI &amp; Data
                  </button>
                </div>
              </div>

              {/* 3D Study circles card */}
              <div className="c-card c-team">
                <div>
                  <span className="c-kicker">Learn together</span>
                  <h4>Study circles, live</h4>
                </div>
                <div className="net-wrap">
                  <svg viewBox="0 0 220 140" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                    <g stroke="rgba(255,255,255,0.2)" strokeWidth="1.4">
                      <line x1="110" y1="70" x2="40" y2="30" />
                      <line x1="110" y1="70" x2="185" y2="24" />
                      <line x1="110" y1="70" x2="30" y2="105" />
                      <line x1="110" y1="70" x2="100" y2="120" />
                      <line x1="110" y1="70" x2="180" y2="105" />
                    </g>
                    <circle cx="110" cy="70" r="13" fill="#3b82f6" />
                    <circle cx="40" cy="30" r="8" fill="#10b981" />
                    <circle cx="185" cy="24" r="7" fill="#f59e0b" />
                    <circle cx="30" cy="105" r="7" fill="#8b5cf6" />
                    <circle cx="100" cy="120" r="8" fill="#38bdf8" />
                    <circle cx="180" cy="105" r="6" fill="#10b981" />
                  </svg>
                </div>
                <span className="net-live">
                  <i style={{ background: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,0.3)" }}></i>
                  14 learners online now
                </span>
              </div>

              {/* 3D Discover card */}
              <div className="c-card c-discover">
                <span className="c-kicker" style={{ color: "var(--ink-faint)" }}>Discover your path</span>
                <div className="searchbar">
                  <svg viewBox="0 0 24 24"><use href="#i-search" /></svg>Search a topic…
                </div>
                <div className="topo-wrap">
                  <svg viewBox="0 0 240 140" width="100%" height="100%" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="topoGradHero" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 Q60,20 120,60 T240,40 L240,140 L0,140 Z" fill="url(#topoGradHero)" />
                    <path d="M0,95 Q50,50 110,80 T240,65 L240,140 L0,140 Z" fill="url(#topoGradHero)" opacity="0.6" />
                  </svg>
                </div>
                <span className="cap">Full curriculum indexed</span>
              </div>

              {/* 3D Floating chip with perspective elevation */}
              <div className="float-chip">
                <div className="fc-ic">
                  <svg viewBox="0 0 24 24"><use href="#i-quiz" /></svg>
                </div>
                <div>
                  <div className="fc-title">Active Recall Mode</div>
                  <div className="fc-sub">94% Retention Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ WORKSPACE SECTION: 3D INTERACTIVE STUDIO ============ */}
      <section className="section" id="workspace">
        <div className="container">
          <div className="section-head reveal">
            <h2>Interactive Video Studio</h2>
            <p>Video, live transcripts, and smart notes in continuous sync. Click any sentence to jump.</p>
          </div>

          <div className="pipeline reveal">
            <div className="pipe-step"><svg viewBox="0 0 24 24"><use href="#i-yt" /></svg>YouTube video</div>
            <div className="pipe-arrow"></div>
            <div className="pipe-step"><svg viewBox="0 0 24 24"><use href="#i-file" /></svg>Synced Transcript</div>
            <div className="pipe-arrow"></div>
            <div className="pipe-step"><svg viewBox="0 0 24 24"><use href="#i-note" /></svg>Smart Notes</div>
            <div className="pipe-arrow"></div>
            <div className="pipe-step ai-step"><svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg>AI Copilot</div>
            <div className="pipe-arrow"></div>
            <div className="pipe-step"><svg viewBox="0 0 24 24"><use href="#i-progress" /></svg>Retention</div>
          </div>

          <div className="workspace-panel reveal">
            <div className="card player-block tilt">
              <div className="ws-course">
                <div>
                  <div className="name">React Fundamentals &amp; Performance</div>
                  <div className="sub">Lecture 4 of 12 · Hooks &amp; Memoization in Depth</div>
                </div>
                <span className="chip chip-sage">
                  <svg viewBox="0 0 24 24"><use href="#i-check" /></svg>
                  {Math.min(100, Math.round((videoSeconds / 1810) * 100))}% Watched
                </span>
              </div>

              {/* Interactive Player Screen with Play/Pause and Seek */}
              <div className="player-real">
                <span className="badge-cc">CC · Synced Live</span>
                <span className="badge-watch">
                  {isVideoPlaying ? "▶ Playing" : "⏸ Paused"} · {formatTime(videoSeconds)} / 30:10
                </span>
                <div
                  className="play-glyph"
                  onClick={() => setIsVideoPlaying((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24">
                    <use href={isVideoPlaying ? "#i-pause" : "#i-play"} />
                  </svg>
                </div>
              </div>

              {/* Interactive Controls Bar */}
              <div className="ctrl-row">
                <button
                  className="ctrl-btn"
                  aria-label="Previous"
                  onClick={() => handleSeek("1", 490)}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-prev" /></svg>
                </button>
                <button
                  className="ctrl-btn"
                  aria-label="Play Toggle"
                  onClick={() => setIsVideoPlaying((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24">
                    <use href={isVideoPlaying ? "#i-pause" : "#i-play"} />
                  </svg>
                </button>
                <button
                  className="ctrl-btn"
                  aria-label="Next"
                  onClick={() => handleSeek("3", 965)}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-next" /></svg>
                </button>
                <span className="ctrl-time">{formatTime(videoSeconds)}</span>
                <div
                  className="seekbar"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setVideoSeconds(Math.round(ratio * 1810));
                    setIsVideoPlaying(true);
                  }}
                >
                  <i style={{ width: `${(videoSeconds / 1810) * 100}%` }}></i>
                  <span className="mark" style={{ left: "27%" }}></span>
                  <span className="mark" style={{ left: "42%" }}></span>
                  <span className="mark" style={{ left: "53%" }}></span>
                  <span className="mark" style={{ left: "71%" }}></span>
                </div>
                <span className="ctrl-time">30:10</span>
                <button className="ctrl-btn" aria-label="Volume">
                  <svg viewBox="0 0 24 24"><use href="#i-vol" /></svg>
                </button>
              </div>

              {/* Clickable Synchronized Transcript */}
              <div className="transcript">
                <div className="flex items-center justify-between mb-2">
                  <h4 style={{ margin: 0 }}>Synchronized Transcript</h4>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    👆 Click sentence to seek video
                  </span>
                </div>
                <div className="t-list">
                  <div
                    className={`t-line ${activeTimestamp === "1" ? "active" : ""}`}
                    onClick={() => handleSeek("1", 490)}
                  >
                    <time>08:10</time>
                    <span>useEffect runs after the browser paints, not before.</span>
                  </div>
                  <div
                    className={`t-line ${activeTimestamp === "2" ? "active" : ""}`}
                    onClick={() => handleSeek("2", 762)}
                  >
                    <time>12:42</time>
                    <span>Dependency arrays decide when your effect re-runs.</span>
                  </div>
                  <div
                    className={`t-line ${activeTimestamp === "3" ? "active" : ""}`}
                    onClick={() => handleSeek("3", 965)}
                  >
                    <time>16:05</time>
                    <span>Custom hooks let you extract and reuse logic cleanly.</span>
                  </div>
                  <div
                    className={`t-line ${activeTimestamp === "4" ? "active" : ""}`}
                    onClick={() => handleSeek("4", 1290)}
                  >
                    <time>21:30</time>
                    <span>useRef persists a value without triggering a re-render.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Notes Column with active link */}
            <div className="card notes-block tilt">
              <div className="notes-head">
                <h4>Synchronized Notes</h4>
                <button
                  onClick={() => {
                    setBookmarkToast("Bookmark saved at " + formatTime(videoSeconds));
                    setTimeout(() => setBookmarkToast(""), 2200);
                  }}
                  className="chip chip-outline hover:border-blue-500 transition cursor-pointer"
                >
                  <svg viewBox="0 0 24 24"><use href="#i-note" /></svg>+ Bookmark at {formatTime(videoSeconds)}
                </button>
              </div>

              {bookmarkToast && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  ✓ {bookmarkToast}
                </div>
              )}

              <div
                className={`note-item ${activeTimestamp === "1" ? "active" : ""}`}
                onClick={() => handleSeek("1", 490)}
              >
                <div className="nt-top"><time>08:10</time></div>
                <p>Effects run <em>after</em> paint — ideal for anything that shouldn't block rendering.</p>
              </div>

              <div
                className={`note-item ${activeTimestamp === "2" ? "active" : ""}`}
                onClick={() => handleSeek("2", 762)}
              >
                <div className="nt-top"><time>12:42</time></div>
                <p>Empty array = run once. No array = run every render. Verify dependencies.</p>
                <div className="note-tags"><span className="chip chip-sky">Critical</span></div>
              </div>

              <div
                className={`note-item ${activeTimestamp === "3" ? "active" : ""}`}
                onClick={() => handleSeek("3", 965)}
              >
                <div className="nt-top"><time>16:05</time></div>
                <p>Custom hooks are plain functions that encapsulate React hook calls.</p>
              </div>

              <div className="ws-stats">
                <div className="ws-stat">
                  <div className="v">{formatTime(videoSeconds)}</div>
                  <div className="l">Position</div>
                </div>
                <div className="ws-stat">
                  <div className="v">1.25x</div>
                  <div className="l">Speed</div>
                </div>
              </div>

              <div className="ws-resume">
                <Link to="/workspace" className="btn btn-dark btn-sm w-full">
                  Launch Live Studio <svg viewBox="0 0 24 24"><use href="#i-chev-r" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ AI ASSISTANT: 3D INTERACTIVE TABS ============ */}
      <section className="section section-alt ai-zone" id="ai">
        <div className="container">
          <div className="section-head reveal">
            <h2>AI Study Assistant</h2>
            <p>Instant summaries, active recall quizzes, and 3D flashcards anchored to your video.</p>
          </div>

          <div className="card ai-panel reveal tilt">
            <div className="tabbar" role="tablist">
              <button
                className={`tab-btn ${aiTab === "summary" ? "active" : ""}`}
                onClick={() => setAiTab("summary")}
              >
                Summary
              </button>
              <button
                className={`tab-btn ${aiTab === "ask" ? "active" : ""}`}
                onClick={() => setAiTab("ask")}
              >
                Ask AI
              </button>
              <button
                className={`tab-btn ${aiTab === "quiz" ? "active" : ""}`}
                onClick={() => setAiTab("quiz")}
              >
                Quiz
              </button>
              <button
                className={`tab-btn ${aiTab === "flash" ? "active" : ""}`}
                onClick={() => setAiTab("flash")}
              >
                3D Flashcards
              </button>
            </div>

            {/* TAB 1: Summary */}
            {aiTab === "summary" && (
              <div className="tab-panel active">
                <div className="concept-list">
                  <div className="concept-item">
                    <div className="ic"><svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg></div>
                    <p><span className="k">Component Lifecycle</span> Re-renders trigger on state updates. Prevent wasteful renders using memoization.</p>
                  </div>
                  <div className="concept-item">
                    <div className="ic"><svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg></div>
                    <p><span className="k">useEffect Contract</span> Effects run asynchronously after paint, keeping your UI responsive.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Ask AI with typing animation */}
            {aiTab === "ask" && (
              <div className="tab-panel active">
                <div className="chatwrap">
                  <div className="chat-bubble chat-user">
                    Why does my effect run twice in development?
                  </div>
                  <div className="chat-bubble chat-ai">
                    {typedAnswer ? (
                      <p style={{ margin: 0 }}>
                        In React 18+, <strong>StrictMode</strong> mounts components twice in dev to detect cleanup bugs. In production, it only runs once!
                      </p>
                    ) : (
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Graded Quiz with immediate feedback */}
            {aiTab === "quiz" && (
              <div className="tab-panel active">
                <div className="quiz-q">Which hook should you use to store a mutable value that does NOT trigger a re-render?</div>
                <div className="quiz-opts">
                  <div
                    className={`quiz-opt ${quizSelected === "correct" ? "correct" : ""}`}
                    onClick={() => setQuizSelected("correct")}
                  >
                    useRef()
                  </div>
                  <div
                    className={`quiz-opt ${quizSelected === "wrong" ? "wrong" : ""}`}
                    onClick={() => setQuizSelected("wrong")}
                  >
                    useState()
                  </div>
                </div>
                {quizSelected === "correct" && (
                  <div className="quiz-explain" style={{ color: "var(--sage-deep)", fontWeight: 700 }}>
                    ✓ Correct! useRef holds a mutable reference in .current without re-triggering component rendering.
                  </div>
                )}
                {quizSelected === "wrong" && (
                  <div className="quiz-explain" style={{ color: "var(--peach-deep)", fontWeight: 700 }}>
                    ✗ Not quite. useState causes the component to re-render whenever state updates. Try useRef!
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: 3D Flippable Flashcard */}
            {aiTab === "flash" && (
              <div className="tab-panel active">
                <div className="flash-wrap">
                  <div
                    className={`flashcard ${isFlashFlipped ? "flipped" : ""}`}
                    onClick={() => setIsFlashFlipped((prev) => !prev)}
                  >
                    <div className="flash-inner">
                      <div className="flash-face flash-front">
                        <div>
                          <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                            Card {flashIndex + 1} of {flashcardsData.length} (Click to Flip)
                          </span>
                          {flashcardsData[flashIndex].q}
                        </div>
                      </div>
                      <div className="flash-face flash-back">
                        <div>
                          <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                            Explanation
                          </span>
                          {flashcardsData[flashIndex].a}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => setIsFlashFlipped((prev) => !prev)}
                      className="btn btn-ghost btn-sm text-xs font-bold"
                    >
                      Flip Card ↺
                    </button>
                    <button
                      onClick={() => {
                        setIsFlashFlipped(false);
                        setFlashIndex((prev) => (prev + 1) % flashcardsData.length);
                      }}
                      className="btn btn-violet btn-sm text-xs font-bold"
                    >
                      Next Card →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ai-sub-row">
            <div className="card reveal" style={{ padding: "22px" }}>
              <h4 style={{ fontSize: "1rem" }}>Assignment Solver</h4>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: "6px" }}>
                Upload problem text, PDFs, or photos for clear, step-by-step solutions.
              </p>
              <div className="mini-flow">
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-note" /></svg>Text</span>
                <span className="mf-arrow"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-chev-r" /></svg></span>
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-file" /></svg>PDF</span>
                <span className="mf-arrow"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-chev-r" /></svg></span>
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-image" /></svg>Photo</span>
                <span className="mf-arrow"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-chev-r" /></svg></span>
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-steps" /></svg>Solution</span>
              </div>
              <span className="ai-sig">
                <svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg>AI Insight
              </span>
            </div>

            <div className="card reveal" style={{ padding: "22px" }}>
              <h4 style={{ fontSize: "1rem" }}>Weak Topic Detection</h4>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: "6px" }}>
                Automatically spots tricky concepts and schedules quick reviews.
              </p>
              <div className="mini-flow">
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-target" /></svg>Weak Topic</span>
                <span className="mf-arrow"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-chev-r" /></svg></span>
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-note" /></svg>Spaced Review</span>
                <span className="mf-arrow"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-chev-r" /></svg></span>
                <span className="mf-step"><svg viewBox="0 0 24 24"><use href="#i-calendar" /></svg>Scheduled</span>
              </div>
              <span className="ai-sig">
                <svg viewBox="0 0 24 24"><use href="#i-sparkle" /></svg>AI Insight
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DEV ARENA: 3D CODE RUNNER ============ */}
      <section className="section" id="dev">
        <div className="container">
          <div className="section-head reveal">
            <h2>Developer Arena</h2>
            <p>Practice algorithms and track daily coding streaks right beside your video lectures.</p>
          </div>

          <div className="platform-row reveal">
            <div className="plat-chip"><span className="plat-dot" style={{ background: "#FFA116" }}>LC</span>LeetCode<span className="plat-connected"></span></div>
            <div className="plat-chip"><span className="plat-dot" style={{ background: "#1F8ACB" }}>CF</span>Codeforces<span className="plat-connected"></span></div>
            <div className="plat-chip"><span className="plat-dot" style={{ background: "#5B4638" }}>CC</span>CodeChef<span className="plat-connected"></span></div>
            <div className="plat-chip"><span className="plat-dot" style={{ background: "#2EC866" }}>HR</span>HackerRank</div>
            <div className="plat-chip"><span className="plat-dot" style={{ background: "#2F8D46" }}>GFG</span>GeeksforGeeks</div>
          </div>

          <div className="dev-grid">
            <div className="card daily-card reveal tilt">
              <span className="chip chip-sage difficulty">Medium · Daily Challenge</span>
              <h3>Longest Substring Without Repeating Characters</h3>
              <div className="topic">Topic: Sliding Window &amp; Hash Set · Connected to Lecture 4</div>

              <div className="streak-row">
                <div className="flame"><svg viewBox="0 0 24 24"><use href="#i-flame" /></svg></div>
                <div>
                  <div className="num">7</div>
                  <div className="lab">day streak across platforms</div>
                </div>
              </div>

              <div className="prog-bars">
                <div className="prog-row">
                  <span className="lbl">Easy</span>
                  <div className="prog-track"><i style={{ width: "82%", background: "var(--sage)" }}></i></div>
                  <span>142/173</span>
                </div>
                <div className="prog-row">
                  <span className="lbl">Medium</span>
                  <div className="prog-track"><i style={{ width: "48%", background: "var(--sky)" }}></i></div>
                  <span>96/200</span>
                </div>
                <div className="prog-row">
                  <span className="lbl">Hard</span>
                  <div className="prog-track"><i style={{ width: "18%", background: "var(--lav)" }}></i></div>
                  <span>12/65</span>
                </div>
              </div>
            </div>

            {/* 3D Tilted Code Window with Language Tabs & Working Run Button */}
            <div className="code-window reveal tilt">
              <div className="code-topbar">
                <div className="code-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="flex items-center gap-2">
                  {["javascript", "python", "cpp"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold transition ${
                        codeLang === lang
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleExecuteCode}
                  disabled={codeRunning}
                  className="btn btn-emerald btn-sm text-[11px] py-1 px-3"
                >
                  {codeRunning ? "Running..." : "▶ Run Code"}
                </button>
              </div>

              <div className="code-body">
                {codeSnippets[codeLang].map((line, idx) => (
                  <div className="code-line" key={idx}>
                    <span className="ln">{idx + 1}</span>
                    <span className="code">{line}</span>
                  </div>
                ))}
              </div>

              {codeOutput && (
                <div className="p-2.5 bg-black/90 border-t border-white/10 font-mono text-xs text-emerald-400">
                  {codeOutput}
                </div>
              )}

              <div className="code-foot">
                <span className="code-tag tag-accept">Sliding Window</span>
                <span className="code-tag tag-time">Time O(N)</span>
                <span className="code-tag tag-space">Space O(min(N,M))</span>
                <span className="code-tag" style={{ background: "rgba(255,255,255,0.08)", color: "#cfc9e6" }}>
                  Fastest Run: 11ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTEST RADAR: REAL-TIME TICKING TIMERS ============ */}
      <section className="section section-alt" id="contests">
        <div className="container">
          <div className="section-head reveal">
            <h2>Live Contest Radar</h2>
            <p>Live countdowns for upcoming rounds across Codeforces, LeetCode, and CodeChef.</p>
          </div>

          <div className="contest-scroll reveal">
            <div className="card contest-card tilt">
              <span className="plat">CODEFORCES</span>
              <h4>Div. 2 Round 981</h4>
              <span className="date">Starts in</span>
              <div className="countdown">
                <div className="cd-unit"><b>{countdowns[1].d}</b><span>Days</span></div>
                <div className="cd-unit"><b>{countdowns[1].h}</b><span>Hrs</span></div>
                <div className="cd-unit"><b>{countdowns[1].m}</b><span>Min</span></div>
                <div className="cd-unit"><b>{countdowns[1].s}</b><span>Sec</span></div>
              </div>
              <div className="contest-actions">
                <button
                  className={`remind-btn ${reminders[1] ? "active" : ""}`}
                  aria-label="Remind me"
                  onClick={() => setReminders((prev) => ({ ...prev, 1: !prev[1] }))}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-bell" /></svg>
                </button>
                <Link to="/coding-dashboard" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Join</Link>
              </div>
            </div>

            <div className="card contest-card tilt">
              <span className="plat">LEETCODE</span>
              <h4>Weekly Contest 412</h4>
              <span className="date">Starts in</span>
              <div className="countdown">
                <div className="cd-unit"><b>{countdowns[2].d}</b><span>Days</span></div>
                <div className="cd-unit"><b>{countdowns[2].h}</b><span>Hrs</span></div>
                <div className="cd-unit"><b>{countdowns[2].m}</b><span>Min</span></div>
                <div className="cd-unit"><b>{countdowns[2].s}</b><span>Sec</span></div>
              </div>
              <div className="contest-actions">
                <button
                  className={`remind-btn ${reminders[2] ? "active" : ""}`}
                  aria-label="Remind me"
                  onClick={() => setReminders((prev) => ({ ...prev, 2: !prev[2] }))}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-bell" /></svg>
                </button>
                <Link to="/coding-dashboard" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Join</Link>
              </div>
            </div>

            <div className="card contest-card tilt">
              <span className="plat">CODECHEF</span>
              <h4>Starters 148</h4>
              <span className="date">Starts in</span>
              <div className="countdown">
                <div className="cd-unit"><b>{countdowns[3].d}</b><span>Days</span></div>
                <div className="cd-unit"><b>{countdowns[3].h}</b><span>Hrs</span></div>
                <div className="cd-unit"><b>{countdowns[3].m}</b><span>Min</span></div>
                <div className="cd-unit"><b>{countdowns[3].s}</b><span>Sec</span></div>
              </div>
              <div className="contest-actions">
                <button
                  className={`remind-btn ${reminders[3] ? "active" : ""}`}
                  aria-label="Remind me"
                  onClick={() => setReminders((prev) => ({ ...prev, 3: !prev[3] }))}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-bell" /></svg>
                </button>
                <Link to="/coding-dashboard" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Join</Link>
              </div>
            </div>

            <div className="card contest-card tilt">
              <span className="plat">HACKERRANK</span>
              <h4>Algorithms Sprint</h4>
              <span className="date">Starts in</span>
              <div className="countdown">
                <div className="cd-unit"><b>{countdowns[4].d}</b><span>Days</span></div>
                <div className="cd-unit"><b>{countdowns[4].h}</b><span>Hrs</span></div>
                <div className="cd-unit"><b>{countdowns[4].m}</b><span>Min</span></div>
                <div className="cd-unit"><b>{countdowns[4].s}</b><span>Sec</span></div>
              </div>
              <div className="contest-actions">
                <button
                  className={`remind-btn ${reminders[4] ? "active" : ""}`}
                  aria-label="Remind me"
                  onClick={() => setReminders((prev) => ({ ...prev, 4: !prev[4] }))}
                >
                  <svg viewBox="0 0 24 24"><use href="#i-bell" /></svg>
                </button>
                <Link to="/coding-dashboard" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Join</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ANALYTICS & 3D MEDAL GAMIFICATION ============ */}
      <section className="section" id="analytics">
        <div className="container">
          <div className="section-head reveal">
            <h2>Track Your Real Progress</h2>
            <p>Visual activity heatmaps, study streaks, and verifiable achievement badges.</p>
          </div>

          <div className="analytics-grid">
            <div className="card heat-card reveal tilt">
              <div className="heat-head">
                <h4>Learning Activity Heatmap</h4>
                <span className="chip chip-outline">Last 26 weeks</span>
              </div>
              <div className="heatmap">
                {Array.from({ length: 182 }).map((_, i) => {
                  const seed = ((i * 9301 + 49297) % 233280) / 233280;
                  const level = seed > 0.82 ? 4 : seed > 0.62 ? 3 : seed > 0.4 ? 2 : seed > 0.22 ? 1 : 0;
                  const colors = [
                    "var(--line)",
                    "rgba(34, 197, 94, 0.32)",
                    "rgba(34, 197, 94, 0.58)",
                    "rgba(22, 163, 74, 0.82)",
                    "#16a34a",
                  ];
                  return (
                    <div
                      key={i}
                      className="heat-cell transition hover:scale-125 cursor-pointer"
                      title={`Week ${Math.floor(i / 7) + 1} · Active session`}
                      style={{ background: colors[level] }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--ink-soft)] font-medium mt-3">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2.5px] inline-block" style={{ background: "var(--line)" }}></span>
                <span className="w-2.5 h-2.5 rounded-[2.5px] inline-block" style={{ background: "rgba(34, 197, 94, 0.32)" }}></span>
                <span className="w-2.5 h-2.5 rounded-[2.5px] inline-block" style={{ background: "rgba(34, 197, 94, 0.58)" }}></span>
                <span className="w-2.5 h-2.5 rounded-[2.5px] inline-block" style={{ background: "rgba(22, 163, 74, 0.82)" }}></span>
                <span className="w-2.5 h-2.5 rounded-[2.5px] inline-block" style={{ background: "#16a34a" }}></span>
                <span>More</span>
              </div>
              <div className="streak-big">
                <div className="flame-big"><svg viewBox="0 0 24 24"><use href="#i-flame" /></svg></div>
                <div>
                  <div className="num">21</div>
                  <div className="lab">day continuous study streak (personal best)</div>
                </div>
              </div>
            </div>

            <div>
              <div className="stat-grid reveal">
                <div className="card stat-tile tilt">
                  <div className="v">86</div>
                  <div className="l">Hours Watched</div>
                </div>
                <div className="card stat-tile tilt">
                  <div className="v">34</div>
                  <div className="l">Modules Done</div>
                </div>
                <div className="card stat-tile tilt">
                  <div className="v">94%</div>
                  <div className="l">Retention Rate</div>
                </div>
                <div className="card stat-tile tilt">
                  <div className="v">6</div>
                  <div className="l">Active Tracks</div>
                </div>
              </div>

              {/* 3D Coin-Flip Medals */}
              <div className="badge-grid reveal">
                <div className="badge-tile">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face" style={{ background: "var(--brand)" }}>
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-play" /></svg>
                      </div>
                      <div className="b-ic-face b-ic-back">
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-check" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>First Step</p>
                </div>
                <div className="badge-tile">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face" style={{ background: "var(--peach)" }}>
                        <svg viewBox="0 0 24 24" style={{ color: "var(--peach-ink)" }}><use href="#i-flame" /></svg>
                      </div>
                      <div className="b-ic-face b-ic-back">
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-star" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>7-Day Streak</p>
                </div>
                <div className="badge-tile">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face" style={{ background: "var(--sky)" }}>
                        <svg viewBox="0 0 24 24" style={{ color: "var(--sky-ink)" }}><use href="#i-quiz" /></svg>
                      </div>
                      <div className="b-ic-face b-ic-back">
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-star" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>Quiz Ace</p>
                </div>
                <div className="badge-tile">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face" style={{ background: "var(--lav)" }}>
                        <svg viewBox="0 0 24 24" style={{ color: "var(--lav-ink)" }}><use href="#i-trophy" /></svg>
                      </div>
                      <div className="b-ic-face b-ic-back">
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-check" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>Course Hero</p>
                </div>
                <div className="badge-tile">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face" style={{ background: "var(--sage)" }}>
                        <svg viewBox="0 0 24 24" style={{ color: "var(--sage-ink)" }}><use href="#i-star" /></svg>
                      </div>
                      <div className="b-ic-face b-ic-back">
                        <svg viewBox="0 0 24 24" style={{ color: "#fff" }}><use href="#i-check" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>Night Owl</p>
                </div>
                <div className="badge-tile locked">
                  <div className="b-ic">
                    <div className="b-ic-inner">
                      <div className="b-ic-face">
                        <svg viewBox="0 0 24 24"><use href="#i-medal" /></svg>
                      </div>
                    </div>
                  </div>
                  <p>Master 100</p>
                </div>
              </div>

              <div className="cert-card reveal tilt">
                <div className="cert-seal">
                  <svg viewBox="0 0 24 24"><use href="#i-medal" /></svg>
                </div>
                <div>
                  <h4>Verified Certificates</h4>
                  <p>Earn verified credentials upon finishing complete learning tracks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WEEKLY PLANNER: 3D DRAG AND DROP ============ */}
      <section className="section section-alt" id="planner">
        <div className="container">
          <div className="section-head reveal">
            <h2>Weekly Study Planner</h2>
            <p>Drag and drop tasks between days to keep your study schedule balanced.</p>
          </div>

          <div className="planner-grid reveal">
            {["mon", "tue", "wed", "thu", "fri"].map((day) => {
              const labels = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
              const tasks = plannerTasks[day] || [];
              return (
                <div
                  key={day}
                  className="day-col tilt"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="day-head">
                    {labels[day]}
                    <span>{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
                  </div>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-chip"
                      draggable
                      data-c={task.c}
                      onDragStart={(e) => handleDragStart(e, task, day)}
                      title="Drag to another day"
                    >
                      {task.text}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-task"
                    onClick={() => handleAddTask(day)}
                  >
                    + Add task
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL & PEER LEARNING ============ */}
      <section className="section" id="social">
        <div className="container">
          <div className="section-head reveal">
            <h2>Study Circles &amp; Community</h2>
            <p>Connect and learn with peers studying the same topics in real time.</p>
          </div>

          <div className="social-grid">
            <div className="reveal">
              <div className="buddy-card tilt">
                <div className="avatar" style={{ background: "var(--sage-deep)" }}>
                  RK<span className="presence online"></span>
                </div>
                <div className="buddy-info">
                  <div className="n">Riya K.</div>
                  <div className="s">Online · 210 problems solved</div>
                </div>
                <button
                  className={`connect-btn ${connectedBuddies[1] ? "sent" : ""}`}
                  onClick={() => setConnectedBuddies((prev) => ({ ...prev, 1: !prev[1] }))}
                >
                  {connectedBuddies[1] ? "Sent ✓" : "Connect"}
                </button>
              </div>

              <div className="buddy-card tilt">
                <div className="avatar" style={{ background: "var(--peach-deep)" }}>
                  MS<span className="presence studying"></span>
                </div>
                <div className="buddy-info">
                  <div className="n">Manav S.</div>
                  <div className="s">Studying · React Performance</div>
                </div>
                <button
                  className={`connect-btn ${connectedBuddies[2] ? "sent" : ""}`}
                  onClick={() => setConnectedBuddies((prev) => ({ ...prev, 2: !prev[2] }))}
                >
                  {connectedBuddies[2] ? "Sent ✓" : "Connect"}
                </button>
              </div>

              <div className="buddy-card tilt">
                <div className="avatar" style={{ background: "var(--lav-deep)" }}>
                  PT<span className="presence offline"></span>
                </div>
                <div className="buddy-info">
                  <div className="n">Priya T.</div>
                  <div className="s">Offline · 18-day streak</div>
                </div>
                <button
                  className={`connect-btn ${connectedBuddies[3] ? "sent" : ""}`}
                  onClick={() => setConnectedBuddies((prev) => ({ ...prev, 3: !prev[3] }))}
                >
                  {connectedBuddies[3] ? "Sent ✓" : "Connect"}
                </button>
              </div>

              {/* Interactive Mini-Chat */}
              <div className="mini-chat">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="row"
                    style={msg.isMe ? { flexDirection: "row-reverse" } : {}}
                  >
                    <div
                      className="avatar"
                      style={{
                        background: msg.isMe ? "var(--sage-deep)" : "var(--sky-deep)",
                        width: "26px",
                        height: "26px",
                        fontSize: "0.6rem",
                      }}
                    >
                      {msg.sender}
                    </div>
                    <div className="bub">{msg.text}</div>
                  </div>
                ))}
                <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a study message..."
                    className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs outline-none text-[var(--ink)]"
                  />
                  <button type="submit" className="btn btn-emerald btn-sm py-1 px-3 text-xs">
                    Send
                  </button>
                </form>
              </div>
            </div>

            <div className="card reveal" style={{ padding: "20px" }}>
              <div className="notes-head">
                <h4>Weekly Study Leaderboard</h4>
                <span className="chip chip-outline">Consistency</span>
              </div>
              <div>
                <div className="board-row">
                  <div className="board-rank">1</div>
                  <div className="avatar" style={{ background: "var(--peach-deep)", width: "32px", height: "32px", fontSize: "0.75rem" }}>AK</div>
                  <div className="board-info">
                    <div className="n">Arjun K.</div>
                    <div className="s">28 hrs · 42 problems</div>
                  </div>
                  <div className="board-badge" style={{ background: "var(--peach)" }}>
                    <svg viewBox="0 0 24 24"><use href="#i-trophy" /></svg>
                  </div>
                </div>
                <div className="board-row">
                  <div className="board-rank">2</div>
                  <div className="avatar" style={{ background: "var(--sky-deep)", width: "32px", height: "32px", fontSize: "0.75rem" }}>SL</div>
                  <div className="board-info">
                    <div className="n">Sneha L.</div>
                    <div className="s">24 hrs · 38 problems</div>
                  </div>
                  <div className="board-badge" style={{ background: "var(--sky)" }}>
                    <svg viewBox="0 0 24 24"><use href="#i-star" /></svg>
                  </div>
                </div>
                <div className="board-row">
                  <div className="board-rank">3</div>
                  <div className="avatar" style={{ background: "var(--sage-deep)", width: "32px", height: "32px", fontSize: "0.75rem" }}>RK</div>
                  <div className="board-info">
                    <div className="n">Riya K.</div>
                    <div className="s">21 hrs · 31 problems</div>
                  </div>
                  <div className="board-badge" style={{ background: "var(--sage)" }}>
                    <svg viewBox="0 0 24 24"><use href="#i-star" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS: 3D ANIMATED SCROLL PATH ============ */}
      <section className="section section-alt" id="how">
        <div className="container">
          <div className="section-head reveal">
            <h2>How It Works in 6 Steps</h2>
            <p>From passive video watching to proven, verified mastery.</p>
          </div>

          <div className="how-wrap">
            <div className="how-path">
              <div
                className="how-path-fill"
                style={{ height: `${pathFillPercent}%` }}
              ></div>
            </div>
            <div className="how-step in" data-n="1">
              <div className="how-num">01</div>
              <div className="how-text"><h4>Import</h4><p>Paste any YouTube video or playlist link to index chapters and transcripts.</p></div>
            </div>
            <div className="how-step in" data-n="2">
              <div className="how-num">02</div>
              <div className="how-text"><h4>Watch &amp; Follow</h4><p>Learn with real-time synchronized interactive transcripts.</p></div>
            </div>
            <div className="how-step in" data-n="3">
              <div className="how-num">03</div>
              <div className="how-text"><h4>Interact with AI</h4><p>Take notes, bookmark key moments, and ask AI questions.</p></div>
            </div>
            <div className="how-step" data-n="4">
              <div className="how-num">04</div>
              <div className="how-text"><h4>Practice &amp; Code</h4><p>Test retention with quizzes, 3D flashcards, and live code execution.</p></div>
            </div>
            <div className="how-step" data-n="5">
              <div className="how-num">05</div>
              <div className="how-text"><h4>Track Retention</h4><p>Monitor your study heatmap and automatically surface weak topics.</p></div>
            </div>
            <div className="how-step" data-n="6">
              <div className="how-num">06</div>
              <div className="how-text"><h4>Master &amp; Certify</h4><p>Finish course tracks, keep your streak alive, and earn certificates.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECURITY ============ */}
      <section className="section" id="security">
        <div className="container">
          <div className="security-band reveal">
            <svg viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <path d="M0 220 C 100 190, 200 240, 300 210 S 500 170, 620 210 S 760 230, 800 200 L800 300 L0 300 Z" fill="rgba(59,130,246,0.25)" />
              <path d="M0 250 C 120 225, 220 265, 340 238 S 520 205, 640 240 S 770 255, 800 232 L800 300 L0 300 Z" fill="rgba(139,92,246,0.18)" />
            </svg>
            <h2 style={{ position: "relative" }}>Your Learning Data, Encrypted &amp; Protected</h2>
            <p>Bank-grade encryption, private study logs, and strict zero-spam guarantee.</p>
            <div className="sec-grid">
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-mail" /></svg></div><span>Email OTP &amp; Password Auth</span></div>
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-check" /></svg></div><span>Google Verified Sign-In</span></div>
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-key" /></svg></div><span>JWT 256-Bit Session Tokens</span></div>
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-lock" /></svg></div><span>Private Database at Rest</span></div>
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-gauge" /></svg></div><span>Rate-Limited Protected API</span></div>
              <div className="sec-item"><div className="ic"><svg viewBox="0 0 24 24"><use href="#i-server" /></svg></div><span>Isolated Code Sandboxes</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="final-cta">
        <div className="container">
          <h2 className="reveal">Your next video is worth more than you think.</h2>
          <p className="reveal">Turn passive video watching into active, lifelong mastery today.</p>
          <div className="hero-cta-row reveal">
            {isAuthenticated ? (
              <>
                <Link to="/workspace" className="btn btn-dark">
                  Open Workspace <svg viewBox="0 0 24 24"><use href="#i-chev-r" /></svg>
                </Link>
                <Link to="/dashboard" className="btn btn-ghost">Go to Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-dark">
                  Start Learning Free <svg viewBox="0 0 24 24"><use href="#i-chev-r" /></svg>
                </Link>
                <Link to="/login" className="btn btn-ghost">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div className="foot-brand" style={{ maxWidth: "280px" }}>
              <Link to="/" className="brand">
                <svg className="brand-mark" viewBox="0 0 34 34" fill="none">
                  <rect width="34" height="34" rx="10" fill="url(#footGrad)" />
                  <path d="M13 11l9 6-9 6V11z" fill="white" />
                  <defs>
                    <linearGradient id="footGrad" x1="0" y1="0" x2="34" y2="34">
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col leading-none">
                  <span className="brand-word font-bold tracking-tight">LearnSphere</span>
                  <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">Interactive Studio</span>
                </div>
              </Link>
              <p>The interactive learning workspace built around the videos you already watch.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h5>Product</h5>
                <a href="#workspace">Workspace</a>
                <a href="#ai">AI Assistant</a>
                <a href="#dev">Developer Arena</a>
                <a href="#analytics">Progress</a>
              </div>
              <div className="foot-col">
                <h5>Community</h5>
                <a href="#social">Study buddies</a>
                <a href="#contests">Contest radar</a>
                <a href="#planner">Weekly planner</a>
              </div>
              <div className="foot-col">
                <h5>Company</h5>
                <a href="#security">Security</a>
                <a href="#how">How it works</a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© 2026 LearnSphere. Built for learners who master concepts through video.</p>
            <div className="social-icons">
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24"><use href="#i-yt" /></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

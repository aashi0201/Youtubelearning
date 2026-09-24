import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Code2,
  Trophy,
  Target,
  Flame,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  Clock,
  Settings,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Copy,
  Check,
  Zap,
  BookOpen,
  Search,
  Filter,
  CheckSquare,
  Link2,
  Link2Off,
  Unlink,
  Globe,
  BarChart2,
  PieChart,
  Bell,
  CalendarPlus,
  TrendingUp,
  Award,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import Button from "../components/common/Button";
import ThemeToggle from "../components/common/ThemeToggle";
import {
  updateCodingProfiles,
  disconnectCodingProfile,
  getCodingDashboardStats,
  markProblemSolved,
  getSocialLeaderboard,
  getUpcomingContests,
  getTodayActivity,
  inspectCodingProfiles,
} from "../services/codingService";
import {
  runSandboxCode,
  DSA_TEMPLATES,
  COMPILER_LANGUAGES,
} from "../services/compilerService";
import useAuth from "../hooks/useAuth";

const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CodingDashboardPage() {
  const { user: authUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("stats"); // 'stats', 'sandbox', 'social', 'contests'
  const [loading, setLoading] = useState(true);

  // Sandbox State (Sandboxed DSA Online Compiler)
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DSA_TEMPLATES.cpp.twoSum);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [errorLog, setErrorLog] = useState("");
  const [exitCode, setExitCode] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [execTime, setExecTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Stats State
  const [profiles, setProfiles] = useState({
    leetcode: authUser?.leetcode || "",
    codeforces: authUser?.codeforces || "",
    codechef: authUser?.codechef || "",
    github: authUser?.github || "",
  });
  const [inputValues, setInputValues] = useState({
    leetcode: authUser?.leetcode || "",
    codeforces: authUser?.codeforces || "",
    codechef: authUser?.codechef || "",
    github: authUser?.github || "",
  });
  const [editingProfiles, setEditingProfiles] = useState({
    leetcode: false,
    codeforces: false,
    codechef: false,
    github: false,
  });
  const [stats, setStats] = useState({ leetcode: null, codeforces: null, codechef: null, github: null });
  const [aiFeedback, setAiFeedback] = useState(null);
  const [activityToday, setActivityToday] = useState({});
  const [activityDates, setActivityDates] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);

  // Independent Multi-User Tracking / Sandbox State (track any coder freely)
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectPlatform, setInspectPlatform] = useState("leetcode");
  const [inspectHandleInput, setInspectHandleInput] = useState("");
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectedProfile, setInspectedProfile] = useState(null);

  // Social, Contests & Customizations State
  const [activeUsers, setActiveUsers] = useState([]);
  const [contests, setContests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [contestPlatformFilter, setContestPlatformFilter] = useState("All");
  const [selectedPlatformTab, setSelectedPlatformTab] = useState("leetcode");

  // Customization: Live Clock & Daily Goal Target
  const [nowTime, setNowTime] = useState(Date.now());
  const [dailyTarget, setDailyTarget] = useState(() => {
    return parseInt(localStorage.getItem("coding_daily_target") || "2", 10);
  });

  // Ticking real-time countdown timer for contests
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateDailyTarget = (newVal) => {
    const valid = Math.max(1, Math.min(10, newVal));
    setDailyTarget(valid);
    localStorage.setItem("coding_daily_target", valid.toString());
  };

  // Google Calendar Link Generator
  const getGoogleCalendarLink = (contest) => {
    const startDate = new Date(contest.startTimeSeconds * 1000);
    const endDate = new Date((contest.startTimeSeconds + (contest.durationSeconds || 7200)) * 1000);
    
    const formatCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`[Contest] ${contest.name} (${contest.platform})`);
    const details = encodeURIComponent(`Upcoming ${contest.platform} contest!\nLink: ${contest.link || "https://leetcode.com/contest/"}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalDate(startDate)}/${formatCalDate(endDate)}&details=${details}`;
  };

  // Real-time Countdown Helper
  const getTimeRemaining = (startTimeSeconds) => {
    const totalMs = startTimeSeconds * 1000 - nowTime;
    if (totalMs <= 0) return { expired: true, text: "LIVE NOW! 🔥" };
    
    const seconds = Math.floor((totalMs / 1000) % 60);
    const minutes = Math.floor((totalMs / 1000 / 60) % 60);
    const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

    if (days > 0) return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
    return { expired: false, text: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s` };
  };

  useEffect(() => {
    const templates = DSA_TEMPLATES[language] || DSA_TEMPLATES.cpp;
    setCode(templates.twoSum || templates.blank || "");
  }, [language]);

  const fetchTodayActivity = async () => {
    try {
      const res = await getTodayActivity();
      if (res.ok) setActivityToday(res.activityToday || {});
    } catch (err) {
      console.error("Failed to fetch today activity", err);
    }
  };

  const [syncingStats, setSyncingStats] = useState(false);

  const fetchStats = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setSyncingStats(true);
      const res = await getCodingDashboardStats("me", forceRefresh);
      if (res.ok) {
        const fetched = res.profiles || { leetcode: "", codeforces: "", codechef: "" };
        setProfiles(fetched);
        setInputValues(fetched);
        setStats(res.stats || {});
        setAiFeedback(res.aiFeedback || null);
        setCurrentStreak(res.currentStreak || 0);
        setLongestStreak(res.longestStreak || 0);
        setActivityDates(res.activityDates || []);
      }
    } catch (err) {
      console.error("Failed to fetch coding stats", err);
    } finally {
      if (forceRefresh) setSyncingStats(false);
    }
  };

  const fetchSocialLeaderboard = async () => {
    try {
      const res = await getSocialLeaderboard();
      if (res.ok) {
        setActiveUsers(res.activeUsers || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  const fetchContestsList = async () => {
    try {
      const res = await getUpcomingContests();
      if (res.ok) {
        setContests(res.contests || []);
      }
    } catch (err) {
      console.error("Failed to fetch contests", err);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem("token");
    const socket = io(BACKEND_URL, {
      auth: { userId: currentUser._id, token },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("activityUpdated", (data) => {
      fetchSocialLeaderboard();
      if (data.userId === currentUser._id) {
        setActivityToday((prev) => ({ ...prev, [data.platform]: true }));
      }
    });

    return () => socket.disconnect();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(false),
      fetchTodayActivity(),
      fetchSocialLeaderboard(),
      fetchContestsList(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    setupSocket();
  }, []);

  const generateHeatmapGrid = (platform = "leetcode") => {
    const now = new Date();
    // Use UTC date as reference so dateStr matches backend platformCounts ISO strings exactly
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStr = todayUTC.toISOString().split("T")[0];
    const dayOfWeek = todayUTC.getUTCDay();
    const daysToSat = 6 - dayOfWeek;
    const endDate = new Date(todayUTC);
    endDate.setUTCDate(todayUTC.getUTCDate() + daysToSat);

    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - (52 * 7 - 1));

    let platformDates = [];
    let platformCounts = {};

    if (platform === "leetcode") {
      platformDates = displayStats.leetcode?.submissionDates || [];
      platformCounts = displayStats.leetcode?.submissionCounts || {};
    } else if (platform === "codeforces") {
      platformDates = displayStats.codeforces?.submissionDates || [];
      platformCounts = displayStats.codeforces?.submissionCounts || {};
    } else if (platform === "codechef") {
      platformDates = displayStats.codechef?.submissionDates || [];
      platformCounts = displayStats.codechef?.submissionCounts || {};
    }

    const activeDateSet = new Set(platformDates);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Build all days first
    const allDays = [];
    let cur = new Date(startDate);
    for (let i = 0; i < 52 * 7; i++) {
      const dateStr = cur.toISOString().split("T")[0];
      let count = 0;
      if (platformCounts[dateStr] !== undefined) {
        count = platformCounts[dateStr];
      } else if (activeDateSet.has(dateStr)) {
        count = 1;
      }

      const [y, m, d] = dateStr.split("-").map(Number);
      const cellDate = new Date(Date.UTC(y, m - 1, d));
      const formattedDate = cellDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

      allDays.push({
        dateStr,
        dow: cur.getUTCDay(), // 0=Sun, 6=Sat
        month: cur.getUTCMonth(),
        formattedDate,
        count,
        isToday: dateStr === todayStr,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Build columns — each column has 7 slots (Sun-Sat), only one month per column
    // When a week spans two months, split into two columns
    const columns = []; // { days: [7], monthLabel: "" | "Jan", isMonthStart: bool }
    let lastMonth = -1;
    let dayIdx = 0;

    while (dayIdx < allDays.length) {
      const col = Array(7).fill(null);
      const colMonth = allDays[dayIdx].month;
      const isNewMonth = colMonth !== lastMonth;

      // Fill slots for days in this week that belong to colMonth
      while (dayIdx < allDays.length) {
        const day = allDays[dayIdx];
        if (day.dow === 0 && col.some(c => c !== null)) break; // new week starts, finish column
        if (day.month !== colMonth) break; // month changed, split here
        col[day.dow] = day;
        dayIdx++;
      }

      columns.push({
        days: col,
        monthLabel: isNewMonth ? monthNames[colMonth] : "",
        isMonthStart: isNewMonth && columns.length > 0,
      });
      lastMonth = colMonth;
    }

    return { columns };
  };

  function sanitizeHandle(input) {
    if (!input) return "";
    let str = String(input).trim().replace(/\/+$/, "");
    const matches = str.match(/(?:leetcode\.com|codeforces\.com|codechef\.com|github\.com|takeuforward\.org)\/(?:u\/|profile\/|users\/)?([a-zA-Z0-9_-]+)/gi);
    if (matches && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const parts = lastMatch.split("/").filter(Boolean);
      const cleanHandle = parts.pop();
      if (cleanHandle && cleanHandle !== "u" && cleanHandle !== "profile" && cleanHandle !== "users") {
        return cleanHandle.replace(/[^a-zA-Z0-9_-]/g, "");
      }
    }
    if (str.includes("://") || str.includes("/")) {
      const segments = str.split("?")[0].split("#")[0].split("/").filter(Boolean);
      while (segments.length > 0) {
        const seg = segments.pop().replace(/[^a-zA-Z0-9_-]/g, "");
        if (seg && seg !== "u" && seg !== "profile" && seg !== "users" && seg !== "https" && seg !== "http" && !seg.includes("leetcode") && !seg.includes("codeforces") && !seg.includes("codechef") && !seg.includes("github") && !seg.includes("takeuforward") && !seg.includes("com") && !seg.includes("org")) {
          return seg;
        }
      }
    }
    return str.replace(/[^a-zA-Z0-9_-]/g, "");
  }

  const handleConnectSinglePlatform = async (platform, rawInput) => {
    try {
      setSyncingStats(true);
      let cleanHandle = rawInput;
      if (platform === "leetcode" || platform === "codeforces" || platform === "codechef" || platform === "github") {
        cleanHandle = sanitizeHandle(rawInput);
      } else {
        cleanHandle = (rawInput || "").trim();
      }

      const res = await updateCodingProfiles({ [platform]: cleanHandle });
      
      // Immediately reflect across all profile views
      if (res && res.user) {
        updateUser(res.user);
      } else {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored[platform] = cleanHandle;
        updateUser(stored);
      }

      setProfiles((prev) => ({ ...prev, [platform]: cleanHandle }));
      setInputValues((prev) => ({ ...prev, [platform]: cleanHandle }));
      setEditingProfiles((prev) => ({ ...prev, [platform]: false }));

      await fetchStats(true); // Force refresh live stats with cache bypass
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: { platform, handle: cleanHandle } }));

      setStatusMessage({
        type: "success",
        text: `Connected ${platform.toUpperCase()} profile (@${cleanHandle}) successfully! Reflected across your profile.`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(`Failed to connect ${platform}:`, err);
      setStatusMessage({
        type: "error",
        text: `Failed to connect ${platform}. Please check the handle or link.`,
      });
    } finally {
      setSyncingStats(false);
    }
  };

  const handleSaveProfiles = async () => {
    try {
      setSyncingStats(true);
      const cleanProfiles = {
        leetcode: sanitizeHandle(inputValues.leetcode),
        codeforces: sanitizeHandle(inputValues.codeforces),
        codechef: sanitizeHandle(inputValues.codechef),
        github: sanitizeHandle(inputValues.github),
      };
      setProfiles(cleanProfiles);
      setInputValues(cleanProfiles);
      setEditingProfiles({ leetcode: false, codeforces: false, codechef: false, github: false });
      
      const res = await updateCodingProfiles(cleanProfiles);
      if (res && res.user) {
        updateUser(res.user);
      } else {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        Object.assign(stored, cleanProfiles);
        updateUser(stored);
      }

      await fetchStats(true); // Force refresh live profile stats
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: cleanProfiles }));

      setStatusMessage({ type: "success", text: "All platform connections saved & reflected across your profile!" });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/login";
      } else {
        setStatusMessage({ type: "error", text: "Failed to save profiles. Please check connection." });
      }
    } finally {
      setSyncingStats(false);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      setSyncingStats(true);
      const res = await disconnectCodingProfile(platform);
      if (res && res.user) {
        updateUser(res.user);
      } else {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored[platform] = "";
        updateUser(stored);
      }

      setProfiles((prev) => ({ ...prev, [platform]: "" }));
      setInputValues((prev) => ({ ...prev, [platform]: "" }));
      setEditingProfiles((prev) => ({ ...prev, [platform]: false }));
      setStats((prev) => ({ ...prev, [platform]: null }));
      await fetchStats(true);

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: { platform, handle: "" } }));

      setStatusMessage({ type: "success", text: `Disconnected ${platform.toUpperCase()} profile successfully.` });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error("Disconnect error:", err);
      setStatusMessage({ type: "error", text: `Failed to disconnect ${platform}.` });
    } finally {
      setSyncingStats(false);
    }
  };

  // Independent Multi-User Inspection (track any coder freely without modifying user DB)
  const handleInspectAnyProfile = async (targetPlatform, targetHandle) => {
    const p = targetPlatform || inspectPlatform;
    const raw = targetHandle !== undefined ? targetHandle : inspectHandleInput;
    const clean = sanitizeHandle(raw);
    if (!clean) {
      setStatusMessage({ type: "error", text: "Please enter a valid username or profile link to inspect." });
      return;
    }

    setInspectLoading(true);
    try {
      const res = await inspectCodingProfiles({ [p]: clean }, true);
      if (res.ok) {
        setInspectMode(true);
        setInspectedProfile({
          handle: clean,
          platform: p,
          stats: res.stats || {},
          currentStreak: res.currentStreak || 0,
          longestStreak: res.longestStreak || 0,
          activityDates: res.activityDates || [],
        });
        setSelectedPlatformTab(p);
        setStatusMessage({
          type: "success",
          text: `Now viewing public stats for @${clean} on ${p.toUpperCase()} (Independent Tracker View)`,
        });
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to inspect profile." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.response?.data?.error || `Could not fetch stats for @${clean}.` });
    } finally {
      setInspectLoading(false);
    }
  };

  const handleExitInspectMode = () => {
    setInspectMode(false);
    setInspectedProfile(null);
    setInspectHandleInput("");
    setStatusMessage({ type: "success", text: "Switched back to your personal saved profiles." });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const displayStats = inspectMode && inspectedProfile ? inspectedProfile.stats : stats;
  const displayProfiles = inspectMode && inspectedProfile ? { ...profiles, [inspectedProfile.platform]: inspectedProfile.handle } : profiles;
  const displayStreak = inspectMode && inspectedProfile ? inspectedProfile.currentStreak : currentStreak;
  const displayLongestStreak = inspectMode && inspectedProfile ? inspectedProfile.longestStreak : longestStreak;

  const handleMarkSolved = async (platform) => {
    try {
      await markProblemSolved(platform);
      await fetchTodayActivity();
      await fetchStats();
      await fetchSocialLeaderboard();
      setStatusMessage({ type: "success", text: `Marked problem as solved for ${platform.toUpperCase()}!` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Failed to mark solved", err);
    }
  };

  // Cooldown countdown for compiler rate-limiting
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const runCode = async () => {
    if (executing || cooldown > 0) return;
    setExecuting(true);
    setOutput("Compiling and executing in isolated sandbox...");
    setErrorLog("");
    setExitCode(null);
    setExecTime(null);

    try {
      const result = await runSandboxCode({
        language,
        code,
        stdin,
      });

      setOutput(result.stdout || "");
      setErrorLog(result.stderr || "");
      setExitCode(result.exitCode);
      setExecTime(result.executionTimeMs);
    } catch (err) {
      setErrorLog(err.message || "Failed to execute code.");
      setExitCode(1);
    } finally {
      setExecuting(false);
      setCooldown(3);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleEditorKeyDown = (e) => {
    // 1. Run Code Shortcut: Ctrl+Enter / Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
      return;
    }

    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const PAIRS = {
      "{": "}",
      "(": ")",
      "[": "]",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    const CLOSING_CHARS = ["}", ")", "]", '"', "'", "`"];

    // 2. Skip-over if typing closing character right before existing closing character
    if (CLOSING_CHARS.includes(e.key) && start === end && val[start] === e.key) {
      e.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      return;
    }

    // 3. Auto-pair brackets, braces, and quotes
    if (PAIRS[e.key]) {
      e.preventDefault();
      const openChar = e.key;
      const closeChar = PAIRS[e.key];

      if (start !== end) {
        // Wrap selected text: e.g. foo -> (foo) or {foo}
        const selected = val.substring(start, end);
        const nextVal = val.substring(0, start) + openChar + selected + closeChar + val.substring(end);
        setCode(nextVal);
        setTimeout(() => {
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        }, 0);
      } else {
        // Insert pair and place cursor between them
        const nextVal = val.substring(0, start) + openChar + closeChar + val.substring(end);
        setCode(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
      return;
    }

    // 4. Backspace deletion of empty pair (e.g. deleting inside {} deletes both { and })
    if (e.key === "Backspace" && start === end && start > 0) {
      const prevChar = val[start - 1];
      const nextChar = val[start];
      if (PAIRS[prevChar] === nextChar) {
        e.preventDefault();
        const nextVal = val.substring(0, start - 1) + val.substring(start + 1);
        setCode(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }

    // 5. Enter key auto-indentation and brace expansion
    if (e.key === "Enter") {
      const lineStart = val.lastIndexOf("\n", start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const matchIndent = currentLine.match(/^\s*/);
      const currentIndent = matchIndent ? matchIndent[0] : "";

      const charBefore = val[start - 1];
      const charAfter = val[start];

      // Case A: Enter between matching braces/brackets e.g. {|} or (|) or [|]
      if (
        (charBefore === "{" && charAfter === "}") ||
        (charBefore === "(" && charAfter === ")") ||
        (charBefore === "[" && charAfter === "]")
      ) {
        e.preventDefault();
        const extraIndent = "  "; // 2 spaces
        const middleIndent = currentIndent + extraIndent;
        const insertion = "\n" + middleIndent + "\n" + currentIndent;
        const nextVal = val.substring(0, start) + insertion + val.substring(end);
        setCode(nextVal);
        setTimeout(() => {
          const newPos = start + 1 + middleIndent.length;
          textarea.selectionStart = textarea.selectionEnd = newPos;
        }, 0);
        return;
      }

      // Case B: Line ends with '{', ':', '(', or '[' -> add extra 2-space indentation on next line
      const trimmedLine = currentLine.trimEnd();
      const shouldIncreaseIndent =
        trimmedLine.endsWith("{") ||
        trimmedLine.endsWith(":") ||
        trimmedLine.endsWith("(") ||
        trimmedLine.endsWith("[");

      e.preventDefault();
      const nextIndent = currentIndent + (shouldIncreaseIndent ? "  " : "");
      const insertion = "\n" + nextIndent;
      const nextVal = val.substring(0, start) + insertion + val.substring(end);
      setCode(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      }, 0);
      return;
    }

    // 6. Tab & Shift+Tab handling
    if (e.key === "Tab") {
      e.preventDefault();
      if (!e.shiftKey) {
        if (start === end) {
          // Simple insert 2 spaces
          const nextVal = val.substring(0, start) + "  " + val.substring(end);
          setCode(nextVal);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        } else {
          // Multi-line indent
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const lineEnd = val.indexOf("\n", end);
          const actualEnd = lineEnd === -1 ? val.length : lineEnd;
          const lines = val.substring(lineStart, actualEnd).split("\n");
          const indentedLines = lines.map((l) => "  " + l).join("\n");
          const nextVal = val.substring(0, lineStart) + indentedLines + val.substring(actualEnd);
          setCode(nextVal);
          setTimeout(() => {
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = end + (lines.length * 2);
          }, 0);
        }
      } else {
        // Shift+Tab: Dedent
        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = val.indexOf("\n", end);
        const actualEnd = lineEnd === -1 ? val.length : lineEnd;
        const lines = val.substring(lineStart, actualEnd).split("\n");
        let removedCount = 0;
        const dedentedLines = lines.map((l) => {
          if (l.startsWith("  ")) {
            removedCount += 2;
            return l.substring(2);
          } else if (l.startsWith(" ")) {
            removedCount += 1;
            return l.substring(1);
          }
          return l;
        }).join("\n");
        const nextVal = val.substring(0, lineStart) + dedentedLines + val.substring(actualEnd);
        setCode(nextVal);
        setTimeout(() => {
          textarea.selectionStart = Math.max(lineStart, start - 2);
          textarea.selectionEnd = Math.max(lineStart, end - removedCount);
        }, 0);
      }
      return;
    }
  };

  // Filtered Leaderboard
  const filteredUsers = activeUsers.filter((u) => {
    const name = u.user?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filtered Contests
  const filteredContests = contests.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (contestPlatformFilter === "All") return matchesSearch;
    return matchesSearch && c.platform.toLowerCase() === contestPlatformFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen text-[var(--text)] pb-20">
      <div className="section-container py-6 md:py-8 space-y-8">
        {/* Header Banner */}
        <div className="glass premium-border rounded-[2.5rem] p-6 md:p-8 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-purple-500/10 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 size={14} /> Developer Playground
                </span>
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={14} /> {currentStreak} Day Streak
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Coding Hub & Interactive Sandbox
              </h1>
              <p className="text-sm md:text-base text-muted mt-2 max-w-2xl leading-relaxed">
                Execute code in real-time, track competitive programming handles across LeetCode, Codeforces, and CodeChef, and compete on the daily leaderboard.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Global Status Banner */}
        {statusMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-muted hover:text-white">✕</button>
          </motion.div>
        ) : null}

        {/* Custom Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 w-fit">
          {[
            { id: "sandbox", label: "DSA Online Compiler", icon: Terminal },
            { id: "stats", label: "Platform Tracker", icon: Trophy },
            { id: "social", label: "Daily Leaderboard", icon: Users },
            { id: "contests", label: "Upcoming Contests", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : "text-muted hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Sections */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-xs text-muted font-semibold uppercase tracking-widest">Loading Coding Hub...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "sandbox" && (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Code Editor Column (7 cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  <div className="glass premium-border rounded-[2rem] p-5 flex flex-col min-h-[560px]">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/10 dark:border-white/10 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Language Selector */}
                        <select
                          value={language}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setLanguage(newLang);
                            setCode(DSA_TEMPLATES[newLang]?.twoSum || DSA_TEMPLATES[newLang]?.blank || "");
                          }}
                          className="bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="cpp" className="bg-slate-900 text-white">C++20 (GCC 13.2)</option>
                          <option value="python" className="bg-slate-900 text-white">Python 3.12</option>
                          <option value="java" className="bg-slate-900 text-white">Java 22 (OpenJDK)</option>
                          <option value="javascript" className="bg-slate-900 text-white">JavaScript (Node 20)</option>
                        </select>

                        {/* Template Selector */}
                        <select
                          onChange={(e) => {
                            const tKey = e.target.value;
                            setCode(DSA_TEMPLATES[language]?.[tKey] || "");
                          }}
                          defaultValue="twoSum"
                          className="bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="twoSum" className="bg-slate-900 text-white">Two Sum (Hash Map)</option>
                          <option value="binarySearch" className="bg-slate-900 text-white">Binary Search</option>
                          <option value="fastIO" className="bg-slate-900 text-white">Custom Stdin Reader</option>
                          <option value="blank" className="bg-slate-900 text-white">Empty Scratchpad</option>
                        </select>

                        <button
                          onClick={() => setCode(DSA_TEMPLATES[language]?.twoSum || DSA_TEMPLATES[language]?.blank || "")}
                          className="p-1.5 rounded-lg text-muted hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                          title="Reset Code Template"
                        >
                          <RotateCcw size={15} />
                        </button>

                        <button
                          onClick={handleCopyCode}
                          className="p-1.5 rounded-lg text-muted hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1 text-xs"
                          title="Copy Code"
                        >
                          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={runCode}
                          disabled={executing || cooldown > 0}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-4 py-2 text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {executing ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : cooldown > 0 ? (
                            <>
                              <Clock size={14} className="animate-pulse" />
                              <span>Wait {cooldown}s</span>
                            </>
                          ) : (
                            <>
                              <Play size={14} className="fill-white" />
                              <span>Run Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Code Textarea with Line Numbers */}
                    <div className="flex-1 relative font-mono text-xs rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex min-h-[400px]">
                      {/* Line Numbers Gutter */}
                      <div
                        ref={lineNumbersRef}
                        className="w-11 py-4 select-none bg-slate-900/60 border-r border-slate-800 text-right pr-2.5 text-slate-600 font-mono text-xs overflow-hidden leading-[21px]"
                      >
                        {Array.from({ length: Math.max(code.split("\n").length, 20) }).map((_, i) => (
                          <div key={i} className="h-[21px]">{i + 1}</div>
                        ))}
                      </div>

                      <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onScroll={handleEditorScroll}
                        onKeyDown={handleEditorKeyDown}
                        className="flex-1 w-full h-full p-4 bg-transparent text-emerald-300 outline-none resize-none font-mono text-xs leading-[21px] whitespace-pre overflow-x-auto selection:bg-emerald-500/30 selection:text-white"
                        spellCheck="false"
                        placeholder="// Write or paste your DSA code here..."
                      />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2.5 text-[11px] text-muted font-mono">
                      <span>{code.split("\n").length} lines • {(new Blob([code]).size / 1024).toFixed(1)} KB / 50 KB</span>
                      <span>Press Ctrl + Enter to run</span>
                    </div>
                  </div>
                </div>

                {/* Console Output & Stdin Column (5 cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  {/* Console Terminal */}
                  <div className="glass premium-border rounded-[2rem] p-5 flex flex-col min-h-[340px]">
                    <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                        <Terminal size={16} className="text-emerald-400" />
                        <span>Execution Console</span>
                        {exitCode === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Exit 0: Succeeded
                          </span>
                        )}
                        {exitCode !== null && exitCode !== 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Exit {exitCode}: Error
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {execTime !== null && (
                          <span className="text-[10px] font-mono text-muted bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
                            {execTime}ms
                          </span>
                        )}
                        {(output || errorLog) && (
                          <button
                            onClick={() => {
                              setOutput("");
                              setErrorLog("");
                              setExitCode(null);
                            }}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-950 rounded-2xl p-4 font-mono text-xs text-gray-300 border border-slate-800 overflow-y-auto max-h-[260px] min-h-[160px] whitespace-pre-wrap leading-relaxed">
                      {output && <div className="text-slate-200">{output}</div>}
                      {errorLog && (
                        <div className="mt-2 text-rose-400 bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/40">
                          {errorLog}
                        </div>
                      )}
                      {!output && !errorLog && (
                        <span className="text-gray-600 italic">
                          Click "Run Code" to execute code in isolated sandbox and view stdout...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stdin & Sandboxed Guarantee Widget */}
                  <div className="glass premium-border rounded-[2rem] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Sliders size={14} className="text-blue-400" /> Custom Input (stdin)
                      </h4>
                      {stdin && (
                        <button
                          onClick={() => setStdin("")}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Optional test case input (e.g. 5\n10 20 30 40 50)..."
                      className="w-full h-24 bg-slate-950 text-slate-300 p-3 rounded-xl border border-slate-800 outline-none text-xs font-mono resize-none focus:border-blue-500/50"
                    />

                    {/* Quick Preset Inputs */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted">Quick:</span>
                      <button
                        onClick={() => setStdin("5\n10 40 20 50 30")}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-muted hover:text-white transition"
                      >
                        5 numbers
                      </button>
                      <button
                        onClick={() => setStdin("algorithm")}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-muted hover:text-white transition"
                      >
                        string
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="shrink-0" />
                      <span>Isolated Runner • 0 DB writes • 0 streak changes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* AI Mentor Advice Banner */}
                {aiFeedback && (
                  <div className="glass premium-border rounded-[2rem] p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                        <Code2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          AI Coding Mentor <span className="text-[10px] uppercase tracking-widest bg-blue-500 text-white px-2 py-0.5 rounded-full font-extrabold">Pro Insights</span>
                        </h3>
                        <p className="text-xs md:text-sm text-blue-900 dark:text-blue-100/90 leading-relaxed italic">
                          "{aiFeedback}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Independent Multi-User Public Tracker Banner */}
                <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.05] to-transparent p-6 shadow-xl space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="text-orange-500" size={18} />
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                          Independent Platform Tracker & Explorer
                        </h3>
                        <span className="rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                          Public Sandbox
                        </span>
                      </div>
                      <p className="text-xs text-muted max-w-2xl leading-relaxed">
                        Track any coder's public activity or explore competitor stats freely without altering your account.
                        <span className="text-amber-500 dark:text-amber-400 font-semibold ml-1">
                          Official rating points & badges are exclusively powered by verified accounts in your Profile.
                        </span>
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#8090fd] px-3.5 py-2 text-xs font-bold transition shrink-0 self-start lg:self-auto"
                    >
                      <ShieldCheck size={14} />
                      <span>Profile & Verified Rating ↗</span>
                    </Link>
                  </div>

                  {/* Search / Inspect Any Handle Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1 rounded-xl bg-black/10 dark:bg-white/5 p-1">
                      {[
                        { id: "leetcode", label: "LeetCode" },
                        { id: "codeforces", label: "Codeforces" },
                        { id: "codechef", label: "CodeChef" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setInspectPlatform(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            inspectPlatform === p.id
                              ? "bg-orange-500 text-white shadow-xs"
                              : "text-muted hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 min-w-[200px] flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          placeholder={`Enter any ${inspectPlatform} handle to track (e.g. tourist, neal_wu)...`}
                          value={inspectHandleInput}
                          onChange={(e) => setInspectHandleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInspectAnyProfile();
                            }
                          }}
                          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900/80 pl-9 pr-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInspectAnyProfile()}
                        disabled={inspectLoading}
                        className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {inspectLoading ? "Fetching..." : "Track Profile"}
                      </button>
                    </div>

                    {/* Popular Coders Quick Pills */}
                    <div className="w-full flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted">
                      <span className="font-semibold">Quick Demo Coder:</span>
                      {[
                        { platform: "codeforces", handle: "tourist", label: "tourist (CF #1)" },
                        { platform: "leetcode", handle: "neal_wu", label: "neal_wu (LC)" },
                        { platform: "codeforces", handle: "Petr", label: "Petr (CF)" },
                        { platform: "codeforces", handle: "ecnerwala", label: "ecnerwala (CF)" },
                      ].map((demo) => (
                        <button
                          key={demo.handle}
                          type="button"
                          onClick={() => {
                            setInspectPlatform(demo.platform);
                            setInspectHandleInput(demo.handle);
                            handleInspectAnyProfile(demo.platform, demo.handle);
                          }}
                          className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-0.5 hover:border-orange-500 hover:text-orange-500 transition cursor-pointer"
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Inspection Warning / Status Banner */}
                  {inspectMode && inspectedProfile && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-600 dark:text-amber-400">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="shrink-0" />
                        <span>
                          Viewing public stats for <strong>@{inspectedProfile.handle}</strong> on{" "}
                          <strong>{inspectedProfile.platform.toUpperCase()}</strong>. This tracking is independent and does not affect your official StudyForge Rating (SFR) in Profile.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleExitInspectMode}
                        className="rounded-xl bg-white dark:bg-slate-800 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        ✕ Return to My Profiles
                      </button>
                    </div>
                  )}
                </div>

                {/* Main 2-Column Grid: Left = Connections, Right = Selected Platform Stats & Streak Details */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column: Platform Connections & Input Fields */}
                  <div className="glass premium-border rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Link2 size={20} className="text-orange-500" /> Platform Connections
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          Paste your profile link or handle once to save. Disconnect or update anytime.
                        </p>
                      </div>

                      <button
                        onClick={() => fetchStats(true)}
                        disabled={syncingStats}
                        className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 transition disabled:opacity-50 shrink-0"
                      >
                        <RotateCcw size={13} className={syncingStats ? "animate-spin" : ""} />
                        <span>{syncingStats ? "Syncing..." : "Sync Stats"}</span>
                      </button>
                    </div>

                    {/* Platform Connection Cards List */}
                    <div className="space-y-3 pt-1">
                      {[
                        {
                          id: "leetcode",
                          name: "LeetCode",
                          siteUrl: "https://leetcode.com",
                          getProfileUrl: (h) => {
                            if (!h) return "https://leetcode.com";
                            if (h.startsWith("http://") || h.startsWith("https://")) return h;
                            const clean = sanitizeHandle(h);
                            return `https://leetcode.com/u/${clean}/`;
                          },
                          placeholder: "e.g. 6L10VTDNeg or https://leetcode.com/u/6L10VTDNeg/",
                        },
                        {
                          id: "codeforces",
                          name: "Codeforces",
                          siteUrl: "https://codeforces.com",
                          getProfileUrl: (h) => {
                            if (!h) return "https://codeforces.com";
                            if (h.startsWith("http://") || h.startsWith("https://")) return h;
                            const clean = sanitizeHandle(h);
                            return `https://codeforces.com/profile/${clean}`;
                          },
                          placeholder: "e.g. tourist or https://codeforces.com/profile/tourist",
                        },
                        {
                          id: "codechef",
                          name: "CodeChef",
                          siteUrl: "https://www.codechef.com",
                          getProfileUrl: (h) => {
                            if (!h) return "https://www.codechef.com";
                            if (h.startsWith("http://") || h.startsWith("https://")) return h;
                            const clean = sanitizeHandle(h);
                            return `https://www.codechef.com/users/${clean}`;
                          },
                          placeholder: "e.g. codechef_user or https://codechef.com/users/user",
                        },
                        {
                          id: "github",
                          name: "GitHub",
                          siteUrl: "https://github.com",
                          getProfileUrl: (h) => {
                            if (!h) return "https://github.com";
                            if (h.startsWith("http://") || h.startsWith("https://")) return h;
                            const clean = sanitizeHandle(h);
                            return `https://github.com/${clean}`;
                          },
                          placeholder: "e.g. torvalds or https://github.com/torvalds",
                        },
                      ].map((plat) => {
                        const isSaved = Boolean(profiles[plat.id]);
                        const isEditing = Boolean(editingProfiles[plat.id]);
                        const showConnectedView = isSaved && !isEditing;
                        const handle = profiles[plat.id];

                        return (
                          <div
                            key={plat.id}
                            className={`p-4 rounded-2xl border transition flex flex-col gap-2 ${
                              isSaved
                                ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20"
                                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSaved ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white truncate">
                                  {plat.name}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                  isSaved
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                }`}>
                                  {isSaved ? "Connected ✓" : "Not Connected"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={plat.siteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-500/10 hover:bg-gray-500/20 px-2.5 py-1 rounded-xl border border-gray-500/20 transition flex items-center gap-1 shrink-0"
                                  title={`Visit ${plat.name} Official Website`}
                                >
                                  <span>Visit Site</span>
                                  <ExternalLink size={12} />
                                </a>

                                {isSaved && (
                                  <>
                                    <a
                                      href={plat.getProfileUrl(handle)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 transition flex items-center gap-1 shrink-0"
                                      title={`View profile for @${handle}`}
                                    >
                                      <span>My Profile</span>
                                      <ExternalLink size={12} />
                                    </a>

                                    <button
                                      onClick={() => handleDisconnect(plat.id)}
                                      disabled={syncingStats}
                                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl border border-rose-500/20 transition flex items-center gap-1 disabled:opacity-50 shrink-0"
                                      title={`Disconnect ${plat.name}`}
                                    >
                                      <Unlink size={12} /> Disconnect
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {showConnectedView ? (
                              <div className="flex items-center justify-between text-xs pt-0.5">
                                <div className="flex items-center gap-1.5 font-mono text-gray-700 dark:text-gray-300 font-bold truncate">
                                  <Globe size={13} className="text-muted shrink-0" />
                                  <span className="truncate">@{sanitizeHandle(handle)}</span>
                                </div>

                                <button
                                  onClick={() => {
                                    setEditingProfiles({ ...editingProfiles, [plat.id]: true });
                                    setInputValues({ ...inputValues, [plat.id]: profiles[plat.id] || "" });
                                  }}
                                  className="text-[10px] text-muted hover:text-white underline font-semibold shrink-0"
                                >
                                  Edit Link
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  value={inputValues[plat.id] || ""}
                                  onChange={(e) => setInputValues({ ...inputValues, [plat.id]: e.target.value })}
                                  className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500 font-semibold placeholder:font-normal min-w-0"
                                  placeholder={plat.placeholder}
                                />
                                <button
                                  onClick={() => handleConnectSinglePlatform(plat.id, inputValues[plat.id])}
                                  disabled={syncingStats || !inputValues[plat.id]}
                                  className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-white font-bold px-3.5 py-1.5 text-xs shadow-sm transition disabled:opacity-40 shrink-0"
                                >
                                  Connect
                                </button>
                                {isEditing && (
                                  <button
                                    onClick={() => setEditingProfiles({ ...editingProfiles, [plat.id]: false })}
                                    className="text-xs text-muted hover:text-white px-2 py-1"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <Button onClick={handleSaveProfiles} disabled={syncingStats} className="w-full mt-3">
                        <Save size={16} className="mr-2" /> {syncingStats ? "Saving & Syncing All..." : "Save All Platform Connections"}
                      </Button>

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-black/5 dark:border-white/5">
                        <span className="text-muted">Want cryptographic ownership verification?</span>
                        <Link
                          to="/settings?tab=platforms"
                          className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                          Verify in Profile Section <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Platform Select Tabs & Real Platform Details + Streaks */}
                  <div className="glass premium-border rounded-[2rem] p-6 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" /> Real Platform Statistics
                      </h3>
                      <span className="text-[10px] text-muted font-mono uppercase tracking-wider">Click platform tab</span>
                    </div>

                    {/* Platform Selector Buttons */}
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      {[
                        { id: "leetcode", label: "LeetCode", activeColor: "bg-amber-500 text-white shadow-amber-500/20" },
                        { id: "codeforces", label: "Codeforces", activeColor: "bg-blue-600 text-white shadow-blue-500/20" },
                        { id: "codechef", label: "CodeChef", activeColor: "bg-rose-600 text-white shadow-rose-500/20" },
                      ].map((platTab) => {
                        const active = selectedPlatformTab === platTab.id;
                        return (
                          <button
                            key={platTab.id}
                            onClick={() => setSelectedPlatformTab(platTab.id)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center truncate ${
                              active
                                ? `${platTab.activeColor} shadow-md`
                                : "text-muted hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            {platTab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Platform Stats + Streak Feature Container */}
                    <div className="flex-1 pt-2 space-y-4">
                      {selectedPlatformTab === "leetcode" && (
                        <div className="space-y-4">
                          {/* LeetCode Solved Problems Section */}
                          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">LeetCode Solved Problems</span>
                                  {displayProfiles.leetcode && (
                                    <a
                                      href={`https://leetcode.com/u/${sanitizeHandle(displayProfiles.leetcode)}/`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 font-bold"
                                    >
                                      @{sanitizeHandle(displayProfiles.leetcode)} <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                                <h4 className="text-3xl font-black text-gray-900 dark:text-white">
                                  {displayStats.leetcode ? displayStats.leetcode.totalSolved : 0} <span className="text-xs font-normal text-muted">total done problems</span>
                                </h4>
                              </div>

                              {activityToday.leetcode ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                                  <CheckCircle2 size={13} /> Solved Today
                                </span>
                              ) : (
                                <button onClick={() => handleMarkSolved("leetcode")} className="text-xs text-muted hover:text-white bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full transition font-semibold">
                                  Mark Solved
                                </button>
                              )}
                            </div>

                            {displayProfiles.leetcode ? (
                              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                  <p className="text-[10px] text-emerald-400 font-bold uppercase">Easy</p>
                                  <p className="text-xl font-black text-emerald-300">{displayStats.leetcode?.easySolved || 0}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-[10px] text-amber-400 font-bold uppercase">Medium</p>
                                  <p className="text-xl font-black text-amber-300">{displayStats.leetcode?.mediumSolved || 0}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                  <p className="text-[10px] text-rose-400 font-bold uppercase">Hard</p>
                                  <p className="text-xl font-black text-rose-300">{displayStats.leetcode?.hardSolved || 0}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted italic pt-1">No LeetCode handle entered. Enter any handle above to inspect stats!</p>
                            )}
                          </div>

                          {/* LeetCode Streak Feature Section (Displayed Under LeetCode Section) */}
                          <div className="p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Flame className="text-orange-500" size={20} />
                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">LeetCode Streak & Activity Status</h4>
                              </div>
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                                {displayStats.leetcode?.totalSubmissions || 0} Submissions in Past Year
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center pt-1">
                              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-[10px] text-orange-400 font-bold uppercase">Current Streak</p>
                                <h5 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {displayStats.leetcode?.streak !== undefined ? displayStats.leetcode.streak : displayStreak} <span className="text-[10px] font-normal text-muted">days</span>
                                </h5>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[10px] text-amber-400 font-bold uppercase">Max Streak</p>
                                <h5 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {displayStats.leetcode?.maxStreak !== undefined ? displayStats.leetcode.maxStreak : displayLongestStreak} <span className="text-[10px] font-normal text-muted">days</span>
                                </h5>
                              </div>

                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-[10px] text-emerald-400 font-bold uppercase">Total Active</p>
                                <h5 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {displayStats.leetcode?.totalActiveDays !== undefined ? displayStats.leetcode.totalActiveDays : (inspectMode ? (inspectedProfile?.activityDates?.length || 0) : activityDates.length)} <span className="text-[10px] font-normal text-muted">days</span>
                                </h5>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPlatformTab === "codeforces" && (
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Codeforces Profile</span>
                                  {displayProfiles.codeforces && (
                                    <a
                                      href={`https://codeforces.com/profile/${sanitizeHandle(displayProfiles.codeforces)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1 font-bold"
                                    >
                                      @{sanitizeHandle(displayProfiles.codeforces)} <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                                <h4 className="text-3xl font-black text-gray-900 dark:text-white">
                                  {displayStats.codeforces ? displayStats.codeforces.rating : "N/A"} <span className="text-xs font-normal text-muted">rating</span>
                                </h4>
                              </div>

                              {activityToday.codeforces ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                                  <CheckCircle2 size={13} /> Solved Today
                                </span>
                              ) : (
                                <button onClick={() => handleMarkSolved("codeforces")} className="text-xs text-muted hover:text-white bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full transition font-semibold">
                                  Mark Solved
                                </button>
                              )}
                            </div>

                            {displayProfiles.codeforces ? (
                              <div className="grid grid-cols-2 gap-3 text-center pt-1">
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-[10px] text-blue-400 font-bold uppercase">Max Rating</p>
                                  <p className="text-xl font-black text-blue-300">{displayStats.codeforces?.maxRating || "N/A"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Rank Title</p>
                                  <p className="text-xl font-black text-indigo-300 capitalize">{displayStats.codeforces?.rank || "Unrated"}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted italic pt-1">No Codeforces handle entered. Enter any handle above to inspect stats!</p>
                            )}
                          </div>

                          {/* Codeforces Streak Section */}
                          <div className="p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Flame className="text-orange-500" size={20} />
                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Codeforces Streak Status</h4>
                              </div>
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                                Platform Streak
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center pt-1">
                              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-[10px] text-orange-400 font-bold uppercase">Current Streak</p>
                                <h5 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {currentStreak} <span className="text-xs font-normal text-muted">days</span>
                                </h5>
                              </div>

                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[10px] text-amber-400 font-bold uppercase">Longest Streak</p>
                                <h5 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {longestStreak} <span className="text-xs font-normal text-muted">days</span>
                                </h5>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPlatformTab === "codechef" && (
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">CodeChef Profile</span>
                                  {profiles.codechef && (
                                    <a
                                      href={`https://www.codechef.com/users/${sanitizeHandle(profiles.codechef)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-mono text-rose-400 hover:underline flex items-center gap-1 font-bold"
                                    >
                                      @{sanitizeHandle(profiles.codechef)} <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                                <h4 className="text-3xl font-black text-gray-900 dark:text-white">
                                  {stats.codechef ? stats.codechef.rating : "N/A"} <span className="text-xs font-normal text-muted">rating</span>
                                </h4>
                              </div>

                              {activityToday.codechef ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                                  <CheckCircle2 size={13} /> Solved Today
                                </span>
                              ) : (
                                <button onClick={() => handleMarkSolved("codechef")} className="text-xs text-muted hover:text-white bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full transition font-semibold">
                                  Mark Solved
                                </button>
                              )}
                            </div>

                            {profiles.codechef ? (
                              <div className="grid grid-cols-2 gap-3 text-center pt-1">
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-[10px] text-amber-400 font-bold uppercase">Star Rating</p>
                                  <p className="text-xl font-black text-amber-300">{stats.codechef?.stars || "None"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                  <p className="text-[10px] text-rose-400 font-bold uppercase">Highest Rating</p>
                                  <p className="text-xl font-black text-rose-300">{stats.codechef?.highestRating || "N/A"}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted italic pt-1">No CodeChef handle saved. Connect on the left to sync stats!</p>
                            )}
                          </div>

                          {/* CodeChef Streak Section */}
                          <div className="p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Flame className="text-orange-500" size={20} />
                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">CodeChef Streak Status</h4>
                              </div>
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                                Platform Streak
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center pt-1">
                              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-[10px] text-orange-400 font-bold uppercase">Current Streak</p>
                                <h5 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {currentStreak} <span className="text-xs font-normal text-muted">days</span>
                                </h5>
                              </div>

                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[10px] text-amber-400 font-bold uppercase">Longest Streak</p>
                                <h5 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                                  {longestStreak} <span className="text-xs font-normal text-muted">days</span>
                                </h5>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Platform-Specific Submission Calendar Heatmap */}
                {(() => {
                  const currentPlat = selectedPlatformTab;
                  let totalSubs = 0;
                  let activeDays = 0;
                  let maxStreakVal = 0;
                  let platformTitle = "LeetCode";

                  if (currentPlat === "leetcode") {
                    platformTitle = "LeetCode";
                    totalSubs = stats.leetcode?.totalSubmissions || stats.leetcode?.submissionDates?.length || 0;
                    activeDays = stats.leetcode?.totalActiveDays || stats.leetcode?.submissionDates?.length || 0;
                    maxStreakVal = stats.leetcode?.maxStreak || 0;
                  } else if (currentPlat === "codeforces") {
                    platformTitle = "Codeforces";
                    const cfDates = stats.codeforces?.submissionDates || [];
                    totalSubs = stats.codeforces?.totalSubmissions || Object.values(stats.codeforces?.submissionCounts || {}).reduce((a, b) => a + b, 0) || cfDates.length;
                    activeDays = stats.codeforces?.totalActiveDays || cfDates.length;
                    maxStreakVal = stats.codeforces?.maxStreak || 0;
                  } else if (currentPlat === "codechef") {
                    platformTitle = "CodeChef";
                    const ccDates = stats.codechef?.submissionDates || [];
                    totalSubs = stats.codechef?.totalSubmissions || Object.values(stats.codechef?.submissionCounts || {}).reduce((a, b) => a + b, 0) || ccDates.length;
                    activeDays = stats.codechef?.totalActiveDays || ccDates.length;
                    maxStreakVal = stats.codechef?.maxStreak || 0;
                  }

                  const { columns } = generateHeatmapGrid(currentPlat);
                  const CELL = 10;
                  const GAP = 4;
                  const STEP = CELL + GAP;
                  const MONTH_GAP = 10;
                  const TOP_PAD = 0;
                  const BOTTOM_LABEL_H = 22;

                  // Color progression: 0 = empty, 1 = light green, more submissions = progressively darker greens
                  const getHeatmapColor = (count) => {
                    if (!count || count === 0) return "#2a2a2a";
                    if (count === 1) return "#4ade80"; // Light vibrant green
                    if (count <= 3) return "#22c55e"; // Medium green
                    if (count <= 5) return "#16a34a"; // Dark green
                    return "#14532d"; // Deep darkest forest green
                  };

                  // Pre-compute x positions with month gaps
                  const xPositions = [];
                  let xCursor = 0;
                  for (let c = 0; c < columns.length; c++) {
                    if (columns[c].isMonthStart) {
                      xCursor += MONTH_GAP;
                    }
                    xPositions.push(xCursor);
                    xCursor += STEP;
                  }
                  const svgW = xCursor + 10;
                  const svgH = TOP_PAD + 7 * STEP + BOTTOM_LABEL_H;

                  return (
                    <div className="rounded-2xl p-5 pb-4 bg-[#282828] border border-[#3a3a3a]">
                      {/* Header — dynamic for each platform */}
                      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-white">{totalSubs}</span>
                          <span className="text-sm text-[#eff2f6cc]">{platformTitle} submissions in the past one year</span>
                        </div>
                        <div className="flex items-baseline gap-6">
                          <span className="text-[13px] text-[#eff2f699]">
                            Total active days: <strong className="text-white font-bold">{activeDays}</strong>
                          </span>
                          <span className="text-[13px] text-[#eff2f699]">
                            Max streak: <strong className="text-white font-bold">{maxStreakVal}</strong>
                          </span>
                        </div>
                      </div>

                      {/* SVG Heatmap Calendar */}
                      <div className="overflow-x-auto">
                        <svg width={svgW} height={svgH} xmlns="http://www.w3.org/2000/svg" className="block select-none" style={{ minWidth: svgW }}>
                          {/* Grid cells */}
                          {columns.map((col, cIdx) =>
                            col.days.map((day, dIdx) => {
                              if (!day) return null; // empty slot (split week)
                              const cellColor = getHeatmapColor(day.count);
                              const cx = xPositions[cIdx];
                              const cy = TOP_PAD + dIdx * STEP;

                              return (
                                <rect
                                  key={`${cIdx}-${dIdx}`}
                                  x={cx}
                                  y={cy}
                                  width={CELL}
                                  height={CELL}
                                  rx={2}
                                  ry={2}
                                  fill={cellColor}
                                  stroke={day.isToday ? "#f59e0b" : (day.count === 0 ? "#3a3a3a" : "none")}
                                  strokeWidth={day.isToday ? 1.5 : (day.count === 0 ? 0.5 : 0)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <title>{`${day.formattedDate}: ${day.count > 0 ? `${day.count} ${platformTitle} submission${day.count === 1 ? "" : "s"}` : `No ${platformTitle} submissions`}`}</title>
                                </rect>
                              );
                            })
                          )}

                          {/* Month labels at the BOTTOM */}
                          {columns.map((col, cIdx) =>
                            col.monthLabel ? (
                              <text
                                key={`m-${cIdx}`}
                                x={xPositions[cIdx]}
                                y={TOP_PAD + 7 * STEP + 14}
                                fill="#eff2f699"
                                fontSize="11"
                                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                                fontWeight="400"
                              >
                                {col.monthLabel}
                              </text>
                            ) : null
                          )}
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === "social" && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="glass premium-border rounded-[2.5rem] p-6 lg:p-8 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Coding Leaderboard</h3>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Flame size={14} className="text-orange-500" /> {filteredUsers.length} student coders active today
                    </p>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search coders..."
                      className="bg-black/10 dark:bg-white/10 text-xs font-semibold text-gray-900 dark:text-white pl-8 pr-3 py-2 rounded-xl border border-black/10 dark:border-white/10 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  {filteredUsers.map((item, i) => (
                    <div
                      key={item.user?._id || i}
                      className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-blue-500/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-6 text-center text-xs font-black text-muted">#{i + 1}</span>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
                          {item.user?.avatar ? (
                            <img src={item.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} className="text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-xs md:text-sm text-gray-900 dark:text-white">{item.user?.name || "Anonymous Coder"}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.platforms.map((p) => (
                              <span key={p} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          {item.platforms.length} platform{item.platforms.length === 1 ? "" : "s"} solved
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted">
                      <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">No coders found for today yet.</p>
                      <p className="text-xs mt-1">Be the first to log a solved problem and claim rank #1!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "contests" && (
              <motion.div
                key="contests"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="glass premium-border rounded-[2.5rem] p-6 lg:p-8 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target size={22} className="text-rose-500" /> Upcoming Competitive Contests
                    </h3>
                    <p className="text-xs text-muted mt-0.5">Live schedules for Codeforces, LeetCode, and major coding platforms.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {["All", "Codeforces", "LeetCode"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setContestPlatformFilter(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          contestPlatformFilter === p
                            ? "bg-blue-600 text-white"
                            : "bg-black/10 dark:bg-white/10 text-muted hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredContests.map((c, i) => {
                    const date = new Date(c.startTimeSeconds * 1000);
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();
                    const countdown = getTimeRemaining(c.startTimeSeconds);

                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
                          isToday
                            ? "border-orange-500/40 bg-orange-500/5 shadow-md shadow-orange-500/10"
                            : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-blue-500/30"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                c.platform === "Codeforces" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {c.platform}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                                countdown.expired
                                  ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30"
                                  : isToday
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                              }`}
                            >
                              <Clock size={11} /> {countdown.text}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm leading-snug text-gray-900 dark:text-white mb-4 line-clamp-2">{c.name}</h4>
                        </div>

                        <div className="space-y-2.5 text-xs text-muted font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-blue-400" />
                            <span>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-amber-400" />
                            <span>{Math.floor(c.durationSeconds / 3600)}h {(c.durationSeconds % 3600) / 60 > 0 ? `${(c.durationSeconds % 3600) / 60}m` : ""} duration</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <a
                              href={getGoogleCalendarLink(c)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition text-[11px] font-bold"
                              title="Add to Google Calendar"
                            >
                              <CalendarPlus size={13} />
                              <span>Set Reminder</span>
                            </a>

                            <a
                              href={c.link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition text-[11px] font-bold shadow-sm"
                            >
                              <span>Official Site</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredContests.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted">
                      <p className="text-sm font-semibold">No upcoming contests matching filters.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

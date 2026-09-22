import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Flame,
  Link2,
  ListVideo,
  MessageSquare,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import Button from "../components/common/Button";
import ThemeToggle from "../components/common/ThemeToggle";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getPlaylists, importYouTubePlaylist } from "../services/playlistService";
import { getAllQuizAttempts } from "../services/aiService";
import { getVideoMeta, searchVideos } from "../services/videoService";
import { getRandomSuggestedCourses, SUGGESTED_TOPICS } from "../utils/suggestedCourses";

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function parseYouTubeInput(input = "") {
  const trimmed = String(input || "").trim();
  if (!trimmed) return null;

  // Check playlist URL
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return { type: "playlist", id: playlistMatch[1], isPlaylist: true };
  }

  // Check watch URL or short URL or embed
  const watchMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (watchMatch && watchMatch[1]) {
    return { type: "video", id: watchMatch[1], isPlaylist: false };
  }

  // Check direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: "video", id: trimmed, isPlaylist: false };
  }

  return null;
}

function extractWeakTopicLabel(question = "") {
  const cleaned = String(question)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(
      /\b(what|which|who|why|how|when|where|is|are|the|a|an|of|to|in|for|and|or|does|do|did|can|could|would|should|best|following)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "General Concept";

  const words = cleaned.split(" ").filter((w) => w.length > 2);
  if (!words.length) return "Core Concepts";

  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  const prioritized = phrases.find(
    (p) =>
      p.includes("closure") ||
      p.includes("async") ||
      p.includes("promise") ||
      p.includes("component") ||
      p.includes("state") ||
      p.includes("hook") ||
      p.includes("effect") ||
      p.includes("event") ||
      p.includes("dom") ||
      p.includes("array") ||
      p.includes("object") ||
      p.includes("function") ||
      p.includes("class") ||
      p.includes("prototype") ||
      p.includes("scope")
  );

  if (prioritized) {
    return prioritized
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const selected = phrases[0] || words.slice(0, 2).join(" ");
  return selected
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function deriveWeakTopics(quizAttempts = []) {
  const mistakesByTopic = {};

  quizAttempts.forEach((attempt) => {
    (attempt?.questions || []).forEach((q) => {
      const userAns = q?.userAnswer;
      const correctAns = q?.correctAnswer;
      const isCorrect =
        userAns !== undefined &&
        correctAns !== undefined &&
        String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();

      if (!isCorrect && q?.question) {
        const topic = extractWeakTopicLabel(q.question);
        mistakesByTopic[topic] = (mistakesByTopic[topic] || 0) + 1;
      }
    });
  });

  return Object.entries(mistakesByTopic)
    .map(([topic, mistakes]) => ({ topic, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 4);
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [playlistsCount, setPlaylistsCount] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [userData, setUserData] = useState(getStoredUser());
  const [videoTitlesCache, setVideoTitlesCache] = useState({});

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [startingTrackId, setStartingTrackId] = useState("");

  // Dynamic Suggested Courses (refreshes on every load / interaction)
  const [suggestedCourses, setSuggestedCourses] = useState(() => getRandomSuggestedCourses(4));
  const [activeSuggestedTopic, setActiveSuggestedTopic] = useState("All");
  const [isRefreshingSuggested, setIsRefreshingSuggested] = useState(false);

  // Daily Study Target State
  const [dailyGoalMins, setDailyGoalMins] = useState(() => {
    try {
      return Number(localStorage.getItem("learn_daily_target_mins") || 30);
    } catch {
      return 30;
    }
  });

  // Pomodoro Focus Timer State
  const [pomodoroMode, setPomodoroMode] = useState("focus"); // "focus" (25m) or "break" (5m)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroCycles, setPomodoroCycles] = useState(() => {
    try {
      return Number(localStorage.getItem("pomodoro_cycles_today") || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    let timer = null;
    if (isPomodoroRunning && pomodoroTime > 0) {
      timer = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroTime === 0) {
      setIsPomodoroRunning(false);
      if (pomodoroMode === "focus") {
        const nextCycles = pomodoroCycles + 1;
        setPomodoroCycles(nextCycles);
        try {
          localStorage.setItem("pomodoro_cycles_today", String(nextCycles));
        } catch {
          // ignore
        }
        setPomodoroMode("break");
        setPomodoroTime(5 * 60);
      } else {
        setPomodoroMode("focus");
        setPomodoroTime(25 * 60);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode, pomodoroCycles]);

  const togglePomodoro = () => {
    setIsPomodoroRunning((prev) => !prev);
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    setPomodoroTime(pomodoroMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchPomodoroMode = (mode) => {
    setIsPomodoroRunning(false);
    setPomodoroMode(mode);
    setPomodoroTime(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatPomodoroDisplay = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSetDailyGoal = (mins) => {
    setDailyGoalMins(mins);
    try {
      localStorage.setItem("learn_daily_target_mins", String(mins));
    } catch {
      // ignore
    }
  };

  const handleRefreshSuggested = (topic = activeSuggestedTopic) => {
    setIsRefreshingSuggested(true);
    const currentIds = suggestedCourses.map((c) => c.id);
    const fresh = getRandomSuggestedCourses(4, currentIds, topic);
    setSuggestedCourses(fresh);
    setTimeout(() => setIsRefreshingSuggested(false), 300);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    loadDashboard();
    setSuggestedCourses(getRandomSuggestedCourses(4));
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [analyticsRes, playlistsRes, quizAttemptsRes] = await Promise.all([
        getDashboardAnalytics(),
        getPlaylists(),
        getAllQuizAttempts(),
      ]);

      setSummary(analyticsRes || null);
      setPlaylistsCount(playlistsRes?.playlists?.length || 0);
      setQuizAttempts(quizAttemptsRes?.attempts || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      setSummary(null);
      setPlaylistsCount(0);
      setQuizAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = summary?.stats || {};
  const recent = summary?.recent || {};
  const recentStudyItems = recent?.progress || [];

  const todayWatchSec = Number(stats?.todayWatchTimeSec || 0);
  const todayWatchMins = Math.floor(todayWatchSec / 60);
  const totalWatchMins = Math.round((Number(stats?.totalWatchTimeSec) || 0) / 60);

  const dailyProgressPercent = Math.min(
    100,
    Math.round((todayWatchSec / Math.max(1, dailyGoalMins * 60)) * 100)
  );

  const todayWatchDisplay =
    todayWatchSec > 0 && todayWatchMins === 0 ? "<1m" : `${todayWatchMins}m`;

  // Auto-fetch real YouTube video titles for recent items with generic titles
  useEffect(() => {
    if (!recentStudyItems.length) return;

    let isMounted = true;
    recentStudyItems.forEach((item) => {
      if (!item?.videoId) return;
      const t = typeof item.title === "string" ? item.title : "";
      const needsFetch =
        !t ||
        t === "Selected Video" ||
        t.startsWith("Video ") ||
        t === item.videoId;

      if (needsFetch && !videoTitlesCache[item.videoId]) {
        getVideoMeta(item.videoId)
          .then((res) => {
            if (!isMounted) return;
            const fetched = res?.video?.title || res?.title;
            setVideoTitlesCache((prev) => ({
              ...prev,
              [item.videoId]: fetched || t || `Video ${item.videoId}`,
            }));
          })
          .catch(() => {
            if (!isMounted) return;
            setVideoTitlesCache((prev) => ({
              ...prev,
              [item.videoId]: t || `Video ${item.videoId}`,
            }));
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [recentStudyItems]);

  const getDisplayTitle = (video) => {
    if (!video) return "";
    if (videoTitlesCache[video.videoId]) return videoTitlesCache[video.videoId];
    const t = typeof video.title === "string" ? video.title : "";
    if (t && t !== "Selected Video" && !t.startsWith("Video ") && t !== video.videoId) {
      return t;
    }
    return `Video ${video.videoId}`;
  };

  // Detect direct YouTube link or ID typed/pasted in search
  const detectedYouTube = useMemo(() => parseYouTubeInput(searchQuery), [searchQuery]);

  const startLearning = async (id, type, courseTitle = "") => {
    if (type === "playlist") {
      try {
        setStartingTrackId(id);
        const res = await importYouTubePlaylist(id, courseTitle);
        const imported = res?.playlist;
        const videos = imported?.videos || [];
        const firstVidObj = videos[0]?.video || videos[0];
        const firstVidId =
          typeof firstVidObj === "object"
            ? firstVidObj?.youtubeId || firstVidObj?.videoId
            : firstVidObj;

        if (firstVidId) {
          navigate(`/workspace/${firstVidId}?playlistId=${imported?._id || id}`);
        } else {
          navigate(`/workspace?playlistId=${imported?._id || id}`);
        }
      } catch (err) {
        console.error("Backend playlist import notice:", err);
        navigate(`/workspace?playlistId=${id}`);
      } finally {
        setStartingTrackId("");
      }
    } else {
      navigate(`/workspace/${id}`);
    }
  };

  const handleSearch = async (e, customQuery = null) => {
    e?.preventDefault();
    const queryToSearch = customQuery || searchQuery;
    if (!queryToSearch.trim()) return;

    // Check if input is a direct YouTube link or ID
    const directParsed = parseYouTubeInput(queryToSearch);
    if (directParsed) {
      startLearning(directParsed.id, directParsed.type);
      return;
    }

    try {
      setIsSearching(true);
      if (customQuery) setSearchQuery(customQuery);
      const res = await searchVideos(queryToSearch.trim(), "playlist");
      setSearchResults(res?.results || res?.items || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const lastActiveVideo = recentStudyItems[0] || null;
  const firstTrackedVideoId = lastActiveVideo?.videoId || "";
  const workspaceRoute = firstTrackedVideoId
    ? `/workspace/${firstTrackedVideoId}`
    : "/workspace";

  const weakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts);
  }, [quizAttempts]);

  const quickTools = [
    {
      icon: PlayCircle,
      title: "Learning Workspace",
      desc: "Video player with timestamp notes & AI summary.",
      badge: "Core Tool",
      action: () => navigate(workspaceRoute),
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      icon: ListVideo,
      title: "Playlists & Tracks",
      desc: "Custom YouTube learning tracks & courses.",
      badge: "Courses",
      action: () => navigate("/playlists"),
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      icon: MessageSquare,
      title: "AI Doubts & Chat",
      desc: "Ask instant AI questions on video topics.",
      badge: "24/7 AI",
      action: () => navigate(workspaceRoute),
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    },
    {
      icon: Bot,
      title: "Assignment Solver",
      desc: "Step-by-step AI solutions for code & homework.",
      badge: "Homework",
      action: () => navigate("/assignment-solver"),
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
  ];

  // Combined recent key notes and bookmarks stream
  const recentNotesAndBookmarks = useMemo(() => {
    const n = (recent?.notes || []).map((item) => ({
      id: item._id,
      type: "note",
      title: item.title || "Study Note",
      content: item.content || "Saved timestamp note",
      timestampSec: item.timestampSec || 0,
      youtubeId: item.youtubeId,
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
        : "Recent",
    }));

    const b = (recent?.bookmarks || []).map((item) => ({
      id: item._id,
      type: "bookmark",
      title: item.label || "Bookmark",
      content: item.note || "Bookmarked key concept",
      timestampSec: item.timestampSec || 0,
      youtubeId: item.youtubeId,
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
        : "Recent",
    }));

    return [...n, ...b].slice(0, 4);
  }, [recent]);

  return (
    <div className="min-h-screen text-[var(--text)] pb-16">
      <div className="section-container py-8 md:py-12 space-y-10 md:space-y-12">
        {/* Top Navigation & User Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="relative shrink-0 group cursor-pointer"
              title="Click to manage your profile & photo"
            >
              <img
                src={
                  userData?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    userData?.username || "learner"
                  }`
                }
                className="h-12 w-12 rounded-2xl border border-black/10 dark:border-white/10 shadow-xs object-cover group-hover:ring-2 group-hover:ring-indigo-500 group-hover:scale-105 transition-all"
                alt="User Avatar"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            </Link>

            <div>
              <h1 className="text-xl font-bold md:text-2xl tracking-tight text-gray-900 dark:text-white">
                {greeting},{" "}
                <span>
                  {userData?.name?.split(" ")[0] || "Learner"}
                </span>
                !
              </h1>
              <p className="text-xs text-muted font-medium flex items-center gap-2 mt-0.5">
                <Calendar size={13} className="text-blue-500" />
                {todayDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white">
              <Flame size={16} className="text-amber-500" />
              <span>{stats?.streakDays || 0} Day Streak</span>
            </div>

            <button
              onClick={loadDashboard}
              title="Refresh Dashboard"
              className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-muted hover:text-gray-900 dark:hover:text-white transition active:scale-95"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <ThemeToggle />
          </div>
        </motion.div>

        {/* YouTube Video Discovery & Instant Launcher */}
        <div className="space-y-3">
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass premium-border flex items-center gap-3 rounded-2xl p-2 pl-4 shadow-xs"
          >
            <Search className="text-muted shrink-0" size={18} />
            <input
              type="text"
              placeholder="Paste any YouTube video/playlist link or search topics (e.g. React, Python, DSA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent py-2 text-xs md:text-sm text-gray-900 dark:text-white outline-none placeholder:text-muted"
            />
            {detectedYouTube ? (
              <button
                type="button"
                onClick={() => startLearning(detectedYouTube.id, detectedYouTube.type)}
                disabled={startingTrackId === detectedYouTube.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition active:scale-95 shadow-xs shrink-0"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 active:scale-95"
              >
                {isSearching ? "Searching..." : "Discover"}
              </button>
            )}
          </motion.form>

          {/* Instant Detected URL Indicator */}
          {detectedYouTube && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 font-medium"
            >
              <div className="flex items-center gap-2 truncate">
                <Link2 size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate">
                  Direct YouTube {detectedYouTube.isPlaylist ? "Playlist" : "Video"} detected:{" "}
                  <code className="px-1.5 py-0.5 rounded bg-blue-500/15 font-mono text-[11px]">
                    {detectedYouTube.id}
                  </code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => startLearning(detectedYouTube.id, detectedYouTube.type)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-300 hover:underline shrink-0"
              >
                Start Now →
              </button>
            </motion.div>
          )}
        </div>

        {/* Search Results Display */}
        {searchResults.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Found YouTube Courses for <span>"{searchQuery}"</span>
              </h2>
              <button
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear Search
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((result, idx) => (
                <div
                  key={result.id || idx}
                  className="glass premium-border group overflow-hidden rounded-2xl transition hover:-translate-y-1 p-3 flex flex-col justify-between"
                >
                  <div>
                    {result.thumbnail ? (
                      <div className="relative aspect-video overflow-hidden rounded-xl mb-3 border border-black/10 dark:border-white/10">
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                      {result.channelTitle || "YouTube Course"}
                    </p>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 mb-3">
                      {result.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => startLearning(result.id, result.type)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-xs"
                  >
                    Start Session <Zap size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Recommended YouTube Courses Grid (Shown when search is empty) */
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass premium-border rounded-2xl p-5 md:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  ▶
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      Recommended YouTube Learning Courses
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRefreshSuggested(activeSuggestedTopic)}
                      disabled={isRefreshingSuggested}
                      className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition active:scale-95 disabled:opacity-60"
                      title="Refresh suggestions"
                    >
                      <RotateCw size={11} className={isRefreshingSuggested ? "animate-spin text-blue-500" : "text-muted"} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Curated top-rated playlists • Rotates fresh courses every session
                  </p>
                </div>
              </div>

              {/* Topic Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setActiveSuggestedTopic(topic);
                      handleRefreshSuggested(topic);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      activeSuggestedTopic === topic
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suggestedCourses.map((course) => (
                <div
                  key={course.id}
                  className={`relative overflow-hidden rounded-2xl border ${course.gradient} bg-white dark:bg-gray-900/60 p-3.5 flex flex-col justify-between space-y-3 transition hover:-translate-y-1 shadow-xs group`}
                >
                  <div className="space-y-1.5">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold ${course.badgeColor}`}>
                      {course.category}
                    </span>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {course.title}
                    </h4>
                    <p className="text-[10px] text-muted">
                      {course.channel}
                    </p>
                  </div>
                  <button
                    onClick={() => startLearning(course.id, course.type, course.title)}
                    disabled={startingTrackId === course.id}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white py-1.5 text-xs font-semibold transition shadow-xs disabled:opacity-50"
                  >
                    <span>{startingTrackId === course.id ? "Importing Track..." : "Start Track"}</span>
                    <Zap size={13} className={startingTrackId === course.id ? "animate-spin" : ""} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Compact Continue Learning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass premium-border relative overflow-hidden rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-5 relative z-10">
            {lastActiveVideo?.thumbnail ? (
              <button
                onClick={() => navigate(workspaceRoute)}
                className="relative shrink-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 group"
              >
                <img
                  src={lastActiveVideo.thumbnail}
                  alt={getDisplayTitle(lastActiveVideo)}
                  className="h-16 w-28 object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <PlayCircle size={24} className="text-white" />
                </div>
              </button>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-300 mb-1">
                <Sparkles size={11} />
                {lastActiveVideo ? "Active Session" : "Welcome"}
              </div>

              <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white tracking-tight leading-snug truncate">
                {lastActiveVideo
                  ? getDisplayTitle(lastActiveVideo)
                  : "Start automated YouTube video learning"}
              </h2>

              <p className="text-[11px] text-muted mt-0.5">
                {lastActiveVideo
                  ? `Watched ${formatDuration(lastActiveVideo.watchTimeSec)} • Resume with AI notes & flashcards.`
                  : "Paste any YouTube link to generate AI notes, flashcards, and quizzes."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(workspaceRoute)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 px-4 py-2 text-xs font-semibold text-white shadow-xs transition"
              >
                {lastActiveVideo ? "Resume" : "Open Workspace"}
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => navigate("/playlists")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                Playlists ({playlistsCount})
              </button>
            </div>
          </div>
        </motion.div>

        {/* Daily Study Target & Focus Pomodoro Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Daily Target Tracker */}
          <div className="glass premium-border rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Target size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Daily Study Target</h3>
                    <p className="text-[11px] text-muted">Stay consistent with focused video learning</p>
                  </div>
                </div>

                {dailyProgressPercent >= 100 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    Achieved!
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {todayWatchDisplay} / {dailyGoalMins}m
                    </span>
                    <span className="block text-[10px] text-muted font-normal">
                      Total: {totalWatchMins}m all-time
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted font-medium">Today's Progress</span>
                  <span className="font-bold text-gray-900 dark:text-white">{dailyProgressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden border border-black/5 dark:border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dailyProgressPercent >= 100 ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Goal Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-[11px] text-muted font-medium">Set Daily Goal:</span>
              <div className="flex items-center gap-1">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetDailyGoal(mins)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      dailyGoalMins === mins
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Focus Pomodoro Timer */}
          <div className="glass premium-border rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Timer size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pomodoro Study Timer</h3>
                  <p className="text-[11px] text-muted">25m focus blocks • 5m rest</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => switchPomodoroMode("focus")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    pomodoroMode === "focus"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Focus 25m
                </button>
                <button
                  type="button"
                  onClick={() => switchPomodoroMode("break")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    pomodoroMode === "break"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Break 5m
                </button>
              </div>
            </div>

            {/* Timer Counter Display & Controls */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  {formatPomodoroDisplay(pomodoroTime)}
                </span>
                {isPomodoroRunning && (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePomodoro}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
                    isPomodoroRunning
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-purple-600 hover:bg-purple-500"
                  }`}
                >
                  {isPomodoroRunning ? (
                    <>
                      <Pause size={13} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      <span>Start Focus</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetPomodoro}
                  title="Reset Timer"
                  className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-muted hover:text-gray-900 dark:hover:text-white transition active:scale-95"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Interval History Footnote */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-black/5 dark:border-white/5 text-muted">
              <span>{pomodoroCycles} focus cycle{pomodoroCycles === 1 ? "" : "s"} logged today</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate(workspaceRoute)}>
                Open in Workspace →
              </span>
            </div>
          </div>
        </div>

        {/* 4 Essential Stat Chips */}
        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl border border-black/10 dark:border-white/10 p-5 flex items-center gap-4 shadow-xs">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Clock3 size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Watch Time</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : formatDuration(stats.totalWatchTimeSec)}
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl border border-black/10 dark:border-white/10 p-5 flex items-center gap-4 shadow-xs">
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <PlayCircle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Tracked Videos</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : stats.totalTrackedVideos || 0}
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl border border-black/10 dark:border-white/10 p-5 flex items-center gap-4 shadow-xs">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Notes & Bookmarks</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : (stats.totalNotes || 0) + (stats.totalBookmarks || 0)}
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl border border-black/10 dark:border-white/10 p-5 flex items-center gap-4 shadow-xs">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">AI Interactions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : stats.totalAIInteractions || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Learning Tools & Features Suite */}
        <div className="glass premium-border rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                <span>Learning Tools & Features</span>
              </h3>
              <p className="text-xs text-muted mt-1">Choose an automated tool to jump-start your study workflow</p>
            </div>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 self-start sm:self-auto">
              Primary Suite
            </span>
          </div>

          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.title}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={tool.action}
                  className="group relative flex flex-col justify-between rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0e1526]/80 hover:border-blue-500/40 dark:hover:border-blue-400/40 p-5 md:p-6 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer min-h-[175px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${tool.iconBg}`}>
                        <Icon size={19} />
                      </div>
                      <span className="rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {tool.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5 line-clamp-2">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    <span>Open tool</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Recent Videos & Recent Key Notes 2-Section Layout */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          {/* Recent Videos */}
          <div className="glass premium-border rounded-2xl p-5 md:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Videos</h3>
              <span className="text-[11px] text-muted">{recentStudyItems.length} tracked</span>
            </div>

            {recentStudyItems.length ? (
              <div className="space-y-3">
                {recentStudyItems.slice(0, 3).map((video) => {
                  const displayTitle = getDisplayTitle(video);
                  const progressPercent = video?.completed
                    ? 100
                    : Math.min(
                        100,
                        Math.round(
                          ((video?.lastPositionSec || 0) /
                            Math.max(1, video?.durationSec || 1)) *
                            100
                        )
                      );

                  return (
                    <motion.div
                      key={video?._id || video?.videoId}
                      whileHover={{ y: -1 }}
                      onClick={() => navigate(`/workspace/${video.videoId}`)}
                      className="group cursor-pointer flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-3 transition hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
                    >
                      <div className="relative shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={
                            video?.thumbnail ||
                            `https://img.youtube.com/vi/${video?.videoId}/mqdefault.jpg`
                          }
                          alt={displayTitle}
                          className="h-12 w-20 object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {displayTitle}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {formatDuration(video?.watchTimeSec || 0)} watched • {progressPercent}%
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 p-6 text-center text-xs text-muted">
                No videos watched yet. Search or paste a YouTube course above to begin.
              </div>
            )}
          </div>

          {/* Recent Key Notes & Study Stream */}
          <div className="glass premium-border rounded-2xl p-5 md:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Notes & Bookmarks</h3>
              </div>
              <span className="text-[11px] text-muted">Click to jump into moment</span>
            </div>

            {recentNotesAndBookmarks.length ? (
              <div className="space-y-3">
                {recentNotesAndBookmarks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.youtubeId) {
                        navigate(`/workspace/${item.youtubeId}?t=${item.timestampSec || 0}`);
                      } else {
                        navigate(workspaceRoute);
                      }
                    }}
                    className="group cursor-pointer flex items-center justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 p-3 transition hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        <Play size={9} fill="currentColor" />
                        {formatTimestamp(item.timestampSec)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted truncate">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted shrink-0">
                      <span>{item.time}</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 p-6 text-center text-xs text-muted">
                No timestamp notes or bookmarks yet. Open your workspace to capture video insights.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Weak Topics & Revision */}
        <div className="glass premium-border rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Topics Needing Revision</h3>
          </div>
          {weakTopics.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {weakTopics.map((item) => (
                <div
                  key={item.topic}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{item.topic}</p>
                    <p className="text-[11px] text-amber-500 font-medium">{item.mistakes} Quiz Mistake{item.mistakes > 1 ? "s" : ""}</p>
                  </div>
                  <button
                    onClick={() => navigate(workspaceRoute)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition active:scale-95"
                  >
                    Practice
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              No weak topics identified yet. Complete AI Quizzes in your workspace to get automatic topic practice recommendations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
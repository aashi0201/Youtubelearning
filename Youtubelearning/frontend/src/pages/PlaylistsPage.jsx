import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Flame,
  FolderPlus,
  Layers,
  ListVideo,
  MoreVertical,
  PlayCircle,
  Plus,
  RotateCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import ThemeToggle from "../components/common/ThemeToggle";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  getPlaylists,
  createPlaylist,
  importYouTubePlaylist,
  deletePlaylist,
} from "../services/playlistService";
import { getAllProgress } from "../services/progressService";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getStreak } from "../services/activityService";
import {
  getStudyGoals,
  createStudyGoal,
  updateStudyGoal,
  deleteStudyGoal,
} from "../services/plannerService";
import { getRandomSuggestedCourses } from "../utils/suggestedCourses";
import {
  getCertificates,
  createCertificate,
  deleteCertificate,
} from "../services/certificateService";
import { searchVideos } from "../services/videoService";

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getLocalQuizAttempts() {
  try {
    const user = getStoredUser();
    const userId = user?._id || user?.id || user?.email || "guest";
    const prefix = `quizAttempts:${userId}:`;

    const attempts = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(raw)) {
        attempts.push(...raw);
      }
    }

    return attempts.sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  } catch {
    return [];
  }
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

  const words = cleaned
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 3);

  if (!words.length) return "General Concept";

  return words.join(" ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function deriveWeakTopics(attempts = []) {
  const topicMap = new Map();

  for (const attempt of attempts) {
    const answers = Array.isArray(attempt?.answers) ? attempt.answers : [];

    for (const answer of answers) {
      if (answer?.isCorrect) continue;

      const topic = extractWeakTopicLabel(answer?.question || "");
      topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
    }
  }

  return Array.from(topicMap.entries())
    .map(([topic, mistakes]) => ({ topic, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 5);
}

function extractPlaylistId(input = "") {
  if (!input) return "";
  const trimmed = input.trim();
  const match = trimmed.match(/[&?]list=([^&]+)/i);
  if (match && match[1]) return match[1];
  return trimmed;
}

export default function PlaylistsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [quizAttempts, setQuizAttempts] = useState([]);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState("tracks"); // "tracks" | "goals" | "badges" | "certificates"

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "in_progress" | "completed" | "not_started"
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "progress" | "name" | "duration"

  // Goals State
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDailyMinutes, setGoalDailyMinutes] = useState(30);
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [issuingCertificateId, setIssuingCertificateId] = useState("");

  // Modal State for Import/Create Playlist
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("import"); // "import" | "create"
  const [importInput, setImportInput] = useState("");
  const [importName, setImportName] = useState("");
  const [createNameInput, setCreateNameInput] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedTrackId, setExpandedTrackId] = useState(null);

  // Live YouTube Course Discovery State
  const [ytSearchResults, setYtSearchResults] = useState([]);
  const [searchingYt, setSearchingYt] = useState(false);
  const [importingYtId, setImportingYtId] = useState(null);

  // Dynamic Suggested Courses (refreshes on every load / interaction)
  const [suggestedCourses, setSuggestedCourses] = useState(() => getRandomSuggestedCourses(4));
  const [isRefreshingSuggested, setIsRefreshingSuggested] = useState(false);

  const handleRefreshSuggested = () => {
    setIsRefreshingSuggested(true);
    const currentIds = suggestedCourses.map((c) => c.id);
    const fresh = getRandomSuggestedCourses(4, currentIds);
    setSuggestedCourses(fresh);
    setTimeout(() => setIsRefreshingSuggested(false), 300);
  };

  useEffect(() => {
    loadPage();
    setSuggestedCourses(getRandomSuggestedCourses(4));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setYtSearchResults([]);
      setSearchingYt(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingYt(true);
        const res = await searchVideos(searchQuery.trim(), "playlist");
        if (res && res.items) {
          setYtSearchResults(res.items.slice(0, 4));
        } else {
          setYtSearchResults([]);
        }
      } catch (err) {
        console.error("YouTube search error:", err);
        setYtSearchResults([]);
      } finally {
        setSearchingYt(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleQuickImportCourse = async (playlistId, name = "") => {
    if (!playlistId) return;
    try {
      setImportingYtId(playlistId);
      await importYouTubePlaylist({ playlistId, name });
      await loadPage();
    } catch (err) {
      console.error("Quick import course error:", err);
    } finally {
      setImportingYtId(null);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setGoalsLoading(true);
      setCertificatesLoading(true);

      const [playlistsRes, progressRes, analyticsRes, goalsRes, certificatesRes, streakRes] =
        await Promise.all([
          getPlaylists(),
          getAllProgress(),
          getDashboardAnalytics(),
          getStudyGoals(),
          getCertificates(),
          getStreak(),
        ]);

      setPlaylists(playlistsRes?.playlists || []);
      setProgressItems(progressRes?.progress || []);
      setDashboardStats({
        ...(analyticsRes?.stats || {}),
        currentStreak: streakRes?.currentStreak || 0,
      });
      setGoals(goalsRes?.goals || []);
      setCertificates(certificatesRes?.certificates || []);
      setQuizAttempts(getLocalQuizAttempts());
    } catch (error) {
      console.error("Playlists page load error:", error);
      setPlaylists([]);
      setProgressItems([]);
      setDashboardStats({});
      setGoals([]);
      setCertificates([]);
      setQuizAttempts(getLocalQuizAttempts());
    } finally {
      setLoading(false);
      setGoalsLoading(false);
      setCertificatesLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e?.preventDefault();
    if (!goalTitle.trim()) return;

    try {
      setGoalSaving(true);
      await createStudyGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        youtubeIds: [],
        targetDate: goalTargetDate || null,
        dailyMinutes: Math.max(1, Number(goalDailyMinutes) || 30),
      });

      setGoalTitle("");
      setGoalDescription("");
      setGoalDailyMinutes(30);
      setGoalTargetDate("");

      await loadPage();
    } catch (error) {
      console.error("Create goal error:", error);
    } finally {
      setGoalSaving(false);
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      await updateStudyGoal(goalId, { status: "completed" });
      await loadPage();
    } catch (error) {
      console.error("Complete goal error:", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteStudyGoal(goalId);
      await loadPage();
    } catch (error) {
      console.error("Delete goal error:", error);
    }
  };

  // Confirm Modal State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    playlistId: null,
    title: "",
    message: "",
    loading: false,
  });

  const promptDeletePlaylist = (playlistId, playlistName, e) => {
    e?.stopPropagation();
    setActiveMenuId(null);
    setConfirmModalState({
      isOpen: true,
      playlistId,
      title: "Delete Learning Track?",
      message: `Are you sure you want to delete "${playlistName || "this learning track"}"? All saved progress for this track will be removed.`,
      loading: false,
    });
  };

  const handleConfirmDeletePlaylist = async () => {
    if (!confirmModalState.playlistId) return;

    try {
      setConfirmModalState((prev) => ({ ...prev, loading: true }));
      await deletePlaylist(confirmModalState.playlistId);
      setConfirmModalState({
        isOpen: false,
        playlistId: null,
        title: "",
        message: "",
        loading: false,
      });
      await loadPage();
    } catch (error) {
      console.error("Delete playlist error:", error);
      setConfirmModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleModalSubmit = async (e) => {
    e?.preventDefault();
    setModalError("");

    if (modalMode === "import") {
      const extractedId = extractPlaylistId(importInput);
      if (!extractedId) {
        setModalError("Please enter a valid YouTube Playlist URL or ID.");
        return;
      }

      try {
        setModalSubmitting(true);
        await importYouTubePlaylist(extractedId, importName.trim() || undefined);
        setImportInput("");
        setImportName("");
        setIsModalOpen(false);
        await loadPage();
      } catch (err) {
        console.error("Import error:", err);
        setModalError(
          err?.response?.data?.error || "Failed to import YouTube playlist. Verify the URL or ID."
        );
      } finally {
        setModalSubmitting(false);
      }
    } else {
      if (!createNameInput.trim()) {
        setModalError("Please enter a track name.");
        return;
      }

      try {
        setModalSubmitting(true);
        await createPlaylist(createNameInput.trim());
        setCreateNameInput("");
        setIsModalOpen(false);
        await loadPage();
      } catch (err) {
        console.error("Create error:", err);
        setModalError(err?.response?.data?.error || "Failed to create playlist.");
      } finally {
        setModalSubmitting(false);
      }
    }
  };

  const progressMap = useMemo(() => {
    const map = new Map();
    for (const item of progressItems) {
      map.set(item.videoId, item);
    }
    return map;
  }, [progressItems]);

function resolvePlaylistName(playlist) {
  if (!playlist) return "Learning Track";
  const rawName = typeof playlist.name === "string" ? playlist.name.trim() : "";

  const isGeneric =
    !rawName ||
    rawName === "Imported Playlist" ||
    rawName === "Selected Playlist" ||
    rawName === "Untitled Playlist" ||
    rawName.startsWith("Playlist ") ||
    rawName === playlist._id;

  if (!isGeneric) return rawName;

  const firstVideoTitle = playlist.videos && playlist.videos[0] ? playlist.videos[0].title : "";
  if (
    firstVideoTitle &&
    !firstVideoTitle.startsWith("Video ") &&
    firstVideoTitle !== "Selected Video"
  ) {
    const cleaned = firstVideoTitle.split(/[-|:|#]/)[0].trim();
    if (cleaned && cleaned.length > 2) {
      return `${cleaned} Track`;
    }
    return `${firstVideoTitle} Track`;
  }

  if (playlist.sourcePlaylistId) {
    return `YouTube Course (${playlist.sourcePlaylistId.slice(0, 6)})`;
  }

  return "Custom Learning Track";
}

  const playlistTrackers = useMemo(() => {
    return playlists.map((playlist) => {
      const videos = playlist?.videos || [];
      const videoIds = videos.map((video) => video.videoId);

      const linkedProgress = videos
        .map((video) => progressMap.get(video.videoId))
        .filter(Boolean);

      const completedVideos = linkedProgress.filter((item) => item.completed).length;
      const totalVideos = videos.length;
      const completionPercent = totalVideos
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

      const totalWatchTimeSec = linkedProgress.reduce(
        (sum, item) => sum + (item.watchTimeSec || 0),
        0
      );

      const relatedQuizAttempts = quizAttempts.filter((attempt) =>
        videoIds.includes(attempt?.youtubeId)
      );

      const weakTopics = deriveWeakTopics(relatedQuizAttempts);

      const nextVideo =
        videos.find((video) => !progressMap.get(video.videoId)?.completed) ||
        videos[0] ||
        null;

      const lastWatchedAt = linkedProgress
        .map((item) => item?.lastWatchedAt || item?.updatedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      const firstThumbnail = videos[0]?.thumbnail || null;
      const displayName = resolvePlaylistName(playlist);

      return {
        _id: playlist._id,
        name: displayName,
        totalVideos,
        completedVideos,
        remainingVideos: Math.max(0, totalVideos - completedVideos),
        completionPercent,
        totalWatchTimeSec,
        nextVideo,
        weakTopics,
        firstThumbnail,
        quizAttemptsCount: relatedQuizAttempts.length,
        isCompleted: totalVideos > 0 && completedVideos === totalVideos,
        isInProgress: totalWatchTimeSec > 0 && completedVideos < totalVideos,
        isNotStarted: completedVideos === 0 && totalWatchTimeSec === 0,
        lastWatchedAt,
      };
    });
  }, [playlists, progressMap, quizAttempts]);

  const filteredTrackers = useMemo(() => {
    return playlistTrackers.filter((track) => {
      const matchesSearch = track.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (filterStatus === "in_progress") return track.isInProgress;
      if (filterStatus === "completed") return track.isCompleted;
      if (filterStatus === "not_started") return track.isNotStarted;

      return true;
    });
  }, [playlistTrackers, searchQuery, filterStatus]);

  const sortedAndFilteredTrackers = useMemo(() => {
    const list = [...filteredTrackers];
    if (sortBy === "progress") {
      return list.sort((a, b) => b.completionPercent - a.completionPercent);
    }
    if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "duration") {
      return list.sort((a, b) => b.totalWatchTimeSec - a.totalWatchTimeSec);
    }
    // Default "recent"
    return list.sort(
      (a, b) => new Date(b.lastWatchedAt || 0) - new Date(a.lastWatchedAt || 0)
    );
  }, [filteredTrackers, sortBy]);

  const overall = useMemo(() => {
    const totalPlaylists = playlistTrackers.length;
    const completedPlaylists = playlistTrackers.filter((p) => p.isCompleted).length;
    const inProgressPlaylists = playlistTrackers.filter((p) => p.isInProgress).length;
    const certificateEligible = playlistTrackers.filter((p) => p.isCompleted).length;
    const streakDays = dashboardStats?.currentStreak || 0;

    return {
      totalPlaylists,
      completedPlaylists,
      inProgressPlaylists,
      certificateEligible,
      streakDays,
    };
  }, [playlistTrackers, dashboardStats]);

  const earnedBadges = useMemo(() => {
    const badges = [];

    if (overall.totalPlaylists >= 1) {
      badges.push({
        title: "Track Pioneer",
        desc: "Created or imported your first learning track",
        icon: ListVideo,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Track Pioneer",
        desc: "Create or import your first learning track",
        icon: ListVideo,
        unlocked: false,
      });
    }

    if ((dashboardStats?.totalWatchTimeSec || 0) >= 1800) {
      badges.push({
        title: "Focused Learner",
        desc: "Watched at least 30 minutes of educational content",
        icon: Clock3,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Focused Learner",
        desc: "Watch 30 minutes of content to unlock",
        icon: Clock3,
        unlocked: false,
      });
    }

    if ((dashboardStats?.completedVideos || 0) >= 3) {
      badges.push({
        title: "Video Finisher",
        desc: "Completed 3 or more lessons",
        icon: CheckCircle2,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Video Finisher",
        desc: "Complete 3 lessons to unlock",
        icon: CheckCircle2,
        unlocked: false,
      });
    }

    if (quizAttempts.length >= 3) {
      badges.push({
        title: "Quiz Explorer",
        desc: "Attempted multiple AI quizzes",
        icon: Zap,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Quiz Explorer",
        desc: "Attempt 3 AI quizzes to unlock",
        icon: Zap,
        unlocked: false,
      });
    }

    if (overall.streakDays >= 3) {
      badges.push({
        title: "Streak Master",
        desc: `Maintained a ${overall.streakDays}-day learning streak`,
        icon: Flame,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Streak Master",
        desc: "Reach a 3-day streak to unlock",
        icon: Flame,
        unlocked: false,
      });
    }

    if (overall.completedPlaylists >= 1) {
      badges.push({
        title: "Course Graduate",
        desc: "Completed an entire learning track",
        icon: Trophy,
        unlocked: true,
      });
    } else {
      badges.push({
        title: "Course Graduate",
        desc: "Complete 1 full playlist to unlock",
        icon: Trophy,
        unlocked: false,
      });
    }

    return badges;
  }, [overall, dashboardStats, quizAttempts]);

  const topWeakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts).slice(0, 5);
  }, [quizAttempts]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  }, [goals]);

  const getCertificateForPlaylist = (playlist) => {
    return (
      certificates.find(
        (cert) =>
          cert?.type === "platform" &&
          (cert?.metadata?.playlistId === playlist._id ||
            cert?.courseName === playlist.name)
      ) || null
    );
  };

  const handleIssueCertificate = async (playlist, e) => {
    e?.stopPropagation();
    try {
      setIssuingCertificateId(playlist._id);

      const existing = getCertificateForPlaylist(playlist);
      if (existing) return;

      await createCertificate({
        title: `${playlist.name} Completion Certificate`,
        platform: "Interactive Learning Platform",
        type: "platform",
        courseName: playlist.name,
        issuedBy: "Interactive Learning Platform",
        completionDate: new Date().toISOString(),
        metadata: {
          playlistId: playlist._id,
          playlistName: playlist.name,
        },
      });

      await loadPage();
    } catch (error) {
      console.error("Issue certificate error:", error);
    } finally {
      setIssuingCertificateId("");
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      await deleteCertificate(certificateId);
      await loadPage();
    } catch (error) {
      console.error("Delete certificate error:", error);
    }
  };

  const copyCertificateId = async (certificateId) => {
    try {
      await navigator.clipboard.writeText(certificateId);
      setCopiedId(certificateId);
      setTimeout(() => setCopiedId(""), 2000);
    } catch (error) {
      console.error("Copy certificate id error:", error);
    }
  };

  const handleOpenTrack = (track) => {
    setExpandedTrackId((prev) => (prev === track._id ? null : track._id));
  };

  const handleNavigateTrack = (track) => {
    if (track.nextVideo?.videoId) {
      navigate(`/workspace/${track.nextVideo.videoId}`);
    } else {
      navigate(`/workspace?playlistId=${track._id}`);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white pb-12 bg-gray-50/50 dark:bg-gray-950/20">
      <div className="section-container py-6 md:py-8 space-y-6">
        
        {/* 1. HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-100/80 dark:border-gray-800 bg-gradient-to-r from-blue-50/60 via-purple-50/30 to-white dark:from-blue-950/20 dark:via-purple-950/10 dark:to-gray-900 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-gray-900 dark:text-white">
              Learning Tracks & Playlists
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Organize your learning tracks, track course completion, and achieve your study targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition"
            >
              <Plus size={16} />
              <span>Create / Import Track</span>
            </button>

            <button
              onClick={loadPage}
              title="Refresh Tracks"
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <RotateCw size={15} className={loading ? "animate-spin" : ""} />
            </button>

            <ThemeToggle />
          </div>
        </motion.div>

        {/* 2. STATISTICS (4 Stat Cards) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:shadow transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ListVideo size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Tracks
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : overall.totalPlaylists}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:shadow transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : overall.completedPlaylists}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:shadow transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Active Streak
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : `${overall.streakDays} Days`}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:shadow transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Certificates
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {loading ? "--" : certificates.length}
              </p>
            </div>
          </motion.div>
        </div>

        {/* 3. NAVIGATION (Clean Pill-Style Tabs) */}
        <div className="flex border-b border-gray-200/80 dark:border-gray-800 overflow-x-auto gap-2 pb-1 scrollbar-none">
          {[
            { id: "tracks", label: "My Tracks", count: playlistTrackers.length, icon: ListVideo },
            { id: "goals", label: "Study Goals", count: sortedGoals.length, icon: Target },
            { id: "badges", label: "Badges", count: earnedBadges.filter((b) => b.unlocked).length, icon: Trophy },
            { id: "certificates", label: "Certificates & Review", count: certificates.length, icon: BookOpenCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-4 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY TRACKS */}
        {activeTab === "tracks" && (
          <div className="space-y-5">
            
            {/* 4. SEARCH AND FILTERS TOOLBAR */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search tracks by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: "all", label: "All Tracks" },
                  { id: "in_progress", label: "In Progress" },
                  { id: "completed", label: "Completed" },
                  { id: "not_started", label: "Not Started" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setFilterStatus(pill.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                      filterStatus === pill.id
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                        : "border border-gray-200/80 dark:border-gray-700/80 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-3">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="recent">Recently Active</option>
                  <option value="progress">Completion %</option>
                  <option value="name">Name A-Z</option>
                  <option value="duration">Total Duration</option>
                </select>
              </div>
            </div>

            {/* ── RELEVANT YOUTUBE COURSES UNDER SEARCH ── */}
            <div className="bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-indigo-900/10 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    ▶
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        {searchQuery ? `YouTube Courses matching "${searchQuery}"` : "Discover Relevant YouTube Courses"}
                        <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.2 text-[10px] font-semibold">
                          {searchingYt ? "Searching..." : searchQuery ? `${ytSearchResults.length} found` : "Popular"}
                        </span>
                      </h3>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={handleRefreshSuggested}
                          disabled={isRefreshingSuggested}
                          className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition active:scale-95 disabled:opacity-60"
                          title="Refresh suggestions"
                        >
                          <RotateCw size={11} className={isRefreshingSuggested ? "animate-spin text-blue-500" : "text-muted"} />
                          <span>Refresh</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!searchQuery && (
                  <button
                    onClick={() => {
                      setModalMode("import");
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition flex items-center gap-1"
                  >
                    <span>Import Custom URL</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Course Cards Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {searchQuery ? (
                  searchingYt ? (
                    <div className="col-span-full py-6 text-center text-xs text-gray-500 animate-pulse">
                      Searching YouTube for educational playlists...
                    </div>
                  ) : ytSearchResults.length ? (
                    ytSearchResults.map((course) => (
                      <div
                        key={course.id?.playlistId || course.id?.videoId || course.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-blue-300 transition"
                      >
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2">
                            {course.snippet?.title || "YouTube Course"}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                            By {course.snippet?.channelTitle || "Educational Creator"}
                          </p>
                        </div>
                        <button
                          disabled={importingYtId === (course.id?.playlistId || course.id)}
                          onClick={() =>
                            handleQuickImportCourse(
                              course.id?.playlistId || course.id,
                              course.snippet?.title
                            )
                          }
                          className="w-full flex items-center justify-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-600 py-1.5 text-[11px] font-semibold text-white transition disabled:opacity-50"
                        >
                          <Plus size={12} />
                          <span>
                            {importingYtId === (course.id?.playlistId || course.id)
                              ? "Importing..."
                              : "Import Track"}
                          </span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-center text-xs text-gray-500">
                      No matching YouTube courses found for "{searchQuery}". Try a broader term like "React", "Python", or "DSA".
                    </div>
                  )
                ) : (
                  suggestedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-orange-300 dark:hover:border-orange-500/40 transition shadow-xs group"
                    >
                      <div className="space-y-1">
                        <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${course.badgeBg}`}>
                          {course.tag}
                        </span>
                        <p className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 group-hover:text-orange-500 transition">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {course.channel}
                        </p>
                      </div>
                      <button
                        disabled={importingYtId === course.id}
                        onClick={() => handleQuickImportCourse(course.id, course.title)}
                        className="w-full flex items-center justify-center gap-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white py-1.5 text-[11px] font-semibold transition disabled:opacity-50"
                      >
                        <Plus size={12} />
                        <span>
                          {importingYtId === course.id ? "Importing..." : "Add to My Tracks"}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. TRACK CARDS GRID */}
            {sortedAndFilteredTrackers.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {sortedAndFilteredTrackers.map((track) => {
                  const isNotStarted = track.isNotStarted;
                  const isCompleted = track.isCompleted;

                  return (
                    <motion.div
                      key={track._id}
                      whileHover={{ y: -2 }}
                      onClick={() => handleOpenTrack(track)}
                      layout
                      className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 group flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden ${
                        isNotStarted
                          ? "border-gray-200/60 dark:border-gray-800/60 opacity-90 hover:border-gray-300 dark:hover:border-gray-700"
                          : "border-gray-200/80 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Top Row: Thumbnail + Title + Status + Three Dot */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Thumbnail or Subject Icon */}
                            {track.firstThumbnail ? (
                              <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0 bg-gray-100 dark:bg-gray-800">
                                <img
                                  src={track.firstThumbnail}
                                  alt={track.name}
                                  className="w-full h-full object-cover transition group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <PlayCircle size={20} className="text-white drop-shadow" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                                <ListVideo size={18} />
                              </div>
                            )}

                            {/* Title & Metadata */}
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                                {track.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {track.totalVideos} videos · {formatDuration(track.totalWatchTimeSec)}
                              </p>
                            </div>
                          </div>

                          {/* Soft Pastel Status Badge & Menu */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                                  : track.isInProgress
                                  ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
                                  : "bg-gray-100 text-gray-600 border-gray-200/60 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/40"
                              }`}
                            >
                              {isCompleted
                                ? "Completed"
                                : track.isInProgress
                                ? "In Progress"
                                : "Not Started"}
                            </span>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === track._id ? null : track._id);
                                }}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeMenuId === track._id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-7 z-20 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 text-xs space-y-1"
                                >
                                  {isCompleted && !getCertificateForPlaylist(track) ? (
                                    <button
                                      onClick={(e) => handleIssueCertificate(track, e)}
                                      className="w-full text-left px-3 py-1.5 font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-1.5"
                                    >
                                      <Award size={13} />
                                      <span>Certificate</span>
                                    </button>
                                  ) : null}

                                  <button
                                    onClick={(e) => promptDeletePlaylist(track._id, track.name, e)}
                                    className="w-full text-left px-3 py-1.5 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1.5"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete Track</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 6. PROGRESS SECTION */}
                        <div className="space-y-1.5 my-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                              {track.completedVideos} of {track.totalVideos} lessons completed · {track.remainingVideos} videos remaining
                            </span>
                            <span className={`font-bold ${isNotStarted ? "text-gray-400" : "text-blue-600 dark:text-blue-400"}`}>
                              {track.completionPercent}%
                            </span>
                          </div>
                          
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isNotStarted
                                  ? "bg-gray-300 dark:bg-gray-700"
                                  : isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              }`}
                              style={{ width: `${track.completionPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Weak Topics Tag (If any) */}
                        {track.weakTopics.length ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {track.weakTopics.slice(0, 2).map((t) => (
                              <span
                                key={t.topic}
                                className="rounded-md bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-300"
                              >
                                Revise: {t.topic}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateTrack(track);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold px-3.5 py-1.5 transition active:scale-95 ${
                            isNotStarted
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25"
                          }`}
                        >
                          <PlayCircle size={14} />
                          <span>
                            {isCompleted
                              ? "Review Track"
                              : track.isInProgress
                              ? "Resume Track"
                              : "Start Track"}
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTrack(track);
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                        >
                          <BarChart3 size={13} />
                          <span>{expandedTrackId === track._id ? "Hide Details" : "Track Insights"}</span>
                          <ChevronRight size={14} className={`transition-transform ${expandedTrackId === track._id ? "rotate-90" : ""}`} />
                        </button>
                      </div>
                      {/* ── Expanded Track Insights Panel ── */}
                      <AnimatePresence>
                        {expandedTrackId === track._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                              {/* Insights Stats Row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-2.5 text-center">
                                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{track.totalVideos}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Total Videos</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-2.5 text-center">
                                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{track.completedVideos}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-2.5 text-center">
                                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatDuration(track.totalWatchTimeSec)}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Watch Time</p>
                                </div>
                                <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 p-2.5 text-center">
                                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{track.quizAttemptsCount}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Quiz Attempts</p>
                                </div>
                              </div>

                              {/* Weak Topics */}
                              {track.weakTopics.length > 0 && (
                                <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3">
                                  <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <AlertTriangle size={11} />
                                    Topics Needing Revision
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {track.weakTopics.map((t) => (
                                      <span
                                        key={t.topic}
                                        className="rounded-md bg-white dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300"
                                      >
                                        {t.topic} ({t.mistakes})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Video List */}
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Video Lessons</p>
                                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                                  {(playlists.find((p) => p._id === track._id)?.videos || []).map((video, vIdx) => {
                                    const prog = progressMap.get(video.videoId);
                                    const isDone = prog?.completed;
                                    const watchPct = prog
                                      ? Math.min(100, Math.round(((prog.lastPositionSec || 0) / Math.max(1, prog.durationSec || 1)) * 100))
                                      : 0;

                                    return (
                                      <div
                                        key={video.videoId}
                                        onClick={() => navigate(`/workspace/${video.videoId}`)}
                                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition border ${
                                          isDone
                                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                                            : watchPct > 0
                                            ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
                                            : "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800"
                                        } hover:border-blue-300 dark:hover:border-blue-600/40`}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                          isDone
                                            ? "bg-emerald-500 text-white"
                                            : watchPct > 0
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        }`}>
                                          {isDone ? "✓" : vIdx + 1}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {video.title || `Video ${video.videoId?.slice(0, 8)}`}
                                          </p>
                                        </div>

                                        <span className={`text-[10px] font-semibold shrink-0 ${
                                          isDone ? "text-emerald-600 dark:text-emerald-400" : watchPct > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                                        }`}>
                                          {isDone ? "100%" : watchPct > 0 ? `${watchPct}%` : "—"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <ListVideo size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">No Tracks Found</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {searchQuery
                      ? `No tracks matching "${searchQuery}". Try clearing your search filters.`
                      : "Create your first learning track or import a YouTube playlist to begin studying."}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition"
                >
                  <Plus size={15} />
                  <span>Create / Import Track</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDY GOALS */}
        {activeTab === "goals" && (
          <div className="space-y-5">
            {/* Create Goal — Compact Inline Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Create New Goal</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Set daily study targets to stay on track</p>
                </div>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Goal title (e.g. Complete React Course)"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                  />
                  <input
                    type="text"
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                  />
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Daily Minutes</label>
                    <input
                      type="number"
                      min="1"
                      value={goalDailyMinutes}
                      onChange={(e) => setGoalDailyMinutes(Math.max(1, Number(e.target.value) || 30))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Target Date</label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={goalSaving || !goalTitle.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                  >
                    <Plus size={14} />
                    <span>{goalSaving ? "Saving..." : "Add Goal"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Goals List Header */}
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                Your Goals
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400">{sortedGoals.length}</span>
              </h3>
              {sortedGoals.length > 0 && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {sortedGoals.filter((g) => g.status === "completed").length} of {sortedGoals.length} completed
                </span>
              )}
            </div>

            {/* Goals Grid */}
            {goalsLoading ? (
              <div className="text-center py-10">
                <p className="text-xs text-gray-500 animate-pulse">Loading goals...</p>
              </div>
            ) : sortedGoals.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedGoals.map((goal) => {
                  const completed = goal.status === "completed";
                  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
                  const daysLeft = targetDate ? Math.max(0, Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24))) : null;
                  const isOverdue = targetDate && daysLeft === 0 && !completed;

                  return (
                    <motion.div
                      key={goal._id}
                      whileHover={{ y: -2 }}
                      className={`relative rounded-2xl border p-4 transition-all shadow-xs group ${
                        completed
                          ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                          : "border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-600/40 hover:shadow-md"
                      }`}
                    >
                      {/* Top Row: Status + Actions */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            completed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : isOverdue
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          }`}
                        >
                          {completed ? (
                            <><CheckCircle2 size={10} /> Completed</>
                          ) : isOverdue ? (
                            <><AlertTriangle size={10} /> Overdue</>
                          ) : (
                            <><Flame size={10} /> Active</>
                          )}
                        </span>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          {!completed && (
                            <button
                              onClick={() => handleCompleteGoal(goal._id)}
                              title="Mark Completed"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGoal(goal._id)}
                            title="Delete Goal"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className={`font-bold text-sm text-gray-900 dark:text-white leading-snug ${completed ? "line-through opacity-60" : ""}`}>
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{goal.description}</p>
                      )}

                      {/* Tags Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                          <Clock3 size={10} />
                          {goal.dailyMinutes || 30} min/day
                        </span>

                        {targetDate && (
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                            completed
                              ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : daysLeft <= 3
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}>
                            <CalendarDays size={10} />
                            {completed
                              ? "Done"
                              : daysLeft === 0
                              ? "Due today"
                              : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">No Goals Yet</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create your first study goal above to stay motivated and on track.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BADGES */}
        {activeTab === "badges" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Badges & Unlocks</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Earn badges as you complete playlists and maintain streaks</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon || Trophy;
                return (
                  <div
                    key={badge.title}
                    className={`rounded-2xl border p-4 flex items-start gap-3.5 transition ${
                      badge.unlocked
                        ? "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                        : "border-gray-200/60 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        badge.unlocked
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                          {badge.title}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-semibold ${
                            badge.unlocked
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {badge.unlocked ? "Unlocked" : "Locked"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CERTIFICATES & WEAK TOPICS */}
        {activeTab === "certificates" && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Certificates Module */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
                    <BookOpenCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Course Certificates</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Issued on 100% course completion</p>
                  </div>
                </div>

                <span className="rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 px-2.5 py-0.5 text-xs font-semibold">
                  {certificates.length} Issued
                </span>
              </div>

              {certificatesLoading ? (
                <p className="text-xs text-gray-500 text-center py-6">Loading certificates...</p>
              ) : certificates.length ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert._id}
                      className="rounded-xl border border-purple-200/60 bg-purple-50/30 dark:border-purple-900/40 dark:bg-purple-950/20 p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white">
                            {cert.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {cert.courseName || cert.platform}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyCertificateId(cert.certificateId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                          >
                            <Copy size={12} />
                            <span>{copiedId === cert.certificateId ? "Copied!" : "ID"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCertificate(cert._id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-purple-100 dark:border-purple-950">
                        <span className="font-mono">{cert.certificateId}</span>
                        <span>
                          {cert.completionDate
                            ? new Date(cert.completionDate).toLocaleDateString()
                            : "Verified"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <BookOpenCheck className="mx-auto text-gray-400" size={28} />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    No certificates issued yet. Complete 100% of any track to unlock your verified certificate!
                  </p>
                </div>
              )}
            </div>

            {/* Overall Weak Topics Module */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Weak Topics Insights</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Concepts requiring revision based on quiz history</p>
                  </div>
                </div>
              </div>

              {topWeakTopics.length ? (
                <div className="space-y-3">
                  {topWeakTopics.map((item) => (
                    <div
                      key={item.topic}
                      className="flex items-center justify-between rounded-xl border border-rose-200/60 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={14} className="text-rose-500" />
                        <div>
                          <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white">
                            {item.topic}
                          </h4>
                          <p className="text-[11px] text-gray-500">Recommended for workspace review</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 px-2.5 py-0.5 text-xs font-semibold">
                        {item.mistakes} mistakes
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Sparkles className="mx-auto text-gray-400" size={28} />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    No weak topic insights detected yet. Take AI quizzes in the workspace to generate personalized concept recommendations!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE / IMPORT TRACK MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-xl relative space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                    <FolderPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Add Learning Track</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Import YouTube playlist or create custom track</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                <button
                  onClick={() => setModalMode("import")}
                  className={`py-1.5 rounded-lg transition ${
                    modalMode === "import"
                      ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Import YouTube Playlist
                </button>
                <button
                  onClick={() => setModalMode("create")}
                  className={`py-1.5 rounded-lg transition ${
                    modalMode === "create"
                      ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Create Custom Track
                </button>
              </div>

              {/* Error Alert */}
              {modalError ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 font-medium">
                  {modalError}
                </div>
              ) : null}

              {/* Modal Form */}
              <form onSubmit={handleModalSubmit} className="space-y-3.5">
                {modalMode === "import" ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        YouTube Playlist URL or ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={importInput}
                        onChange={(e) => setImportInput(e.target.value)}
                        placeholder="https://www.youtube.com/playlist?list=PL123... or PL123..."
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-xs md:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Custom Track Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Leave blank to use original YouTube title"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-xs md:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Track / Playlist Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createNameInput}
                      onChange={(e) => setCreateNameInput(e.target.value)}
                      placeholder="e.g. Fullstack Web Development 2026"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-xs md:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {modalSubmitting ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>{modalMode === "import" ? "Import Track" : "Create Track"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, playlistId: null, title: "", message: "", loading: false })}
        onConfirm={handleConfirmDeletePlaylist}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText="Delete Track"
        cancelText="Cancel"
        variant="danger"
        loading={confirmModalState.loading}
      />
    </div>
  );
}
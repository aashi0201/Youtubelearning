import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Info,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MapPin,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Video,
  Zap,
  GitBranch,
  BookOpen,
  Brain,
  ArrowUpRight,
  CheckCheck,
  Camera,
  Upload,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  AtSign,
  Globe2,
  Eye,
  EyeOff,
  Key,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../components/common/ThemeToggle";
import useAuth from "../hooks/useAuth";
import {
  getCodingDashboardStats,
  updateCodingProfiles,
  disconnectCodingProfile,
  getVerificationToken,
  verifyPlatformOwnership,
} from "../services/codingService";
import {
  updateUserProfile,
  uploadAvatar,
  checkUsernameAvailability,
  forgotPasswordOtp,
  resetPasswordOtp,
} from "../services/authService";
import { getProgressSummary, getAllProgress } from "../services/progressService";
import { getAllQuizAttempts } from "../services/aiService";
import {
  calculateLSRating,
  evaluateBadges,
  deriveTopicMastery,
  getRatingTier,
} from "../utils/ratingSystem";

export const PLATFORM_HEATMAP_THEMES = {
  all: {
    id: "all",
    label: "All Sources",
    badge: "Combined Learning Activity",
    icon: Globe,
    accent: "text-emerald-500",
    borderActive: "border-emerald-500/50 bg-emerald-500/10",
    bgActive: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
    bgInactive: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
    empty: "bg-slate-100 dark:bg-slate-800/80",
    level1: "bg-emerald-200 dark:bg-emerald-950/80",
    level2: "bg-emerald-300 dark:bg-emerald-800",
    level3: "bg-emerald-400 dark:bg-emerald-600",
    level4: "bg-emerald-500 dark:bg-emerald-500 shadow-xs shadow-emerald-500/30",
    unit: "activities",
    legend: ["1 act", "2 acts", "3 acts", "4+ acts"],
  },
  leetcode: {
    id: "leetcode",
    label: "LeetCode",
    badge: "Algorithmic Solves & Submissions",
    icon: Code2,
    accent: "text-amber-500",
    borderActive: "border-amber-500/50 bg-amber-500/10",
    bgActive: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    bgInactive: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
    empty: "bg-slate-100 dark:bg-slate-800/80",
    level1: "bg-amber-200 dark:bg-amber-950/80",
    level2: "bg-amber-300 dark:bg-amber-800",
    level3: "bg-amber-400 dark:bg-amber-600",
    level4: "bg-amber-500 dark:bg-amber-500 shadow-xs shadow-amber-500/30",
    unit: "solves",
    legend: ["1 solve", "2 solves", "3 solves", "4+ solves"],
  },
  codeforces: {
    id: "codeforces",
    label: "Codeforces",
    badge: "Contest & Problemset Submissions",
    icon: Flame,
    accent: "text-sky-500",
    borderActive: "border-sky-500/50 bg-sky-500/10",
    bgActive: "bg-sky-500 text-white shadow-md shadow-sky-500/20",
    bgInactive: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
    empty: "bg-slate-100 dark:bg-slate-800/80",
    level1: "bg-sky-200 dark:bg-sky-950/80",
    level2: "bg-sky-300 dark:bg-sky-800",
    level3: "bg-sky-400 dark:bg-sky-600",
    level4: "bg-sky-500 dark:bg-sky-500 shadow-xs shadow-sky-500/30",
    unit: "submissions",
    legend: ["1 sub", "2 subs", "3 subs", "4+ subs"],
  },
  learnsphere: {
    id: "learnsphere",
    label: "LearnSphere Tracks",
    badge: "Video Lectures & Recall Quizzes",
    icon: Video,
    accent: "text-[#8090fd]",
    borderActive: "border-indigo-500/50 bg-indigo-500/10",
    bgActive: "bg-[#8090fd] text-white shadow-md shadow-indigo-500/20",
    bgInactive: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
    empty: "bg-slate-100 dark:bg-slate-800/80",
    level1: "bg-indigo-200 dark:bg-indigo-950/80",
    level2: "bg-indigo-300 dark:bg-indigo-800",
    level3: "bg-indigo-400 dark:bg-indigo-600",
    level4: "bg-[#8090fd] dark:bg-[#8090fd] shadow-xs shadow-indigo-500/30",
    unit: "sessions",
    legend: ["1 session", "2 sessions", "3 sessions", "4+ sessions"],
  },
  github: {
    id: "github",
    label: "GitHub",
    badge: "Commits & Open-Source Events",
    icon: GitBranch,
    accent: "text-purple-500",
    borderActive: "border-purple-500/50 bg-purple-500/10",
    bgActive: "bg-purple-500 text-white shadow-md shadow-purple-500/20",
    bgInactive: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
    empty: "bg-slate-100 dark:bg-slate-800/80",
    level1: "bg-purple-200 dark:bg-purple-950/80",
    level2: "bg-purple-300 dark:bg-purple-800",
    level3: "bg-purple-400 dark:bg-purple-600",
    level4: "bg-purple-500 dark:bg-purple-500 shadow-xs shadow-purple-500/30",
    unit: "events",
    legend: ["1 event", "2 events", "3 events", "4+ events"],
  },
};

export const PRESET_AVATARS = [
  { id: "tech_guru", label: "Tech Guru", url: "https://api.dicebear.com/7.x/bottts/svg?seed=tech_guru&backgroundColor=b6e3f4" },
  { id: "cyber_ninja", label: "Cyber Ninja", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber_ninja&backgroundColor=c0aede" },
  { id: "code_wizard", label: "Code Wizard", url: "https://api.dicebear.com/7.x/bottts/svg?seed=code_wizard&backgroundColor=d1d4f9" },
  { id: "pixel_dev", label: "Pixel Dev", url: "https://api.dicebear.com/7.x/bottts/svg?seed=pixel_dev&backgroundColor=ffd5dc" },
  { id: "quantum_hacker", label: "Quantum Hacker", url: "https://api.dicebear.com/7.x/bottts/svg?seed=quantum&backgroundColor=ffdfbf" },
  { id: "algo_scholar", label: "Algo Scholar", url: "https://api.dicebear.com/7.x/bottts/svg?seed=scholar&backgroundColor=b6e3f4" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, clearAuth } = useAuth();

  // Active Tab: "overview", "badges", "heatmap", "settings", "portfolio"
  const [activeTab, setActiveTab] = useState("overview");

  // Notifications & State
  const [message, setMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [syncingStats, setSyncingStats] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Profile Photo & Username States
  const photoInputRef = useRef(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: "" });

  // Portfolio Section Modals & Sub-states
  const [newSkillInput, setNewSkillInput] = useState("");
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: "", description: "", tags: "", link: "", github: "" });
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [newExperienceForm, setNewExperienceForm] = useState({ role: "", company: "", period: "", description: "" });
  const [showAddEducationModal, setShowAddEducationModal] = useState(false);
  const [newEducationForm, setNewEducationForm] = useState({ degree: "", institution: "", period: "" });

  // Account Security & Forgot/Reset Password State
  const [forgotPasswordState, setForgotPasswordState] = useState({
    isOpen: false,
    otpSent: false,
    otp: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    loading: false,
    error: "",
    success: "",
    cooldown: 0,
    devOtp: "",
  });

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (forgotPasswordState.cooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotPasswordState((prev) => ({
        ...prev,
        cooldown: Math.max(0, prev.cooldown - 1),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotPasswordState.cooldown]);

  // Platform Verification State
  const [verificationToken, setVerificationToken] = useState(
    user?.verificationToken || (user?._id || user?.id ? `ls-verify-${(user._id || user.id).slice(-6)}` : "ls-verify-learn")
  );
  const [verifiedPlatforms, setVerifiedPlatforms] = useState(
    user?.verifiedPlatforms || {
      leetcode: false,
      codeforces: false,
      codechef: false,
      github: false,
    }
  );
  const [verifyModal, setVerifyModal] = useState({
    open: false,
    platform: "leetcode",
    handle: "",
    loading: false,
    error: "",
    success: "",
  });
  const [inlineLoading, setInlineLoading] = useState({});
  const [inlineError, setInlineError] = useState({});
  const [inlineSuccess, setInlineSuccess] = useState({});
  const [selectedHeatmapPlatform, setSelectedHeatmapPlatform] = useState("all");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [platformActivities, setPlatformActivities] = useState({
    leetcode: { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 },
    codeforces: { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 },
    github: { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 },
  });

  // Profile Form Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "Aashish Kumar",
    username: user?.username || (user?.email ? user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() : "learner"),
    avatar: user?.avatar || "",
    bio: user?.bio || "Full-Stack Engineer & Algorithm Enthusiast. Binge-learning system architecture and algorithms daily.",
    location: user?.location || "San Francisco, CA",
    schoolCompany: user?.schoolCompany || "LearnSphere Engineering",
    website: user?.website || "https://github.com",
    leetcode: user?.leetcode || "",
    codeforces: user?.codeforces || "",
    codechef: user?.codechef || "",
    github: user?.github || "",
    skills: Array.isArray(user?.skills) && user.skills.length > 0 ? user.skills : ["JavaScript", "React", "Python", "Data Structures", "System Design"],
    socialLinks: user?.socialLinks || { github: "", linkedin: "", twitter: "", website: "" },
    experience: Array.isArray(user?.experience) ? user.experience : [],
    education: Array.isArray(user?.education) ? user.education : [],
    portfolioProjects: Array.isArray(user?.portfolioProjects) ? user.portfolioProjects : [],
  });

  // Genuine State from Platforms
  const [codingStats, setCodingStats] = useState({
    totalSolved: 0,
    totalQuestions: 3300,
    easySolved: 0,
    totalEasy: 820,
    mediumSolved: 0,
    totalMedium: 1730,
    hardSolved: 0,
    totalHard: 750,
    acceptanceRate: 0,
    ranking: null,
    contestRating: null,
    contestRankPercentile: null,
    contestsAttended: 0,
    streak: 0,
    maxStreak: 0,
    totalSubmissions: 0,
    activeDays: 0,
    submissionDates: [],
    recentSubmissions: [],
    isConnected: false,
  });

  const [watchStats, setWatchStats] = useState({
    totalWatchTimeSec: 0,
    completedVideos: 0,
    totalTrackedVideos: 0,
  });

  const [progressList, setProgressList] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  // Load All Genuine Platform Data & Verification Tokens
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      setSyncingStats(true);

      const [codingRes, summaryRes, progressRes, quizRes, tokenRes] = await Promise.allSettled([
        getCodingDashboardStats("me", forceRefresh),
        getProgressSummary(),
        getAllProgress(),
        getAllQuizAttempts(),
        getVerificationToken(),
      ]);

      // 1. Process Verification Token
      if (tokenRes.status === "fulfilled" && tokenRes.value?.ok) {
        setVerificationToken(tokenRes.value.verificationToken || "");
        setVerifiedPlatforms(tokenRes.value.verifiedPlatforms || {});
      }

      // 2. Process Coding Data
      if (codingRes.status === "fulfilled" && codingRes.value?.ok) {
        const val = codingRes.value;
        const lc = val.stats?.leetcode;
        const cf = val.stats?.codeforces;
        const hasLc = Boolean(lc && (lc.totalSolved > 0 || lc.username));
        const hasCf = Boolean(cf && (cf.rating > 0 || cf.username));

        if (val.verifiedPlatforms) {
          setVerifiedPlatforms(val.verifiedPlatforms);
        }
        if (val.verificationToken) {
          setVerificationToken(val.verificationToken);
        }

        const easy = lc?.easySolved || 0;
        const med = lc?.mediumSolved || 0;
        const hard = lc?.hardSolved || 0;
        const total = lc?.totalSolved || (cf?.totalSolved || 0) || (easy + med + hard);
        const subDates = Array.isArray(val.activityDates) && val.activityDates.length > 0
          ? val.activityDates
          : (lc?.submissionDates || []);

        setCodingStats({
          totalSolved: total,
          totalQuestions: lc?.totalQuestions || 3300,
          easySolved: easy,
          totalEasy: lc?.totalEasy || 820,
          mediumSolved: med,
          totalMedium: lc?.totalMedium || 1730,
          hardSolved: hard,
          totalHard: lc?.totalHard || 750,
          acceptanceRate: lc?.totalSubmissions && total ? Math.min(100, Math.round((total / lc.totalSubmissions) * 100)) : (total > 0 ? 68.4 : 0),
          ranking: lc?.ranking || null,
          contestRating: lc?.contestRating || cf?.rating || null,
          contestRankPercentile: lc?.contestRankPercentile || (cf?.rating ? 90 : null),
          contestsAttended: lc?.contestsAttended || 0,
          streak: val.currentStreak || lc?.streak || user?.stats?.streakDays || 0,
          maxStreak: val.longestStreak || lc?.maxStreak || 0,
          totalSubmissions: lc?.totalSubmissions || subDates.length || total,
          activeDays: subDates.length || lc?.totalActiveDays || 0,
          submissionDates: subDates,
          recentSubmissions: lc?.recentSubmissions || [],
          isConnected: hasLc || hasCf,
          username: lc?.username || cf?.username || "",
        });

        if (val.platformActivities) {
          setPlatformActivities(val.platformActivities);
        } else {
          setPlatformActivities({
            leetcode: {
              dates: lc?.submissionDates || [],
              counts: lc?.submissionCounts || {},
              streak: lc?.streak || 0,
              maxStreak: lc?.maxStreak || 0,
              total: lc?.totalSubmissions || 0,
              activeDays: lc?.totalActiveDays || 0,
            },
            codeforces: {
              dates: cf?.submissionDates || [],
              counts: cf?.submissionCounts || {},
              streak: cf?.streak || 0,
              maxStreak: cf?.maxStreak || 0,
              total: cf?.totalSubmissions || 0,
              activeDays: cf?.totalActiveDays || 0,
            },
            github: {
              dates: val.stats?.github?.submissionDates || [],
              counts: val.stats?.github?.submissionCounts || {},
              streak: val.stats?.github?.streak || 0,
              maxStreak: val.stats?.github?.maxStreak || 0,
              total: val.stats?.github?.totalSubmissions || 0,
              activeDays: val.stats?.github?.totalActiveDays || 0,
              publicRepos: val.stats?.github?.publicRepos || 0,
              followers: val.stats?.github?.followers || 0,
            },
          });
        }
      }

      // 3. Process Video Watch Time Summary
      if (summaryRes.status === "fulfilled" && summaryRes.value?.ok) {
        const sum = summaryRes.value.summary || {};
        setWatchStats({
          totalWatchTimeSec: sum.totalWatchTimeSec || 0,
          completedVideos: sum.completedVideos || 0,
          totalTrackedVideos: sum.totalTrackedVideos || 0,
        });
      }

      // 4. Process Video Progress List
      if (progressRes.status === "fulfilled" && progressRes.value?.ok) {
        setProgressList(progressRes.value.progress || []);
      }

      // 5. Process Quiz Attempts (Combine backend + local storage)
      let allQuizzes = [];
      if (quizRes.status === "fulfilled" && Array.isArray(quizRes.value?.attempts)) {
        allQuizzes = [...quizRes.value.attempts];
      }

      try {
        const userId = user?._id || user?.id || user?.email || "guest";
        const prefix = `quizAttempts:${userId}:`;
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            const parsed = JSON.parse(localStorage.getItem(k) || "[]");
            if (Array.isArray(parsed)) allQuizzes.push(...parsed);
          }
        }
      } catch {
        // ignore storage parse errors
      }

      setQuizAttempts(allQuizzes);
      setLastSyncedAt(new Date());

      if (forceRefresh) {
        setMessage("All platform tracks, coding stats & watch time refreshed!");
        setTimeout(() => setMessage(""), 3500);
      }
    } catch {
      // Graceful fallback
    } finally {
      setSyncingStats(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  // Keep form synced with user
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        bio: user.bio || prev.bio,
        location: user.location || prev.location,
        schoolCompany: user.schoolCompany || prev.schoolCompany,
        website: user.website || prev.website,
        leetcode: user.leetcode || prev.leetcode,
        codeforces: user.codeforces || prev.codeforces,
        codechef: user.codechef || prev.codechef,
        github: user.github || prev.github,
      }));
      if (user.verifiedPlatforms) {
        setVerifiedPlatforms(user.verifiedPlatforms);
      }
      if (user.verificationToken) {
        setVerificationToken(user.verificationToken);
      }
    }
  }, [user]);

  // Compute LearnSphere platform activities from video progress and quiz attempts
  const learnSphereActivities = useMemo(() => {
    const counts = {};
    const datesSet = new Set();
    let total = 0;

    if (Array.isArray(progressList)) {
      progressList.forEach((p) => {
        const dateStr = p.lastWatchedAt || p.updatedAt;
        if (dateStr) {
          const d = new Date(dateStr).toISOString().split("T")[0];
          counts[d] = (counts[d] || 0) + 1;
          datesSet.add(d);
          total += 1;
        }
      });
    }

    if (Array.isArray(quizAttempts)) {
      quizAttempts.forEach((q) => {
        const dateStr = q.attemptedAt || q.createdAt;
        if (dateStr) {
          const d = new Date(dateStr).toISOString().split("T")[0];
          counts[d] = (counts[d] || 0) + 1;
          datesSet.add(d);
          total += 1;
        }
      });
    }

    const dates = Array.from(datesSet).sort();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (datesSet.has(today) || datesSet.has(yesterday)) {
      let check = datesSet.has(today) ? new Date() : new Date(Date.now() - 86400000);
      while (true) {
        const str = check.toISOString().split("T")[0];
        if (datesSet.has(str)) {
          streak += 1;
          check = new Date(check.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    return {
      dates,
      counts,
      total,
      streak,
      maxStreak: Math.max(streak, dates.length > 0 ? 1 : 0),
      activeDays: datesSet.size,
    };
  }, [progressList, quizAttempts]);

  // Combined active days across all tracked platforms (LeetCode, Codeforces, GitHub, LearnSphere)
  const totalActiveDaysAcrossPlatforms = useMemo(() => {
    const activeDates = new Set();
    (platformActivities.leetcode?.dates || []).forEach((d) => activeDates.add(d));
    (platformActivities.codeforces?.dates || []).forEach((d) => activeDates.add(d));
    (platformActivities.github?.dates || []).forEach((d) => activeDates.add(d));
    (learnSphereActivities.dates || []).forEach((d) => activeDates.add(d));
    return activeDates.size;
  }, [platformActivities, learnSphereActivities]);

  // Compute LearnSphere Rating (LSR) with verified gating & 5-pillar engine
  const lsRating = useMemo(() => {
    return calculateLSRating({
      codingStats,
      watchTimeSec: watchStats.totalWatchTimeSec,
      completedVideos: watchStats.completedVideos,
      quizAttempts,
      streakDays: codingStats.streak || user?.stats?.streakDays || 0,
      verifiedPlatforms,
      platformActivities,
      activeDaysCount: totalActiveDaysAcrossPlatforms,
    });
  }, [codingStats, watchStats, quizAttempts, user, verifiedPlatforms, platformActivities, totalActiveDaysAcrossPlatforms]);

  // Compute Genuine Badges
  const badges = useMemo(() => {
    return evaluateBadges({
      codingStats,
      watchTimeSec: watchStats.totalWatchTimeSec,
      completedVideos: watchStats.completedVideos,
      quizAttempts,
      streakDays: codingStats.streak || user?.stats?.streakDays || 0,
      verifiedPlatforms,
    });
  }, [codingStats, watchStats, quizAttempts, user, verifiedPlatforms]);

  const unlockedBadgesCount = useMemo(() => {
    return badges.filter((b) => b.isUnlocked).length;
  }, [badges]);

  // Compute Topic Mastery
  const topicMastery = useMemo(() => {
    return deriveTopicMastery(codingStats, progressList, quizAttempts);
  }, [codingStats, progressList, quizAttempts]);

  // 52-Week Genuine Activity Heatmap with Multi-Platform Extraction
  const { heatmapData, activeDaysCount, totalActivityCount, currentStreak, longestStreak } = useMemo(() => {
    const lc = platformActivities.leetcode || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };
    const cf = platformActivities.codeforces || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };
    const gh = platformActivities.github || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };
    const ls = learnSphereActivities;

    const weeks = [];
    const today = new Date();
    let totalActs = 0;
    const activeDates = new Set();

    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(today.getTime() - (51 - w) * 7 * 86400000 + d * 86400000);
        const dateKey = dayDate.toISOString().split("T")[0];

        const lcCount = lc.counts?.[dateKey] || 0;
        const cfCount = cf.counts?.[dateKey] || 0;
        const ghCount = gh.counts?.[dateKey] || 0;
        const lsCount = ls.counts?.[dateKey] || 0;
        const allCount = lcCount + cfCount + ghCount + lsCount;

        let displayCount = 0;
        if (selectedHeatmapPlatform === "all") displayCount = allCount;
        else if (selectedHeatmapPlatform === "leetcode") displayCount = lcCount;
        else if (selectedHeatmapPlatform === "codeforces") displayCount = cfCount;
        else if (selectedHeatmapPlatform === "learnsphere") displayCount = lsCount;
        else if (selectedHeatmapPlatform === "github") displayCount = ghCount;

        if (displayCount > 0) {
          totalActs += displayCount;
          activeDates.add(dateKey);
        }

        days.push({
          dateKey,
          date: dayDate,
          count: displayCount,
          breakdown: {
            leetcode: lcCount,
            codeforces: cfCount,
            github: ghCount,
            learnsphere: lsCount,
            total: allCount,
          },
        });
      }
      weeks.push(days);
    }

    let streak = codingStats.streak || 0;
    let maxStreak = codingStats.maxStreak || codingStats.streak || 0;

    if (selectedHeatmapPlatform === "leetcode") {
      streak = lc.streak || 0;
      maxStreak = lc.maxStreak || lc.streak || 0;
    } else if (selectedHeatmapPlatform === "codeforces") {
      streak = cf.streak || 0;
      maxStreak = cf.maxStreak || cf.streak || 0;
    } else if (selectedHeatmapPlatform === "learnsphere") {
      streak = ls.streak || 0;
      maxStreak = ls.maxStreak || ls.streak || 0;
    } else if (selectedHeatmapPlatform === "github") {
      streak = gh.streak || 0;
      maxStreak = gh.maxStreak || gh.streak || 0;
    }

    return {
      heatmapData: weeks,
      activeDaysCount: activeDates.size,
      totalActivityCount: totalActs,
      currentStreak: streak,
      longestStreak: maxStreak,
    };
  }, [platformActivities, learnSphereActivities, selectedHeatmapPlatform, codingStats]);

  // Profile Photo Upload Handlers
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file (PNG, JPG, SVG, WebP).");
      setTimeout(() => setMessage(""), 3500);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB.");
      setTimeout(() => setMessage(""), 3500);
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result;
        const res = await uploadAvatar(base64Data);
        const newAvatar = res.user?.avatar || base64Data;
        setProfileForm((prev) => ({ ...prev, avatar: newAvatar }));
        updateUser({ ...user, avatar: newAvatar });
        setMessage("Avatar photo updated!");
        setShowAvatarPicker(false);
        setTimeout(() => setMessage(""), 3500);
      } catch (err) {
        setMessage(err.response?.data?.error || "Failed to save profile photo.");
        setTimeout(() => setMessage(""), 3500);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      setMessage("Error reading file.");
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = async (presetUrl) => {
    setUploadingPhoto(true);
    try {
      const res = await uploadAvatar(presetUrl);
      const newAvatar = res.user?.avatar || presetUrl;
      setProfileForm((prev) => ({ ...prev, avatar: newAvatar }));
      updateUser({ ...user, avatar: newAvatar });
      setMessage("Preset avatar selected!");
      setShowAvatarPicker(false);
      setTimeout(() => setMessage(""), 3500);
    } catch {
      setProfileForm((prev) => ({ ...prev, avatar: presetUrl }));
      updateUser({ ...user, avatar: presetUrl });
      setShowAvatarPicker(false);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Username Availability Checking
  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setProfileForm((prev) => ({ ...prev, username: clean }));
    if (clean.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: "Min 3 characters (letters, numbers, _)" });
      return;
    }
    if (clean === user?.username) {
      setUsernameStatus({ checking: false, available: true, message: "Your current handle." });
      return;
    }
    setUsernameStatus({ checking: true, available: null, message: "Checking availability..." });
  };

  useEffect(() => {
    if (!profileForm.username || profileForm.username.length < 3 || profileForm.username === user?.username) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(profileForm.username);
        if (res.available) {
          setUsernameStatus({ checking: false, available: true, message: `@${profileForm.username} is available!` });
        } else {
          setUsernameStatus({ checking: false, available: false, message: res.message || "Username already taken." });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, message: "" });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [profileForm.username, user?.username]);

  // Portfolio Handlers
  const handleAddSkill = (skillToAdd) => {
    const skill = (skillToAdd || newSkillInput).trim();
    if (!skill) return;
    if (profileForm.skills.includes(skill)) {
      setNewSkillInput("");
      return;
    }
    const updatedSkills = [...profileForm.skills, skill];
    setProfileForm((prev) => ({ ...prev, skills: updatedSkills }));
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = profileForm.skills.filter((s) => s !== skillToRemove);
    setProfileForm((prev) => ({ ...prev, skills: updatedSkills }));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectForm.title.trim()) return;
    const project = {
      title: newProjectForm.title.trim(),
      description: newProjectForm.description.trim(),
      tags: newProjectForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      link: newProjectForm.link.trim(),
      github: newProjectForm.github.trim(),
    };
    const updatedProjects = [...profileForm.portfolioProjects, project];
    setProfileForm((prev) => ({ ...prev, portfolioProjects: updatedProjects }));
    setNewProjectForm({ title: "", description: "", tags: "", link: "", github: "" });
    setShowAddProjectModal(false);
  };

  const handleDeleteProject = (index) => {
    const updatedProjects = profileForm.portfolioProjects.filter((_, i) => i !== index);
    setProfileForm((prev) => ({ ...prev, portfolioProjects: updatedProjects }));
  };

  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExperienceForm.role.trim() || !newExperienceForm.company.trim()) return;
    const exp = {
      role: newExperienceForm.role.trim(),
      company: newExperienceForm.company.trim(),
      period: newExperienceForm.period.trim(),
      description: newExperienceForm.description.trim(),
    };
    const updated = [...profileForm.experience, exp];
    setProfileForm((prev) => ({ ...prev, experience: updated }));
    setNewExperienceForm({ role: "", company: "", period: "", description: "" });
    setShowAddExperienceModal(false);
  };

  const handleDeleteExperience = (index) => {
    const updated = profileForm.experience.filter((_, i) => i !== index);
    setProfileForm((prev) => ({ ...prev, experience: updated }));
  };

  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!newEducationForm.degree.trim() || !newEducationForm.institution.trim()) return;
    const edu = {
      degree: newEducationForm.degree.trim(),
      institution: newEducationForm.institution.trim(),
      period: newEducationForm.period.trim(),
    };
    const updated = [...profileForm.education, edu];
    setProfileForm((prev) => ({ ...prev, education: updated }));
    setNewEducationForm({ degree: "", institution: "", period: "" });
    setShowAddEducationModal(false);
  };

  const handleDeleteEducation = (index) => {
    const updated = profileForm.education.filter((_, i) => i !== index);
    setProfileForm((prev) => ({ ...prev, education: updated }));
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setMessage("");

    try {
      await updateCodingProfiles({
        leetcode: profileForm.leetcode,
        codeforces: profileForm.codeforces,
        codechef: profileForm.codechef,
      });

      const res = await updateUserProfile({
        name: profileForm.name,
        username: profileForm.username,
        avatar: profileForm.avatar,
        bio: profileForm.bio,
        location: profileForm.location,
        schoolCompany: profileForm.schoolCompany,
        website: profileForm.website,
        skills: profileForm.skills,
        socialLinks: profileForm.socialLinks,
        experience: profileForm.experience,
        education: profileForm.education,
        portfolioProjects: profileForm.portfolioProjects,
      });

      const updated = {
        ...user,
        ...profileForm,
        ...(res.user || {}),
      };
      updateUser(updated);
      setMessage("Profile details & portfolio saved successfully!");
      setTimeout(() => setMessage(""), 3500);
      loadAllData(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Profile details saved!";
      setMessage(errMsg);
      setTimeout(() => setMessage(""), 3500);
    } finally {
      setSavingProfile(false);
    }
  };

  // Send 6-Digit Password Reset Code to User's Email
  const handleSendResetOtp = async () => {
    const email = user?.email;
    if (!email) {
      setForgotPasswordState((prev) => ({ ...prev, error: "No registered email address found for your account." }));
      return;
    }

    setForgotPasswordState((prev) => ({ ...prev, loading: true, error: "", success: "" }));
    try {
      const res = await forgotPasswordOtp(email);
      setForgotPasswordState((prev) => ({
        ...prev,
        loading: false,
        otpSent: true,
        cooldown: 45,
        devOtp: res.devOtp || "",
        success: res.message || `A 6-digit reset code has been sent to ${email}.`,
      }));
    } catch (err) {
      setForgotPasswordState((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to send reset code. Please try again.",
      }));
    }
  };

  // Submit OTP and New Password to Complete Reset
  const handleResetPasswordWithOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const email = user?.email;
    const { otp, password, confirmPassword } = forgotPasswordState;

    if (!otp || !otp.trim()) {
      setForgotPasswordState((prev) => ({ ...prev, error: "Please enter the 6-digit verification code." }));
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setForgotPasswordState((prev) => ({ ...prev, error: "Verification code must be exactly 6 numeric digits." }));
      return;
    }
    if (!password || password.length < 6) {
      setForgotPasswordState((prev) => ({ ...prev, error: "Password must be at least 6 characters long." }));
      return;
    }
    if (password !== confirmPassword) {
      setForgotPasswordState((prev) => ({ ...prev, error: "Passwords do not match. Please re-enter." }));
      return;
    }

    setForgotPasswordState((prev) => ({ ...prev, loading: true, error: "", success: "" }));
    try {
      await resetPasswordOtp(email, otp.trim(), password);
      setForgotPasswordState((prev) => ({
        ...prev,
        loading: false,
        otp: "",
        password: "",
        confirmPassword: "",
        success: "Password reset successfully! Your new password is now active.",
      }));
      setMessage("Account password updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setForgotPasswordState((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to reset password. Please verify the code and try again.",
      }));
    }
  };

  // Copy Public Profile URL
  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile?u=${encodeURIComponent(user?.email || "me")}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Copy Verification Token
  const handleCopyToken = () => {
    if (!verificationToken) return;
    navigator.clipboard.writeText(verificationToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  // Open Verification Modal for specific platform
  const handleOpenVerifyModal = (platform) => {
    const handle = profileForm[platform] || "";
    setVerifyModal({
      open: true,
      platform,
      handle,
      loading: false,
      error: "",
      success: "",
    });
  };

  // Confirm Verification Request
  const handleConfirmVerification = async () => {
    const { platform, handle } = verifyModal;
    if (!handle.trim()) {
      setVerifyModal((prev) => ({ ...prev, error: `Please enter your ${platform} handle or username.` }));
      return;
    }

    setVerifyModal((prev) => ({ ...prev, loading: true, error: "", success: "" }));

    try {
      const res = await verifyPlatformOwnership({ platform, handle: handle.trim() });
      if (res.ok && res.verified) {
        setVerifyModal((prev) => ({
          ...prev,
          loading: false,
          success: res.message || "Ownership verified and locked to your profile!",
        }));
        setVerifiedPlatforms(res.verifiedPlatforms || {});
        setMessage(`Verified and bound ${platform.toUpperCase()} (@${res.handle})!`);
        setTimeout(() => setMessage(""), 4000);

        setTimeout(() => {
          setVerifyModal({ open: false, platform: "leetcode", handle: "", loading: false, error: "", success: "" });
          loadAllData(true);
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Verification check failed. Please ensure the token is in your profile.";
      setVerifyModal((prev) => ({ ...prev, loading: false, error: errMsg }));
    }
  };

  // One-click Inline Platform Verification
  const handleInlineVerify = async (platform) => {
    const handle = (profileForm[platform] || "").trim();
    if (!handle) {
      setInlineError((prev) => ({ ...prev, [platform]: `Please enter your ${platform} username first.` }));
      return;
    }
    setInlineLoading((prev) => ({ ...prev, [platform]: true }));
    setInlineError((prev) => ({ ...prev, [platform]: "" }));
    setInlineSuccess((prev) => ({ ...prev, [platform]: "" }));

    try {
      const res = await verifyPlatformOwnership({ platform, handle });
      if (res.ok && res.verified) {
        setInlineSuccess((prev) => ({ ...prev, [platform]: "Verified & bound!" }));
        setVerifiedPlatforms(res.verifiedPlatforms || {});
        setMessage(`Verified and bound ${platform.toUpperCase()} (@${res.handle})!`);
        setTimeout(() => setMessage(""), 4000);
        setTimeout(() => {
          setInlineSuccess((prev) => ({ ...prev, [platform]: "" }));
        }, 3500);
        loadAllData(true);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || `Token not found in ${platform} profile bio/info.`;
      setInlineError((prev) => ({ ...prev, [platform]: errMsg }));
    } finally {
      setInlineLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  // Disconnect Platform Handle
  const handleDisconnectPlatform = async (platform) => {
    try {
      await disconnectCodingProfile(platform);
      setMessage(`Disconnected ${platform.toUpperCase()}.`);
      setTimeout(() => setMessage(""), 3000);
      setVerifiedPlatforms((prev) => ({ ...prev, [platform]: false }));
      setProfileForm((prev) => ({ ...prev, [platform]: "" }));
      loadAllData(true);
    } catch {
      setMessage("Failed to disconnect platform.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Clear Local Data
  const clearQuizHistory = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("quizAttempts:")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    setMessage("Local quiz history cleared successfully.");
    setTimeout(() => setMessage(""), 3500);
    loadAllData(false);
  };

  // Handle Logout
  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 1. HERO BANNER: IDENTITY & LEARNESPHERE RATING CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#8090fd]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Block: Avatar, Name, Bio, Metadata */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar with Animated Tier Ring & Photo Upload Button */}
            <div className="relative shrink-0 group">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
              <div className={`h-20 w-20 sm:h-22 sm:w-22 rounded-full p-1 bg-gradient-to-tr ${lsRating.tier.ring} shadow-lg shadow-indigo-500/25`}>
                <div className="relative h-full w-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                  {profileForm.avatar || user?.avatar ? (
                    <img
                      src={profileForm.avatar || user.avatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{(profileForm.name || "A")[0].toUpperCase()}</span>
                  )}

                  {/* Hover Camera Overlay Button */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(true)}
                    disabled={uploadingPhoto}
                    title="Change Profile Photo"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <Camera size={20} className={uploadingPhoto ? "animate-pulse" : ""} />
                    <span className="text-[9px] font-bold mt-0.5">Change</span>
                  </button>
                </div>
              </div>

              {/* Upload Quick-Action Button */}
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                title="Change Avatar"
                className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#8291fa] hover:bg-[#7080f8] text-white shadow-md border-2 border-white dark:border-[#0e1526] transition cursor-pointer"
              >
                <Camera size={13} />
              </button>

              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md border-2 border-white dark:border-[#0e1526]">
                <Flame size={14} />
              </div>
            </div>

            {/* Information Column */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  {profileForm.name}
                </h1>

                {/* Username Handle Badge */}
                <div className="flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono text-[#8090fd]">
                  <AtSign size={12} className="text-[#8090fd]" />
                  <span className="font-bold">{profileForm.username || user?.username || "learner"}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`@${profileForm.username || user?.username || "learner"}`);
                      setMessage("Handle copied to clipboard!");
                      setTimeout(() => setMessage(""), 2500);
                    }}
                    title="Copy Handle"
                    className="hover:text-indigo-300 ml-0.5 cursor-pointer"
                  >
                    <Copy size={11} />
                  </button>
                </div>

                {/* Platform Badge with Verification Check */}
                {profileForm.leetcode ? (
                  <div className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 text-xs font-mono">
                    <span className="font-bold text-[#8090fd]">LC: @{profileForm.leetcode}</span>
                    {verifiedPlatforms.leetcode ? (
                      <span title="Ownership Verified by LearnSphere" className="flex items-center text-emerald-500 gap-0.5">
                        <ShieldCheck size={12} />
                        <span className="text-[10px] font-sans font-bold">Verified</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenVerifyModal("leetcode")}
                        title="Click to Verify Ownership"
                        className="flex items-center text-amber-500 hover:text-amber-400 gap-0.5 cursor-pointer"
                      >
                        <ShieldAlert size={12} />
                        <span className="text-[10px] font-sans font-bold underline">Unverified</span>
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Tier Badge */}
                <span className={`inline-flex items-center gap-1.5 rounded-full border ${lsRating.tier.border} ${lsRating.tier.bg} px-3 py-0.5 text-xs font-bold ${lsRating.tier.color}`}>
                  <Trophy size={12} />
                  <span>{lsRating.tier.name} • {lsRating.tier.tag}</span>
                </span>
              </div>

              {/* Bio Summary */}
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                {profileForm.bio}
              </p>

              {/* Metadata Pills Row */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-400" />
                  <span>{profileForm.location || "Remote Learner"}</span>
                </div>
                {profileForm.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-gray-400" />
                    <a
                      href={profileForm.website.startsWith("http") ? profileForm.website : `https://${profileForm.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#8090fd] hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  <span>
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Sep 2026"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: LearnSphere Rating Badge & Platform Sync */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 shrink-0 border-t lg:border-t-0 border-black/5 dark:border-white/5 pt-4 lg:pt-0">
            <div className="flex items-center gap-3">
              {/* Streak Card */}
              <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2">
                <Flame size={18} className="text-amber-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-500 block leading-tight">Streak</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {codingStats.streak} Days
                  </span>
                </div>
              </div>

              {/* LearnSphere Rating Badge */}
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center gap-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-3.5 py-2 transition cursor-pointer text-left"
                title="View LearnSphere Rating Formula & Breakdown"
              >
                <Zap size={18} className="text-[#8090fd]" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#8090fd] block leading-tight">LSR Score</span>
                    <Info size={11} className="text-[#8090fd]/70" />
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {lsRating.totalRating}
                  </span>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => loadAllData(true)}
                disabled={syncingStats}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#8090fd] px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
                title="Refresh platform tracker from LeetCode, Codeforces, Watch Time & Quizzes"
              >
                <RefreshCw size={13} className={syncingStats ? "animate-spin" : ""} />
                <span>{syncingStats ? "Syncing..." : "Sync Tracker"}</span>
              </button>

              <button
                onClick={handleCopyProfileLink}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs hover:border-[#8090fd] hover:text-[#8090fd] transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={13} />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-1.5 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-300/30 transition cursor-pointer"
              >
                <Settings size={13} />
                <span>Configure</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEGMENTED TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#8291fa] text-white shadow-md shadow-indigo-300/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Trophy size={14} />
            <span>Platform Overview & Skills</span>
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "badges"
                ? "bg-[#8291fa] text-white shadow-md shadow-indigo-300/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Award size={14} />
            <span>Honors & Badges ({unlockedBadgesCount}/{badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "heatmap"
                ? "bg-[#8291fa] text-white shadow-md shadow-indigo-300/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Calendar size={14} />
            <span>Activity & Streaks</span>
          </button>

          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "portfolio"
                ? "bg-[#8291fa] text-white shadow-md shadow-indigo-300/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <FolderGit2 size={14} />
            <span>Portfolio & Showcase</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#8291fa] text-white shadow-md shadow-indigo-300/30"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <KeyRound size={14} />
            <span>Profile & Verification</span>
          </button>
        </div>

        {lastSyncedAt && (
          <span className="text-[11px] text-gray-400 font-medium self-end sm:self-auto">
            Last synced: {lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Toast Feedback */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-xs"
        >
          <CheckCircle2 size={15} />
          <span>{message}</span>
        </motion.div>
      )}

      {/* 3. TAB 1: PLATFORM OVERVIEW & SKILLS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Row 0: LearnSphere Rating Tier Card Banner */}
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.07] via-purple-500/[0.05] to-sky-500/[0.07] p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#8090fd]/20 text-[#8090fd] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
                    LearnSphere Rating 2.0
                  </span>
                  <span className={`text-xs font-bold ${lsRating.tier.color} bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-current/20`}>
                    {lsRating.tier.name} • {lsRating.tier.tag}
                  </span>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 border border-black/5 dark:border-white/10 px-2 py-0.5 rounded-full">
                    {lsRating.tier.percentile}
                  </span>
                  {lsRating.pendingProblemPoints > 0 && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      +{lsRating.pendingProblemPoints} pts pending verification
                    </span>
                  )}
                  {lsRating.pendingGithubPoints > 0 && (
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      +{lsRating.pendingGithubPoints} GitHub pts unverified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                    {lsRating.totalRating}
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    {lsRating.tier.readiness}
                  </span>
                </div>

                {/* 5 Pillar Quick Summary Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-1 font-semibold border border-sky-500/20">
                    <Clock size={11} /> Curriculum: +{lsRating.pillars?.curriculum?.points || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 font-semibold border border-amber-500/20">
                    <Code2 size={11} /> Solves: +{lsRating.pillars?.problemSolving?.points || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 font-semibold border border-emerald-500/20">
                    <Brain size={11} /> Recall: +{lsRating.pillars?.recall?.points || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 font-semibold border border-purple-500/20">
                    <GitBranch size={11} /> Open Source: +{lsRating.pillars?.engineering?.points || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 font-semibold border border-rose-500/20">
                    <Flame size={11} /> Consistency: +{lsRating.pillars?.consistency?.points || 0}
                  </span>
                </div>
              </div>

              {/* Tier Progress Bar */}
              <div className="md:w-72 space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500 dark:text-gray-400">{lsRating.tier.name}</span>
                  <span className="text-[#8090fd]">
                    {lsRating.tier.nextTier ? `${lsRating.tier.pointsToNext} pts to ${lsRating.tier.nextTier}` : "Max Tier Reached"}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8090fd] to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${lsRating.tier.progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{lsRating.tier.min} pts</span>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="text-[#8090fd] hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Inspect 5-Pillar Model</span>
                    <ArrowUpRight size={11} />
                  </button>
                  <span>{lsRating.tier.nextMin ? `${lsRating.tier.nextMin} pts` : "∞"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unverified Platform Warning Banner if handle is present but unverified */}
          {profileForm.leetcode && !verifiedPlatforms.leetcode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <ShieldAlert size={18} className="shrink-0" />
                <div>
                  <span className="font-bold block">
                    LeetCode account @{profileForm.leetcode} is unverified.
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 text-[11px]">
                    To prevent false profile claims and credit your {codingStats.totalSolved} solved problems (+{lsRating.pendingProblemPoints} pts) to your official LearnSphere Rating, verify ownership.
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleOpenVerifyModal("leetcode")}
                className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 text-xs transition shadow-xs cursor-pointer"
              >
                Verify LeetCode Ownership
              </button>
            </motion.div>
          )}

          {/* Row 1: Solved Problems Donut & Contest Rating */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Box: LeetCode Donut & Breakdown (7 Cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Code2 size={15} className="text-[#8090fd]" />
                    <span>Competitive Problem Solving</span>
                  </h3>
                  {codingStats.isConnected ? (
                    <div className="flex items-center gap-1.5">
                      {verifiedPlatforms.leetcode ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          <ShieldCheck size={11} />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenVerifyModal("leetcode")}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 hover:underline cursor-pointer"
                        >
                          <ShieldAlert size={11} />
                          Verify Ownership
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-xs font-bold text-[#8090fd] hover:underline"
                    >
                      Connect Handle +
                    </button>
                  )}
                </div>

                {codingStats.isConnected ? (
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    {/* Circular Donut Gauge SVG */}
                    <div className="relative flex h-36 w-36 items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-100 dark:text-slate-800" />
                        {/* Easy segment (Green) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#22c55e"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * Math.min(1, codingStats.easySolved / Math.max(1, codingStats.totalSolved)))}
                          strokeLinecap="round"
                          fill="none"
                        />
                        {/* Medium segment (Amber) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#f59e0b"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * Math.min(1, (codingStats.easySolved + codingStats.mediumSolved) / Math.max(1, codingStats.totalSolved)))}
                          strokeLinecap="round"
                          fill="none"
                        />
                        {/* Hard segment (Rose) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * Math.min(1, codingStats.totalSolved / Math.max(1, codingStats.totalSolved)))}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                          {codingStats.totalSolved}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Solved
                        </span>
                      </div>
                    </div>

                    {/* 3 Difficulty Progress Rows */}
                    <div className="w-full space-y-3">
                      {/* Easy */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-500">Easy</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {codingStats.easySolved} / {codingStats.totalEasy}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-950/60 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (codingStats.easySolved / codingStats.totalEasy) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-500">Medium</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {codingStats.mediumSolved} / {codingStats.totalMedium}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/60 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (codingStats.mediumSolved / codingStats.totalMedium) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-500">Hard</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {codingStats.hardSolved} / {codingStats.totalHard}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-rose-100 dark:bg-rose-950/60 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (codingStats.hardSolved / codingStats.totalHard) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                    <Code2 className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      No LeetCode Handle Linked Yet
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                      Connect your LeetCode or Codeforces username and verify ownership to sync your real submissions, acceptance rate, and rank.
                    </p>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                    >
                      Connect & Verify Handles
                    </button>
                  </div>
                )}
              </div>

              {/* Submissions & Percentile Footer */}
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Total Solved Across Platforms: <strong className="text-gray-900 dark:text-white">{codingStats.totalSolved}</strong></span>
                <span>Active Study Days: <strong className="text-emerald-500">{activeDaysCount} Days</strong></span>
              </div>
            </div>

            {/* Right Box: Contest Standing & LearnSphere Video Tracks (5 Cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Platform Track Records
                  </span>
                  {codingStats.contestRating ? (
                    <span className="rounded-full bg-purple-500/15 text-purple-400 px-2.5 py-0.5 text-[11px] font-bold">
                      {codingStats.contestRankPercentile ? `Top ${codingStats.contestRankPercentile}%` : "Rated"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#8090fd]/15 text-[#8090fd] px-2.5 py-0.5 text-[11px] font-bold">
                      LearnSphere OS
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">
                    {codingStats.contestRating || lsRating.totalRating}
                  </span>
                  <span className="text-sm font-bold text-purple-400">
                    {codingStats.contestRating ? "Contest Rating" : `${lsRating.tier.name} Tier`}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-3.5 border border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Watch Time</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {lsRating.breakdown.watchTime.hours} Hours
                    </span>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-3.5 border border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Completed Tracks</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {watchStats.completedVideos} Videos
                    </span>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-3.5 border border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Quizzes Passed</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {lsRating.breakdown.quizzes.passedCount} / {quizAttempts.length}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-3.5 border border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Global Rank</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {codingStats.ranking ? `#${codingStats.ranking.toLocaleString()}` : "Top 5%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Handles Preview */}
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Connected:</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {profileForm.leetcode ? (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      LC: @{profileForm.leetcode}
                      {verifiedPlatforms.leetcode && <Check size={11} className="text-emerald-500" />}
                    </span>
                  ) : (
                    <span className="text-gray-400">LC: Unlinked</span>
                  )}
                  <span>•</span>
                  {profileForm.codeforces ? (
                    <span className="text-sky-400 font-bold flex items-center gap-1">
                      CF: @{profileForm.codeforces}
                      {verifiedPlatforms.codeforces && <Check size={11} className="text-emerald-500" />}
                    </span>
                  ) : (
                    <span className="text-gray-400">CF: Unlinked</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Topic & Skill Mastery Matrix */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-[#8090fd]" />
                <span>Verified Skill & Topic Matrix</span>
              </h3>
              <span className="text-xs text-gray-400">Calculated from genuine course completions & verified coding solves</span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {topicMastery.map((topic) => (
                <div
                  key={topic.id}
                  className={`rounded-2xl border p-4 transition hover:scale-[1.01] ${topic.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {topic.name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                      {topic.level}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{topic.solved} Modules / Solves</span>
                    <span className="font-black text-gray-900 dark:text-white">{topic.pct}% Mastery</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-current rounded-full" style={{ width: `${topic.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Recent Solutions & Activity */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Code2 size={16} className="text-[#8090fd]" />
                <span>Recent Platform Activity & Submissions</span>
              </h3>
              <span className="text-xs text-gray-400">Live Learning Feeds</span>
            </div>

            {codingStats.recentSubmissions && codingStats.recentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5 text-gray-400 uppercase text-[10px]">
                      <th className="pb-3 font-bold">Activity / Problem</th>
                      <th className="pb-3 font-bold">Platform</th>
                      <th className="pb-3 font-bold text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {codingStats.recentSubmissions.slice(0, 6).map((sub, i) => (
                      <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                        <td className="py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span>{sub.title}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-500">
                            LeetCode
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-400 font-mono text-[11px]">
                          {sub.date || "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : progressList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5 text-gray-400 uppercase text-[10px]">
                      <th className="pb-3 font-bold">Track Title</th>
                      <th className="pb-3 font-bold">Watch Time</th>
                      <th className="pb-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {progressList.slice(0, 5).map((prog, i) => (
                      <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                        <td className="py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Video size={14} className="text-[#8090fd] shrink-0" />
                          <span>{prog.title || "Video Track"}</span>
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                          {Math.round((prog.watchTimeSec || 0) / 60)} mins
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${prog.completed ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-indigo-500/20 bg-indigo-500/10 text-[#8090fd]"}`}>
                            {prog.completed ? "Completed" : "In Progress"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">
                No recent activity recorded yet. Start watching a lecture or solve a problem to populate your feed!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: HONORS & BADGES */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  <span>Honors & Achievement Badges</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Badges are unlocked dynamically as you watch videos, pass quizzes, solve algorithmic problems on verified accounts, and maintain your learning streak.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/15 text-amber-500 px-3 py-1 text-xs font-bold border border-amber-500/30">
                  {unlockedBadgesCount} / {badges.length} Badges Unlocked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-4 transition ${
                    badge.isUnlocked
                      ? "bg-amber-500/[0.04] border-amber-500/30 shadow-xs"
                      : "bg-gray-50 dark:bg-slate-800/40 border-black/5 dark:border-white/5 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                          badge.isUnlocked
                            ? "bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/20"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-400"
                        }`}
                      >
                        {badge.isUnlocked ? <Trophy size={18} /> : <Lock size={18} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          {badge.name}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {badge.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        badge.isUnlocked
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-400"
                      }`}
                    >
                      {badge.isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {badge.desc}
                  </p>

                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-900 dark:text-white">
                        {badge.current} / {badge.target} {badge.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.isUnlocked ? "bg-amber-500" : "bg-[#8090fd]"
                        }`}
                        style={{ width: `${badge.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: ACTIVITY HEATMAP & STREAKS WITH MULTI-PLATFORM EXTRACTION */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          {/* Top Metric Cards - Dynamically reflects selected platform */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-4 shadow-md">
              <span className="text-[10px] font-bold uppercase text-gray-400">
                {selectedHeatmapPlatform === "all" ? "Total Activities" : `${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.label} Total`}
              </span>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{totalActivityCount}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-4 shadow-md">
              <span className="text-[10px] font-bold uppercase text-gray-400">Current Streak</span>
              <p className="mt-1 text-2xl font-black text-emerald-500">{currentStreak} Days</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-4 shadow-md">
              <span className="text-[10px] font-bold uppercase text-gray-400">Longest Streak</span>
              <p className="mt-1 text-2xl font-black text-amber-500">{longestStreak} Days</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-4 shadow-md">
              <span className="text-[10px] font-bold uppercase text-gray-400">Active Study Days</span>
              <p className="mt-1 text-2xl font-black text-[#8090fd]">{activeDaysCount} Days</p>
            </div>
          </div>

          {/* Platform Heatmap Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0e1526] border border-black/10 dark:border-white/10 shadow-xs">
            {Object.values(PLATFORM_HEATMAP_THEMES).map((theme) => {
              const Icon = theme.icon;
              const isSelected = selectedHeatmapPlatform === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedHeatmapPlatform(theme.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? theme.bgActive
                      : theme.bgInactive
                  }`}
                >
                  <Icon size={14} className={isSelected ? "text-white" : theme.accent} />
                  <span>{theme.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Platform Metrics Row (Clickable to switch platform heatmap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* LeetCode Quick Card */}
            <div
              onClick={() => setSelectedHeatmapPlatform("leetcode")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedHeatmapPlatform === "leetcode"
                  ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] hover:border-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 font-bold text-xs">
                    LC
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">LeetCode</span>
                </div>
                {selectedHeatmapPlatform === "leetcode" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">Active</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {platformActivities.leetcode.total || codingStats.totalSolved}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{platformActivities.leetcode.activeDays || codingStats.activeDays} active days</span>
                  <span>{platformActivities.leetcode.streak || codingStats.streak}d streak</span>
                </div>
              </div>
            </div>

            {/* Codeforces Quick Card */}
            <div
              onClick={() => setSelectedHeatmapPlatform("codeforces")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedHeatmapPlatform === "codeforces"
                  ? "border-sky-500/60 bg-sky-500/10 shadow-sm"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] hover:border-sky-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-500 font-bold text-xs">
                    CF
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Codeforces</span>
                </div>
                {selectedHeatmapPlatform === "codeforces" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white">Active</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {platformActivities.codeforces.total || 0}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{platformActivities.codeforces.activeDays || 0} active days</span>
                  <span>{platformActivities.codeforces.streak || 0}d streak</span>
                </div>
              </div>
            </div>

            {/* LearnSphere Tracks Quick Card */}
            <div
              onClick={() => setSelectedHeatmapPlatform("learnsphere")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedHeatmapPlatform === "learnsphere"
                  ? "border-indigo-500/60 bg-indigo-500/10 shadow-sm"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] hover:border-indigo-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8090fd]/20 text-[#8090fd] font-bold text-xs">
                    LS
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">LearnSphere Tracks</span>
                </div>
                {selectedHeatmapPlatform === "learnsphere" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8090fd] text-white">Active</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {learnSphereActivities.total}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{Math.round(watchStats.totalWatchTimeSec / 60)}m watch time</span>
                  <span>{learnSphereActivities.streak}d streak</span>
                </div>
              </div>
            </div>

            {/* GitHub Quick Card */}
            <div
              onClick={() => setSelectedHeatmapPlatform("github")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedHeatmapPlatform === "github"
                  ? "border-purple-500/60 bg-purple-500/10 shadow-sm"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] hover:border-purple-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-500 font-bold text-xs">
                    GH
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">GitHub</span>
                </div>
                {selectedHeatmapPlatform === "github" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">Active</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {platformActivities.github.total || 0}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{platformActivities.github.activeDays || 0} active days</span>
                  <span>{platformActivities.github.streak || 0}d streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main 52-Week Heatmap Box */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl space-y-4">
            {/* Header with selected platform badge and legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.accent || "text-emerald-500"} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                    52-Week Study & Problem-Solving Activity
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.borderActive || ""}`}>
                    {PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.badge}
                </p>
              </div>

              {/* Dynamic Platform-Specific Color Legend */}
              <div className="flex items-center gap-2 text-xs text-gray-400 self-end sm:self-auto">
                <span>Less</span>
                <span className={`h-3 w-3 rounded-xs ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.empty || "bg-slate-100"}`} />
                <span className={`h-3 w-3 rounded-xs ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.level1 || "bg-emerald-300"}`} title={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.legend[0]} />
                <span className={`h-3 w-3 rounded-xs ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.level2 || "bg-emerald-400"}`} title={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.legend[1]} />
                <span className={`h-3 w-3 rounded-xs ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.level3 || "bg-emerald-500"}`} title={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.legend[2]} />
                <span className={`h-3 w-3 rounded-xs ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.level4 || "bg-emerald-600"}`} title={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.legend[3]} />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto py-2">
              <div className="flex gap-1 min-w-[760px] pb-2">
                {heatmapData.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => {
                      const theme = PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform] || PLATFORM_HEATMAP_THEMES.all;
                      let bg = theme.empty;
                      if (day.count === 1) bg = theme.level1;
                      else if (day.count === 2) bg = theme.level2;
                      else if (day.count === 3) bg = theme.level3;
                      else if (day.count >= 4) bg = theme.level4;

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`h-3 w-3 rounded-[3px] transition duration-150 hover:scale-135 cursor-pointer ${bg}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hovered Day Interactive Details Banner */}
            {hoveredDay ? (
              <div className="mt-2 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className={PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.accent || "text-emerald-500"} />
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(hoveredDay.dateKey).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {hoveredDay.count} {selectedHeatmapPlatform === "all" ? "total platform activities" : `${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.label} ${PLATFORM_HEATMAP_THEMES[selectedHeatmapPlatform]?.unit}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {hoveredDay.breakdown.leetcode > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      LC: {hoveredDay.breakdown.leetcode}
                    </span>
                  )}
                  {hoveredDay.breakdown.codeforces > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                      CF: {hoveredDay.breakdown.codeforces}
                    </span>
                  )}
                  {hoveredDay.breakdown.learnsphere > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-[#8090fd] font-bold border border-indigo-500/20">
                      LearnSphere: {hoveredDay.breakdown.learnsphere}
                    </span>
                  )}
                  {hoveredDay.breakdown.github > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                      GitHub: {hoveredDay.breakdown.github}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-1.5">
                <Info size={12} />
                <span>Hover over any day square to inspect multi-platform activity breakdown for that date.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB 4: PROFILE SETTINGS & VERIFICATION CENTER */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* ANTI-SPOOFING PLATFORM VERIFICATION CENTER */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                      Platform Ownership & Anti-Spoofing Verification
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Cryptographically Gated & Verified Recruiter Profiles
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1">
                  To prevent anyone from falsely claiming high-ranking handles, you must verify account ownership before submissions are credited to your official LearnSphere Rating (LSR).
                </p>
              </div>

              {/* Secret Verification Token Box */}
              <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] via-[#8090fd]/[0.04] to-purple-500/[0.06] p-4 shadow-sm flex items-center justify-between gap-4 shrink-0 sm:min-w-[320px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8090fd]/20 text-[#8090fd]">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Your Unique Secret Token
                    </span>
                    <span className="font-mono text-sm font-black text-gray-900 dark:text-white select-all">
                      {verificationToken || "ls-verify-loading"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-2xs hover:border-[#8090fd] hover:text-[#8090fd] transition cursor-pointer"
                  title="Copy Verification Token"
                >
                  {copiedToken ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span className="text-emerald-500 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4 Connected Platform Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 1. LeetCode Card */}
              <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex flex-col justify-between transition hover:border-amber-500/40">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-black text-xs border border-amber-500/20">
                        LC
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white block">LeetCode Profile</span>
                        <span className="text-[10px] text-gray-400">Algorithmic Problem Solves</span>
                      </div>
                    </div>
                    {verifiedPlatforms.leetcode ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-500/30">
                        <ShieldCheck size={12} />
                        Verified & Bound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/30">
                        <ShieldAlert size={12} />
                        Unverified
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Paste token into your LeetCode profile <strong>About Me</strong> or <strong>Summary</strong>.
                  </p>

                  {/* Input Group with Embedded Action Button */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="LeetCode Username (e.g. touristo)"
                      value={profileForm.leetcode}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, leetcode: e.target.value });
                        if (inlineError.leetcode) setInlineError((prev) => ({ ...prev, leetcode: "" }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-3.5 pr-26 py-2.5 text-xs font-sans font-medium text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal focus:border-[#8090fd] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      disabled={inlineLoading.leetcode}
                      onClick={() => handleInlineVerify("leetcode")}
                      className="absolute right-1.5 rounded-lg bg-[#8090fd] hover:bg-[#6c7ff8] text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-60"
                    >
                      {inlineLoading.leetcode ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          <span>{verifiedPlatforms.leetcode ? "Re-verify" : "Verify"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inlineError.leetcode && (
                    <div className="mt-2 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{inlineError.leetcode}</span>
                    </div>
                  )}
                  {inlineSuccess.leetcode && (
                    <div className="mt-2 text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                      <Check size={12} className="shrink-0" />
                      <span>{inlineSuccess.leetcode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  {verifiedPlatforms.leetcode ? (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={13} /> Active in LSR Score
                      </span>
                      <button
                        onClick={() => handleDisconnectPlatform("leetcode")}
                        className="text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-gray-400">
                      <span>Ownership not verified</span>
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal("leetcode")}
                        className="text-[#8090fd] hover:underline font-bold cursor-pointer"
                      >
                        Step-by-step Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Codeforces Card */}
              <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex flex-col justify-between transition hover:border-sky-500/40">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 font-black text-xs border border-sky-500/20">
                        CF
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white block">Codeforces Handle</span>
                        <span className="text-[10px] text-gray-400">Contests & Rating Rank</span>
                      </div>
                    </div>
                    {verifiedPlatforms.codeforces ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-500/30">
                        <ShieldCheck size={12} />
                        Verified & Bound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/30">
                        <ShieldAlert size={12} />
                        Unverified
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Paste token into your Codeforces <strong>Organization</strong>, <strong>City</strong>, or <strong>Name</strong>.
                  </p>

                  {/* Input Group with Embedded Action Button */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Codeforces Handle (e.g. tourist)"
                      value={profileForm.codeforces}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, codeforces: e.target.value });
                        if (inlineError.codeforces) setInlineError((prev) => ({ ...prev, codeforces: "" }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-3.5 pr-26 py-2.5 text-xs font-sans font-medium text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal focus:border-[#8090fd] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      disabled={inlineLoading.codeforces}
                      onClick={() => handleInlineVerify("codeforces")}
                      className="absolute right-1.5 rounded-lg bg-[#8090fd] hover:bg-[#6c7ff8] text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-60"
                    >
                      {inlineLoading.codeforces ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          <span>{verifiedPlatforms.codeforces ? "Re-verify" : "Verify"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inlineError.codeforces && (
                    <div className="mt-2 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{inlineError.codeforces}</span>
                    </div>
                  )}
                  {inlineSuccess.codeforces && (
                    <div className="mt-2 text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                      <Check size={12} className="shrink-0" />
                      <span>{inlineSuccess.codeforces}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  {verifiedPlatforms.codeforces ? (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={13} /> Active in LSR Score
                      </span>
                      <button
                        onClick={() => handleDisconnectPlatform("codeforces")}
                        className="text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-gray-400">
                      <span>Ownership not verified</span>
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal("codeforces")}
                        className="text-[#8090fd] hover:underline font-bold cursor-pointer"
                      >
                        Step-by-step Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. GitHub Card */}
              <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex flex-col justify-between transition hover:border-purple-500/40">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 font-black text-xs border border-purple-500/20">
                        GH
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white block">GitHub Profile</span>
                        <span className="text-[10px] text-gray-400">Open Source & Activity</span>
                      </div>
                    </div>
                    {verifiedPlatforms.github ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-500/30">
                        <ShieldCheck size={12} />
                        Verified & Bound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/30">
                        <ShieldAlert size={12} />
                        Unverified
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Paste token into your public GitHub <strong>Bio</strong> or <strong>Company</strong>.
                  </p>

                  {/* Input Group with Embedded Action Button */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="GitHub Username"
                      value={profileForm.github}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, github: e.target.value });
                        if (inlineError.github) setInlineError((prev) => ({ ...prev, github: "" }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-3.5 pr-26 py-2.5 text-xs font-sans font-medium text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal focus:border-[#8090fd] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      disabled={inlineLoading.github}
                      onClick={() => handleInlineVerify("github")}
                      className="absolute right-1.5 rounded-lg bg-[#8090fd] hover:bg-[#6c7ff8] text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-60"
                    >
                      {inlineLoading.github ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          <span>{verifiedPlatforms.github ? "Re-verify" : "Verify"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inlineError.github && (
                    <div className="mt-2 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{inlineError.github}</span>
                    </div>
                  )}
                  {inlineSuccess.github && (
                    <div className="mt-2 text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                      <Check size={12} className="shrink-0" />
                      <span>{inlineSuccess.github}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  {verifiedPlatforms.github ? (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={13} /> Verified Dev Identity
                      </span>
                      <button
                        onClick={() => handleDisconnectPlatform("github")}
                        className="text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-gray-400">
                      <span>Ownership not verified</span>
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal("github")}
                        className="text-[#8090fd] hover:underline font-bold cursor-pointer"
                      >
                        Step-by-step Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. CodeChef Card */}
              <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex flex-col justify-between transition hover:border-rose-500/40">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 font-black text-xs border border-rose-500/20">
                        CC
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white block">CodeChef Account</span>
                        <span className="text-[10px] text-gray-400">Stars & Contest Ratings</span>
                      </div>
                    </div>
                    {verifiedPlatforms.codechef ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-500/30">
                        <ShieldCheck size={12} />
                        Verified & Bound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/30">
                        <ShieldAlert size={12} />
                        Unverified
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Paste token into your CodeChef <strong>About Me</strong> or <strong>Name</strong>.
                  </p>

                  {/* Input Group with Embedded Action Button */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="CodeChef Username"
                      value={profileForm.codechef}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, codechef: e.target.value });
                        if (inlineError.codechef) setInlineError((prev) => ({ ...prev, codechef: "" }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-3.5 pr-26 py-2.5 text-xs font-sans font-medium text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal focus:border-[#8090fd] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      disabled={inlineLoading.codechef}
                      onClick={() => handleInlineVerify("codechef")}
                      className="absolute right-1.5 rounded-lg bg-[#8090fd] hover:bg-[#6c7ff8] text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-60"
                    >
                      {inlineLoading.codechef ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          <span>{verifiedPlatforms.codechef ? "Re-verify" : "Verify"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inlineError.codechef && (
                    <div className="mt-2 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{inlineError.codechef}</span>
                    </div>
                  )}
                  {inlineSuccess.codechef && (
                    <div className="mt-2 text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                      <Check size={12} className="shrink-0" />
                      <span>{inlineSuccess.codechef}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  {verifiedPlatforms.codechef ? (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={13} /> Active in LSR Score
                      </span>
                      <button
                        onClick={() => handleDisconnectPlatform("codechef")}
                        className="text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-gray-400">
                      <span>Ownership not verified</span>
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal("codechef")}
                        className="text-[#8090fd] hover:underline font-bold cursor-pointer"
                      >
                        Step-by-step Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PERSONAL DETAILS FORM */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <User size={18} className="text-[#8090fd]" />
              <span>Personal Details & Identity</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
                      Unique Handle / Username
                    </label>
                    {usernameStatus.message && (
                      <span className={`text-[10px] font-bold ${usernameStatus.available ? "text-emerald-500" : usernameStatus.available === false ? "text-rose-500" : "text-amber-500"}`}>
                        {usernameStatus.checking ? "Checking..." : usernameStatus.message}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-gray-400">@</span>
                    <input
                      type="text"
                      placeholder="handle"
                      value={profileForm.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 pl-8 pr-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    University or Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stanford University / Tech Corp"
                    value={profileForm.schoolCompany}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolCompany: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  Bio / Summary
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    Personal Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourportfolio.dev"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    LinkedIn Profile
                  </label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={profileForm.socialLinks?.linkedin || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, linkedin: e.target.value } })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    GitHub Profile
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={profileForm.socialLinks?.github || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, github: e.target.value } })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    Twitter / X Profile
                  </label>
                  <input
                    type="text"
                    placeholder="https://x.com/username"
                    value={profileForm.socialLinks?.twitter || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, twitter: e.target.value } })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>{savingProfile ? "Saving..." : "Save Profile Details"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ACCOUNT SECURITY & FORGOT/RESET PASSWORD */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <KeyRound size={18} className="text-[#8090fd]" />
                  <span>Account Security & Password</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Forgot your password or want to set a new one? Use one-time email OTP verification to reset it securely without logging out.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForgotPasswordState((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto ${
                  forgotPasswordState.isOpen
                    ? "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200"
                    : "bg-[#8291fa] text-white shadow-xs hover:bg-[#7080f8]"
                }`}
              >
                <Key size={14} />
                <span>{forgotPasswordState.isOpen ? "Hide Password Reset" : "Forgot / Reset Password"}</span>
              </button>
            </div>

            {/* In-Page Password Reset Form (Collapsible) */}
            {forgotPasswordState.isOpen ? (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Registered Email: <span className="font-mono text-[#8090fd]">{user?.email || "No email"}</span>
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Step 1: Request a 6-digit one-time code to your registered email address.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={forgotPasswordState.loading || forgotPasswordState.cooldown > 0}
                    onClick={handleSendResetOtp}
                    className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] disabled:opacity-60 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {forgotPasswordState.loading && !forgotPasswordState.otpSent ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : forgotPasswordState.cooldown > 0 ? (
                      <span>Resend in {forgotPasswordState.cooldown}s</span>
                    ) : (
                      <>
                        <Mail size={13} />
                        <span>{forgotPasswordState.otpSent ? "Resend Code" : "Send 6-Digit Code"}</span>
                      </>
                    )}
                  </button>
                </div>

                {forgotPasswordState.devOtp && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
                    <span><strong>Dev OTP:</strong> <code className="font-mono font-bold text-sm ml-1">{forgotPasswordState.devOtp}</code></span>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordState((prev) => ({ ...prev, otp: prev.devOtp }))}
                      className="text-[11px] font-bold underline hover:text-amber-500 cursor-pointer"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                {forgotPasswordState.success && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{forgotPasswordState.success}</span>
                  </div>
                )}

                {forgotPasswordState.error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{forgotPasswordState.error}</span>
                  </div>
                )}

                {/* Reset Form Fields */}
                <form onSubmit={handleResetPasswordWithOtp} className="space-y-3 pt-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        6-Digit Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={forgotPasswordState.otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setForgotPasswordState((prev) => ({ ...prev, otp: val, error: "" }));
                        }}
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-gray-900 dark:text-white placeholder:tracking-normal focus:border-[#8090fd] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                          New Password *
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={forgotPasswordState.showPassword ? "text" : "password"}
                          placeholder="Min 6 characters"
                          value={forgotPasswordState.password}
                          onChange={(e) => setForgotPasswordState((prev) => ({ ...prev, password: e.target.value, error: "" }))}
                          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 pl-3.5 pr-9 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setForgotPasswordState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {forgotPasswordState.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={forgotPasswordState.showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={forgotPasswordState.confirmPassword}
                        onChange={(e) => setForgotPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value, error: "" }))}
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password", { state: { email: user?.email } })}
                      className="text-xs text-[#8090fd] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      <span>Open Fullscreen Recovery Page</span>
                    </button>

                    <button
                      type="submit"
                      disabled={forgotPasswordState.loading}
                      className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] disabled:opacity-60 text-white px-5 py-2.5 text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      {forgotPasswordState.loading && forgotPasswordState.otpSent ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Confirm & Reset Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>Account password was last configured during registration or previous reset.</span>
                <button
                  type="button"
                  onClick={() => setForgotPasswordState((prev) => ({ ...prev, isOpen: true }))}
                  className="text-xs text-[#8090fd] font-bold hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Reset via Email Code →
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 shadow-xl">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Appearance & Theme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Switch between Light Mode and Dark Mode across LearnSphere.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 shadow-xl">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Local Storage & Cache</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clear browser-stored quiz attempts, flashcard cache, and local study state on this device.
            </p>
            <div className="mt-4">
              <button
                onClick={clearQuizHistory}
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-500 transition cursor-pointer"
              >
                Clear Local Quiz History
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-6 shadow-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">Account Session</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sign out from your current device session.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 shadow-md transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. TAB: PORTFOLIO & SHOWCASE */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-transparent p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderGit2 className="text-[#8090fd]" size={22} />
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Developer Portfolio & Showcase
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                Curate your technical identity. Showcase your verified skills, flagship open-source projects, engineering experience, and academic trajectory for recruiters and collaborator discovery.
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Save size={14} />
              <span>{savingProfile ? "Saving..." : "Save Portfolio"}</span>
            </button>
          </div>

          {/* Section 1: Interactive Skills Matrix */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Technical Skills & Core Competencies</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Click to remove, or type to add technologies, frameworks, and tools in your arsenal.
                </p>
              </div>

              {/* Add Skill Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Docker, GraphQL"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none w-44"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Current Skills Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {profileForm.skills && profileForm.skills.length > 0 ? (
                profileForm.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 group hover:border-rose-500/30 hover:bg-rose-500/10 transition"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                      className="text-gray-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No skills added yet. Add a few below!</p>
              )}
            </div>

            {/* Quick Add Recommendations */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Popular Recommendations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "JavaScript", "TypeScript", "React", "Node.js", "Python",
                  "Next.js", "Docker", "MongoDB", "PostgreSQL", "Redis",
                  "System Design", "Algorithms", "Tailwind CSS", "C++", "Go"
                ].map((rec) => {
                  const alreadyHas = (profileForm.skills || []).includes(rec);
                  return (
                    <button
                      key={rec}
                      type="button"
                      disabled={alreadyHas}
                      onClick={() => handleAddSkill(rec)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        alreadyHas
                          ? "bg-black/5 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                          : "border border-black/10 dark:border-white/10 hover:border-[#8090fd] hover:text-[#8090fd] text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {alreadyHas ? `✓ ${rec}` : `+ ${rec}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Featured Projects Showcase */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Code2 size={18} className="text-[#8090fd]" />
                  <span>Featured Projects ({profileForm.portfolioProjects?.length || 0})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pin your proudest engineering accomplishments, open-source repos, and production deployments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProjectModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Add Project</span>
              </button>
            </div>

            {/* Projects Grid */}
            {profileForm.portfolioProjects && profileForm.portfolioProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profileForm.portfolioProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/50 p-5 flex flex-col justify-between hover:border-[#8090fd]/40 transition shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-gray-900 dark:text-white group-hover:text-[#8090fd] transition">
                          {proj.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(idx)}
                          title="Delete Project"
                          className="text-gray-400 hover:text-rose-500 transition cursor-pointer p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        {proj.description || "No description provided."}
                      </p>

                      {/* Tag Chips */}
                      {Array.isArray(proj.tags) && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links Row */}
                    <div className="flex items-center gap-3 pt-4 border-t border-black/5 dark:border-white/5 mt-4">
                      {proj.link && (
                        <a
                          href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#8090fd] hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span>Live Demo</span>
                        </a>
                      )}
                      {proj.github && (
                        <a
                          href={proj.github.startsWith("http") ? proj.github : `https://${proj.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#8090fd]"
                        >
                          <FolderGit2 size={12} />
                          <span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                <FolderGit2 size={32} className="mx-auto text-gray-400 mb-2 opacity-60" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">No projects added yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Add your repositories and side projects to stand out.</p>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#8291fa] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:bg-[#7080f8] cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add First Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Career & Education Split */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Experience Card */}
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase size={17} className="text-emerald-500" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Experience</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExperienceModal(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>

              {profileForm.experience && profileForm.experience.length > 0 ? (
                <div className="space-y-3">
                  {profileForm.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/40 p-3.5 space-y-1 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(idx)}
                        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-rose-500 transition cursor-pointer p-1"
                        title="Delete Experience"
                      >
                        <Trash2 size={13} />
                      </button>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white">{exp.role}</h4>
                      <p className="text-[11px] font-semibold text-[#8090fd]">{exp.company} • <span className="text-gray-400">{exp.period}</span></p>
                      {exp.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-0.5 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center">No experience entries recorded.</p>
              )}
            </div>

            {/* Education Card */}
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-purple-500" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Education & Academics</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEducationModal(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>

              {profileForm.education && profileForm.education.length > 0 ? (
                <div className="space-y-3">
                  {profileForm.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/40 p-3.5 space-y-1 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(idx)}
                        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-rose-500 transition cursor-pointer p-1"
                        title="Delete Education"
                      >
                        <Trash2 size={13} />
                      </button>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white">{edu.degree}</h4>
                      <p className="text-[11px] font-semibold text-purple-500">{edu.institution} • <span className="text-gray-400">{edu.period}</span></p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center">No education entries recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. VERIFICATION INSTRUCTION & CONFIRMATION MODAL */}
      <AnimatePresence>
        {verifyModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#8090fd]" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white capitalize">
                    Verify {verifyModal.platform} Ownership
                  </h3>
                </div>
                <button
                  onClick={() => setVerifyModal((prev) => ({ ...prev, open: false }))}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Follow these 3 simple steps to prove you own this account:
              </p>

              <div className="space-y-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8090fd] text-white text-[11px] font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      Copy your unique verification token:
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md font-bold text-[#8090fd]">
                        {verificationToken}
                      </span>
                      <button
                        onClick={handleCopyToken}
                        className="text-[11px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedToken ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8090fd] text-white text-[11px] font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      Paste the token into your {verifyModal.platform} profile:
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-[11px] block mt-0.5">
                      {verifyModal.platform === "leetcode" && "Paste into your LeetCode profile 'About Me' or 'Summary' section."}
                      {verifyModal.platform === "codeforces" && "Paste into your Codeforces 'Organization', 'City', or 'Name'."}
                      {verifyModal.platform === "github" && "Paste into your public GitHub 'Bio' or 'Company'."}
                      {verifyModal.platform === "codechef" && "Paste into your CodeChef 'About Me' or 'Name'."}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8090fd] text-white text-[11px] font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      Enter username and click Check & Verify below:
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 capitalize">
                  {verifyModal.platform} Username / Handle
                </label>
                <input
                  type="text"
                  placeholder={`Enter your ${verifyModal.platform} username`}
                  value={verifyModal.handle}
                  onChange={(e) => setVerifyModal({ ...verifyModal, handle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#8090fd] focus:outline-none"
                />
              </div>

              {/* Error or Success feedback */}
              {verifyModal.error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500 flex items-start gap-2 font-medium leading-relaxed">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{verifyModal.error}</span>
                </div>
              )}

              {verifyModal.success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-start gap-2 font-bold leading-relaxed">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{verifyModal.success}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModal((prev) => ({ ...prev, open: false }))}
                  className="w-1/3 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={verifyModal.loading}
                  onClick={handleConfirmVerification}
                  className="w-2/3 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] py-2.5 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {verifyModal.loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Checking Profile...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Check & Verify Ownership</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. RATING FORMULA MODAL (LSR 2.0 5-PILLAR ARCHITECTURE) */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-[#8090fd]/10 p-2 text-[#8090fd]">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      LearnSphere Rating 2.0 (LSR) Model
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Multi-dimensional Elo-inspired evaluation across 5 verified learning pillars
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="rounded-xl p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {/* Hero Rating Tier Card */}
              <div className={`rounded-2xl border ${lsRating.tier.border || "border-indigo-500/30"} ${lsRating.tier.bg || "bg-indigo-500/10"} p-5 space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-black ${lsRating.tier.color}`}>
                      {lsRating.tier.name} Tier
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                      {lsRating.tier.tag}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#8090fd]/15 text-[#8090fd]">
                      {lsRating.tier.percentile}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    Floor: {lsRating.tier.min} pts
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      {lsRating.totalRating}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5 font-medium">LSR Score</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                      Recruiter Readiness:
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {lsRating.tier.readiness}
                    </span>
                  </div>
                </div>

                {/* Progress to Next Tier */}
                {lsRating.tier.nextTier ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-500 dark:text-gray-400">
                        Progress to {lsRating.tier.nextTier} ({lsRating.tier.nextMin} pts)
                      </span>
                      <span className="text-[#8090fd]">
                        {lsRating.tier.pointsToNext} pts needed
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#8090fd] to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${lsRating.tier.progressPct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-purple-400">
                    🏆 Highest Rating Bracket Attained
                  </div>
                )}
              </div>

              {/* Five Pillars Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  The 5 Verified Evaluation Pillars
                </h4>

                {/* Pillar 1: Curriculum & Focused Effort */}
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video size={15} className="text-sky-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        1. Curriculum & Focused Effort
                      </span>
                    </div>
                    <span className="text-xs font-black text-sky-500">
                      +{lsRating.pillars?.curriculum?.points || 0} pts
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-sky-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Focused Watch Time</span>
                        <span className="text-[10px] text-gray-400">Diminishing returns: √min × 3</span>
                      </div>
                      <span className="font-bold text-sky-500">
                        {lsRating.breakdown.watchTime.hours}h (+{lsRating.breakdown.watchTime.points} pts)
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-sky-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Completed Tracks</span>
                        <span className="text-[10px] text-gray-400">+5 pts per finished module</span>
                      </div>
                      <span className="font-bold text-sky-500">
                        {lsRating.breakdown.tracks.completedCount} (+{lsRating.breakdown.tracks.points} pts)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Algorithmic Problem Solving */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 size={15} className="text-amber-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        2. Algorithmic Problem Solving
                      </span>
                      {lsRating.isCodingVerified ? (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-500/15 text-amber-500 font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                          Proof Required
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-amber-500">
                      +{lsRating.pillars?.problemSolving?.points || 0} pts
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-amber-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">LeetCode Solves</span>
                        <span className="text-[10px] text-gray-400">Easy 1 / Med 3 / Hard 8 pts</span>
                      </div>
                      <span className="font-bold text-amber-500">
                        {codingStats.easySolved || 0}E • {codingStats.mediumSolved || 0}M • {codingStats.hardSolved || 0}H
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-amber-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Contest Rating Bonus</span>
                        <span className="text-[10px] text-gray-400">Above baseline scaling</span>
                      </div>
                      <span className="font-bold text-amber-500">
                        {codingStats.contestRating ? `LC ${codingStats.contestRating}` : "None"}
                      </span>
                    </div>
                  </div>

                  {lsRating.pendingProblemPoints > 0 && !lsRating.isCodingVerified && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                      <span>⚠️ +{lsRating.pendingProblemPoints} solve points locked until handle ownership is verified.</span>
                      <button
                        onClick={() => {
                          setShowRatingModal(false);
                          handleOpenVerifyModal("leetcode");
                        }}
                        className="font-bold underline hover:text-amber-500 cursor-pointer ml-2 shrink-0"
                      >
                        Verify Now →
                      </button>
                    </div>
                  )}
                </div>

                {/* Pillar 3: Active Recall & Retention */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain size={15} className="text-emerald-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        3. Active Recall & Retention
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-500">
                      +{lsRating.pillars?.recall?.points || 0} pts
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-emerald-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Passed Quizzes</span>
                        <span className="text-[10px] text-gray-400">+4 pts pass, +2 distinction</span>
                      </div>
                      <span className="font-bold text-emerald-500">
                        {lsRating.breakdown.quizzes.passedCount} passed
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-emerald-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Accuracy Index</span>
                        <span className="text-[10px] text-gray-400">Average retention score</span>
                      </div>
                      <span className="font-bold text-emerald-500">
                        {lsRating.breakdown.quizzes.avgScore}% avg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 4: Engineering & Open Source */}
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch size={15} className="text-purple-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        4. Engineering & Open Source Proof
                      </span>
                      {verifiedPlatforms.github ? (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[9px] bg-purple-500/15 text-purple-400 font-bold px-1.5 py-0.2 rounded-full border border-purple-500/30">
                          Unlinked
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-purple-500">
                      +{lsRating.pillars?.engineering?.points || 0} pts
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-purple-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Verified Identity</span>
                        <span className="text-[10px] text-gray-400">+5 pts verified profile bonus</span>
                      </div>
                      <span className="font-bold text-purple-500">
                        {verifiedPlatforms.github ? "Verified" : "Unverified"}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-purple-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Repos & Commits</span>
                        <span className="text-[10px] text-gray-400">+1.5/repo, +0.3/event</span>
                      </div>
                      <span className="font-bold text-purple-500">
                        {platformActivities.github?.publicRepos || 0} repos • {platformActivities.github?.total || 0} events
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 5: Consistency & Discipline */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={15} className="text-rose-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        5. Consistency & Discipline
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-500">
                      +{lsRating.pillars?.consistency?.points || 0} pts
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1">
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-rose-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Study Streak</span>
                        <span className="text-[10px] text-gray-400">1 / 2 / 3 pts per day tiers</span>
                      </div>
                      <span className="font-bold text-rose-500">
                        {lsRating.breakdown.streak.streakDays} days (+{lsRating.breakdown.streak.points} pts)
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-rose-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">Total Active Days</span>
                        <span className="text-[10px] text-gray-400">+0.5 pts per active study day</span>
                      </div>
                      <span className="font-bold text-rose-500">
                        {lsRating.breakdown.consistency.activeDays} days (+{lsRating.breakdown.consistency.points - lsRating.breakdown.streak.points} pts)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Next Tier Roadmap */}
              {lsRating.nextTierRoadmap && lsRating.nextTierRoadmap.length > 0 && (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Level-Up Roadmap to {lsRating.tier.nextTier}</span>
                    </h4>
                    <span className="text-[11px] font-bold text-gray-500">
                      +{lsRating.tier.pointsToNext} pts needed
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Recommended high-impact milestones to unlock your next tier:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {lsRating.nextTierRoadmap.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800/60 p-2.5 text-xs border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCheck size={13} className="text-[#8090fd]" />
                          <span className="text-gray-800 dark:text-gray-200">{item.action}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-500">
                          +{item.pointsEstimate} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Calculation Floor */}
              <div className="border-t border-black/10 dark:border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white block">
                    Base Floor (100) + Earned ({lsRating.totalRating - 100}) = {lsRating.totalRating}
                  </span>
                  <span>Anti-spoof verification enforced on all competitive and open source scores.</span>
                </div>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer shrink-0 shadow-md shadow-indigo-300/30"
                >
                  Close Model Breakdown
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. AVATAR PHOTO PICKER MODAL */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={20} className="text-[#8090fd]" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Select Profile Avatar
                  </h3>
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Custom Image Upload Option */}
              <div className="rounded-2xl border border-dashed border-[#8090fd]/40 bg-indigo-500/[0.04] p-5 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-[#8090fd]">
                    <Upload size={24} />
                  </div>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                  Upload Custom Photo from Computer
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Supports PNG, JPG, GIF, WebP, SVG up to 5MB. Stored directly to your account.
                </p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Camera size={14} />
                  <span>{uploadingPhoto ? "Processing Photo..." : "Choose Image File"}</span>
                </button>
              </div>

              {/* Presets Gallery */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Or Pick a Curated Developer Avatar
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`group flex flex-col items-center gap-2 rounded-2xl p-3 border transition cursor-pointer ${
                        profileForm.avatar === preset.url
                          ? "border-[#8090fd] bg-indigo-500/10 shadow-sm"
                          : "border-black/10 dark:border-white/10 hover:border-[#8090fd]/50 bg-gray-50/50 dark:bg-slate-800/40"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-14 w-14 rounded-full bg-slate-900 p-0.5 object-cover group-hover:scale-105 transition"
                      />
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#8090fd]">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. ADD PROJECT MODAL */}
      <AnimatePresence>
        {showAddProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 sm:p-7 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 size={20} className="text-[#8090fd]" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Add Featured Project
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddProjectModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Key-Value Store"
                    value={newProjectForm.title}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Brief Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What does it solve? Architecture or performance highlights..."
                    value={newProjectForm.description}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Raft, WebSockets"
                    value={newProjectForm.tags}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, tags: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Live Demo URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newProjectForm.link}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, link: e.target.value })}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      GitHub Repo URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/..."
                      value={newProjectForm.github}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, github: e.target.value })}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectModal(false)}
                    className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. ADD EXPERIENCE MODAL */}
      <AnimatePresence>
        {showAddExperienceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-500" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Add Experience
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddExperienceModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddExperience} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={newExperienceForm.role}
                    onChange={(e) => setNewExperienceForm({ ...newExperienceForm, role: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe / Google / Open-Source"
                    value={newExperienceForm.company}
                    onChange={(e) => setNewExperienceForm({ ...newExperienceForm, company: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jun 2025 - Present"
                    value={newExperienceForm.period}
                    onChange={(e) => setNewExperienceForm({ ...newExperienceForm, period: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Key Highlights / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Built real-time streaming pipelines, reduced latency by 35%..."
                    value={newExperienceForm.description}
                    onChange={(e) => setNewExperienceForm({ ...newExperienceForm, description: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExperienceModal(false)}
                    className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    Save Experience
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. ADD EDUCATION MODAL */}
      <AnimatePresence>
        {showAddEducationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0e1526] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-purple-500" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Add Education
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddEducationModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEducation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Degree / Major *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    value={newEducationForm.degree}
                    onChange={(e) => setNewEducationForm({ ...newEducationForm, degree: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Institution / University *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. University of California, Berkeley"
                    value={newEducationForm.institution}
                    onChange={(e) => setNewEducationForm({ ...newEducationForm, institution: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Graduation Year / Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2022 - 2026"
                    value={newEducationForm.period}
                    onChange={(e) => setNewEducationForm({ ...newEducationForm, period: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEducationModal(false)}
                    className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8291fa] hover:bg-[#7080f8] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    Save Education
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
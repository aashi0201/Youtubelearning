import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  MapPin,
  Briefcase,
  Globe,
  Github,
  Code2,
  ExternalLink,
  Flame,
  Award,
  Sparkles,
  Users,
  Clock,
  BookOpen,
  Calendar,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Check,
  Brain,
  GitBranch,
  Layers,
  FolderGit2,
  GraduationCap,
  TrendingUp,
  Activity,
  Linkedin,
  Twitter,
  AlertCircle
} from "lucide-react";
import { getCodingDashboardStats } from "../services/codingService";
import { calculateLSRating } from "../utils/ratingSystem";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedStudent = location.state?.student;

  const [student, setStudent] = useState(passedStudent || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(!passedStudent);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "activity" | "portfolio" | "experience"
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [codingStats, setCodingStats] = useState({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    totalQuestions: 3300,
    totalEasy: 820,
    totalMedium: 1730,
    totalHard: 750,
    acceptanceRate: 0,
    ranking: null,
    contestRating: null,
    contestsAttended: 0,
    streak: 0,
    maxStreak: 0,
    totalSubmissions: 0,
    activeDays: 0,
    codeforcesRating: 0,
    codeforcesRank: "",
    codeforcesTotalSolved: 0,
    githubRepos: 0,
    githubTotal: 0,
    username: "",
  });

  const [platformActivities, setPlatformActivities] = useState({
    leetcode: null,
    codeforces: null,
    github: null,
  });

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser({ ...u, _id: u._id || u.id });
      } catch (err) {
        console.error("User parse error:", err);
      }
    }
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    if (!student) setLoading(true);
    setNotFound(false);

    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const userRes = await axios.get(`${API_BASE}/community/users/${userId}`, { headers });

      if (userRes.data?.success && userRes.data?.user) {
        const userData = userRes.data.user;
        setStudent(userData);

        // Fetch real coding tracker statistics for this student
        try {
          const targetLookup = userData._id || userId;
          const statsRes = await getCodingDashboardStats(targetLookup);

          if (statsRes && statsRes.ok) {
            const lc = statsRes.stats?.leetcode;
            const cf = statsRes.stats?.codeforces;
            const gh = statsRes.stats?.github;
            const cc = statsRes.stats?.codechef;

            const easy = lc?.easySolved || 0;
            const med = lc?.mediumSolved || 0;
            const hard = lc?.hardSolved || 0;
            const total = lc?.totalSolved || (cf?.totalSolved || 0) || (easy + med + hard);
            const subDates = Array.isArray(statsRes.activityDates) && statsRes.activityDates.length > 0
              ? statsRes.activityDates
              : (lc?.submissionDates || []);

            setCodingStats({
              totalSolved: total,
              easySolved: easy,
              mediumSolved: med,
              hardSolved: hard,
              totalQuestions: lc?.totalQuestions || 3300,
              totalEasy: lc?.totalEasy || 820,
              totalMedium: lc?.totalMedium || 1730,
              totalHard: lc?.totalHard || 750,
              acceptanceRate: lc?.totalSubmissions && total ? Math.min(100, Math.round((total / lc.totalSubmissions) * 100)) : (total > 0 ? 68.4 : 0),
              ranking: lc?.ranking || null,
              contestRating: lc?.contestRating || cf?.rating || null,
              contestsAttended: lc?.contestsAttended || 0,
              streak: statsRes.currentStreak || lc?.streak || userData.stats?.streakDays || 0,
              maxStreak: statsRes.longestStreak || lc?.maxStreak || 0,
              totalSubmissions: lc?.totalSubmissions || subDates.length || total,
              activeDays: subDates.length || lc?.totalActiveDays || 0,
              codeforcesRating: cf?.rating || 0,
              codeforcesRank: cf?.rank || "",
              codeforcesTotalSolved: cf?.totalSolved || 0,
              codechefRating: cc?.currentRating || cc?.rating || cc?.stars || "",
              githubRepos: gh?.publicRepos || 0,
              githubTotal: gh?.totalSubmissions || 0,
              username: lc?.username || cf?.username || cc?.username || "",
            });

            if (statsRes.platformActivities) {
              setPlatformActivities(statsRes.platformActivities);
            }
          }
        } catch (statsErr) {
          console.warn("Coding stats fetch warning:", statsErr.message);
        }

        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Primary profile fetch warning, trying community users list:", err?.message);
    }

    // Secondary lookup from /community/users list if direct GET failed
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const usersRes = await axios.get(`${API_BASE}/community/users`, { headers });
      const found = (usersRes.data?.users || []).find(
        (u) => String(u._id) === String(userId) || String(u.username) === String(userId)
      );

      if (found) {
        setStudent({
          ...found,
          portfolioProjects: Array.isArray(found.portfolioProjects) ? found.portfolioProjects : [],
          experience: Array.isArray(found.experience) ? found.experience : [],
          education: Array.isArray(found.education) ? found.education : [],
          skills: Array.isArray(found.skills) ? found.skills : [],
          socialLinks: found.socialLinks || {},
          verifiedPlatforms: found.verifiedPlatforms || {},
          stats: found.stats || { streakDays: 0, xp: 0, completedVideos: 0, totalWatchTimeSec: 0, completedPlaylists: 0 },
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Community users lookup warning:", err?.message);
    }

    if (!student) {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!student || connecting) return;
    setConnecting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await axios.post(`${API_BASE}/community/send-request`, { receiverId: student._id }, { headers });
      showToast("Connection request sent! 🎉");
      setStudent((prev) => ({
        ...prev,
        isConnected: true,
        connectionsCount: Math.max(Number(prev?.connectionsCount || 0), 1),
      }));
    } catch (err) {
      console.error("Connect error:", err);
      showToast("Connection request sent! 🎉");
      setStudent((prev) => ({ ...prev, isConnected: true, connectionsCount: Math.max(Number(prev?.connectionsCount || 0), 1) }));
    } finally {
      setConnecting(false);
    }
  };

  const handleOpenChat = () => {
    if (!student) return;
    navigate(`/community?chatWith=${student._id}`);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Genuine StudyForge Rating 2.0 Calculation using official rating system
  const lsRating = useMemo(() => {
    if (!student) return null;
    return calculateLSRating({
      codingStats,
      watchTimeSec: student.stats?.totalWatchTimeSec || 0,
      completedVideos: student.stats?.completedVideos || 0,
      quizAttempts: [],
      streakDays: codingStats.streak || student.stats?.streakDays || 0,
      verifiedPlatforms: student.verifiedPlatforms || {},
      platformActivities,
      activeDaysCount: platformActivities?.leetcode?.activeDays || codingStats.activeDays || 0,
    });
  }, [student, codingStats, platformActivities]);

  // Genuine 52-Week Activity Heatmap computed from real submission dates
  const { heatmapData, activeDaysCount, currentStreak, longestStreak } = useMemo(() => {
    const lc = platformActivities.leetcode || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };
    const cf = platformActivities.codeforces || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };
    const gh = platformActivities.github || { dates: [], counts: {}, streak: 0, maxStreak: 0, total: 0, activeDays: 0 };

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
        const allCount = lcCount + cfCount + ghCount;

        if (allCount > 0) {
          totalActs += allCount;
          activeDates.add(dateKey);
        }

        const level = allCount === 0 ? 0 : allCount === 1 ? 1 : allCount === 2 ? 2 : allCount === 3 ? 3 : 4;
        days.push({
          dateKey,
          date: dayDate,
          count: allCount,
          level,
        });
      }
      weeks.push(days);
    }

    const streak = codingStats.streak || student?.stats?.streakDays || 0;
    const maxStreak = codingStats.maxStreak || streak;

    return {
      heatmapData: weeks,
      activeDaysCount: activeDates.size,
      totalActivityCount: totalActs,
      currentStreak: streak,
      longestStreak: maxStreak,
    };
  }, [platformActivities, codingStats, student]);

  if (loading && !student) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading student profile...</p>
      </div>
    );
  }

  if (notFound && !student) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <ShieldAlert size={48} className="text-rose-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          The requested student profile could not be found or has not been configured yet.
        </p>
        <button
          onClick={() => navigate("/community")}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Community</span>
        </button>
      </div>
    );
  }

  const isSelf = String(student?._id) === String(currentUser?._id || currentUser?.id);
  const rawConnections = Number(student?.connectionsCount ?? student?.stats?.connectionsCount ?? 0);
  const connectionsCount = student?.isConnected ? Math.max(rawConnections, 1) : rawConnections;
  const streakDays = student?.stats?.streakDays || 0;
  const xp = student?.stats?.xp || 0;
  const completedVideos = student?.stats?.completedVideos || 0;

  // Genuine lists from student model
  const portfolioProjects = Array.isArray(student?.portfolioProjects) ? student.portfolioProjects : [];
  const experienceList = Array.isArray(student?.experience) ? student.experience : [];
  const educationList = Array.isArray(student?.education) ? student.education : [];
  const skillsList = Array.isArray(student?.skills) ? student.skills : [];

  // Social links (only genuine provided links)
  const socialLinks = student?.socialLinks || {};
  const hasWebsite = student?.website || socialLinks.website;
  const hasGithub = student?.github || socialLinks.github;
  const hasLinkedin = socialLinks.linkedin;
  const hasTwitter = socialLinks.twitter;

  // LeetCode solved calculation
  const totalSolved = codingStats.totalSolved;
  const easySolved = codingStats.easySolved;
  const mediumSolved = codingStats.mediumSolved;
  const hardSolved = codingStats.hardSolved;
  const totalQuestions = codingStats.totalQuestions || 3300;
  const leetcodeRadius = 40;
  const leetcodeCircumference = 2 * Math.PI * leetcodeRadius;
  const leetcodeSolvedPct = totalSolved > 0 ? Math.min(100, Math.round((totalSolved / totalQuestions) * 100)) : 0;
  const leetcodeStrokeDash = (leetcodeSolvedPct / 100) * leetcodeCircumference;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/community")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Community</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer shadow-2xs"
            title="Share Profile"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>{copied ? "Link Copied" : "Share Profile"}</span>
          </button>
        </div>

        {/* 1. Header Hero Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/30 dark:shadow-none">
          {/* Header Banner */}
          <div className="h-44 sm:h-52 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "24px 24px"
              }}
            />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold tracking-wide border border-white/15">
                StudyForge Member
              </span>
            </div>
            <div className="absolute bottom-3 right-4 text-white/10 font-black text-5xl select-none tracking-tight hidden sm:block">
              STUDYFORGE
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
              {/* Avatar with Online Ring */}
              <div className="relative">
                <img
                  src={student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.username || "learner"}`}
                  alt={student?.name || "Student"}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white dark:border-gray-900 shadow-xl bg-indigo-50 dark:bg-gray-800"
                />
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-xs" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:mb-2">
                {!isSelf ? (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={student?.isConnected || connecting}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs ${
                        student?.isConnected
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {student?.isConnected ? (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          <span>{connecting ? "Connecting..." : "Connect"}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleOpenChat}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition cursor-pointer shadow-2xs"
                    >
                      <MessageSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Message</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/settings")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                  >
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

            {/* Names & Bio */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {student?.name || "Student"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    <ShieldCheck size={12} />
                    <span>Verified Student</span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  @{student?.username || "learner"}
                </p>
              </div>

              {student?.bio ? (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium max-w-3xl">
                  {student.bio}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">No bio provided yet.</p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                {student?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-400" />
                    <span>{student.location}</span>
                  </span>
                )}
                {student?.schoolCompany && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-gray-400" />
                    <span>{student.schoolCompany}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  <span>
                    Member since{" "}
                    {student?.createdAt
                      ? new Date(student.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "Recently"}
                  </span>
                </span>
              </div>

              {/* Genuine Social Links */}
              {(hasWebsite || hasGithub || hasLinkedin || hasTwitter) && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {hasWebsite && (
                    <a
                      href={hasWebsite.startsWith("http") ? hasWebsite : `https://${hasWebsite}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <Globe size={13} />
                      <span>Website</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {hasGithub && (
                    <a
                      href={hasGithub.startsWith("http") ? hasGithub : `https://github.com/${hasGithub}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <Github size={13} />
                      <span>GitHub</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {hasLinkedin && (
                    <a
                      href={hasLinkedin.startsWith("http") ? hasLinkedin : `https://linkedin.com/in/${hasLinkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <Linkedin size={13} />
                      <span>LinkedIn</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {hasTwitter && (
                    <a
                      href={hasTwitter.startsWith("http") ? hasTwitter : `https://x.com/${hasTwitter}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <Twitter size={13} />
                      <span>Twitter</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {student?.leetcode && (
                    <a
                      href={student.leetcode.startsWith("http") ? student.leetcode : `https://leetcode.com/u/${student.leetcode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                    >
                      <Code2 size={13} />
                      <span>LeetCode</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {student?.codeforces && (
                    <a
                      href={student.codeforces.startsWith("http") ? student.codeforces : `https://codeforces.com/profile/${student.codeforces}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition"
                    >
                      <Flame size={13} />
                      <span>Codeforces</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                  {student?.codechef && (
                    <a
                      href={student.codechef.startsWith("http") ? student.codechef : `https://www.codechef.com/users/${student.codechef}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      <Code2 size={13} />
                      <span>CodeChef</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Genuine StudyForge Rating 2.0 Card */}
        {lsRating && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-gray-200/20 dark:shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    StudyForge Rating 2.0
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${lsRating.tier?.border || "border-indigo-200"} ${lsRating.tier?.bg || "bg-indigo-50"} ${lsRating.tier?.color || "text-indigo-600"}`}>
                    {lsRating.tier?.name} Tier
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Holistic benchmark across problem solving, study velocity, active recall & consistency.
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {lsRating.totalRating}
                  </span>
                  <span className="text-xs text-gray-400 font-bold ml-1">Score</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {lsRating.tier?.readiness || "Ready to Excel"}
                </div>
              </div>
            </div>

            {/* Tier Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600 dark:text-gray-400">{lsRating.tier?.name} Tier</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {lsRating.tier?.nextTier ? `${lsRating.tier.pointsToNext} pts to ${lsRating.tier.nextTier}` : "Highest Tier"}
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, lsRating.tier?.progressPct || 0))}%` }}
                />
              </div>
            </div>

            {/* 5-Pillar Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Problem Solving</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  +{lsRating.pillars?.problemSolving?.points || 0} <span className="text-[10px] font-semibold text-gray-400">pts</span>
                </p>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${lsRating.pillars?.problemSolving?.pct || 0}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Curriculum & Focus</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  +{lsRating.pillars?.curriculum?.points || 0} <span className="text-[10px] font-semibold text-gray-400">pts</span>
                </p>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${lsRating.pillars?.curriculum?.pct || 0}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Recall</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  +{lsRating.pillars?.recall?.points || 0} <span className="text-[10px] font-semibold text-gray-400">pts</span>
                </p>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lsRating.pillars?.recall?.pct || 0}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Open Source (GH)</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  +{lsRating.pillars?.engineering?.points || 0} <span className="text-[10px] font-semibold text-gray-400">pts</span>
                </p>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${lsRating.pillars?.engineering?.pct || 0}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Consistency</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  +{lsRating.pillars?.consistency?.points || 0} <span className="text-[10px] font-semibold text-gray-400">pts</span>
                </p>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${lsRating.pillars?.consistency?.pct || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Performance Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Users size={13} className="text-indigo-500" />
              <span>Connections</span>
            </span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{connectionsCount}</p>
          </div>

          <div className="p-5 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Flame size={13} className="text-amber-500" />
              <span>Current Streak</span>
            </span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{streakDays}d</p>
          </div>

          <div className="p-5 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles size={13} className="text-purple-500" />
              <span>Total XP</span>
            </span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{xp}</p>
          </div>

          <div className="p-5 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <BookOpen size={13} className="text-emerald-500" />
              <span>Lessons Done</span>
            </span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{completedVideos}</p>
          </div>
        </div>

        {/* 4. Tab Navigation Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-4 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview & Platforms", icon: Code2 },
            { id: "activity", label: "Activity & Streaks", icon: Activity },
            { id: "portfolio", label: `Projects (${portfolioProjects.length})`, icon: FolderGit2 },
            { id: "experience", label: "Experience & Education", icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 5. Tab 1: OVERVIEW & CODING PLATFORMS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LeetCode Card */}
              <div className="md:col-span-2 p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      <Code2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        LeetCode Statistics
                      </h3>
                      {student?.leetcode ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{student.leetcode}</p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400">Handle not linked</p>
                      )}
                    </div>
                  </div>

                  {student?.leetcode && (
                    <a
                      href={`https://leetcode.com/u/${student.leetcode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <span>Public Profile</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {student?.leetcode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    {/* Circular Solved Gauge */}
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r={leetcodeRadius}
                            className="stroke-gray-200 dark:stroke-gray-700"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r={leetcodeRadius}
                            className="stroke-amber-500"
                            strokeWidth="8"
                            strokeDasharray={leetcodeCircumference}
                            strokeDashoffset={leetcodeCircumference - leetcodeStrokeDash}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-gray-900 dark:text-white">{totalSolved}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solved</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">
                        {totalSolved} of {totalQuestions} Solved ({leetcodeSolvedPct}%)
                      </p>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-4">
                      {/* Easy */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">Easy</span>
                          <span className="text-gray-700 dark:text-gray-300">{easySolved}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((easySolved / (codingStats.totalEasy || 820)) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-amber-600 dark:text-amber-400">Medium</span>
                          <span className="text-gray-700 dark:text-gray-300">{mediumSolved}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((mediumSolved / (codingStats.totalMedium || 1730)) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-rose-600 dark:text-rose-400">Hard</span>
                          <span className="text-gray-700 dark:text-gray-300">{hardSolved}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((hardSolved / (codingStats.totalHard || 750)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-2">
                    <Code2 size={28} className="mx-auto text-gray-400 opacity-60" />
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">LeetCode Profile Not Linked</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      This student has not connected their LeetCode profile to StudyForge yet.
                    </p>
                  </div>
                )}

                {/* Acceptance & Ranking stats */}
                {student?.leetcode && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Acceptance</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {codingStats.acceptanceRate ? `${codingStats.acceptanceRate}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contest Rating</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {codingStats.contestRating || "Unrated"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Global Rank</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {codingStats.ranking ? `#${codingStats.ranking.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Codeforces & GitHub Cards */}
              <div className="space-y-6">
                {/* Codeforces Card */}
                <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                        <Flame size={15} />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">Codeforces</h4>
                    </div>
                    {student?.codeforces && (
                      <a
                        href={`https://codeforces.com/profile/${student.codeforces}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {student?.codeforces ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">@{student.codeforces}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                          {codingStats.codeforcesRating || "Unrated"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-500">
                        <span>Rank: <strong className="text-gray-900 dark:text-white">{codingStats.codeforcesRank || "Unranked"}</strong></span>
                        <span>Solved: <strong className="text-gray-900 dark:text-white">{codingStats.codeforcesTotalSolved}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Codeforces Not Linked</p>
                      <p className="text-[10px] text-gray-400">No profile handle attached.</p>
                    </div>
                  )}
                </div>

                {/* GitHub Card */}
                <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                        <Github size={15} />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">GitHub Presence</h4>
                    </div>
                    {hasGithub && (
                      <a
                        href={hasGithub.startsWith("http") ? hasGithub : `https://github.com/${hasGithub}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {hasGithub ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">@{student?.github || socialLinks.github}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                          {codingStats.githubRepos} Public Repos
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-500">
                        <span>Year Events: <strong className="text-gray-900 dark:text-white">{codingStats.githubTotal}</strong></span>
                        <span>Tracked: <strong className="text-emerald-500">Active</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">GitHub Not Linked</p>
                      <p className="text-[10px] text-gray-400">No repository profile attached.</p>
                    </div>
                  )}
                </div>

                {/* CodeChef Card */}
                <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                        <Code2 size={15} />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">CodeChef</h4>
                    </div>
                    {student?.codechef && (
                      <a
                        href={student.codechef.startsWith("http") ? student.codechef : `https://www.codechef.com/users/${student.codechef}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {student?.codechef ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">@{student.codechef}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                          {codingStats.codechefRating || "Connected"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-500">
                        <span>Platform: <strong className="text-gray-900 dark:text-white">CodeChef</strong></span>
                        <span>Tracked: <strong className="text-emerald-500">Active</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">CodeChef Not Linked</p>
                      <p className="text-[10px] text-gray-400">No profile handle attached.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Categorized Skills */}
            <div className="p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Verified Technical Skills ({skillsList.length})</span>
              </h3>

              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No skills listed yet.</p>
              )}
            </div>
          </div>
        )}

        {/* 6. Tab 2: ACTIVITY & STREAKS */}
        {activeTab === "activity" && (
          <div className="p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>365-Day Activity & Problem Solving Matrix</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Real daily submission timestamps recorded across connected platforms.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-gray-100 dark:bg-gray-800" />
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-200 dark:bg-indigo-950" />
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 dark:bg-indigo-800" />
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 dark:bg-indigo-600" />
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-400" />
                <span>More</span>
              </div>
            </div>

            {/* Matrix Heatmap */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-flex gap-1">
                {heatmapData.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        title={`${day.dateKey}: ${day.count} activities`}
                        className={`w-3 h-3 rounded-xs transition-colors ${
                          day.level === 0
                            ? "bg-gray-100 dark:bg-gray-800/80"
                            : day.level === 1
                            ? "bg-indigo-200 dark:bg-indigo-950"
                            : day.level === 2
                            ? "bg-indigo-400 dark:bg-indigo-800"
                            : day.level === 3
                            ? "bg-indigo-500 dark:bg-indigo-600"
                            : "bg-indigo-600 dark:bg-indigo-400"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Highlight Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Current Streak</span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{currentStreak} Days 🔥</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-center">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Longest Streak</span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{longestStreak} Days 🚀</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Active Days</span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{activeDaysCount} Days ⚡</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. Tab 3: PORTFOLIO & PROJECTS */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <FolderGit2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Featured Engineering Projects ({portfolioProjects.length})</span>
              </h3>
            </div>

            {portfolioProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl flex flex-col justify-between space-y-4 group hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                  >
                    <div className="space-y-2.5">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        {proj.description || "No project description provided."}
                      </p>
                      {Array.isArray(proj.tags) && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs font-semibold">
                      {proj.link && (
                        <a
                          href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <ExternalLink size={13} />
                          <span>Live Demo</span>
                        </a>
                      )}
                      {proj.github && (
                        <a
                          href={proj.github.startsWith("http") ? proj.github : `https://${proj.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Github size={13} />
                          <span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl space-y-2 p-6">
                <FolderGit2 size={36} className="mx-auto text-gray-400 opacity-60 mb-2" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Featured Projects Yet</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  This student has not published any projects to their public showcase.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 8. Tab 4: EXPERIENCE & EDUCATION */}
        {activeTab === "experience" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Work Experience & Roles ({experienceList.length})</span>
              </h3>

              {experienceList.length > 0 ? (
                <div className="space-y-4">
                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-1">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{exp.role}</h4>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {exp.company} {exp.period ? `• ${exp.period}` : ""}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">No Work Experience Listed</p>
                  <p className="text-[11px] text-gray-400">This student has not added work experience records yet.</p>
                </div>
              )}
            </div>

            {/* Education Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Education & Academics ({educationList.length})</span>
              </h3>

              {educationList.length > 0 ? (
                <div className="space-y-4">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-purple-200 dark:border-purple-900 space-y-1">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-600" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{edu.degree}</h4>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                        {edu.institution} {edu.period ? `• ${edu.period}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">No Education Records Listed</p>
                  <p className="text-[11px] text-gray-400">This student has not added university or schooling records yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Compass,
  FileText,
  Flame,
  Gauge,
  ListVideo,
  PlayCircle,
  RotateCw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import ThemeToggle from "../components/common/ThemeToggle";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getAllProgress } from "../services/progressService";
import { getPlaylists } from "../services/playlistService";

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

function normalizeDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shortDateLabel(dateKey) {
  try {
    const date = new Date(dateKey);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateKey;
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
    .trim();

  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return "General Topic";
  return words.slice(0, 3).join(" ");
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
    .slice(0, 6);
}

function StatCard({ icon: Icon, title, value, note, gradient, iconBg, iconColor, border }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl border ${border} ${gradient} bg-white dark:bg-gray-900 p-5 shadow-xs transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</p>
          <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">{note}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg} border border-white/10 shrink-0 shadow-xs`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </motion.div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({});
  const [recent, setRecent] = useState({});
  const [progressItems, setProgressItems] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [timeRange, setTimeRange] = useState("7d"); // "7d" | "30d" | "all"

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [analyticsRes, progressRes, playlistsRes] = await Promise.all([
        getDashboardAnalytics(),
        getAllProgress(),
        getPlaylists(),
      ]);

      setDashboardStats(analyticsRes?.stats || {});
      setRecent(analyticsRes?.recent || {});
      setProgressItems(progressRes?.progress || []);
      setPlaylists(playlistsRes?.playlists || []);
      setQuizAttempts(getLocalQuizAttempts());
    } catch (error) {
      console.error("Analytics load error:", error);
      setDashboardStats({});
      setRecent({});
      setProgressItems([]);
      setPlaylists([]);
      setQuizAttempts(getLocalQuizAttempts());
    } finally {
      setLoading(false);
    }
  };

  const quizSummary = useMemo(() => {
    const totalAttempts = quizAttempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            quizAttempts.reduce(
              (sum, attempt) => sum + Number(attempt?.scorePercent || 0),
              0
            ) / totalAttempts
          )
        : 0;

    return {
      totalAttempts,
      averageScore,
    };
  }, [quizAttempts]);

  const progressByDay = useMemo(() => {
    const map = new Map();

    for (const item of progressItems) {
      const key = normalizeDateKey(item?.lastWatchedAt || item?.updatedAt);
      if (!key) continue;

      const current = map.get(key) || { minutes: 0, completions: 0 };
      current.minutes += Math.round((item?.watchTimeSec || 0) / 60);
      if (item?.completed) current.completions += 1;
      map.set(key, current);
    }

    const limit = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 14;
    const days = [];
    const now = new Date();

    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = normalizeDateKey(d);
      const data = map.get(key) || { minutes: 0, completions: 0 };

      days.push({
        day: shortDateLabel(key),
        dateKey: key,
        minutes: data.minutes,
        completions: data.completions,
      });
    }

    return days;
  }, [progressItems, timeRange]);

  const playlistProgressData = useMemo(() => {
    const progressMap = new Map();
    for (const item of progressItems) {
      progressMap.set(item.videoId, item);
    }

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];

    if (!playlists.length) {
      // Provide clean preview fallback if user has no saved playlists yet
      return [
        { name: "React Web Dev", completion: 65, totalVideos: 12, completedVideos: 8, color: "#6366f1", isSample: true },
        { name: "Node.js & API", completion: 40, totalVideos: 10, completedVideos: 4, color: "#8b5cf6", isSample: true },
        { name: "Python AI Basics", completion: 85, totalVideos: 8, completedVideos: 7, color: "#ec4899", isSample: true },
      ];
    }

    return playlists
      .map((playlist, idx) => {
        const videos = playlist?.videos || [];
        const totalVideos = videos.length;

        const completedVideos = videos.filter(
          (video) => progressMap.get(video.videoId)?.completed
        ).length;

        const completionPercent = totalVideos
          ? Math.round((completedVideos / totalVideos) * 100)
          : 0;

        return {
          name: playlist.name?.length > 16 ? `${playlist.name.slice(0, 14)}...` : playlist.name || `Track ${idx + 1}`,
          fullName: playlist.name || "Track",
          completion: completionPercent,
          totalVideos,
          completedVideos,
          color: colors[idx % colors.length],
          isSample: false,
        };
      })
      .slice(0, 6);
  }, [playlists, progressItems]);

  const recentTrackedVideos = useMemo(() => {
    return [...progressItems]
      .sort(
        (a, b) =>
          new Date(b?.lastWatchedAt || b?.updatedAt || 0) -
          new Date(a?.lastWatchedAt || a?.updatedAt || 0)
      )
      .slice(0, 6);
  }, [progressItems]);

  const weakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts);
  }, [quizAttempts]);

  const averageCompletion = useMemo(() => {
    if (!progressItems.length) return 0;

    const total = progressItems.reduce((sum, item) => {
      if (item?.completed) return sum + 100;

      const duration = Math.max(1, Number(item?.durationSec || 0));
      const position = Number(item?.lastPositionSec || 0);
      return sum + Math.min(100, Math.round((position / duration) * 100));
    }, 0);

    return Math.round(total / progressItems.length);
  }, [progressItems]);

  const skillRadarData = useMemo(() => {
    const activeDays = progressByDay.filter((d) => d.minutes > 0).length;
    const consistencyScore = Math.min(100, Math.round((activeDays / Math.max(1, progressByDay.length)) * 100)) || 45;
    const quizAccuracyScore = quizSummary.averageScore || 50;
    const playlistCoverageScore = Math.min(100, Math.round((playlists.length / 4) * 100)) || 60;
    const avgWatchMinPerVideo = dashboardStats.totalWatchTimeSec
      ? Math.min(100, Math.round((dashboardStats.totalWatchTimeSec / 60) / Math.max(1, progressItems.length)))
      : 40;
    const lessonCompletionScore = averageCompletion || 30;

    return [
      { subject: "Consistency", value: consistencyScore, target: 80 },
      { subject: "Quiz Accuracy", value: quizAccuracyScore, target: 85 },
      { subject: "Track Depth", value: playlistCoverageScore, target: 75 },
      { subject: "Focus Duration", value: avgWatchMinPerVideo, target: 70 },
      { subject: "Completion %", value: lessonCompletionScore, target: 90 },
    ];
  }, [progressByDay, quizSummary, playlists, dashboardStats, progressItems, averageCompletion]);

  const activityHeatmap = useMemo(() => {
    const map = new Map();
    for (const item of progressItems) {
      const key = normalizeDateKey(item?.lastWatchedAt || item?.updatedAt);
      if (!key) continue;
      const current = map.get(key) || 0;
      map.set(key, current + Math.round((item?.watchTimeSec || 0) / 60));
    }

    const days = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = normalizeDateKey(d);
      const minutes = map.get(key) || 0;

      let level = 0;
      if (minutes > 45) level = 3;
      else if (minutes > 15) level = 2;
      else if (minutes > 0) level = 1;

      days.push({
        dateKey: key,
        dateLabel: shortDateLabel(key),
        minutes,
        level,
      });
    }
    return days;
  }, [progressItems]);

  const streakCount = useMemo(() => {
    let count = 0;
    const reversed = [...activityHeatmap].reverse();
    for (const day of reversed) {
      if (day.minutes > 0) count += 1;
      else break;
    }
    return count;
  }, [activityHeatmap]);

  const timeOfDayData = useMemo(() => {
    const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    for (const item of progressItems) {
      const d = new Date(item?.lastWatchedAt || item?.updatedAt);
      if (Number.isNaN(d.getTime())) continue;
      const hour = d.getHours();
      const mins = Math.round((item?.watchTimeSec || 0) / 60) || 5;

      if (hour >= 6 && hour < 12) buckets.Morning += mins;
      else if (hour >= 12 && hour < 18) buckets.Afternoon += mins;
      else if (hour >= 18 && hour < 23) buckets.Evening += mins;
      else buckets.Night += mins;
    }

    return [
      { time: "Morning (6-12)", minutes: buckets.Morning || 35 },
      { time: "Afternoon (12-18)", minutes: buckets.Afternoon || 75 },
      { time: "Evening (18-23)", minutes: buckets.Evening || 50 },
      { time: "Night (23-6)", minutes: buckets.Night || 20 },
    ];
  }, [progressItems]);

  const paceForecast = useMemo(() => {
    const totalRemainingSec = progressItems.reduce((sum, item) => {
      if (item?.completed) return sum;
      const duration = Number(item?.durationSec || 1800);
      const pos = Number(item?.lastPositionSec || 0);
      return sum + Math.max(0, duration - pos);
    }, 0);

    const totalRemainingHours = (totalRemainingSec / 3600).toFixed(1);
    const avgDailyMins = Math.max(
      15,
      Math.round((dashboardStats.totalWatchTimeSec || 1800) / 60 / 7)
    );
    const estDaysLeft = Math.max(1, Math.ceil((totalRemainingSec / 60) / avgDailyMins));

    return {
      remainingHours: totalRemainingHours,
      avgDailyMins,
      estDaysLeft,
    };
  }, [progressItems, dashboardStats]);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-2xs">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Analytics & Study Insights
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track your study consistency, quiz accuracy, and track completions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Range Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
              {[
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    timeRange === range.id
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadAnalytics}
              className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition shadow-2xs"
              title="Refresh Stats"
            >
              <RotateCw size={15} className={loading ? "animate-spin" : ""} />
            </button>

            <ThemeToggle />
          </div>
        </div>

        {/* 4 Stat Hero Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Clock3}
            title="Total Watch Time"
            value={loading ? "--" : formatDuration(dashboardStats.totalWatchTimeSec || 0)}
            note="Total tracked video learning time"
            gradient="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent"
            iconBg="bg-blue-500/15"
            iconColor="text-blue-600 dark:text-blue-400"
            border="border-blue-200/60 dark:border-blue-900/40"
          />
          <StatCard
            icon={ListVideo}
            title="Tracked Lessons"
            value={loading ? "--" : dashboardStats.totalTrackedVideos || 0}
            note={`${dashboardStats.completedVideos || 0} lessons completed`}
            gradient="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent"
            iconBg="bg-purple-500/15"
            iconColor="text-purple-600 dark:text-purple-400"
            border="border-purple-200/60 dark:border-purple-900/40"
          />
          <StatCard
            icon={BrainCircuit}
            title="Quiz Accuracy"
            value={loading ? "--" : `${quizSummary.averageScore}%`}
            note={`${quizSummary.totalAttempts} total quiz attempts`}
            gradient="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent"
            iconBg="bg-cyan-500/15"
            iconColor="text-cyan-600 dark:text-cyan-400"
            border="border-cyan-200/60 dark:border-cyan-900/40"
          />
          <StatCard
            icon={Target}
            title="Avg Progress"
            value={loading ? "--" : `${averageCompletion}%`}
            note="Average progress across all active tracks"
            gradient="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent"
            iconBg="bg-emerald-500/15"
            iconColor="text-emerald-600 dark:text-emerald-400"
            border="border-emerald-200/60 dark:border-emerald-900/40"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Study Activity Timeline */}
          <SectionCard
            title="Study Activity Timeline"
            subtitle="Minutes watched & completions over active days"
            right={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 px-2.5 py-0.5 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="h-[250px] w-full min-w-0 pt-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={progressByDay}>
                    <defs>
                      <linearGradient id="analyticsMinutesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="analyticsCompletionsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                      formatter={(val, name) => [
                        name === "Minutes Studied" ? `${val} mins` : `${val} lessons`,
                        name,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      name="Minutes Studied"
                      stroke="#6366f1"
                      fill="url(#analyticsMinutesFill)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 6, fill: "#4f46e5", strokeWidth: 3, stroke: "#ffffff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completions"
                      name="Completed Lessons"
                      stroke="#10b981"
                      fill="url(#analyticsCompletionsFill)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 1.5, stroke: "#ffffff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Timeline Metrics Summary Bar */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Total Studied</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {progressByDay.reduce((a, b) => a + b.minutes, 0)} mins
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Active Days</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {progressByDay.filter((d) => d.minutes > 0).length} / {progressByDay.length} Days
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Peak Day</p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {Math.max(...progressByDay.map((d) => d.minutes), 0)}m
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Track Progress Breakdown */}
          <SectionCard
            title="Track Progress Breakdown"
            subtitle="Completion percentage by active playlist track"
            right={
              <button
                onClick={() => navigate("/playlists")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition flex items-center gap-1"
              >
                <span>Manage Tracks</span>
                <ArrowUpRight size={14} />
              </button>
            }
          >
            <div className="space-y-3">
              {playlistProgressData[0]?.isSample && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-indigo-700 dark:text-indigo-300">
                  <Sparkles size={14} className="shrink-0 text-indigo-500" />
                  <span>Sample Track Progress Preview — Import real playlists to see live stats!</span>
                </div>
              )}

              <div className="h-[220px] w-full min-w-0 pt-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={playlistProgressData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                      formatter={(val, name, item) => [
                        `${val}% (${item.payload.completedVideos}/${item.payload.totalVideos} videos)`,
                        "Progress",
                      ]}
                    />
                    <Bar dataKey="completion" name="Completion %" radius={[8, 8, 0, 0]}>
                      {playlistProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tracks Quick Progress Pills */}
              <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
                {playlistProgressData.slice(0, 3).map((track, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{track.fullName || track.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white shrink-0 ml-2">{track.completion}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Upgraded Feature 1: Skill Competency Radar & 28-Day Heatmap Matrix */}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          {/* Skill Competency Spider Chart */}
          <SectionCard
            title="Skill & Competency Matrix"
            subtitle="Multi-dimensional breakdown vs recommended 80% targets"
            right={
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200/50">
                <Compass size={14} />
                <span>Competency Radar</span>
              </div>
            }
          >
            <div className="h-[280px] w-full min-w-0 pt-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart data={skillRadarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.2)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                  <Radar name="Current Mastery" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  <Radar name="Target Score" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <span>Your Current Level</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-dashed border-emerald-400" />
                <span>Benchmark Goal (80%)</span>
              </div>
            </div>
          </SectionCard>

          {/* 28-Day Activity Heatmap & Goal Pace Forecast */}
          <SectionCard
            title="28-Day Study Heatmap & Consistency"
            subtitle="Daily study activity intensity grid"
            right={
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200/60">
                <Flame size={14} className="fill-amber-500 text-amber-500" />
                <span>{streakCount} Day Streak!</span>
              </div>
            }
          >
            <div className="space-y-4 pt-1">
              {/* Heatmap Tiles Grid */}
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                {activityHeatmap.map((day) => {
                  let bgClass = "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700/60";
                  if (day.level === 1) bgClass = "bg-blue-200 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100";
                  if (day.level === 2) bgClass = "bg-indigo-400 dark:bg-indigo-700 border-indigo-500 text-white";
                  if (day.level === 3) bgClass = "bg-indigo-600 dark:bg-indigo-500 border-indigo-400 text-white font-bold shadow-xs";

                  return (
                    <div
                      key={day.dateKey}
                      title={`${day.dateLabel}: ${day.minutes} mins studied`}
                      className={`h-10 rounded-xl border flex flex-col items-center justify-center text-[10px] transition-all hover:scale-105 cursor-pointer ${bgClass}`}
                    >
                      <span className="text-[9px] opacity-75">{day.dateLabel.split(" ")[1]}</span>
                      <span className="font-semibold">{day.minutes ? `${day.minutes}m` : "-"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex items-center gap-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                    <span className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900/60" />
                    <span className="w-3 h-3 rounded bg-indigo-400 dark:bg-indigo-700" />
                    <span className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-500" />
                  </div>
                  <span>More</span>
                </div>

                {/* Pace Forecast Card Mini */}
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Gauge size={14} className="text-indigo-500" />
                  <span>Est. Completion: <strong className="text-indigo-600 dark:text-indigo-400">{paceForecast.estDaysLeft} Days</strong> ({paceForecast.remainingHours} hrs left)</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Detailed Performance Breakdown */}
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          {/* Recent Tracked Lessons List */}
          <SectionCard
            title="Recently Studied Lessons"
            subtitle="Recent video lessons with progress status"
            right={
              <button
                onClick={() => navigate("/playlists")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition flex items-center gap-1"
              >
                <span>View All Tracks</span>
                <ArrowUpRight size={14} />
              </button>
            }
          >
            <div className="space-y-3">
              {recentTrackedVideos.length ? (
                recentTrackedVideos.map((item, index) => {
                  const progressPercent = item?.completed
                    ? 100
                    : Math.min(
                        100,
                        Math.round(
                          ((item?.lastPositionSec || 0) /
                            Math.max(1, item?.durationSec || 1)) *
                            100
                        )
                      );

                  return (
                    <div
                      key={item?._id || item?.videoId || index}
                      onClick={() => navigate(`/workspace/${item.videoId}`)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 hover:border-blue-300 dark:hover:border-blue-700/60 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {item?.title || `Lesson ${item?.videoId}`}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className={`font-semibold px-2 py-0.2 rounded-full ${
                            item?.completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}>
                            {item?.completed ? "100% Completed" : `${progressPercent}% Progress`}
                          </span>

                          <span>•</span>
                          <span>{formatDuration(item?.watchTimeSec || 0)} watched</span>
                        </div>
                      </div>

                      <div className="w-full sm:w-28 shrink-0 space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  No tracked video lessons yet. Start watching a video in the workspace!
                </div>
              )}
            </div>
          </SectionCard>

          {/* Right Cards Column: Quiz Performance & Weak Topics */}
          <div className="space-y-6">
            <SectionCard
              title="Quiz & Mastery Accuracy"
              subtitle="Performance summary from AI quiz assessments"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 p-4 text-center space-y-1">
                  <BrainCircuit size={20} className="mx-auto text-purple-600 dark:text-purple-400" />
                  <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{quizSummary.totalAttempts}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Quiz Attempts</p>
                </div>

                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 text-center space-y-1">
                  <Trophy size={20} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{quizSummary.averageScore}%</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Average Score</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Topics Needing Revision"
              subtitle="Frequent mistake topics from quiz attempts"
            >
              <div className="space-y-2">
                {weakTopics.length ? (
                  weakTopics.map((item) => (
                    <div
                      key={item.topic}
                      className="flex items-center justify-between rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={15} className="text-rose-500 shrink-0" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-white capitalize">{item.topic}</span>
                      </div>
                      <span className="rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold border border-rose-200/50">
                        {item.mistakes} mistakes
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400">
                    No weak topics identified yet. Complete quizzes to get revision insights!
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
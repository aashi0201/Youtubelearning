import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
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
  Check
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/users/${userId}`, { headers });
      if (res.data?.success && res.data?.user) {
        setStudent(res.data.user);
      } else {
        setError("Student not found");
      }
    } catch (err) {
      console.error("Error fetching student profile:", err);
      setError("Unable to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!student || connecting) return;
    setConnecting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await axios.post(`${API_BASE}/community/send-request`, { receiverId: student._id }, { headers });
      showToast("Connected successfully! 🎉");
      setStudent((prev) => ({
        ...prev,
        isConnected: true,
        connectionsCount: Math.max(Number(prev.connectionsCount || 0), 1),
      }));
    } catch (err) {
      console.error("Connect error:", err);
      showToast("Failed to connect. Please try again.");
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading student profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 mb-6 inline-block">
          <p className="font-semibold text-sm">{error || "Student profile not found"}</p>
        </div>
        <div>
          <button
            onClick={() => navigate("/community")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <ArrowLeft size={16} /> Back to Community
          </button>
        </div>
      </div>
    );
  }

  const isSelf = String(student._id) === String(currentUser?._id || currentUser?.id);
  const rawConnections = Number(student.connectionsCount ?? student.stats?.connectionsCount ?? 0);
  const connectionsCount = student.isConnected ? Math.max(rawConnections, 1) : rawConnections;
  const streakDays = student.stats?.streakDays || 0;
  const xp = student.stats?.xp || 0;
  const completedVideos = student.stats?.completedVideos || 0;
  const totalWatchHours = Math.round(((student.stats?.totalWatchTimeSec || 0) / 3600) * 10) / 10;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
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

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/40 dark:shadow-none">
          {/* Sleek Slate-Indigo Header Banner */}
          <div className="h-44 sm:h-52 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            {/* Subtle Grid Accent */}
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

          {/* Profile Details Container */}
          <div className="px-6 sm:px-8 pb-8 relative">
            {/* Avatar & Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
              <div className="relative inline-block">
                <img
                  src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username || "sf"}`}
                  alt={student.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-2xl bg-white dark:bg-gray-800"
                />
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-white dark:border-gray-900 bg-emerald-500 shadow-sm"
                  title="Online on StudyForge"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {isSelf ? (
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
                  >
                    <span>Edit My Profile & Settings</span>
                  </Link>
                ) : (
                  <>
                    {student.isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold">
                        <CheckCircle2 size={15} /> Connected
                      </span>
                    ) : (
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                      >
                        <UserPlus size={15} />
                        <span>{connecting ? "Connecting..." : "+ Connect"}</span>
                      </button>
                    )}

                    <button
                      onClick={handleOpenChat}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <MessageSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Message</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name, Headline & Metadata */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  {student.name}
                </h1>
                {student.level === 2 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                    Pro 🔥
                  </span>
                ) : student.level === 1 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                    Rising 🚀
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck size={14} /> Verified Student
                </span>
              </div>

              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                @{student.username || "student"}
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl font-medium">
                {student.bio || "Passionate software engineer & continuous learner building skills on StudyForge."}
              </p>

              {/* Sub details: School, Location, Joined */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                {student.schoolCompany && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-gray-400" /> {student.schoolCompany}
                  </span>
                )}
                {student.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" /> {student.location}
                  </span>
                )}
                {student.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" /> Member since {new Date(student.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* 4 Key Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-800 text-center">
                <div className="inline-flex p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-2">
                  <Users size={18} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {connectionsCount}
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {connectionsCount === 1 ? "Connection" : "Connections"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-800 text-center">
                <div className="inline-flex p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-2">
                  <Flame size={18} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {streakDays}d
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Active Streak
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-800 text-center">
                <div className="inline-flex p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 mb-2">
                  <Sparkles size={18} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {xp}
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Total XP
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-800 text-center">
                <div className="inline-flex p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Award size={18} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {completedVideos}
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Lessons Completed
                </div>
              </div>
            </div>

            {/* Coding Profiles & Problem Solving */}
            <div className="mt-8 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Coding Profiles & Problem Solving
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {student.leetcode ? (
                  <a
                    href={student.leetcode.startsWith("http") ? student.leetcode : `https://leetcode.com/u/${student.leetcode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Code2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">LeetCode</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">@{student.leetcode.replace(/https?:\/\/leetcode\.com\/(u\/)?/, "")}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                  </a>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40 flex items-center gap-3 text-gray-400">
                    <Code2 size={20} />
                    <span className="text-xs">LeetCode profile not linked</span>
                  </div>
                )}

                {student.codeforces ? (
                  <a
                    href={student.codeforces.startsWith("http") ? student.codeforces : `https://codeforces.com/profile/${student.codeforces}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Code2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Codeforces</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">@{student.codeforces.replace(/https?:\/\/codeforces\.com\/(profile\/)?/, "")}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                  </a>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40 flex items-center gap-3 text-gray-400">
                    <Code2 size={20} />
                    <span className="text-xs">Codeforces profile not linked</span>
                  </div>
                )}

                {student.github && (
                  <a
                    href={student.github.startsWith("http") ? student.github : `https://github.com/${student.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200/70 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center font-bold">
                        <Github size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">GitHub</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">@{student.github.replace(/https?:\/\/github\.com\//, "")}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition" />
                  </a>
                )}

                {student.website && (
                  <a
                    href={student.website.startsWith("http") ? student.website : `https://${student.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Portfolio / Website</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[180px]">{student.website}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                  </a>
                )}
              </div>
            </div>

            {/* Skills & Focus Areas */}
            {student.skills && student.skills.length > 0 && (
              <div className="mt-8 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Skills & Core Competencies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

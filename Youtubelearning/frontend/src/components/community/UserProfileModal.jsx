import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MapPin, 
  Briefcase, 
  Flame, 
  Award, 
  Users, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Github,
  Globe,
  Settings,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserProfileModal({
  user,
  currentUser,
  isOpen,
  onClose,
  onConnect,
  onOpenChat,
  isConnected,
  isPending,
  isOnline,
}) {
  const navigate = useNavigate();

  if (!isOpen || !user) return null;

  const isSelf = String(user._id || user.id) === String(currentUser?._id || currentUser?.id);
  const rawConnections = Number(user.connectionsCount ?? user.stats?.connectionsCount ?? 0);
  const connectionsCount = isConnected ? Math.max(rawConnections, 1) : rawConnections;
  const streakDays = user.stats?.streakDays || 0;
  const xp = user.stats?.xp || 0;
  const completedVideos = user.stats?.completedVideos || 0;

  const handleEditMyProfile = () => {
    onClose();
    navigate("/settings");
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative text-gray-900 dark:text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition backdrop-blur-xs"
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Sleek Slate-Indigo Modern Banner */}
          <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "20px 20px"
              }}
            />
            <div className="absolute top-3 left-4">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white/80 text-[10px] font-semibold tracking-wider uppercase border border-white/15">
                StudyForge Peer
              </span>
            </div>
            <div className="absolute bottom-2 right-4 text-white/10 font-black text-3xl select-none tracking-tight">
              STUDYFORGE
            </div>
          </div>

          {/* Header & Avatar */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex justify-between items-end -mt-14 mb-4">
              <div className="relative">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "sf"}`}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl bg-white dark:bg-gray-800"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 ${
                    isOnline ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                {isSelf ? (
                  <button
                    type="button"
                    onClick={handleEditMyProfile}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    <Settings size={14} />
                    <span>Edit Profile & Photo</span>
                  </button>
                ) : (
                  <>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 px-3 py-1.5 text-xs font-semibold">
                        <CheckCircle2 size={14} /> Connected
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 px-3 py-1.5 text-xs font-semibold">
                        Pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConnect?.(user._id || user.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
                      >
                        <UserPlus size={14} />
                        <span>+ Connect</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChat?.(user);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 px-3.5 py-1.5 text-xs font-semibold transition shadow-2xs cursor-pointer text-gray-800 dark:text-gray-200"
                    >
                      <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${user._id || user.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold transition cursor-pointer text-gray-800 dark:text-gray-200"
                      title="View Full Profile"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Profile</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name & Identity */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
                {user.level === 2 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                    Pro 🔥
                  </span>
                ) : user.level === 1 ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                    Rising 🚀
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                @{user.username || "student"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                {user.bio || "Passionate engineer & continuous learner on StudyForge."}
              </p>

              {/* Extra Details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {user.location}
                  </span>
                )}
                {user.schoolCompany && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={13} /> {user.schoolCompany}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2.5 mt-5 p-3.5 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 text-center shadow-2xs">
              <div className="p-1">
                <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                  <Users size={15} /> {connectionsCount}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                  {connectionsCount === 1 ? "Connection" : "Connections"}
                </p>
              </div>
              <div className="p-1">
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Flame size={15} /> {streakDays}d
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Streak</p>
              </div>
              <div className="p-1">
                <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                  <Sparkles size={15} /> {xp}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">XP</p>
              </div>
              <div className="p-1">
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <Award size={15} /> {completedVideos}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Completed</p>
              </div>
            </div>

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills & Focus</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coding & Social Links */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
              {user.github && (
                <a
                  href={user.github.startsWith("http") ? user.github : `https://github.com/${user.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Github size={13} />
                  <span>GitHub</span>
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
              {user.leetcode && (
                <a
                  href={user.leetcode.startsWith("http") ? user.leetcode : `https://leetcode.com/u/${user.leetcode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition text-amber-600 dark:text-amber-400"
                >
                  <Code2 size={13} />
                  <span>LeetCode</span>
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
              {user.codeforces && (
                <a
                  href={user.codeforces.startsWith("http") ? user.codeforces : `https://codeforces.com/profile/${user.codeforces}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition text-blue-600 dark:text-blue-400"
                >
                  <Code2 size={13} />
                  <span>Codeforces</span>
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Globe size={13} />
                  <span>Portfolio</span>
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
            </div>

            {/* View Full Profile Action */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/profile/${user._id || user.id}`);
              }}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-200/70 dark:border-indigo-800/60 transition cursor-pointer shadow-2xs"
            >
              <span>View Full Student Profile & Coding Stats</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

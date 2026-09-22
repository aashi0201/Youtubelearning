import React from "react";
import { motion } from "framer-motion";
import { UserPlus, MessageSquare, Award, Flame, CheckCircle2 } from "lucide-react";

export default function UserCard({
  student,
  onConnect,
  onOpenChat,
  onEndorse,
  onViewProfile,
  isOnline,
  isConnected,
  isPending,
}) {
  const titleText = student.bio || student.major || `Computer Science Student • @${student.username || "student"}`;
  const rawCount = Number(student.connectionsCount ?? student.stats?.connectionsCount ?? 0);
  const connectionsCount = isConnected ? Math.max(rawCount, 1) : rawCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.02)" }}
      className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/80 p-4 transition-colors flex flex-wrap items-center justify-between gap-4 group"
    >
      {/* Identity & Avatar */}
      <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
        <button
          type="button"
          onClick={() => onViewProfile?.(student)}
          className="relative shrink-0 text-left focus:outline-hidden group/avatar cursor-pointer"
          title={`View ${student.name}'s profile`}
        >
          <img
            src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username || "sf"}`}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800 shadow-xs group-hover/avatar:ring-indigo-500 group-hover/avatar:scale-105 transition-all"
            alt={student.name}
          />
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
              isOnline ? "bg-emerald-500 shadow-sm" : "bg-gray-400 dark:bg-gray-600"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewProfile?.(student)}
              className="font-semibold text-sm md:text-base text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left cursor-pointer"
            >
              {student.name}
            </button>
            {student.level === 2 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider border border-amber-500/20 shrink-0">
                Pro 🔥
              </span>
            ) : student.level === 1 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider border border-blue-500/20 shrink-0">
                Rising 🚀
              </span>
            ) : null}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {titleText}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {connectionsCount} {connectionsCount === 1 ? "Connection" : "Connections"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Flame size={11} /> {student.stats?.streakDays || 0}d streak
            </span>
          </div>
        </div>
      </div>

      {/* 3 Horizontal Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {isConnected ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 px-3 py-1.5 text-xs font-semibold">
            <CheckCircle2 size={13} /> Connected
          </span>
        ) : isPending ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 px-3 py-1.5 text-xs font-semibold">
            Pending
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onConnect?.(student._id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3.5 py-1.5 text-xs font-semibold transition border border-indigo-200/40 dark:border-indigo-800/40 shadow-2xs"
          >
            <UserPlus size={13} />
            <span>+ Connect</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenChat?.(student)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 text-xs font-medium transition shadow-2xs"
        >
          <MessageSquare size={13} />
          <span>✉ Message</span>
        </button>

        <button
          type="button"
          onClick={() => onEndorse?.(student)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 text-xs font-medium transition shadow-2xs"
        >
          <Award size={13} />
          <span>🏅 Endorse</span>
        </button>
      </div>
    </motion.div>
  );
}

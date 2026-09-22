import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Flame,
  Clock3,
  CheckCircle2,
  Trophy,
  ListVideo,
  Settings,
  Sparkles,
  Compass,
} from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";

export default function WorkspaceHeader({
  videoTitle,
  playlistName,
  totalVideos,
  completedVideos,
  streakDays,
  totalWatchTimeSec,
  onBack,
  onToggleSidebar,
}) {
  const watchTimeStr = React.useMemo(() => {
    const total = Math.max(0, Number(totalWatchTimeSec) || 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }, [totalWatchTimeSec]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 px-4 lg:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Back, Starting Screen & Title info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs shrink-0"
            title="Go to Starting Screen"
          >
            <Compass size={15} />
            <span className="hidden sm:inline">Start Screen</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
                {playlistName || "Interactive Workspace"}
              </span>
              {totalVideos > 0 && (
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 px-2 py-0.2 text-[10px] font-bold shrink-0">
                  {completedVideos}/{totalVideos}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate max-w-[280px] sm:max-w-[450px]">
              {videoTitle || "Loading video..."}
            </h1>
          </div>
        </div>

        {/* Right: Quick Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Stats Chips */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span>{streakDays || 0} Day Streak</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Clock3 size={14} />
              <span>{watchTimeStr} Studied</span>
            </div>
          </div>

          {/* Toggle Sidebar Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 transition"
            >
              <ListVideo size={15} />
              <span className="hidden sm:inline">Tracks</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

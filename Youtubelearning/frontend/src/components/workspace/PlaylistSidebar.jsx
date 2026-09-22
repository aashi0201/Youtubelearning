import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, PlayCircle, Plus, Trash2, ListVideo, Search, Clock, Sparkles } from "lucide-react";

export default function PlaylistSidebar({
  playlist,
  currentVideoId,
  progressMap,
  onSelectVideo,
  onRemoveVideo,
  onAddVideo,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "completed" | "pending"

  const videos = playlist?.videos || [];

  const filteredVideos = videos.filter((video) => {
    const title = (video.title || "").toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase());
    const prog = progressMap?.get(video.videoId);
    const isDone = prog?.completed;

    if (filter === "completed") return matchesSearch && isDone;
    if (filter === "pending") return matchesSearch && !isDone;
    return matchesSearch;
  });

  const completedCount = videos.filter((v) => progressMap?.get(v.videoId)?.completed).length;
  const overallPercent = videos.length ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
      {/* Header & Overall Track Progress */}
      <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center border border-orange-200/60 shrink-0">
              <ListVideo size={16} />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
              {playlist?.name || "Track Lessons Directory"}
            </h3>
          </div>
          <span className="rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200/60 px-2.5 py-0.5 text-[10px] font-bold shrink-0">
            {completedCount}/{videos.length} Done
          </span>
        </div>

        {/* Overall Track Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Track Completion</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{overallPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Search & Filter Tag Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter lesson title..."
            className="w-full bg-slate-50 dark:bg-gray-800/60 text-xs font-medium text-gray-900 dark:text-white pl-8 pr-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                filter === item.id
                  ? "bg-orange-500 text-white shadow-2xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Items Scroll Stack */}
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredVideos.length ? (
          filteredVideos.map((video, idx) => {
            const isCurrent = video.videoId === currentVideoId;
            const prog = progressMap?.get(video.videoId);
            const isDone = prog?.completed;
            const pct = prog
              ? Math.min(100, Math.round(((prog.lastPositionSec || 0) / Math.max(1, prog.durationSec || 1)) * 100))
              : 0;

            return (
              <motion.div
                key={video.videoId}
                whileHover={{ y: -1 }}
                onClick={() => onSelectVideo(video.videoId)}
                className={`group flex items-center justify-between gap-2.5 rounded-xl p-2.5 text-xs cursor-pointer transition border relative ${
                  isCurrent
                    ? "bg-orange-50/80 dark:bg-orange-950/40 border-orange-400 dark:border-orange-600 shadow-2xs ring-1 ring-orange-400/30"
                    : isDone
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                    : "bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-orange-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-semibold text-xs ${
                        isCurrent
                          ? "text-orange-700 dark:text-orange-300"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {video.title || `Lesson ${video.videoId.slice(0, 8)}`}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{isDone ? "Completed" : pct > 0 ? `${pct}% progress` : "Not started"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onRemoveVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveVideo(video.videoId);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition"
                      title="Remove Video"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-6 text-xs text-gray-400">
            No matching lessons found.
          </div>
        )}
      </div>

      {onAddVideo && (
        <button
          onClick={onAddVideo}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-500 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-orange-600 transition bg-slate-50/50 dark:bg-gray-800/30"
        >
          <Plus size={14} className="text-orange-500" />
          <span>Add Lesson to Track</span>
        </button>
      )}
    </div>
  );
}

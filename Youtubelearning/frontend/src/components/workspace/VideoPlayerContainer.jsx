import React from "react";
import { CheckCircle2, Tv } from "lucide-react";

export default function VideoPlayerContainer({
  videoId,
  isCompleted,
}) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 dark:bg-gray-950 shadow-md aspect-video border border-gray-200/80 dark:border-gray-800">
      {videoId ? (
        <div id="youtube-player" className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center mb-3 shadow-xs">
            <Tv size={26} />
          </div>
          <p className="font-bold text-sm text-white">No Video Selected</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">Select a lesson from the track directory list on the left to begin your video session.</p>
        </div>
      )}

      {/* Complete Banner */}
      {isCompleted && (
        <div className="absolute top-3 right-3 rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-md">
          <CheckCircle2 size={13} />
          <span>Completed</span>
        </div>
      )}
    </div>
  );
}

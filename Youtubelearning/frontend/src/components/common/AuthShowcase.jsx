import { motion } from "framer-motion";
import { Sparkles, Video, CheckCircle2, Play, BookOpen, Flame } from "lucide-react";

export default function AuthShowcase({
  tagline = "A Buddy for all your Binge learning.",
  subtext = "Intelligent video transcripts, active recall flashcards, and interactive code sandboxes.",
}) {
  return (
    <div className="relative flex flex-col justify-between h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-[#8090fd] via-[#8997fd] to-[#97a5fd] dark:from-[#2a3068] dark:via-[#1e2350] dark:to-[#171b3d] p-6 sm:p-8 text-white shadow-xl">
      {/* Ambient background rings & decorative glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-950/20 blur-3xl" />

      {/* Top Section: Brand Mark & Tagline */}
      <div className="relative z-10">
        {/* Stylized Logo: Cloud / Buddy Icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-sm border border-white/30 text-white">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
            >
              <path
                d="M14 30C9.58 30 6 26.42 6 22C6 17.88 9.11 14.49 13.17 14.04C14.61 8.87 19.34 5 25 5C31.63 5 37 10.37 37 17C37 17.34 36.99 17.67 36.96 18C39.88 19.12 42 22.02 42 25.5C42 29.64 38.64 33 34.5 33H14"
                fill="white"
                opacity="0.95"
              />
              <path
                d="M20 18L26 22L20 26V18Z"
                fill="#7b8cfd"
              />
            </svg>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white drop-shadow-xs">
              StudyForge
            </span>
            <span className="block text-[10px] font-medium tracking-widest uppercase text-white/70">
              Learning OS
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-5 max-w-[360px]">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
            {tagline}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
            {subtext}
          </p>
        </div>
      </div>

      {/* Center & Bottom: Cozy Video Learning Illustration */}
      <div className="relative z-10 mt-4 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 p-1.5 shadow-xl"
        >
          <img
            src="/images/auth-buddy-illustration.jpg"
            alt="Binge Learning Buddy"
            className="w-full max-h-[260px] rounded-xl object-cover shadow-sm"
          />

          {/* Floating Pill Badges (Interactivity) */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-4 flex items-center gap-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 shadow-md border border-white/40 text-slate-800 dark:text-white"
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 size={10} />
            </div>
            <span className="text-[10px] font-bold">98% Retention</span>
          </motion.div>

          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 shadow-md border border-white/40 text-slate-800 dark:text-white"
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#8090fd] text-white">
              <Play size={8} className="fill-white ml-0.5" />
            </div>
            <span className="text-[10px] font-bold">Sync AI Notes</span>
          </motion.div>
        </motion.div>

        {/* Bottom Social Proof */}
        <div className="mt-4 flex items-center gap-2.5 text-[11px] text-white/85">
          <div className="flex -space-x-1.5">
            <span className="inline-block h-5 w-5 rounded-full bg-amber-400 border border-white text-[9px] font-bold flex items-center justify-center text-slate-900">A</span>
            <span className="inline-block h-5 w-5 rounded-full bg-sky-400 border border-white text-[9px] font-bold flex items-center justify-center text-slate-900">R</span>
            <span className="inline-block h-5 w-5 rounded-full bg-emerald-400 border border-white text-[9px] font-bold flex items-center justify-center text-slate-900">K</span>
          </div>
          <span className="font-semibold">Join 10,000+ active learners</span>
        </div>
      </div>
    </div>
  );
}
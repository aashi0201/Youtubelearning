import { motion } from "framer-motion";
import { ArrowRight, Sparkles, PlayCircle, BarChart3, ListVideo, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import Button from "../common/Button";
import { extractYoutubeId } from "../../utils/helpers";

const LearningConstellation = lazy(() => import("./LearningConstellation"));

function SceneFallback() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.03] text-sm text-muted">
      Loading interactive graph...
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleStartLearning = () => {
    const videoId = extractYoutubeId(url);

    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID.");
      return;
    }

    setError("");
    navigate(`/workspace/${videoId}`);
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="section-container grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300"
          >
            <Sparkles size={16} />
            AI-powered learning workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.04em] md:text-7xl"
          >
            Learn from videos
            <br />
            <span className="gradient-text">with real interaction.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.6 }}
            className="mt-6 max-w-2xl text-base text-muted md:text-lg"
          >
            Convert video content into summaries, flashcards, quizzes,
            transcript-aware answers, and AI conversations inside one
            premium learning flow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.6 }}
            className="mt-8"
          >
            <div className="glass premium-border relative flex flex-col gap-3 rounded-[1.75rem] p-4 shadow-[0_0_70px_rgba(79,140,255,0.08)] md:flex-row md:items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL or video ID..."
                className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-slate-500 md:text-base"
              />

              <Button
                className="min-w-[190px] gap-2 py-4"
                onClick={handleStartLearning}
              >
                Launch Workspace
                <ArrowRight size={16} />
              </Button>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-rose-400">{error}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Paste a YouTube link and open the interactive study workspace instantly.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 space-y-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="gap-2 font-bold shadow-md"
              >
                Open Dashboard
                <ArrowRight size={16} />
              </Button>

              <button
                onClick={() => navigate("/workspace/M7lc1UVf-VE")}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40"
              >
                Try Demo Workspace →
              </button>
            </div>

            {/* Quick Workspace Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {[
                { label: "Learn Workspace", path: "/workspace", icon: PlayCircle, color: "text-blue-500" },
                { label: "Track Playlists", path: "/playlists", icon: ListVideo, color: "text-purple-500" },
                { label: "Analytics & Stats", path: "/analytics", icon: BarChart3, color: "text-emerald-500" },
                { label: "Peer Network", path: "/community", icon: Users, color: "text-amber-500" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-left hover:border-blue-400 dark:hover:border-blue-600 transition shadow-2xs group"
                  >
                    <Icon size={16} className={`${item.color} shrink-0 group-hover:scale-110 transition`} />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <Suspense fallback={<SceneFallback />}>
          <LearningConstellation />
        </Suspense>
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Award, Zap, CheckCircle2, ShieldAlert } from "lucide-react";
import ActivityHeatmap from "../dashboard/ActivityHeatmap";
import { getStreak } from "../../services/activityService";

export default function StreakGrid() {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    activityMap: {},
  });

  const loadStreak = async () => {
    try {
      const res = await getStreak();
      if (res.ok) {
        setStreakData({
          currentStreak: res.currentStreak || 0,
          longestStreak: res.longestStreak || 0,
          activityMap: res.activityMap || {},
        });
      }
    } catch (err) {
      console.error("Failed to load streak data", err);
    }
  };

  useEffect(() => {
    loadStreak();
  }, []);

  const current = streakData.currentStreak;
  const longest = streakData.longestStreak;

  const milestones = [
    { target: 3, label: "3-Day Spark", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200" },
    { target: 7, label: "7-Day Flame", icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200" },
    { target: 30, label: "30-Day Master", icon: Trophy, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200" },
    { target: 100, label: "100-Day Legend", icon: Award, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 lg:p-8 shadow-xs flex flex-col gap-6 w-full max-w-5xl mx-auto"
    >
      {/* Header & Stat Cards Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/40 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
            <Flame size={14} className="fill-orange-500 text-orange-500" />
            <span>Tracking Active</span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Study Momentum & Progress
          </h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
            Complete daily video lessons and quizzes to keep your flame burning.
          </p>
        </div>

        {/* 2 Stat Cards */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial rounded-2xl border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20 p-4 min-w-[130px] text-center shadow-2xs space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              <Flame size={13} className="fill-orange-500 text-orange-500" />
              <span>Current Streak</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {current} <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">days</span>
            </p>
          </div>

          <div className="flex-1 sm:flex-initial rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-4 min-w-[130px] text-center shadow-2xs space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Trophy size={13} />
              <span>Longest Streak</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {longest} <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Activity Matrix & Calendar Cards */}
      <div className="space-y-2">
        <ActivityHeatmap activityMap={streakData.activityMap} />
      </div>

      {/* Milestone Badges Strip */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Streak Milestones & Badges
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const Icon = m.icon;
            const isUnlocked = current >= m.target;

            return (
              <div
                key={m.target}
                className={`p-3.5 rounded-2xl border transition flex items-center gap-3 ${
                  isUnlocked
                    ? `${m.bg} shadow-2xs`
                    : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60"
                }`}
              >
                <div className={`p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shrink-0 ${m.color}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{m.label}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {isUnlocked ? "Unlocked!" : `${m.target - current} days left`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

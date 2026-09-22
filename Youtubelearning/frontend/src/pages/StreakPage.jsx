import React from "react";
import { Flame } from "lucide-react";
import StreakGrid from "../components/streak/StreakGrid";

export default function StreakPage() {
  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto pt-4 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center border border-orange-200/80 dark:border-orange-900/40 shadow-lg shadow-orange-500/15">
          <Flame size={32} className="fill-orange-500 text-orange-500 animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Learning Consistency
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
          Track your daily study consistency, maintain your streak momentum, and unlock milestone badges! 🔥
        </p>
      </header>

      <section>
        <StreakGrid />
      </section>
    </div>
  );
}

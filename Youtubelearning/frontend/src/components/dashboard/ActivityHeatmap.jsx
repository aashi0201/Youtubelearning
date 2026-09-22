import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Grid, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Flame, BarChart2 } from "lucide-react";

export default function ActivityHeatmap({ activityMap = {} }) {
  const [viewMode, setViewMode] = useState("month_cards"); // "month_cards" | "matrix"
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current month
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Compute last 12 months data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const date = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      const shortMonth = date.toLocaleDateString("en-US", { month: "short" });

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday

      const days = [];
      let activeCount = 0;
      let totalTasks = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, monthIndex, day);
        const isFuture = dateObj > today;
        const monthStr = String(monthIndex + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        const count = activityMap[dateStr] || 0;
        if (count > 0) activeCount++;
        totalTasks += count;

        days.push({
          date: dateStr,
          dayNumber: day,
          count,
          isFuture,
          dayOfWeek: dateObj.getDay(),
        });
      }

      const pastDaysCount = days.filter((d) => !d.isFuture).length;
      const consistencyRate = pastDaysCount > 0 ? Math.round((activeCount / pastDaysCount) * 100) : 0;

      months.push({
        id: `${year}-${monthIndex}`,
        monthName,
        shortMonth,
        year,
        daysInMonth,
        firstDayOfWeek,
        days,
        activeCount,
        totalTasks,
        pastDaysCount,
        consistencyRate,
      });
    }

    return months;
  }, [activityMap]);

  // Color helper for tiles
  const getTileColor = (count, isFuture = false) => {
    if (isFuture)
      return "bg-gray-50 dark:bg-gray-900/40 border-dashed border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-default";
    if (!count || count === 0)
      return "bg-gray-100 dark:bg-gray-800/60 border-gray-200/70 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";
    if (count === 1)
      return "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold hover:bg-emerald-200";
    if (count >= 2 && count <= 3)
      return "bg-emerald-400 dark:bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-300 text-white dark:text-gray-950 font-extrabold shadow-2xs hover:bg-emerald-700"; // 4+
  };

  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Render Matrix View grouped by Month
  const renderMatrixView = () => {
    return (
      <div className="space-y-4">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-max">
            {monthlyData.slice().reverse().map((month) => {
              // Group days into weeks
              const weeks = [];
              let currentWeek = new Array(month.firstDayOfWeek).fill(null);

              month.days.forEach((dayObj) => {
                currentWeek.push(dayObj);
                if (currentWeek.length === 7) {
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
              });

              if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                  currentWeek.push(null);
                }
                weeks.push(currentWeek);
              }

              return (
                <div
                  key={month.id}
                  className="flex flex-col gap-2 p-3 rounded-2xl bg-gray-50/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 dark:border-gray-800 pb-1.5 px-0.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {month.shortMonth} {month.year}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40">
                      {month.activeCount}d
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((day, dIdx) => {
                          if (!day) {
                            return <div key={dIdx} className="h-3.5 w-3.5 rounded-xs opacity-0" />;
                          }
                          return (
                            <div
                              key={day.date}
                              className={`h-3.5 w-3.5 rounded-xs border text-[8px] flex items-center justify-center transition-all ${getTileColor(
                                day.count,
                                day.isFuture
                              )} group relative cursor-pointer`}
                            >
                              <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-900 dark:bg-gray-800 border border-gray-700/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg opacity-0 transition-opacity group-hover:block group-hover:opacity-100 pointer-events-none">
                                {day.count > 0 ? `${day.count} lesson${day.count > 1 ? "s" : ""} & study activity` : "No study activity"} on {day.date}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const displayedMonths = showAllMonths ? monthlyData : monthlyData.slice(0, 6);

  return (
    <div className="space-y-5 w-full">
      {/* Control Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/80 dark:bg-gray-800/50 p-3.5 rounded-2xl border border-gray-200/70 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-orange-500 shadow-2xs">
            <Calendar size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Monthly Study & Track Activity Breakdown
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Daily video lessons, quizzes, and learning track progress
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setViewMode("month_cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "month_cards"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Grid size={14} />
            <span>Monthly Cards</span>
          </button>

          <button
            onClick={() => setViewMode("matrix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "matrix"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <BarChart2 size={14} />
            <span>12-Month Matrix</span>
          </button>
        </div>
      </div>

      {/* VIEWMODE 1: MONTHLY CARDS GRID */}
      {viewMode === "month_cards" && (
        <div className="space-y-4">
          {/* Quick Month Filter Pills */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {monthlyData.slice(0, 6).map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonthOffset(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    selectedMonthOffset === idx
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {m.shortMonth} {m.year}
                  {m.activeCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white">
                      {m.activeCount}d
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline shrink-0 pl-2"
            >
              {showAllMonths ? "Show Recent 6 Months" : "View All 12 Months"}
            </button>
          </div>

          {/* Grid of Month Calendar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMonths.map((month) => {
              // Create calendar days grid with initial offset padding
              const paddingSlots = new Array(month.firstDayOfWeek).fill(null);

              return (
                <motion.div
                  key={month.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-2xs flex flex-col justify-between gap-3 hover:border-orange-200 dark:hover:border-orange-900/60 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
                    <div>
                      <h5 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        {month.monthName} {month.year}
                        {month.activeCount > 0 && (
                          <Flame size={14} className="fill-orange-500 text-orange-500" />
                        )}
                      </h5>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {month.activeCount} of {month.pastDaysCount || month.daysInMonth} days active
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                        {month.consistencyRate}%
                      </span>
                    </div>
                  </div>

                  {/* 7 Day Header Columns */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {dayHeaders.map((dh) => (
                      <span key={dh} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                        {dh}
                      </span>
                    ))}
                  </div>

                  {/* Monthly Calendar Day Tile Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {paddingSlots.map((_, pIdx) => (
                      <div key={`pad-${pIdx}`} className="aspect-square rounded-lg bg-transparent" />
                    ))}

                    {month.days.map((day) => (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-lg border text-[11px] flex items-center justify-center font-bold transition-transform hover:scale-110 ${getTileColor(
                          day.count,
                          day.isFuture
                        )} group relative cursor-pointer`}
                      >
                        <span>{day.dayNumber}</span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-900 dark:bg-gray-800 border border-gray-700/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg opacity-0 transition-opacity group-hover:block group-hover:opacity-100 pointer-events-none">
                          {day.count > 0 ? `${day.count} lesson${day.count > 1 ? "s" : ""} & study activity` : "No study activity"} on {day.date}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Progress Bar Footer */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      <span>Monthly Goal</span>
                      <span>{month.activeCount} / {month.daysInMonth} Days</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((month.activeCount / month.daysInMonth) * 100))}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEWMODE 2: 12-MONTH HEATMAP MATRIX */}
      {viewMode === "matrix" && renderMatrixView()}

      {/* Activity Heat Legend */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[11px]">Hover over any day tile for details</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <div className="h-3 w-3 rounded-sm bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 border border-emerald-500" />
            <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-400 border border-emerald-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}


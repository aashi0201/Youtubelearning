const User = require("../models/User");
const UserActivity = require("../models/UserActivity");
const CodingActivity = require("../models/CodingActivity");

/**
 * Get YYYY-MM-DD for today in UTC/ISO
 */
function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate current & longest streak from an array of date strings (YYYY-MM-DD)
 */
function calculateStreakFromDates(rawDates = []) {
  if (!rawDates || rawDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, uniqueDates: [] };
  }

  // Filter valid YYYY-MM-DD strings and extract unique
  const uniqueSet = new Set(
    rawDates
      .map((d) => (typeof d === "string" ? d.trim() : ""))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  );

  if (uniqueSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, uniqueDates: [] };
  }

  // Sort dates ascending for longest streak calculation
  const sortedAsc = Array.from(uniqueSet).sort();

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedAsc) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const p = new Date(prevDate + "T00:00:00Z");
      const c = new Date(dateStr + "T00:00:00Z");
      const diffDays = Math.round((c - p) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = dateStr;
  }

  // Calculate current streak
  let currentStreak = 0;
  const todayStr = getTodayDateString();

  // Yesterday date string
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let startPoint = null;
  if (uniqueSet.has(todayStr)) {
    startPoint = todayStr;
  } else if (uniqueSet.has(yesterdayStr)) {
    startPoint = yesterdayStr;
  }

  if (startPoint) {
    currentStreak = 1;
    let curr = new Date(startPoint + "T00:00:00Z");
    while (true) {
      curr.setUTCDate(curr.getUTCDate() - 1);
      const prevStr = curr.toISOString().split("T")[0];
      if (uniqueSet.has(prevStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    uniqueDates: Array.from(uniqueSet).sort().reverse(), // Descending
  };
}

/**
 * Fetch Study Streak for learning tracks, video progress, quizzes & study tasks ONLY
 */
async function getUserStudyStreak(userId) {
  if (!userId) return { currentStreak: 0, longestStreak: 0, uniqueDates: [], activityMap: {} };

  const dateCounts = {};

  try {
    const Progress = require("../models/Progress");
    const progressItems = await Progress.find({
      $or: [{ userId: userId }, { userId: String(userId) }],
      watchTimeSec: { $gt: 0 },
    }).select("lastWatchedAt updatedAt watchTimeSec completed").lean();

    for (const item of progressItems) {
      const d = item.lastWatchedAt || item.updatedAt;
      if (d) {
        const dateStr = new Date(d).toISOString().split("T")[0];
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + (item.completed ? 2 : 1);
      }
    }
  } catch (err) {
    console.error("Error aggregating progress for study streak:", err.message);
  }

  try {
    const QuizAttempt = require("../models/QuizAttempt");
    const quizAttempts = await QuizAttempt.find({
      $or: [{ user: userId }, { user: String(userId) }],
    }).select("createdAt").lean();

    for (const qa of quizAttempts) {
      if (qa.createdAt) {
        const dateStr = new Date(qa.createdAt).toISOString().split("T")[0];
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    }
  } catch (err) {
    console.error("Error aggregating quizzes for study streak:", err.message);
  }

  try {
    const userActivities = await UserActivity.find({
      $or: [{ userId: userId }, { userId: String(userId) }],
      tasksCompleted: { $gt: 0 },
    }).select("date tasksCompleted").lean();

    for (const ua of userActivities) {
      if (ua.date) {
        dateCounts[ua.date] = (dateCounts[ua.date] || 0) + (ua.tasksCompleted || 1);
      }
    }
  } catch (err) {
    console.error("Error aggregating user activities for study streak:", err.message);
  }

  const uniqueDates = Object.keys(dateCounts);
  const computed = calculateStreakFromDates(uniqueDates);

  // Sync user model study streak in background
  User.findByIdAndUpdate(userId, {
    $set: { "stats.streakDays": computed.currentStreak },
  }).catch((err) => console.error("Error updating user study streak:", err));

  return {
    currentStreak: computed.currentStreak,
    longestStreak: computed.longestStreak,
    uniqueDates: computed.uniqueDates,
    activityMap: dateCounts,
  };
}

/**
 * Dedicated function to calculate current streak, max streak, and active days
 * directly from fetched profile heatmap submission dates.
 * 
 * - currentStreak: Unbroken chain of consecutive days leading up to today or yesterday. (0 if inactive > 1 day)
 * - longestStreak / maxStreak: The highest consecutive streak achieved across the entire heatmap, merged with platform max streak.
 * - totalActiveDays: Total unique active days extracted from the calendar heatmap.
 */
function calculateProfileStreakFromHeatmap(rawDates = [], externalProfileStreak = 0) {
  const result = calculateStreakFromDates(rawDates);
  const externalVal = Number(externalProfileStreak) || 0;
  
  // Find most recent submission date
  const lastActiveDate = result.uniqueDates && result.uniqueDates.length > 0 ? result.uniqueDates[0] : null;

  return {
    currentStreak: result.currentStreak,
    longestStreak: Math.max(result.longestStreak, externalVal),
    totalActiveDays: result.uniqueDates ? result.uniqueDates.length : 0,
    uniqueDates: result.uniqueDates || [],
    lastActiveDate,
  };
}

/**
 * Fetch Coding Hub Streak for LeetCode / Codeforces / CodeChef / TUF ONLY (CodingActivity model)
 */
async function getUserCodingStreak(userId, externalStreak = 0) {
  if (!userId) return { currentStreak: 0, longestStreak: 0, uniqueDates: [] };

  const codingActivities = await CodingActivity.find({
    $or: [{ user: userId }, { user: String(userId) }],
  }).select("date").lean();

  const dates = codingActivities.map((a) => a.date).filter(Boolean);
  const computed = calculateProfileStreakFromHeatmap(dates, externalStreak);

  return {
    currentStreak: computed.currentStreak,
    longestStreak: computed.longestStreak,
    totalActiveDays: computed.totalActiveDays,
    uniqueDates: computed.uniqueDates,
    lastActiveDate: computed.lastActiveDate,
  };
}

/**
 * Log daily Study Activity (video/quiz/tasks) in UserActivity ONLY
 */
async function recordStudyActivity(userId) {
  const date = getTodayDateString();

  await UserActivity.findOneAndUpdate(
    { userId, date },
    { $inc: { tasksCompleted: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return getUserStudyStreak(userId);
}

/**
 * Log daily Coding Activity in CodingActivity ONLY
 */
async function recordCodingActivity(userId, platform = "leetcode") {
  const date = getTodayDateString();
  const validPlatform = ["leetcode", "codeforces", "codechef", "tuf"].includes(platform)
    ? platform
    : "leetcode";

  await CodingActivity.findOneAndUpdate(
    { user: userId, date, platform: validPlatform },
    { $set: { solved: true }, $inc: { problemsCount: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return getUserCodingStreak(userId);
}

/**
 * Backward compatibility fallback
 */
async function getUserUnifiedStreak(userId, externalStreak = 0) {
  return getUserStudyStreak(userId);
}

async function recordDailyActivity(userId, platform = "leetcode") {
  return recordStudyActivity(userId);
}

/**
 * Cleanup legacy UserActivity records that were previously polluted by platform imports
 */
async function cleanupOrphanedUserActivities(userId) {
  if (!userId) return;
  try {
    const activeCodingDates = await CodingActivity.distinct("date", {
      $or: [{ user: userId }, { user: String(userId) }],
    });
    if (activeCodingDates.length > 0) {
      // Remove any UserActivity records that matched coding dates to strictly isolate study tasks
      await UserActivity.deleteMany({
        $or: [{ userId: userId }, { userId: String(userId) }],
        date: { $in: activeCodingDates },
      });
    }
  } catch (err) {
    console.error("Error cleaning up orphaned user activities:", err.message);
  }
}

module.exports = {
  getTodayDateString,
  calculateStreakFromDates,
  calculateProfileStreakFromHeatmap,
  getUserStudyStreak,
  getUserCodingStreak,
  recordStudyActivity,
  recordCodingActivity,
  getUserUnifiedStreak,
  recordDailyActivity,
  cleanupOrphanedUserActivities,
};

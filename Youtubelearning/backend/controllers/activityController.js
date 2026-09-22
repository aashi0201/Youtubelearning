const UserActivity = require("../models/UserActivity");
const { getTodayDateString, getUserStudyStreak, recordStudyActivity } = require("../utils/streakHelper");

exports.completeTask = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const streakResult = await recordStudyActivity(userId);

    res.status(200).json({
      ok: true,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      activity: { userId, date: getTodayDateString(), tasksCompleted: 1 },
    });
  } catch (error) {
    next(error);
  }
};

exports.getStreak = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const streakResult = await getUserStudyStreak(userId);

    console.log("[Study Streak API] Returning =>", {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      completedCount: streakResult.uniqueDates.length,
    });

    res.status(200).json({
      ok: true,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      completedDates: streakResult.uniqueDates,
      activityMap: streakResult.activityMap || Object.fromEntries(streakResult.uniqueDates.map((d) => [d, 1])),
    });
  } catch (error) {
    next(error);
  }
};


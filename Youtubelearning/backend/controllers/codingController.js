const User = require("../models/User");
const UserActivity = require("../models/UserActivity");
const CodingActivity = require("../models/CodingActivity");
const {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchGitHubStats,
  fetchContests,
  clearUserCodingCache,
  flushAllCodingCache,
  getCachedAiFeedback,
  setCachedAiFeedback,
  extractLeetCodeUsername,
  extractCodeforcesHandle,
  extractCodeChefUsername,
  verifyProfileOwnership,
} = require("../services/codingService");
const { analyzeCodingStats } = require("../services/ai/aiProvider");
const { getTodayDateString, getUserCodingStreak, cleanupOrphanedUserActivities, recordCodingActivity } = require("../utils/streakHelper");

// Independent Profile Inspection (allows tracking any developer's public profile without mutating user data)
exports.inspectHandles = async (req, res, next) => {
  try {
    const { leetcode, codeforces, codechef, github } = req.query;
    const forceRefresh = req.query.refresh === "true";

    const cleanLc = leetcode ? extractLeetCodeUsername(leetcode) : "";
    const cleanCf = codeforces ? extractCodeforcesHandle(codeforces) : "";
    const cleanCc = codechef ? extractCodeChefUsername(codechef) : "";
    const cleanGh = github ? String(github).trim() : "";

    const [lcStats, cfStats, ccStats, ghStats] = await Promise.all([
      cleanLc ? fetchLeetCodeStats(cleanLc, forceRefresh) : null,
      cleanCf ? fetchCodeforcesStats(cleanCf, forceRefresh) : null,
      cleanCc ? fetchCodeChefStats(cleanCc, forceRefresh) : null,
      cleanGh ? fetchGitHubStats(cleanGh, forceRefresh) : null,
    ]);

    const activityDates = [];
    if (lcStats?.submissionDates) activityDates.push(...lcStats.submissionDates);
    if (cfStats?.submissionDates) activityDates.push(...cfStats.submissionDates);
    const uniqueDates = Array.from(new Set(activityDates)).sort();

    res.json({
      ok: true,
      isIndependentInspection: true,
      profiles: {
        leetcode: cleanLc,
        codeforces: cleanCf,
        codechef: cleanCc,
        github: cleanGh,
      },
      stats: {
        leetcode: lcStats,
        codeforces: cfStats,
        codechef: ccStats,
        github: ghStats,
      },
      currentStreak: lcStats?.streak || 0,
      longestStreak: lcStats?.maxStreak || 0,
      activityDates: uniqueDates,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfiles = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const oldLc = user.leetcode || "";
    const oldCf = user.codeforces || "";
    const oldCc = user.codechef || "";

    const lc = req.body.leetcode !== undefined ? extractLeetCodeUsername(req.body.leetcode) : user.leetcode;
    const cf = req.body.codeforces !== undefined ? extractCodeforcesHandle(req.body.codeforces) : user.codeforces;
    const cc = req.body.codechef !== undefined ? extractCodeChefUsername(req.body.codechef) : user.codechef;
    const tuf = req.body.tuf !== undefined ? (req.body.tuf || "").trim() : user.tuf;

    // Flush all stale caches when updating profiles
    flushAllCodingCache();

    let handleChanged = false;

    // If handle changed, wipe old CodingActivity for that platform so new handle stats sync clean
    if (oldLc.toLowerCase() !== lc.toLowerCase()) {
      await CodingActivity.deleteMany({ user: userId, platform: "leetcode" });
      handleChanged = true;
    }
    if (oldCf.toLowerCase() !== cf.toLowerCase()) {
      await CodingActivity.deleteMany({ user: userId, platform: "codeforces" });
      handleChanged = true;
    }
    if (oldCc.toLowerCase() !== cc.toLowerCase()) {
      await CodingActivity.deleteMany({ user: userId, platform: "codechef" });
      handleChanged = true;
    }

    user.leetcode = lc;
    user.codeforces = cf;
    user.codechef = cc;
    user.tuf = tuf;

    await user.save();

    if (handleChanged) {
      await cleanupOrphanedUserActivities(userId);
    }

    res.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
};

exports.disconnectProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { platform } = req.body;

    if (!["leetcode", "codeforces", "codechef", "tuf"].includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    clearUserCodingCache(user[platform]);
    flushAllCodingCache();
    user[platform] = "";
    if (user.verifiedPlatforms) {
      user.verifiedPlatforms[platform] = false;
    }
    await user.save();

    // Wipe CodingActivity for this platform and cleanup orphaned UserActivity dates
    await CodingActivity.deleteMany({ user: userId, platform });
    await cleanupOrphanedUserActivities(userId);

    // Recalculate coding streak
    const streakResult = await getUserCodingStreak(userId);

    res.json({
      ok: true,
      user,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      activityDates: streakResult.uniqueDates,
      verifiedPlatforms: user.verifiedPlatforms || {},
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrackerStats = exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.params.userId === "me" ? req.user.id : req.params.userId;
    const forceRefresh = req.query.refresh === "true";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (!user.verificationToken) {
      user.verificationToken = `ls-verify-${user._id.toString().slice(-6)}`;
      await user.save();
    }

    const profiles = {
      leetcode: user.leetcode || "",
      codeforces: user.codeforces || "",
      codechef: user.codechef || "",
      tuf: user.tuf || "",
      github: user.github || "",
    };

    if (forceRefresh) {
      clearUserCodingCache(profiles.leetcode);
      clearUserCodingCache(profiles.codeforces);
      clearUserCodingCache(profiles.codechef);
      clearUserCodingCache(profiles.github);
    }

    const [leetcodeStats, codeforcesStats, codechefStats, githubStats] = await Promise.all([
      profiles.leetcode ? fetchLeetCodeStats(profiles.leetcode, forceRefresh) : null,
      profiles.codeforces ? fetchCodeforcesStats(profiles.codeforces, forceRefresh) : null,
      profiles.codechef ? fetchCodeChefStats(profiles.codechef, forceRefresh) : null,
      profiles.github ? fetchGitHubStats(profiles.github, forceRefresh) : null,
    ]);

    // Bulk sync imported submission dates from LeetCode & Codeforces into CodingActivity ONLY
    const codingOps = [];

    if (leetcodeStats && Array.isArray(leetcodeStats.submissionDates)) {
      leetcodeStats.submissionDates.forEach((d) => {
        codingOps.push({
          updateOne: {
            filter: { user: userId, date: d, platform: "leetcode" },
            update: { $set: { solved: true, problemsCount: 1 } },
            upsert: true,
          },
        });
      });
    }

    if (codeforcesStats && Array.isArray(codeforcesStats.submissionDates)) {
      codeforcesStats.submissionDates.forEach((d) => {
        codingOps.push({
          updateOne: {
            filter: { user: userId, date: d, platform: "codeforces" },
            update: { $set: { solved: true, problemsCount: 1 } },
            upsert: true,
          },
        });
      });
    }

    if (codingOps.length > 0) {
      await CodingActivity.bulkWrite(codingOps).catch((err) => console.error("Bulk write error:", err.message));
    }

    await cleanupOrphanedUserActivities(userId);

    // Compute coding streak across coding activities ONLY
    const streakResult = await getUserCodingStreak(userId, leetcodeStats?.streak || 0);

    // Serve AI Feedback instantly from cache if available
    let aiFeedback = getCachedAiFeedback(userId);

    // Asynchronously generate/refresh AI feedback in background if missing or forceRefreshed
    if (!aiFeedback || forceRefresh) {
      const primaryStats = leetcodeStats
        ? { platform: "LeetCode", stats: leetcodeStats }
        : codeforcesStats
        ? { platform: "Codeforces", stats: codeforcesStats }
        : codechefStats
        ? { platform: "CodeChef", stats: codechefStats }
        : null;

      if (primaryStats) {
        analyzeCodingStats(primaryStats)
          .then((feedback) => {
            if (feedback && feedback.raw) {
              setCachedAiFeedback(userId, feedback.raw);
            }
          })
          .catch((aiErr) => {
            console.error("Async AI Feedback generation failed:", aiErr.message);
          });
      }
    }

    res.status(200).json({
      ok: true,
      profiles,
      stats: {
        leetcode: leetcodeStats,
        codeforces: codeforcesStats,
        codechef: codechefStats,
        github: githubStats,
        tuf: profiles.tuf ? { platform: "tuf", link: profiles.tuf } : null,
      },
      platformActivities: {
        leetcode: {
          dates: leetcodeStats?.submissionDates || [],
          counts: leetcodeStats?.submissionCounts || {},
          streak: leetcodeStats?.streak || 0,
          maxStreak: leetcodeStats?.maxStreak || 0,
          total: leetcodeStats?.totalSubmissions || 0,
          activeDays: leetcodeStats?.totalActiveDays || 0,
        },
        codeforces: {
          dates: codeforcesStats?.submissionDates || [],
          counts: codeforcesStats?.submissionCounts || {},
          streak: codeforcesStats?.streak || 0,
          maxStreak: codeforcesStats?.maxStreak || 0,
          total: codeforcesStats?.totalSubmissions || 0,
          activeDays: codeforcesStats?.totalActiveDays || 0,
        },
        github: {
          dates: githubStats?.submissionDates || [],
          counts: githubStats?.submissionCounts || {},
          streak: githubStats?.streak || 0,
          maxStreak: githubStats?.maxStreak || 0,
          total: githubStats?.totalSubmissions || 0,
          activeDays: githubStats?.totalActiveDays || 0,
          publicRepos: githubStats?.publicRepos || 0,
          followers: githubStats?.followers || 0,
        },
      },
      verifiedPlatforms: user.verifiedPlatforms || {},
      verificationToken: user.verificationToken,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      activityDates: streakResult.uniqueDates,
      aiFeedback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayActivity = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const todayActivities = await CodingActivity.find({ user: req.user._id, date: today });

    const activityByPlatform = {};
    todayActivities.forEach((a) => {
      activityByPlatform[a.platform] = true;
    });

    res.status(200).json({ ok: true, activityToday: activityByPlatform });
  } catch (error) {
    next(error);
  }
};

exports.markProblemSolved = async (req, res, next) => {
  try {
    const { platform } = req.body;
    if (!["leetcode", "codeforces", "codechef", "tuf"].includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    const streakResult = await recordCodingActivity(req.user._id, platform);
    const today = getTodayDateString();
    const activity = await CodingActivity.findOne({ user: req.user._id, date: today, platform });

    const io = req.app.get("io");
    if (io) {
      const userDoc = await User.findById(req.user._id).select("name avatar username");
      io.emit("activityUpdated", {
        userId: req.user._id,
        name: userDoc.name,
        avatar: userDoc.avatar,
        platform,
        problemsCount: activity?.problemsCount || 1,
      });
    }

    res.status(200).json({ ok: true, activity, currentStreak: streakResult.currentStreak, longestStreak: streakResult.longestStreak });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const activities = await CodingActivity.find({ date: today }).populate("user", "name avatar username stats");
    
    const activeUsersMap = {};
    activities.forEach(a => {
      if (a.user) {
        const uid = a.user._id.toString();
        if (!activeUsersMap[uid]) {
          activeUsersMap[uid] = {
            user: a.user,
            platforms: [],
            streak: a.user.stats?.streakDays || 0
          };
        }
        activeUsersMap[uid].platforms.push(a.platform);
      }
    });

    const activeUsers = Object.values(activeUsersMap).sort((a,b) => b.platforms.length - a.platforms.length || b.streak - a.streak);

    res.status(200).json({
      ok: true,
      activeUsers,
      totalActive: activeUsers.length
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingContests = async (req, res, next) => {
  try {
    const contests = await fetchContests();
    res.status(200).json({
      ok: true,
      contests
    });
  } catch (error) {
    next(error);
  }
};

exports.getVerificationToken = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    if (!user.verificationToken) {
      user.verificationToken = `ls-verify-${user._id.toString().slice(-6)}`;
      await user.save();
    }

    res.json({
      ok: true,
      verificationToken: user.verificationToken,
      verifiedPlatforms: user.verifiedPlatforms || {},
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPlatformOwnership = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { platform, handle } = req.body;

    if (!["leetcode", "codeforces", "codechef", "github"].includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform requested for verification." });
    }

    if (!handle || !String(handle).trim()) {
      return res.status(400).json({ ok: false, error: "Platform username / handle is required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    if (!user.verificationToken) {
      user.verificationToken = `ls-verify-${user._id.toString().slice(-6)}`;
      await user.save();
    }

    const check = await verifyProfileOwnership(platform, handle, user.verificationToken);
    if (!check.ok) {
      return res.status(400).json({
        ok: false,
        verified: false,
        error: check.error,
        verificationToken: user.verificationToken,
      });
    }

    const cleanHandle = check.verifiedHandle;
    const oldHandle = user[platform] || "";

    user[platform] = cleanHandle;
    if (!user.verifiedPlatforms) {
      user.verifiedPlatforms = {};
    }
    user.verifiedPlatforms[platform] = true;
    await user.save();

    // Clear stale caches so fresh verified data displays immediately
    if (oldHandle) clearUserCodingCache(oldHandle);
    clearUserCodingCache(cleanHandle);
    flushAllCodingCache();

    res.json({
      ok: true,
      verified: true,
      platform,
      handle: cleanHandle,
      verifiedPlatforms: user.verifiedPlatforms,
      message: `Ownership of ${platform.toUpperCase()} (@${cleanHandle}) successfully verified and bound to your profile!`,
    });
  } catch (error) {
    next(error);
  }
};


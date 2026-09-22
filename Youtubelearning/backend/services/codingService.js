const axios = require("axios");
const NodeCache = require("node-cache");
const cheerio = require("cheerio");
const { calculateStreakFromDates, calculateProfileStreakFromHeatmap } = require("../utils/streakHelper");

// Cache for 5 minutes (300s) to avoid rate limiting while keeping stats fresh
const cache = new NodeCache({ stdTTL: 300 });

function extractHandleFromInput(input) {
  if (!input) return "";
  let str = String(input).trim().replace(/\/+$/, "");
  const matches = str.match(/(?:leetcode\.com|codeforces\.com|codechef\.com|takeuforward\.org)\/(?:u\/|profile\/|users\/)?([a-zA-Z0-9_-]+)/gi);
  if (matches && matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const parts = lastMatch.split("/").filter(Boolean);
    const cleanHandle = parts.pop();
    if (cleanHandle && cleanHandle !== "u" && cleanHandle !== "profile" && cleanHandle !== "users") {
      return cleanHandle.replace(/[^a-zA-Z0-9_-]/g, "");
    }
  }
  if (str.includes("://") || str.includes("/")) {
    const segments = str.split("?")[0].split("#")[0].split("/").filter(Boolean);
    while (segments.length > 0) {
      const seg = segments.pop().replace(/[^a-zA-Z0-9_-]/g, "");
      if (seg && seg !== "u" && seg !== "profile" && seg !== "users" && seg !== "https" && seg !== "http" && !seg.includes("leetcode") && !seg.includes("codeforces") && !seg.includes("codechef") && !seg.includes("takeuforward") && !seg.includes("com") && !seg.includes("org")) {
        return seg;
      }
    }
  }
  return str.replace(/[^a-zA-Z0-9_-]/g, "");
}

function extractLeetCodeUsername(input) {
  return extractHandleFromInput(input);
}

function extractCodeforcesHandle(input) {
  return extractHandleFromInput(input);
}

function extractCodeChefUsername(input) {
  return extractHandleFromInput(input);
}

function clearUserCodingCache(username) {
  if (!username) return;
  const rawKey = String(username).toLowerCase();
  const cleanKey = extractLeetCodeUsername(username).toLowerCase();
  cache.del(`lc_${rawKey}`);
  cache.del(`lc_${cleanKey}`);
  cache.del(`cf_${rawKey}`);
  cache.del(`cf_${cleanKey}`);
  cache.del(`cc_${rawKey}`);
  cache.del(`cc_${cleanKey}`);
}

function flushAllCodingCache() {
  cache.flushAll();
}

function getCachedAiFeedback(userId) {
  if (!userId) return null;
  return cache.get(`ai_${userId}`) || null;
}

function setCachedAiFeedback(userId, feedback) {
  if (!userId || !feedback) return;
  cache.set(`ai_${userId}`, feedback, 1800);
}

async function fetchLeetCodeStats(rawInput, forceRefresh = false) {
  const username = extractLeetCodeUsername(rawInput);
  if (!username) return null;
  const cacheKey = `lc_${username.toLowerCase()}`;
  if (forceRefresh) {
    cache.del(cacheKey);
  } else if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached && cached.submissionDates && cached.streak !== undefined) {
      return cached;
    }
  }

  try {
    const query = `
      query getUserProfile($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          profile {
            ranking
            reputation
          }
          userCalendar {
            streak
            totalActiveDays
            submissionCalendar
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
          badge {
            name
          }
        }
        recentAcSubmissionList(username: $username, limit: 30) {
          title
          titleSlug
          timestamp
        }
      }
    `;

    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username } },
      {
        timeout: 6000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://leetcode.com",
        },
      }
    );

    if (data.errors || !data.data || !data.data.matchedUser) return null;

    const allQuestions = data.data.allQuestionsCount || [];
    const totalQuestions = allQuestions.find((q) => q.difficulty === "All")?.count || 3300;
    const totalEasy = allQuestions.find((q) => q.difficulty === "Easy")?.count || 820;
    const totalMedium = allQuestions.find((q) => q.difficulty === "Medium")?.count || 1730;
    const totalHard = allQuestions.find((q) => q.difficulty === "Hard")?.count || 750;

    const stats = data.data.matchedUser.submitStats?.acSubmissionNum || [];
    const all = stats.find((s) => s.difficulty === "All")?.count || 0;
    const easy = stats.find((s) => s.difficulty === "Easy")?.count || 0;
    const medium = stats.find((s) => s.difficulty === "Medium")?.count || 0;
    const hard = stats.find((s) => s.difficulty === "Hard")?.count || 0;

    const userCalendar = data.data.matchedUser.userCalendar || {};
    const streak = userCalendar.streak || 0;
    const totalActiveDays = userCalendar.totalActiveDays || 0;

    const ranking = data.data.matchedUser.profile?.ranking || null;
    const contestRanking = data.data.userContestRanking || null;
    const contestRating = contestRanking?.rating ? Math.round(contestRanking.rating) : null;
    const contestRankPercentile = contestRanking?.topPercentage || null;
    const contestsAttended = contestRanking?.attendedContestsCount || 0;
    const contestGlobalRanking = contestRanking?.globalRanking || null;
    const contestBadge = contestRanking?.badge?.name || null;

    let totalSubmissions = 0;
    const submissionDatesSet = new Set();
    const submissionCounts = {};

    if (userCalendar.submissionCalendar) {
      try {
        const calendarMap = JSON.parse(userCalendar.submissionCalendar);
        Object.keys(calendarMap).forEach((ts) => {
          const count = calendarMap[ts];
          if (count > 0) {
            totalSubmissions += count;
            const dateStr = new Date(parseInt(ts, 10) * 1000).toISOString().split("T")[0];
            submissionDatesSet.add(dateStr);
            submissionCounts[dateStr] = (submissionCounts[dateStr] || 0) + count;
          }
        });
      } catch (e) {
        console.error("Error parsing submissionCalendar:", e.message);
      }
    }

    const rawRecent = data.data.recentAcSubmissionList || [];
    let solvedToday = false;
    const todayStr = new Date().toISOString().split("T")[0];
    const recentSubmissions = [];

    for (const sub of rawRecent) {
      const subDateStr = new Date(sub.timestamp * 1000).toISOString().split("T")[0];
      submissionDatesSet.add(subDateStr);
      if (!submissionCounts[subDateStr]) {
        submissionCounts[subDateStr] = 1;
      }
      if (subDateStr === todayStr) {
        solvedToday = true;
      }
      recentSubmissions.push({
        title: sub.title,
        titleSlug: sub.titleSlug,
        timestamp: sub.timestamp,
        date: subDateStr,
      });
    }

    if (submissionDatesSet.has(todayStr)) {
      solvedToday = true;
    }

    const submissionDates = Array.from(submissionDatesSet);
    const profileStreak = calculateProfileStreakFromHeatmap(submissionDates, userCalendar.streak || 0);

    const result = {
      platform: "leetcode",
      username: username.trim(),
      totalSolved: all,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      totalQuestions,
      totalEasy,
      totalMedium,
      totalHard,
      ranking,
      contestRating,
      contestRankPercentile,
      contestsAttended,
      contestGlobalRanking,
      contestBadge,
      recentSubmissions,
      solvedToday,
      streak: profileStreak.currentStreak,
      maxStreak: profileStreak.longestStreak,
      totalActiveDays: totalActiveDays || profileStreak.totalActiveDays,
      totalSubmissions: totalSubmissions || submissionDates.length,
      lastActiveDate: profileStreak.lastActiveDate,
      submissionDates,
      submissionCounts,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("LeetCode GraphQL fetch error:", error.message);
    return null;
  }
}

async function fetchCodeforcesStats(rawInput, forceRefresh = false) {
  const cleanUser = extractCodeforcesHandle(rawInput);
  if (!cleanUser) return null;
  const cacheKey = `cf_${cleanUser.toLowerCase()}`;
  if (forceRefresh) {
    cache.del(cacheKey);
  } else if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const results = await Promise.allSettled([
      axios.get(`https://codeforces.com/api/user.info?handles=${cleanUser}`, { timeout: 5000 }),
      axios.get(`https://codeforces.com/api/user.status?handle=${cleanUser}&from=1&count=500`, { timeout: 5000 }),
    ]);

    const userInfoRes = results[0].status === "fulfilled" ? results[0].value : null;
    const userStatusRes = results[1].status === "fulfilled" ? results[1].value : null;

    const submissionDatesSet = new Set();
    const submissionCounts = {};
    let solvedToday = false;
    const todayStr = new Date().toISOString().split("T")[0];

    if (userStatusRes && userStatusRes.data && userStatusRes.data.status === "OK") {
      const recentAc = userStatusRes.data.result.filter((s) => s.verdict === "OK");
      for (const sub of recentAc) {
        const subDateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split("T")[0];
        submissionDatesSet.add(subDateStr);
        submissionCounts[subDateStr] = (submissionCounts[subDateStr] || 0) + 1;
        if (subDateStr === todayStr) {
          solvedToday = true;
        }
      }
    }

    const submissionDates = Array.from(submissionDatesSet);
    const cfStreak = calculateProfileStreakFromHeatmap(submissionDates);

    if (userInfoRes && userInfoRes.data && userInfoRes.data.status === "OK" && userInfoRes.data.result.length > 0) {
      const info = userInfoRes.data.result[0];
      const result = {
        platform: "codeforces",
        username: cleanUser,
        rating: info.rating || 0,
        maxRating: info.maxRating || 0,
        rank: info.rank || "unrated",
        solvedToday,
        streak: cfStreak.currentStreak,
        maxStreak: cfStreak.longestStreak,
        totalActiveDays: cfStreak.totalActiveDays,
        totalSubmissions: Object.values(submissionCounts).reduce((a, b) => a + b, 0) || submissionDates.length,
        submissionDates,
        submissionCounts,
      };
      cache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Codeforces fetch error:", error.message);
    return null;
  }
}

async function fetchCodeChefStats(rawInput, forceRefresh = false) {
  const cleanUser = extractCodeChefUsername(rawInput);
  if (!cleanUser) return null;
  const cacheKey = `cc_${cleanUser.toLowerCase()}`;
  if (forceRefresh) {
    cache.del(cacheKey);
  } else if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const { data } = await axios.get(`https://www.codechef.com/users/${cleanUser}`, {
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(data);

    const ratingStr = $(".rating-number").text().trim();
    const currentRating = parseInt(ratingStr, 10) || 0;

    const highestRatingStr = $(".rating-header .rating-star").parent().text();
    const maxMatch = highestRatingStr.match(/Highest Rating\s*(\d+)/);
    const highestRating = maxMatch ? parseInt(maxMatch[1], 10) : 0;

    const stars = $(".rating-star").first().text().trim() || "1★";

    // Try to get total solved
    const solvedStr = $("h3:contains('Fully Solved')").text();
    const solvedMatch = solvedStr.match(/Fully Solved\s*\((\d+)\)/);
    const totalSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

    const result = {
      platform: "codechef",
      username: cleanUser,
      rating: currentRating,
      highestRating,
      stars,
      totalSolved,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("CodeChef cheerio fetch error:", error.message);
    return null;
  }
}

async function fetchGitHubStats(rawInput, forceRefresh = false) {
  const cleanUser = String(rawInput || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanUser) return null;
  const cacheKey = `gh_${cleanUser.toLowerCase()}`;
  if (forceRefresh) {
    cache.del(cacheKey);
  } else if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const [userRes, eventsRes] = await Promise.allSettled([
      axios.get(`https://api.github.com/users/${cleanUser}`, {
        timeout: 5000,
        headers: { "User-Agent": "LearnSphere" },
      }),
      axios.get(`https://api.github.com/users/${cleanUser}/events/public?per_page=100`, {
        timeout: 5000,
        headers: { "User-Agent": "LearnSphere" },
      }),
    ]);

    const submissionDatesSet = new Set();
    const submissionCounts = {};
    let publicRepos = 0;
    let followers = 0;

    if (userRes.status === "fulfilled" && userRes.value?.data) {
      publicRepos = userRes.value.data.public_repos || 0;
      followers = userRes.value.data.followers || 0;
    }

    if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value?.data)) {
      eventsRes.value.data.forEach((evt) => {
        if (evt.created_at) {
          const d = evt.created_at.split("T")[0];
          submissionDatesSet.add(d);
          submissionCounts[d] = (submissionCounts[d] || 0) + 1;
        }
      });
    }

    const submissionDates = Array.from(submissionDatesSet);
    const ghStreak = calculateProfileStreakFromHeatmap(submissionDates);

    const result = {
      platform: "github",
      username: cleanUser,
      publicRepos,
      followers,
      streak: ghStreak.currentStreak,
      maxStreak: ghStreak.longestStreak,
      totalActiveDays: ghStreak.totalActiveDays,
      totalSubmissions: Object.values(submissionCounts).reduce((a, b) => a + b, 0) || submissionDates.length,
      submissionDates,
      submissionCounts,
    };

    cache.set(cacheKey, result, 600);
    return result;
  } catch (err) {
    console.error("GitHub fetch error:", err.message);
    return null;
  }
}

async function fetchContests() {
  const cacheKey = "upcoming_contests";
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const results = await Promise.allSettled([
      axios.get("https://codeforces.com/api/contest.list", { timeout: 4000 }),
      axios.get("https://kontests.net/api/v1/leet_code", { timeout: 4000 }),
    ]);

    let contests = [];
    const cfRes = results[0].status === "fulfilled" ? results[0].value : null;
    if (cfRes && cfRes.data && cfRes.data.status === "OK") {
      contests = cfRes.data.result
        .filter((c) => c.phase === "BEFORE")
        .map((c) => ({
          id: c.id,
          name: c.name,
          platform: "Codeforces",
          startTimeSeconds: c.startTimeSeconds,
          durationSeconds: c.durationSeconds,
          link: `https://codeforces.com/contest/${c.id}`,
        }));
    }

    const lcRes = results[1].status === "fulfilled" ? results[1].value : null;
    if (lcRes && Array.isArray(lcRes.data)) {
      contests.push(
        ...lcRes.data.map((c) => ({
          id: c.name,
          name: c.name,
          platform: "LeetCode",
          startTimeSeconds: new Date(c.start_time).getTime() / 1000,
          durationSeconds: parseInt(c.duration, 10),
          link: c.url,
        }))
      );
    }

    contests.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    const result = contests.slice(0, 15);

    cache.set(cacheKey, result, 1800);
    return result;
  } catch (error) {
    console.error("Contests fetch error:", error.message);
    return [];
  }
}

async function verifyProfileOwnership(platform, rawHandle, token) {
  if (!platform || !rawHandle || !token) {
    return { ok: false, error: "Missing required platform, handle, or verification token." };
  }
  const cleanToken = String(token).trim().toLowerCase();

  if (platform === "leetcode") {
    const username = extractLeetCodeUsername(rawHandle);
    if (!username) return { ok: false, error: "Invalid LeetCode username." };
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              aboutMe
              realName
              company
              school
            }
          }
        }
      `;
      const { data } = await axios.post(
        "https://leetcode.com/graphql",
        { query, variables: { username } },
        { timeout: 7000, headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" } }
      );
      const matched = data?.data?.matchedUser;
      if (!matched || !matched.profile) {
        return { ok: false, error: `LeetCode profile '${username}' was not found. Please verify the handle.` };
      }
      const bioText = `${matched.profile.aboutMe || ""} ${matched.profile.realName || ""} ${matched.profile.company || ""} ${matched.profile.school || ""}`.toLowerCase();
      if (bioText.includes(cleanToken)) {
        return { ok: true, verifiedHandle: username };
      } else {
        return {
          ok: false,
          error: `Verification token '${token}' not found in LeetCode profile 'About Me' or 'Summary'. Please paste it into your profile settings and click Verify again.`,
        };
      }
    } catch (err) {
      return { ok: false, error: `LeetCode connection error: ${err.message}` };
    }
  }

  if (platform === "codeforces") {
    const handle = extractCodeforcesHandle(rawHandle);
    if (!handle) return { ok: false, error: "Invalid Codeforces handle." };
    try {
      const { data } = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, { timeout: 7000 });
      if (data?.status === "OK" && data.result?.length > 0) {
        const u = data.result[0];
        const text = `${u.organization || ""} ${u.city || ""} ${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        if (text.includes(cleanToken)) {
          return { ok: true, verifiedHandle: handle };
        } else {
          return {
            ok: false,
            error: `Verification token '${token}' not found in Codeforces 'Organization', 'City', or 'Name'. Please add it and click Verify again.`,
          };
        }
      }
      return { ok: false, error: `Codeforces handle '${handle}' was not found.` };
    } catch (err) {
      return { ok: false, error: `Codeforces connection error: ${err.message}` };
    }
  }

  if (platform === "codechef") {
    const username = extractCodeChefUsername(rawHandle);
    if (!username) return { ok: false, error: "Invalid CodeChef username." };
    try {
      const { data } = await axios.get(`https://www.codechef.com/users/${username}`, {
        timeout: 7000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const htmlText = String(data).toLowerCase();
      if (htmlText.includes(cleanToken)) {
        return { ok: true, verifiedHandle: username };
      } else {
        return {
          ok: false,
          error: `Verification token '${token}' not found on CodeChef profile. Please add it to your About Me or Name and click Verify again.`,
        };
      }
    } catch (err) {
      return { ok: false, error: `CodeChef connection error: ${err.message}` };
    }
  }

  if (platform === "github") {
    const username = String(rawHandle).trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!username) return { ok: false, error: "Invalid GitHub username." };
    try {
      const { data } = await axios.get(`https://api.github.com/users/${username}`, {
        timeout: 7000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const text = `${data.bio || ""} ${data.company || ""} ${data.name || ""}`.toLowerCase();
      if (text.includes(cleanToken)) {
        return { ok: true, verifiedHandle: username };
      } else {
        return {
          ok: false,
          error: `Verification token '${token}' not found in GitHub Bio or Company. Please add it to your profile and click Verify again.`,
        };
      }
    } catch (err) {
      return { ok: false, error: `GitHub connection error: ${err.message}` };
    }
  }

  return { ok: false, error: `Platform '${platform}' is not supported for verification.` };
}

module.exports = {
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
};


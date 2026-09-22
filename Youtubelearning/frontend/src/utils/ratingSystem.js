/**
 * LearnSphere Rating (LSR) Engine & Achievement System
 * 
 * Accurately scores user learning effort, curriculum completion,
 * retention/quizzes, coding problem mastery, and study consistency.
 */

export const RATING_TIERS = [
  {
    name: "Initiate",
    tag: "Bronze",
    min: 100,
    max: 139,
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ring: "from-amber-600 to-amber-400",
    readiness: "Foundations & Syntax Exploration",
    percentile: "Top 95%",
  },
  {
    name: "Apprentice",
    tag: "Silver",
    min: 140,
    max: 189,
    color: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
    ring: "from-slate-400 to-slate-200",
    readiness: "Core Data Structures & Problem Solving",
    percentile: "Top 72%",
  },
  {
    name: "Specialist",
    tag: "Gold",
    min: 190,
    max: 259,
    color: "text-amber-400 dark:text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    ring: "from-amber-400 to-yellow-200",
    readiness: "Junior / Mid SWE Interview Ready",
    percentile: "Top 45%",
  },
  {
    name: "Expert",
    tag: "Platinum",
    min: 260,
    max: 349,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "from-emerald-500 to-teal-300",
    readiness: "Full-Stack & Algorithms Technical Mastery",
    percentile: "Top 18%",
  },
  {
    name: "Master",
    tag: "Diamond",
    min: 350,
    max: 459,
    color: "text-indigo-400 dark:text-indigo-300",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    ring: "from-indigo-500 via-purple-500 to-sky-400",
    readiness: "Senior SWE / FAANG Technical Bar",
    percentile: "Top 5%",
  },
  {
    name: "Grandmaster",
    tag: "Obsidian Ruby",
    min: 460,
    max: 599,
    color: "text-rose-400 dark:text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    ring: "from-rose-500 via-amber-500 to-purple-600",
    readiness: "Elite Competitive Programmer & System Architect",
    percentile: "Top 1%",
  },
  {
    name: "Titan",
    tag: "Legendary Scholar",
    min: 600,
    max: 9999,
    color: "text-purple-400 dark:text-purple-300",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    ring: "from-purple-600 via-pink-500 to-amber-400",
    readiness: "Distinguished Principal / Staff Level Mastery",
    percentile: "Top 0.1%",
  },
];

export function getRatingTier(rating = 100) {
  const safeRating = Math.max(100, Number(rating) || 100);
  for (let i = RATING_TIERS.length - 1; i >= 0; i--) {
    if (safeRating >= RATING_TIERS[i].min) {
      const tier = RATING_TIERS[i];
      const nextTier = RATING_TIERS[i + 1] || null;
      let progressPct = 100;
      let pointsToNext = 0;
      if (nextTier) {
        const range = nextTier.min - tier.min;
        const current = safeRating - tier.min;
        progressPct = Math.min(100, Math.max(0, Math.round((current / range) * 100)));
        pointsToNext = Math.max(0, nextTier.min - safeRating);
      }
      return {
        ...tier,
        nextTier: nextTier ? nextTier.name : null,
        nextMin: nextTier ? nextTier.min : null,
        pointsToNext,
        progressPct,
      };
    }
  }
  return RATING_TIERS[0];
}

/**
 * Calculates the comprehensive LearnSphere Rating 2.0 (5-Pillar Model)
 */
export function calculateLSRating({
  codingStats = {},
  watchTimeSec = 0,
  completedVideos = 0,
  quizAttempts = [],
  streakDays = 0,
  verifiedPlatforms = {},
  platformActivities = {},
  activeDaysCount = 0,
}) {
  const BASE_RATING = 100;

  // PILLAR 1: CURRICULUM & FOCUSED EFFORT
  // Watch Time (diminishing return curve: sqrt(minutes) * 3, capped at 60 pts)
  const safeWatchSec = Math.max(0, Number(watchTimeSec) || 0);
  const watchMinutes = Math.floor(safeWatchSec / 60);
  const watchHours = (safeWatchSec / 3600).toFixed(1);
  const watchTimePoints = Math.min(60, Math.round(Math.sqrt(watchMinutes) * 3));

  // Completed Tracks (+5 pts each)
  const safeCompleted = Math.max(0, Number(completedVideos) || 0);
  const trackPoints = safeCompleted * 5;
  const curriculumPoints = watchTimePoints + trackPoints;

  // PILLAR 2: COMPETITIVE & ALGORITHMIC PROBLEM SOLVING
  // LeetCode Problem Solves (Easy +1, Med +3, Hard +8)
  const easy = Number(codingStats?.easySolved) || 0;
  const medium = Number(codingStats?.mediumSolved) || 0;
  const hard = Number(codingStats?.hardSolved) || 0;
  const solvePoints = easy * 1 + medium * 3 + hard * 8;

  // Contest Rating Bonuses (Verified handles)
  const lcContestRating = Number(codingStats?.contestRating) || 0;
  const lcContestBonus = lcContestRating > 1200 ? Math.round((lcContestRating - 1200) * 0.05) : 0;

  const cfStats = platformActivities?.codeforces;
  const cfRating = Number(codingStats?.codeforcesRating || cfStats?.rating) || 0;
  const cfContestBonus = cfRating > 1000 ? Math.round((cfRating - 1000) * 0.05) : 0;
  const cfSolveBonus = Math.min(30, Math.round((Number(cfStats?.total) || 0) * 0.5));

  const rawProblemPoints = solvePoints + lcContestBonus + cfContestBonus + cfSolveBonus;

  // Anti-spoof verification gate
  const hasCodingProfile = Boolean(codingStats?.username || codingStats?.totalSolved > 0 || codingStats?.leetcode || codingStats?.codeforces);
  const isCodingVerified = Boolean(verifiedPlatforms?.leetcode || verifiedPlatforms?.codeforces || verifiedPlatforms?.codechef);
  const problemPoints = hasCodingProfile && !isCodingVerified ? 0 : rawProblemPoints;

  // PILLAR 3: ACTIVE RECALL & RETENTION
  let passedQuizzes = 0;
  let distinctionQuizzes = 0;
  let totalScoreSum = 0;

  if (Array.isArray(quizAttempts) && quizAttempts.length > 0) {
    quizAttempts.forEach((attempt) => {
      const pct = attempt.percentage ?? (attempt.score && attempt.totalQuestions ? (attempt.score / attempt.totalQuestions) * 100 : 0);
      if (pct >= 70) passedQuizzes++;
      if (pct >= 90) distinctionQuizzes++;
      totalScoreSum += pct;
    });
  }

  const avgQuizScore = quizAttempts.length > 0 ? Math.round(totalScoreSum / quizAttempts.length) : 0;
  const quizAccuracyBonus = quizAttempts.length > 0 ? Math.round((avgQuizScore / 100) * 10) : 0;
  const quizPoints = passedQuizzes * 4 + distinctionQuizzes * 2 + quizAccuracyBonus;

  // PILLAR 4: OPEN SOURCE & ENGINEERING PROOF (GITHUB)
  const ghStats = platformActivities?.github;
  const isGhVerified = Boolean(verifiedPlatforms?.github);
  const ghRepos = Number(ghStats?.publicRepos) || 0;
  const ghEvents = Number(ghStats?.total) || 0;

  const ghIdentityBonus = isGhVerified ? 5 : 0;
  const ghRepoPoints = isGhVerified ? Math.min(15, Math.round(ghRepos * 1.5)) : 0;
  const ghEventPoints = isGhVerified ? Math.min(20, Math.round(ghEvents * 0.3)) : 0;
  const githubPoints = ghIdentityBonus + ghRepoPoints + ghEventPoints;
  const rawGithubPoints = 5 + Math.min(15, Math.round(ghRepos * 1.5)) + Math.min(20, Math.round(ghEvents * 0.3));

  // PILLAR 5: CONSISTENCY & DISCIPLINE (STREAK + ACTIVE DAYS)
  const safeStreak = Math.max(0, Number(streakDays) || 0);
  let streakPoints = 0;
  if (safeStreak <= 7) {
    streakPoints = safeStreak * 1;
  } else if (safeStreak <= 30) {
    streakPoints = 7 + (safeStreak - 7) * 2;
  } else {
    streakPoints = 7 + 46 + (safeStreak - 30) * 3;
  }

  const safeActiveDays = Math.max(0, Number(activeDaysCount) || 0);
  const habitPoints = Math.min(30, Math.round(safeActiveDays * 0.5));
  const consistencyPoints = streakPoints + habitPoints;

  // COMPUTE OVERALL LEARNESPHERE RATING
  const totalRating = BASE_RATING + curriculumPoints + problemPoints + quizPoints + githubPoints + consistencyPoints;
  const tier = getRatingTier(totalRating);

  // LEVEL UP ROADMAP RECOMMENDATIONS
  const ptsNeeded = tier.nextMin ? tier.nextMin - totalRating : 0;
  const nextTierRoadmap = [];
  if (ptsNeeded > 0) {
    nextTierRoadmap.push({
      action: `Solve ${Math.ceil(ptsNeeded / 3)} Medium problems on LeetCode (+3 pts each)`,
      platform: "leetcode",
      pointsEstimate: Math.ceil(ptsNeeded / 3) * 3,
    });
    nextTierRoadmap.push({
      action: `Pass ${Math.ceil(ptsNeeded / 4)} quiz modules with ≥70% score (+4 pts each)`,
      platform: "quizzes",
      pointsEstimate: Math.ceil(ptsNeeded / 4) * 4,
    });
    nextTierRoadmap.push({
      action: `Complete ${Math.ceil(ptsNeeded / 5)} curriculum lecture track (+5 pts each)`,
      platform: "curriculum",
      pointsEstimate: Math.ceil(ptsNeeded / 5) * 5,
    });
    if (safeStreak < 30) {
      nextTierRoadmap.push({
        action: `Maintain your streak for ${Math.min(14, Math.ceil(ptsNeeded / 2))} more days`,
        platform: "streak",
        pointsEstimate: Math.min(14, Math.ceil(ptsNeeded / 2)) * 2,
      });
    }
  }

  return {
    totalRating,
    tier,
    isCodingVerified,
    isGhVerified,
    pendingProblemPoints: hasCodingProfile && !isCodingVerified ? rawProblemPoints : 0,
    pendingGithubPoints: !isGhVerified && ghRepos > 0 ? rawGithubPoints : 0,
    nextTierRoadmap,
    pillars: {
      curriculum: {
        name: "Curriculum & Focus",
        points: curriculumPoints,
        maxReference: 80,
        pct: Math.min(100, Math.round((curriculumPoints / 80) * 100)),
        color: "text-sky-500",
        bg: "bg-sky-500",
        items: [
          { label: "Focused Watch Time", value: `${watchHours}h`, pts: `+${watchTimePoints} pts` },
          { label: "Completed Tracks", value: `${safeCompleted} modules`, pts: `+${trackPoints} pts` },
        ],
      },
      problemSolving: {
        name: "Algorithmic Solves",
        points: problemPoints,
        rawPoints: rawProblemPoints,
        maxReference: 120,
        pct: Math.min(100, Math.round((problemPoints / 120) * 100)),
        color: "text-amber-500",
        bg: "bg-amber-500",
        isVerified: isCodingVerified,
        items: [
          { label: "Account Ownership", value: isCodingVerified ? "Verified Profile Account" : (hasCodingProfile ? "Unverified (Verify in Profile)" : "No Handle Connected"), pts: isCodingVerified ? "Verified (+Active)" : "Locked (0 pts)" },
          { label: "LeetCode Solves", value: `${easy + medium + hard} (${easy}E / ${medium}M / ${hard}H)`, pts: isCodingVerified ? `+${solvePoints} pts` : `+0 pts (${solvePoints} unverified)` },
          { label: "Contest Bonuses", value: lcContestBonus > 0 || cfContestBonus > 0 ? `LC: ${lcContestBonus} • CF: ${cfContestBonus}` : "None", pts: isCodingVerified ? `+${lcContestBonus + cfContestBonus} pts` : `+0 pts (${lcContestBonus + cfContestBonus} unverified)` },
        ],
      },
      recall: {
        name: "Active Recall",
        points: quizPoints,
        maxReference: 50,
        pct: Math.min(100, Math.round((quizPoints / 50) * 100)),
        color: "text-emerald-500",
        bg: "bg-emerald-500",
        items: [
          { label: "Passed Quizzes", value: `${passedQuizzes} passed (${distinctionQuizzes} distinction)`, pts: `+${passedQuizzes * 4 + distinctionQuizzes * 2} pts` },
          { label: "Accuracy Index", value: `${avgQuizScore}% avg`, pts: `+${quizAccuracyBonus} pts` },
        ],
      },
      engineering: {
        name: "Engineering & Open Source",
        points: githubPoints,
        rawPoints: rawGithubPoints,
        maxReference: 40,
        pct: Math.min(100, Math.round((githubPoints / 40) * 100)),
        color: "text-purple-500",
        bg: "bg-purple-500",
        isVerified: isGhVerified,
        items: [
          { label: "GitHub Presence", value: isGhVerified ? "Verified Identity" : "Unverified", pts: `+${ghIdentityBonus} pts` },
          { label: "Public Repos & Events", value: `${ghRepos} repos • ${ghEvents} events`, pts: `+${ghRepoPoints + ghEventPoints} pts` },
        ],
      },
      consistency: {
        name: "Consistency & Habit",
        points: consistencyPoints,
        maxReference: 60,
        pct: Math.min(100, Math.round((consistencyPoints / 60) * 100)),
        color: "text-rose-500",
        bg: "bg-rose-500",
        items: [
          { label: "Learning Streak", value: `${safeStreak} consecutive days`, pts: `+${streakPoints} pts` },
          { label: "Active Study Days", value: `${safeActiveDays} total active days`, pts: `+${habitPoints} pts` },
        ],
      },
    },
    breakdown: {
      base: BASE_RATING,
      curriculum: curriculumPoints,
      problemSolving: {
        points: problemPoints,
        totalSolved: Number(codingStats?.totalSolved) || (easy + medium + hard),
        formula: isCodingVerified ? "Verified LC & CF problem solves & contest bonuses" : "Requires verification",
      },
      watchTime: {
        hours: watchHours,
        points: watchTimePoints,
        formula: "diminishing return: √min × 3",
      },
      tracks: {
        completedCount: safeCompleted,
        points: trackPoints,
      },
      quizzes: {
        passedCount: passedQuizzes,
        avgScore: avgQuizScore,
        points: quizPoints,
      },
      streak: {
        streakDays: safeStreak,
        points: streakPoints,
      },
      engineering: {
        points: githubPoints,
        repos: ghRepos,
        events: ghEvents,
      },
      consistency: {
        streakDays: safeStreak,
        activeDays: safeActiveDays,
        points: consistencyPoints,
      },
      watchHours,
      watchTimePoints,
      trackPoints,
      quizPoints,
      problemPoints,
      streakPoints,
    },
  };
}

/**
 * Dynamically evaluates genuine achievement badges
 */
export function evaluateBadges({
  codingStats = {},
  watchTimeSec = 0,
  completedVideos = 0,
  quizAttempts = [],
  streakDays = 0,
  verifiedPlatforms = {},
}) {
  const safeWatchSec = Math.max(0, Number(watchTimeSec) || 0);
  const isCodingVerified = Boolean(verifiedPlatforms?.leetcode || verifiedPlatforms?.codeforces || verifiedPlatforms?.codechef);
  const rawTotalSolved = (Number(codingStats?.easySolved) || 0) + (Number(codingStats?.mediumSolved) || 0) + (Number(codingStats?.hardSolved) || 0);
  const totalSolved = isCodingVerified ? rawTotalSolved : 0;
  const hardSolved = isCodingVerified ? (Number(codingStats?.hardSolved) || 0) : 0;
  const mediumSolved = isCodingVerified ? (Number(codingStats?.mediumSolved) || 0) : 0;
  const contestRating = isCodingVerified ? (Number(codingStats?.contestRating) || 0) : 0;
  const safeStreak = Math.max(0, Number(streakDays) || 0);
  const passedQuizzes = (Array.isArray(quizAttempts) ? quizAttempts : []).filter((q) => {
    const pct = q.percentage ?? (q.score && q.totalQuestions ? (q.score / q.totalQuestions) * 100 : 0);
    return pct >= 70;
  }).length;


  const definitions = [
    {
      id: "first_track",
      name: "First Step",
      category: "Learning",
      desc: "Complete your first video track or log 5 mins of focused study",
      current: Math.max(completedVideos, safeWatchSec >= 300 ? 1 : 0),
      target: 1,
      unit: "track",
      color: "emerald",
      icon: "graduationCap",
    },
    {
      id: "streak_starter",
      name: "Consistency Spark",
      category: "Consistency",
      desc: "Maintain an active 3-day learning streak",
      current: safeStreak,
      target: 3,
      unit: "days",
      color: "amber",
      icon: "flame",
    },
    {
      id: "streak_master",
      name: "Streak Warrior",
      category: "Consistency",
      desc: "Maintain a dedicated 7-day study streak",
      current: safeStreak,
      target: 7,
      unit: "days",
      color: "amber",
      icon: "flame",
    },
    {
      id: "binge_scholar",
      name: "Binge Scholar",
      category: "Learning",
      desc: "Log over 2 hours of focused video learning",
      current: Math.round(safeWatchSec / 60),
      target: 120,
      unit: "mins",
      color: "sky",
      icon: "clock",
    },
    {
      id: "marathon_learner",
      name: "Marathon Learner",
      category: "Learning",
      desc: "Accumulate 10+ hours of video study",
      current: Math.round(safeWatchSec / 3600),
      target: 10,
      unit: "hours",
      color: "indigo",
      icon: "bookOpen",
    },
    {
      id: "quiz_initiate",
      name: "Quiz Initiate",
      category: "Quizzes",
      desc: "Successfully pass your first knowledge assessment",
      current: passedQuizzes,
      target: 1,
      unit: "quiz",
      color: "purple",
      icon: "sparkles",
    },
    {
      id: "quiz_ace",
      name: "Precision Mind",
      category: "Quizzes",
      desc: "Pass 5 knowledge check quizzes with high mastery",
      current: passedQuizzes,
      target: 5,
      unit: "quizzes",
      color: "purple",
      icon: "checkCircle",
    },
    {
      id: "code_novice",
      name: "Code Gladiator",
      category: "Coding",
      desc: "Solve 10 coding problems on LeetCode / Codeforces",
      current: totalSolved,
      target: 10,
      unit: "problems",
      color: "rose",
      icon: "code",
    },
    {
      id: "code_century",
      name: "Century Solver",
      category: "Coding",
      desc: "Solve 50+ algorithmic coding problems",
      current: totalSolved,
      target: 50,
      unit: "problems",
      color: "rose",
      icon: "trophy",
    },
    {
      id: "hard_slayer",
      name: "Hard Problem Slayer",
      category: "Coding",
      desc: "Conquer at least 1 Hard algorithmic challenge or reach 1600+ contest rating",
      current: hardSolved > 0 ? 1 : (contestRating >= 1600 ? 1 : 0),
      target: 1,
      unit: "achievement",
      color: "amber",
      icon: "shield",
    },
    {
      id: "omni_learner",
      name: "Omni Scholar",
      category: "Mastery",
      desc: "Earn progress in all 4 pillars: Watch Time, Tracks, Quizzes, and Coding",
      current: (safeWatchSec > 0 ? 1 : 0) + (completedVideos > 0 ? 1 : 0) + (passedQuizzes > 0 ? 1 : 0) + (totalSolved > 0 ? 1 : 0),
      target: 4,
      unit: "pillars",
      color: "indigo",
      icon: "zap",
    },
  ];

  return definitions.map((b) => {
    const isUnlocked = b.current >= b.target;
    const pct = Math.min(100, Math.round((b.current / b.target) * 100));
    return {
      ...b,
      isUnlocked,
      pct,
    };
  });
}

/**
 * Derives realistic topic masteries from user's progress and coding solves
 */
export function deriveTopicMastery(codingStats = {}, progressList = [], quizAttempts = []) {
  const topics = [
    {
      id: "dsa_arrays",
      name: "Arrays, Pointers & Strings",
      category: "Data Structures",
      baselineSolved: Number(codingStats?.easySolved) || 0,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "dsa_trees_graphs",
      name: "Trees, Graphs & BFS/DFS",
      category: "Algorithms",
      baselineSolved: Number(codingStats?.mediumSolved) || 0,
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      id: "dsa_dp",
      name: "Dynamic Programming & Recursion",
      category: "Advanced Algorithms",
      baselineSolved: Number(codingStats?.hardSolved) || 0,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: "web_frontend",
      name: "React, Web Architecture & UI",
      category: "Full Stack",
      baselineSolved: progressList.filter((p) => /react|frontend|javascript|css|html|web/i.test(p.title || "")).length,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "backend_systems",
      name: "Node, APIs & System Design",
      category: "Engineering",
      baselineSolved: progressList.filter((p) => /backend|node|api|database|system|mongo/i.test(p.title || "")).length,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "quizzes_retention",
      name: "Quiz Retention & Recall",
      category: "Cognitive Mastery",
      baselineSolved: quizAttempts.length,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return topics.map((t) => {
    let level = "Beginner";
    let pct = Math.min(100, Math.round(t.baselineSolved * 8));
    if (t.baselineSolved >= 20 || pct >= 80) {
      level = "Mastery";
      pct = Math.min(100, Math.max(80, pct));
    } else if (t.baselineSolved >= 8 || pct >= 50) {
      level = "Intermediate";
      pct = Math.min(79, Math.max(50, pct));
    } else if (t.baselineSolved > 0) {
      level = "Foundational";
      pct = Math.min(49, Math.max(15, pct));
    } else {
      level = "Not Started";
      pct = 0;
    }

    return {
      ...t,
      level,
      pct,
      solved: t.baselineSolved,
    };
  });
}

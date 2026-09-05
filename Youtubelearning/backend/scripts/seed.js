const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

const User = require("../models/User");
const Video = require("../models/Video");
const Playlist = require("../models/Playlist");
const Progress = require("../models/Progress");
const Note = require("../models/Note");
const UserActivity = require("../models/UserActivity");

async function seedDatabase() {
  try {
    const mongoUri = env.MONGO_URI || "mongodb://127.0.0.1:27017/youtubelearning";
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log("Cleaning old seed data...");
    await User.deleteMany({ email: "demo@youtubelearning.com" });
    await Video.deleteMany({ youtubeId: { $in: ["dQw4w9WgXcQ", "L_LUpnjgPso"] } });
    await Playlist.deleteMany({ name: "Full Stack Web Development" });

    console.log("Creating demo user...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Password123!", salt);

    const demoUser = await User.create({
      name: "Demo Learner",
      email: "demo@youtubelearning.com",
      passwordHash,
      role: "user",
      bio: "Self-taught developer learning Web Development and AI.",
      stats: {
        totalWatchTimeSec: 3600,
        completedVideos: 2,
        completedPlaylists: 1,
        streakDays: 5,
        xp: 250,
      },
      level: 1,
      unlockedFeatures: {
        communityAccess: true,
        directConnect: false,
      },
    });

    console.log(`Demo User created: ${demoUser.email} (Password: Password123!)`);

    console.log("Creating sample videos...");
    const sampleVideos = await Video.insertMany([
      {
        youtubeId: "dQw4w9WgXcQ",
        title: "JavaScript Fundamentals for Beginners",
        channelTitle: "Code Academy",
        description: "Comprehensive guide to JavaScript variables, functions, and async concepts.",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        durationSec: 1800,
      },
      {
        youtubeId: "L_LUpnjgPso",
        title: "Node.js & Express REST API Crash Course",
        channelTitle: "Dev Simplified",
        description: "Learn how to build scalable backend APIs using Node.js and Express.",
        thumbnailUrl: "https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg",
        durationSec: 2400,
      },
    ]);

    console.log("Creating sample playlist...");
    const samplePlaylist = await Playlist.create({
      user: demoUser._id,
      name: "Full Stack Web Development",
      sourcePlaylistId: "PL_DEMO_PLAYLIST_01",
      videos: sampleVideos.map((v) => ({
        videoId: v.youtubeId,
        title: v.title,
        thumbnail: v.thumbnailUrl,
      })),
    });

    console.log("Creating sample progress and notes...");
    await Progress.create({
      userId: demoUser._id,
      videoId: sampleVideos[0].youtubeId,
      title: sampleVideos[0].title,
      lastPositionSec: 450,
      maxPositionSec: 900,
      watchTimeSec: 900,
      durationSec: sampleVideos[0].durationSec,
      completed: false,
    });

    await Note.create({
      user: demoUser._id,
      video: sampleVideos[0]._id,
      youtubeId: sampleVideos[0].youtubeId,
      timestampSec: 120,
      content: "Arrow functions implicitly return concise expressions when single line.",
    });

    const todayStr = new Date().toISOString().split("T")[0];
    await UserActivity.deleteMany({ userId: demoUser._id });
    await UserActivity.create({
      userId: demoUser._id,
      date: todayStr,
      tasksCompleted: 4,
    });

    console.log("✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedDatabase();

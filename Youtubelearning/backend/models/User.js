const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    passwordHash: {
      type: String,
      required: true
    },
    googleId: {
      type: String,
      default: null
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    avatar: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system"
      },
      accentColor: {
        type: String,
        default: "#7c3aed"
      },
      dashboardLayout: {
        type: String,
        enum: ["default", "compact", "focus"],
        default: "default"
      },
      autoplay: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: false
      }
    },
    stats: {
      totalWatchTimeSec: {
        type: Number,
        default: 0
      },
      completedVideos: {
        type: Number,
        default: 0
      },
      completedPlaylists: {
        type: Number,
        default: 0
      },
      streakDays: {
        type: Number,
        default: 0
      },
      xp: {
        type: Number,
        default: 0
      }
    },
    leetcode: { type: String, default: "" },
    codeforces: { type: String, default: "" },
    codechef: { type: String, default: "" },
    tuf: { type: String, default: "" },
    github: { type: String, default: "" },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_.-]+$/, "Username can only contain alphanumeric characters, underscores, and hyphens"],
    },
    location: { type: String, default: "" },
    schoolCompany: { type: String, default: "" },
    website: { type: String, default: "" },
    skills: { type: [String], default: ["JavaScript", "React", "Python", "Data Structures"] },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    experience: [
      {
        role: { type: String, default: "" },
        company: { type: String, default: "" },
        period: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    education: [
      {
        degree: { type: String, default: "" },
        institution: { type: String, default: "" },
        period: { type: String, default: "" },
      },
    ],
    portfolioProjects: [
      {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        tags: { type: [String], default: [] },
        link: { type: String, default: "" },
        github: { type: String, default: "" },
      },
    ],
    verifiedPlatforms: {
      leetcode: { type: Boolean, default: false },
      codeforces: { type: Boolean, default: false },
      codechef: { type: Boolean, default: false },
      github: { type: Boolean, default: false },
    },
    verificationToken: {
      type: String,
      default: "",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    unlockedFeatures: {
      communityAccess: { type: Boolean, default: false },
      directConnect: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.verificationToken) {
    const seed = this._id ? this._id.toString().slice(-6) : Math.random().toString(36).substring(2, 8);
    this.verificationToken = `ls-verify-${seed}`;
  }

  if (!this.username) {
    let base = "";
    if (this.email) {
      base = this.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    } else if (this.name) {
      base = this.name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    }
    if (!base || base.length < 3) base = `learner_${Math.random().toString(36).substring(2, 6)}`;

    let candidate = base.slice(0, 24);
    try {
      const existing = await this.constructor.findOne({ username: candidate, _id: { $ne: this._id } });
      if (existing) {
        candidate = `${candidate.slice(0, 20)}_${Math.floor(100 + Math.random() * 900)}`;
      }
    } catch {
      // ignore
    }
    this.username = candidate;
  }
});

userSchema.methods.updateLevel = function() {
  const streak = this.stats?.streakDays || 0;
  if (streak >= 20) {
    this.level = 2;
    this.unlockedFeatures.communityAccess = true;
    this.unlockedFeatures.directConnect = true;
  } else if (streak >= 10) {
    this.level = 1;
    this.unlockedFeatures.communityAccess = true;
    this.unlockedFeatures.directConnect = false;
  } else {
    this.level = 0;
    this.unlockedFeatures.communityAccess = false;
    this.unlockedFeatures.directConnect = false;
  }
  return this.save();
};



module.exports = mongoose.model("User", userSchema);
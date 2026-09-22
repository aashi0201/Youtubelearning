const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const EmailOtp = require("../models/EmailOtp");
const auth = require("../middleware/auth");
const env = require("../config/env");
const { validatePasswordStrength } = require("../utils/password");
const validateSchema = require("../middleware/validateSchema");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleSchema,
} = require("../validators/authSchemas");

const router = express.Router();

function getActiveEnv() {
  try {
    const dotenv = require("dotenv");
    const path = require("path");
    dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
  } catch (e) {
    // ignore
  }

  return {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || "",
    MAIL_HOST: process.env.MAIL_HOST || env.MAIL_HOST || "",
    MAIL_PORT: process.env.MAIL_PORT || env.MAIL_PORT || 587,
    MAIL_SECURE: process.env.MAIL_SECURE || env.MAIL_SECURE || "false",
    MAIL_USER: process.env.MAIL_USER || env.MAIL_USER || "",
    MAIL_PASS: process.env.MAIL_PASS || env.MAIL_PASS || "",
    MAIL_FROM: process.env.MAIL_FROM || env.MAIL_FROM || "",
  };
}

const { signToken } = require("../utils/jwt");

function sanitizeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    username: user.username || "",
    email: user.email,
    avatar: user.avatar || "",
    bio: user.bio || "",
    location: user.location || "",
    schoolCompany: user.schoolCompany || "",
    website: user.website || "",
    skills: user.skills || [],
    socialLinks: user.socialLinks || {},
    experience: user.experience || [],
    education: user.education || [],
    portfolioProjects: user.portfolioProjects || [],
    leetcode: user.leetcode || "",
    codeforces: user.codeforces || "",
    codechef: user.codechef || "",
    github: user.github || "",
    verifiedPlatforms: user.verifiedPlatforms || {},
    verificationToken: user.verificationToken || "",
    authProvider: user.authProvider || "local",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    level: user.level || 0,
    unlockedFeatures: user.unlockedFeatures || { communityAccess: false, directConnect: false },
    streak: user.stats?.streakDays || 0,
    stats: user.stats || {},
  };
}

async function sendResetEmail(to, resetUrl) {
  const activeEnv = getActiveEnv();
  if (!activeEnv.MAIL_HOST || !activeEnv.MAIL_USER || !activeEnv.MAIL_PASS) {
    return false;
  }

  const isGmail =
    activeEnv.MAIL_HOST === "smtp.gmail.com" ||
    (activeEnv.MAIL_USER && activeEnv.MAIL_USER.endsWith("@gmail.com"));

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: "gmail",
          auth: {
            user: activeEnv.MAIL_USER,
            pass: activeEnv.MAIL_PASS.replace(/\s+/g, ""),
          },
        }
      : {
          host: activeEnv.MAIL_HOST,
          port: Number(activeEnv.MAIL_PORT || 587),
          secure: String(activeEnv.MAIL_SECURE) === "true",
          auth: {
            user: activeEnv.MAIL_USER,
            pass: activeEnv.MAIL_PASS,
          },
        }
  );

  await transporter.sendMail({
    from: activeEnv.MAIL_FROM || activeEnv.MAIL_USER,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px">
            Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
      </div>
    `,
  });

  return true;
}

async function sendOtpEmail(to, otp, purpose = "login") {
  const activeEnv = getActiveEnv();
  const title =
    purpose === "forgot-password"
      ? "Reset Password Verification Code"
      : "Your One-Time Login Code";

  const message =
    purpose === "forgot-password"
      ? "Use the 6-digit verification code below to reset your account password. This code expires in 10 minutes."
      : "Use the 6-digit verification code below to securely sign into your learning account. This code expires in 10 minutes.";

  // If email service credentials are not present, log OTP in console and return in dev
  if (!activeEnv.MAIL_HOST || !activeEnv.MAIL_USER || !activeEnv.MAIL_PASS) {
    console.log(`\n======================================================`);
    console.log(`[AUTH OTP DEV NOTICE]`);
    console.log(`Target Email: ${to}`);
    console.log(`Purpose:      ${purpose}`);
    console.log(`Generated OTP: >>> ${otp} <<<`);
    console.log(`======================================================\n`);
    return { mailed: false, devOtp: otp };
  }

  try {
    const isGmail =
      activeEnv.MAIL_HOST === "smtp.gmail.com" ||
      (activeEnv.MAIL_USER && activeEnv.MAIL_USER.endsWith("@gmail.com"));

    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: activeEnv.MAIL_USER,
              pass: activeEnv.MAIL_PASS.replace(/\s+/g, ""), // strip accidental spaces in app password
            },
          }
        : {
            host: activeEnv.MAIL_HOST,
            port: Number(activeEnv.MAIL_PORT || 587),
            secure: String(activeEnv.MAIL_SECURE) === "true",
            auth: {
              user: activeEnv.MAIL_USER,
              pass: activeEnv.MAIL_PASS,
            },
          }
    );

    await transporter.sendMail({
      from: activeEnv.MAIL_FROM || activeEnv.MAIL_USER,
      to,
      subject: `${otp} is your verification code`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a">
          <div style="margin-bottom:20px">
            <span style="font-weight:800;font-size:18px;color:#2563eb">LearnSphere</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px 0">${title}</h2>
          <p style="font-size:14px;color:#475569;margin:0 0 22px 0;line-height:1.6">${message}</p>
          <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:18px;text-align:center;letter-spacing:10px;font-size:32px;font-weight:800;color:#1e293b;font-family:monospace;margin-bottom:24px">
            ${otp}
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.5">
            If you did not request this verification code, please ignore this email. Never share your verification code with anyone.
          </p>
        </div>
      `,
    });

    return { mailed: true };
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    return { mailed: false, devOtp: otp, error: err.message };
  }
}

// Register
router.post("/register", validateSchema(registerSchema), async (req, res) => {
  try {
    const { name, email, password, username } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "All fields are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanName.length < 2) {
      return res.status(400).json({
        ok: false,
        error: "Name must be at least 2 characters",
      });
    }

    let cleanUsername = "";
    if (username) {
      cleanUsername = String(username).trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({
          ok: false,
          error: "Username must be 3-30 characters (letters, numbers, _, -, or .)",
        });
      }
      const existingUsername = await User.findOne({ username: cleanUsername });
      if (existingUsername) {
        return res.status(400).json({
          ok: false,
          error: `Username @${cleanUsername} is already registered. Please choose another handle.`,
        });
      }
    }

    const passwordStrength = validatePasswordStrength(cleanPassword);
    if (!passwordStrength.ok) {
      return res.status(400).json({
        ok: false,
        error: passwordStrength.message,
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername || undefined,
      passwordHash: hashedPassword,
      authProvider: "local",
    });

    await user.updateLevel();
    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Registration failed",
      details: err.message,
    });
  }
});

// Login (Email or Username)
router.post("/login", validateSchema(loginSchema), async (req, res) => {
  try {
    const rawIdentifier = req.body?.email || req.body?.username || req.body?.identifier;
    const { password } = req.body || {};

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        ok: false,
        error: "Username or email and password required",
      });
    }

    const cleanIdentifier = String(rawIdentifier).trim().toLowerCase().replace(/^@/, "");
    const cleanPassword = String(password);

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
      ],
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "Account not found with this username or email",
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        error: "Incorrect password",
      });
    }

    user.lastLoginAt = new Date();
    await user.updateLevel();

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Login failed",
      details: err.message,
    });
  }
});

// Forgot password (by Email or Username)
router.post("/forgot-password", validateSchema(forgotPasswordSchema), async (req, res) => {
  try {
    const rawInput = String(req.body?.email || req.body?.username || req.body?.identifier || "").trim().toLowerCase().replace(/^@/, "");

    if (!rawInput) {
      return res.status(400).json({
        ok: false,
        error: "Email or username is required",
      });
    }

    const genericResponse = {
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    };

    const user = await User.findOne({
      $or: [
        { email: rawInput },
        { username: rawInput },
      ],
    });

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${rawToken}`;

    let mailed = false;
    try {
      mailed = await sendResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      console.error("Reset mail error:", mailErr.message);
    }

    return res.json({
      ...genericResponse,
      ...(process.env.NODE_ENV !== "production"
        ? { devResetUrl: resetUrl, mailed }
        : {}),
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to process forgot password request",
      details: err.message,
    });
  }
});

// Reset password
router.post("/reset-password/:token", validateSchema(resetPasswordSchema), async (req, res) => {
  try {
    const rawToken = String(req.params.token || "");
    const password = String(req.body?.password || "");

    if (!rawToken || !password) {
      return res.status(400).json({
        ok: false,
        error: "Token and password are required",
      });
    }

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.ok) {
      return res.status(400).json({
        ok: false,
        error: passwordStrength.message,
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "Reset link is invalid or expired",
      });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      ok: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to reset password",
      details: err.message,
    });
  }
});

// ==========================================
// EMAIL OTP SYSTEM (Login & Forgot Password)
// ==========================================

// 1. Send OTP to Email (for login or password reset)
router.post("/send-otp", async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const purpose = req.body?.purpose === "reset_password" ? "reset_password" : "login";

    if (!rawEmail) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address",
      });
    }

    // If purpose is reset_password, verify that the account actually exists
    if (purpose === "reset_password") {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({
          ok: false,
          error: "No account found registered with this email address",
        });
      }
    }

    // Check rate limit: if an OTP was sent in the last 45 seconds, ask user to wait
    const recentOtp = await EmailOtp.findOne({
      email: cleanEmail,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 45 * 1000) },
    });

    if (recentOtp) {
      const secondsLeft = Math.ceil(
        (recentOtp.createdAt.getTime() + 45 * 1000 - Date.now()) / 1000
      );
      return res.status(429).json({
        ok: false,
        error: `Please wait ${secondsLeft > 0 ? secondsLeft : 15}s before requesting a new code.`,
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 8);

    // Invalidate any existing OTPs for this email and purpose
    await EmailOtp.deleteMany({ email: cleanEmail, purpose });

    // Store new OTP with 10-minute expiry
    await EmailOtp.create({
      email: cleanEmail,
      otpHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email (or dev console fallback)
    const mailRes = await sendOtpEmail(cleanEmail, otp, purpose);

    return res.json({
      ok: true,
      message: "Verification code sent to your email address.",
      ...(mailRes.devOtp ? { devOtp: mailRes.devOtp, notice: "Dev mode active" } : {}),
    });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to send verification code. Please try again.",
      details: err.message,
    });
  }
});

// 2. Verify OTP & Log In (Passwordless Login / Registration)
router.post("/verify-otp-login", async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const rawOtp = req.body?.otp;

    if (!rawEmail || !rawOtp) {
      return res.status(400).json({
        ok: false,
        error: "Email and 6-digit code are required",
      });
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanOtp = String(rawOtp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        ok: false,
        error: "Verification code must be exactly 6 digits",
      });
    }

    // Find active OTP record
    const otpRecord = await EmailOtp.findOne({
      email: cleanEmail,
      purpose: "login",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        ok: false,
        error: "Verification code is expired or invalid. Please request a new one.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        ok: false,
        error: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        ok: false,
        error: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`,
      });
    }

    // OTP is valid — consume it immediately
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    // Look up or auto-provision user
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const randomPasswordHash = await bcrypt.hash(
        crypto.randomBytes(24).toString("hex"),
        10
      );
      user = await User.create({
        name: cleanEmail.split("@")[0] || "Learner",
        email: cleanEmail,
        passwordHash: randomPasswordHash,
        authProvider: "local",
      });
    }

    user.lastLoginAt = new Date();
    await user.updateLevel();
    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Verify OTP login error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Verification failed. Please try again.",
      details: err.message,
    });
  }
});

// 3. Request Forgot Password OTP (by Email or Username)
router.post("/forgot-password-otp", async (req, res) => {
  try {
    const rawInput = String(req.body?.email || req.body?.username || req.body?.identifier || "").trim().toLowerCase().replace(/^@/, "");
    if (!rawInput) {
      return res.status(400).json({
        ok: false,
        error: "Email or username is required",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: rawInput },
        { username: rawInput },
      ],
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "No account found with this username or email address.",
      });
    }

    const cleanEmail = user.email;
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 8);

    await EmailOtp.deleteMany({ email: cleanEmail, purpose: "reset_password" });
    await EmailOtp.create({
      email: cleanEmail,
      otpHash,
      purpose: "reset_password",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const mailRes = await sendOtpEmail(cleanEmail, otp, "reset_password");

    return res.json({
      ok: true,
      email: cleanEmail,
      message: `Password reset code sent to registered email (${cleanEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}).`,
      ...(mailRes.devOtp ? { devOtp: mailRes.devOtp, notice: "Dev mode active" } : {}),
    });
  } catch (err) {
    console.error("Forgot password OTP error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to send reset code",
      details: err.message,
    });
  }
});

// 4. Reset Password with OTP (Email or Username)
router.post("/reset-password-otp", async (req, res) => {
  try {
    const { email, username, identifier, otp, password } = req.body || {};
    const rawInput = String(email || username || identifier || "").trim().toLowerCase().replace(/^@/, "");

    if (!rawInput || !otp || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email/username, 6-digit code, and new password are required",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: rawInput },
        { username: rawInput },
      ],
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Account not found",
      });
    }

    const cleanEmail = user.email;
    const cleanOtp = String(otp).trim();
    const newPassword = String(password);

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        ok: false,
        error: "Verification code must be 6 digits",
      });
    }

    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.ok) {
      return res.status(400).json({
        ok: false,
        error: passwordStrength.message,
      });
    }

    // Verify OTP
    const otpRecord = await EmailOtp.findOne({
      email: cleanEmail,
      purpose: "reset_password",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        ok: false,
        error: "Reset code has expired or is invalid. Please request a new code.",
      });
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        ok: false,
        error: "Incorrect verification code. Please check and try again.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Consume OTP
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.json({
      ok: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password OTP error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to reset password",
      details: err.message,
    });
  }
});

// Google login
router.post("/google", validateSchema(googleSchema), async (req, res) => {
  try {
    const credential = req.body?.credential;

    if (!credential) {
      return res.status(400).json({
        ok: false,
        error: "Google credential is required",
      });
    }

    const activeEnv = getActiveEnv();
    const googleClientId = activeEnv.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return res.status(400).json({
        ok: false,
        error: "Google Sign-In is not configured on the server. Please add GOOGLE_CLIENT_ID to backend/.env",
      });
    }

    const dynamicGoogleClient = new OAuth2Client(googleClientId);

    const ticket = await dynamicGoogleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.email_verified) {
      return res.status(400).json({
        ok: false,
        error: "Google account email is not verified",
      });
    }

    const cleanEmail = String(payload.email).trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(
        crypto.randomBytes(24).toString("hex"),
        10
      );

      user = await User.create({
        name: payload.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash: randomPasswordHash,
        googleId: payload.sub,
        authProvider: "google",
        avatar: payload.picture || undefined,
      });
    } else {
      user.googleId = payload.sub;
      user.authProvider = "google";
      await user.updateLevel();
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Google login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Google login error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Google login failed",
      details: err.message,
    });
  }
});

// Current user (returns full sanitized profile)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found",
      });
    }

    return res.json({
      ok: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Auth /me error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch current user",
      details: err.message,
    });
  }
});

// Check Username Availability
router.get("/check-username/:username", async (req, res) => {
  try {
    const raw = String(req.params.username || "").trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(raw)) {
      return res.json({
        ok: false,
        available: false,
        error: "Username must be 3-30 characters containing letters, numbers, _, -, or .",
      });
    }

    const currentUserId = req.query.currentUserId;
    const existing = await User.findOne({ username: raw });
    if (existing && (!currentUserId || existing._id.toString() !== currentUserId)) {
      return res.json({
        ok: true,
        available: false,
        message: `Username @${raw} is already taken.`,
      });
    }

    return res.json({
      ok: true,
      available: true,
      message: `Username @${raw} is available!`,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Update Profile (Authenticated)
router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const {
      name,
      username,
      bio,
      location,
      schoolCompany,
      website,
      avatar,
      github,
      leetcode,
      codeforces,
      codechef,
      skills,
      socialLinks,
      experience,
      education,
      portfolioProjects,
    } = req.body || {};

    if (name !== undefined) user.name = String(name).trim();
    if (bio !== undefined) user.bio = String(bio).trim().slice(0, 300);
    if (location !== undefined) user.location = String(location).trim();
    if (schoolCompany !== undefined) user.schoolCompany = String(schoolCompany).trim();
    if (website !== undefined) user.website = String(website).trim();
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (github !== undefined) user.github = String(github).trim();
    if (leetcode !== undefined) user.leetcode = String(leetcode).trim();
    if (codeforces !== undefined) user.codeforces = String(codeforces).trim();
    if (codechef !== undefined) user.codechef = String(codechef).trim();

    if (Array.isArray(skills)) {
      user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    }
    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = {
        github: String(socialLinks.github ?? user.socialLinks?.github ?? "").trim(),
        linkedin: String(socialLinks.linkedin ?? user.socialLinks?.linkedin ?? "").trim(),
        twitter: String(socialLinks.twitter ?? user.socialLinks?.twitter ?? "").trim(),
        website: String(socialLinks.website ?? user.socialLinks?.website ?? "").trim(),
      };
    }
    if (Array.isArray(experience)) user.experience = experience;
    if (Array.isArray(education)) user.education = education;
    if (Array.isArray(portfolioProjects)) user.portfolioProjects = portfolioProjects;

    // Handle Username update & conflict validation
    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase().replace(/^@/, "");
      if (cleanUsername && cleanUsername !== user.username) {
        if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
          return res.status(400).json({
            ok: false,
            error: "Username must be 3-30 characters containing only letters, numbers, _, -, or .",
          });
        }
        const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({
            ok: false,
            error: `Username @${cleanUsername} is already taken. Please choose another handle.`,
          });
        }
        user.username = cleanUsername;
      }
    }

    await user.save();

    return res.json({
      ok: true,
      message: "Profile updated successfully!",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to update profile",
      details: err.message,
    });
  }
});

// Upload Profile Avatar (Base64 data or image URL)
router.post("/upload-avatar", auth, async (req, res) => {
  try {
    const { avatar } = req.body || {};
    if (!avatar || typeof avatar !== "string") {
      return res.status(400).json({ ok: false, error: "Avatar image data is required" });
    }

    // Basic sanity check on size (e.g. max ~4MB base64)
    if (avatar.length > 5 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: "Image is too large. Max size is 4MB." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    user.avatar = avatar;
    await user.save();

    return res.json({
      ok: true,
      message: "Avatar updated successfully!",
      avatar: user.avatar,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Upload avatar error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to upload avatar",
      details: err.message,
    });
  }
});

module.exports = router;

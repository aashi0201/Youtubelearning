const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "User already exists with this email"
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = signToken(user);
    setTokenCookie(res, token);

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password"
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    setTokenCookie(res, token);

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({
        ok: false,
        error: "User not found or deactivated"
      });
    }
    return res.status(200).json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const allowedFields = ["name", "avatar", "bio", "preferences"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: 'after',
      runValidators: true
    }).select("-passwordHash");

    return res.status(200).json({
      ok: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe
};
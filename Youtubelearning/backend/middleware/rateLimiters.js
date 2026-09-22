const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const isDev = (env.NODE_ENV || "development") === "development";

const shouldSkipRateLimit = (req) => {
  if (
    isDev ||
    process.env.DISABLE_RATE_LIMIT === "true" ||
    process.env.NODE_ENV === "test" ||
    req.path === "/api/health" ||
    req.path === "/"
  ) {
    return true;
  }
  return false;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_AUTH_MAX
    ? Number(process.env.RATE_LIMIT_AUTH_MAX)
    : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many auth requests. Please try again later.",
  },
  skip: shouldSkipRateLimit,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_AI_MAX
    ? Number(process.env.RATE_LIMIT_AI_MAX)
    : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many AI requests. Please try again later.",
  },
  skip: shouldSkipRateLimit,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_GENERAL_MAX
    ? Number(process.env.RATE_LIMIT_GENERAL_MAX)
    : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many requests. Please slow down.",
  },
  skip: shouldSkipRateLimit,
});

module.exports = {
  authLimiter,
  aiLimiter,
  generalLimiter,
};
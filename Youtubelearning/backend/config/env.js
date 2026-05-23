require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
  AI_PROVIDER: process.env.AI_PROVIDER || "openrouter",
  AI_MODEL: process.env.AI_MODEL || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  REDIS_URL: process.env.REDIS_URL || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  MAIL_HOST: process.env.MAIL_HOST || "",
  MAIL_PORT: process.env.MAIL_PORT || "587",
  MAIL_SECURE: process.env.MAIL_SECURE || "false",
  MAIL_USER: process.env.MAIL_USER || "",
  MAIL_PASS: process.env.MAIL_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
};

function hasValue(value) {
  return Boolean(String(value || "").trim());
}

function getStartupEnvErrors() {
  const errors = [];

  if (!hasValue(env.MONGO_URI)) {
    errors.push("MONGO_URI is required");
  }

  if (!hasValue(env.JWT_SECRET)) {
    errors.push("JWT_SECRET is required");
  } else if (env.JWT_SECRET.length < 16) {
    errors.push("JWT_SECRET should be at least 16 characters");
  }

  if (!hasValue(env.YOUTUBE_API_KEY)) {
    errors.push("YOUTUBE_API_KEY is required for video search/import");
  }

  if (env.AI_PROVIDER === "gemini") {
    if (!hasValue(env.GEMINI_API_KEY)) {
      errors.push("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
    }
  } else if (!hasValue(env.OPENROUTER_API_KEY)) {
    errors.push("OPENROUTER_API_KEY is required for AI features");
  }

  return errors;
}

function validateStartupEnv() {
  const errors = getStartupEnvErrors();

  if (errors.length) {
    throw new Error(`Missing or invalid environment configuration:\n- ${errors.join("\n- ")}`);
  }
}

function getConfigStatus() {
  return {
    nodeEnv: env.NODE_ENV,
    frontendUrlConfigured: hasValue(env.FRONTEND_URL),
    youtubeConfigured: hasValue(env.YOUTUBE_API_KEY),
    aiProvider: env.AI_PROVIDER,
    aiModel: env.AI_PROVIDER === "gemini" ? env.GEMINI_MODEL : env.OPENROUTER_MODEL,
    aiConfigured:
      env.AI_PROVIDER === "gemini"
        ? hasValue(env.GEMINI_API_KEY)
        : hasValue(env.OPENROUTER_API_KEY),
    googleAuthConfigured: hasValue(env.GOOGLE_CLIENT_ID),
    mailConfigured: hasValue(env.MAIL_HOST) && hasValue(env.MAIL_USER) && hasValue(env.MAIL_PASS),
    redisConfigured: hasValue(env.REDIS_URL),
  };
}

module.exports = {
  ...env,
  getConfigStatus,
  getStartupEnvErrors,
  validateStartupEnv,
};

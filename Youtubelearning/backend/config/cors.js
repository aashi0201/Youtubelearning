const env = require("./env");

function getAllowedOrigins() {
  return String(env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsOrigin(origin, callback) {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (like mobile apps, curl, postman)
  if (!origin) {
    callback(null, true);
    return;
  }

  // Allow explicit CORS_ORIGINS match
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  // Allow FRONTEND_URL if set
  if (env.FRONTEND_URL && origin === String(env.FRONTEND_URL).trim().replace(/\/+$/, "")) {
    callback(null, true);
    return;
  }

  // Allow Vercel preview & production deployments (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9._-]+\.vercel\.app$/.test(origin)) {
    callback(null, true);
    return;
  }

  // Allow any localhost origin in development (e.g., http://localhost:5173, http://localhost:5174)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}

module.exports = {
  corsOrigin,
  getAllowedOrigins,
};

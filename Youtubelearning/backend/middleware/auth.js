const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        error: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const id = decoded.id || decoded._id || decoded.userId;

    req.user = {
      id,
      userId: id,
      _id: id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({
      ok: false,
      error: "Invalid token"
    });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const user = await User.findById(userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Admin access required"
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = auth;
module.exports.auth = auth;
module.exports.requireAdmin = requireAdmin;

const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return "dev-secret-change-in-production";
  }
  return secret;
}

function signToken(user) {
  const payload = {
    id: user._id || user.id,
    _id: user._id || user.id,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken,
};

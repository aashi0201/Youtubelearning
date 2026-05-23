const jwt = require("jsonwebtoken");
const env = require("../config/env");

exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  if (!token) {
    return res.status(401).json({ ok: false, error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const id = decoded.id || decoded._id || decoded.userId;

    req.user = {
      ...decoded,
      id,
      userId: id,
      _id: id
    };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ ok: false, error: "Not authorized, token failed" });
  }
};

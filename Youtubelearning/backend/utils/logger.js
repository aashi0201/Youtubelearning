const pino = require("pino");
const env = require("../config/env");

const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
});

module.exports = logger;

const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "reset_password"],
      default: "login",
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "10m" }, // MongoDB TTL: document will automatically self-destruct after expiry
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of email + purpose
emailOtpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("EmailOtp", emailOtpSchema);

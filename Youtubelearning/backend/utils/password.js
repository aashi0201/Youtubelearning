function validatePasswordStrength(password) {
  const value = String(password || "");
  const errors = [];

  if (value.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(value)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(value)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(value)) errors.push("one number");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("one symbol");

  return {
    ok: errors.length === 0,
    message: errors.length
      ? `Password must include ${errors.join(", ")}.`
      : "Password is strong.",
  };
}

module.exports = {
  validatePasswordStrength,
};

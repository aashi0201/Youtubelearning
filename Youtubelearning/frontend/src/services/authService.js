import api from "./api";

/**
 * Auth service — pure API calls only.
 * localStorage persistence is handled by AuthContext.saveAuth().
 */

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
}

// Email OTP APIs
export async function sendOtp(email, purpose = "login") {
  const { data } = await api.post("/auth/send-otp", { email, purpose });
  return data;
}

export async function verifyOtpLogin(email, otp) {
  const { data } = await api.post("/auth/verify-otp-login", { email, otp });
  return data;
}

export async function forgotPasswordOtp(email) {
  const { data } = await api.post("/auth/forgot-password-otp", { email });
  return data;
}

export async function resetPasswordOtp(email, otp, password) {
  const { data } = await api.post("/auth/reset-password-otp", { email, otp, password });
  return data;
}

export async function googleLoginUser(credential) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateUserProfile(payload) {
  const { data } = await api.put("/auth/profile", payload);
  return data;
}

export async function uploadAvatar(avatar) {
  const { data } = await api.post("/auth/upload-avatar", { avatar });
  return data;
}

export async function checkUsernameAvailability(username, currentUserId) {
  const params = currentUserId ? { currentUserId } : {};
  const { data } = await api.get(`/auth/check-username/${encodeURIComponent(username)}`, { params });
  return data;
}

/**
 * @deprecated — Use clearAuth() from useAuth() hook instead.
 * Kept for backward compatibility during migration.
 */
export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
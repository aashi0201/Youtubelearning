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

export async function googleLoginUser(credential) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
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
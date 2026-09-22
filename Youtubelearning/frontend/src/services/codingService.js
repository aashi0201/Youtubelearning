import api from "./api";

export async function updateCodingProfiles(profiles) {
  const { data } = await api.post("/coding/tracker/update", profiles);
  return data;
}

export async function disconnectCodingProfile(platform) {
  const { data } = await api.post("/coding/tracker/disconnect", { platform });
  return data;
}

export async function getCodingDashboardStats(userId = "me", refresh = false) {
  const url = `/coding/tracker/${userId}${refresh ? "?refresh=true" : ""}`;
  const { data } = await api.get(url);
  return data;
}

export async function getTodayActivity() {
  const { data } = await api.get("/coding/activity/today");
  return data;
}

export async function getSocialLeaderboard() {
  const { data } = await api.get("/coding/leaderboard");
  return data;
}

export async function getUpcomingContests() {
  const { data } = await api.get("/coding/contests");
  return data;
}

export async function markProblemSolved(platform) {
  const { data } = await api.post("/coding/solve", { platform });
  return data;
}

export async function getVerificationToken() {
  const { data } = await api.get("/coding/verification-token");
  return data;
}

export async function verifyPlatformOwnership({ platform, handle }) {
  const { data } = await api.post("/coding/verify-platform", { platform, handle });
  return data;
}

export async function inspectCodingProfiles(handles = {}, refresh = false) {
  const params = new URLSearchParams();
  if (handles.leetcode) params.append("leetcode", handles.leetcode);
  if (handles.codeforces) params.append("codeforces", handles.codeforces);
  if (handles.codechef) params.append("codechef", handles.codechef);
  if (handles.github) params.append("github", handles.github);
  if (refresh) params.append("refresh", "true");

  const { data } = await api.get(`/coding/inspect?${params.toString()}`);
  return data;
}



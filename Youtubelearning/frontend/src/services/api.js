import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${BACKEND_URL}/api`,
  withCredentials: true
});

/**
 * Callback that AuthContext registers so the interceptor can
 * trigger a React-level logout instead of a hard page reload.
 */
let onUnauthorized = null;

export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

// Attach token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Use the React-level callback if available
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Fallback: direct localStorage clear + redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const currentPath = window.location.pathname;
        const publicPaths = ["/", "/login", "/register", "/forgot-password"];
        const isResetPath = currentPath.startsWith("/reset-password/");

        if (!publicPaths.includes(currentPath) && !isResetPath) {
          window.location.assign("/login");
        }
      }
    }

    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getMe } from "../services/authService";
import { setOnUnauthorized } from "../services/api";

export const AuthContext = createContext(null);

/**
 * Reads token from localStorage (initial hydration only).
 */
function getStoredToken() {
  try {
    return localStorage.getItem("token") || null;
  } catch {
    return null;
  }
}

/**
 * Reads cached user object from localStorage (initial hydration only).
 */
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(token);

  /**
   * Persist auth data to localStorage and update state.
   * Called after login / register / google-login.
   */
  const saveAuth = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }
  }, []);

  /**
   * Update only the user object (e.g. after profile edit).
   */
  const updateUser = useCallback((updatedUser) => {
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, []);

  /**
   * Clear auth state; used on logout or 401.
   */
  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  /**
   * On mount, verify the stored token is still valid by calling /auth/me.
   * If the token is expired/invalid, clear auth silently.
   */
  useEffect(() => {
    let cancelled = false;

    // Register the 401 handler so API interceptor can trigger React-level logout
    setOnUnauthorized(() => {
      clearAuth();
    });

    async function verify() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();
        if (!cancelled && data?.ok && data?.user) {
          // Refresh cached user with latest server data
          updateUser(data.user);
        }
      } catch {
        // Token is invalid or expired; clear everything.
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []); // Only run on mount; we don't want to re-verify on every token change.

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      saveAuth,
      updateUser,
      clearAuth,
    }),
    [token, user, loading, isAuthenticated, saveAuth, updateUser, clearAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Custom hook for consuming auth state anywhere in the app.
 *
 * Usage:
 *   const { user, token, isAuthenticated, loading, saveAuth, clearAuth, updateUser } = useAuth();
 */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }

  return context;
}

import { motion } from "framer-motion";
import { Bell, LayoutDashboard, LogIn, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const isLoggedIn = isAuthenticated;

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--bg)]/70 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="min-w-0 flex items-center gap-2.5 group cursor-pointer" title="Go to Starting Screen">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-sm border border-black/10 dark:border-white/10 group-hover:scale-105 transition">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
              Interactive Learning Suite
            </p>
            <h1 className="truncate text-sm font-extrabold md:text-base text-gray-900 dark:text-white">
              EduPulse Workspace
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="glass hidden items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 lg:flex">
            <Search size={16} className="text-muted" />
            <input
              placeholder="Search videos, playlists..."
              className="w-48 bg-transparent text-sm outline-none placeholder:text-[var(--muted-2)]"
            />
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.03 }}
            className="glass hidden rounded-2xl p-3 md:block"
          >
            <Bell size={18} />
          </motion.button>

          <ThemeToggle />

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 px-4 py-2 text-sm font-semibold shadow-sm border border-black/10 dark:border-white/10 transition active:scale-[0.98]"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <LogIn size={16} />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 px-4 py-2 text-sm font-semibold shadow-sm border border-black/10 dark:border-white/10 transition active:scale-[0.98]"
                >
                  <Sparkles size={16} />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 md:hidden">
        <div className="flex gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text)]"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 px-4 py-2.5 text-sm font-semibold shadow-sm"
              >
                <Sparkles size={16} />
                Start
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
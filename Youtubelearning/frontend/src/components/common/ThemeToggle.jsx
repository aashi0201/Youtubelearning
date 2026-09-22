import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={toggleTheme}
      className={`p-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 transition flex items-center justify-center cursor-pointer shadow-sm ${className}`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-slate-700" />
      )}
    </motion.button>
  );
}
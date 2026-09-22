import { motion } from "framer-motion";

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const styles = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 shadow-sm border border-black/10 dark:border-white/10 active:scale-[0.98]",
    secondary:
      "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10",
    danger:
      "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
    accent:
      "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border border-indigo-400/20",
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
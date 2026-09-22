import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  loading = false,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
      Icon: Trash2,
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40",
      buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs",
      Icon: AlertTriangle,
    },
    info: {
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40",
      buttonBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
      Icon: Info,
    },
  };

  const { iconBg, buttonBg, Icon } = variantStyles[variant] || variantStyles.danger;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative space-y-4"
        >
          {/* Top Row: Icon & Close */}
          <div className="flex items-start justify-between gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconBg}`}>
              <Icon size={20} />
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${buttonBg}`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

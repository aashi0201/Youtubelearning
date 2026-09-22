import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MagneticButton({
  children,
  className = "",
  onClick,
  variant = "primary",
  ...props
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 180, damping: 14 });
  const springY = useSpring(y, { stiffness: 180, damping: 14 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);

    x.set(dx * 0.15);
    y.set(dy * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const styles = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 shadow-sm border border-black/10 dark:border-white/10 font-semibold",
    secondary:
      "glass text-[var(--text)] border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
  };

  return (
    <motion.button
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  LockKeyhole,
  Mail,
  RotateCw,
  Sparkles,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { registerUser, googleLoginUser } from "../services/authService";
import useAuth from "../hooks/useAuth";
import AuthShowcase from "../components/common/AuthShowcase";
import ThemeToggle from "../components/common/ThemeToggle";

function getPasswordStrength(password) {
  let score = 0;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasMinLength) score += 1;
  if (hasUpper) score += 1;
  if (hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label = "Too Weak";
  let tone = "bg-rose-500";
  let percent = 20;

  if (score <= 1) {
    label = "Very Weak";
    tone = "bg-rose-500";
    percent = 20;
  } else if (score === 2) {
    label = "Weak";
    tone = "bg-orange-500";
    percent = 40;
  } else if (score === 3) {
    label = "Fair";
    tone = "bg-yellow-500";
    percent = 60;
  } else if (score === 4) {
    label = "Good";
    tone = "bg-indigo-500";
    percent = 80;
  } else {
    label = "Strong";
    tone = "bg-emerald-500";
    percent = 100;
  }

  return {
    score,
    label,
    tone,
    percent,
    rules: {
      hasMinLength,
      hasUpper,
      hasNumber,
      hasSpecial,
    },
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return "Please fill in all fields.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      saveAuth(data.token, data.user);
      setSuccess("Account created successfully! Preparing your workspace...");
      setTimeout(() => navigate("/welcome"), 600);
    } catch (err) {
      const backendErr = err?.response?.data;
      const message =
        backendErr?.details
          ? `${backendErr.error || "Registration failed"}: ${backendErr.details}`
          : backendErr?.error ||
            backendErr?.message ||
            (err?.message ? `Registration error: ${err.message}` : "Registration failed. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE SIGN UP / LOGIN ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      setLoading(true);
      const data = await googleLoginUser(credentialResponse.credential);
      saveAuth(data.token, data.user);
      navigate("/welcome");
    } catch (err) {
      const backendErr = err?.response?.data;
      const message =
        backendErr?.details
          ? `${backendErr.error || "Google sign-up failed"}: ${backendErr.details}`
          : backendErr?.error ||
            backendErr?.message ||
            (err?.message ? `Sign-up error: ${err.message}` : "Google sign-up failed. Please try again or create an account with email.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8b9afe]/15 dark:bg-[#070b14] px-4 py-8 md:px-8 flex items-center justify-center">
      {/* Central Split Card matching user reference design */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto grid w-full max-w-5xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#0e1526] shadow-2xl shadow-indigo-950/10 border border-black/5 dark:border-white/10 lg:grid-cols-[1fr_1.15fr]"
      >
        {/* Left Panel: Binge Learning Buddy Showcase */}
        <div className="hidden lg:block p-3">
          <AuthShowcase
            tagline="A Buddy for all your Binge watching."
            subtext="Your intelligent companion for automated notes, recall flashcards, and code execution."
          />
        </div>

        {/* Right Panel: Clean Minimalist Auth Form */}
        <div className="flex flex-col justify-between p-7 sm:p-10 md:p-12">
          {/* Top Bar: Language Dropdown & Theme Toggle */}
          <div className="flex items-center justify-end gap-4 text-xs text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer select-none font-medium">
              <span>English (UK)</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <ThemeToggle />
          </div>

          <div className="w-full max-w-[420px] mx-auto my-auto">
            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Create Account
            </h1>

            {/* Error / Success Feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Social Sign-Up Buttons */}
            <div className="mt-6 flex justify-center w-full">
              {/* Google OAuth */}
              <div className="w-full flex justify-center items-center overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800/80 transition-colors shadow-xs py-0.5">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-up could not be completed.")}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="signup_with"
                  width="100%"
                />
              </div>
            </div>

            {/* Subtle Minimalist Divider */}
            <div className="my-6 flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase select-none">
                — OR —
              </span>
            </div>

            {/* Registration Form with Minimalist Underline Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  placeholder="Password"
                  className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.tone}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* CapsLock Warning */}
              {capsLock && (
                <p className="text-[11px] text-amber-500 font-medium">
                  Caps Lock is ON
                </p>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-[#8291fa] hover:bg-[#7282f9] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-300/40 dark:shadow-none hover:shadow-indigo-400/50 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RotateCw size={18} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Bottom Footer Switcher */}
            <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#8090fd] hover:text-[#6e80fa] hover:underline"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
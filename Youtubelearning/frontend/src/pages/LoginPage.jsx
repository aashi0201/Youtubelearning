import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import {
  loginUser,
  googleLoginUser,
  sendOtp,
  verifyOtpLogin,
  forgotPasswordOtp,
  resetPasswordOtp,
} from "../services/authService";
import useAuth from "../hooks/useAuth";
import AuthShowcase from "../components/common/AuthShowcase";
import ThemeToggle from "../components/common/ThemeToggle";

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  // Auth Mode: "password" or "otp"
  const [authMode, setAuthMode] = useState("password");

  // Password Login State
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // OTP Login State
  const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: 6-digit OTP
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState("");
  const otpInputRefs = useRef([]);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpDigits, setForgotOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotDevOtp, setForgotDevOtp] = useState("");
  const forgotOtpRefs = useRef([]);

  // Shared States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Focus first OTP input when step 2 opens
  useEffect(() => {
    if (authMode === "otp" && otpStep === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [authMode, otpStep]);

  useEffect(() => {
    if (showForgotModal && forgotStep === 2) {
      setTimeout(() => {
        forgotOtpRefs.current[0]?.focus();
      }, 100);
    }
  }, [showForgotModal, forgotStep]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- PASSWORD LOGIN ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      saveAuth(data.token, data.user);
      navigate("/welcome");
    } catch (err) {
      const backendErr = err?.response?.data;
      const message =
        backendErr?.details
          ? `${backendErr.error || "Login failed"}: ${backendErr.details}`
          : backendErr?.error ||
            backendErr?.message ||
            (err?.message ? `Sign-in error: ${err.message}` : "Invalid email or password. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- OTP FLOW ---
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    const targetEmail = otpEmail.trim() || form.email.trim();
    if (!targetEmail) {
      setError("Please enter your email address to receive a login code.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(targetEmail, "login");
      setOtpEmail(targetEmail);
      setOtpStep(2);
      setResendCountdown(60);
      setSuccessMsg(res?.message || `6-digit login code sent to ${targetEmail}`);
      if (res?.devOtp) setDevOtpCode(res.devOtp);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtpDigits(pasted.split(""));
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      const data = await verifyOtpLogin(otpEmail, code);
      saveAuth(data.token, data.user);
      navigate("/welcome");
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD MODAL ---
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!forgotEmail.trim()) {
      setError("Please provide your account email or @username.");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordOtp(forgotEmail.trim());
      setForgotStep(2);
      setSuccessMsg(res?.message || "Password reset code sent to your email.");
      if (res?.devOtp) setForgotDevOtp(res.devOtp);
      if (res?.email) setForgotEmail(res.email);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to send reset code. Please check your email or username.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...forgotOtpDigits];
    newDigits[index] = value.slice(-1);
    setForgotOtpDigits(newDigits);

    if (value && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtpDigits[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const code = forgotOtpDigits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordOtp(
        forgotEmail.trim(),
        code,
        newPassword
      );
      setSuccessMsg(res?.message || "Password updated successfully! You can now sign in.");
      setShowForgotModal(false);
      setAuthMode("password");
      setForm((prev) => ({ ...prev, email: forgotEmail.trim(), password: "" }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE SIGN IN ---
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
          ? `${backendErr.error || "Google sign-in failed"}: ${backendErr.details}`
          : backendErr?.error ||
            backendErr?.message ||
            (err?.message ? `Sign-in error: ${err.message}` : "Google sign-in failed. Please try again or use email login.");
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
          <div className="flex items-center justify-end gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer select-none font-medium">
              <span>English (UK)</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <ThemeToggle />
          </div>

          <div className="w-full max-w-[420px] mx-auto my-auto">
            {/* Main Heading & Auth Mode Switcher */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Sign In
              </h1>

              {/* Mode Switcher: Password vs Email OTP */}
              <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("password");
                    setError("");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    authMode === "password"
                      ? "bg-white dark:bg-gray-700 text-[#8090fd] shadow-xs"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setError("");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    authMode === "otp"
                      ? "bg-white dark:bg-gray-700 text-[#8090fd] shadow-xs"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                  }`}
                >
                  Email Code
                </button>
              </div>
            </div>

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

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Social Sign-In Buttons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Google OAuth */}
              <div className="w-full flex justify-center items-center overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800/80 transition-colors shadow-xs py-0.5">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login could not be completed.")}
                  theme="outline"
                  size="medium"
                  shape="rectangular"
                  text="signin_with"
                  width="100%"
                />
              </div>

              {/* Quick Demo Login */}
              <button
                type="button"
                onClick={() => {
                  setForm({
                    email: "demo@studyforge.io",
                    password: "Password@123",
                    remember: true,
                  });
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors shadow-xs"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white">
                  <span className="font-bold text-[11px]">f</span>
                </div>
                <span>Auto-Fill Demo</span>
              </button>
            </div>

            {/* Subtle Minimalist Divider */}
            <div className="my-6 flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase select-none">
                — OR —
              </span>
            </div>

            {/* Password Login Mode */}
            {authMode === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Email Address */}
                <div className="relative">
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="Email or @username"
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
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

                {/* CapsLock Warning */}
                {capsLock && (
                  <p className="text-[11px] text-amber-500 font-medium">
                    Caps Lock is ON
                  </p>
                )}

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-gray-300 text-[#8090fd] focus:ring-[#8090fd]"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(form.email);
                      setShowForgotModal(true);
                      setForgotStep(1);
                      setError("");
                    }}
                    className="text-xs font-semibold text-[#8090fd] hover:text-[#6e80fa] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-[#8291fa] hover:bg-[#7282f9] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-300/40 dark:shadow-none hover:shadow-indigo-400/50 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RotateCw size={18} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Login Mode */
              <div className="space-y-4">
                {otpStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative">
                      <input
                        type="email"
                        value={otpEmail || form.email}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="Enter your email for login code"
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-[#8291fa] hover:bg-[#7282f9] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-300/40 dark:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <RotateCw size={18} className="animate-spin" /> : <span>Send Code</span>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Code sent to <span className="font-bold text-gray-800 dark:text-gray-200">{otpEmail}</span>
                    </p>

                    {/* 6-Digit PIN Boxes */}
                    <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="h-12 w-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-center text-lg font-black text-gray-900 dark:text-white focus:border-[#8090fd] focus:bg-white dark:focus:bg-gray-800 focus:outline-none"
                        />
                      ))}
                    </div>

                    {devOtpCode && (
                      <p className="text-[11px] text-indigo-500 font-mono">Dev code: {devOtpCode}</p>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpStep(1)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        disabled={resendCountdown > 0}
                        onClick={handleSendOtp}
                        className="font-bold text-[#8090fd] disabled:opacity-40"
                      >
                        {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend Code"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-[#8291fa] hover:bg-[#7282f9] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-300/40 dark:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <RotateCw size={18} className="animate-spin" /> : <span>Verify & Sign In</span>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom Footer Switcher */}
            <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#8090fd] hover:text-[#6e80fa] hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f172a] p-6 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Reset Password
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {forgotStep === 1
                  ? "Enter your email to receive a recovery code."
                  : "Enter the code and choose a new password."}
              </p>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotSendOtp} className="mt-5 space-y-4">
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your account email or @username"
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RotateCw size={16} className="animate-spin" /> : <span>Send Reset Code</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotResetPassword} className="mt-5 space-y-4">
                  <div className="flex justify-between gap-1.5">
                    {forgotOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (forgotOtpRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleForgotOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleForgotOtpKeyDown(idx, e)}
                        className="h-11 w-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-900 dark:text-white focus:border-[#8090fd] focus:outline-none"
                      />
                    ))}
                  </div>

                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (8+ chars)"
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none"
                  />

                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RotateCw size={16} className="animate-spin" /> : <span>Update Password</span>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
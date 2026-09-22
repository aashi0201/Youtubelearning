import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { forgotPasswordOtp, resetPasswordOtp } from "../services/authService";
import AuthShowcase from "../components/common/AuthShowcase";
import ThemeToggle from "../components/common/ThemeToggle";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email or Username, 2: OTP + New Password
  const [identifier, setIdentifier] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Send OTP to email or username
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setMessage("");

    const cleanInput = identifier.trim().toLowerCase().replace(/^@/, "");
    if (!cleanInput) {
      setError("Please enter your account email or @username.");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordOtp(cleanInput);
      setMessage(res?.message || "A 6-digit reset code has been sent.");
      if (res?.email) setTargetEmail(res.email);
      if (res?.devOtp) setDevOtp(res.devOtp);
      setCooldown(45);
      setStep(2);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Could not send reset code. Please ensure this email or username is registered."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send / Resend code while resetting password
  const handleResendCode = async () => {
    if (cooldown > 0 || sendingCode) return;
    const cleanInput = (targetEmail || identifier).trim().toLowerCase().replace(/^@/, "");
    if (!cleanInput) {
      setError("Please enter your account email or @username.");
      setStep(1);
      return;
    }

    setError("");
    setMessage("");

    try {
      setSendingCode(true);
      const res = await forgotPasswordOtp(cleanInput);
      setMessage(res?.message || "A new 6-digit reset code has been sent!");
      if (res?.email) setTargetEmail(res.email);
      if (res?.devOtp) setDevOtp(res.devOtp);
      setCooldown(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to send reset code. Please try again."
      );
    } finally {
      setSendingCode(false);
    }
  };

  // Step 2: Handle OTP input
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    otpRefs.current[nextIdx]?.focus();
  };

  // Step 2: Submit Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordOtp(
        targetEmail || identifier.trim().toLowerCase(),
        code,
        newPassword
      );
      setMessage(res?.message || "Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reset password.");
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
            tagline="Account Recovery & Security."
            subtext="Quickly regain access to your course tracks, verified coding badges, and notes."
          />
        </div>

        {/* Right Panel: Forgot Password Flow */}
        <div className="flex flex-col justify-between p-7 sm:p-10 md:p-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-gray-600 dark:text-gray-300 hover:text-[#8090fd] dark:hover:text-[#8090fd] transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer select-none font-medium">
                <span>English (UK)</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div className="w-full max-w-[420px] mx-auto my-auto space-y-5">
            <div>
              <div className="mb-3 inline-flex rounded-2xl bg-[#8090fd]/10 text-[#8090fd] p-3">
                <KeyRound size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Reset Password
              </h1>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {step === 1
                  ? "Enter your account email or @username to receive a 6-digit recovery code."
                  : `Enter the 6-digit code sent to your registered email and choose a new password.`}
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                <span>{message}</span>
              </motion.div>
            )}

            {/* Dev Mode Code Helper */}
            {devOtp && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <span>Dev mode code: <strong>{devOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtp.split("").slice(0, 6);
                    setOtpDigits(digits);
                  }}
                  className="underline font-bold hover:text-amber-600 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Email or @Username
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or @username"
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white font-bold text-sm shadow-md shadow-indigo-300/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Sending reset code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <label className="font-bold text-gray-700 dark:text-gray-300">
                      6-Digit Recovery Code
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={sendingCode || cooldown > 0}
                        onClick={handleResendCode}
                        className="text-xs font-bold text-[#8090fd] hover:text-[#6c7ff8] disabled:opacity-50 disabled:hover:no-underline hover:underline cursor-pointer flex items-center gap-1 transition"
                      >
                        {sendingCode ? (
                          <>
                            <RotateCw size={11} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : cooldown > 0 ? (
                          <span>Resend ({cooldown}s)</span>
                        ) : (
                          <>
                            <RotateCw size={11} />
                            <span>Send Code</span>
                          </>
                        )}
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError("");
                        }}
                        className="text-gray-500 dark:text-gray-400 font-medium hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between gap-1.5" onPaste={handlePaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 sm:w-12 h-12 text-center font-mono text-lg font-black rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none focus:border-[#8090fd] focus:ring-2 focus:ring-[#8090fd]/20"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2.5 px-0.5 text-xs">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Didn't receive the email code?
                    </span>
                    <button
                      type="button"
                      disabled={sendingCode || cooldown > 0}
                      onClick={handleResendCode}
                      className="font-bold text-[#8090fd] hover:text-[#6c7ff8] disabled:opacity-50 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {sendingCode ? "Sending..." : cooldown > 0 ? `Resend code in ${cooldown}s` : "Send Code Again"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (min. 8 characters)"
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

                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8090fd] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#8291fa] hover:bg-[#7080f8] text-white font-bold text-sm shadow-md shadow-indigo-300/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password & Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-6">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Remember your password?{" "}
              <Link to="/login" className="font-bold text-[#8090fd] hover:underline">
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
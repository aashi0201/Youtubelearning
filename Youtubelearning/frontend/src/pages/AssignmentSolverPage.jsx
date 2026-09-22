import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  BookOpen,
  FileCheck,
  Zap,
  RotateCcw,
  Sliders,
  HelpCircle,
  Eye,
  EyeOff,
  Keyboard,
} from "lucide-react";
import UploadBox from "../components/assignment/UploadBox";
import SolutionViewer from "../components/assignment/SolutionViewer";
import { solveAssignment } from "../services/aiService";

const PROMPT_PRESETS = [
  { id: "step-by-step", label: "Step-by-Step Proof", prompt: "Please provide a rigorous, step-by-step breakdown explaining each transition, formula, and justification." },
  { id: "formulas", label: "Formulas & Derivations", prompt: "Highlight all primary mathematical formulas, theorems, and state variable definitions used." },
  { id: "code", label: "Code & Complexity", prompt: "Include clean, commented code implementation with time (Big-O) and space complexity analysis." },
  { id: "concise", label: "Direct Answers & Key Takeaways", prompt: "Give direct final answers first, followed by concise key takeaways and bullet points." },
  { id: "eli5", label: "Explain Like I'm 5", prompt: "Explain the core concepts and solution using simple everyday analogies and intuitive language." },
];

const DEPTH_MODES = [
  { id: "detailed", label: "Detailed Academic", desc: "Comprehensive proofs & reasoning" },
  { id: "concise", label: "Concise & Direct", desc: "Short, to-the-point answers" },
  { id: "exam", label: "Exam Preparation", desc: "Key formulas & grading points" },
];

export default function AssignmentSolverPage() {
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [depthMode, setDepthMode] = useState("detailed");
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [error, setError] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const textareaRef = useRef(null);

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setError("");

    if (uploadedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleApplyPreset = (presetPrompt) => {
    setInstructions((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetPrompt;
      if (trimmed.includes(presetPrompt)) return trimmed;
      return `${trimmed}\n\n[Instruction]: ${presetPrompt}`;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectDemoProblem = (samplePrompt) => {
    setInstructions(samplePrompt);
    setError("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleGenerate = async () => {
    if (!file && !instructions.trim()) {
      setError("Please upload an assignment document or enter problem instructions.");
      return;
    }

    setLoading(true);
    setError("");
    setSolution("");

    try {
      const modePrefix = `[Mode: ${DEPTH_MODES.find((m) => m.id === depthMode)?.label || "Detailed"}]\n\n`;
      const combinedInstructions = instructions.trim()
        ? `${modePrefix}${instructions.trim()}`
        : `${modePrefix}Please solve and explain step by step.`;

      const data = await solveAssignment({ file, instructions: combinedInstructions });

      if (data.success) {
        setSolution(data.solution);
      } else {
        const errorMsg = data.error || data.message || "Failed to generate solution.";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Assignment Solver Error:", err);
      const serverError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to connect to the assignment solver service. Please try again.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Ctrl + Enter to generate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!loading && (file || instructions.trim())) {
          e.preventDefault();
          handleGenerate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, file, instructions, depthMode]);

  return (
    <div className="min-h-screen text-[var(--text)] pb-20">
      <div className="section-container py-6 md:py-8 space-y-8">
        {/* Glass Hero Header */}
        <div className="glass premium-border rounded-[2.5rem] p-6 md:p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> AI Homework Solver
                </span>
                <span className="rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={14} /> Multi-Format Vision & OCR
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                AI Assignment & Homework Solver
              </h1>
              <p className="text-sm md:text-base text-muted max-w-2xl leading-relaxed">
                Upload homework scans, PDFs, code files, or math problems. Get verified step-by-step reasoning, formulas, and code implementations instantly.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center">
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Accepted Types</p>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">PDF • Images • Code</p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center">
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Output Style</p>
                <p className="text-xs font-black text-gray-900 dark:text-white">Step-by-Step Proofs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-muted hover:text-white text-xs">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload, Presets & Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-6 space-y-6"
          >
            {/* Step 1: Upload Card */}
            <div className="glass premium-border rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    Upload Assignment File
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Attach a photo, screenshot, PDF document, or code assignment</p>
                </div>
              </div>

              <UploadBox onFileUpload={handleFileUpload} file={file} setFile={setFile} />

              {/* Image Preview Card (Collapsible) */}
              {filePreview && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Eye size={12} /> Document Visual Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-[11px] text-muted hover:text-white flex items-center gap-1"
                    >
                      {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showPreview ? "Hide" : "Show"}</span>
                    </button>
                  </div>

                  {showPreview && (
                    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-[220px] bg-slate-950/20 flex items-center justify-center">
                      <img src={filePreview} alt="Assignment Document Preview" className="w-full h-full object-contain max-h-[220px]" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Instructions & Tone */}
            <div className="glass premium-border rounded-[2rem] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    Instructions & Problem Statement
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Type your question directly or add custom guidelines for the AI</p>
                </div>

                {instructions && (
                  <button
                    onClick={() => setInstructions("")}
                    className="text-[11px] font-semibold text-muted hover:text-rose-500 transition"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              {/* Quick Prompt Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Quick Focus Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.prompt)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition transform active:scale-95 text-left"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solution Depth Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Solution Depth & Tone
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {DEPTH_MODES.map((mode) => {
                    const active = depthMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDepthMode(mode.id)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                          active
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs"
                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-bold">{mode.label}</span>
                        <span className="text-[9px] opacity-75 mt-0.5 line-clamp-1">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Instruction Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Type your question here, or specific instructions like 'Focus on step 3', 'Use Lagrange multiplier', or 'Write code in C++'..."
                  className="w-full h-36 bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-gray-900 dark:text-white placeholder:text-muted/60 focus:border-emerald-500 focus:outline-none transition-all resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between pt-1.5 px-1 text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <Keyboard size={12} /> Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Ctrl + Enter</kbd> to solve
                  </span>
                  <span>{instructions.length} chars</span>
                </div>
              </div>

              {/* Solve Primary Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || (!file && !instructions.trim())}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs md:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing & Synthesizing Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Step-by-Step Solution</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Column: Solution Viewer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-6 h-full sticky top-6"
          >
            <SolutionViewer
              solution={solution}
              loading={loading}
              onSelectDemoProblem={handleSelectDemoProblem}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

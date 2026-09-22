import React, { useState, useMemo } from "react";
import { Copy, Download, Check, FileText, Printer, Sparkles, BookOpen, ListFilter, Code2, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function SolutionViewer({ solution, loading, onSelectDemoProblem }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("formatted"); // "formatted" | "takeaways" | "raw"

  const stats = useMemo(() => {
    if (!solution) return { words: 0, readTimeMinutes: 0 };
    const words = solution.trim().split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 180));
    return { words, readTimeMinutes };
  }, [solution]);

  const keyTakeaways = useMemo(() => {
    if (!solution) return [];
    // Extract bullet points, steps, or bold concepts
    const lines = solution.split("\n");
    const extracted = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) &&
        trimmed.length > 10 &&
        trimmed.length < 200
      ) {
        extracted.push(trimmed.replace(/^[-*]\s+|\d+\.\s+/, ""));
      }
      if (extracted.length >= 8) break;
    }
    return extracted;
  }, [solution]);

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!solution) return;
    const element = document.createElement("a");
    const file = new Blob([solution], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `AI_Assignment_Solution_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="glass premium-border rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[520px] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              AI Reasoning Engine Active
            </span>
          </div>
          <span className="text-xs text-muted font-mono animate-pulse">Generating steps...</span>
        </div>

        {/* Multi-Step Animated Progression */}
        <div className="space-y-4 py-2">
          {[
            { label: "Scanning document & extracting problem statements", status: "complete" },
            { label: "Analyzing formulas, algorithms & key constraints", status: "active" },
            { label: "Synthesizing step-by-step verified explanation", status: "pending" },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                step.status === "complete"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                  : step.status === "active"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-gray-900 dark:text-white shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-muted opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.status === "complete"
                    ? "bg-emerald-500 text-white"
                    : step.status === "active"
                    ? "border-2 border-emerald-500 border-t-transparent animate-spin text-transparent"
                    : "bg-black/10 dark:bg-white/10 text-muted"
                }`}
              >
                {step.status === "complete" ? "✓" : idx + 1}
              </div>
              <span className="text-xs font-semibold">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Skeleton Pulse Content */}
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-3/4 animate-pulse" />
          <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-5/6 animate-pulse" />
          <div className="h-24 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 animate-pulse" />
          <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="glass premium-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center min-h-[520px] space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Sparkles size={30} />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
            Ready to Solve Your Assignment
          </h3>
          <p className="text-xs md:text-sm text-muted leading-relaxed">
            Upload an assignment image, PDF, or type your problem instructions on the left to receive an AI-powered, step-by-step breakdown.
          </p>
        </div>

        {/* Quick Demo Problems */}
        {onSelectDemoProblem && (
          <div className="w-full max-w-md pt-3 space-y-2 text-left">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted text-center">
              Or Try A Sample Problem
            </p>
            <div className="grid gap-2">
              {[
                {
                  title: "Calculus: Integration by Parts",
                  prompt: "Solve the integral ∫ x * e^(2x) dx step by step using integration by parts. Show all intermediate steps and the final antiderivative.",
                },
                {
                  title: "CS: Binary Search Tree Inversion",
                  prompt: "Explain how to invert a binary tree in Python with full code, recursion walkthrough, time complexity and space complexity analysis.",
                },
                {
                  title: "Physics: Projectile Motion",
                  prompt: "A projectile is launched from ground level at 30 m/s at an angle of 45 degrees. Calculate its maximum height and total horizontal range (g = 9.8 m/s²).",
                },
              ].map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => onSelectDemoProblem(sample.prompt)}
                  className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition flex items-center justify-between text-xs group text-left"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {sample.title}
                  </span>
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Try Demo →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass premium-border rounded-[2rem] flex flex-col min-h-[520px] max-h-[760px] overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            AI Solution Verified
          </span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted pl-2 border-l border-black/10 dark:border-white/10">
            <span>{stats.words} words</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> ~{stats.readTimeMinutes} min read
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl text-muted hover:text-gray-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition flex items-center gap-1 text-xs font-semibold"
            title="Copy Solution"
          >
            {copied ? <Check size={14} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden md:inline">{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl text-muted hover:text-gray-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition flex items-center gap-1 text-xs font-semibold"
            title="Download Markdown"
          >
            <Download size={14} />
            <span className="hidden md:inline">Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl text-muted hover:text-gray-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition flex items-center gap-1 text-xs font-semibold"
            title="Print Solution"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
        {[
          { id: "formatted", label: "Step-by-Step", icon: BookOpen },
          { id: "takeaways", label: `Key Takeaways (${keyTakeaways.length})`, icon: ListFilter },
          { id: "raw", label: "Raw Code / Text", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                active
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-muted hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Solution Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
        {activeTab === "formatted" && (
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-slate-950 prose-pre:text-emerald-300 prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-800 prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-300">
            <ReactMarkdown>{solution}</ReactMarkdown>
          </article>
        )}

        {activeTab === "takeaways" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Extracted key takeaways, final answers, and core formulas from this solution.</span>
            </div>

            {keyTakeaways.length > 0 ? (
              <div className="grid gap-2.5">
                {keyTakeaways.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-start gap-3 text-xs leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted italic">
                No distinct bullet points found in solution. View the "Step-by-Step" tab for full explanation.
              </div>
            )}
          </div>
        )}

        {activeTab === "raw" && (
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
            {solution}
          </div>
        )}
      </div>
    </motion.div>
  );
}

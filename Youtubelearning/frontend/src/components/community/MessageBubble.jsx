import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Copy, Check as CheckIcon, Code2 } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const [copied, setCopied] = useState(false);
  const date = new Date(message.createdAt || Date.now());
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const rawText = message.message || message.content || "";

  // Check if message contains code block: ```code```
  const hasCodeBlock = rawText.includes("```");

  const copyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    if (!hasCodeBlock) {
      return (
        <p className="text-sm leading-relaxed whitespace-pre-wrap select-text font-medium">
          {rawText}
        </p>
      );
    }

    const parts = rawText.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\n/, "").trim();
        return (
          <div key={index} className="my-2 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 text-left shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-400 font-mono">
              <span className="flex items-center gap-1 text-indigo-400">
                <Code2 size={12} /> Code Snippet
              </span>
              <button
                type="button"
                onClick={() => copyCode(codeContent)}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer"
                title="Copy code"
              >
                {copied ? <CheckIcon size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }
      return (
        <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap select-text font-medium">
          {part}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
    >
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl relative transition-all ${
            isMine
              ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
          }`}
        >
          {renderContent()}
          <div className="mt-1 flex items-center justify-end gap-1.5 opacity-65 select-none">
            <span className="text-[9px] font-bold uppercase tracking-wider">{time}</span>
            {isMine && (
              <CheckCheck size={12} className="text-indigo-200" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const date = new Date(message.createdAt || Date.now());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle both field names 'content' (from DB) and 'message' (from Socket)
  const text = message.message || message.content || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] space-y-1 ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl relative ${
            isMine
              ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700/60"
          }`}
        >
          <p className="text-sm leading-relaxed select-text font-medium">{text}</p>
          <div className={`mt-1 flex items-center justify-end gap-1.5 opacity-60`}>
             <span className="text-[9px] font-bold uppercase tracking-widest">{time}</span>
             {isMine && (
               message.seen ? <CheckCheck size={11} className="text-blue-200" /> : <Check size={11} />
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

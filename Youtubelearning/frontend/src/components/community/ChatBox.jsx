import React, { useState, useEffect, useRef } from "react";
import { Send, Image, MoreVertical, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ selectedUser, currentUser, socket, messages, onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  if (!selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
          <MessageCircle size={40} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Select a friend to chat</h3>
        <p className="text-muted text-sm max-w-[280px]">
          Pick someone from your connections to start a real-time conversation.
        </p>
      </div>
    );
  }

  const myId = String(currentUser?._id || currentUser?.id || "");

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl text-gray-900 dark:text-white">
      {/* Header */}
      <header className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username || "sf"}`} 
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700" 
              alt={selectedUser.name} 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-xs"></div>
          </div>
          <div>
            <h4 className="text-sm font-bold">{selectedUser.name}</h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Online</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-gray-950/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3">
             <div className="p-3.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                <MessageCircle size={28} />
             </div>
             <p className="text-xs font-medium">No messages yet. Say hi to {selectedUser.name}!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = String(msg.sender?._id || msg.sender || msg.senderId || "");
            const isMine = Boolean(myId && senderId && myId === senderId);
            return (
              <MessageBubble 
                key={msg._id || idx} 
                message={msg} 
                isMine={isMine} 
              />
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${selectedUser.name}...`}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition font-medium"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Smile,
  Code2,
  Search,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Flame,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MessageBubble from "./MessageBubble";

const QUICK_PROMPTS = [
  "👋 Hey there!",
  "📚 Want to study together?",
  "💻 Grinding LeetCode today?",
  "🔥 Keep up the daily streak!",
  "🤝 Need help with a concept?"
];

const EMOJIS = ["👍", "❤️", "🔥", "🚀", "💡", "🎉", "📚", "💻", "✨", "🙌", "💯", "🎯"];

// Web Audio API soft chime for new incoming messages
function playIncomingChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    // AudioContext blocked or not supported - silently ignore
  }
}

export default function ChatBox({
  selectedUser,
  currentUser,
  socket,
  messages,
  onSendMessage
}) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevMessagesCountRef = useRef(messages?.length || 0);

  const myId = String(currentUser?._id || currentUser?.id || "");
  const targetId = String(selectedUser?._id || selectedUser?.id || "");

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);

  // Handle incoming message chime
  useEffect(() => {
    if (messages && messages.length > prevMessagesCountRef.current) {
      const latestMsg = messages[messages.length - 1];
      const senderId = String(latestMsg?.sender?._id || latestMsg?.sender || latestMsg?.senderId || "");
      if (senderId && myId && senderId !== myId && soundEnabled) {
        playIncomingChime();
      }
    }
    prevMessagesCountRef.current = messages?.length || 0;
  }, [messages, soundEnabled, myId]);

  // Socket typing listeners
  useEffect(() => {
    if (!socket || !targetId) return;

    const handleUserTyping = (data) => {
      if (String(data?.userId) === targetId) {
        setIsPeerTyping(true);
      }
    };

    const handleUserStopTyping = (data) => {
      if (String(data?.userId) === targetId) {
        setIsPeerTyping(false);
      }
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
    };
  }, [socket, targetId]);

  // Emit typing event with debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (socket && targetId) {
      socket.emit("typing", { senderId: myId, receiverId: targetId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", { senderId: myId, receiverId: targetId });
      }, 1500);
    }
  };

  const [isSending, setIsSending] = useState(false);

  const handleSend = (e) => {
    e?.preventDefault?.();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText("");
    setShowEmojiPicker(false);

    if (socket && targetId) {
      socket.emit("stop-typing", { senderId: myId, receiverId: targetId });
    }

    onSendMessage(text);
    setTimeout(() => {
      setIsSending(false);
    }, 500);
  };

  const insertEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  const insertCodeSnippet = () => {
    setInputText((prev) => {
      const codeTemplate = "```javascript\n// Write your code snippet here\n\n```";
      return prev ? `${prev}\n${codeTemplate}` : codeTemplate;
    });
  };

  const handleSelectPrompt = (prompt) => {
    setInputText(prompt);
  };

  if (!selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
          <MessageCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select a peer to chat</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs leading-relaxed">
          Pick any student from your network or discovery list to start real-time messaging.
        </p>
      </div>
    );
  }

  // Filter messages if search query is active
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => {
        const txt = (m.message || m.content || "").toLowerCase();
        return txt.includes(searchQuery.toLowerCase());
      })
    : messages;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl text-gray-900 dark:text-white">
      {/* Sleek Header */}
      <header className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-md flex items-center justify-between gap-3">
        {/* User Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username || "sf"}`}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-gray-800 shadow-xs"
              alt={selectedUser.name}
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-xs"
              title="Online"
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-extrabold truncate text-gray-900 dark:text-white leading-tight">
              {selectedUser.name}
            </h4>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Active on StudyForge</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className={`p-2 rounded-xl text-xs transition cursor-pointer ${
              showSearch
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Search Messages"
          >
            <Search size={15} />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs transition cursor-pointer"
            title={soundEnabled ? "Mute notification chime" : "Unmute notification chime"}
          >
            {soundEnabled ? <Volume2 size={15} className="text-indigo-600 dark:text-indigo-400" /> : <VolumeX size={15} />}
          </button>

          {/* View Full Profile Link */}
          <button
            type="button"
            onClick={() => navigate(`/profile/${selectedUser._id || selectedUser.id}`)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/40 transition cursor-pointer"
            title="View Full Student Profile"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </header>

      {/* Inline Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 overflow-hidden"
          >
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this chat..."
              className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                <X size={13} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-gray-50/40 dark:bg-gray-950/20">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50 gap-2.5 text-center px-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <MessageCircle size={28} />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {searchQuery ? "No messages matching your search." : `Start a conversation with ${selectedUser.name}!`}
            </p>
            {!searchQuery && (
              <p className="text-[11px] text-gray-400">
                Click one of the quick prompts below or send a message.
              </p>
            )}
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
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

        {/* Live Typing Indicator */}
        <AnimatePresence>
          {isPeerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium py-1 px-3 rounded-full bg-gray-100/70 dark:bg-gray-800/70 w-fit"
            >
              <span>{selectedUser.name} is typing</span>
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3.5 py-1.5 bg-gray-50/70 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelectPrompt(prompt)}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-gray-200/70 dark:border-gray-700/60 transition cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Emoji Picker Bar */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800/70 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 items-center"
          >
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-base hover:scale-125 transition transform p-1 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 sm:p-3.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showEmojiPicker
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Add emoji"
          >
            <Smile size={18} />
          </button>

          {/* Code Snippet Button */}
          <button
            type="button"
            onClick={insertCodeSnippet}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            title="Insert code snippet format"
          >
            <Code2 size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message ${selectedUser.name}...`}
            className="flex-1 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition font-medium"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

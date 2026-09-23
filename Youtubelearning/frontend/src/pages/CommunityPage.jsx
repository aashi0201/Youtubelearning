import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  MessageSquare,
  Loader2,
  Info,
  Trophy,
  Award,
  CheckCircle2,
  X,
  Flame,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/community/UserCard";
import ChatBox from "../components/community/ChatBox";
import RequestPanel from "../components/community/RequestPanel";
import UserProfileModal from "../components/community/UserProfileModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

export default function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // "all" | "connections" | "leaderboard" | "requests"
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const selectedChatUserRef = useRef(null);

  useEffect(() => {
    selectedChatUserRef.current = selectedChatUser;
  }, [selectedChatUser]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const id = user._id || user.id;
    const token = localStorage.getItem("token");
    setCurrentUser({ ...user, id, _id: id });

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      auth: { userId: id, token },
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("onlineUsers", (userIds) => {
      setOnlineUsers(userIds || []);
    });

    newSocket.on("newMessage", (msg) => {
      setMessages((prev) => {
        const currentChatUser = selectedChatUserRef.current;
        if (!currentChatUser) return prev;

        const msgSender = String(msg.sender?._id || msg.sender);
        const msgReceiver = String(msg.receiver?._id || msg.receiver);
        const activeChatId = String(currentChatUser._id || currentChatUser.id);

        if (msgSender === activeChatId || msgReceiver === activeChatId) {
          if (msg._id && prev.some((m) => String(m._id) === String(msg._id))) {
            return prev;
          }
          return [...prev, msg];
        }
        return prev;
      });
    });

    newSocket.on("new_request", (data) => {
      if (data.receiverId === id) {
        fetchRequests();
      }
    });

    newSocket.on("request_accepted", (data) => {
      if (data.senderId === id || data.receiverId === id) {
        fetchConnections();
        fetchRequests();
      }
    });

    fetchInitialData();

    return () => {
      newSocket.off("newMessage");
      newSocket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const [studentsRes, connectionsRes, requestsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API_BASE}/community/users`, { headers }),
        axios.get(`${API_BASE}/community/connections`, { headers }),
        axios.get(`${API_BASE}/community/requests`, { headers }),
        axios.get(`${API_BASE}/community/leaderboard`, { headers }),
      ]);

      setStudents(studentsRes.data.users || (Array.isArray(studentsRes.data) ? studentsRes.data : []));
      setConnections(Array.isArray(connectionsRes.data) ? connectionsRes.data : []);
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatWithId = params.get("chatWith");
    if (chatWithId && students.length > 0) {
      const target = students.find((s) => String(s._id || s.id) === String(chatWithId));
      if (target) {
        setSelectedChatUser(target);
      }
    }
  }, [students]);

  const fetchRequests = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/requests`, { headers });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/connections`, { headers });
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching connections:", err);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/messages/${userId}`, { headers });
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (selectedChatUser) {
      fetchMessages(selectedChatUser._id || selectedChatUser.id);
    }
  }, [selectedChatUser]);

  const handleConnect = async (receiverId) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await axios.post(`${API_BASE}/community/send-request`, { receiverId }, { headers });
      showToast("Connected successfully! 🎉");
      fetchInitialData();
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  const handleRespond = async (connectionId, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      if (status === "accepted") {
        await axios.post(`${API_BASE}/community/accept-request`, { connectionId }, { headers });
        showToast("Connection accepted!");
      }
      fetchInitialData();
    } catch (err) {
      console.error("Error responding to request:", err);
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedChatUser || !content.trim()) return;
    const targetId = String(selectedChatUser._id || selectedChatUser.id);
    const text = content.trim();

    // 1. If socket is connected, emit via socket (server saves to DB and broadcasts to both users)
    if (socket && socket.connected) {
      try {
        socket.emit("sendMessage", {
          receiverId: targetId,
          message: text,
        });
        return;
      } catch (err) {
        console.error("Socket send error, attempting REST fallback:", err);
      }
    }

    // 2. Fallback via REST only if socket is not available or disconnected
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.post(
        `${API_BASE}/community/messages`,
        {
          receiverId: targetId,
          message: text,
        },
        { headers }
      );

      if (res.data) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id && String(m._id) === String(res.data._id));
          if (exists) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error("Error persisting message:", err);
    }
  };

  const handleViewProfile = (student) => {
    if (!student) return;
    const myId = String(currentUser?._id || currentUser?.id || "");
    const targetId = String(student._id || student.id || "");
    if (myId && targetId && myId === targetId) {
      navigate("/settings");
    } else {
      setSelectedProfileUser(student);
    }
  };

  const handleEndorse = (student) => {
    showToast(`Endorsed ${student.name} for Learning Progress! 🏅`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectionIds = new Set(
    connections.map((c) => {
      const myId = String(currentUser?._id || currentUser?.id || "");
      if (c.sender && c.receiver) {
        const s = String(c.sender?._id || c.sender || "");
        const r = String(c.receiver?._id || c.receiver || "");
        return s === myId ? r : s;
      }
      return String(c.user?._id || c.user?.id || c._id || "");
    })
  );
  const pendingIds = new Set(requests.map((r) => String(r.sender?._id || r.sender?.id || "")));

  // Suggested friends list for sidebar
  const suggestedFriends = students.filter(
    (s) => !connectionIds.has(String(s._id)) && String(s._id) !== String(currentUser?.id)
  ).filter((s) =>
    s.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-gray-950 p-4 md:p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-20 right-6 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold"
            >
              <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Layout */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px] items-start">
          {/* ── LEFT COLUMN (~70% Width): MAIN DIRECTORY CONTAINER ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
            {/* Header & Title */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
                  <Users size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Community & Peers
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connect and collaborate with fellow learners
                  </p>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60 overflow-x-auto">
                {[
                  { id: "all", label: "Discovery", icon: UserPlus },
                  { id: "connections", label: "Friends", icon: UserCheck, count: connections.length },
                  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                  { id: "requests", label: "Requests", icon: Info, count: requests.length },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                        active
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            active
                              ? "bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            {activeTab === "all" && (
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students by name or username..."
                  className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* ── TAB CONTENT ── */}
            {/* 1. DISCOVERY DIRECTORY */}
            {activeTab === "all" && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={28} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Loading student directory...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
                    <Users size={36} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No students found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search query.</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <UserCard
                      key={student._id}
                      student={student}
                      onConnect={handleConnect}
                      onOpenChat={setSelectedChatUser}
                      onEndorse={handleEndorse}
                      onViewProfile={handleViewProfile}
                      isOnline={onlineUsers.includes(String(student._id))}
                      isConnected={connectionIds.has(String(student._id))}
                      isPending={pendingIds.has(String(student._id))}
                    />
                  ))
                )}
              </div>
            )}

            {/* 2. FRIENDS / CONNECTIONS */}
            {activeTab === "connections" && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {connections.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <UserCheck className="mx-auto text-gray-400" size={32} />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No connections yet</p>
                    <p className="text-xs text-gray-500">Connect with students in the Discovery tab to build your network.</p>
                  </div>
                ) : (
                  connections.map((c) => {
                    const studentObj = c.user || c;
                    return (
                      <UserCard
                        key={c._id || studentObj._id}
                        student={studentObj}
                        onConnect={handleConnect}
                        onOpenChat={setSelectedChatUser}
                        onEndorse={handleEndorse}
                        onViewProfile={handleViewProfile}
                        isOnline={onlineUsers.includes(String(studentObj._id))}
                        isConnected={true}
                      />
                    );
                  })
                )}
              </div>
            )}

            {/* 3. LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
                  <Trophy className="text-amber-500 shrink-0" size={20} />
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Top Student Rankings</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Rankings based on active study streak & watch time</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {leaderboard.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? "bg-amber-400 text-gray-900" : index === 1 ? "bg-gray-300 text-gray-900" : index === 2 ? "bg-amber-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500">@{item.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Flame size={13} /> {item.stats?.streakDays || 0}d
                        </span>
                        <button
                          onClick={() => setSelectedChatUser(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. REQUESTS */}
            {activeTab === "requests" && (
              <RequestPanel requests={requests} onRespond={handleRespond} />
            )}
          </div>

          {/* ── RIGHT COLUMN (~30% Width): SUGGESTED FRIENDS SIDEBAR ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold tracking-wider uppercase text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-500" />
                SUGGESTED FRIENDS
              </h2>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 border border-indigo-200/60">
                {suggestedFriends.length}
              </span>
            </div>

            {/* Embedded Sidebar Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={sidebarSearchQuery}
                onChange={(e) => setSidebarSearchQuery(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full bg-slate-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Suggested Friends Cards List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-0.5 scrollbar-none">
              {suggestedFriends.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No friend suggestions found.
                </div>
              ) : (
                suggestedFriends.slice(0, 6).map((student) => (
                  <div
                    key={student._id}
                    className="bg-slate-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 rounded-xl p-3.5 space-y-3 transition hover:border-indigo-200 dark:hover:border-indigo-900/60 shadow-2xs"
                  >
                    {/* Top Identity Row */}
                    <div
                      onClick={() => handleViewProfile(student)}
                      className="flex items-center gap-2.5 cursor-pointer group/user"
                      title={`View ${student.name}'s profile`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username || "sf"}`}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 group-hover/user:ring-indigo-500 group-hover/user:scale-105 transition-all"
                          alt={student.name}
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
                            onlineUsers.includes(String(student._id)) ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-gray-900 dark:text-white group-hover/user:text-indigo-600 dark:group-hover/user:text-indigo-400 transition-colors truncate">
                          {student.name}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {student.major || `@${student.username || "student"}`}
                        </p>
                      </div>
                    </div>

                    {/* Compact Stacked Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConnect(student._id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 py-1.5 text-[10px] font-semibold transition border border-indigo-200/40 cursor-pointer"
                      >
                        <UserPlus size={11} />
                        <span>+ Connect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedChatUser(student)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 py-1.5 text-[10px] font-medium transition cursor-pointer"
                      >
                        <MessageSquare size={11} />
                        <span>✉ Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEndorse(student)}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                        title="Endorse"
                      >
                        <Award size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL-TIME CHAT MODAL / DRAWER ── */}
      <AnimatePresence>
        {selectedChatUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedChatUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden relative"
            >
              <button
                onClick={() => setSelectedChatUser(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                title="Close Chat"
              >
                <X size={16} />
              </button>

              <ChatBox
                selectedUser={selectedChatUser}
                currentUser={currentUser}
                socket={socket}
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── USER PROFILE MODAL ── */}
      <UserProfileModal
        user={selectedProfileUser}
        currentUser={currentUser}
        isOpen={Boolean(selectedProfileUser)}
        onClose={() => setSelectedProfileUser(null)}
        onConnect={handleConnect}
        onOpenChat={setSelectedChatUser}
        isConnected={connectionIds.has(String(selectedProfileUser?._id || selectedProfileUser?.id))}
        isPending={pendingIds.has(String(selectedProfileUser?._id || selectedProfileUser?.id))}
        isOnline={onlineUsers.includes(String(selectedProfileUser?._id || selectedProfileUser?.id))}
      />
    </div>
  );
}

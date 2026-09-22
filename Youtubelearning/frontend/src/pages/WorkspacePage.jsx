import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock3,
  Code2,
  Columns,
  Copy,
  Download,
  FileText,
  Flame,
  FolderPlus,
  FolderOpen,
  Home,
  Keyboard,
  Link2,
  ListVideo,
  Maximize2,
  Minimize2,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Trophy,
  Tv,
  Users,
  XCircle,
} from "lucide-react";

import AiTabs from "../components/video/AiTabs";
import NotesPanel from "../components/video/NotesPanel";
import BookmarksPanel from "../components/video/BookmarksPanel";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import VideoPlayerContainer from "../components/workspace/VideoPlayerContainer";
import PlaylistSidebar from "../components/workspace/PlaylistSidebar";


import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  askAi,
  chatWithAi,
  saveQuizAttempt,
  getQuizAttempts,
} from "../services/aiService";

import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylists,
  importYouTubePlaylist,
  removeVideoFromPlaylist,
  renamePlaylist,
} from "../services/playlistService";

import { getVideoMeta } from "../services/videoService";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getAllProgress, updateVideoProgress } from "../services/progressService";

import {
  getNotesByVideo,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notesService";

import {
  getBookmarksByVideo,
  createBookmark,
  deleteBookmark,
} from "../services/bookmarkService";


import {
  createRevisionFromNotes,
  createRevisionFromBookmarks,
} from "../services/revisionService";

function StatChip({ icon: Icon, label, value, iconBg, iconColor, accentBorder }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`glass relative overflow-hidden rounded-2xl border ${accentBorder || "border-black/10 dark:border-white/10"} bg-white/70 dark:bg-white/[0.03] p-4 backdrop-blur-xl shadow-xs transition`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${iconBg || "bg-blue-500/10"} border border-black/5 dark:border-white/10 shrink-0 flex items-center justify-center`}>
          <Icon size={18} className={iconColor || "text-blue-600 dark:text-blue-400"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}</p>
          <p className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-0.5">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function extractPlaylistId(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^[a-zA-Z0-9_-]+$/.test(input) && input.startsWith("PL")) {
    return input;
  }

  try {
    const url = new URL(input);
    const list = url.searchParams.get("list");
    return list ? list.trim() : "";
  } catch {
    return "";
  }
}

function extractVideoId(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be")
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && /^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
    }

    return "";
  } catch {
    return "";
  }
}

function formatWatchTime(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

let youtubeApiPromise = null;

function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      } else {
        youtubeApiPromise = null;
        reject(new Error("YouTube API load timeout"));
      }
    }, 4000);

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(window.YT);
      }
    }, 100);

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        youtubeApiPromise = null;
        reject(new Error("Script load error"));
      };
      document.body.appendChild(tag);
    }
  });

  return youtubeApiPromise;
}

function SectionToggle({ title, icon: Icon, open, onClick, subtitle }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon size={16} className="text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>

      <motion.div animate={{ rotate: open ? 180 : 0 }}>
        <ChevronDown size={16} className="text-muted" />
      </motion.div>
    </button>
  );
}

function resolvePlaylistName(playlist) {
  if (!playlist) return "Learning Track";
  const rawName = typeof playlist.name === "string" ? playlist.name.trim() : "";

  const isGeneric =
    !rawName ||
    rawName === "Imported Playlist" ||
    rawName === "Selected Playlist" ||
    rawName === "Untitled Playlist" ||
    rawName.startsWith("Playlist ") ||
    rawName === playlist._id;

  if (!isGeneric) return rawName;

  const videos = playlist.videos || [];
  const firstVideoTitle = videos[0]?.title || "";

  if (
    firstVideoTitle &&
    !firstVideoTitle.startsWith("Video ") &&
    firstVideoTitle !== "Selected Video"
  ) {
    const cleaned = firstVideoTitle.split(/[-|:|#]/)[0].trim();
    if (cleaned && cleaned.length > 2) {
      return `${cleaned} Course`;
    }
    return `${firstVideoTitle}`;
  }

  if (playlist.sourcePlaylistId) {
    return `YouTube Course (${playlist.sourcePlaylistId.slice(0, 6)})`;
  }

  return "Learning Track";
}

export default function WorkspacePage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [askResponse, setAskResponse] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const [activeStudyHubTab, setActiveStudyHubTab] = useState("notes");
  const [copiedLink, setCopiedLink] = useState(false);
  const studyHubRef = useRef(null);

  const [playlists, setPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [importValue, setImportValue] = useState("");
  const [importName, setImportName] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoAddLoading, setVideoAddLoading] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [videoAddOpen, setVideoAddOpen] = useState(false);

  const [fetchedVideoTitle, setFetchedVideoTitle] = useState("");
  const [fetchedVideoThumbnail, setFetchedVideoThumbnail] = useState("");
  const [videoTitlesCache, setVideoTitlesCache] = useState({});

  const [notice, setNotice] = useState(null);

  const [workspaceStats, setWorkspaceStats] = useState({
    totalTrackedVideos: 0,
    totalWatchTimeSec: 0,
    completedVideos: 0,
    completedGoals: 0,
  });

  const [videoProgress, setVideoProgress] = useState(null);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);

  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastTrackedPositionRef = useRef(0);
  const pendingSeekAppliedRef = useRef(false);
  const currentProgressRef = useRef(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(window.__workspaceNoticeTimer);
    window.__workspaceNoticeTimer = window.setTimeout(() => {
      setNotice(null);
    }, 2800);
  };

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState("");

  const [noteFormSignal, setNoteFormSignal] = useState(0);
  const [noteInitialTimestamp, setNoteInitialTimestamp] = useState(0);
  const [bookmarkFormSignal, setBookmarkFormSignal] = useState(0);
  const [bookmarkInitialTimestamp, setBookmarkInitialTimestamp] = useState(0);

  const changePlaybackSpeed = (speed) => {
    try {
      const player = playerRef.current;
      if (player && typeof player.setPlaybackRate === "function") {
        player.setPlaybackRate(speed);
      }
      setPlaybackSpeed(speed);
      showNotice("success", `Playback speed set to ${speed}x`);
    } catch (err) {
      console.error("Change playback speed error:", err);
    }
  };

  const jumpSeconds = (delta) => {
    try {
      const current = getCurrentPlayerTimestamp();
      const target = Math.max(0, current + delta);
      seekPlayerToTimestamp(target);
      showNotice("success", delta > 0 ? `+${delta}s forward` : `${delta}s rewind`);
    } catch (err) {
      console.error("Jump seconds error:", err);
    }
  };

  const togglePlayPause = () => {
    try {
      const player = playerRef.current;
      if (!player) return;
      const state = player.getPlayerState?.();
      if (state === 1) {
        player.pauseVideo?.();
        setIsPlaying(false);
      } else {
        player.playVideo?.();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Toggle play error:", err);
    }
  };

  const handleQuickStampNote = () => {
    const time = getCurrentPlayerTimestamp();
    setNoteInitialTimestamp(time);
    setNoteFormSignal((prev) => prev + 1);
    setActiveStudyHubTab("notes");
    studyHubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleQuickPinBookmark = () => {
    const time = getCurrentPlayerTimestamp();
    setBookmarkInitialTimestamp(time);
    setBookmarkFormSignal((prev) => prev + 1);
    setActiveStudyHubTab("bookmarks");
    studyHubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyTimestampedLink = () => {
    const time = getCurrentPlayerTimestamp();
    const url = `https://youtu.be/${videoId}?t=${time}`;
    navigator.clipboard.writeText(url).then(() => {
      showNotice("success", `Timestamped URL copied (${formatWatchTime(time)})`);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable);
      if (isInput) return;

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        jumpSeconds(-10);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        jumpSeconds(10);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleQuickStampNote();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        handleQuickPinBookmark();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoId]);

  const selectedPlaylist = useMemo(() => {
    return playlists.find((item) => item._id === selectedPlaylistId) || null;
  }, [playlists, selectedPlaylistId]);

  const { prevVideo, nextVideo, currentIndex, totalVideosInPlaylist } = useMemo(() => {
    const videos = selectedPlaylist?.videos || [];
    const idx = videos.findIndex((v) => v.videoId === videoId);
    return {
      prevVideo: idx > 0 ? videos[idx - 1] : null,
      nextVideo: idx >= 0 && idx < videos.length - 1 ? videos[idx + 1] : null,
      currentIndex: idx,
      totalVideosInPlaylist: videos.length,
    };
  }, [selectedPlaylist, videoId]);

  const filteredPlaylistVideos = useMemo(() => {
    const list = selectedPlaylist?.videos || [];
    if (!playlistSearch.trim()) return list;
    const q = playlistSearch.toLowerCase();
    return list.filter((v) => {
      const t = (videoTitlesCache[v.videoId] || v.title || "").toLowerCase();
      return t.includes(q);
    });
  }, [selectedPlaylist, playlistSearch, videoTitlesCache]);

  const currentVideo = useMemo(() => {
    const fromSelectedPlaylist = selectedPlaylist?.videos?.find(
      (item) => item.videoId === videoId
    );

    if (fromSelectedPlaylist) {
      return {
        youtubeId: fromSelectedPlaylist.videoId,
        title: fromSelectedPlaylist.title,
        thumbnail: fromSelectedPlaylist.thumbnail || "",
      };
    }

    for (const playlist of playlists) {
      const found = playlist?.videos?.find((item) => item.videoId === videoId);
      if (found) {
        return {
          youtubeId: found.videoId,
          title: found.title,
          thumbnail: found.thumbnail || "",
        };
      }
    }

    return {
      youtubeId: videoId || "",
      title: fetchedVideoTitle || (videoId ? `Video ${videoId}` : "No video selected"),
      thumbnail:
        fetchedVideoThumbnail ||
        (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ""),
    };
  }, [playlists, selectedPlaylist, videoId, fetchedVideoTitle, fetchedVideoThumbnail]);

  useEffect(() => {
    if (!videoId) {
      setFetchedVideoTitle("");
      setFetchedVideoThumbnail("");
      return;
    }

    let isMounted = true;
    getVideoMeta(videoId)
      .then((res) => {
        if (!isMounted) return;
        const v = res?.video || res;
        if (v?.title) {
          setFetchedVideoTitle(v.title);
        }
        const thumb =
          v?.thumbnails?.high ||
          v?.thumbnails?.medium ||
          v?.thumbnails?.default ||
          v?.thumbnail;
        if (thumb) setFetchedVideoThumbnail(thumb);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  useEffect(() => {
    if (!selectedPlaylist?.videos?.length) return;

    let isMounted = true;
    selectedPlaylist.videos.forEach((video) => {
      if (!video || !video.videoId) return;
      const vTitle = typeof video.title === "string" ? video.title : "";
      const needsFetch =
        !vTitle ||
        vTitle === "Selected Video" ||
        vTitle.startsWith("Video ");

      if (needsFetch && !videoTitlesCache[video.videoId]) {
        getVideoMeta(video.videoId)
          .then((res) => {
            if (!isMounted) return;
            const t = res?.video?.title || res?.title;
            if (t) {
              setVideoTitlesCache((prev) => ({
                ...prev,
                [video.videoId]: t,
              }));
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      setPlaylistLoading(true);
      const res = await getPlaylists();
      const items = res?.playlists || [];

      // Auto-migrate generic database playlist names to resolved descriptive titles
      items.forEach((p) => {
        const raw = typeof p.name === "string" ? p.name.trim() : "";
        const isGeneric =
          !raw ||
          raw === "Imported Playlist" ||
          raw === "Selected Playlist" ||
          raw === "Untitled Playlist" ||
          raw.startsWith("Playlist ") ||
          raw === p._id;

        if (isGeneric) {
          const resolved = resolvePlaylistName(p);
          if (resolved && resolved !== raw && !resolved.startsWith("YouTube Course (")) {
            p.name = resolved;
            renamePlaylist(p._id, resolved).catch(() => {});
          }
        }
      });

      setPlaylists(items);

      if (!videoId) {
        setSelectedPlaylistId(items[0]?._id || "");
        return;
      }

      const containingPlaylist = items.find((playlist) =>
        playlist?.videos?.some((video) => video.videoId === videoId)
      );

      if (containingPlaylist) {
        setSelectedPlaylistId(containingPlaylist._id);
      } else if (items.length > 0) {
        setSelectedPlaylistId((prev) => {
          if (items.some((p) => p._id === prev)) return prev;
          return items[0]._id;
        });
      } else {
        setSelectedPlaylistId("");
      }
    } catch (error) {
      console.error("Load playlists error:", error);
      setPlaylists([]);
      setSelectedPlaylistId("");
      showNotice("error", "Failed to load playlists.");
    } finally {
      setPlaylistLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPlaylistId = params.get("playlistId");

    if (urlPlaylistId) {
      handleAutoImportPlaylist(urlPlaylistId);
    }
  }, [location.search]);

  const handleAutoImportPlaylist = async (id) => {
    try {
      setPlaylistLoading(true);
      const res = await getPlaylists();
      const items = res?.playlists || [];
      setPlaylists(items);

      const existing = items.find(
        (p) =>
          p._id === id ||
          p.youtubePlaylistId === id ||
          p.sourcePlaylistId === id ||
          p.youtubeId === id
      );

      if (existing) {
        setSelectedPlaylistId(existing._id);
        if (!videoId && existing.videos?.length > 0) {
          navigate(`/workspace/${existing.videos[0].videoId}`, { replace: true });
        }
        return;
      }

      const importRes = await importYouTubePlaylist(id);
      const newPlaylist = importRes?.playlist;

      if (newPlaylist) {
        setPlaylists((prev) => [newPlaylist, ...prev]);
        setSelectedPlaylistId(newPlaylist._id);
        showNotice("success", "Playlist automatically imported.");

        if (!videoId && newPlaylist.videos?.length > 0) {
          navigate(`/workspace/${newPlaylist.videos[0].videoId}`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Auto import error:", error);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const loadQuizAttempts = async () => {
    if (!videoId) {
      setQuizAttempts([]);
      return;
    }

    try {
      const res = await getQuizAttempts(videoId);
      setQuizAttempts(res?.attempts || []);
    } catch (error) {
      console.error("Quiz attempts load error:", error);
      setQuizAttempts([]);
    }
  };

  const loadWorkspaceStats = async () => {
    try {
      const res = await getDashboardAnalytics();
      setWorkspaceStats(
        res?.stats || {
          totalTrackedVideos: 0,
          totalWatchTimeSec: 0,
          completedVideos: 0,
          completedGoals: 0,
        }
      );
    } catch (error) {
      console.error("Workspace stats load error:", error);
      setWorkspaceStats({
        totalTrackedVideos: 0,
        totalWatchTimeSec: 0,
        completedVideos: 0,
        completedGoals: 0,
      });
    }
  };

  const loadNotes = async () => {
    if (!videoId) {
      setNotes([]);
      return;
    }

    try {
      setNotesLoading(true);
      const res = await getNotesByVideo(videoId);
      setNotes(res?.notes || []);
    } catch (error) {
      console.error("Load notes error:", error);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!videoId) {
      setBookmarks([]);
      return;
    }

    try {
      setBookmarksLoading(true);
      const res = await getBookmarksByVideo(videoId);
      setBookmarks(res?.bookmarks || []);
    } catch (error) {
      console.error("Load bookmarks error:", error);
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const loadCurrentVideoProgress = async () => {
    if (!videoId) {
      setVideoProgress(null);
      currentProgressRef.current = null;
      lastTrackedPositionRef.current = 0;
      pendingSeekAppliedRef.current = false;
      return;
    }

    try {
      const res = await getAllProgress();
      const all = res?.progress || [];
      const found = all.find((item) => item.videoId === videoId) || null;

      setVideoProgress(found);
      currentProgressRef.current = found;
      lastTrackedPositionRef.current = found?.lastPositionSec || 0;
      pendingSeekAppliedRef.current = false;
    } catch (error) {
      console.error("Load current video progress error:", error);
      setVideoProgress(null);
      currentProgressRef.current = null;
      lastTrackedPositionRef.current = 0;
      pendingSeekAppliedRef.current = false;
    }
  };

  const getCurrentPlayerTimestamp = () => {
    try {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return 0;
      return Math.floor(player.getCurrentTime() || 0);
    } catch {
      return 0;
    }
  };

  const seekPlayerToTimestamp = (seconds = 0) => {
    try {
      const player = playerRef.current;
      if (!player || typeof player.seekTo !== "function") return;
      player.seekTo(Number(seconds) || 0, true);
    } catch (error) {
      console.error("Seek player error:", error);
    }
  };

  useEffect(() => {
    setSummary(null);
    setFlashcards(null);
    setQuiz(null);
    setAskResponse(null);
    setChatMessages([]);

    loadQuizAttempts();
    loadNotes();
    loadBookmarks();
    loadWorkspaceStats();
    loadCurrentVideoProgress();
  }, [videoId]);

  useEffect(() => {
    loadPlaylists();
  }, [videoId]);

  useEffect(() => {
    if (!videoId) {
      setUseFallbackIframe(false);
      return;
    }

    let cancelled = false;
    setUseFallbackIframe(false);

    const initPlayer = async () => {
      stopProgressTimer();

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }

      if (!playerContainerRef.current) return;

      playerContainerRef.current.innerHTML = "";
      const mountEl = document.createElement("div");
      mountEl.className = "w-full h-full";
      playerContainerRef.current.appendChild(mountEl);

      try {
        const YT = await loadYouTubeIframeAPI();
        if (cancelled || !playerContainerRef.current) return;

        playerRef.current = new YT.Player(mountEl, {
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              const existing = currentProgressRef.current;
              if (
                existing?.lastPositionSec > 0 &&
                !pendingSeekAppliedRef.current
              ) {
                event.target.seekTo(existing.lastPositionSec, true);
                pendingSeekAppliedRef.current = true;
              }
            },
            onStateChange: async (event) => {
              const state = event.data;

              if (state === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startProgressTimer();
              }

              if (
                state === window.YT.PlayerState.PAUSED ||
                state === window.YT.PlayerState.ENDED
              ) {
                setIsPlaying(false);
                stopProgressTimer();
                await syncProgressNow();
                await loadWorkspaceStats();
              }
            },
            onError: (err) => {
              console.warn("YouTube player error code:", err?.data);
              if (!cancelled) {
                setUseFallbackIframe(true);
              }
            },
          },
        });
      } catch (err) {
        console.warn("YouTube JS API failed, using standard iframe fallback:", err);
        if (!cancelled) {
          setUseFallbackIframe(true);
        }
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      stopProgressTimer();

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;

    if (
      player &&
      typeof player.seekTo === "function" &&
      videoProgress?.lastPositionSec > 0 &&
      !pendingSeekAppliedRef.current
    ) {
      player.seekTo(videoProgress.lastPositionSec, true);
      pendingSeekAppliedRef.current = true;
    }
  }, [videoProgress]);

  const syncProgressNow = async () => {
    try {
      if (!videoId) return;

      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const currentPositionSec = Math.floor(player.getCurrentTime() || 0);
      const durationSec = Math.floor(player.getDuration?.() || 0);

      const deltaWatchSec = Math.max(
        0,
        Math.min(10, currentPositionSec - (lastTrackedPositionRef.current || 0))
      );

      const res = await updateVideoProgress({
        videoId,
        title: currentVideo.title || "Video",
        deltaWatchSec,
        currentPositionSec,
        durationSec,
      });

      const updated = res?.progress || null;
      setVideoProgress(updated);
      currentProgressRef.current = updated;
      lastTrackedPositionRef.current = currentPositionSec;
    } catch (error) {
      console.error("Progress sync error:", error);
    }
  };

  const stopProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      syncProgressNow();
    }, 15000);
  };

  const handleCreatePlaylist = async () => {
    if (!createName.trim()) {
      showNotice("error", "Please enter a playlist name.");
      return;
    }

    try {
      setPlaylistLoading(true);
      const res = await createPlaylist(createName.trim());
      const playlist = res?.playlist;

      if (playlist) {
        setPlaylists((prev) => [playlist, ...prev]);
        setSelectedPlaylistId(playlist._id);
        setCreateName("");
        setCreateOpen(false);
        showNotice("success", "Playlist created successfully.");
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          error?.message ||
          "Failed to create playlist."
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleImportPlaylist = async () => {
    const playlistId = extractPlaylistId(importValue);

    if (!playlistId) {
      showNotice("error", "Please enter a valid YouTube playlist URL or ID.");
      return;
    }

    try {
      setImportLoading(true);
      const res = await importYouTubePlaylist(
        playlistId,
        importName.trim() || "Imported Playlist"
      );
      const playlist = res?.playlist;

      if (playlist) {
        setPlaylists((prev) => [playlist, ...prev]);
        setSelectedPlaylistId(playlist._id);
        setImportValue("");
        setImportName("");
        setImportOpen(false);
        showNotice("success", "Playlist imported successfully.");
      }
    } catch (error) {
      console.error("Import playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          error?.message ||
          "Failed to import playlist."
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleRenamePlaylist = async () => {
    if (!selectedPlaylist) return;
    if (!renameName.trim()) {
      showNotice("error", "Please enter a new playlist name.");
      return;
    }

    try {
      const res = await renamePlaylist(selectedPlaylist._id, renameName.trim());
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        setRenameOpen(false);
        setRenameName("");
        showNotice("success", "Playlist renamed successfully.");
      }
    } catch (error) {
      console.error("Rename playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          error?.message ||
          "Failed to rename playlist."
      );
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;

    try {
      await deletePlaylist(selectedPlaylist._id);

      const nextPlaylists = playlists.filter(
        (item) => item._id !== selectedPlaylist._id
      );
      setPlaylists(nextPlaylists);
      setSelectedPlaylistId(nextPlaylists[0]?._id || "");
      setDeleteConfirmOpen(false);
      showNotice("success", "Playlist deleted successfully.");
    } catch (error) {
      console.error("Delete playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          error?.message ||
          "Failed to delete playlist."
      );
    }
  };

  const handleAddCurrentVideoToPlaylist = async () => {
    if (!selectedPlaylist || !videoId) {
      showNotice("error", "Please select or create a playlist first.");
      return;
    }

    try {
      let title = currentVideo.title;
      let thumbnail = currentVideo.thumbnail;

      if (
        !title ||
        title === "Selected Video" ||
        title.startsWith("Video ")
      ) {
        try {
          const metaRes = await getVideoMeta(videoId);
          const v = metaRes?.video || metaRes;
          if (v?.title) title = v.title;
          if (v?.thumbnails?.high || v?.thumbnails?.medium) {
            thumbnail = v.thumbnails.high || v.thumbnails.medium;
          }
        } catch {
          // ignore
        }
      }

      const payload = {
        videoId,
        title: title || `YouTube Video ${videoId}`,
        thumbnail:
          thumbnail ||
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };

      const res = await addVideoToPlaylist(selectedPlaylist._id, payload);
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        showNotice("success", "Current video added to playlist.");
      }
    } catch (error) {
      console.error("Add video to playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Failed to add video to playlist."
      );
    }
  };

  const handleAddVideoByUrl = async () => {
    if (!selectedPlaylist) {
      showNotice("error", "Please select or create a playlist first.");
      return;
    }

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      showNotice("error", "Please enter a valid YouTube video URL or ID.");
      return;
    }

    try {
      setVideoAddLoading(true);

      const res = await getVideoMeta(extractedVideoId);

      const title =
        res?.video?.title ||
        res?.title ||
        `YouTube Video ${extractedVideoId}`;

      const thumbnail =
        res?.video?.thumbnails?.high ||
        res?.video?.thumbnails?.medium ||
        res?.video?.thumbnails?.default ||
        res?.video?.thumbnail ||
        `https://img.youtube.com/vi/${extractedVideoId}/mqdefault.jpg`;

      const addRes = await addVideoToPlaylist(selectedPlaylist._id, {
        videoId: extractedVideoId,
        title,
        thumbnail,
      });

      const updated = addRes?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      }

      setVideoUrl("");
      showNotice("success", "Video added to playlist successfully.");
    } catch (error) {
      console.error("Add video by URL error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Failed to add video."
      );
    } finally {
      setVideoAddLoading(false);
    }
  };

  const handleRemoveVideo = async (playlistId, targetVideoId) => {
    try {
      const res = await removeVideoFromPlaylist(playlistId, targetVideoId);
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      }

      if (targetVideoId === videoId) {
        const nextVideo = updated?.videos?.[0]?.videoId;
        if (nextVideo) {
          navigate(`/workspace/${nextVideo}`);
        }
      }

      showNotice("success", "Video removed from playlist.");
    } catch (error) {
      console.error("Remove video error:", error);
      showNotice("error", "Failed to remove video.");
    }
  };

  const handleCreateNote = async ({ title, content, timestampSec, tags }) => {
    try {
      if (!videoId) return;

      try {
        await getVideoMeta(videoId);
      } catch {
        // ignore
      }

      await createNote({
        youtubeId: videoId,
        title,
        content,
        timestampSec,
        tags,
        type: "manual",
      });

      await loadNotes();
      showNotice("success", "Note saved successfully.");
    } catch (error) {
      console.error("Create note error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Failed to save note."
      );
    }
  };

  const handleUpdateNote = async (noteId, payload) => {
    try {
      await updateNote(noteId, payload);
      await loadNotes();
      showNotice("success", "Note updated successfully.");
    } catch (error) {
      console.error("Update note error:", error);
      showNotice("error", "Failed to update note.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      await loadNotes();
      showNotice("success", "Note deleted successfully.");
    } catch (error) {
      console.error("Delete note error:", error);
      showNotice("error", "Failed to delete note.");
    }
  };

  const handleCreateBookmark = async ({ label, note, timestampSec }) => {
    try {
      if (!videoId) return;

      try {
        await getVideoMeta(videoId);
      } catch {
        // ignore
      }

      await createBookmark({
        youtubeId: videoId,
        label,
        note,
        timestampSec,
      });

      await loadBookmarks();
      showNotice("success", "Bookmark saved successfully.");
    } catch (error) {
      console.error("Create bookmark error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Failed to save bookmark."
      );
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await deleteBookmark(bookmarkId);
      await loadBookmarks();
      showNotice("success", "Bookmark deleted successfully.");
    } catch (error) {
      console.error("Delete bookmark error:", error);
      showNotice("error", "Failed to delete bookmark.");
    }
  };

  const handleCreateRevisionFromNotes = async () => {
    try {
      if (!videoId) return;
      const res = await createRevisionFromNotes(videoId);
      showNotice(
        "success",
        `Created ${res?.revisionItemsCreated || 0} revision items from notes.`
      );
    } catch (error) {
      console.error("Revision from notes error:", error);
      showNotice("error", "Failed to create revision from notes.");
    }
  };

  const handleCreateRevisionFromBookmarks = async () => {
    try {
      if (!videoId) return;
      const res = await createRevisionFromBookmarks(videoId);
      showNotice(
        "success",
        `Created ${res?.revisionItemsCreated || 0} revision items from bookmarks.`
      );
    } catch (error) {
      console.error("Revision from bookmarks error:", error);
      showNotice("error", "Failed to create revision from bookmarks.");
    }
  };

  const handleGenerateSummary = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateSummary(videoId, true);
      setSummary(res.summary || null);
    } catch (error) {
      console.error("Summary error:", error);
      showNotice("error", "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateFlashcards(videoId, 8, true);
      setFlashcards(res.flashcards || null);
    } catch (error) {
      console.error("Flashcards error:", error);
      showNotice("error", "Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateQuiz(videoId, 10, true);

      if (res?.quiz?.questions?.length) {
        setQuiz(res.quiz);
      } else if (res?.quiz?.raw) {
        setQuiz({
          raw: res.quiz.raw,
          warning: res.quiz.warning || "Quiz failed to parse strict JSON",
        });
      } else {
        setQuiz({
          raw: "Quiz response returned empty.",
          warning: "No parsed questions found",
        });
      }
    } catch (error) {
      console.error("Quiz error:", error);
      showNotice("error", "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async (question) => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await askAi(videoId, question);
      setAskResponse(res.answer || res || null);
    } catch (error) {
      console.error("Ask AI error:", error);
      showNotice("error", "Ask AI failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatAi = async (question) => {
    try {
      if (!videoId) return;
      setLoading(true);
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: question },
      ]);

      const res = await chatWithAi(videoId, question);
      const content =
        res?.message?.answer || res?.message?.raw || "No response received";

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    } catch (error) {
      console.error("Chat AI error:", error);
      showNotice("error", "Chat failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async ({ answers }) => {
    try {
      if (!videoId) return null;

      const res = await saveQuizAttempt({
        youtubeId: videoId,
        title: currentVideo.title,
        answers,
      });
      await loadQuizAttempts();
      await loadWorkspaceStats();
      showNotice("success", "Quiz attempt saved successfully.");
      return res?.attempt || null;
    } catch (error) {
      console.error("Save quiz attempt error:", error);
      showNotice("error", "Failed to save quiz attempt.");
      return null;
    }
  };

  const renderEmptyWorkspace = !videoId;

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span>{notice.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Full-width Modernized Stats Ribbon spanning across the entire workspace */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip
          icon={Clock3}
          label="Tracked Videos"
          value={String(workspaceStats?.totalTrackedVideos || 0)}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          accentBorder="border-black/10 dark:border-white/10"
        />
        <StatChip
          icon={PlayCircle}
          label="Watch Time"
          value={formatWatchTime(workspaceStats?.totalWatchTimeSec || 0)}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          accentBorder="border-black/10 dark:border-white/10"
        />
        <StatChip
          icon={Trophy}
          label="Completed"
          value={String(workspaceStats?.completedVideos || 0)}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accentBorder="border-black/10 dark:border-white/10"
        />
        <StatChip
          icon={Sparkles}
          label="Goals Done"
          value={String(workspaceStats?.completedGoals || 0)}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          accentBorder="border-black/10 dark:border-white/10"
        />
      </div>

      {/* Main Content Area with Focus/Theater Mode support */}
      <div className={`grid h-full items-start gap-5 transition-all ${isFocusMode ? "xl:grid-cols-1" : "xl:grid-cols-[1.35fr_0.85fr]"}`}>
        <div className="min-w-0 space-y-5">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass premium-border rounded-[2rem] p-4 md:p-5 shadow-xs"
        >
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">Video Player</p>
              <h2 className="truncate text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {renderEmptyWorkspace ? "No video selected" : currentVideo.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-600 dark:text-blue-300 font-medium">
                Active session
              </div>
              {videoProgress?.lastPositionSec ? (
                <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1 text-xs text-muted">
                  Resume at {formatWatchTime(videoProgress.lastPositionSec)}
                </div>
              ) : null}

              {/* Focus / Theater Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
                  isFocusMode
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
                title={isFocusMode ? "Exit Focus Mode (F)" : "Enter Focus Mode (F)"}
              >
                {isFocusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">{isFocusMode ? "Standard View" : "Focus Mode"}</span>
              </button>

              {/* Keyboard Shortcuts Trigger */}
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1.5 text-muted hover:text-gray-900 dark:hover:text-white transition"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-black/10 dark:border-white/10 shadow-sm bg-black">
            <div className="aspect-video">
              {renderEmptyWorkspace ? (
                <div className="grid h-full place-items-center bg-black/20 p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                      <PlayCircle className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No video selected</h3>
                    <p className="mt-2 text-sm text-muted">
                      Select a video from the playlist or click an item in the sidebar.
                    </p>
                  </div>
                </div>
              ) : (
                <div ref={playerContainerRef} className="h-full w-full relative">
                  {useFallbackIframe ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                      title={currentVideo.title || "YouTube Video"}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Modern Interactive Video Controls Ribbon */}
          {!renderEmptyWorkspace && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-2 sm:p-2.5">
              {/* Left: Playback scrub & Play/Pause */}
              <div className="flex items-center gap-1.5">
                {/* Jump -10s */}
                <button
                  type="button"
                  onClick={() => jumpSeconds(-10)}
                  className="inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer"
                  title="Rewind 10s (J)"
                >
                  <RotateCcw size={13} />
                  <span className="font-mono text-[11px]">-10s</span>
                </button>

                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                  title={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
                >
                  {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                </button>

                {/* Jump +10s */}
                <button
                  type="button"
                  onClick={() => jumpSeconds(10)}
                  className="inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer"
                  title="Forward 10s (L)"
                >
                  <RotateCw size={13} />
                  <span className="font-mono text-[11px]">+10s</span>
                </button>

                {/* Lesson Prev / Next if playlist exists */}
                {prevVideo && (
                  <button
                    type="button"
                    onClick={() => navigate(`/workspace/${prevVideo.videoId}`)}
                    className="hidden lg:inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    title={`Previous: ${prevVideo.title}`}
                  >
                    <ArrowLeft size={13} />
                    <span>Prev</span>
                  </button>
                )}

                {nextVideo && (
                  <button
                    type="button"
                    onClick={() => navigate(`/workspace/${nextVideo.videoId}`)}
                    className="hidden lg:inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    title={`Next: ${nextVideo.title}`}
                  >
                    <span>Next</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {/* Middle: Playback Speed Selector Pills */}
              <div className="flex items-center gap-0.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1">
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackSpeed(rate)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold font-mono transition cursor-pointer ${
                      playbackSpeed === rate
                        ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "text-muted hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Right: Smart Interactive Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleQuickStampNote}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                  title="Stamp a note with current timestamp (N)"
                >
                  <FileText size={13} />
                  <span>Stamp Note</span>
                </button>

                <button
                  type="button"
                  onClick={copyTimestampedLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 px-3 py-1.5 text-xs font-medium transition shadow-2xs cursor-pointer"
                  title="Copy link at current timestamp"
                >
                  <Share2 size={13} />
                  <span className="hidden sm:inline">Share Moment</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddCurrentVideoToPlaylist}
                disabled={!selectedPlaylist || !videoId}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-4 py-2 text-xs sm:text-sm font-medium transition disabled:opacity-40"
              >
                <FolderPlus size={15} />
                <span>Add to {selectedPlaylist ? resolvePlaylistName(selectedPlaylist).slice(0, 22) : "Playlist"}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setCopiedLink(true);
                    showNotice("success", "Workspace link copied to clipboard.");
                    setTimeout(() => setCopiedLink(false), 2000);
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition hover:bg-black/10 dark:hover:bg-white/10"
              >
                {copiedLink ? (
                  <>
                    <Check size={15} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={15} className="text-muted" />
                    <span>Copy workspace link</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick shortcuts to study hub */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveStudyHubTab("notes");
                  studyHubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                <FileText size={14} className="text-blue-500" />
                <span>Notes ({notes.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveStudyHubTab("bookmarks");
                  studyHubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                <Bookmark size={14} className="text-cyan-500" />
                <span>Bookmarks ({bookmarks.length})</span>
              </button>
            </div>
          </div>
        </motion.div>

        {!renderEmptyWorkspace ? (
          <>
            {/* 1. TOP PRIORITY: AI Study Features (Summary, Flashcards, Quiz, Ask AI, Chat) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              className="glass premium-border rounded-[2.2rem] p-5 md:p-6"
            >
              <AiTabs
                loading={loading}
                summary={summary}
                flashcards={flashcards}
                quiz={quiz}
                askResponse={askResponse}
                chatMessages={chatMessages}
                quizAttempts={quizAttempts}
                onGenerateSummary={handleGenerateSummary}
                onGenerateFlashcards={handleGenerateFlashcards}
                onGenerateQuiz={handleGenerateQuiz}
                onAskAi={handleAskAi}
                onChatAi={handleChatAi}
                onSubmitQuiz={handleSubmitQuiz}
              />
            </motion.div>

            {/* 2. LOWER PRIORITY: Unified Study Notes & Bookmarks Hub */}
            <motion.div
              ref={studyHubRef}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45 }}
              className="glass premium-border rounded-[2.2rem] p-5 md:p-6 scroll-mt-24 space-y-4"
            >
              {/* Hub Top Bar & Segmented Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Study Notes & Bookmarks
                    </h3>
                    <p className="text-xs text-muted">
                      Your saved timestamps, review notes, and key moments
                    </p>
                  </div>
                </div>

                {/* Switcher Buttons */}
                <div className="flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveStudyHubTab("notes")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeStudyHubTab === "notes"
                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                        : "text-muted hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <FileText size={13} />
                    <span>Notes ({notes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStudyHubTab("bookmarks")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeStudyHubTab === "bookmarks"
                        ? "bg-teal-600 text-white shadow-xs font-semibold"
                        : "text-muted hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Bookmark size={13} />
                    <span>Bookmarks ({bookmarks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStudyHubTab("split")}
                    className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeStudyHubTab === "split"
                        ? "bg-slate-800 dark:bg-slate-700 text-white shadow-xs font-semibold"
                        : "text-muted hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Columns size={13} />
                    <span>Side-by-Side</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Display */}
              {activeStudyHubTab === "notes" && (
                <NotesPanel
                  notes={notes}
                  loading={notesLoading}
                  onCreateNote={handleCreateNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onSeekToTimestamp={seekPlayerToTimestamp}
                  getCurrentTimestamp={getCurrentPlayerTimestamp}
                  onGenerateRevisionFromNotes={handleCreateRevisionFromNotes}
                  formOpenSignal={noteFormSignal}
                  initialTimestampSec={noteInitialTimestamp}
                />
              )}

              {activeStudyHubTab === "bookmarks" && (
                <BookmarksPanel
                  bookmarks={bookmarks}
                  loading={bookmarksLoading}
                  onCreateBookmark={handleCreateBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onSeekToTimestamp={seekPlayerToTimestamp}
                  onGenerateRevisionFromBookmarks={handleCreateRevisionFromBookmarks}
                  getCurrentTimestamp={getCurrentPlayerTimestamp}
                  formOpenSignal={bookmarkFormSignal}
                  initialTimestampSec={bookmarkInitialTimestamp}
                />
              )}

              {activeStudyHubTab === "split" && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-black/[0.02] dark:bg-white/[0.02]">
                    <NotesPanel
                      notes={notes}
                      loading={notesLoading}
                      onCreateNote={handleCreateNote}
                      onUpdateNote={handleUpdateNote}
                      onDeleteNote={handleDeleteNote}
                      onSeekToTimestamp={seekPlayerToTimestamp}
                      getCurrentTimestamp={getCurrentPlayerTimestamp}
                      onGenerateRevisionFromNotes={handleCreateRevisionFromNotes}
                      formOpenSignal={noteFormSignal}
                      initialTimestampSec={noteInitialTimestamp}
                    />
                  </div>
                  <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-black/[0.02] dark:bg-white/[0.02]">
                    <BookmarksPanel
                      bookmarks={bookmarks}
                      loading={bookmarksLoading}
                      onCreateBookmark={handleCreateBookmark}
                      onDeleteBookmark={handleDeleteBookmark}
                      onSeekToTimestamp={seekPlayerToTimestamp}
                      onGenerateRevisionFromBookmarks={handleCreateRevisionFromBookmarks}
                      getCurrentTimestamp={getCurrentPlayerTimestamp}
                      formOpenSignal={bookmarkFormSignal}
                      initialTimestampSec={bookmarkInitialTimestamp}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="glass premium-border flex flex-col rounded-[2.2rem] p-5 md:p-6 xl:sticky xl:top-6 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-none min-h-[560px]"
      >
        {/* Header & Action Toolbar - Symmetrical & Full-Width */}
        <div className="mb-5 pb-4 border-b border-black/10 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 p-2.5 border border-black/10 dark:border-white/15 shrink-0 shadow-lg shadow-blue-500/10">
              <FolderOpen size={20} className="text-blue-600 dark:text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {resolvePlaylistName(selectedPlaylist) || "Playlists"}
              </h2>
              <p className="text-xs text-muted font-medium mt-0.5">
                {playlists.length} playlist{playlists.length === 1 ? "" : "s"} • {selectedPlaylist?.videos?.length || 0} video{selectedPlaylist?.videos?.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Sleek Action Toolbar - Full width 6-column grid filling the entire gap */}
          <div className="grid grid-cols-6 gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1.5 rounded-2xl border border-black/10 dark:border-white/10 shadow-xs w-full">
            <button
              onClick={() => {
                setCreateOpen((prev) => !prev);
                setRenameOpen(false);
                setImportOpen(false);
                setVideoAddOpen(false);
                setDeleteConfirmOpen(false);
              }}
              title="Create New Track"
              className={`rounded-xl p-2 transition flex items-center justify-center cursor-pointer ${
                createOpen
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              <FolderPlus size={16} />
            </button>

            <button
              onClick={handleAddCurrentVideoToPlaylist}
              disabled={!selectedPlaylist || !videoId}
              title="Add Current Video to Track"
              className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
            >
              <Plus size={16} />
            </button>

            <button
              onClick={() => {
                setImportOpen((prev) => !prev);
                setCreateOpen(false);
                setRenameOpen(false);
                setVideoAddOpen(false);
                setDeleteConfirmOpen(false);
              }}
              title="Import YouTube Playlist"
              className={`rounded-xl p-2 transition flex items-center justify-center cursor-pointer ${
                importOpen
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => {
                setVideoAddOpen((prev) => !prev);
                setCreateOpen(false);
                setRenameOpen(false);
                setImportOpen(false);
                setDeleteConfirmOpen(false);
              }}
              title="Add Video by URL"
              className={`rounded-xl p-2 transition flex items-center justify-center cursor-pointer ${
                videoAddOpen
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              <Link2 size={16} />
            </button>

            <button
              onClick={() => {
                if (selectedPlaylist) {
                  setRenameName(selectedPlaylist.name || "");
                  setRenameOpen((prev) => !prev);
                  setCreateOpen(false);
                  setImportOpen(false);
                  setVideoAddOpen(false);
                  setDeleteConfirmOpen(false);
                }
              }}
              disabled={!selectedPlaylist}
              title="Rename Track"
              className={`rounded-xl p-2 transition disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer ${
                renameOpen
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => {
                if (selectedPlaylist) {
                  setDeleteConfirmOpen((prev) => !prev);
                  setCreateOpen(false);
                  setRenameOpen(false);
                  setImportOpen(false);
                  setVideoAddOpen(false);
                }
              }}
              disabled={!selectedPlaylist}
              title="Delete Track"
              className={`rounded-xl p-2 transition disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer ${
                deleteConfirmOpen
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Collapsible Create New Playlist Form */}
        <AnimatePresence>
          {createOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-4 overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  Create New Track
                </p>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="p-1 text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreatePlaylist();
                }}
                className="space-y-3"
              >
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Enter playlist name..."
                  autoFocus
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={playlistLoading || !createName.trim()}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {playlistLoading ? "Creating..." : "Create Track"}
                </button>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Collapsible Rename Playlist Form */}
        <AnimatePresence>
          {renameOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-4 overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                  Rename Track
                </p>
                <button
                  onClick={() => setRenameOpen(false)}
                  className="p-1 text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenamePlaylist();
                }}
                className="space-y-3"
              >
                <input
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Enter new track name..."
                  autoFocus
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs outline-none focus:border-amber-500 text-gray-900 dark:text-white placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={!renameName.trim()}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Save Name
                </button>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Delete Playlist Confirmation */}
        <AnimatePresence>
          {deleteConfirmOpen && selectedPlaylist ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-4 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                  Delete Track &quot;{selectedPlaylist.name}&quot;?
                </p>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="p-1 text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </div>
              <p className="text-xs text-muted mb-3 leading-relaxed">
                Are you sure you want to delete this track? This action cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeletePlaylist}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="flex-1 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-xs font-medium text-gray-800 dark:text-white transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Collapsible Import YouTube Playlist Form */}
        <AnimatePresence>
          {importOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-4 overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  Import YouTube Playlist
                </p>
                <button
                  onClick={() => setImportOpen(false)}
                  className="p-1 text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={importValue}
                  onChange={(e) => setImportValue(e.target.value)}
                  placeholder="Paste YouTube playlist URL or ID..."
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 text-gray-900 dark:text-white placeholder:text-muted"
                />
                <input
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Custom playlist name (optional)"
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 text-gray-900 dark:text-white placeholder:text-muted"
                />
                <button
                  onClick={handleImportPlaylist}
                  disabled={importLoading}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {importLoading ? "Importing..." : "Import Playlist"}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Collapsible Add Video by URL Form */}
        <AnimatePresence>
          {videoAddOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-4 overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                  Add Video by URL
                </p>
                <button
                  onClick={() => setVideoAddOpen(false)}
                  className="p-1 text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube video URL or ID..."
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs outline-none focus:border-cyan-500 text-gray-900 dark:text-white placeholder:text-muted"
                />
                <button
                  onClick={handleAddVideoByUrl}
                  disabled={videoAddLoading}
                  className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {videoAddLoading ? "Adding..." : "Add Video"}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Enlarged Sleek Playlist Selector Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Select Playlist</p>
          </div>
          {playlistLoading ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3.5 text-xs text-muted font-medium animate-pulse">
              Loading playlists...
            </div>
          ) : playlists.length ? (
            <div className="relative">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 transition cursor-pointer pr-10 shadow-sm"
              >
                {playlists.map((playlist) => {
                  const resolvedTitle = resolvePlaylistName(playlist);
                  return (
                    <option
                      key={playlist._id}
                      value={playlist._id}
                      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-2"
                    >
                      {resolvedTitle} ({playlist.videos?.length || 0} videos)
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
                <ChevronDown size={16} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-center text-xs text-muted leading-relaxed">
              No playlists yet. Click the icons above to create or import one.
            </div>
          )}
        </div>

        {/* Video List Section */}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Playlist Videos
          </p>
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
            {selectedPlaylist?.videos?.length || 0}
          </span>
        </div>

        {/* Quick Real-time Video Search */}
        {selectedPlaylist?.videos?.length > 1 && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={playlistSearch}
              onChange={(e) => setPlaylistSearch(e.target.value)}
              placeholder="Filter videos in track..."
              style={{ paddingLeft: "34px" }}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] pr-8 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
            />
            {playlistSearch ? (
              <button
                type="button"
                onClick={() => setPlaylistSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <XCircle size={13} />
              </button>
            ) : null}
          </div>
        )}

        {/* Enlarged Video List Container */}
        <div className="flex-1 min-h-[300px] max-h-[500px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {selectedPlaylist?.videos?.length ? (
            filteredPlaylistVideos.length ? (
              filteredPlaylistVideos.map((video, index) => {
                if (!video || !video.videoId) return null;

                const active = video.videoId === videoId;
                const vTitle = typeof video.title === "string" ? video.title : "";
                const displayTitle =
                  videoTitlesCache[video.videoId] ||
                  (vTitle && vTitle !== "Selected Video" && !vTitle.startsWith("Video ")
                    ? vTitle
                    : `Video ${video.videoId}`);

                return (
                  <motion.div
                    key={video.videoId}
                    whileHover={{ y: -1.5 }}
                    className={`group relative flex items-center gap-3 rounded-2xl border p-2 transition ${
                      active
                        ? "border-indigo-500/40 bg-indigo-500/10 shadow-2xs"
                        : "border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-center text-xs font-bold font-mono text-muted group-hover:text-gray-900 dark:group-hover:text-white transition">
                      #{index + 1}
                    </span>

                    <button
                      onClick={() => navigate(`/workspace/${video.videoId}`)}
                      className="relative block shrink-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 cursor-pointer"
                    >
                      <img
                        src={
                          video.thumbnail ||
                          `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
                        }
                        alt={displayTitle}
                        className="h-11 w-18 object-cover transition group-hover:scale-105"
                      />
                    </button>

                    <button
                      onClick={() => navigate(`/workspace/${video.videoId}`)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <p
                        className={`line-clamp-2 text-xs font-medium leading-snug ${
                          active ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-900 dark:text-white/90"
                        }`}
                      >
                        {displayTitle}
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        handleRemoveVideo(selectedPlaylist._id, video.videoId)
                      }
                      title="Remove video from playlist"
                      className="p-1.5 text-muted hover:text-rose-500 opacity-60 group-hover:opacity-100 transition rounded-xl hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-center text-xs text-muted">
                No lessons match &ldquo;{playlistSearch}&rdquo;.
              </div>
            )
          ) : (
            <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 p-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <ListVideo size={22} />
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">No videos in this playlist</p>
                <p className="mt-1 text-[11px] text-muted leading-relaxed max-w-[200px] mx-auto">
                  {selectedPlaylist
                    ? "Use the toolbar icons above to add a video URL or save the currently playing video."
                    : "Select a playlist from the top dropdown menu."}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </div>

    {/* Keyboard Shortcuts Modal */}
    <AnimatePresence>
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass premium-border rounded-3xl p-5 md:p-6 max-w-md w-full bg-white dark:bg-gray-900 shadow-xl border border-black/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                  <p className="text-[11px] text-muted">Active during video playback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {[
                { key: "Space / K", desc: "Toggle Play / Pause" },
                { key: "J", desc: "Rewind 10 Seconds" },
                { key: "L", desc: "Fast-Forward 10 Seconds" },
                { key: "N", desc: "Quick Stamp Note at Current Time" },
                { key: "B", desc: "Quick Pin Bookmark at Current Time" },
                { key: "F", desc: "Toggle Focus / Theater Mode" },
                { key: "?", desc: "Toggle this Shortcuts Guide" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{item.desc}</span>
                  <kbd className="px-2 py-0.5 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold text-[11px] shadow-2xs">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShortcutsOpen(false)}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 text-xs transition shadow-xs cursor-pointer"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}

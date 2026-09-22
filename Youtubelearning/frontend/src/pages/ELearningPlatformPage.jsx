import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Play,
  PlayCircle,
  Pause,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserCheck,
  Users,
  ChevronDown,
  ChevronRight,
  Bookmark,
  Volume2,
  VolumeX,
} from "lucide-react";

import ThemeToggle from "../components/common/ThemeToggle";

// Rich Mock Courses Dataset
const COURSES_DATA = [
  {
    id: "course-1",
    title: "Fullstack React & Next.js 14 Masterclass",
    instructor: "Dr. Sarah Jenkins",
    instructorTitle: "Senior Frontend Architect at Vercel",
    instructorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 1280,
    studentsCount: 14200,
    duration: "18h 45m",
    level: "Intermediate",
    language: "English",
    category: "Development",
    progress: 67,
    completedLessons: 8,
    totalLessons: 12,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    currentLesson: {
      id: "l-4",
      title: "Lesson 4: React Server Components & Suspense Architectures",
      duration: "14:20",
      module: "Module 2: Server Architecture",
    },
    modules: [
      {
        id: "m-1",
        title: "Module 1: Next.js 14 Fundamentals & App Router",
        lessons: [
          { id: "l-1", title: "1. Introduction to App Router Directory", duration: "08:15", completed: true },
          { id: "l-2", title: "2. Nested Layouts & Templates Deep Dive", duration: "12:40", completed: true },
          { id: "l-3", title: "3. Dynamic Routing & Catch-All Segments", duration: "10:05", completed: true },
        ],
      },
      {
        id: "m-2",
        title: "Module 2: Server Architecture & Data Fetching",
        lessons: [
          { id: "l-4", title: "4. React Server Components & Suspense Architectures", duration: "14:20", completed: false, active: true },
          { id: "l-5", title: "5. Server Actions & Form Mutations", duration: "16:50", completed: false },
          { id: "l-6", title: "6. Revalidation, Caching & Tag-Based Invalidation", duration: "11:30", completed: false },
        ],
      },
      {
        id: "m-3",
        title: "Module 3: Authentication & Database Integration",
        lessons: [
          { id: "l-7", title: "7. NextAuth v5 OAuth & Credentials Setup", duration: "18:10", completed: false, locked: true },
          { id: "l-8", title: "8. Prisma ORM & PostgreSQL Schema Design", duration: "22:00", completed: false, locked: true },
        ],
      },
    ],
    transcripts: [
      { time: "00:05", text: "Welcome back! In this lesson, we are exploring React Server Components in Next.js 14." },
      { time: "01:30", text: "Notice how Server Components execute exclusively on the Node server, reducing JS bundle size to zero." },
      { time: "03:45", text: "Let's inspect the network tab. Data fetching happens directly inside async component bodies." },
      { time: "06:10", text: "Suspense boundaries allow progressive stream rendering as HTML chunks flow to the browser." },
      { time: "09:25", text: "Now let's compare Client Component boundaries with the 'use client' directive." },
      { time: "12:00", text: "To summarize: keep interactivity leaf nodes client-side while keeping data fetchers server-side." },
    ],
  },
  {
    id: "course-2",
    title: "UI/UX Design Systems with Figma & Tailwind",
    instructor: "Alex Rivera",
    instructorTitle: "Principal Product Designer",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 840,
    studentsCount: 9100,
    duration: "12h 15m",
    level: "All Levels",
    language: "English",
    category: "Design",
    progress: 40,
    completedLessons: 4,
    totalLessons: 10,
    thumbnail: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    currentLesson: {
      id: "l-201",
      title: "Lesson 2: Tokens, Auto-Layout & Variants Matrix",
      duration: "18:45",
      module: "Module 1: Design Tokens",
    },
    modules: [
      {
        id: "m-201",
        title: "Module 1: Design System Foundations",
        lessons: [
          { id: "l-200", title: "1. Color Tokens & Semantic Variables", duration: "10:15", completed: true },
          { id: "l-201", title: "2. Tokens, Auto-Layout & Variants Matrix", duration: "18:45", completed: false, active: true },
        ],
      },
    ],
    transcripts: [
      { time: "00:00", text: "In this module, we build flexible design tokens using Figma components." },
      { time: "02:15", text: "Map your hex codes to semantic tokens like bg-primary and text-charcoal." },
    ],
  },
  {
    id: "course-3",
    title: "Python AI & Machine Learning Specialization",
    instructor: "Prof. David Chen",
    instructorTitle: "AI Researcher & Stanford Lecturer",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 4.95,
    reviewsCount: 2300,
    studentsCount: 28400,
    duration: "24h 30m",
    level: "Advanced",
    language: "Spanish",
    category: "Data Science",
    progress: 90,
    completedLessons: 18,
    totalLessons: 20,
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    currentLesson: {
      id: "l-301",
      title: "Lesson 19: PyTorch Neural Networks & Model Optimization",
      duration: "21:10",
      module: "Module 5: Deep Learning",
    },
    modules: [
      {
        id: "m-301",
        title: "Module 5: Neural Networks",
        lessons: [
          { id: "l-301", title: "19. PyTorch Neural Networks & Model Optimization", duration: "21:10", completed: false, active: true },
        ],
      },
    ],
    transcripts: [
      { time: "00:00", text: "Hola a todos. Hoy construiremos una red neuronal profunda con PyTorch." },
    ],
  },
  {
    id: "course-4",
    title: "Executive Leadership & Tech Career Strategy",
    instructor: "Elena Rostova",
    instructorTitle: "VP of Engineering & Career Coach",
    instructorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rating: 4.85,
    reviewsCount: 560,
    studentsCount: 6800,
    duration: "09h 10m",
    level: "Career",
    language: "English",
    category: "Career",
    progress: 20,
    completedLessons: 2,
    totalLessons: 10,
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    currentLesson: {
      id: "l-401",
      title: "Lesson 3: Negotiating Equity & Executive Promotions",
      duration: "15:30",
      module: "Module 1: Career Advancement",
    },
    modules: [
      {
        id: "m-401",
        title: "Module 1: Leadership Foundations",
        lessons: [
          { id: "l-401", title: "3. Negotiating Equity & Executive Promotions", duration: "15:30", completed: false, active: true },
        ],
      },
    ],
    transcripts: [
      { time: "00:00", text: "Strategic positioning is essential when pitching for executive roles." },
    ],
  },
];

const FILTER_TAGS = [
  "All Courses",
  "Development",
  "Design",
  "Data Science",
  "Career",
  "English",
  "Spanish",
];

export default function ELearningPlatformPage() {
  const [selectedCourse, setSelectedCourse] = useState(COURSES_DATA[0]);
  const [activeFilter, setActiveFilter] = useState("All Courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("transcript"); // "transcript" | "outline" | "overview"
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedModules, setExpandedModules] = useState({ "m-1": true, "m-2": true, "m-3": true });
  const [activeNav, setActiveNav] = useState("Courses");

  const videoRef = useRef(null);

  // Filter Courses
  const filteredCourses = COURSES_DATA.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "All Courses") return matchesSearch;
    if (activeFilter === "English" || activeFilter === "Spanish") {
      return matchesSearch && course.language === activeFilter;
    }
    return matchesSearch && course.category === activeFilter;
  });

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleSeekTranscript = (timeString) => {
    if (!videoRef.current) return;
    const parts = timeString.split(":").map(Number);
    const seconds = parts[0] * 60 + parts[1];
    videoRef.current.currentTime = seconds;
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans antialiased flex flex-col md:flex-row transition-colors">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E5E7EB] shrink-0 p-5 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          {/* Logo & Platform Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/25">
                <GraduationCap size={22} />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-[#111827]">EduPulse</h1>
                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">Mastery Hub</p>
              </div>
            </div>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: "Courses", label: "Courses", icon: BookOpen, badge: "14" },
              { id: "Mentors", label: "Mentors", icon: Users, badge: "New" },
              { id: "Analytics", label: "Analytics", icon: Compass, badge: null },
              { id: "Community", label: "Community", icon: MessageSquare, badge: "3" },
              { id: "Resources", label: "Resources", icon: FileText, badge: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? "bg-orange-50 text-orange-600 font-bold border border-orange-200/60 shadow-2xs"
                      : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? "text-orange-500" : "text-gray-400"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Mini Profile & Theme Toggle */}
        <div className="pt-6 border-t border-[#E5E7EB] space-y-4">
          <div className="hidden md:flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Appearance</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/70">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/20"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#111827] truncate">Alex Morgan</p>
              <p className="text-[10px] text-gray-500 truncate font-medium">Pro Scholar Pass</p>
            </div>
            <Sparkles size={16} className="text-orange-500 shrink-0" />
          </div>
        </div>
      </aside>

      {/* 2. Main Split-View Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header & Search Control Bar */}
        <header className="bg-white border-b border-[#E5E7EB] p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, mentors, or topics..."
              className="w-full bg-[#F9FAFB] text-xs font-medium text-[#111827] pl-10 pr-12 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Filter Pills Tag Group */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === tag
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                    : "bg-white text-gray-600 border border-[#E5E7EB] hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </header>

        {/* Split View Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-4 md:p-6 gap-6 min-h-0 overflow-y-auto">
          {/* Left Column: Course Directory List (4 cols) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="font-extrabold text-base text-[#111827] tracking-tight">Course Directory</h2>
                <p className="text-xs text-gray-500 font-medium">{filteredCourses.length} active courses available</p>
              </div>
              <SlidersHorizontal size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>

            {/* Scrollable Course Cards Stack */}
            <div className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourse.id === course.id;

                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsPlaying(false);
                    }}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10"
                        : "border-[#E5E7EB] hover:border-orange-300 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500 rounded-l-xl" />
                    )}

                    <div className="flex gap-3.5">
                      {/* Course Thumbnail */}
                      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {course.duration}
                        </span>
                      </div>

                      {/* Course Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                          {course.category}
                        </span>
                        <h3 className="font-bold text-xs text-[#111827] line-clamp-2 leading-snug">
                          {course.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                          <img
                            src={course.instructorAvatar}
                            alt={course.instructor}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="truncate">{course.instructor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats & Progress */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{course.rating}</span>
                        <span className="text-gray-400 font-normal">({course.reviewsCount})</span>
                      </div>

                      <div className="flex items-center gap-1 text-gray-500 font-medium">
                        <Clock size={12} />
                        <span>{course.progress}% Completed</span>
                      </div>
                    </div>

                    {/* Progress Line */}
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Course Player & Transcript (8 cols) */}
          <div className="lg:col-span-8 space-y-5 flex flex-col">
            {/* 1. Main Course Header Banner */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-xs text-orange-600 font-bold">
                  <BookOpen size={15} />
                  <span>{selectedCourse.category}</span>
                  <span>•</span>
                  <span className="text-gray-500 font-medium">{selectedCourse.language}</span>
                </div>
                <h2 className="font-extrabold text-lg md:text-xl text-[#111827] tracking-tight">
                  {selectedCourse.currentLesson.title}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedCourse.title} — {selectedCourse.currentLesson.module}
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/80 px-3.5 py-2 rounded-xl shrink-0">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-extrabold text-xs">
                  {selectedCourse.completedLessons}/{selectedCourse.totalLessons}
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Course Progress</p>
                  <p className="text-xs font-bold text-[#111827]">{selectedCourse.progress}% Completed</p>
                </div>
              </div>
            </div>

            {/* 2. Video Player Module */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden group">
                <video
                  ref={videoRef}
                  src={selectedCourse.videoUrl}
                  poster={selectedCourse.thumbnail}
                  className="w-full h-full object-cover"
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Custom Overlay Play Button */}
                {!isPlaying && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center transition-all">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 hover:bg-orange-600 transition"
                    >
                      <Play size={28} className="fill-white ml-1" />
                    </motion.button>
                  </div>
                )}

                {/* Custom Video Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-orange-400 transition">
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={toggleMute} className="hover:text-orange-400 transition">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <span className="text-xs font-medium">{selectedCourse.currentLesson.duration}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <button className="hover:text-orange-400 transition flex items-center gap-1">
                      <Bookmark size={16} />
                      <span className="hidden sm:inline">Save Note</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Toolbar & Resource Downloads */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCourse.instructorAvatar}
                    alt={selectedCourse.instructor}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#111827]">{selectedCourse.instructor}</p>
                    <p className="text-[11px] text-gray-500">{selectedCourse.instructorTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5">
                    <Download size={14} />
                    <span>Download Materials</span>
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-sm shadow-orange-500/25 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Mark Lesson Complete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Interactive Collapsible Video Transcript & Outline Module */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
              {/* Module Tab Selector */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                {[
                  { id: "transcript", label: "Video Transcript", icon: FileText },
                  { id: "outline", label: "Lesson Outline", icon: Layers },
                  { id: "overview", label: "Notes & Summary", icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-orange-50 text-orange-600 border border-orange-200/80 shadow-2xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={15} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Interactive Video Transcript */}
              {activeTab === "transcript" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Click any timestamp to seek directly to that segment in the video.
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedCourse.transcripts.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSeekTranscript(t.time)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-200/60 transition cursor-pointer group"
                      >
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded group-hover:bg-orange-500 group-hover:text-white transition">
                          {t.time}
                        </span>
                        <p className="text-xs text-gray-700 group-hover:text-gray-900 font-medium leading-relaxed">
                          {t.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Lesson Outline Accordion */}
              {activeTab === "outline" && (
                <div className="space-y-2.5">
                  {selectedCourse.modules.map((mod) => {
                    const isExpanded = expandedModules[mod.id];

                    return (
                      <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-left font-bold text-xs text-[#111827] hover:bg-gray-100 transition"
                        >
                          <span>{mod.title}</span>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {isExpanded && (
                          <div className="p-2 space-y-1 bg-white">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition ${
                                  lesson.active
                                    ? "bg-orange-50 text-orange-600 font-bold border border-orange-200"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {lesson.completed ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                  ) : lesson.locked ? (
                                    <Lock size={15} className="text-gray-400 shrink-0" />
                                  ) : (
                                    <PlayCircle size={16} className="text-orange-500 shrink-0" />
                                  )}
                                  <span className="truncate">{lesson.title}</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-mono">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Notes & Overview */}
              {activeTab === "overview" && (
                <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100">
                    <h4 className="font-bold text-orange-700 mb-1 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      Key Takeaways
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>React Server Components render exclusively on Node.js server.</li>
                      <li>Zero client-side JS bundle footprint for server component subtrees.</li>
                      <li>Leverage Suspense boundaries for progressive streaming response.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

# 🎓 YouTube Learning Platform

A full-stack, AI-powered interactive learning platform designed to transform YouTube videos and playlists into structured, tracked, and gamified study sessions.

---

## 🌟 Overview

The **YouTube Learning Platform** empowers self-learners to turn passive video watching into active study. By integrating YouTube video tracking with dynamic note-taking, AI-generated quizzes/summaries, coding challenge logs, interactive assignments, and real-time community interaction, students can organize their learning path, maintain study streaks, and measure their progress effectively.

---

## ✨ Key Features

### 🎬 Interactive Video Workspace
- **Custom YouTube Player**: Seamless video playback with progress tracking and automatic bookmarking.
- **Playlist & Single Video Import**: Quickly import complete YouTube playlists or standalone video links.
- **Timestamped Notes & Bookmarks**: Take notes linked directly to specific timestamps and revisit them with a single click.
- **Transcript Extraction**: Automatic fetching of YouTube video transcripts for quick reference and search.

### 🤖 AI Study Assistant (Powered by Google Gemini)
- **Instant Summaries**: Generate concise or detailed summaries of video transcripts.
- **Interactive Quizzes & Flashcards**: AI-generated quiz questions and flashcards tailored to video content.
- **Ask AI & Chat**: Ask questions about the current video or engage in structured study discussions.
- **Assignment Solver**: Upload context documents (Text, PDF, or Images) and get step-by-step AI solutions.

### 📊 Learning Analytics & Streaks
- **Activity Heatmap & Streak Tracking**: Track daily study output, streak counts, and activity metrics.
- **Weak-Topic Insights**: Automated feedback on areas requiring revision.
- **Certificates of Completion**: Issue verifiable completion certificates for completed courses or playlists.

### 💻 Coding Dashboard & Leaderboards
- **Developer Profiles**: Track coding stats across platforms.
- **Daily Challenge Tracker**: Maintain logs of manually solved coding problems.
- **Leaderboards & Contests**: Compete with peers on coding streaks and problem counts.

### 👥 Realtime Community & Social
- **User Discovery**: Connect with fellow learners and view study stats.
- **Socket.IO Live Chat**: Real-time messaging and peer interaction.
- **Connection Requests**: Manage incoming and outgoing friend/study connection requests.

### 🔐 Authentication & Security
- **Auth Options**: Email/Password authentication, Google OAuth integration, and JWT sessions.
- **Security Features**: Rate limiting, request validation with Zod, password hashing with bcrypt, and Helmet headers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS, Vanilla CSS, Framer Motion
- **Visuals & 3D**: Three.js, React Three Fiber, Lucide React Icons
- **State & Charts**: Recharts, React Router v7, Lenis smooth scroll
- **Realtime**: Socket.IO Client, Supabase JS Client

### Backend
- **Runtime**: Node.js + Express (CommonJS)
- **Database**: MongoDB (Mongoose) + Supabase (PostgreSQL)
- **Caching & Realtime**: Redis (ioredis), Socket.IO with Redis Adapter
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Document Processing**: `pdf-parse`, `cheerio`, `youtube-transcript`, `multer`

---

## 📁 Repository Structure

```
Youtubelearning/
├── backend/                  # Express REST API server
│   ├── config/               # DB and environment configuration
│   ├── controllers/          # Route controller handlers
│   ├── middleware/           # Auth, validation, rate limiting, error handlers
│   ├── models/               # MongoDB / Mongoose schemas
│   ├── routes/               # Express route declarations
│   ├── services/             # AI, analytics, YouTube, and business logic
│   ├── utils/                # Loggers, helpers, formatters
│   └── server.js             # Express application entry point
├── frontend/                 # React 19 Vite application
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # UI & feature components
│   │   ├── context/          # React contexts (Auth, Theme, Toast)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page layouts and routes
│   │   ├── services/         # Frontend API integration clients
│   │   └── main.jsx          # React app entry point
│   ├── index.html            # Vite HTML template
│   └── vite.config.js        # Vite configuration
├── docs/                     # API specification, database schema, & roadmap
├── supabase/                 # Supabase database schema & SQL migrations
├── package.json              # Workspace root scripts
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster
- **Redis**: Local instance or cloud Redis (optional for socket scaling)
- **Google Gemini API Key**: For AI study features

### 1. Clone the Repository

```bash
git clone https://github.com/aashi0201/Youtubelearning.git
cd Youtubelearning/Youtubelearning
```

### 2. Configure Environment Variables

#### Backend `.env` (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/youtubelearning
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
REDIS_URL=redis://localhost:6379
```

#### Frontend `.env` (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies & Run

#### Backend Server:
```bash
cd backend
npm install
npm run dev
```
*Backend runs at `http://localhost:5000`*

#### Frontend Client:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## ⚡ Root NPM Scripts

From the root directory, you can execute workspace commands:

| Command | Description |
| :--- | :--- |
| `npm run frontend:dev` | Start Vite frontend dev server |
| `npm run frontend:build` | Build frontend for production |
| `npm run backend:dev` | Start Express backend in dev mode |
| `npm run backend:check` | Check syntax for all backend JS files |
| `npm run check` | Run backend syntax check and frontend build test |

---

## 🌐 API Endpoint Summary

| Route Group | Path | Description |
| :--- | :--- | :--- |
| Auth | `/api/auth` | Login, register, token refresh, password reset |
| Videos | `/api/videos` | Fetch, import, and manage YouTube videos |
| Playlists | `/api/playlists` | Manage saved study playlists |
| Progress | `/api/progress` | Track video watch time and section completion |
| AI | `/api/ai` | Generate summaries, quizzes, flashcards, Q&A |
| Analytics | `/api/analytics` | Retrieve study statistics and heatmaps |
| Community | `/api/community` | User discovery, connections, messaging |
| Coding | `/api/coding` | Coding stats, challenge tracking, contests |

*For complete API documentation, refer to [`docs/api-spec.md`](docs/api-spec.md).*

---

## 📄 License

This project is licensed under the **MIT License**.

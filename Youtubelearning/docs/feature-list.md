# Feature List

YouTubelearning is a full-stack interactive learning platform for turning YouTube videos and playlists into tracked study sessions.

## Current Features

- Authentication: email/password registration, login, password reset, Google OAuth, JWT sessions.
- Dashboard: learning stats, search/discovery, recent activity, weak-topic insights, and quick actions.
- Workspace: YouTube player, playlist import, single-video add, resume position, watch-time tracking.
- Study tools: notes, bookmarks, revision items, quiz attempts, flashcards, summaries, ask/chat AI flows.
- Analytics: dashboard and per-video progress summaries backed by MongoDB.
- Community: user discovery, connection requests, realtime messaging with Socket.IO.
- Coding dashboard: coding profiles, daily activity, leaderboard, contests, manual solve tracking.
- Assignment solver: upload text/PDF/image context or instructions and request an AI solution.
- Certificates and admin summary endpoints for account/progress operations.

## Frontend Routes

- Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token`.
- Protected: `/dashboard`, `/workspace`, `/workspace/:videoId`, `/playlists`, `/analytics`, `/community`, `/dashboard/streak`, `/coding-dashboard`, `/assignment-solver`, `/settings`.

## Backend Route Groups

- `/api/auth`
- `/api/videos`
- `/api/playlists`
- `/api/progress`
- `/api/notes`
- `/api/bookmarks`
- `/api/transcripts`
- `/api/ai`
- `/api/planner`
- `/api/analytics`
- `/api/revision`
- `/api/certificates`
- `/api/community`
- `/api/activity`
- `/api/tasks`
- `/api/timetable`
- `/api/coding`

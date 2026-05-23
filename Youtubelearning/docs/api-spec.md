# API Spec

Base URL: `/api`

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

Successful responses should include `ok: true`. Errors should include `ok: false` and an `error` message.

## Auth

- `POST /auth/register` creates an account.
- `POST /auth/login` returns a JWT and user object.
- `POST /auth/google` verifies a Google credential and returns a JWT.
- `POST /auth/forgot-password` creates a reset token and optionally mails it.
- `POST /auth/reset-password/:token` sets a new password.
- `GET /auth/me` returns the current user.

## Learning Content

- `GET /videos/search?q=&type=` searches YouTube.
- `GET /videos/meta/:videoId` fetches metadata.
- `POST /videos/import` imports a video.
- `GET /playlists` lists current-user playlists.
- `POST /playlists` creates a playlist.
- `PUT /playlists/:id` renames a playlist.
- `DELETE /playlists/:id` deletes a playlist.
- `POST /playlists/:id/videos` adds a video.
- `DELETE /playlists/:id/videos/:videoId` removes a video.
- `POST /playlists/import` imports a YouTube playlist.

## Workspace

- `POST /progress/update` records watch progress.
- `GET /progress` lists progress entries.
- `GET /progress/analytics/summary` returns progress summary.
- `GET /notes/video/:youtubeId`, `POST /notes`, `PUT /notes/:id`, `DELETE /notes/:id`.
- `GET /bookmarks/video/:youtubeId`, `POST /bookmarks`, `DELETE /bookmarks/:id`.
- `GET /transcripts/:videoId`, `POST /transcripts/:videoId/import`.

## AI

- `POST /ai/summary/:youtubeId`
- `POST /ai/ask/:youtubeId`
- `POST /ai/chat/:youtubeId`
- `GET /ai/chat/:youtubeId`
- `DELETE /ai/chat/:youtubeId`
- `POST /ai/quiz/:youtubeId`
- `POST /ai/flashcards/:youtubeId`
- `GET /ai/flashcards/:youtubeId`
- `GET /ai/history`
- `GET /ai/history/:youtubeId`
- `POST /ai/quiz-attempt`
- `GET /ai/quiz-attempts`
- `GET /ai/quiz-attempts/:youtubeId`
- `POST /ai/solve-assignment`

## Planning And Activity

- `/planner` supports create, list, detail, update, delete.
- `/revision` supports review, generation from notes/bookmarks, today, and video-specific items.
- `/tasks` supports list, create, complete, delete.
- `/timetable` supports list, create, delete.
- `/activity/complete-task` and `/activity/streak` update and read streak activity.

## Community And Coding

- `/community/users`, `/community/leaderboard`, `/community/requests`, `/community/connections`, `/community/messages/:userId`.
- `/coding/tracker/:userId`, `/coding/tracker/update`, `/coding/activity/today`, `/coding/leaderboard`, `/coding/solve`, `/coding/contests`.

## Health

- `GET /api/health` returns database connection state and non-secret config readiness.

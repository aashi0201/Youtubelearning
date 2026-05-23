# Database Schema

MongoDB is accessed through Mongoose models in `backend/models`.

## Core Models

- `User`: account profile, auth provider, password reset fields, preferences, stats, coding handles, role, feature unlocks.
- `Video`: YouTube metadata, thumbnails, duration, transcript text/source, cached legacy AI summary and flashcards.
- `Playlist`: current-user playlist with embedded video references.
- `Progress`: per-user, per-video watch time, last position, max position, duration, completion flag.
- `Transcript`: stored transcript segments/raw text for a YouTube video.

## Study Models

- `Note`: user-created notes for a video with timestamps/content.
- `Bookmark`: user bookmarks for a video with timestamp and optional note.
- `RevisionItem`: spaced-review items generated from notes, bookmarks, or flashcards.
- `FlashcardSet`: saved flashcards per user/video.
- `QuizAttempt`: quiz answers, score, pass flag, and attempted date.
- `AIInteraction`: history of summaries, asks, chats, quizzes, flashcards, assignments.
- `AICache`: per-user AI cache keyed by video and cache type.
- `ChatSession`: AI tutor conversation history for a video.

## Productivity And Social Models

- `StudyGoal`, `Task`, `Timetable`, `UserActivity`: planner, daily tasks, schedule, streak/activity records.
- `Connection`, `Message`: community connections and direct messages.
- `Certificate`, `Achievement`, `CodingActivity`: certificates, gamification, and coding dashboard activity.

## Important Indexes

- `Progress` has a unique compound index on `{ userId, videoId }`.
- `Video.youtubeId` is unique.
- User-owned collections generally index the user field for current-user queries.

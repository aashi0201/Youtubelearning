# Roadmap

## Stabilization

- Keep protected frontend routes aligned with backend auth.
- Keep all service calls on the shared `api` client so `401` handling is consistent.
- Expand response normalization so all backend failures return `{ ok: false, error }`.
- Add automated tests for auth, playlist import, progress update, and AI response parsing.

## Product Upgrades

- Code split major frontend pages to reduce the initial bundle.
- Add a mobile bottom navigation for protected pages.
- Add a dedicated video detail route or remove old route assumptions permanently.
- Improve assignment image handling with real OCR or multimodal AI.
- Add transcript retry/import controls in the workspace.

## Platform

- Add CI that runs root `npm run check`.
- Add seed/demo data for local onboarding.
- Add centralized request logging and production-safe error reporting.
- Add rate-limit tuning by endpoint and user tier.
- Add deployment docs for frontend, backend, MongoDB, Redis, and environment variables.

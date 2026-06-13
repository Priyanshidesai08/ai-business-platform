# Phase 2 Notes

## Implemented

- Shared AI service with Gemini integration, retries, timeout, caching, and fallback generation.
- Sales module with lead capture, scoring, follow-up generation, persistence, and CRM notes.
- Marketing module with post, email, campaign, and ad copy generation plus saved campaigns.
- Support module with chat and ticket creation/listing.
- Analytics module with reports and conversion summaries.
- Phase 2 schema migration at `database/migrations/001_phase2_schema.sql`.
- Backend migration runner at `backend/scripts/migrate.js`.
- Backend smoke test at `backend/scripts/phase2-smoke.js`.
- Frontend module screens and Playwright coverage.

## Commands

```bash
cd backend
npm run migrate
npm run phase2-smoke
```

```bash
cd frontend
npx playwright test tests/phase2.spec.js
```

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

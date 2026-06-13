# Multi-Agent AI Business Automation Platform

This repository contains the Phase 1, Phase 2, and Phase 3 implementation of the Multi-Agent AI Business Automation Platform.

Current scope:

- Authentication and profile management
- Dashboard and protected routes
- Sales, marketing, support, analytics, AI, and orchestration modules
- Shared Gemini-backed AI service
- Dockerized local development
- Swagger API documentation

## Project Structure

```text
backend/
frontend/
database/
docker/
docs/
```

## Local Setup

1. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

2. Start PostgreSQL, backend, and frontend with Docker:

```bash
docker compose -f docker/docker-compose.yml up --build
```

3. Or run the frontend separately for local development:

```bash
cd frontend
npm install
npm run dev
```

4. Open:

- Frontend: http://localhost:5173
- API health: http://localhost:5000/health
- Swagger: http://localhost:5000/api-docs

## Backend Verification

Once the backend is running against PostgreSQL, run the smoke test:

```bash
cd backend
npm run smoke
```

This validates:

- Swagger JSON and Swagger UI respond
- Unauthorized requests are blocked
- A fresh user can register
- Login returns a JWT
- Protected profile access works
- Logout revokes the session
- Profile updates persist through `PUT /auth/profile`

## Full Stack Verification

To verify the complete Phase 1 demo against the Docker stack:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-phase1.ps1
```

This script:

- starts PostgreSQL, backend, and frontend with Docker
- verifies backend health and Swagger UI
- runs the backend smoke test
- runs browser E2E checks for register, login redirect, refresh persistence, profile access, and unauthorized redirect

## Phase 2

Phase 2 adds the sales, marketing, support, analytics, and shared AI modules.

Run the new migration and backend smoke checks:

```bash
cd backend
npm run migrate
npm run phase2-smoke
```

Run the Phase 2 browser flow:

```bash
cd frontend
npx playwright test tests/phase2.spec.js
```

## Phase 3

Phase 3 adds multi-agent communication, orchestration, shared context, and AI decision routing.

Run the Phase 3 smoke flow:

```bash
cd backend
npm run test:integration
```

The orchestrator endpoints are documented in Swagger and can be exercised with the sample Postman collection at `docs/postman_collection.json`.

## What Was Verified

- Backend build and unit tests
- Backend integration tests
- Frontend build
- Frontend browser checks for module navigation and collaboration
- Responsive behavior on mobile and tablet widths

## Final Notes

- A final report is available at `docs/final-report-phase3.md`
- Sample seed data is available at `database/seed.sql`

## Demo Flow

Register a user, log in, open the dashboard, view the profile page, and test secured endpoints in Swagger with the bearer token returned by login.

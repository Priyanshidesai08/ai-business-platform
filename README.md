# Multi-Agent AI Business Automation Platform

This repository contains the full multi-phase implementation of the Multi-Agent AI Business Automation Platform, including authentication, AI modules, orchestration, workflows, builder UX, and monitoring.

Current scope:

- Authentication and profile management
- Dashboard and protected routes
- Sales, marketing, support, analytics, AI, orchestration, workflow, builder, and monitoring modules
- Shared Gemini-backed AI service
- Dockerized local development
- Swagger API documentation

## Current Entry Points

- Frontend: http://localhost:5174
- Backend health: http://localhost:5001/health
- Swagger UI: http://localhost:5001/api-docs
- Forgot password: http://localhost:5174/forgot-password

## Release Docs

- [Setup Guide](docs/SETUP_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feature Matrix](docs/FEATURE_MATRIX.md)
- [API Guide](docs/API_GUIDE.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Final Report](docs/FINAL_REPORT.md)
- [Deployment Status](docs/DEPLOYMENT_STATUS.md)

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

- Frontend: http://localhost:5174
- API health: http://localhost:5001/health
- Swagger: http://localhost:5001/api-docs
- Forgot password: http://localhost:5174/forgot-password

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

## Deployment Status

The app is prepared for production-style deployment, but live public URLs for frontend, backend, and Swagger depend on your chosen hosting providers and credentials. The current verified local URLs are:

- Frontend: http://localhost:5174
- Backend: http://localhost:5001
- Swagger: http://localhost:5001/api-docs

See [Deployment Status](docs/DEPLOYMENT_STATUS.md) for the exact public-deployment checklist.

## What Was Verified

- Backend build and unit tests
- Backend integration tests
- Frontend build
- Frontend browser checks for module navigation and collaboration
- Responsive behavior on mobile and tablet widths
- Forgot password / reset password flow
- Browser verified export downloads for analytics, marketing, and workflow center

## Final Notes

- Sample seed data is available at `database/seed.sql`
- Phase 6 and Phase 7 release reports are available in the repo root

## Demo Flow

Register a user, log in, open the dashboard, view the profile page, and test secured endpoints in Swagger with the bearer token returned by login.

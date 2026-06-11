# Multi-Agent AI Business Automation Platform

Phase 1 builds the foundation for authentication, dashboard access, secured APIs, PostgreSQL persistence, Swagger documentation, and Dockerized backend services.

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

## Live Backend Verification

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

To also create and push a GitHub repository after GitHub login:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-phase1.ps1 -RepoName your-repo-name
```

## Demo Flow

Register a user, log in, open the dashboard, view the profile page, and test secured endpoints in Swagger with the bearer token returned by login.

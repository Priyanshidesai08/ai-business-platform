# Architecture

## Overview
The platform is a full-stack React + Node.js system built around authenticated AI business workflows.

## Frontend
- React + Vite
- Tailwind CSS
- Route-level code splitting with `React.lazy`
- Protected routes and shared shell UI

## Backend
- Node.js + Express
- JWT authentication
- Zod validation
- Central error handling
- Swagger documentation
- Modular domain services

## Core Modules
- Auth
- Sales
- Marketing
- Support
- Analytics
- AI
- Memory
- Knowledge
- Prompts
- Orchestrator
- Workflow
- Monitoring

## Data Layer
- PostgreSQL
- SQL migrations in `database/migrations/`
- Shared DB helpers in `backend/src/shared/db.js`

## Runtime Flow
1. User signs in and receives a JWT.
2. Protected routes load the dashboard and modules.
3. Module actions call the backend API.
4. AI calls are routed through the shared Gemini service.
5. Workflow and monitoring data persist in PostgreSQL.

## Deployment
- Docker Compose runs frontend, backend, and PostgreSQL
- Frontend serves on `5174`
- Backend serves on `5001`

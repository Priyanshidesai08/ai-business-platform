# Setup Guide

## Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL 16 if you want a local non-Docker setup
- Git

## Environment Files
- `backend/.env` from `backend/.env.example`
- `frontend/.env` if you want to override the API URL

## Install
```bash
cd backend
npm install

cd ../frontend
npm install
```

## Local Development
Run backend and frontend separately:
```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Docker Development
From the `docker/` directory:
```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5174
- Backend: http://localhost:5001
- Swagger: http://localhost:5001/api-docs

## Database
The app uses PostgreSQL with migrations in `database/migrations/` and seed/init SQL in `database/`.

## Verification Commands
```bash
cd backend
npm run smoke
npm run test

cd ../frontend
npm run lint
npm run build
npm run e2e
```

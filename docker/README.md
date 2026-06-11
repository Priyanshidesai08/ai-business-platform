# Docker

Start PostgreSQL, the backend API, and the frontend:

```bash
docker compose -f docker/docker-compose.yml up --build
```

The stack will be available at:

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Swagger: http://localhost:5000/api-docs

# Deployment Status

## Verified Locally

- Frontend runs on `http://localhost:5174`
- Backend health responds on `http://localhost:5001/health`
- Swagger UI responds on `http://localhost:5001/api-docs`
- Docker Compose starts frontend, backend, and PostgreSQL
- Export flows download files in the browser

## Still Needed For Public Deployment

- Vercel project connection for the frontend
- Render or Railway service for the backend
- Managed PostgreSQL instance credentials
- Production environment variables
- Public URLs for frontend, backend, and Swagger

## Recommended Public URLs

- Frontend: your Vercel domain
- Backend: your Render or Railway domain
- Swagger: `https://<backend-domain>/api-docs`

## Verification Checklist

- [ ] Frontend public URL loads
- [ ] Backend health URL loads
- [ ] Swagger opens publicly
- [ ] Register works in production
- [ ] Login works in production
- [ ] Export downloads work in production
- [ ] No console errors in production

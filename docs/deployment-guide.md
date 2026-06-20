# TeamFlow Deployment Guide

## Overview

| Component | Platform | Live URL |
|-----------|----------|----------|
| Frontend | Vercel | https://final-proj-sandy.vercel.app |
| Backend | Render | https://final-proj-yjse.onrender.com |
| Database | MongoDB Atlas | — |

No Docker required.

## Production architecture

Browser requests go to **same-origin** `/api/*` on Vercel. A Next.js catch-all route (`frontend/src/app/api/[...path]/route.ts`) proxies them to the Render backend using `API_PROXY_URL`. This keeps httpOnly auth cookies on the Vercel domain.

```
Browser  →  final-proj-sandy.vercel.app/api/...  →  (Vercel proxy)  →  final-proj-yjse.onrender.com/api/...
```

Do **not** set `NEXT_PUBLIC_API_URL` to the Render URL in production — that breaks cookie-based sessions.

---

## 1. MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a **free M0 cluster**
3. **Database Access** → Add user with password
4. **Network Access** → Add IP `0.0.0.0/0` (or restrict to Render/Vercel IPs in production)
5. **Connect** → Drivers → copy connection string
6. Replace `<password>` and set database name: `teamflow`

Example:
```
mongodb+srv://user:PASSWORD@cluster0.xxxxx.mongodb.net/teamflow?retryWrites=true&w=majority
```

---

## 2. Backend on Render

1. Push code to GitHub
2. Render Dashboard → **New Web Service**
3. Connect repository
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Instance:** Free

5. Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random string (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://final-proj-sandy.vercel.app` |
| `COOKIE_SECURE` | `true` |

6. Deploy → note URL: `https://final-proj-yjse.onrender.com`

7. Verify: `GET https://final-proj-yjse.onrender.com/health`

8. API docs: `https://final-proj-yjse.onrender.com/api-docs`

---

## 3. Frontend on Vercel

1. https://vercel.com → Import Git repository
2. **Root Directory:** `frontend`
3. Framework: Next.js (auto-detected)
4. Environment variables (**Production**):

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_API_URL` | `/api` | Browser base path (same-origin) |
| `API_PROXY_URL` | `https://final-proj-yjse.onrender.com` | Full Render URL, **no** `/api` suffix |

5. Deploy → note URL: `https://final-proj-sandy.vercel.app`

6. Verify proxy: `GET https://final-proj-sandy.vercel.app/api/auth/me` should return JSON with 401 when logged out (not a Next.js 404 page).

7. Ensure Render `CLIENT_URL` matches the Vercel URL exactly (no trailing slash).

---

## 4. Local development env

Copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=/api
API_PROXY_URL=http://localhost:5000
```

Run backend on port 5000 and frontend on port 3000. API calls use `/api` and are proxied to localhost the same way as production.

---

## 5. Post-Deploy Checklist

- [ ] Signup / login works on production
- [ ] Logout and session restore (`/api/auth/me`) work
- [ ] Create workspace → project → task
- [ ] Assign task to demo team member (Alice/Bob/Carol/David)
- [ ] Invite a second real user and confirm they see the shared workspace
- [ ] Comments and activity log visible
- [ ] Admin-only buttons (edit/delete project, delete task) behave correctly by role
- [ ] Swagger `/api-docs` loads on Render
- [ ] No CORS or `ERR_CONTENT_DECODING_FAILED` errors in browser console
- [ ] MongoDB Atlas shows collections with data

### Upgrading an older database

If you deployed before task assignees used `team_members`:

```bash
cd backend
npm run migrate:task-assignees
```

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on `/api/auth/login` (Vercel) | Proxy route not deployed, or `API_PROXY_URL` missing/wrong |
| `API_PROXY_URL must be a full backend URL` | Set `API_PROXY_URL` to `https://...onrender.com`, not `/api` |
| `ERR_CONTENT_DECODING_FAILED` | Deploy latest proxy route (strips `content-encoding` headers) |
| CORS error | Set Render `CLIENT_URL` exactly to Vercel URL (no trailing slash) |
| 401 after login | Check `COOKIE_SECURE=true` on Render; cookies must flow through Vercel proxy |
| Mongo timeout | Atlas IP whitelist; correct URI |
| Render sleep (free tier) | First request may take 30s — normal on free plan |

---

## 7. Submission Links

For course submission, provide:

1. GitHub repository (public, both collaborators)
2. Live frontend URL: https://final-proj-sandy.vercel.app
3. Live backend URL + `/api-docs`: https://final-proj-yjse.onrender.com/api-docs
4. Link to `docs/specification.md` (or GitHub docs folder)

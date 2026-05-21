# TeamFlow Deployment Guide

## Overview

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

No Docker required.

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
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance:** Free

5. Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random string (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |

6. Deploy → note URL: `https://teamflow-api.onrender.com`

7. Verify: `GET https://teamflow-api.onrender.com/health`

8. API docs: `https://teamflow-api.onrender.com/api-docs`

---

## 3. Frontend on Vercel

1. https://vercel.com → Import Git repository
2. **Root Directory:** `frontend`
3. Framework: Next.js (auto-detected)
4. Environment variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://teamflow-api.onrender.com/api` |

5. Deploy → note URL: `https://your-app.vercel.app`

6. Update Render `CLIENT_URL` to match Vercel URL and redeploy backend if CORS issues occur.

---

## 4. Post-Deploy Checklist

- [ ] Signup works on production
- [ ] Create workspace → project → task
- [ ] Comments and activity log visible
- [ ] Swagger `/api-docs` loads
- [ ] No CORS errors in browser console
- [ ] MongoDB Atlas shows collections with data

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Set `CLIENT_URL` exactly to Vercel URL (no trailing slash) |
| 401 on all requests | Check `JWT_SECRET` matches; token in localStorage |
| Mongo timeout | Atlas IP whitelist; correct URI |
| Render sleep (free tier) | First request may take 30s — normal on free plan |

---

## 6. Submission Links

For course submission, provide:

1. GitHub repository (public, both collaborators)
2. Live frontend URL
3. Live backend URL + `/api-docs`
4. Link to `docs/specification.md` (or GitHub docs folder)

# TeamFlow Frontend

Next.js App Router client for the TeamFlow API.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

## Environment variables

| Variable | Local value | Production (Vercel) |
|----------|-------------|------------------------|
| `NEXT_PUBLIC_API_URL` | `/api` | `/api` |
| `API_PROXY_URL` | `http://localhost:5000` | `https://final-proj-yjse.onrender.com` |

The browser always calls same-origin `/api/*`. The catch-all route at `src/app/api/[...path]/route.ts` forwards requests to `API_PROXY_URL` so httpOnly auth cookies stay on the frontend domain.

**Do not** set `NEXT_PUBLIC_API_URL` to the Render URL in production.

## Project docs

See the repository root [README.md](../README.md) and [docs/](../docs/) for the full specification, API reference, and deployment guide.

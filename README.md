# TeamFlow — Team Project Management Platform

A production-ready fullstack collaboration platform where teams create workspaces, manage projects, assign tasks, comment, and track activity — built for the Fullstack Development final project.

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://final-proj-sandy.vercel.app |
| Backend (Render) | https://final-proj-yjse.onrender.com |
| API Docs (Swagger) | https://final-proj-yjse.onrender.com/api-docs |
| MongoDB | MongoDB Atlas cluster |

## Features

- **Authentication** — Signup, login, logout with httpOnly cookie sessions + bcrypt (MongoDB users)
- **Workspaces** — Create, update, delete; invite members with roles (owner, admin, member)
- **Role-based access** — Admins/owners edit or delete projects and delete tasks; members can still create and update tasks
- **Team roster** — Demo assignees (Alice, Bob, Carol, David) per workspace; separate from login accounts
- **Projects** — CRUD per workspace with color labels
- **Tasks** — Statuses (Todo, In Progress, Review, Done), priorities, assignees, due dates (clearable)
- **Comments** — Discussion on tasks; delete your own comments only
- **Activity logs** — Audit trail for workspace events
- **Dashboard** — Task/project statistics and recent activity across your workspaces
- **AI planner** — Create workspaces, projects, and tasks from natural language; update the current task from the task page
- **Performance** — TanStack Query cache, debounced search, pagination, lazy-loaded components, React.memo

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js App Router, TypeScript, TailwindCSS, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT in httpOnly cookies (proxied via Vercel in production) |
| API Docs | Swagger OpenAPI at `/api-docs` |

## Project Structure

```
├── backend/          # Express API (own package.json, .env, node_modules)
├── frontend/         # Next.js app (own package.json, .env, node_modules)
├── docs/             # Specification & design documents
├── CONTRIBUTING.md   # Git workflow for pairs
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/teamflow
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
COOKIE_SECURE=false
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=/api
API_PROXY_URL=http://localhost:5000
```

The browser always calls same-origin `/api/*`. In dev, the Next.js catch-all route at `src/app/api/[...path]/route.ts` forwards those requests to `API_PROXY_URL`.

## Run Locally

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET
npm install
npm run dev
```

API: http://localhost:5000  
Swagger: http://localhost:5000/api-docs

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

### 3. Create first user

Open http://localhost:3000/login?mode=signup and register with your own email.

**Note:** Demo assignee emails like `alice@teamflow.demo` are for the task dropdown only. They are not pre-created login accounts. To test as another collaborator, sign up with a second email and invite that user from the workspace page.

### Optional: database scripts

```bash
cd backend
npm run seed:team-members       # seed demo assignees on all workspaces
npm run migrate:task-assignees  # fix legacy User-based task assignees
```

## API Documentation

- **Swagger UI**: `GET /api-docs` on the backend server
- **OpenAPI JSON**: `GET /api-docs.json`
- **Postman**: import `docs/TeamFlow.postman_collection.json`
- **Markdown reference**: [docs/api-endpoints.md](docs/api-endpoints.md)

### Main endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces/:workspaceId/projects` | Create project |
| GET | `/api/projects/:projectId/tasks` | List tasks (paginated) |
| POST | `/api/tasks/:taskId/comments` | Add comment |

Full list in [docs/api-endpoints.md](docs/api-endpoints.md).

## Deployment

### MongoDB Atlas

1. Create a free cluster
2. Database Access → create user
3. Network Access → allow `div.0.0.0/0` (or Vercel/Render IPs)
4. Copy connection string to `MONGODB_URI`

### Backend (Render)

1. New **Web Service** → connect GitHub repo, root directory: `backend`
2. Build: `npm install --include=dev && npm run build`
3. Start: `npm start`
4. Health check path: `/health`
5. Environment:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://final-proj-sandy.vercel.app` |
| `COOKIE_SECURE` | `true` |

### Frontend (Vercel)

1. Import repo, root directory: `frontend`
2. Environment (Production):

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `/api` |
| `API_PROXY_URL` | `https://final-proj-yjse.onrender.com` |

**Important:** `API_PROXY_URL` is the full Render URL (no `/api` suffix). Do not point `NEXT_PUBLIC_API_URL` at Render — cookies require same-origin `/api` requests through the Vercel proxy.

3. Deploy, then verify: `GET https://final-proj-sandy.vercel.app/api/auth/me` → JSON 401 (not a Next.js 404 page)

See [docs/deployment-guide.md](docs/deployment-guide.md) for details.

## AI assistant vs manual UI

| Action | AI planner | Manual UI |
|--------|------------|-----------|
| Create workspace / project / task | Dashboard, workspace, or project page → **Plan with AI** | Create buttons on each page |
| Update task (title, priority, status, assignee) | **Task detail** → **Plan with AI** | Edit fields on task page → Save |
| Edit workspace / project | — | Workspace or project page → Edit (admin) |
| Invite members | — | Workspace page → Invite (admin) |

Workspace edits and member invites use the standard UI so emails and permissions stay explicit.

## Git workflow

This repo is maintained as a **solo** final project. Pair workflow (feature branches + PRs) is documented in [CONTRIBUTING.md](CONTRIBUTING.md) if you collaborate later.

See [CONTRIBUTING.md](CONTRIBUTING.md):

- `main` — production-ready code
- `feature/*` — feature branches per teammate
- Pull requests required before merge
- Meaningful commits from both partners

## Screenshots

| Dashboard | Workspaces | Tasks |
|-----------|------------|-------|
| _Add screenshot after deploy_ | _Add screenshot_ | _Add screenshot_ |

## Documentation

| Document | Description |
|----------|-------------|
| [specification.md](docs/specification.md) | Full system spec |
| [erd.md](docs/erd.md) | Database ERD |
| [api-endpoints.md](docs/api-endpoints.md) | API table |
| [user-flow.md](docs/user-flow.md) | User journeys |
| [deployment-guide.md](docs/deployment-guide.md) | Deploy steps |
| [wireframes.md](docs/wireframes.md) | Screen wireframes |

## License

MIT — Academic final project.

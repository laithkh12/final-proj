# TeamFlow Backend

Express + MongoDB API for TeamFlow. Entry point: `src/server.ts`. Routes mounted under `/api`.

## Quick start

```bash
cp .env.example .env
# Set MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm run dev
```

API docs (local): http://localhost:5000/api-docs

## Documentation

| Topic | Location |
|-------|----------|
| **AI user flows** (chat → confirm → apply, scenarios, diagrams) | [docs/ai-flows.md](../docs/ai-flows.md) |
| **AI server implementation** (services, validation, env) | [docs/ai-server.md](../docs/ai-server.md) |
| REST API table | [docs/api-endpoints.md](../docs/api-endpoints.md) |
| Deploy / Render env | [docs/deployment-guide.md](../docs/deployment-guide.md) |

## AI planner (backend)

| Endpoint | File |
|----------|------|
| `POST /api/ai/chat` | `src/services/ai.service.ts` |
| `POST /api/ai/apply` | `src/services/aiApply.service.ts` |
| Context loading | `src/services/aiContext.service.ts` |
| Types | `src/types/ai.ts` |
| Routes | `src/routes/ai.routes.ts` |

Flow overview: user converses via `/ai/chat` until `status` is `ready`, then confirms via `/ai/apply`. See [AI flows](../docs/ai-flows.md) for all scenarios (create plan, batch updates, unassign all, etc.).

## Project layout

```
src/
├── config/         env, database
├── controllers/    route handlers
├── middleware/     auth, validate, rate limit, AI sanitize
├── models/         Mongoose schemas
├── routes/         Express routers
├── services/       business logic (including AI)
├── types/          shared TS types (ai.ts)
├── utils/          helpers (sanitizeAiProposal, projectColor)
└── validators/     express-validator chains
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Nodemon + ts-node |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run production build (Render) |

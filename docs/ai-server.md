# TeamFlow AI Planner — Server Documentation

This document describes the **backend** implementation of the AI planner: architecture, request flow, supported actions, validation, and configuration.

For HTTP request/response examples, see [api-endpoints.md](./api-endpoints.md#ai-planner). For user-facing AI flows and scenarios, see [ai-flows.md](./ai-flows.md). For deployment env vars, see [deployment-guide.md](./deployment-guide.md).

---

## Overview

The AI planner is a **two-step** flow:

1. **`POST /api/ai/chat`** — User converses with OpenAI. The model returns structured JSON: a friendly `message`, `status` (`gathering` | `ready`), and optionally a `proposal` when enough information is collected.
2. **`POST /api/ai/apply`** — After the user reviews the proposal in the UI, the server creates or updates real database records.

Nothing is written to MongoDB until `/ai/apply` runs. The user always confirms first.

```
Frontend (blade UI)
    │
    ├─ POST /api/ai/chat  ──► ai.service.ts      (OpenAI + enrich/validate)
    │                              │
    │                              └─ aiContext.service.ts (load page context)
    │
    └─ POST /api/ai/apply ──► sanitizeAiProposal.ts
                          ──► ai.validator.ts
                          ──► aiApply.service.ts   (MongoDB writes)
```

Both routes require authentication (`authenticate` middleware) and use the authenticated rate limiter.

---

## File map

| File | Responsibility |
|------|----------------|
| `backend/src/routes/ai.routes.ts` | Route definitions for `/ai/chat` and `/ai/apply` |
| `backend/src/controllers/ai.controller.ts` | Thin handlers; delegates to services |
| `backend/src/services/ai.service.ts` | OpenAI client, system prompt, JSON parsing, proposal enrichment |
| `backend/src/services/aiContext.service.ts` | Builds context snapshot from DB for the current page |
| `backend/src/services/aiApply.service.ts` | Applies proposals: create/update entities, activity logs |
| `backend/src/types/ai.ts` | TypeScript types for proposals, context, and apply results |
| `backend/src/validators/ai.validator.ts` | `express-validator` rules for chat and apply bodies |
| `backend/src/utils/sanitizeAiProposal.ts` | Normalizes proposal fields before apply validation |
| `backend/src/middleware/sanitizeAiProposal.middleware.ts` | Runs sanitizer on `/ai/apply` request body |
| `backend/src/utils/projectColor.ts` | Maps color names (`red`, `blue`) to hex for projects |

---

## Environment variables

Set in `backend/.env` (local) or Render (production):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes (for AI) | — | OpenAI API key. If missing, `/ai/chat` returns **503**. |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model passed to `chat.completions.create` |

Loaded in `backend/src/config/env.ts`. In development, `dotenv` overrides stale machine-level env vars so a local `.env` key is used.

---

## Context (`aiContext.service.ts`)

Every chat request includes a `context` object from the frontend:

```ts
{
  page: 'dashboard' | 'workspace' | 'project' | 'task',
  workspaceId?: string,
  projectId?: string,
  taskId?: string
}
```

`buildAiContext(userId, context)` returns an `AiContextSnapshot` injected into the OpenAI system prompt:

| Field | Source |
|-------|--------|
| `workspaces` | All workspaces the user belongs to (id, name, role) |
| `projects` | Projects in current workspace, or up to 50 across all workspaces on dashboard |
| `projectTasks` | Tasks in current project (id, title, status, priority) — up to 100 |
| `teamMembers` | `TeamMember` records for the workspace, or default demo roster on dashboard |
| `workspace` / `project` / `task` | Current entity when page context provides IDs |

**Default demo roster** (used for new workspaces and dashboard planning):

- Alice Chen — Frontend developer
- Bob Martinez — Backend developer
- Carol Nguyen — Product designer
- David Kim — QA engineer

New workspaces call `seedDefaultTeamMembers()` on creation so assign-by-name works after apply.

---

## Chat flow (`ai.service.ts`)

### OpenAI call

- Model: `env.openaiModel`
- `response_format: { type: 'json_object' }`
- Temperature: `0.4`
- System prompt includes: JSON schema, rules, page context, workspaces, projects, tasks, team roster

### Response shape

```ts
{
  message: string,
  intent: AiIntent,
  status: 'gathering' | 'ready',
  missingFields: string[],
  proposal: AiProposal | null
}
```

- **`gathering`** — Missing required fields; `proposal` is usually `null`. Assistant asks follow-up questions.
- **`ready`** — Proposal is complete; frontend shows review UI with **Confirm & create/save**.

### Server-side enrichment (`enrichAndValidateResult`)

After OpenAI returns JSON, the server post-processes proposals before sending them to the client:

1. **Roster listing** — If the user asked who can be assigned, ensure names appear in `message`.
2. **All-tasks expansion** — Phrases like “unassign all tasks” expand to `update_tasks` with one entry per project task (when on a project page).
3. **Task title resolution** — For `update_task` / `update_tasks`, match `taskTitle` to `projectTasks`; disambiguate duplicate titles.
4. **Assignee validation** — Match `assigneeName` to roster; reject invented names; strip fake `assigneeId` values (e.g. `default-roster-0`).
5. **Sanitize** — Normalize priority/status casing; remove invalid MongoDB assignee IDs.

---

## Proposal actions

| `action` | When used | Apply behavior |
|----------|-----------|----------------|
| `create_workspace` | Single new workspace | Creates workspace, owner membership, seeds demo team |
| `create_project` | Single new project | Requires `workspaceId` |
| `create_task` | Single new task | Requires `projectId` |
| `create_plan` | Workspace + project + multiple tasks in one confirm | Creates workspace (if `workspace.name`), project (if `project.name`), then loops `tasks[]` |
| `update_task` | Change one task | Resolves `taskId` from `taskTitle`; partial `task` fields |
| `update_tasks` | Change multiple tasks | Loops `taskUpdates[]`; each entry has `taskTitle` + fields |

### Task field enums

From `backend/src/constants/index.ts`:

- **Status:** `Todo`, `In Progress`, `Review`, `Done`
- **Priority:** `Low`, `Medium`, `High`, `Urgent`

### Assignees

- Use `assigneeName` (preferred). Server resolves name → `TeamMember._id` in the workspace.
- For **new workspaces** in a plan, only names are sent; IDs are resolved after `seedDefaultTeamMembers`.
- **Unassign:** set `clearAssignee: true` on the task or `taskUpdates` entry.

### Project colors

AI should send color **names** (`red`, `blue`, `purple`), not ask users for hex. `resolveProjectColor()` maps names to hex; unknown names default to `#6366f1`.

---

## Apply flow (`aiApply.service.ts`)

### Middleware order (`/ai/apply`)

1. `authenticate`
2. `authenticatedRateLimiter`
3. `sanitizeAiProposalBody` — normalize priorities/status; strip invalid `assigneeId`
4. `validate(aiApplyValidator)` — `express-validator` checks
5. `postApply` → `applyAiProposal(userId, proposal)`

### Apply results

| `type` | Returned when |
|--------|----------------|
| `workspace` | `create_workspace` |
| `project` | `create_project` |
| `task` | `create_task` |
| `plan` | `create_plan` (includes `workspaceId`, `projectId`, `taskIds`) |
| `task_updated` | `update_task` |
| `tasks_updated` | `update_tasks` |

Each successful write logs an activity entry via `activity.service.ts`.

### Permissions

`assertCanCreateInWorkspace()` ensures the user is a workspace member before creates/updates. Standard workspace RBAC applies elsewhere (invite, delete, etc. are **not** exposed via AI).

---

## Sanitization (`sanitizeAiProposal.ts`)

AI output is not always validator-clean. Before apply validation, the server:

- Normalizes `priority` / `status` case (`low` → `Low`, `todo` → `Todo`)
- Deletes `assigneeId` when it is not a 24-char hex MongoDB ObjectId (e.g. `default-roster-0`)
- Runs on `task`, `tasks[]`, and `taskUpdates[]`

Sanitization also runs on **ready** proposals returned from `/ai/chat` so the client receives clean data.

### Common validation failures (400)

If apply still returns `Validation failed`, typical causes:

| Issue | Example | Fix |
|-------|---------|-----|
| Invalid priority | `low` without sanitization | Use exact enum or rely on sanitizer after deploy |
| Invalid `assigneeId` | `default-roster-0` | Sanitizer strips; use `assigneeName` only |
| Invalid `dueDate` | empty string or non-ISO | Omit `dueDate` or use ISO 8601 |
| Invalid root `workspaceId` / `projectId` | placeholder from AI | Omit IDs when creating new entities |

---

## What AI does **not** do (by design)

These remain **manual UI** only:

- Edit workspace / project metadata (except via AI create)
- Invite or remove workspace members
- Delete entities
- Comment on tasks

See README **AI assistant vs manual UI** table.

---

## Error codes

| Code | Cause |
|------|-------|
| 400 | Validation failed (apply body) or business rule in apply service |
| 401 | Not logged in |
| 403 | Not a workspace member |
| 404 | Referenced project/task not found |
| 502 | OpenAI returned invalid JSON |
| 503 | `OPENAI_API_KEY` not configured |

---

## Local development

```bash
cd backend
# Set OPENAI_API_KEY in .env
npm run dev
```

Frontend proxies `/api/*` to `http://localhost:5000` via `API_PROXY_URL` in `frontend/.env.local`.

Test chat:

```http
POST /api/ai/chat
Cookie: token=...
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "Create a project called API" }],
  "context": { "page": "dashboard" }
}
```

When `status` is `ready`, copy `proposal` into:

```http
POST /api/ai/apply
{ "proposal": { ... } }
```

---

## Extending the planner

To add a new action:

1. Add type to `AiProposalAction` and `AiIntent` in `types/ai.ts`
2. Extend `RESPONSE_SCHEMA` and rules in `ai.service.ts`
3. Add validator rules in `ai.validator.ts`
4. Implement handler in `aiApply.service.ts` and branch in `applyAiProposal`
5. Update frontend `AiProposal` types and `ProposalSummary` / `handleApply` in `AiAssistantBlade.tsx`

Keep OpenAI rules and server enrichment in sync so the model cannot bypass validation.

# TeamFlow API Endpoints

**Base URL (direct / Swagger / Postman):** `https://final-proj-yjse.onrender.com/api`  
**Base URL (browser in production):** `/api` on the Vercel frontend (proxied to Render)  
**Auth:** httpOnly cookie `token` (browser) or `Authorization: Bearer <token>` (API tools)

## Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/signup` | No | `{ name, email, password }` | Register user |
| POST | `/auth/login` | No | `{ email, password }` | Login |
| GET | `/auth/me` | Yes | — | Current user |
| POST | `/auth/logout` | Yes | — | Clear session |

**Response (signup/login):**
```json
{
  "success": true,
  "data": { "user": { "_id", "name", "email" } },
  "message": "Logged in successfully"
}
```

Session token is set in an httpOnly cookie (`token`), not returned in the JSON body.

## Users

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| GET | `/users/me` | Yes | — |
| PATCH | `/users/me` | Yes | `{ name?, bio?, avatar? }` |

## Workspaces

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/workspaces` | Yes | List user workspaces |
| POST | `/workspaces` | Yes | Create workspace (seeds demo team members) |
| GET | `/workspaces/:id` | Yes | Workspace + members + stats |
| PATCH | `/workspaces/:id` | Yes | Update workspace (admin/owner) |
| DELETE | `/workspaces/:id` | Yes | Delete workspace + cascade (owner only) |
| POST | `/workspaces/:id/members` | Yes | Invite `{ email, role? }` (admin/owner; owner only for `role: admin`) |
| DELETE | `/workspaces/:id/members/:userId` | Yes | Remove member (admin/owner; cannot remove self or owner) |
| GET | `/workspaces/:id/team-members` | Yes | List assignable team roster (auto-seeds defaults if missing) |
| GET | `/workspaces/:id/activity` | Yes | Activity log (paginated) |
| GET | `/workspaces/dashboard/stats` | Yes | Dashboard aggregates for current user |

## Projects

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/workspaces/:workspaceId/projects` | Yes | List projects |
| POST | `/workspaces/:workspaceId/projects` | Yes | Create project |
| GET | `/projects/:id` | Yes | Returns `{ project, taskStats, myRole }` |
| PATCH | `/projects/:id` | Yes | Update project (**admin/owner**) |
| DELETE | `/projects/:id` | Yes | Delete project + tasks + comments (**admin/owner**) |

**Response (GET `/projects/:id`):**
```json
{
  "success": true,
  "data": {
    "project": { "_id", "name", "description", "workspace", "color", ... },
    "taskStats": [{ "_id": "Todo", "count": 3 }],
    "myRole": "owner"
  }
}
```

## Tasks

| Method | Endpoint | Auth | Query / body |
|--------|----------|------|--------------|
| GET | `/projects/:projectId/tasks` | Yes | `page`, `limit`, `status`, `priority`, `search` |
| POST | `/projects/:projectId/tasks` | Yes | body: task fields |
| GET | `/tasks/:id` | Yes | Returns `{ task, myRole }` |
| PATCH | `/tasks/:id` | Yes | body may include `assignee` (team member id or `null`), `dueDate` (ISO string or `null` to clear) |
| DELETE | `/tasks/:id` | Yes | Delete task + comments (**admin/owner**) |

**Response (GET `/tasks/:id`):**
```json
{
  "success": true,
  "data": {
    "task": { "_id", "title", "status", "assignee", ... },
    "myRole": "member"
  }
}
```

## Comments

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/tasks/:taskId/comments` | Yes | List comments |
| POST | `/tasks/:taskId/comments` | Yes | Add comment |
| DELETE | `/comments/:id` | Yes | Delete comment (**author only**) |

## Roles & permissions

| Role | Capabilities |
|------|----------------|
| **owner** | Full workspace control; only role that can invite admins |
| **admin** | Edit/delete projects and tasks; invite/remove members (except owner); cannot invite other admins |
| **member** | View all content; create projects/tasks; update tasks; add comments; delete own comments |

**Note:** Task **assignees** are `team_members` records (demo roster: Alice, Bob, Carol, David). They are separate from login **users**. Assigning a task to `alice@teamflow.demo` does not give that email a dashboard unless someone signed up with that email and was invited to the workspace.

## AI Planner

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/ai/chat` | Yes | `{ messages, context }` | Conversational planner; returns proposal when ready |
| POST | `/ai/apply` | Yes | `{ proposal }` | Create workspace, project, or task from reviewed proposal |

**Chat body:**
```json
{
  "messages": [{ "role": "user", "content": "Create a Backend API project" }],
  "context": {
    "page": "dashboard | workspace | project | task",
    "workspaceId": "optional",
    "projectId": "optional",
    "taskId": "optional"
  }
}
```

**Chat response:**
```json
{
  "success": true,
  "data": {
    "message": "What should the project be called?",
    "intent": "create_project",
    "status": "gathering | ready",
    "missingFields": ["project.name"],
    "proposal": null
  }
}
```

When `status` is `ready`, `proposal` includes the entity to create or update. User confirms via `/ai/apply`.

**`update_task`** — only from the task page context; `proposal.taskId` + partial `proposal.task` fields.

Requires `OPENAI_API_KEY` on the backend.

Full server architecture, file map, and apply flow: [ai-server.md](./ai-server.md). User flows and scenarios: [ai-flows.md](./ai-flows.md).

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | OK |
| 201 | Created |
| 400 | Validation / bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

## Swagger

Live docs: `{SERVER}/api-docs`

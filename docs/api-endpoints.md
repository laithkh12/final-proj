# TeamFlow API Endpoints

**Base URL:** `{SERVER}/api`  
**Auth:** `Authorization: Bearer <token>` or httpOnly cookie `token`

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
  "data": { "user": { "_id", "name", "email" }, "token": "jwt..." }
}
```

## Users

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| GET | `/users/me` | Yes | — |
| PATCH | `/users/me` | Yes | `{ name?, bio?, avatar? }` |

## Workspaces

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/workspaces` | Yes | List user workspaces |
| POST | `/workspaces` | Yes | Create workspace |
| GET | `/workspaces/:id` | Yes | Workspace + members + stats |
| PATCH | `/workspaces/:id` | Yes | Update workspace |
| DELETE | `/workspaces/:id` | Yes | Delete (owner only) |
| POST | `/workspaces/:id/members` | Yes | Invite `{ email, role? }` |
| DELETE | `/workspaces/:id/members/:userId` | Yes | Remove member (admin/owner) |
| GET | `/workspaces/:id/team-members` | Yes | List assignable team roster |
| GET | `/workspaces/:id/activity` | Yes | Activity log (paginated) |
| GET | `/workspaces/dashboard/stats` | Yes | Dashboard aggregates |

## Projects

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/projects` | Yes |
| POST | `/workspaces/:workspaceId/projects` | Yes |
| GET | `/projects/:id` | Yes |
| PATCH | `/projects/:id` | Yes |
| DELETE | `/projects/:id` | Yes |

## Tasks

| Method | Endpoint | Auth | Query |
|--------|----------|------|-------|
| GET | `/projects/:projectId/tasks` | Yes | `page`, `limit`, `status`, `priority`, `search` |
| POST | `/projects/:projectId/tasks` | Yes | body: task fields |
| GET | `/tasks/:id` | Yes | — |
| PATCH | `/tasks/:id` | Yes | body may include `assignee` (team member id in same workspace, or null) |
| DELETE | `/tasks/:id` | Yes | — |

## Comments

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/tasks/:taskId/comments` | Yes |
| POST | `/tasks/:taskId/comments` | Yes |
| DELETE | `/comments/:id` | Yes |

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

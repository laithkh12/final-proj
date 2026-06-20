# TeamFlow — System Specification

## 1. System Description

### What the project does

TeamFlow is a team project management platform that enables authenticated users to create **workspaces**, organize **projects**, manage **tasks** with statuses and priorities, collaborate via **comments**, and monitor team progress through an **activity log** and **dashboard**.

### Target audience

- Software development teams
- Student project groups
- Small startups and agencies
- Any group needing lightweight task tracking without enterprise complexity

### Problem it solves

Teams often scatter work across chat apps, spreadsheets, and ad-hoc tools. TeamFlow centralizes:

- Who is working on what (assignments, statuses)
- Where work lives (workspaces → projects → tasks)
- What changed (activity timeline)
- Who has access (roles: owner, admin, member)

### Access control (RBAC)

| Action | owner | admin | member |
|--------|-------|-------|--------|
| View workspace / project / task | ✅ | ✅ | ✅ |
| Create project / task | ✅ | ✅ | ✅ |
| Update task | ✅ | ✅ | ✅ |
| Edit / delete project | ✅ | ✅ | ❌ |
| Delete task | ✅ | ✅ | ❌ |
| Invite member | ✅ | ✅ | ❌ |
| Invite admin | ✅ | ❌ | ❌ |
| Remove member | ✅ | ✅* | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Delete own comment | ✅ | ✅ | ✅ |

\* Admins cannot remove the owner or themselves.

---

## 2. Mockups / Wireframes

See [wireframes.md](./wireframes.md) for ASCII wireframes of all primary screens.

---

## 3. ERD / Database Schema

See [erd.md](./erd.md) for the full entity-relationship diagram and field definitions.

**Entities:** User, Workspace, WorkspaceMember, TeamMember, Project, Task, Comment, ActivityLog

---

## 4. User Flow

See [user-flow.md](./user-flow.md) for journey diagrams (signup → workspace → project → task → comment).

---

## 5. API Endpoints Table

See [api-endpoints.md](./api-endpoints.md) for the complete REST API reference.

**Base URL:** `/api`

| Group | Count |
|-------|-------|
| Auth | 4 |
| Users | 2 |
| Workspaces | 10 |
| Projects | 5 |
| Tasks | 5 |
| Comments | 3 |
| Activity | 1 |

---

## 6. Technical Architecture

```
┌─────────────┐     HTTPS/REST      ┌─────────────┐     Mongoose     ┌──────────────┐
│  Next.js    │ ◄─────────────────► │   Express   │ ◄──────────────► │ MongoDB      │
│  (Vercel)   │     JWT + JSON      │   (Render)  │                  │ Atlas        │
└─────────────┘                     └─────────────┘                  └──────────────┘
```

### Layers (Backend)

- **Routes** — HTTP mapping
- **Controllers** — Request/response handling
- **Services** — Business logic (access control, activity logging)
- **Models** — Mongoose schemas
- **Middleware** — Auth, validation, errors, logging

### Layers (Frontend)

- **Pages** — App Router routes
- **Components** — Reusable UI
- **Services** — Axios API clients
- **Stores** — Zustand (auth, theme, notifications, workspace context)
- **TanStack Query** — Server state cache

---

## 7. Non-Functional Requirements

| Requirement | Implementation |
|-------------|----------------|
| Security | bcrypt passwords, JWT, helmet, CORS |
| Performance | Query cache, debounce, pagination, memo |
| Responsiveness | Tailwind mobile-first layouts |
| Documentation | Swagger, Postman, docs folder |
| Deployment | Vercel + Render + Atlas |

---

## 8. Bonus Requirements Coverage

| Bonus | Status |
|-------|--------|
| TypeScript (full stack) | ✅ |
| Global state (Zustand) | ✅ |
| Performance (5 techniques) | ✅ |
| Authentication | ✅ Custom JWT + bcrypt |
| API documentation | ✅ Swagger + Postman + README |

---

## 9. Team roster (assignees)

Task assignees reference the **`team_members`** collection (not login `users`). Each new workspace is auto-seeded with four demo members:

| Name | Email | Role label |
|------|-------|------------|
| Alice Chen | `alice@teamflow.demo` | Frontend developer |
| Bob Martinez | `bob@teamflow.demo` | Backend developer |
| Carol Nguyen | `carol@teamflow.demo` | Product designer |
| David Kim | `david@teamflow.demo` | QA engineer |

These emails are **roster labels for assignment only**. They do not create login accounts. To collaborate in the app, invite a real signed-up user by email via **Workspace → Invite member**.

Legacy workspaces missing the demo roster are backfilled when `GET /workspaces/:id/team-members` is called.

Custom team members beyond the seed roster are **not** managed via the app UI in this version; use `npm run seed:team-members` or extend the API for production use.

### Data cleanup scripts

```bash
cd backend
npm run seed:team-members      # seed demo roster on all workspaces
npm run migrate:task-assignees # map old User assignees → TeamMember by email, then clear invalid refs
```

Deleting a project, task, or workspace cascades to related comments (with optional MongoDB transactions when supported).

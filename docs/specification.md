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

---

## 2. Mockups / Wireframes

See [wireframes.md](./wireframes.md) for ASCII wireframes of all primary screens.

---

## 3. ERD / Database Schema

See [erd.md](./erd.md) for the full entity-relationship diagram and field definitions.

**Entities:** User, Workspace, WorkspaceMember, Project, Task, Comment, ActivityLog

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
| Workspaces | 7 |
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

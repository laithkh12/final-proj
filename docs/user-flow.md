# TeamFlow — User Flow

## Primary Journey

```mermaid
flowchart TD
    A[Landing Page /] --> B{Authenticated?}
    B -->|No| C[Login / Signup]
    B -->|Yes| D[Dashboard]
    C --> D
    D --> E[Workspaces List]
    E --> F[Create Workspace]
    E --> G[Workspace Detail]
    G --> H[Create Project]
    G --> I[Invite Member]
    H --> J[Project Page]
    J --> K[Create / Filter Tasks]
    K --> L[Task Detail]
    L --> M[Add Comments]
    D --> N[Profile Edit]
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as MongoDB

    U->>F: Submit signup form
    F->>A: POST /api/auth/signup
    A->>DB: Create user (bcrypt hash)
    A->>F: JWT + user JSON
    F->>F: Store token (localStorage + Zustand)
    F->>U: Redirect to /dashboard

    U->>F: Protected route access
    F->>A: GET /api/auth/me (Bearer token)
    A->>F: User profile
```

## Workspace Collaboration Flow

1. User creates workspace → becomes **owner** + WorkspaceMember record
2. Owner/admin invites member by email → member must exist in system
3. Members create projects within workspace
4. Tasks inherit `workspace` reference for access checks and activity logs

## Task Lifecycle

```
Todo → In Progress → Review → Done
```

Priorities: Low, Medium, High, Urgent

Each create/update/delete logs an ActivityLog entry visible on workspace timeline.

## Error Paths

| Scenario | UX |
|----------|-----|
| Invalid login | Alert on login form |
| 401 expired token | Redirect to /login |
| No workspaces | Empty state + CTA |
| Invite unknown email | Toast error "User must sign up first" |

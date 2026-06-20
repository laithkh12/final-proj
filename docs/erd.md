# TeamFlow — Database ERD

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : "belongs to"
    User ||--o{ Workspace : "owns"
    Workspace ||--o{ WorkspaceMember : "has"
    Workspace ||--o{ TeamMember : "has roster"
    Workspace ||--o{ Project : "contains"
    Workspace ||--o{ Task : "scopes"
    Workspace ||--o{ ActivityLog : "logs"
    Project ||--o{ Task : "has"
    TeamMember ||--o{ Task : "assigned to"
    User ||--o{ Task : "creates"
    Task ||--o{ Comment : "has"
    User ||--o{ Comment : "writes"
    User ||--o{ ActivityLog : "performs"

    User {
        ObjectId _id PK
        string name
        string email UK
        string password
        string avatar
        string bio
        date createdAt
        date updatedAt
    }

    Workspace {
        ObjectId _id PK
        string name
        string description
        string slug UK
        ObjectId owner FK
        date createdAt
        date updatedAt
    }

    WorkspaceMember {
        ObjectId _id PK
        ObjectId workspace FK
        ObjectId user FK
        string role
        ObjectId invitedBy FK
        date createdAt
    }

    TeamMember {
        ObjectId _id PK
        string name
        string email
        string role
        string avatar
        ObjectId workspace FK
        date createdAt
    }

    Project {
        ObjectId _id PK
        string name
        string description
        ObjectId workspace FK
        ObjectId createdBy FK
        string color
        date createdAt
    }

    Task {
        ObjectId _id PK
        string title
        string description
        ObjectId project FK
        ObjectId workspace FK
        string status
        string priority
        ObjectId assignee FK
        ObjectId createdBy FK
        date dueDate
        date createdAt
    }

    Comment {
        ObjectId _id PK
        string content
        ObjectId task FK
        ObjectId author FK
        date createdAt
    }

    ActivityLog {
        ObjectId _id PK
        ObjectId workspace FK
        ObjectId user FK
        string type
        string message
        string entityType
        ObjectId entityId
        date createdAt
    }
```

## Collections

| MongoDB collection | Model | Purpose |
|--------------------|-------|---------|
| `users` | User | Login accounts |
| `workspaces` | Workspace | Teams |
| `workspacemembers` | WorkspaceMember | App user access + roles |
| `team_members` | TeamMember | Assignable roster per workspace |
| `projects` | Project | Projects |
| `tasks` | Task | Tasks (`assignee` → TeamMember) |
| `comments` | Comment | Task comments |
| `activitylogs` | ActivityLog | Audit trail |

## Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| User | email (unique) | Login lookup |
| Workspace | slug (unique), owner | Routing |
| WorkspaceMember | workspace + user (unique) | Membership |
| TeamMember | workspace + email (unique) | Roster per workspace |
| Task | project + status, text(title, description) | Filters & search |
| ActivityLog | workspace + createdAt | Timeline |

## Relations Summary

- **User → Workspace**: one-to-many (owner)
- **User ↔ Workspace**: many-to-many via WorkspaceMember (auth access)
- **Workspace → TeamMember**: one-to-many (task assignee roster)
- **Workspace → Project**: one-to-many
- **Project → Task**: one-to-many
- **TeamMember → Task**: one-to-many (assignee)
- **Task → Comment**: one-to-many
- **Workspace → ActivityLog**: one-to-many

## Migrations

After changing task assignee from User to TeamMember, run:

```bash
cd backend
npm run migrate:task-assignees
```

This clears assignees that are not valid `team_members` in the same workspace.

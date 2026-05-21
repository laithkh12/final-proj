# TeamFlow — Database ERD

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : "belongs to"
    User ||--o{ Workspace : "owns"
    Workspace ||--o{ WorkspaceMember : "has"
    Workspace ||--o{ Project : "contains"
    Workspace ||--o{ Task : "scopes"
    Workspace ||--o{ ActivityLog : "logs"
    Project ||--o{ Task : "has"
    User ||--o{ Task : "assigns"
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

## Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| User | email (unique) | Login lookup |
| Workspace | slug (unique), owner | Routing |
| WorkspaceMember | workspace + user (unique) | Membership |
| Task | project + status, text(title, description) | Filters & search |
| ActivityLog | workspace + createdAt | Timeline |

## Relations Summary

- **User → Workspace**: one-to-many (owner)
- **User ↔ Workspace**: many-to-many via WorkspaceMember
- **Workspace → Project**: one-to-many
- **Project → Task**: one-to-many
- **Task → Comment**: one-to-many
- **Workspace → ActivityLog**: one-to-many

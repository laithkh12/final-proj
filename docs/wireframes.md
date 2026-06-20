# TeamFlow — Wireframes

ASCII wireframes for initial screen planning.

## Landing `/`

```
┌────────────────────────────────────────────────────────┐
│  TeamFlow                    [Sign in]  [Get started]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│         Team project management, simplified            │
│              [Start free]  [Sign in]                   │
│                                                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Workspaces│  │  Tasks   │  │ Activity │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└────────────────────────────────────────────────────────┘
```

## Login `/login`

```
┌─────────────────────┐
│ TeamFlow            │
│ Welcome back        │
│ [Email          ]   │
│ [Password       ]   │
│ [ Sign in      ]    │
│ Don't have account? │
│      Sign up        │
└─────────────────────┘
```

## Dashboard `/dashboard`

```
┌────────────────────────────────────────────────────────┐
│ Navbar: TeamFlow | theme | profile | logout            │
├────────┬───────────────────────────────────────────────┤
│Sidebar │ Dashboard                                     │
│ Dash   │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│ Work-  │ │ WS │ │Proj│ │Task│ │Done│                   │
│ spaces │ └────┘ └────┘ └────┘ └────┘                   │
│        │ Tasks by status    │ Recent activity          │
└────────┴───────────────────────────────────────────────┘
```

## Workspaces `/workspaces`

```
┌──────────────────────────────────────────┐
│ Workspaces          [+ New workspace]    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ │ Team A  │ │ Team B  │ │  ...    │      │
│ └─────────┘ └─────────┘ └─────────┘      │
└──────────────────────────────────────────┘
```

## Workspace Detail `/workspaces/[id]`

```
┌────────────────────────────────────────────────────────┐
│ Engineering Team          [Invite] [New project]       │
│ 3 projects · 24 tasks · 5 members                      │
├──────────────────────────────┬─────────────────────────┤
│ Projects                     │ Members                  │
│ ┌──────────┐ ┌──────────┐    │ • Alice (owner)          │
│ │ Sprint 1 │ │ Website  │    │ • Bob (member)           │
│ └──────────┘ └──────────┘    │ Activity feed...       │
└──────────────────────────────┴─────────────────────────┘
```

## Project `/projects/[id]`

```
┌────────────────────────────────────────────────────────┐
│ ← Workspace    Sprint 1    [Edit] [Delete] [+ New task]│
│              (Edit/Delete shown for admin/owner only)  │
│ [Search...........] [Status ▼] [Priority ▼]            │
├────────────────────────────────────────────────────────┤
│ Title      │ Status │ Priority │ Assignee │ Due        │
│ Fix login  │ Todo   │ High     │ Alice    │ May 25     │
│ API docs   │ Done   │ Low      │ —        │ —          │
│              [Prev] Page 1 of 3 [Next]                 │
└────────────────────────────────────────────────────────┘
```

## Task Detail `/tasks/[id]`

```
┌────────────────────────────────────────────────────────┐
│ ← Project                         [Delete task]        │
│                                   (admin/owner only)   │
│ Fix login bug                                          │
│ Status [▼]  Priority [▼]  Assignee [▼]  Due [date]     │
│                                                        │
│ Comments (3)                                           │
│ [Add comment........................] [Post]           │
│ ┌────────────────────────────────────┐               │
│ │ Bob: Checked JWT middleware   [🗑]  │               │
│ └────────────────────────────────────┘               │
│              (delete icon on own comments only)        │
└────────────────────────────────────────────────────────┘
```

## Profile `/profile`

```
┌─────────────────────┐
│ Profile             │
│  (A) Alice          │
│  alice@email.com    │
│  Name [          ]  │
│  Bio  [          ]  │
│  [ Save changes ]   │
└─────────────────────┘
```

## Mobile

- Sidebar collapses; navbar shows hamburger or bottom nav pattern
- Tables scroll horizontally
- Cards stack vertically

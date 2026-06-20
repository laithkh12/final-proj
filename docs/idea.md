# TeamFlow — Team Project Management Platform

A fullstack platform where teams can create workspaces, organize projects, manage tasks, track progress, and collaborate through comments and activity logs.

## What it does

TeamFlow gives small teams one place to organize their work. After signing in, a user can open a **workspace**, create **projects** inside it, and add **tasks** with status and priority. From the project page they can search and filter tasks, change status, and open a task to set or clear a due date, pick an **assignee** from the workspace team roster, and read or post **comments**. A **dashboard** shows totals across workspaces the user belongs to, and each workspace page shows members, project cards, and a recent **activity** feed.

TeamFlow is intended for student groups and small teams that want lightweight task tracking in the browser.

## Main features

- **Authentication** — Register, log in, log out; edit name and bio on the profile page
- **Workspaces** — List workspaces, create a new one, open a workspace to see stats, members, and activity
- **Members** — Invite a signed-up user by email; roles are owner, admin, or member (only the owner can invite admins)
- **Team roster** — Four demo assignees per workspace (Alice, Bob, Carol, David); used for task assignment, not for login
- **Projects** — Create a project in a workspace; **admin/owner** can edit or delete it
- **Tasks** — Create tasks; list with search, filters, and pagination; any member can update; **admin/owner** can delete
- **Comments** — Add comments on a task; delete your own comments
- **Dashboard** — Workspace, project, and task counts for workspaces you belong to; tasks grouped by status; recent activity
- **UI** — Responsive layout with sidebar navigation, light/dark theme, role-aware action buttons, loading and empty states

## Assignees vs login users

Assigning a task to **Alice Chen** (`alice@teamflow.demo`) marks the task in the UI — it does **not** give that email access to the app. To see the dashboard as a collaborator, that person must sign up with their own account and be **invited** to the workspace.

## Technology

**Next.js** and **React** on the frontend, **Express** and **Mongoose** on the backend, **MongoDB** for storage, **JWT** (with login cookie) for authentication. API documentation is available via **Swagger** at `/api-docs`.

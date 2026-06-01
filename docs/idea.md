# TeamFlow — Team Project Management Platform

A fullstack platform where teams can create workspaces, organize projects, manage tasks, track progress, and collaborate through comments and activity logs.

## What it does

TeamFlow gives small teams one place to organize their work. After signing in, a user can open a **workspace**, create **projects** inside it, and add **tasks** with status and priority. From the project page they can search and filter tasks, change status, and open a task to set a due date or read and post **comments**. A **dashboard** shows totals across their workspaces, and each workspace page shows members, project cards, and a recent **activity** feed.

TeamFlow is intended for student groups and small teams that want lightweight task tracking in the browser.

## Main features

- **Authentication** — Register, log in, log out; edit name and bio on the profile page
- **Workspaces** — List workspaces, create a new one, open a workspace to see stats, members, and activity
- **Members** — Invite someone by email (they must already have a TeamFlow account); roles are owner, admin, or member
- **Projects** — Create a project in a workspace and open it to work on its tasks
- **Tasks** — Create tasks (title and priority); list with search, status/priority filters, and pagination; change status from the table or task page; set due date on the task detail page
- **Comments** — Add comments on a task; delete your own comments
- **Dashboard** — Workspace, project, and task counts; tasks grouped by status; recent activity across your workspaces
- **UI** — Responsive layout with sidebar navigation, light/dark theme, loading and empty states

## Technology

**Next.js** and **React** on the frontend, **Express** and **Mongoose** on the backend, **MongoDB** for storage, **JWT** (with login cookie) for authentication. API documentation is available via **Swagger** at `/api-docs`.

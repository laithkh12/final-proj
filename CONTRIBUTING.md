# Contributing to TeamFlow

This project is designed for **pair development** on GitHub as required by the Fullstack Development final project.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, deployable code |
| `develop` | Optional integration branch |
| `feature/<name>` | New features per developer |
| `fix/<name>` | Bug fixes |

### Examples

```
feature/workspace-invite
feature/task-pagination
fix/login-redirect
```

## Workflow

1. **Clone** the repository and add your partner as collaborator on GitHub.
2. **Pull** latest `main` before starting work.
3. **Create** a feature branch: `git checkout -b feature/your-feature`
4. **Commit** often with clear messages:
   - `feat: add workspace invite endpoint`
   - `fix: task pagination meta`
   - `docs: update API endpoints table`
5. **Push** and open a **Pull Request** to `main`.
6. Partner **reviews** and approves (at least one PR merged during the project).
7. **Merge** via GitHub (squash or merge commit — team choice).

## Commit Message Format

```
<type>: <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Code Standards

- TypeScript strict mode — avoid `any`
- Run `npm run build` in `backend` and `frontend` before PR
- Keep backend logic in services, not routes
- Use TanStack Query for server state on frontend

## Folder Ownership (Suggested Split)

| Partner A | Partner B |
|-----------|-----------|
| Backend API + models | Frontend pages + components |
| Auth + middleware | Zustand stores + API services |
| Swagger + Postman | Docs + deployment |

Swap or overlap as needed — both must have meaningful commit history.

## Pull Request Checklist

- [ ] Builds pass locally
- [ ] No secrets in commits (`.env` gitignored)
- [ ] README/docs updated if API changed
- [ ] Tested end-to-end on localhost

## Environment

Never commit `.env` files. Use `.env.example` as reference.

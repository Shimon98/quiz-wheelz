# Branching and Git Workflow

## Branches

Recommended branches:

```text
main       -> stable only
develop    -> integration branch for ongoing work
feature/*  -> one branch per issue
bugfix/*   -> small fixes
```

Do not work directly on `main`.

## Daily Workflow

Before starting work:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-XX-short-name
```

During work:

```bash
git status
git add <files>
git commit -m "short clear message"
```

Before opening PR:

```bash
git checkout develop
git pull origin develop
git checkout feature/issue-XX-short-name
git merge develop
```

Then test locally and push:

```bash
git push origin feature/issue-XX-short-name
```

## PR Rules

Each PR should include:

- What changed.
- Why it changed.
- How to test.
- Screenshots if UI changed.
- Tests added or missing.

## Review Rule

The person who did not write the PR reviews it.

This is important because both team members want to learn Fullstack, not only frontend or backend.

## Commit Message Examples

```text
docs: add stage a planning files
feat(auth): add jwt cookie service
feat(client): add teacher login page
feat(race): add race entity and room code service
test(auth): add jwt service tests
fix(cors): allow credentials for local client
```

## Working with AI Agents

Use small tasks.

Bad prompt:

```text
Build the login system.
```

Good prompt:

```text
Read AGENTS.md first.
Current issue: feature/issue-03-jwt-cookie-auth.
Goal: implement JwtService and CookieUtils only.
Before modifying files, inspect the project, run git status, explain the plan, and list expected changed files.
```

## Handling Conflicts

If both people need to edit central files like:

- `AppRoutes.jsx`
- `SecurityConfig.java`
- `apiClient.js`
- `DataInitializer.java`

Coordinate before starting and keep PRs small.

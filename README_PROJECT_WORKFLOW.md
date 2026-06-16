# Quiz Wheelz — Project Workflow Notes

This file is a short starting guide for Shimon, Diana, and AI coding agents.

## First Setup

Copy these files into the root of the project:

```text
AGENTS.md
.env.example
README_PROJECT_WORKFLOW.md
docs/
```

Do not commit real `.env` files with secrets.

## Recommended First Commit

```bash
git add AGENTS.md docs .env.example README_PROJECT_WORKFLOW.md
git commit -m "docs: add project workflow and stage a planning"
git push
```

## Recommended Branch Setup

If `develop` does not exist yet:

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

## Working on an Issue

Example:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-01-user-role-model
```

Work, test, commit:

```bash
git status
git add <files>
git commit -m "feat(auth): add user role model"
git push -u origin feature/issue-01-user-role-model
```

Open PR into `develop`.

## Prompt for Copilot / Codex / ChatGPT

Use this at the start of every coding task:

```text
Read AGENTS.md first and follow it strictly.
Read docs/STAGE_A_PLAN.md and docs/ISSUES.md.

Current issue:
feature/issue-XX-name

Goal:
[write the exact goal]

Before modifying files:
1. Run git status.
2. Inspect the relevant project structure.
3. Explain your plan.
4. List expected changed files.
5. Wait for my approval.

Important:
- Do not touch unrelated files.
- Do not hardcode Math.
- Server is the source of truth.
- Keep business logic in services.
- Add tests for new backend logic when possible.
```

## Tracking Work by Shimon and Diana

Use `docs/ISSUES.md` and update:

```text
Owner: Shimon / Diana
Status: TODO / IN_PROGRESS / REVIEW / DONE / BLOCKED
```

Also write short notes under each issue if needed:

```md
### Notes
- 2026-06-16 Shimon: created User entity, waiting for review.
- 2026-06-16 Diana: reviewed, asked to rename field.
```

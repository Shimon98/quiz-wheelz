# QuizWheelz — Project Workflow

This is the short entry point for human developers and AI coding agents.

## Before starting

```bash
git switch main
git pull
git status
```

Read:

```text
AGENTS.md
docs/README.md
docs/00-project/CURRENT_STATE.md
docs/00-project/MASTER_IMPLEMENTATION_ROADMAP.md
```

Then read the relevant track:

```text
Server work:
docs/01-server/SERVER_IMPLEMENTATION_PLAN.md
docs/01-server/SERVER_RULES_AND_CONVENTIONS.md

Client work:
docs/02-client/CLIENT_IMPLEMENTATION_PLAN.md
docs/02-client/CLIENT_RULES_AND_CONVENTIONS.md
```

## Create one focused branch

```bash
git switch -c feature/<short-task-name>
```

Use `fix/`, `chore/`, or `docs/` when that better describes the work.

## Before code

1. State the exact goal.
2. Verify current status from code, not old issue numbers.
3. Search for existing owners and reusable code.
4. Confirm the API contract.
5. List expected files.
6. Identify tests and manual QA.
7. Keep unrelated refactors out.

## During work

```text
One responsibility per file.
One owner per constant.
No hardcoded user text.
No invented endpoint.
No client-owned game rule.
No DB-only or cache-only shortcut that violates the architecture.
```

## Verify

Client:

```bash
cd client
npm run lint
npm run build
```

Server:

```bash
cd server
./mvnw clean test
```

Windows:

```powershell
.\mvnw.cmd clean test
```

## Pull request

The PR must include:

- Goal and why.
- What changed.
- What did not change.
- API/DB/security notes.
- Tests run.
- Manual demo flow.
- Known follow-ups.
- Canonical documentation updates, when status or decisions changed.

Use the issue/PR template in:

```text
docs/03-quality/ISSUE_PR_AND_AI_WORKFLOW.md
```

# Issue, Pull Request and AI Workflow

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the standard task template, branch/PR process and safe use of ChatGPT, Claude and Codex

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## One-task rule

```text
One goal
→ one branch
→ one primary file ownership area
→ one implementation agent
→ one PR
```

Other agents may review, test or challenge the plan, but should not concurrently edit
the same files.

## Issue template

```md
# <ID> — <Title>

Status: TODO | IN_PROGRESS | REVIEW | DONE | BLOCKED
Area: server | client | shared | docs
Depends on:
Blocks:
Contract owner:
Branch:

## Goal

## Why

## Current verified state

## Scope

## Out of scope

## Reuse/library-first findings

## Contract

## Expected files

## Validation and security

## Tests and manual QA

## Definition of done

## Demo flow

## Decisions/notes
```

## AI task prompt

```text
Read AGENTS.md and docs/README.md first.
Read the relevant current-state, rules and implementation-plan documents.

Task:
[exact task ID and goal]

Before editing:
1. Run git status and identify the current branch.
2. Verify the implementation from actual code.
3. Search for reusable components/services/constants/mappers/tests.
4. Check whether an installed library already owns the problem.
5. State the contract and dependencies.
6. Propose a small implementation plan.
7. List expected changed files.
8. Wait for approval.

Rules:
- Do not touch unrelated files.
- Do not invent endpoints or fields.
- Do not create fake success or placeholder production behavior.
- Keep the server authoritative.
- Keep controllers/pages thin.
- Put text in i18n and values in their canonical config owner.
- Add or update tests.
- Run the relevant verification commands.
```

## Branch workflow

```bash
git switch main
git pull
git switch -c feature/<task>
```

Use `fix/`, `chore/`, or `docs/` where appropriate.

Do not revive the old assumption that every task must target `develop`. The current
repository's active integration flow is `main`; change that only through a documented
team decision.

## Commit guidance

Use clear scoped messages:

```text
feat(student-race): wire runtime snapshot bootstrap
fix(runtime): fall back to durable lastSeenAt
fix(dev): restore local mysql and auto-start redis
docs: replace legacy planning documents
test(race-engine): cover finish tie behavior
```

## Pull request template

```md
## Goal

## What changed

## Contract/API/DB changes

## Security and ownership

## Reuse/library decisions

## Tests run

## Manual demo

## Screens/responsive checks

## Out of scope

## Follow-ups

## Documentation updated
```

## Review order

1. contract and security
2. domain correctness
3. architecture/ownership
4. tests
5. UI/UX/accessibility
6. cleanup
7. documentation status.

## Documentation update rule

When a PR changes implementation status:

- update the detailed server/client plan task
- update `CURRENT_STATE.md` only if the product-level status changed
- update architecture only for a real contract/decision
- never add a new overlapping plan file.

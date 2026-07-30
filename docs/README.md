# QuizWheelz Documentation Index

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the canonical documentation map and reading order

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Read this first

The previous documentation was split across Stage A, Stage B, client-design,
archive files, issue files and source-folder READMEs. Those files described
different moments in time and frequently duplicated or contradicted one another.

This directory is the replacement. Do not recreate the old structure.

## Status vocabulary

| Status | Meaning |
|---|---|
| `DONE` | Implemented and integrated on the audited code baseline. |
| `PARTIAL` | Useful implementation exists, but the end-to-end feature is incomplete. |
| `PLANNED` | Agreed work that has not been implemented. |
| `REQUIRED LATER` | Required for final product/lecturer compliance, deliberately after the playable loop. |
| `VERIFY LOCALLY` | Work may exist only on an unpushed/local branch. |
| `DEFERRED` | Valid idea, not part of the current ordered roadmap. |

## Canonical documents

### Project-wide

- `00-project/CURRENT_STATE.md` — what actually exists now.
- `00-project/REQUIREMENTS_AND_SCOPE.md` — lecturer/product requirements and traceability.
- `00-project/ARCHITECTURE_AND_CONTRACTS.md` — how client, server, DB, Redis and live updates connect.
- `00-project/MASTER_IMPLEMENTATION_ROADMAP.md` — the only cross-team work order.

### Server

- `01-server/SERVER_CURRENT_STATE.md`
- `01-server/SERVER_RULES_AND_CONVENTIONS.md`
- `01-server/SERVER_IMPLEMENTATION_PLAN.md`
- `01-server/AUTH_REGISTRATION_AND_2FA.md`
- `01-server/DEV_INFRA_MYSQL_REDIS.md`

### Client

- `02-client/CLIENT_CURRENT_STATE.md`
- `02-client/CLIENT_RULES_AND_CONVENTIONS.md`
- `02-client/CLIENT_IMPLEMENTATION_PLAN.md`
- `02-client/UI_DESIGN_SYSTEM.md`
- `02-client/STUDENT_RACE_SCREEN_AND_ASSETS.md`

### Quality and workflow

- `03-quality/TESTING_AND_DEFINITION_OF_DONE.md`
- `03-quality/ISSUE_PR_AND_AI_WORKFLOW.md`

### Documentation maintenance

- `04-maintenance/DOCUMENTATION_POLICY_AND_REPLACEMENT.md`
- `04-maintenance/LEGACY_CONTENT_MERGE_MAP.md`

## Source-of-truth rule

```text
Actual implementation status → code and tests
Agreed design/work order     → these canonical documents
Historical reasoning         → Git history and closed PRs
Personal visual references   → local docs/vision, not canonical and not committed
```

Do not add a new planning document when an existing canonical owner can be updated.

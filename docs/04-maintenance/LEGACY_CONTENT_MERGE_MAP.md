# Legacy Content Merge Map

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** which old documentation families are deleted and where their useful content now lives

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Delete the old docs tree

The replacement intentionally deletes all tracked files under the old `docs/`.
Useful rules were merged into the canonical owners below.

| Old family | New owner |
|---|---|
| `docs/client-design/01_*` | `02-client/UI_DESIGN_SYSTEM.md`, `00-project/REQUIREMENTS_AND_SCOPE.md` |
| `docs/client-design/02_*` | `02-client/CLIENT_RULES_AND_CONVENTIONS.md` |
| `docs/client-design/03_*` | `02-client/UI_DESIGN_SYSTEM.md`, client rules |
| `docs/client-design/04_*` | `02-client/CLIENT_IMPLEMENTATION_PLAN.md`, master roadmap |
| `docs/client-design/05_*` | client current state/rules |
| `docs/client-design/06_*` | `02-client/STUDENT_RACE_SCREEN_AND_ASSETS.md` |
| `docs/STAGE_A/*` | current state, server/client rules, workflow, Git history |
| `docs/STAGE_B/*` | current state, architecture, server/client implementation plans |
| `docs/stage-b-issues/*` | detailed implementation plans and closed PR history |
| `docs/STAGE_B_PLAN.md` | requirements, architecture, master roadmap |
| `docs/STAGE_B_ISSUES*.md` | current state and implementation plans |
| `docs/STAGE_B_ARCHITECTURE_DECISIONS.md` | architecture and rules |
| `docs/STAGE_B_TESTING_QA.md` | testing/definition of done |
| `docs/STAGE_B_AI_WORK_PROMPT.md` | issue/PR/AI workflow |
| `docs/ISSUE_TEMPLATE_PRODUCTION_READY.md` | issue/PR/AI workflow |
| `docs/SERVER_AUTH_FUTURE_PLAN.md` | `01-server/AUTH_REGISTRATION_AND_2FA.md` |
| `docs/archive/*` | Git history; no active archive folder needed |
| old Stage A/Stage B PDFs and idea docs | requirements, architecture and roadmap |
| `client/src/features/studentRace/README.md` | student race/assets + client rules |
| `client/src/assets/game/studentRace/README.md` | student race/assets |

## Information deliberately not preserved as active instructions

- stale TODO statuses for already merged work
- old Tailwind/shadcn-first direction
- “Mantine rejected” decisions
- plans to delay PixiJS that are already obsolete
- old `develop`-only branch assumption
- deprecated asset folder names
- duplicate endpoint examples
- temporary mock/placeholder issue descriptions
- local personal scheduling and unrelated study/work planning.

## Historical access

Deleted documentation remains available through Git history and merged pull requests.
Do not keep active copies solely for history.

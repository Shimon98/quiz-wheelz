# Documentation Policy and Replacement Procedure

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** how canonical docs are maintained and how the legacy tree is removed safely

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Policy

The repository should have a small canonical documentation tree. Historical task
descriptions belong in Git history and closed PRs, not in dozens of active Markdown
files.

## Allowed documentation locations

```text
AGENTS.md
README_PROJECT_WORKFLOW.md
docs/
```

Source-folder READMEs are disallowed when they duplicate project architecture or
planning. A source-folder README is allowed only for a narrow file-format/generated
artifact contract that cannot be understood from canonical docs; the studentRace
READMEs no longer qualify because their content is merged here.

## Canonical-owner rule

Update an existing owner:

```text
status           → CURRENT_STATE
cross-team order → MASTER_IMPLEMENTATION_ROADMAP
server detail    → SERVER_IMPLEMENTATION_PLAN
client detail    → CLIENT_IMPLEMENTATION_PLAN
UI               → UI_DESIGN_SYSTEM
game rendering   → STUDENT_RACE_SCREEN_AND_ASSETS
workflow         → ISSUE_PR_AND_AI_WORKFLOW
```

Do not create `PLAN_V2`, `LATEST_PLAN`, `NOTES_NEW` or another issue archive.

## Replacement procedure

1. Commit or stash all local work.
2. Back up local `docs/vision/`.
3. Delete the old tracked `docs/` tree.
4. Paste the new `docs/`.
5. Replace root `AGENTS.md`.
6. Replace root `README_PROJECT_WORKFLOW.md`.
7. Delete:

```text
client/src/features/studentRace/README.md
client/src/assets/game/studentRace/README.md
```

8. Search stale links.
9. Run client/server checks.
10. Review deletion diff before commit.

## Local vision folder

`docs/vision/` is a private visual scratch area and is not part of the new canonical
tree. Keep it outside the replacement while deleting/pasting, then restore it locally
if needed. Do not link canonical documentation to uncommitted vision files.

## Audit cadence

At the close of each roadmap phase:

- verify code against current-state tables
- mark completed tasks
- remove stale “blocked” notes
- verify endpoints/routes
- verify package/dependency decisions
- do not rewrite history.

## Documentation PR rule

The initial replacement is a docs-only PR. Do not mix it with Redis, database,
student race or auth code. Subsequent feature PRs update only the canonical documents
they materially affect.

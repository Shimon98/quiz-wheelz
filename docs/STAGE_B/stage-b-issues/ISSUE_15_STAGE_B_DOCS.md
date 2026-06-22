# Issue 15 — Stage B Planning and Documentation

Owner: TBD  
Status: TODO  
Branch: `feature/issue-15-stage-b-planning`

## Goal

Update the project planning documents so Stage B becomes the official next phase: a production-ready core race loop.

## Why This Issue Exists

The current project docs were written for Stage A. Stage B introduces real gameplay, student flow, generated questions, answer validation, scoring, race progress and live state. The team needs clear planning before writing code so the domain model does not require repeated refactors.

## Scope

- Add/update Stage B planning documents.
- Add issue breakdown for Stage B.
- Add architecture decisions for RacePlayer, questions, caching, student session, race state and visual rendering.
- Add testing/QA expectations.
- Update AI workflow prompt.

## Out of Scope

- No backend implementation.
- No frontend implementation.
- No entity/controller/service code.

## Reuse-First Checklist

Before editing docs, inspect existing docs and keep useful content instead of rewriting everything.
Reuse the existing documentation style where possible.

## Planning Notes

The docs should explain:

- Stage B is not a temporary/basic phase.
- Features must be implemented as production-ready slices.
- `RacePlayer` is the single main participant concept.
- Questions are generated on demand and persisted before being sent.
- Cache is an optimization layer, not the only source of truth.
- The client never receives the correct answer.
- Frontend visuals render server state and do not own game logic.
- Existing components/constants/styles must be reused before creating new ones.

## Definition of Done

- Stage B plan exists.
- Stage B issues are listed.
- Architecture decisions are documented.
- Testing/QA plan exists.
- AI work prompt is updated.
- Existing Stage A docs remain useful as history.

## Demo Flow

Reviewer can open the docs and understand exactly what Stage B includes, what it excludes, and how to start Issue 16.

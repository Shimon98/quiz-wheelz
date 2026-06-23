# Stage B Issues — Production-Ready Core Race Loop

This file tracks the Stage B work.
Each issue should be completed as a production-ready slice, not as a temporary placeholder.

Status options:

```text
TODO
IN_PROGRESS
REVIEW
DONE
BLOCKED
```

## Stage B Issue List

| Issue | Title | Main Area | Status |
|---|---|---|---|
| 15 | Stage B planning and documentation | Docs | DONE |
| 16 | RacePlayer domain | Backend domain | DONE |
| 17 | Student join API and session | Backend API/auth | DONE |
| 18 | Student join page | Frontend mobile UI | TODO |
| 19 | Teacher waiting room real participants | Backend + Frontend | TODO |
| 20 | Start race flow | Backend + Frontend | TODO |
| 21 | Question generation system | Backend logic | TODO |
| 22 | Player question delivery | Backend API | TODO |
| 23 | Answer validation and submission | Backend API/logic | TODO |
| 24 | Scoring and race engine | Backend game logic | TODO |
| 25 | Student race page | Frontend mobile UI | TODO |
| 26 | Teacher race live page | Frontend + Backend state | TODO |
| 27 | Race SSE stream | Backend + Frontend live updates | TODO |
| 28 | Stage B integration and QA | Full flow | TODO |

## Required Issue Standard

Each issue should include:

- Goal.
- Why this issue exists.
- Scope.
- Out of scope.
- Planning notes.
- Reuse-first checklist.
- Backend considerations where relevant.
- Frontend considerations where relevant.
- Testing/QA.
- Definition of Done.
- Demo flow.

See `docs/ISSUE_TEMPLATE_PRODUCTION_READY.md`.

## Suggested Branch Naming

```text
feature/issue-15-stage-b-planning
feature/issue-16-race-player-domain
feature/issue-17-student-join-api
feature/issue-18-student-join-page
feature/issue-19-waiting-room-real-participants
feature/issue-20-start-race-flow
feature/issue-21-question-generation-system
feature/issue-22-player-question-delivery
feature/issue-23-answer-validation-submission
feature/issue-24-scoring-race-engine
feature/issue-25-student-race-page
feature/issue-26-teacher-race-live-page
feature/issue-27-race-sse-stream
feature/issue-28-stage-b-integration-qa
```

## Stage B Closing Rule

Stage B is not done when each page “renders”.
Stage B is done when the real race loop works end-to-end and the server remains the source of truth.

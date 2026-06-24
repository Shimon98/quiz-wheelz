# Issue 22 — Player Question Persistence and Delivery

Owner: TBD  
Status: TODO  
Branch: `feature/issue-22-player-question-delivery`

## Goal

Persist generated questions and deliver the current/next safe question to the student.

## Why This Issue Exists

A generated question must be remembered by the server so answers can be validated safely. The frontend must never receive the correct answer.

## Scope

- Persist generated question for a specific RacePlayer.
- Persist the choices for that question.
- Mark active/answered/expired status as needed.
- Return a safe question response to the student.
- Use server cache for active question only as optimization.
- Add tests for persistence and safe response mapping.

## Out of Scope

- No answer submission yet.
- No scoring yet.
- No frontend question screen yet.

## Reuse-First Checklist

Inspect existing DTO patterns, response wrappers, repository conventions, API paths and session/current-user patterns.
Do not create a new API response format.

## Backend Planning Notes

Recommended flow:

```text
Resolve student session
Find RacePlayer and Race
Validate race is in progress
Find or generate current question
Persist generated question and choices
Cache active question
Return safe response
```

Response must include:

- question identifier
- question text
- choices without correctness
- time limit or expiration
- player/race state if useful

## Validation and Security

- Student can only receive questions for their own RacePlayer.
- Race must be in a valid state.
- Correct answer must not be exposed.
- Cache miss must fall back to DB.

## Testing and QA

- Student gets question after race start.
- Correct choice flag is not in response.
- Question is saved before response.
- Cache miss still works from DB.
- Student cannot get another player’s question.

## Definition of Done

- Safe question endpoint works.
- Generated question and choices are persisted.
- Active question can be loaded from cache or DB.
- No correct answer leakage.

## Demo Flow

Start race, call current/next question endpoint as joined student, verify response has four choices and DB contains the generated question.

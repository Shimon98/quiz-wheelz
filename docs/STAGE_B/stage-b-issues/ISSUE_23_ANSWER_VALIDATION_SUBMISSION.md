# Issue 23 — Answer Validation and Submission

Owner: TBD  
Status: TODO  
Branch: `feature/issue-23-answer-validation-submission`

## Goal

Allow a student to submit a selected choice and let the server validate the answer safely.

## Why This Issue Exists

The server must decide correctness, not the frontend. This issue creates the trusted answer validation path that scoring and race progress will use.

## Scope

- Add answer submission API.
- Resolve student session.
- Load active question.
- Validate selected choice belongs to that question.
- Validate question status/time.
- Save answer result.
- Return answer result without exposing unnecessary internal data.
- Prepare data needed by scoring/race engine.

## Out of Scope

- No full scoring engine unless included in Issue 24.
- No frontend question screen unless included later.
- No advanced anti-cheat beyond basic ownership/time validation.

## Reuse-First Checklist

Inspect existing validation/error response patterns, API paths, DTO style, service conventions and tests.
Do not put validation logic inside the controller.

## Backend Planning Notes

Recommended validation rules:

- Question belongs to the current RacePlayer.
- Question is active/unanswered.
- Selected choice belongs to the question.
- Question is not expired unless timeout behavior is being handled.
- Double answer is rejected.

The answer record should keep enough data for scoring and future statistics:

- correctness
- response time
- selected choice
- score/progress deltas later if useful
- timestamp

## Testing and QA

- Correct answer returns correct result.
- Wrong answer returns wrong result.
- Double submit is rejected.
- Choice from another question is rejected.
- Expired answer follows chosen policy.
- Student cannot answer another player’s question.

## Definition of Done

- Student can submit selected choice.
- Server validates ownership and correctness.
- Answer is persisted.
- Result is returned safely.
- Logic is covered by tests.

## Demo Flow

Student receives question, submits one of the four choices, server returns correct/wrong and answer is saved.

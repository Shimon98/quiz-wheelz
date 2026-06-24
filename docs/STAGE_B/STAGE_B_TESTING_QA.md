# Stage B Testing and QA Plan

Stage B introduces real game logic. Testing must focus on business rules, not only rendering.

## Testing Principles

- Test services that make decisions.
- Do not hide important logic inside controllers or frontend components.
- Prefer small tests around generation, validation, scoring and race state.
- Add manual QA checklists to PRs.
- Test edge cases, not only happy paths.

## Backend Test Areas

### RacePlayer

Test:

- Player can join a waiting race.
- Player cannot join a missing race.
- Player cannot join a race that already started.
- Player cannot join when max players reached.
- Lane/car assignment is valid and does not duplicate when it should be unique.

### Student Session

Test:

- Join creates a session/token.
- Student request resolves to the correct race player.
- Invalid/expired session is rejected.
- Student cannot operate on another player’s question.

### Question Generation

Test:

- Generated question matches template rules.
- Exactly four choices are generated.
- Exactly one choice is correct.
- Choices are not duplicated.
- Correct answer is not exposed in response DTO.
- Difficulty is respected.

### Answer Validation

Test:

- Correct selected choice is marked correct.
- Wrong selected choice is marked wrong.
- Choice from another question is rejected.
- Double answer is rejected.
- Expired question is rejected or marked timeout according to policy.

### Scoring

Test:

- Correct answer gives expected points/progress.
- Wrong answer does not incorrectly reward progress.
- Streak bonus behaves as expected.
- Harder difficulty gives stronger reward if this rule is enabled.

### Race Engine

Test:

- Player progress updates after answer.
- Player cannot pass beyond total distance incorrectly.
- Player status becomes finished when reaching finish.
- Race status becomes finished according to the chosen finish policy.
- Server remains source of truth.

### SSE / Race State

Test:

- Race state returns all players.
- Teacher cannot access another teacher’s race state.
- Updates are emitted for join/start/answer/finish.
- Client can recover by fetching latest state if SSE reconnects.

## Frontend QA Areas

### Student Join Page

Manual QA:

- Works on small phone screen.
- Full-screen mobile layout is comfortable.
- RTL layout is correct.
- Room code can be entered or read from URL if supported.
- Loading state is visible.
- Error state is friendly.
- Submit button prevents duplicate clicks.
- Joined student navigates to race/waiting state.

### Student Race Page

Manual QA:

- Question is readable on phone.
- Four answer buttons are large and easy to tap.
- Button is disabled after submit.
- Timer is visible.
- Correct/wrong feedback is clear.
- Next question appears without page refresh.
- Score/progress/streak update correctly.
- No keyboard opens during the race.

### Teacher Waiting Room

Manual QA:

- Real joined players appear.
- Empty slots are clear.
- Start button is disabled when no players joined.
- Start button is enabled when rules allow.
- Room code remains visible.
- Page handles loading/error states.

### Teacher Race Live Page

Manual QA:

- Real players render on the track/list.
- Progress changes after answers.
- Cars animate smoothly enough for the current stage.
- Leaderboard/state stays consistent with server.
- Reconnecting or refreshing recovers state.

## Pull Request Checklist

Before opening PR:

- Run backend tests.
- Run frontend build/lint if available.
- Manually test the issue demo flow.
- Confirm no unrelated files were changed.
- Confirm existing components/constants were reused when possible.
- Confirm no hardcoded secrets or local environment files were committed.

## Stage B Final Manual Flow

```text
Teacher logs in
Teacher creates race
Teacher opens race room
Student joins by room code from phone layout
Teacher sees student in waiting room
Teacher starts race
Student receives generated question
Student submits answer
Server validates answer
Score/progress/streak update
Teacher sees progress change
Race reaches finish state
```

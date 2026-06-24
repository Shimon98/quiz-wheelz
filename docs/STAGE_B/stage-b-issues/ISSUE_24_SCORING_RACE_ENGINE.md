# Issue 24 — Scoring and Race Engine

Owner: TBD  
Status: TODO  
Branch: `feature/issue-24-scoring-race-engine`

## Goal

Update score, streak, speed/progress and race/player state after answers.

## Why This Issue Exists

A race is not just question validation. The game needs a consistent server-owned rule engine that moves players forward and detects finish state.

## Scope

- Add scoring rules.
- Add progress/speed update rules.
- Update RacePlayer after answer.
- Update difficulty/streak counters.
- Detect player finish.
- Detect basic race finish state.
- Add tests for scoring and race state transitions.

## Out of Scope

- No advanced power-ups/turbo/luck events.
- No final visual polish.
- No complex balancing algorithm unless approved.

## Reuse-First Checklist

Inspect existing Race/RaceStatus conventions, DTOs, service structure, exception style and test utilities.
Do not let frontend calculate score/progress/winner.

## Backend Planning Notes

Recommended rule direction:

- Everyone can have a base movement/speed concept.
- Correct answer increases score and progress/speed.
- Harder questions can reward more.
- Fast answer can reward more if timing is enabled.
- Wrong answer reduces/keeps progress effect and resets or lowers streak.
- Player status becomes finished when reaching total distance.
- Race status becomes finished according to chosen policy.

Keep the algorithm simple enough to understand, but structured so it can grow.

## Testing and QA

- Correct answer updates score/progress.
- Wrong answer does not reward incorrectly.
- Streak updates correctly.
- Difficulty reward multiplier works if enabled.
- Player finishes at total distance.
- Race finishes according to policy.

## Definition of Done

- Server owns scoring and movement decisions.
- RacePlayer updates after answers.
- Basic finish detection works.
- Tests cover important game rules.
- Frontend can consume updated state without computing game logic.

## Demo Flow

Student answers multiple questions and RacePlayer score/progress/streak changes until player reaches finish.

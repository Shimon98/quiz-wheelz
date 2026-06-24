# Issue 16 — RacePlayer Domain

Owner: TBD  
Status: TODO  
Branch: `feature/issue-16-race-player-domain`

## Goal

Create the domain foundation for a participant inside a race.

## Why This Issue Exists

The project needs one consistent participant concept before student join, questions, scoring and live race state can work. The chosen concept is `RacePlayer`: a player inside one specific race.

## Scope

- Add the persistent model for a race participant.
- Connect participant to a race.
- Add status/state fields needed for waiting, racing, finished and disconnected states.
- Prepare fields for lane and vehicle assignment.
- Add repository/query support needed by later issues.
- Add tests for basic persistence/query behavior where relevant.

## Out of Scope

- No student join endpoint yet.
- No frontend join page yet.
- No question system yet.
- No scoring/race engine yet.

## Reuse-First Checklist

Inspect existing entity, enum, repository, DTO and timestamp conventions before creating new files.
Follow the current package and naming style.

## Backend Planning Notes

Recommended concepts:

- Race relationship.
- Display name.
- Lane number.
- Vehicle type/color keys.
- Status.
- Position/progress.
- Speed or speed multiplier.
- Score.
- Streak.
- Correct/wrong answer counts.
- Current difficulty.
- Join/start/finish timestamps.
- Last seen timestamp.

Do not add a direct teacher foreign key unless a clear requirement appears. Ownership should be resolved through Race -> Teacher.

## Validation and Security

- RacePlayer must always belong to one race.
- Lane/vehicle assignment should be ready for uniqueness rules per race.
- Status should use enum-like controlled values, not free text.

## Testing and QA

- Save RacePlayer connected to Race.
- Query players by Race.
- Order players by lane/join order if needed.
- Verify defaults are correct.

## Definition of Done

- RacePlayer domain exists.
- RacePlayer belongs to Race.
- It can represent waiting/racing/finished/disconnected states.
- It can support vehicle/lane assignment.
- It can support later score/progress/streak updates without refactor.

## Demo Flow

Developer can create a RacePlayer for an existing Race in tests or dev DB and query it back by race.

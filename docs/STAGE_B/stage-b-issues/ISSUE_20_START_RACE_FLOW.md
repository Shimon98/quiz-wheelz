# Issue 20 — Start Race Flow

Owner: TBD  
Status: TODO  
Branch: `feature/issue-20-start-race-flow`

## Goal

Allow the teacher to start a waiting race and transition all relevant state into the race phase.

## Why This Issue Exists

The race must have a clean lifecycle before questions, scoring and live visuals can work.

## Scope

- Add start-race API/action.
- Validate teacher ownership.
- Validate race status.
- Validate at least one participant joined.
- Update race status and start timestamp.
- Update participant statuses.
- Update frontend start button to call real API.
- Navigate or transition to live race page/state.

## Out of Scope

- No question delivery yet unless connected later.
- No final race animation yet.
- No advanced countdown unless specifically approved.

## Reuse-First Checklist

Inspect existing teacher race API, route constants, service conventions, status enums, buttons and waiting room action panels.
Do not create parallel API patterns.

## Backend Planning Notes

Race lifecycle should be controlled by the server.
The frontend asks to start; the server decides whether it is allowed.

Recommended start validation:

- Current user is the race teacher.
- Race is waiting for players.
- There is at least one RacePlayer.
- Race is not finished/cancelled.

## Frontend Planning Notes

- Start button should be disabled if server state says it is not allowed.
- Show loading while starting.
- Show friendly error if start fails.
- After success, transition to live race screen or live state.

## Testing and QA

- Start with zero players is rejected.
- Start with one or more players works.
- Start another teacher’s race is rejected.
- Starting already started race is rejected.
- UI handles success/error.

## Definition of Done

- Teacher can start race from UI.
- Race status changes correctly.
- RacePlayers move to racing state.
- Start rules are enforced by backend.
- UI is connected and handles states.

## Demo Flow

Teacher creates race, student joins, teacher clicks start, race status becomes in progress and UI transitions to live race state.

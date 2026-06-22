# Issue 17 — Student Join API and Session

Owner: TBD  
Status: TODO  
Branch: `feature/issue-17-student-join-api`

## Goal

Allow a student to join a waiting race using a room code and create a race-specific session.

## Why This Issue Exists

Students are not permanent users in Stage B. They need a clean way to join one race and make future requests as the correct RacePlayer.

## Scope

- Add join-by-room-code API.
- Validate race existence and status.
- Validate max player limit.
- Create RacePlayer.
- Assign lane and vehicle keys automatically unless manual selection is implemented.
- Create/return a student race session.
- Return safe join response to the frontend.

## Out of Scope

- No full student UI in this issue.
- No question delivery yet.
- No scoring yet.
- No permanent student accounts.

## Reuse-First Checklist

Inspect existing API response format, exception handling, validation annotations, auth/cookie utilities, API path constants and service conventions.
Do not create a separate response style.

## Backend Planning Notes

Recommended request data:

- room code
- display name
- optional selected vehicle key if vehicle selection is approved

Recommended response data:

- race identifier
- race title/status
- room code
- race player identifier or safe session result
- display name
- lane and vehicle keys
- max/current players

Session recommendation:

- Use a race-specific student session token/cookie separate from teacher auth.
- Include enough information to resolve raceId and racePlayerId safely.

## Validation and Security

- Room code must exist.
- Race must be waiting for players.
- Race must not exceed max players.
- Display name must be valid and child-friendly.
- Student must not be allowed to join as another RacePlayer.
- Student session must be scoped to one race/player.

## Testing and QA

- Join valid waiting race.
- Reject missing room code.
- Reject started/finished race.
- Reject full race.
- Validate duplicate names policy if defined.
- Verify session/cookie is created.

## Definition of Done

- Student can join via API.
- RacePlayer is created.
- Lane/vehicle keys are assigned or accepted safely.
- Student session is created.
- Response contains only safe data.
- Later student requests can be tied to the joined RacePlayer.

## Demo Flow

Using API client/Postman/browser call: create a race, call join with room code, verify RacePlayer exists and session is returned/set.

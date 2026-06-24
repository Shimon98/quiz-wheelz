# Issue 27 — Race SSE Stream

Owner: TBD  
Status: TODO  
Branch: `feature/issue-27-race-sse-stream`

## Goal

Provide race-specific live updates so the teacher screen can update without manual refresh.

## Why This Issue Exists

The teacher live screen should react to joins, start events, answers, progress updates and finish events. SSE is a good first fit because the teacher mostly receives server updates.

## Scope

- Convert or extend existing SSE infrastructure to race-specific subscriptions.
- Subscribe teacher/client to a specific race stream.
- Emit important race events.
- Add frontend hook/client to listen for race updates.
- Keep fallback fetch/latest-state behavior.

## Out of Scope

- No WebSocket unless a concrete need is proven.
- No per-frame movement streaming.
- No advanced reconnection strategy beyond reasonable first version.

## Reuse-First Checklist

Inspect existing SSE controller/service before creating a new parallel system.
Inspect existing frontend API/config patterns.

## Backend Planning Notes

Recommended event types:

- PLAYER_JOINED
- RACE_STARTED
- QUESTION_ANSWERED
- PLAYER_PROGRESS_UPDATED
- RACE_STATE_SNAPSHOT
- RACE_FINISHED

SSE should publish server-owned state. It should not require the frontend to calculate game rules.

## Frontend Planning Notes

The frontend should:

- Open stream for the current race.
- Update local race state from events/snapshots.
- Smoothly animate between states where possible.
- Refetch latest state on reconnect or error.

## Testing and QA

- Teacher receives player joined event.
- Teacher receives race started event.
- Teacher receives progress update after answer.
- Reconnect/refetch path works.
- Unauthorized user cannot subscribe to another teacher’s race.

## Definition of Done

- Race-specific SSE stream works.
- Teacher live screen updates after real game events.
- Fallback latest-state fetch exists.
- Existing SSE code is reused or refactored cleanly.

## Demo Flow

Teacher opens live page, student answers question, teacher page updates without manual refresh.

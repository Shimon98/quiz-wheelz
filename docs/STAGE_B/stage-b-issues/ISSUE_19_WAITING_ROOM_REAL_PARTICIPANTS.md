# Issue 19 — Teacher Waiting Room Real Participants

Owner: TBD  
Status: TODO  
Branch: `feature/issue-19-waiting-room-real-participants`

## Goal

Update the teacher race room/waiting room to show real joined RacePlayers instead of empty placeholder data.

## Why This Issue Exists

After students join, the teacher needs immediate confidence that participants are connected and ready. This also prepares the start-race flow.

## Scope

- Update teacher race room response/state to include real participants.
- Show participant cards/slots in the waiting room.
- Show current players vs max players.
- Show player lane and vehicle indicator if available.
- Update start button enable/disable logic according to real participants.
- Reuse existing waiting room components and constants before creating new ones.

## Out of Scope

- No final live race track yet.
- No scoring yet.
- No question system yet.
- No SSE required unless already available from earlier work; refresh/polling can be temporary only if documented and replaced by Issue 27.

## Reuse-First Checklist

Inspect existing teacher race room components, dashboard styles, card components, buttons, text constants and API client functions.
Do not rewrite the whole page if existing structure can be extended.

## Backend Planning Notes

The teacher room data should include safe participant information:

- player id or safe identifier
- display name
- lane
- vehicle keys
- status
- joined time if useful

Teacher ownership must still be enforced through Race -> Teacher.

## Frontend Planning Notes

The UI should clearly show:

- Empty waiting state.
- Filled participant slots.
- Max player count.
- Start button disabled with reason if no players.
- Loading/error states.

## Testing and QA

- Teacher sees no players before join.
- Student joins.
- Teacher room shows the player after refresh/update.
- Max player count is correct.
- Teacher cannot see another teacher’s race players.

## Definition of Done

- Waiting room displays real participants.
- Start button state is based on server data.
- No duplicate UI code is introduced.
- Ownership rules remain enforced.

## Demo Flow

Teacher opens race room, student joins from join API/page, teacher sees the student in the waiting room.

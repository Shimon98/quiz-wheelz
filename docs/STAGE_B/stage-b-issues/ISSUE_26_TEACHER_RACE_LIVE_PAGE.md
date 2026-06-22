# Issue 26 — Teacher Race Live Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-26-teacher-race-live-page`

## Goal

Create the first real teacher live race screen that renders server race state visually.

## Why This Issue Exists

The team needs to see the race engine visually, not only imagine it. This page should start the real visual direction without becoming a throwaway mock.

## Scope

- Add/update teacher live race page.
- Fetch real race state.
- Render players, progress, score, streak and status.
- Show a simple visual track or progress layout.
- Animate movement between server states if practical.
- Show basic leaderboard/state panel.
- Reuse existing teacher layout, cards, constants, assets and styles.

## Out of Scope

- No final PixiJS renderer unless explicitly approved.
- No turbo/luck/oil/junction visuals.
- No fake player data as the main implementation.

## Reuse-First Checklist

Inspect existing teacher dashboard/race room components, text constants, icon/assets, cards and API hooks.
Do not create a completely separate visual language.

## Frontend Planning Notes

The first visual version can use React/CSS and car images/assets.
It must render real `RaceState` data from the server.

The renderer should not decide:

- score
- progress
- speed
- winner
- finish state
- correctness

It only displays/animates state.

## Backend Planning Notes

If no race state endpoint exists yet, coordinate with the backend issue that exposes it.
The page should be able to recover by fetching latest state.

## Testing and QA

- Teacher sees all active RacePlayers.
- Progress changes after answers.
- Page handles loading/error states.
- Refresh recovers current state.
- Visual layout works on projector/desktop.

## Definition of Done

- Teacher can open live race page.
- Real players and progress render.
- No fake game logic is in the frontend.
- Visual layer is reusable and extendable.

## Demo Flow

Start race, answer from student screen, teacher live page shows updated progress/score.

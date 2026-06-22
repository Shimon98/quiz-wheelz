# Issue 25 — Student Race Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-25-student-race-page`

## Goal

Build the production-ready mobile student race screen for answering questions during a race.

## Why This Issue Exists

The student screen is the core play experience. It must be mobile-first, fast, simple, and connected to real question/answer APIs.

## Scope

- Add student race page/route.
- Load current/next question.
- Show question and four answer choices.
- Submit selected choice.
- Show feedback.
- Show timer/progress/score/streak as available.
- Disable answer buttons after submit.
- Handle loading/error/expired states.
- Reuse existing UI constants/components/assets.

## Out of Scope

- No full teacher track renderer.
- No advanced animations if they delay the core flow.
- No free-text answers.

## Reuse-First Checklist

Inspect existing button/input/card/loading/error components, text constants, assets, API clients and hooks/stores.
Do not duplicate large Tailwind class strings. Extract constants if needed.

## Frontend Planning Notes

The screen should be:

- Full phone-screen experience.
- RTL-safe.
- Touch-friendly.
- Four large answer buttons.
- No keyboard during race.
- Clear feedback after answer.
- Resilient to slow network.

## Testing and QA

Manual QA:

- Works on small phone viewport.
- Question text remains readable.
- Four choices are large enough.
- Submit prevents double click.
- Loading and error states are clear.
- Timer/expired behavior is understandable.
- Next question loads correctly.

## Definition of Done

- Student can answer real generated questions from UI.
- UI uses real APIs.
- UI handles loading/error/disabled states.
- UI is production-ready enough to keep.
- Existing styles/components/constants are reused where possible.

## Demo Flow

Join race, start race, student page loads question, student answers, sees result, receives next question.

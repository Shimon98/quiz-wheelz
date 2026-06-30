# QuizWheelz — Design References Manifest

## 1. Purpose

This file lists the approved design reference images and what each image means.

The images are visual inspiration, not exact implementation instructions.

## 2. Suggested Folder

Store images under:

```text
docs/design-references/
```

## 3. Recommended File Names

```text
quizwheelz-landing-entry.png
quizwheelz-student-join-flow.png
quizwheelz-teacher-auth-flow.png
quizwheelz-teacher-dashboard.png
quizwheelz-create-race.png
quizwheelz-teacher-waiting-room.png
quizwheelz-student-race-gameplay.png
quizwheelz-teacher-live-race.png
quizwheelz-student-results.png
quizwheelz-teacher-results.png
```

## 4. Landing / Entry Reference

Represents first screen, user type selection, logo and mascot, settings menu, and footer links.

Important decisions:

- Mobile and desktop versions needed.
- Footer must include all rights reserved, terms, privacy.
- Dark mode button belongs inside settings, not separate.

## 5. Student Join Flow Reference

Represents room code screen, display name screen, waiting screen, and future vehicle/avatar selection.

Important decisions:

- QR only pre-fills room code.
- RacePlayer is created only after display name submit.
- Vehicle/avatar selection is future.

## 6. Teacher Auth Reference

Represents teacher login, teacher registration, forgot password, code verification, and reset password.

Important decisions:

- UI should be email-ready.
- Backend may still accept username temporarily.
- Forgot password is a future backend plan unless implemented.

## 7. Teacher Dashboard Reference

Represents main teacher workspace, sidebar, stats, race list, and create race button.

Important decisions:

- Keep current navigation minimal.
- Settings belongs in sidebar/user menu.
- Future items should not be built now.

## 8. Student Race Gameplay Reference

Represents PixiJS pseudo-3D jungle race, monkey kart from behind, opponent karts, and React overlay question UI.

Important decisions:

- PixiJS renders the race scene.
- React renders educational UI.
- Frontend does not calculate correctness/score/progress.

## 9. Teacher Live Race Reference

Represents teacher sees all players, progress lanes, live event feed, current ranking, and end race button.

Important decisions:

- This screen is management-oriented.
- It should work on desktop and mobile.
- It consumes server race snapshots/SSE later.

## 10. Result Screens

Student result represents personal placement, rewards, leaderboard, and finish button.

Teacher result represents winner highlighted, final leaderboard, link to reports/statistics, and back to dashboard.

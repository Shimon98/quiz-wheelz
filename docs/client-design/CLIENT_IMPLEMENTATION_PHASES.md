# QuizWheelz — Client Implementation Phases

## 1. Purpose

This document turns the client design and page roadmap into small implementation phases.

Every phase should be implemented in a small branch and PR.

## 2. Core Rule

Do not build all screens at once. Do not let AI redesign the full client in one pass.

## 3. Phase C-01 — Documentation Sync

### Goal

Update docs to the approved Jungle Monkey Kart direction.

### Files

```text
docs/CLIENT_DESIGN_FOUNDATION.md
docs/CLIENT_PAGE_ROADMAP.md
docs/CLIENT_IMPLEMENTATION_PHASES.md
docs/CLIENT_STYLE_ORGANIZATION_GUIDE.md
docs/DESIGN_REFERENCES_MANIFEST.md
```

### Scope

Documentation only.

## 4. Phase C-02 — Current Client Audit

### Goal

Document what exists before refactor.

### Output

```text
docs/CLIENT_CURRENT_STATE_AUDIT.md
```

### Inspect

```text
client/package.json
client/src/routes/AppRouter.jsx
client/src/constants/routeConstants.js
client/src/api/httpClient.js
client/src/constants/apiEndpointConstants.js
client/src/shared/components/ui/
client/src/features/auth/
client/src/features/teacherDashboard/
client/src/styles/
```

## 5. Phase C-03 — Design Tokens and Theme Foundation

### Goal

Create the base token system.

### Suggested Files

```text
client/src/styles/tokens.css
client/src/styles/themes.css
client/src/stores/useThemeStore.js
```

### Scope

CSS variables, light/dark/system theme state, `data-theme` on root, no full UI migration yet.

## 6. Phase C-04 — PublicEntryLayout

### Goal

Create reusable public/auth layout.

### Suggested Files

```text
client/src/shared/layouts/PublicEntryLayout.jsx
client/src/shared/layouts/styles/publicEntryLayoutStyles.js
client/src/shared/layouts/config/publicEntryLayoutConfig.js
```

### Scope

Layout only: children rendering, optional illustration panel, settings slot, footer slot, mobile/desktop responsiveness.

## 7. Phase C-05 — Public Settings Popup

### Goal

Add settings UI for public screens.

### Components

```text
SettingsButton
SettingsPopover
ThemeModeSelector
LanguageSelector
AccessibilitySettingsSection
SoundSettingsSection
```

### shadcn Candidates

Popover, Button, Switch, Separator.

## 8. Phase C-06 — Landing Page

### Goal

Build first page from the approved landing mockup.

### Route

```text
/ or /entry
```

### Components

```text
LandingPage
RoleSelectCard
BrandHeader
LandingHero
PublicFooter
```

## 9. Phase C-07 — Student Join UI + API

### Goal

Build the two-step student join flow.

### Routes

```text
/join
/join/:roomCode
```

### Steps

1. Room code
2. Display name
3. Waiting page

### Important Rule

`RacePlayer` is created only after display name submit.

### Suggested Files

```text
client/src/features/studentJoin/pages/StudentJoinPage.jsx
client/src/features/studentJoin/pages/StudentWaitingPage.jsx
client/src/features/studentJoin/components/RoomCodeStep.jsx
client/src/features/studentJoin/components/DisplayNameStep.jsx
client/src/features/studentJoin/hooks/useStudentJoin.js
client/src/features/studentJoin/content/studentJoinContent.js
client/src/features/studentJoin/styles/studentJoinStyles.js
client/src/api/racePlayerApi.js
```

## 10. Phase C-08 — Teacher Auth UI

### Goal

Migrate teacher auth to the new public layout.

### Screens

Login, register, forgot password, verify code, reset password.

If backend does not support register/forgot/reset yet, create UI shell only or keep routes disabled until backend is planned.

## 11. Phase C-09 — Teacher Dashboard Shell Refresh

### Scope

Sidebar refinement, mobile behavior, stats cards, race list, settings inside sidebar/user menu.

Not included: reports, templates, question bank, rewards.

## 12. Phase C-10 — Create Race Redesign

### Scope

Race title, subject, max players, race length/question count, time per question if supported, difficulty if supported, advanced options collapsed.

## 13. Phase C-11 — Teacher Waiting Room

### Scope

Room code, QR placeholder, participant list, start race, mobile/desktop.

## 14. Phase C-12 — Student Race UI Shell

### Scope

PixiJS canvas placeholder, React overlay, question card, answer buttons, HUD, no fake game rules.

## 15. Phase C-13 — Teacher Live Race Shell

### Scope

Progress lanes, live event feed, ranking, end race button, mobile adaptation.

## 16. Phase C-14 — Result Screens

### Scope

Student result and teacher result screens.

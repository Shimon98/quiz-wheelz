# QuizWheelz — Client Architecture Guide

## 1. Purpose

This guide defines how the React client should be structured and maintained.

The goal is to keep the client readable, reusable, consistent, and close to modern frontend industry practice.

## 2. Client Responsibilities

The client is responsible for:

- Rendering screens and UI.
- Calling backend APIs.
- Managing UI state.
- Displaying server-owned race/game state.
- Animating visuals received from server state.
- Providing consistent UI across teacher and student flows.

The client is not responsible for:

- Deciding correct answers.
- Calculating score.
- Calculating speed.
- Calculating player progress.
- Deciding winners.
- Owning race state.

The server is the source of truth.

## 3. Recommended Folder Structure

```text
client/src/
  api/
  app/
  assets/
  constants/
  features/
    auth/
    studentJoin/
    studentRace/
    teacherDashboard/
    teacherRaceRoom/
    teacherLiveRace/
    raceResults/
  layouts/
  routes/
  shared/
    components/
      ui/
      brand/
      settings/
    styles/
    utils/
  stores/
  styles/
    tokens.css
    themes.css
  utils/
```

## 4. Feature Folder Structure

Each feature should use this structure when needed:

```text
features/<featureName>/
  pages/
  components/
  hooks/
  content/
  config/
  styles/
  utils/
```

Example:

```text
features/studentJoin/
  pages/
    StudentJoinPage.jsx
    StudentWaitingPage.jsx
  components/
    RoomCodeStep.jsx
    DisplayNameStep.jsx
    StudentWaitingCard.jsx
  hooks/
    useStudentJoin.js
  content/
    studentJoinContent.js
  config/
    studentJoinConfig.js
  styles/
    studentJoinPageStyles.js
    studentJoinFormStyles.js
```

## 5. Page / Hook / Component Separation

### Pages

Pages compose the screen.

Pages may:

- Read route params.
- Navigate.
- Call feature hooks.
- Compose feature components.

Pages should not:

- Contain heavy UI markup.
- Contain repeated API logic.
- Contain business rules.

### Hooks

Hooks own API calls, loading state, error state, submit handlers, refresh/retry behavior, and view-model preparation if needed.

### Components

Components render UI from props.

Components should not call APIs directly, navigate directly unless clearly part of the component responsibility, or contain server/game rules.

## 6. API Layer

API files live in:

```text
client/src/api/
```

Rules:

- API functions use `httpClient`.
- API paths come from constants.
- API files do not contain UI logic.
- API files do not navigate.
- API files return unwrapped response data where the existing pattern supports it.

## 7. Content and Text

User-facing text should not be scattered inside JSX.

Use:

```text
features/<feature>/content/
```

or existing locale/content utilities.

Current decision:

- Do not add `react-i18next` immediately.
- Keep the current lightweight content approach for now.
- Prepare for i18n later.

## 8. RTL and Direction

Rules:

- Hebrew = RTL.
- English = LTR.
- Do not use `dir="auto"`.
- Direction should be derived from the selected language or app setting.
- Shared components should not hardcode Hebrew direction.

## 9. Styling Strategy

Use Tailwind CSS, but avoid huge repeated class strings inside JSX.

Use three levels:

### Global tokens

```text
client/src/styles/tokens.css
client/src/styles/themes.css
```

### Shared UI styles

Inside shared components or:

```text
client/src/shared/styles/
```

### Feature styles

```text
features/<feature>/styles/
```

Long Tailwind class groups should be moved into style constants.

## 10. Recommended Style File Naming

Avoid one giant style file per large feature.

Prefer small focused files:

```text
teacherDashboardLayoutStyles.js
teacherDashboardSidebarStyles.js
teacherDashboardStatsStyles.js
teacherDashboardRaceListStyles.js
teacherDashboardMobileStyles.js
```

## 11. Shared UI Components

Shared UI components live in:

```text
client/src/shared/components/ui/
```

Examples:

```text
Button
Card
Input
Label
Dialog
Popover
Badge
Alert
Skeleton
FormError
Spinner
```

Use shadcn/ui selectively as a source of component code.

Do not import a full UI system all at once.

## 12. Accessibility Rules

Every interactive component must support:

- Keyboard access.
- Visible focus states.
- Proper labels.
- Proper error messages.
- Accessible dialogs/popovers.
- Large mobile tap targets.
- Reduced motion where relevant.

## 13. Client PR Checklist

Before a client PR:

```bash
cd client
npm run lint
npm run build
```

Manual QA should check mobile viewport, desktop viewport, RTL Hebrew, loading/error/disabled states, keyboard behavior, and no horizontal scroll.

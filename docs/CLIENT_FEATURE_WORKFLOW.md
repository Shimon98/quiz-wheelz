# Client Feature Workflow

## Purpose

This document defines how new frontend features should be built in the QuizWheelz React client.

The goal is to keep the client organized, predictable, and easy to extend. Every new feature should follow the same folder structure, data flow, and responsibility rules.

This document should be used together with:

- `docs/CLIENT_ARCHITECTURE_GUIDELINES.md`
- `docs/TEACHER_DASHBOARD_REFACTOR_PLAN.md`
- `AGENTS.md`

---

## Core Rule

Build frontend features by feature area, not by random file type.

A feature should keep its related components, content, constants, hooks, and feature-specific API helpers close together.

Correct direction:

```text
features/
  teacherDashboard/
    components/
    constants/
    content/
    hooks/
    api/
```

Wrong direction:

```text
components/
  all-dashboard-components-here

constants/
  all-feature-constants-here

api/
  mixed-api-functions-with-no-feature-boundary
```

Global code should stay global only when it is truly shared across the whole application.

---

## Current Client Structure

Recommended structure:

```text
client/src/
  app/
    App.jsx

  api/
    httpClient.js
    authApi.js
    subjectApi.js

  assets/
    backgrounds/
    brand/
    icons/
    illustrations/
    logos/

  constants/
    apiEndpointConstants.js
    routeConstants.js
    roleConstants.js

  features/
    auth/
      components/
      pages/
      content/
      hooks/
      api/

    teacherDashboard/
      components/
      components/sidebar/
      constants/
      content/
      hooks/
      api/
      pages/

    admin/
      pages/
      components/
      constants/
      content/
      hooks/
      api/

    commonPages/

  layouts/
    AppShell.jsx
    TeacherDashboardLayout.jsx

  routes/
    AppRouter.jsx
    ProtectedRoute.jsx
    RoleRoute.jsx

  shared/
    components/
      ui/
      brand/
    utils/

  stores/
    authStore.js

  main.jsx
```

---

## Folder Responsibilities

### app/

Owns the application root.

Examples:

```text
app/App.jsx
```

Allowed:

- Root app component
- Global app composition

Not allowed:

- Feature UI
- API logic
- Business logic
- Page-specific layout

---

### routes/

Owns route registration and route guards.

Examples:

```text
routes/AppRouter.jsx
routes/ProtectedRoute.jsx
routes/RoleRoute.jsx
```

Allowed:

- Defining routes
- Protected routes
- Role-based routes
- Redirect behavior

Not allowed:

- Large page JSX
- Feature logic
- API calls directly
- UI sections that belong inside features

---

### layouts/

Owns page-level layout shells.

Examples:

```text
layouts/AppShell.jsx
layouts/TeacherDashboardLayout.jsx
```

Allowed:

- Full-page structure
- Backgrounds
- Sidebar + main layout
- Viewport height rules
- Overflow rules

Not allowed:

- API calls
- Feature-specific logic
- Race list rendering
- Modal logic
- Form logic

Rule:

```text
If it controls the page frame, it belongs in layouts.
If it renders feature content, it belongs in features.
```

---

### shared/

Owns reusable code that is truly shared by multiple features.

Examples:

```text
shared/components/ui/TextInput.jsx
shared/components/ui/FormError.jsx
shared/components/brand/AppLogo.jsx
shared/utils/formatDate.js
```

Allowed:

- Generic UI components
- Generic brand components
- Generic helper functions

Not allowed:

- Teacher dashboard-specific components
- Auth-specific forms
- Race-specific UI
- Feature-specific constants

Rule:

```text
Do not put something in shared just because it is a component.
Put it in shared only if more than one feature should use it.
```

---

### constants/

Owns global constants used across the app.

Examples:

```text
constants/apiEndpointConstants.js
constants/routeConstants.js
constants/roleConstants.js
```

Allowed:

- Route paths
- API endpoint paths
- User roles
- Global app config

Not allowed:

- Teacher dashboard nav items
- Race panel text
- Feature-specific card config
- Feature-specific UI state

Rule:

```text
Global constants go in src/constants.
Feature constants go inside the feature folder.
```

---

### api/

Owns global API helpers.

Examples:

```text
api/httpClient.js
api/authApi.js
api/subjectApi.js
```

Allowed:

- Calling `httpClient`
- Using `API_ENDPOINTS`
- Returning response data

Not allowed:

- JSX
- React state
- UI messages
- Feature display logic
- Hardcoded endpoint strings

Rule:

```text
API files should not know how the UI looks.
They only call the server and return data.
```

---

### stores/

Owns global state only.

Examples:

```text
stores/authStore.js
```

Allowed:

- Auth user
- Auth status
- Global app state

Not allowed:

- One modal open/close state
- One form state
- One component loading state
- Temporary local UI state

Rule:

```text
Use Zustand only when the state is shared across different parts of the app.
Use component state or hooks for local state.
```

---

## Feature Folder Structure

Each major feature should follow this structure when needed:

```text
features/featureName/
  pages/
  components/
  constants/
  content/
  hooks/
  api/
  utils/
```

Not every feature needs every folder from day one.

Create folders only when they are needed.

---

## Feature Folder Responsibilities

### pages/

Feature entry pages.

Example:

```text
features/teacherDashboard/pages/TeacherDashboardPage.jsx
```

Allowed:

- Reading auth/store data
- Reading route params
- Navigation
- Calling feature hooks
- Passing data into feature components

Not allowed:

- Huge JSX sections
- Complex UI lists directly in the page
- Hardcoded user-facing text
- Backend calls directly when a hook/API layer exists

---

### components/

Feature UI components.

Example:

```text
features/teacherDashboard/components/TeacherDashboardMain.jsx
```

Allowed:

- Rendering UI
- Receiving props
- Triggering callbacks passed from parent
- Local UI-only logic

Not allowed:

- Calling backend API directly
- Knowing endpoint paths
- Owning global app logic
- Calculating server-owned game rules

---

### constants/

Feature-specific config.

Example:

```text
features/teacherDashboard/constants/teacherDashboardConstants.js
features/teacherDashboard/constants/teacherDashboardAssets.js
```

Allowed:

- Feature nav item config
- Feature stats config
- Feature asset registry
- Internal feature config

Not allowed:

- User-facing text
- Global route paths
- Global API endpoint paths

---

### content/

Feature-specific user-facing text.

Example:

```text
features/teacherDashboard/content/teacherDashboardContent.js
```

Allowed:

- Button labels
- Titles
- Empty states
- Error messages
- Hebrew/English content objects

Not allowed:

- Internal IDs
- API endpoint paths
- Technical config

Rule:

```text
Text shown to the user belongs in content files.
```

---

### hooks/

Feature-specific data and behavior hooks.

Example:

```text
features/teacherDashboard/hooks/useTeacherDashboard.js
features/teacherDashboard/hooks/useCreateRace.js
```

Allowed:

- Loading state
- Error state
- Calling API functions
- Preparing data for components
- Handling feature-level side effects

Not allowed:

- JSX
- Large visual logic
- Hardcoded endpoint strings
- Server-owned game calculations

---

### api/

Feature-specific API wrappers.

Example:

```text
features/teacherDashboard/api/teacherDashboardApi.js
```

Allowed:

- Calling global `httpClient`
- Using global `API_ENDPOINTS`
- Returning data for that feature

Not allowed:

- UI state
- JSX
- User-facing messages
- Component styling

---

### utils/

Feature-specific pure helper functions.

Example:

```text
features/teacherDashboard/utils/mapRaceStatus.js
```

Allowed:

- Pure functions
- Formatting feature data
- Mapping status to display config

Not allowed:

- API calls
- React hooks
- Zustand state
- DOM logic

---

## How To Build A New Feature

Use this flow for every new frontend feature.

---

### Step 1 — Define the feature scope

Before writing code, answer:

```text
What is this feature responsible for?
What page or screen owns it?
What data does it need?
Does the server already provide this data?
Does this need a new API endpoint?
Does this need global state, or only local state?
```

Do not start coding before the feature boundary is clear.

---

### Step 2 — Create the feature folder

Example for a teacher race room feature:

```text
features/teacherRaceRoom/
  pages/
  components/
  constants/
  content/
  hooks/
  api/
```

Start only with the folders you actually need.

---

### Step 3 — Add route only if needed

Routes belong in:

```text
routes/AppRouter.jsx
constants/routeConstants.js
```

Route paths belong in:

```text
constants/routeConstants.js
```

Example:

```js
export const ROUTES = {
  TEACHER_DASHBOARD: "/teacher",
  TEACHER_RACE_ROOM: "/teacher/races/:raceId",
};
```

Do not hardcode route paths inside components.

---

### Step 4 — Add API endpoint constants

API endpoint paths belong in:

```text
constants/apiEndpointConstants.js
```

Example:

```js
export const API_ENDPOINTS = {
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    RACES: "/teacher/races",
    RACE_ROOM: (raceId) => `/teacher/races/${raceId}/room`,
  },
};
```

Do not write endpoint strings directly in components or API functions.

---

### Step 5 — Add API functions

Global or feature API functions should call `httpClient`.

Example:

```js
import httpClient from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../constants/apiEndpointConstants";

export async function getTeacherDashboard() {
  const response = await httpClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);
  return response.data;
}
```

API functions should not contain UI logic.

---

### Step 6 — Add a feature hook if the feature loads data

Example:

```text
features/teacherDashboard/hooks/useTeacherDashboard.js
```

The hook may own:

- loading
- error
- data
- reload
- submit behavior

The hook should return clean values for the page/component.

---

### Step 7 — Add page component

Pages connect the feature to routing and layout.

Example:

```text
features/teacherDashboard/pages/TeacherDashboardPage.jsx
```

The page should:

- call hooks
- read route params if needed
- handle navigation
- pass props to feature components

The page should not become a huge UI file.

---

### Step 8 — Add display components

Break UI into small components.

Example:

```text
TeacherRacePanel
RaceList
RaceListItem
RaceStatusBadge
RaceEmptyState
RaceListLoadingState
RaceListErrorState
```

Each component should have one clear responsibility.

---

### Step 9 — Add content and constants

User-facing text:

```text
features/featureName/content/featureNameContent.js
```

Internal config:

```text
features/featureName/constants/featureNameConstants.js
```

Asset registry:

```text
features/featureName/constants/featureNameAssets.js
```

---

### Step 10 — Run build

Before commit:

```bash
cd client
npm run build
```

The build must pass before opening a PR.

---

## Naming Rules

### Components

Use PascalCase:

```text
TeacherDashboardMain.jsx
RaceStatusBadge.jsx
CreateRaceModal.jsx
```

### Hooks

Use camelCase and start with `use`:

```text
useTeacherDashboard.js
useCreateRace.js
useTeacherRaceRoom.js
```

### Constants

Use UPPER_SNAKE_CASE for exported constant objects:

```js
export const API_ENDPOINTS = {};
export const TEACHER_DASHBOARD_NAV_ITEMS = [];
```

### Content files

Use descriptive feature names:

```text
teacherDashboardContent.js
authContent.js
raceContent.js
```

### API files

Use feature or domain names:

```text
authApi.js
subjectApi.js
teacherDashboardApi.js
teacherRaceRoomApi.js
```

---

## Data Flow Rule

Data should flow down.

Correct direction:

```text
API function
   ↓
Feature hook
   ↓
Page
   ↓
Feature section component
   ↓
Small display components
```

Small display components should not fetch data directly.

---

## Teacher Dashboard Rule

The teacher dashboard should remain an application screen, not a long webpage.

Correct structure:

```text
TeacherDashboardLayout
├── TeacherSidebar
└── TeacherDashboardMain
    ├── TeacherHeroBanner
    ├── TeacherStatsSection
    └── TeacherDashboardPanels
        └── TeacherRacePanel
```

Future Issue 09B race list work should happen inside:



or inside subcomponents rendered by it.

Do not change:

- dashboard shell
- sidebar
- hero
- stats layout

when only implementing race list behavior.

---

## What Not To Do

Do not:

- Put API paths directly in components.
- Put large config arrays inside JSX components.
- Put user-facing text directly in components.
- Call backend APIs from small display components.
- Store JWT in localStorage.
- Put local modal state in Zustand.
- Add PixiJS before Stage A is stable.
- Add SSE before the REST flow is working.
- Mix unrelated refactors with feature work.
- Create one huge page component.

---

## PR Checklist

Before opening a PR:

```text
[ ] The feature has a clear folder.
[ ] Shared code is only in shared if it is truly shared.
[ ] API paths are in apiEndpointConstants.js.
[ ] Route paths are in routeConstants.js.
[ ] User-facing text is in content files.
[ ] Internal config is in constants files.
[ ] Components do not call APIs directly.
[ ] Small components receive props.
[ ] Zustand is used only for global state.
[ ] npm run build passes.
[ ] No unrelated backend changes.
[ ] No unrelated visual redesign.
```

---

## Recommended PR Style

Keep PRs small.

Good PR examples:

```text
refactor(client): organize folder architecture
refactor(client): move teacher dashboard into feature folder
feat(client): add teacher dashboard API hook
feat(client): add teacher race list
feat(client): add create race modal
```

Avoid PRs that combine:

```text
folder refactor + modal + API integration + route changes + visual redesign
```

Large mixed PRs are harder to review and more likely to create conflicts.

---

## Summary

Every feature should have a clear home.

Global code should stay global only when it is truly global.

Feature-specific code should live close to the feature that owns it.

The client should stay simple:

```text
Server calculates.
API fetches.
Hooks prepare.
Pages connect.
Components display.
```

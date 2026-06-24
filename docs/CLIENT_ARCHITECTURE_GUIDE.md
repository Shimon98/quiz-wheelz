# Client Architecture Guide

This document defines the frontend architecture and coding rules for the QuizWheelz client.

The goal is to keep the React client readable, reusable, consistent, and close to industry-standard frontend structure.

---

## 1. Client Goals

The client is responsible for:

* Rendering screens and UI.
* Calling backend APIs.
* Managing UI state and simple client state.
* Displaying server-owned race/game state.
* Providing a consistent visual experience across teacher, student, and admin screens.

The client is **not** responsible for:

* Calculating race rules.
* Calculating score or progress.
* Deciding winners.
* Validating correct answers.
* Owning game state that belongs to the server.

The server remains the source of truth.

---

## 2. Folder Structure

Recommended structure:

```txt
client/src/
  api/
  app/
  assets/
  constants/
  features/
  layouts/
  routes/
  shared/
    components/
      ui/
    styles/
    utils/
  stores/
  utils/
```

### `api/`

Contains only HTTP/API functions.

Rules:

* API files call `httpClient`.
* API files do not contain UI logic.
* API files do not navigate.
* API files do not show alerts.
* API endpoint paths must come from constants.

Example:

```txt
api/
  httpClient.js
  authApi.js
  subjectApi.js
  teacherApi.js
  studentApi.js
```

### `features/`

Contains domain-specific UI and hooks.

Examples:

```txt
features/auth/
features/teacherDashboard/
features/studentJoin/
features/studentRace/
features/admin/
```

Each feature may contain:

```txt
components/
hooks/
pages/
content/
config/
styles/
utils/
```

### `shared/components/ui/`

Contains reusable UI primitives used across features.

Examples:

```txt
Button.jsx
IconButton.jsx
Modal.jsx
ModalCloseButton.jsx
Card.jsx
Badge.jsx
TextInput.jsx
SelectField.jsx
FormError.jsx
LoadingState.jsx
ErrorState.jsx
EmptyState.jsx
```

Shared UI components must not import feature-specific content, feature-specific assets, or feature-specific API files.

---

## 3. Component Layers

Use three levels of components:

### 3.1 Shared UI components

Reusable across the app.

Examples:

```txt
Button
ModalCloseButton
TextInput
FormError
Card
Badge
```

Rules:

* No teacher/student/admin business logic.
* No hardcoded Hebrew or English text.
* Accept `children`, `className`, and normal HTML props when relevant.
* Support accessibility props like `aria-label`.
* Should be reusable in future screens.

### 3.2 Feature components

Belong to a specific feature.

Examples:

```txt
TeacherRacesPanel
RaceCard
CreateRaceModal
RaceWaitingRoomHeader
LoginForm
```

Rules:

* Can use shared UI components.
* Can use feature content/config/styles.
* Should not duplicate shared UI behavior.
* Should stay focused on rendering one piece of UI.

### 3.3 Page components

Pages connect hooks, layout, routing, and feature components.

Examples:

```txt
TeacherDashboardPage
TeacherRaceRoomPage
LoginPage
```

Rules:

* Pages should be thin.
* Pages may call hooks.
* Pages may pass data and callbacks down.
* Pages should not contain large UI markup.
* Pages should not contain repeated business logic that can become a hook.

---

## 4. Shared UI Rules

Before creating a new UI component, check if an existing shared component can be reused or extended.

Preferred shared components:

```txt
shared/components/ui/Button.jsx
shared/components/ui/ModalCloseButton.jsx
shared/components/ui/TextInput.jsx
shared/components/ui/FormError.jsx
```

Rules:

* Do not create another button component unless the existing one cannot support the use case.
* Do not create another modal close button.
* Do not create a feature-specific input if `TextInput` can support it.
* If a feature needs a new visual variant, extend the shared component with a variant/size prop.

---

## 5. Styling Rules

The project uses Tailwind CSS.

Allowed:

```jsx
<Button className="mt-4" />
```

Avoid:

```jsx
<div className="rounded-3xl bg-white/80 p-6 text-start shadow-md ..." />
```

Rules:

* Long Tailwind strings should be placed in style constants or shared UI components.
* Shared UI base styles belong inside shared UI components.
* Feature-specific layout styles belong in the feature `styles/` folder.
* Small one-off spacing classes are allowed directly in JSX.
* Avoid duplicated visual styles across features.

Recommended pattern:

```jsx
<section className={TEACHER_DASHBOARD_PANEL_STYLES.racesPanel}>
```

---

## 6. Content and Text Rules

No user-facing text should be hardcoded inside components.

Use content constants:

```txt
content/
  teacherDashboardContent.js
```

Rules:

* Hebrew and English text must live in content/constants files.
* Components receive content through props or `useLocaleContent`.
* `aria-label` text must also come from content constants.
* Error messages shown to users should be friendly and localized when possible.

---

## 7. RTL and Localization Rules

The project currently uses:

```txt
useLanguageStore
useLocaleContent
getLanguageDirection
```

Current decision:

* Do not add `react-i18next` yet.
* Keep the current lightweight content system for now.
* Reconsider `react-i18next` when the number of screens and translation files grows.

Rules:

* Do not hardcode `dir="rtl"` in shared components.
* Use `getLanguageDirection(language)` for layout direction.
* Hebrew UI should render RTL.
* English UI should render LTR.
* Components that depend on direction should receive `direction` or calculate it from the language store in a top-level feature component.

---

## 8. API Layer Rules

The API layer must be consistent.

Rules:

* Use one shared `httpClient`.
* `httpClient` must use `withCredentials: true` because authentication uses Cookie JWT.
* Endpoint paths must come from `API_ENDPOINTS`.
* API functions should return unwrapped response data.
* API files should not contain UI behavior.

Example:

```js
export async function getTeacherDashboard() {
    const response = await httpClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);
    return unwrapApiResponse(response);
}
```

---

## 9. State and Hooks Rules

Use hooks for reusable data and action logic.

Examples:

```txt
useTeacherDashboardData
useSubjects
useTeacherRaceRoomData
useCreateRaceModal
useRaceNavigation
```

Rules:

* Data fetching belongs in hooks.
* Form/action submission logic may be extracted to hooks when it grows.
* Pages should not become large logic containers.
* Hooks should expose clear names such as `isLoading`, `error`, `refresh`, `submit`.

---

## 10. Accessibility Rules

Every interactive component must be accessible enough for real use.

Rules:

* Buttons must be real `<button>` elements.
* Icon-only buttons must have `aria-label`.
* Modals must use `role="dialog"` and `aria-modal="true"`.
* Modals should support Escape close when safe.
* Modals should lock background scroll.
* Modals should return focus after closing.
* Decorative icons/images should use `aria-hidden="true"` or `alt=""`.

---

## 11. Naming Conventions

Use clear names.

Good:

```txt
TeacherRacesPanel
RaceCard
CreateRaceModal
AllRacesModal
ModalCloseButton
useTeacherRaceRoomData
```

Avoid:

```txt
GeneralComponent
Thing
Helper
Temp
NewButton
Button2
```

Folder naming:

* Prefer feature names over generic names.
* Avoid broad folders like `general` unless there is no better domain name.
* Prefer `dashboard`, `races`, `createRace`, `raceWaitingRoom`.

---

## 12. Reuse-First Checklist

Before creating any new component, hook, style file, or utility, check:

* Is there already a shared UI component?
* Is there already a feature component that can be extended?
* Is there already a style constant?
* Is there already a content constant?
* Is there already an API function?
* Is there already a hook?
* Is there already a utility function?

Create new files only when reuse or extension would make the code worse.

---

## 13. PR Checklist for Client Changes

Before opening a PR:

* Run `npm run build`.
* Run `npm run lint`.
* Check that no user-facing text is hardcoded.
* Check that no duplicate UI component was created.
* Check that API calls use `httpClient`.
* Check that routes use route constants.
* Check RTL behavior in Hebrew.
* Check basic English/LTR behavior if the component supports language.
* Check loading, error, empty, and disabled states.
* Check keyboard and modal behavior where relevant.

---

## 14. Current Refactor Direction

The current client refactor should focus on:

1. Building a reusable design system foundation.
2. Reducing duplicated Tailwind strings.
3. Making shared UI components more generic.
4. Keeping feature components readable.
5. Keeping pages thin.
6. Keeping RTL/localization rules consistent.
7. Preparing the client for Stage B screens without creating throwaway UI.

Do not start large visual redesigns before the shared UI rules are stable.

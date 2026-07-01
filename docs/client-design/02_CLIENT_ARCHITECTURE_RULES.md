# QuizWheelz — Client Architecture Rules

## 1. Non-negotiable principle

```text
The server is the source of truth.
```

The client must not decide:
- correct answers
- scoring
- player progress
- speed
- race status
- winner

The frontend displays and animates server state.

## 2. Data flow

Use this flow everywhere:

```text
API function
   ↓
Feature hook
   ↓
Page
   ↓
Feature components
   ↓
Mantine/custom display components
```

## 3. API rules

API files:
- call `httpClient`
- use endpoint constants
- return response data
- do not navigate
- do not contain UI text
- do not contain JSX

API paths live in:

```text
client/src/constants/apiEndpointConstants.js
```

## 4. Route rules

Routes live in:

```text
client/src/routes/AppRouter.jsx
client/src/constants/routeConstants.js
```

Do not hardcode route strings inside components.

## 5. Page rules

Pages may:
- read route params
- navigate
- call feature hooks
- compose screen layout

Pages should not:
- become huge JSX files
- call backend directly
- own business rules
- contain server/game calculations

## 6. Feature hook rules

Feature hooks own:
- API loading state
- error state
- submit handlers
- retry/reload
- view-model preparation

Feature hooks may use Mantine hooks if useful, but should not return JSX.

Example:

```text
useTeacherLogin
- calls login API
- manages loading/error
- redirects after success

useForm from @mantine/form
- manages form values/errors/touched state
```

## 7. Component rules

Components render UI from props.

Components may use:
- Mantine components
- Mantine hooks for UI behavior
- local state for small UI state

Components should not:
- call backend directly
- know endpoint paths
- calculate game rules
- own global app logic

## 8. Folder structure

Recommended:

```text
client/src/
  api/
  app/
    providers/
    theme/
  assets/
  constants/
  features/
    teacherAuth/
    studentJoin/
    studentRace/
    teacherDashboard/
    teacherRaceRoom/
    teacherLiveRace/
    raceResults/
  layouts/
    publicEntry/
  routes/
  shared/
    components/
      brand/
      settings/
    utils/
  stores/
  styles/
  utils/
```

Feature structure:

```text
features/<featureName>/
  pages/
  components/
  hooks/
  api/
  content/
  config/
  utils/
  styles/   # only if custom layout styles are needed
```

## 9. Content rules

User-facing text should live in content/i18n files, not scattered inside JSX.

Examples:

```text
features/teacherAuth/content/teacherAuthContent.js
features/studentJoin/content/studentJoinContent.js
```

## 10. Zustand rules

Use Zustand only for global state:
- auth
- language
- theme/color scheme if not fully managed by Mantine

Do not use Zustand for:
- one modal open state
- one form
- one local loading state

Use Mantine:
- `useDisclosure` for modals/drawers/popovers
- `useForm` for forms
- local component state for small local UI

## 11. Mantine usage rule

Mantine is the default UI system for normal app screens.

Do not create new custom UI primitives unless Mantine cannot solve the problem.

Allowed wrappers only if they reduce repetition:

```text
QwButton
QwTextInput
QwCard
QwModal
```

Wrappers must stay thin.

## 12. Tailwind/custom CSS rule

Use custom CSS/Tailwind only for:
- PublicEntryShell
- hero image layout
- decorative jungle layers
- game visuals
- special responsive composition

Do not write long Tailwind class maps for normal buttons/inputs/cards if Mantine already provides them.

## 13. Accessibility rules

Every interactive screen must support:
- keyboard access
- visible focus
- labels
- error messages
- large mobile tap targets
- accessible dialogs/popovers
- reduced-motion support for animated pieces

## 14. PR checklist

Before PR:

```bash
cd client
npm run lint
npm run build
```

Manual QA:
- 320px
- 375px
- 430px
- 768px
- 1024px
- 1200px
- 1440px
- RTL Hebrew
- LTR English if available
- no horizontal scroll
- loading/error/disabled states

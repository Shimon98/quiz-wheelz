# Client Rules and Conventions

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** frontend folder ownership, data flow, i18n, constants, libraries and component rules

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Data flow

```text
API wrapper
→ feature hook/controller
→ page
→ feature components
→ Mantine/custom display
```

### API wrapper

- calls shared `httpClient`
- uses `API_ENDPOINTS`
- returns normalized response data
- no React state, JSX, navigation or UI text.

### Hook/controller

- loading/error state
- async actions
- retry/refetch
- route transition after successful domain action
- maps server response to view/runtime model
- no JSX.

### Page

- route params
- navigation
- guards/store connection
- composes screen sections
- no backend calls when wrapper/hook exists
- no large visual implementation.

### Component

- renders props
- emits callbacks
- local UI-only state
- no endpoint knowledge
- no server-owned game calculations.

### Utils/runtime/logic

Use focused pure files for:

- response-to-view mapping
- status mapping
- geometry
- formatting
- validation helpers that mirror UX only
- runtime state reducers/mappers.

Do not create a vague `helpers.js` dumping ground.

## Folder rules

Global:

```text
src/api                 shared API wrappers
src/constants           global routes/endpoints/roles/server enums
src/app                 providers/theme/root composition
src/i18n                namespaces/resources
src/shared              truly cross-feature code
src/stores              truly global state
```

Feature:

```text
features/<feature>/
  pages/
  components/
  hooks/
  config/
  runtime/
  utils/
  pixi/       # game feature only
  styles/     # only when feature-specific CSS is justified
```

Create only folders that are needed.

## Constants and configuration

Global values go global only when used across features or when they mirror a server
contract.

Examples:

```text
routeConstants.js
apiEndpointConstants.js
raceStatusConstants.js
```

Feature values stay inside their feature:

```text
studentRaceConfig.js
raceVisualConfig.js
raceAnimationConfig.js
dashboardStatsConfig.js
```

One value, one owner. Do not duplicate a timing or geometry number in CSS, React and
Pixi.

## Hebrew and English

All user-facing text goes through i18next namespaces:

```text
src/i18n/locales/he/<namespace>.js
src/i18n/locales/en/<namespace>.js
```

Use a namespace per product area, not one giant translation file. Do not use a
parallel `content/` convention where i18n is already active.

Technical IDs, API codes and asset keys are not translations.

## UI library rule

Mantine owns normal application UI:

- forms
- inputs/buttons
- cards/papers
- modals/drawers/menus/popovers
- notifications/alerts
- tables/badges/progress
- loaders/skeletons
- focus/accessibility behavior.

Use `@mantine/form` for new forms and Mantine hooks for standard UI behavior.

Custom CSS/Tailwind owns only product-specific composition:

- public hero/sheet
- teacher branded decorations
- student game frame
- Pixi overlay geometry
- special responsive visual layers.

Do not add MUI, Ant, Chakra, shadcn or another primary system.

## Library-first checklist

Before custom work:

| Need | Approved existing option |
|---|---|
| Form state/validation | `@mantine/form` |
| Modal/drawer/popover state | Mantine hooks/components |
| Notification | Mantine notifications/shared wrapper |
| HTTP | Axios shared client |
| Translation | i18next |
| Global state | Zustand only when genuinely global |
| Icon | Lucide React |
| QR | react-qr-code |
| Race rendering | PixiJS |
| React UI animation | Framer Motion when CSS/Mantine animation is not sufficient |
| Race/world animation | PixiJS ticker/renderer |

Do not install a package for a one-line helper. Do not rebuild a full library feature
in custom code.

## Styling

- Consume semantic CSS variables such as `--qw-primary`, not hardcoded colors.
- Use actual token files as the source of truth.
- Keep repeated variants in config/theme, not copied class strings.
- Prefer responsive CSS over JavaScript media checks.
- Respect reduced motion.
- No horizontal scrolling on supported screens.

## State

Use Zustand for auth/language/theme or state shared by distant routes. Do not use it
for one form, one page request, one modal or one animation frame.

Pixi frame values stay inside the renderer. React receives meaningful snapshots and
targets only.

## Honest UI

- No fake success.
- No enabled control without a server action.
- No invented rank.
- No placeholder metric presented as real.
- Disabled future controls must clearly say they are unavailable or be hidden.

## Deletion rule

```text
build replacement
→ switch imports/routes
→ test
→ repository-wide search
→ delete zero-import code
→ lint/build
```

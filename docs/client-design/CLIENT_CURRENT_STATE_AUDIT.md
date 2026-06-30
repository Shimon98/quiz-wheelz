# QuizWheelz — Client Current State Audit

> Status: documentation only. No application code was inspected for change — this file records what exists today so later phases can reuse first and refactor safely.
> Date basis: current `main` working tree.

---

## 1. Current Client Stack

From [client/package.json](../../client/package.json):

| Area | Library | Notes |
|------|---------|-------|
| Framework | React `19.2`, React DOM `19.2` | No TypeScript. Plain `.jsx`. |
| Build | Vite `8`, `@vitejs/plugin-react` | ESM (`"type": "module"`). |
| Styling | Tailwind CSS `4` via `@tailwindcss/vite`, `postcss`, `autoprefixer` | Tailwind **v4** (CSS-first, `@theme`/CSS-vars), not v3 config. |
| Routing | `react-router-dom` `7` | `BrowserRouter` in `routes/AppRouter.jsx`. |
| State | `zustand` `5` | `authStore`, `languageStore`. |
| HTTP | `axios` `1` | Single `httpClient` instance. |
| Forms | `react-hook-form` `7` | Used by `LoginForm`. |
| Animation | `framer-motion` `12` + `motion` `12` | Both present (overlap — see Risks). |
| Icons | `lucide-react` | |
| Render (game) | `pixi.js` `8` + `@pixi/react` `8` | **Installed but not imported anywhere in `src`** — reserved for the future student race screen. |
| Lint | `eslint` `10`, react-hooks/react-refresh plugins | `npm run lint`. |

No i18n library, no shadcn/ui, no Radix, no test runner installed. Scripts: `dev`, `build`, `lint`, `preview`.

---

## 2. Existing Routes

Wired in [client/src/routes/AppRouter.jsx](../../client/src/routes/AppRouter.jsx):

| Path | Element | Guard |
|------|---------|-------|
| `/` | redirect → `/login` | — |
| `/login` | `LoginPage` | public |
| `/teacher` | `TeacherDashboardPage` | `ProtectedRoute` + `RoleRoute[TEACHER]` |
| `/teacher/races/:raceId` | `TeacherRaceRoomPage` | `ProtectedRoute` + `RoleRoute[TEACHER]` |
| `/admin` | `AdminDashboardPage` | `ProtectedRoute` + `RoleRoute[ADMIN]` |
| `/unauthorized` | `UnauthorizedPage` | public |
| `*` | `NotFoundPage` | public |

**Mismatch to note:** [routeConstants.js](../../client/src/constants/routeConstants.js) also declares `STUDENT_JOIN` (`/join`), `TEACHER_RACE_LIVE`, and `TEACHER_RACE_RESULTS` plus path builders, but **none of these are wired into `AppRouter`**. They are forward-declarations only. The student flow (`/join`) has no route, no page, and no feature folder yet.

Guards: `routes/ProtectedRoute.jsx` (auth gate) and `routes/RoleRoute.jsx` (role gate) wrap protected pages. Roles from `constants/roleConstants.js` (`USER_ROLES`).

---

## 3. Existing API Structure

[httpClient.js](../../client/src/api/httpClient.js):
- `axios.create` with `baseURL: import.meta.env.VITE_API_BASE_URL`, `withCredentials: true` (cookie auth, matches AGENTS §19).
- Response interceptor **unwraps `response.data`**; errors rejected raw for callers to map.

[apiEndpointConstants.js](../../client/src/constants/apiEndpointConstants.js) — `API_ENDPOINTS`:
- `AUTH`: `/auth/login`, `/auth/me`, `/auth/logout`
- `SUBJECTS`: `/subjects`
- `TEACHER`: `/teacher/dashboard`, `/teacher/races`, `/teacher/races/:raceId/room`
- **No student/race-player endpoints yet.**

API clients in `client/src/api/`: `authApi.js`, `subjectApi.js`, `teacherApi.js`, `apiResponseUtils.js`. Pattern (matches Architecture Guide §6): functions call `httpClient` with paths from constants, return unwrapped data, no UI/navigation. Async state is owned by hooks (`useTeacherDashboardData`, `useSubjects`, `useTeacherRaceRoomData`, …) and `authStore`.

---

## 4. Existing Shared UI Components

`client/src/shared/components/ui/`:
`AuthButton`, `Badge`, `Button`, `Card`, `EmptyState`, `ErrorState`, `FormError`, `LoadingState`, `Modal`, `ModalCloseButton`, `PageBackground`, `TextInput`.

`client/src/shared/components/brand/`: `AppLogo`.

Utilities: `utils/classNameUtils.js` (`cx` — filter+join, the project's className combiner), `utils/languageDirectionUtils.js` (`getLanguageDirection`, `isRtlLanguage`).

The `teacherDashboard` feature has its own large, well-structured component set (sidebar, races, createRace, raceWaitingRoom, general, ui) plus `hooks/`, `config/`, `content/`, `styles/`, `utils/`, and `context/TeacherWorkspaceContext.jsx`. It is the most mature feature and already follows the AGENTS layering.

---

## 5. Which Components Can Be Reused

Reuse as-is or with token mapping later:

- **`Button`** — clean `variant`×`size` API, `forwardRef`, `cx`, frozen class maps. Good base. (Colors are hardcoded `sky/slate` — token-map later, no rewrite needed now.)
- **`Card`** — `variant`×`padding`, generic. Reuse.
- **`Badge`, `EmptyState`, `ErrorState`, `LoadingState`, `FormError`, `Modal`, `ModalCloseButton`** — generic UI-state primitives. Reuse across new screens.
- **`cx`**, **`languageDirectionUtils`** — keep; both are i18n/RTL-friendly building blocks.
- **`authStore`, `languageStore`** — clean zustand patterns; mirror them for a future `themeStore`.
- **`httpClient` + api-client + hook pattern** — reuse verbatim for student endpoints.
- **`teacherDashboard` config/content/styles separation** — the reference pattern for new features.

---

## 6. Which Components Should Be Deprecated Later

Deprecate gradually (still used by the live login screen — do not delete now):

- **`AuthButton`** — a *second* button system (its own gradient via `UI_CLASSES.primaryButton`, `min-h-16`, `30px` text). Overlaps `Button`. Fold into a `Button` variant later.
- **`PageBackground`** — full-screen image backgrounds (`teacher-login-bg.png`, `student-login-bg.png`). Directly contradicts the new design direction (no full-screen image backgrounds). Replace with `PublicEntryLayout`.
- **`AppLogo`** — renders `gameLogo.png` and **hardcodes Hebrew subtitles inside the component** (violates "no scattered user-facing text"); also has a latent bug: `sizeByVariant.teacher` fallback key does not exist (`only `user`/`student`). Replace with a `BrandWordmark`.
- **`TextInput`** — bound to legacy `UI_CLASSES`, `direction="rtl"` hardcoded default, baked-in user/password icon logic. Refactor into a token-based `AuthTextField`/`FormField`, or keep for legacy login only.
- **`styles/theme.js` `UI_CLASSES`** — the old auth visual language (amber/cyan/violet, `text-right` hardcoded). Legacy; freeze and migrate off it.

---

## 7. Which Components Should NOT Be Touched Yet

The working app depends on these — leave them until their dedicated migration phase:

- `routes/AppRouter.jsx`, `routes/ProtectedRoute.jsx`, `routes/RoleRoute.jsx`
- `stores/authStore.js`, `api/httpClient.js`, `api/authApi.js`
- `features/auth/` (`LoginPage`, `LoginForm`, `AuthCard`) — works end to end with cookie auth
- The entire `features/teacherDashboard/` tree (~70 files, mature and shipping)
- `PageBackground`, `AppLogo`, `TextInput` — deprecate *later*, but they back the live login now, so no deletion/refactor in this phase

---

## 8. Existing Styling Strategy

- **Tailwind v4** utilities, combined via `cx`.
- **Global constants:** `styles/theme.js` → `UI_CLASSES` (42 lines, auth-focused). **No CSS-variable design tokens, no `tokens.css`/`themes.css`, no dark mode layer yet.**
- **Feature styles:** colocated under `features/teacherDashboard/styles/` as exported class-group objects (e.g. `STUDENT_JOIN_PAGE_STYLES`-style maps). Text lives in `content/`, options in `config/`, helpers in `utils/` — matching the Style Organization Guide and AGENTS §13–15.
- Direction: RTL is currently expressed ad-hoc (`text-right` in `UI_CLASSES`, `direction="rtl"` default in `TextInput`) rather than derived globally from language.

Adherence is strong in `teacherDashboard`; the `auth` area still rides the older `UI_CLASSES` approach.

---

## 9. Which Style Files Are Too Large / Should Be Split Later

Measured line counts (Style Guide threshold ≈ 200–250 lines):

| File | Lines | Action |
|------|------:|--------|
| `features/teacherDashboard/styles/dashboardUiStyles.js` | **632** | Over threshold → split per area (layout / sidebar / header / stats / raceList / mobile). |
| `features/teacherDashboard/content/teacherDashboardContent.js` | **434** | Large, but it's *content* not style. Split by section only if it keeps growing; also the seam for future i18n locale extraction. |
| `features/teacherDashboard/styles/raceWaitingRoomStyles.js` | 197 | Near threshold — watch, don't split yet. |
| `styles/theme.js` | 42 | Small but legacy; migrate off, don't grow. |

---

## 10. How To Introduce Design Tokens Safely

1. Add `client/src/styles/tokens.css` (color/radius/shadow/focus-ring/z-index/spacing as `--qw-*` CSS variables) and `client/src/styles/themes.css` (light values now; dark values as a sibling for §11). Wire Tailwind v4 via `@theme` so utilities can read the vars.
2. Import once at the existing global CSS entry (loaded from `main.jsx`). One-line wiring, no component edits.
3. **New** public/student/settings screens consume `var(--qw-*)` from day one.
4. Migrate `Button`/`Card` to tokens **only when** a new screen needs the token variant — never a bulk find-replace.
5. Leave `UI_CLASSES` and the teacher dashboard untouched until their own migration issue.

Non-invasive, additive, reversible. Matches Implementation Phases C-03 (tokens before layout/components).

---

## 11. How To Introduce Dark Mode Safely

- **Tokens first** (§10): define dark values in `themes.css` under a root `.dark` / `data-theme="dark"`.
- Add a `themeStore` (mirror `languageStore`: `light | dark | system`) that toggles the root attribute on `<html>`. No component rewrites.
- Only token-based screens get dark mode initially. **Do not** attempt to dark-mode the image-backed `PageBackground` screens — they are being deprecated anyway.
- Keep the rule: dark mode must stay readable/accessible, not just recolored.

---

## 12. How To Introduce i18n Safely

Foundations already exist — do not add a library yet (Architecture Guide §7 says keep the lightweight content approach for now):

- `stores/languageStore.js`, `constants/messageConstants.js` (`SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`), `utils/languageDirectionUtils.js`, and content/constants files (`AUTH_TEXT`, `teacherDashboardContent.js`) are the seam.
- Rules: never scatter user-facing strings in JSX (fix `AppLogo`'s inline Hebrew when it's replaced); derive `dir` from the selected language; **never `dir="auto"`**.
- Introduce `react-i18next` later, only when a second full flow needs it, and migrate `content/` files into `i18n/locales/<lang>/` gradually — not all at once.

---

## 13. How To Introduce shadcn/ui Safely

Per [CLIENT_UI_LIBRARY_DECISION.md](CLIENT_UI_LIBRARY_DECISION.md): Tailwind base, shadcn selectively, copy components into the repo and adapt.

- **Prerequisite:** tokens (§10) — shadcn components are written against CSS variables.
- Add **per issue, per component** (e.g. Dialog/Popover/Switch for public settings; Input/Label/Form for student join). Never bulk-import a UI system.
- Each imported component must be adapted to QuizWheelz tokens, **RTL** (shadcn defaults LTR), dark mode, and a11y before use.
- shadcn pulls in **Radix** packages — the first real dependency additions — so it needs explicit approval (AGENTS §23). Don't add Radix until a primitive actually requires it; if `Button`/`Card` already suffice, keep them.

---

## 14. Risks

1. **Two button systems** (`Button` vs `AuthButton`) — divergence and duplicated styling; consolidate before building new screens on top.
2. **No token layer** — dark mode *and* shadcn are both blocked until `tokens.css`/`themes.css` exist.
3. **Declared-but-unrouted constants** — `STUDENT_JOIN`, `TEACHER_RACE_LIVE`, `TEACHER_RACE_RESULTS` exist in `routeConstants` but not in `AppRouter`; dead until wired, easy to assume they work.
4. **PixiJS installed, zero consumers** — dependency weight with no usage; confirm it's the intended renderer for the student race screen (ISSUE_25) before adding more around it. Renderers must only draw server state (AGENTS §11).
5. **`AppLogo`** — hardcoded Hebrew text + `sizeByVariant.teacher` fallback referencing a missing key (latent rendering bug if `variant` is ever unknown).
6. **Image-background screens** conflict with the approved "no full-screen background images" direction; migration touches the live login.
7. **`dashboardUiStyles.js` at 632 lines** violates the project's own ≤200–250 line style-file rule.
8. **Tailwind v4 specifics** — tokens must use the v4 `@theme`/CSS-var model; doing this as if v3 (`tailwind.config` theme extend) would cause a churny redo.
9. **`framer-motion` + `motion` both installed** — overlapping animation libs; pick one to avoid bundle bloat and confusion.
10. **No frontend tests** — only manual QA; new flows rely on discipline in PR checklists.
11. **No student session concept on the client yet** — no student API, feature folder, or race-session handling; Stage B introduces it and must keep teacher auth and student race session separate (AGENTS §7, §19).

---

## 15. Recommended First Implementation Phase After This Audit

**Phase: Design Tokens Foundation (Implementation Phases C-03), additive and non-invasive.**

Why first:
- It unblocks **dark mode (§11)**, **shadcn (§13)**, and the **new public/student visual language** in one small step.
- It touches no working code: add `styles/tokens.css` + `styles/themes.css`, wire Tailwind v4 `@theme`, import once. The teacher app and auth flow keep running unchanged.
- It is fully reversible and creates no duplicate components.

Explicitly **not** in this first phase: migrating `Button`/`Card`/auth to tokens, wiring student routes, adding Radix/shadcn, adding i18n libs, or touching the teacher dashboard.

After tokens land, the natural order follows the Page Roadmap and Implementation Phases:
`C-04 PublicEntryLayout` → `C-05 minimal public UI components (BrandWordmark, PublicEntryCard, RoleSelectCard)` → student join flow (which additionally needs new **server** student endpoints + route wiring before it can be functional).

---

## Appendix — Files Inspected For This Audit

Docs: `AGENTS.md`, `docs/client-design/CLIENT_DESIGN_FOUNDATION.md`, `CLIENT_PAGE_ROADMAP.md`, `CLIENT_IMPLEMENTATION_PHASES.md`, `CLIENT_UI_LIBRARY_DECISION.md`, `CLIENT_STYLE_ORGANIZATION_GUIDE.md`, `CLIENT_ARCHITECTURE_GUIDE.md`. (Note: `AI_AGENT_WORKFLOW_PROMPTS.md` was requested but does not exist in `docs/client-design/`.)

Code: `client/package.json`, `app/App.jsx`, `routes/AppRouter.jsx`, `constants/routeConstants.js`, `constants/apiEndpointConstants.js`, `constants/uiConstants.js`, `api/httpClient.js`, `shared/components/ui/{Button,TextInput,Card,PageBackground,AuthButton}.jsx`, `shared/components/brand/AppLogo.jsx`, `features/auth/pages/LoginPage.jsx`, `features/auth/components/LoginForm.jsx`, `styles/theme.js`, `utils/classNameUtils.js`, `utils/languageDirectionUtils.js`, `stores/{authStore,languageStore}.js`, and the full `features/teacherDashboard/` file tree (structure + style/content line counts).

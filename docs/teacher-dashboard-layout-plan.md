# QuizWheelz — Teacher Dashboard Layout Plan

## Purpose

This document explains the screen structure of the QuizWheelz Teacher Dashboard after Issue 09A.

The goal is to make the dashboard easy to understand for future work, especially for Diana or anyone continuing the next client tasks.

The Teacher Dashboard should not be treated as a normal long scrolling webpage. It should behave like a fixed application dashboard with clear layout regions.

Future features should be added inside the existing regions, not by adding random vertical sections to the page.

---

## Current Dashboard Concept

The current Teacher Dashboard is divided into two main regions:

```text
TeacherDashboardLayout
│
├── Right Sidebar / Navigation Area
│
└── Main Dashboard Area
    │
    ├── Hero / Header Area
    │
    ├── Statistics Area
    │
    └── Central Content Area
        └── Race Management Panel
```

The main principle:

```text
The whole dashboard uses the viewport.
The whole page should not scroll unnecessarily.
Long content should scroll inside its own panel.
```

---

## High-Level Screen Regions

```text
┌───────────────────────────────────────────────────────────────┬──────────────┐
│ Main Dashboard Area                                            │ Right Sidebar │
│                                                               │              │
│ ┌───────────────────────────────────────────────────────────┐ │ Logo Area    │
│ │ Hero / Header Area                                         │ │              │
│ │ - Background image                                         │ │ Navigation   │
│ │ - Welcome text                                             │ │              │
│ │ - Teacher identity                                         │ │              │
│ │ - Logout                                                   │ │              │
│ └───────────────────────────────────────────────────────────┘ │              │
│                                                               │              │
│ ┌───────────────────────────────────────────────────────────┐ │              │
│ │ Statistics Area                                            │ │              │
│ │ - Total races                                              │ │              │
│ │ - Active races                                             │ │              │
│ │ - Finished races                                           │ │              │
│ │ - Waiting races                                            │ │              │
│ └───────────────────────────────────────────────────────────┘ │              │
│                                                               │              │
│ ┌───────────────────────────────────────────────────────────┐ │ Bottom       │
│ │ Central Race Management Panel                              │ │ Decoration   │
│ │ - Race list / placeholder                                  │ │              │
│ │ - Create race action                                       │ │              │
│ │ - Future internal scrolling                                │ │              │
│ └───────────────────────────────────────────────────────────┘ │              │
└───────────────────────────────────────────────────────────────┴──────────────┘
```

---

## 1. Dashboard Shell

### Current component

```text
TeacherDashboardLayout
```

### Responsibility

`TeacherDashboardLayout` is the outer shell of the teacher dashboard.

It is responsible for:

- Full viewport dashboard behavior
- General dashboard background
- Sidebar + main layout
- Preventing the entire page from growing endlessly
- Keeping the main content constrained
- Preparing the screen for internal panel scrolling

### Expected layout behavior

```text
height: 100vh
overflow: hidden
display: flex
```

The shell should keep:

```text
Sidebar height = dashboard height
Main content height = dashboard height
```

### Naming note

The current name is acceptable:

```text
TeacherDashboardLayout
```

Optional future name if we want clearer architecture:

```text
TeacherDashboardShell
```

No rename is required right now.

---

## 2. Right Sidebar / Navigation Area

### Current component

```text
TeacherSidebar
```

### Responsibility

`TeacherSidebar` is the fixed right-side navigation area.

It contains:

- Logo / brand area
- Navigation items
- “Coming soon” badges
- Bottom decorative illustration

### Conceptual internal regions

```text
TeacherSidebar
│
├── SidebarBrandArea
│   └── Logo
│
├── SidebarNavigation
│   └── Navigation items
│
└── SidebarDecoration
    └── Car / math illustration
```

These do not need to become separate components yet. For now, it is okay that they live inside `TeacherSidebar.jsx`.

### Current navigation items

```text
Dashboard
Races
Create Race
Students      future
Subjects      future
Results       future
Settings      future
```

### Layout rules

The sidebar should:

- Stay inside the fixed dashboard viewport
- Not push the page vertically
- Keep the logo at the top
- Keep the bottom illustration inside the sidebar
- Allow only the nav area to scroll internally if there are too many nav items

### Future improvement

When real routing behavior is added, `NAV_ITEMS` can move from `TeacherSidebar.jsx` into a config file.

For now, keeping `NAV_ITEMS` inside `TeacherSidebar.jsx` is acceptable because the navigation is still simple and local to one component.

---

## 3. Main Dashboard Area

### Current implementation

The main dashboard area is currently the `main` region inside `TeacherDashboardLayout`.

It contains:

```text
TeacherHeroBanner
TeacherStatsGrid
TeacherRaceListPreview
```

### Suggested conceptual name

```text
TeacherDashboardMain
```

This does not have to be a separate component yet, but it is useful as a mental model.

### Responsibility

The main dashboard area stacks the primary dashboard sections:

1. Hero / header
2. Statistics
3. Central content panel

It should use:

```text
display: flex
flex-direction: column
min-height: 0
overflow: hidden
```

This allows the central content panel to fill the remaining screen space.

---

## 4. Hero / Header Area

### Current component

```text
TeacherHeroBanner
```

### Child component

```text
TeacherTopBar
```

### Responsibility

The hero is the compact top visual section of the dashboard.

It contains:

- Decorative racing/learning background image
- Welcome title
- Subtitle
- Teacher identity area
- Notification icon
- Logout button

### Current role of `TeacherTopBar`

`TeacherTopBar` is no longer a separate full page top bar.

It is a compact identity/control area inside the hero.

It contains:

- Teacher name
- Teacher role
- Notification icon
- Logout button

### Layout rule

The hero should stay compact.

Recommended height:

```text
Desktop: about 180–210px
```

It should not become a large landing-page banner, because the dashboard needs room for stats and race management.

---

## 5. Statistics Area

### Current components

```text
TeacherStatsGrid
TeacherStatCard
```

### Responsibility

The statistics area shows quick teacher dashboard metrics.

Current Stage A values are still placeholder or safe values until real API integration.

Examples:

```text
Total races
Active races
Finished races
Waiting for players
```

### Future data source

Later this should connect to:

```text
GET /api/teacher/dashboard
```

This will likely be part of the real dashboard data integration task.

---

## 6. Central Race Management Panel

### Current component

```text
TeacherRaceListPreview
```

### Current responsibility

`TeacherRaceListPreview` is currently a temporary placeholder panel.

It shows:

- Panel title
- Short description
- Create race button
- Empty state message

### Important layout role

Even though the real race list is not implemented yet, this panel already prepares the layout for the next task.

It should:

- Fill the remaining vertical space
- Not push the whole page down
- Prepare space for future internal scrolling

### Future structure for Issue 09B

```text
TeacherRacePanel
│
├── RacePanelHeader
│   ├── Title
│   ├── Filter / status dropdown
│   └── Create race button
│
├── RaceList
│   ├── RaceListItem
│   ├── RaceListItem
│   └── RaceListItem
│
└── RacePanelFooter
    └── Show all races button
```

### Future behavior

In Issue 09B:

- Display recent races directly inside the panel
- Use internal scrolling if there are many races
- Add race cards
- Add status badges
- Add empty/loading/error states
- Optionally add a “Show all races” action
- Later, clicking a race should navigate to the teacher race room page

---

## 7. Optional Future Live Updates Area

This is not implemented in Issue 09A.

However, the layout should allow this area in the future.

Possible future structure:

```text
TeacherDashboardContentArea
│
├── TeacherRacePanel
│
└── TeacherLiveUpdatesPanel
```

The live updates panel may later show:

- Students joining a race
- Race started / finished messages
- Recent race activity
- Turbo / streak / event notifications
- System messages

This should wait until the race flow and live update logic are ready.

Do not implement live updates in Issue 09A or 09B unless explicitly planned.

---

## 8. Recommended Component Names

### Current names to keep

```text
TeacherDashboardLayout
TeacherSidebar
TeacherHeroBanner
TeacherTopBar
TeacherStatsGrid
TeacherStatCard
TeacherRaceListPreview
```

### Future names for Issue 09B

```text
TeacherRacePanel
RaceList
RaceListItem
RaceStatusBadge
RaceEmptyState
RaceListLoadingState
RaceListErrorState
```

### Future names for dashboard activity/live updates

```text
TeacherLiveUpdatesPanel
LiveUpdateItem
```

---

## 9. Constants Organization

Current dashboard-related constants:

```text
teacherDashboardAssets.js
teacherDashboardContent.js
teacherDashboardConstants.js
localeConstants.js
```

### Responsibility

```text
teacherDashboardAssets.js
```

Used only for dashboard image/icon imports and asset lookup.

Examples:

- General background
- Hero image
- Sidebar logo
- Sidebar decorative illustration
- Dashboard icons

```text
teacherDashboardContent.js
```

Used for user-facing bilingual text.

Examples:

- Sidebar labels
- Hero text
- Top bar text
- Race preview text
- Stats labels

```text
teacherDashboardConstants.js
```

Used for non-user-facing dashboard configuration.

Examples:

- Stats config
- Internal dashboard keys
- Display configuration

```text
localeConstants.js
```

General helper for choosing the active language content.

### Rule

User-facing text should not live in config constants.

Use this rule:

```text
Text shown to the user -> teacherDashboardContent.js
Internal config / keys -> teacherDashboardConstants.js
Asset imports -> teacherDashboardAssets.js
Language helper -> localeConstants.js
```

---

## 10. What Issue 09A Includes

Issue 09A is only the teacher dashboard client foundation.

Included:

- Fixed dashboard layout
- Sidebar structure
- Hero/header structure
- Teacher identity area
- Stats cards
- Temporary race preview panel
- Dashboard assets
- Dashboard content/constants organization

Not included:

- Real RaceList
- CreateRaceModal
- Subject API connection
- Teacher dashboard real data integration
- Teacher race room page
- SSE
- PixiJS
- Student race screen
- Game engine
- Question generator

---

## 11. Next Step: Issue 09B

The next client task should focus only on the race panel.

Recommended Issue 09B scope:

```text
Race list UI + Race card components
```

Suggested implementation order:

```text
1. RaceStatusBadge
2. Empty / Loading / Error states
3. RaceListItem
4. RaceList
5. Integrate RaceList into the existing dashboard content area
6. Add internal scrolling inside the race panel
```

Do not rebuild the whole dashboard in Issue 09B.

The dashboard shell, sidebar, hero, and stats should stay stable.

Issue 09B should replace the temporary race preview with a real race list panel.

---

## 12. Important Rule For Diana / Next Developer

The dashboard is divided into fixed layout regions.

Do not treat it as a regular scrolling page.

New features should be added inside the existing panels, not by adding more vertical sections to the page.

Correct direction:

```text
Add RaceList inside the central race panel.
Add future live updates inside a dedicated dashboard panel.
Add scrolling inside the relevant panel only.
```

Wrong direction:

```text
Add more and more sections below the page.
Make the full page scroll.
Duplicate dashboard headers.
Create new layout shells for each feature.
```

---

# 5-Minute Refactor Options Before Next Task

The current structure is already acceptable. Do not do a large refactor before Issue 09B.

If there is time for a very small cleanup, use only one of the following prompts.

---

## Quick Refactor Prompt 1 — Add Clear Layout Region Comments

```text
Issue 09A cleanup only.

Files allowed:
- client/src/layouts/TeacherDashboardLayout.jsx
- client/src/pages/TeacherDashboardPage.jsx

Goal:
Make the teacher dashboard screen regions easier to understand for the next developer.

Required:
1. Do not change UI behavior.
2. Do not change layout classes.
3. Add short comments for:
   - dashboard shell
   - right sidebar region
   - main dashboard region
   - hero/header region
   - stats region
   - central race management region
4. Do not touch backend, docs, APIs, RaceList, CreateRaceModal, or 09B.
5. Run npm run build.

Report:
1. Files changed
2. Comments added
3. Build result
4. Confirm still Issue 09A cleanup only
```

---

## Quick Refactor Prompt 2 — Clarify Race Preview Placeholder

```text
Issue 09A cleanup only.

Files allowed:
- client/src/components/teacher/TeacherRaceListPreview.jsx

Goal:
Clarify that this component is a temporary placeholder for the future Issue 09B race panel.

Required:
1. Do not rename the component.
2. Do not redesign the UI.
3. Do not change text.
4. Add only a short comment near the component declaration.
5. Do not touch backend, docs, APIs, RaceList, CreateRaceModal, or 09B.
6. Run npm run build.

Report:
1. Files changed
2. Comment added
3. Build result
4. Confirm still Issue 09A cleanup only
```

---

## Quick Refactor Prompt 3 — No Code, Add Documentation Only

```text
Documentation-only task.

Files allowed:
- docs/teacher-dashboard-layout-plan.md

Goal:
Add a short documentation file explaining the Teacher Dashboard layout regions for the next developer.

Required:
1. Do not touch client code.
2. Do not touch backend.
3. Explain these screen regions:
   - right sidebar / navigation area
   - main dashboard area
   - hero/header area
   - stats area
   - central race management panel
   - future live updates area
4. Mention that the dashboard should behave like a fixed viewport app layout, not a long scrolling page.
5. Mention that Issue 09B should work inside the existing central race panel.

Report:
1. File created
2. Summary of sections
```

---

## Recommendation

Do not do a component rename right now.

Avoid this before Issue 09B:

```text
TeacherDashboardLayout -> TeacherDashboardShell
TeacherRaceListPreview -> TeacherRacePanel
TeacherTopBar -> TeacherIdentityControls
```

These names may be good later, but renaming now is not worth the PR noise.

For now, keep the code stable and move to Issue 09B.

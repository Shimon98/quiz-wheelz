# QuizWheelz — Teacher Dashboard Architecture Refactor Plan

## Purpose

This document defines the planned architecture for the QuizWheelz Teacher Dashboard before continuing to the next client tasks.

The goal is to refactor the dashboard into clear, independent screen regions so future work will be easier, safer, and less messy.

This is not only a visual cleanup.  
It is a code architecture cleanup.

The dashboard should not become one large page component where every feature affects every other feature.

Instead, the dashboard should be divided into stable regions:

1. Right sidebar / navigation
2. Main dashboard workspace
3. Hero / teacher header
4. Statistics section
5. Race management panel
6. Future live updates panel

Each region should have a clear responsibility.

---

## Core Architecture Rule

The dashboard must behave like an application screen, not a normal scrolling webpage.

Correct direction:

```text
Fixed dashboard shell
├── Fixed sidebar
└── Main workspace
    ├── Hero/header
    ├── Stats section
    └── Content panels
```

Wrong direction:

```text
One long page
├── Header
├── Stats
├── Race list
├── More content
├── More content
└── More content
```

The full page should not grow endlessly.

If a panel has many items, only that panel should scroll internally.

---

## High-Level Screen Structure

```text
TeacherDashboardLayout
│
├── TeacherSidebar
│   ├── SidebarBrand
│   ├── SidebarNavigation
│   │   └── SidebarNavItem
│   └── SidebarDecoration
│
└── TeacherDashboardMain
    ├── TeacherHeroBanner
    │   └── TeacherTopBar
    │
    ├── TeacherStatsSection
    │   └── TeacherStatsGrid
    │       └── TeacherStatCard
    │
    └── TeacherDashboardPanels
        ├── TeacherRacePanel
        │   └── TeacherRaceListPreview for now
        │
        └── TeacherLiveUpdatesPanel future
```

---

## 1. TeacherDashboardLayout

### Responsibility

`TeacherDashboardLayout` is the outer shell of the dashboard.

It should own only the main screen frame:

- Full viewport height
- General dashboard background
- Sidebar + main workspace layout
- Preventing page-level overflow
- Stable dashboard structure

### It should not own

- Race list rendering
- Stats card data mapping
- Sidebar item rendering details
- Teacher header internals
- Create race modal logic
- API logic

### Desired behavior

```text
height: 100vh
overflow: hidden
display: flex
```

### Children

```text
TeacherSidebar
TeacherDashboardMain
```

### Future data flow

Later, the layout should not need to know about races, stats, subjects, or API data.

It should only receive children or render the dashboard regions.

---

## 2. TeacherSidebar

### Responsibility

`TeacherSidebar` owns the right navigation area.

It should be a real planned region, not a visual placeholder.

It contains:

```text
TeacherSidebar
├── SidebarBrand
├── SidebarNavigation
│   └── SidebarNavItem rendered multiple times
└── SidebarDecoration
```

### Why split it

The sidebar will grow in the future.

Possible future additions:

- Active route state
- Teacher profile shortcut
- Admin-only links
- Disabled / coming soon links
- Different icons
- Collapsed sidebar
- Mobile sidebar
- Animated bottom decoration

If everything stays inside one large component, future changes will be harder.

---

## 2.1 SidebarBrand

### Responsibility

Displays the QuizWheelz logo / brand.

### Should include

- Logo image
- Fallback brand text if image is missing

### Should not include

- Navigation logic
- User data
- Logout
- Route state

### Suggested component

```text
SidebarBrand.jsx
```

### Props

```js
{
  logoSrc,
  logoText
}
```

---

## 2.2 SidebarNavigation

### Responsibility

Renders the list of navigation items.

### Should include

- Mapping over nav items
- Internal scrolling if needed
- Keeping the nav inside the sidebar height

### Should not include

- Logo
- Bottom illustration
- Dashboard page content

### Suggested component

```text
SidebarNavigation.jsx
```

### Props

```js
{
  items,
  content
}
```

---

## 2.3 SidebarNavItem

### Responsibility

Renders one navigation item.

This is important because every nav row is the same structure rendered multiple times.

### Should include

- Icon
- Label
- Active state
- Coming soon badge
- Hover style

### Should not include

- The whole nav list
- Logo
- Sidebar layout
- Route logic, unless added later

### Suggested component

```text
SidebarNavItem.jsx
```

### Props

```js
{
  item,
  label,
  icon,
  comingSoonLabel
}
```

### Future improvement

Later, `SidebarNavItem` can receive route information:

```js
{
  to,
  isActive,
  onClick
}
```

For now, it can stay visual only.

---

## 2.4 SidebarDecoration

### Responsibility

Displays the bottom decorative image or future animation.

### Current behavior

Static illustration.

### Future behavior

Can be replaced by:

- Animated WebP
- GIF
- CSS animation
- Small decorative car loop

### Important rule

This component should not affect the sidebar navigation layout.

It should stay at the bottom and not push the whole page.

### Suggested component

```text
SidebarDecoration.jsx
```

### Props

```js
{
  imageSrc
}
```

---

## 3. TeacherDashboardMain

### Responsibility

`TeacherDashboardMain` owns the center workspace.

It should define the main vertical structure:

```text
Hero
Stats
Panels
```

### Suggested component

```text
TeacherDashboardMain.jsx
```

### Children / structure

```text
TeacherDashboardMain
├── TeacherHeroBanner
├── TeacherStatsSection
└── TeacherDashboardPanels
```

### Props

```js
{
  teacherName,
  isLoggingOut,
  onLogout,
  stats
}
```

### Why this component matters

Right now the dashboard page can easily become overloaded.

This component keeps the page file clean and makes it clear that the main workspace is one independent region.

### It should not include

- Sidebar code
- API calls
- Race item details
- Modal logic

---

## 4. TeacherHeroBanner

### Responsibility

The top visual hero/header section.

It contains:

- Background image
- Welcome title
- Subtitle
- Teacher identity controls

### Child component

```text
TeacherTopBar
```

### Should include

- Image overlay
- Hero title
- Hero subtitle
- TopBar placement

### Should not include

- Sidebar
- Stats
- Race list
- API calls

---

## 5. TeacherTopBar

### Responsibility

Displays teacher identity and quick actions inside the hero.

It contains:

- Teacher name
- Teacher role
- Notification icon
- Logout button

### Props

```js
{
  teacherName,
  isLoggingOut,
  onLogout
}
```

### Important rule

Logout behavior should remain here only as a passed callback.

The component should not know how logout works internally.

---

## 6. TeacherStatsSection

### Responsibility

A wrapper around the statistics area.

### Suggested component

```text
TeacherStatsSection.jsx
```

### Why this should exist

The stats section is a separate dashboard region.

It should be easy to:

- Change spacing around all stats
- Add loading state for stats
- Add error state for stats
- Replace placeholder stats with API stats
- Keep stats separate from the race panel

### Structure

```text
TeacherStatsSection
└── TeacherStatsGrid
    └── TeacherStatCard rendered multiple times
```

### Props

```js
{
  stats
}
```

---

## 7. TeacherStatsGrid

### Responsibility

Maps stat configuration/data into stat cards.

### Should include

- Grid layout
- Mapping over stat items

### Should not include

- Individual card design details
- API calls
- Hardcoded user-facing text

### Current behavior

Renders multiple `TeacherStatCard` components.

This is correct.

---

## 8. TeacherStatCard

### Responsibility

Displays one statistics card.

This is a reusable component rendered multiple times.

### Props

```js
{
  label,
  value,
  icon,
  accent
}
```

### Future data flow

Later, a hook or API call can provide real stats:

```js
const stats = useTeacherDashboardStats();
```

Then `TeacherStatsGrid` will render the cards from that data.

The card itself should not care where the data came from.

---

## 9. TeacherDashboardPanels

### Responsibility

Owns the main content panel area under the stats.

### Suggested component

```text
TeacherDashboardPanels.jsx
```

### Current structure

```text
TeacherDashboardPanels
└── TeacherRacePanel
```

### Future structure

```text
TeacherDashboardPanels
├── TeacherRacePanel
└── TeacherLiveUpdatesPanel
```

### Why this matters

This is where future dashboard panels should be added.

For example:

- Race management
- Live updates
- Recent activity
- Quick actions

They should not be added randomly under the page.

---

## 10. TeacherRacePanel

### Responsibility

The main race management area.

### Suggested component

```text
TeacherRacePanel.jsx
```

### Current behavior

For now it wraps:

```text
TeacherRaceListPreview
```

### Future behavior in Issue 09B

It will contain:

```text
RacePanelHeader
RaceList
RaceListItem
RaceStatusBadge
RaceEmptyState
RaceListLoadingState
RaceListErrorState
```

### Important rule

Issue 09B should work inside `TeacherRacePanel`.

It should not change:

- Dashboard shell
- Sidebar
- Hero
- Stats layout

---

## 11. TeacherRaceListPreview

### Current responsibility

Temporary placeholder for Issue 09A.

It shows:

- Title
- Description
- Create race button
- Empty state

### Future direction

In Issue 09B, this can either:

1. Be replaced by `RaceList`
2. Or become an empty state inside `TeacherRacePanel`

### Important rule

Do not keep adding real race list logic into this preview component forever.

It is temporary.

---

## 12. Future Race List Components

These should be created in Issue 09B, not in the refactor.

### RaceList

Owns the list of races.

```text
RaceList
└── RaceListItem rendered multiple times
```

### RaceListItem

Displays one race.

Expected future data:

```js
{
  raceId,
  title,
  roomCode,
  subjectName,
  status,
  maxPlayers,
  currentPlayers,
  createdAt
}
```

### RaceStatusBadge

Displays visual race status.

Examples:

```text
Waiting
In progress
Finished
Cancelled
```

### RaceEmptyState

Displayed when there are no races.

### RaceListLoadingState

Displayed while races are loading.

### RaceListErrorState

Displayed when loading failed.

---

## 13. Future Live Updates Panel

This should not be implemented now.

### Suggested component

```text
TeacherLiveUpdatesPanel.jsx
```

### Future responsibility

Show recent teacher/race activity.

Examples:

- Student joined
- Race created
- Race started
- Race finished
- Turbo event
- Streak event
- System message

### Important rule

Live updates should be a separate panel.

Do not mix live updates into the race list component.

---

## 14. Data Flow Direction

The future data flow should look like this:

```text
API / Hook
   ↓
TeacherDashboardPage
   ↓
TeacherDashboardMain
   ↓
TeacherStatsSection / TeacherRacePanel
   ↓
Small display components
```

Example future hooks:

```js
useTeacherDashboardData()
useTeacherRaces()
useCreateRace()
useTeacherLiveUpdates()
```

### Rule

Data should flow down.

Small components should receive props.

Small display components should not fetch data directly.

---

## 15. Constants and Content Organization

### teacherDashboardContent.js

All user-facing text.

Examples:

- Sidebar labels
- Hero title/subtitle
- Top bar labels
- Stats labels
- Race panel text

### teacherDashboardConstants.js

Non-user-facing configuration.

Examples:

- Stats keys
- Internal config
- Temporary display config

### teacherDashboardAssets.js

Only asset imports and asset lookup.

Examples:

- Hero image
- General background
- Sidebar logo
- Sidebar decoration
- Icons

### Rule

```text
Text shown to the user -> teacherDashboardContent.js
Internal config -> teacherDashboardConstants.js
Images/icons -> teacherDashboardAssets.js
```

---

## 16. Refactor Work Plan

This refactor should be done before continuing to Issue 09B.

### Step 1 — Refactor Sidebar Internals

Create:

```text
SidebarBrand.jsx
SidebarNavigation.jsx
SidebarNavItem.jsx
SidebarDecoration.jsx
```

Update:

```text
TeacherSidebar.jsx
```

Goal:

`TeacherSidebar` becomes a composition component, not one large component.

---

### Step 2 — Refactor Main Workspace

Create:

```text
TeacherDashboardMain.jsx
TeacherStatsSection.jsx
TeacherDashboardPanels.jsx
TeacherRacePanel.jsx
```

Update:

```text
TeacherDashboardPage.jsx
```

Goal:

`TeacherDashboardPage` becomes cleaner and only connects auth/navigation data to the dashboard regions.

---

### Step 3 — Keep Visual Output Almost The Same

This refactor should not redesign the dashboard.

Allowed visual changes:

- Tiny spacing fixes if needed
- Preserve current viewport layout
- Preserve current hero/sidebar/stats/race preview look

Not allowed:

- New RaceList
- New modal
- New API integration
- New live updates
- New route behavior

---

### Step 4 — Verify Build and Diff

Run:

```bash
cd client
npm run build
cd ..
git status
git diff --stat
```

Check:

- No backend changes
- No docs changes unless this plan is intentionally added
- No 09B features
- No CreateRaceModal
- No API changes

---

## 17. Codex Prompt — Full Refactor Plan

Use this prompt if we want Codex to do the full small architecture refactor.

```text
We are doing a small architecture refactor before Issue 09B.

This is still Issue 09A cleanup / dashboard architecture only.

Goal:
Split the Teacher Dashboard into clear independent layout regions so future Issue 09B work can add the real race list without fighting the whole dashboard.

Do not change the visual design except for tiny spacing adjustments needed to preserve the current layout.

Allowed files:
- client/src/pages/TeacherDashboardPage.jsx
- client/src/layouts/TeacherDashboardLayout.jsx if needed
- client/src/components/teacher/TeacherSidebar.jsx
- client/src/components/teacher/TeacherStatsGrid.jsx if needed
- client/src/components/teacher/TeacherRaceListPreview.jsx if needed
- new files under client/src/components/teacher/

Create these components:

1. SidebarBrand.jsx
- Renders the sidebar logo / fallback brand.
- Receives logoSrc and logoText props.

2. SidebarNavigation.jsx
- Receives nav items and content.
- Maps items to SidebarNavItem.
- Owns nav scrolling area.

3. SidebarNavItem.jsx
- Renders one nav item.
- Receives item, label, icon, comingSoonLabel.
- Keeps active/coming soon styling.

4. SidebarDecoration.jsx
- Renders the bottom sidebar illustration.
- Receives imageSrc.

5. TeacherDashboardMain.jsx
- Owns the center workspace structure.
- Renders TeacherHeroBanner, TeacherStatsSection, TeacherDashboardPanels.
- Receives teacherName, isLoggingOut, onLogout, stats.

6. TeacherStatsSection.jsx
- Wraps TeacherStatsGrid as a clear dashboard region.
- Receives stats.

7. TeacherDashboardPanels.jsx
- Owns the remaining-space dashboard content area.
- For now renders TeacherRacePanel only.
- This is where future live updates can be added.

8. TeacherRacePanel.jsx
- Wraps the current TeacherRaceListPreview.
- This is the future home of the real RaceList in Issue 09B.

Update:
- TeacherSidebar.jsx to compose SidebarBrand, SidebarNavigation, SidebarDecoration.
- TeacherDashboardPage.jsx to render TeacherDashboardMain inside TeacherDashboardLayout.

Rules:
- Do not implement RaceList.
- Do not implement RaceListItem.
- Do not implement RaceStatusBadge.
- Do not implement CreateRaceModal.
- Do not add live updates UI.
- Do not touch backend.
- Do not touch API files.
- Do not touch routes.
- Do not add libraries.
- Do not rename assets.
- Keep all user-facing text in existing content constants.
- Keep NAV_ITEMS behavior unchanged.
- Keep fixed viewport behavior.
- Keep build passing.

Run:
npm run build

Report:
1. Files created
2. Files changed
3. Responsibility of each new component
4. Confirm visual output should remain almost identical
5. Build result
6. Confirm no Issue 09B feature was implemented
```

---

## 18. Smaller Codex Prompt — Main Workspace Only

Use this if we want a safer smaller refactor first.

```text
We are doing a very small dashboard center refactor before Issue 09B.

This is Issue 09A cleanup only.

Allowed files:
- client/src/pages/TeacherDashboardPage.jsx
- new files under client/src/components/teacher/

Goal:
Create clear center workspace components without changing the UI.

Create:

1. TeacherDashboardMain.jsx
- Receives teacherName, isLoggingOut, onLogout, stats.
- Renders:
  TeacherHeroBanner
  TeacherStatsSection
  TeacherDashboardPanels

2. TeacherStatsSection.jsx
- Receives stats.
- Wraps TeacherStatsGrid.

3. TeacherDashboardPanels.jsx
- Owns the remaining-space panel area under stats.
- For now renders TeacherRacePanel only.

4. TeacherRacePanel.jsx
- Wraps TeacherRaceListPreview.
- This is the future home of the real RaceList in Issue 09B.

Update:
- TeacherDashboardPage.jsx to render TeacherDashboardMain inside TeacherDashboardLayout.

Rules:
- Do not change visual design.
- Do not implement RaceList.
- Do not implement CreateRaceModal.
- Do not touch backend/docs/API/routes.
- Keep build passing.

Run npm run build.

Report:
1. Files created
2. Files changed
3. Build result
4. Confirm no 09B features were added
```

---

## 19. Smaller Codex Prompt — Sidebar Only

Use this if we want to refactor the sidebar separately.

```text
We are doing a small sidebar architecture refactor before Issue 09B.

This is Issue 09A cleanup only.

Allowed files:
- client/src/components/teacher/TeacherSidebar.jsx
- new files under client/src/components/teacher/

Goal:
Split TeacherSidebar into clear internal components without changing the UI.

Create:

1. SidebarBrand.jsx
- Renders logo/fallback brand.

2. SidebarNavigation.jsx
- Owns nav list and internal scrolling.

3. SidebarNavItem.jsx
- Renders one nav item.

4. SidebarDecoration.jsx
- Renders bottom illustration.

Update:
- TeacherSidebar.jsx to compose the new components.

Rules:
- Keep NAV_ITEMS behavior unchanged.
- Do not add route-based active state.
- Do not change nav labels.
- Do not touch backend/docs/API/routes.
- Do not implement 09B.
- Keep visual output almost identical.
- Run npm run build.

Report:
1. Files created
2. Files changed
3. Build result
4. Confirm no behavior changed
```

---

## Final Recommendation

Do the refactor in two small PR-safe steps:

1. Main workspace refactor
2. Sidebar internal refactor

Do not implement real race list until this structure is stable.

After this refactor, Issue 09B should work only inside:

```text
TeacherRacePanel
```

This will keep the dashboard maintainable and prevent future UI work from becoming messy.

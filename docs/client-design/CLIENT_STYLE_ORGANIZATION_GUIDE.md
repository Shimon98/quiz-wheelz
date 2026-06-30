# QuizWheelz — Client Style Organization Guide

## 1. Purpose

This document answers how to organize Tailwind styles and constants in the client.

It keeps the good idea Diana started — centralized style constants — but makes it more scalable and industry-friendly.

## 2. Main Recommendation

Do not keep one huge style file for a large feature.

Keep the idea of style constants, but split them by feature, component area, and responsibility.

## 3. What to Keep

Keep these ideas:

- Long Tailwind strings should not be repeated inside JSX.
- Reusable class groups should live in style files.
- Visual decisions should be easy to find.
- Components should stay readable.
- Feature UI should have its own style files.

## 4. What to Change

If a file becomes too large, split it.

Example problem:

```text
teacherDashboardStyles.js
```

Better:

```text
features/teacherDashboard/styles/
  teacherDashboardLayoutStyles.js
  teacherDashboardSidebarStyles.js
  teacherDashboardHeaderStyles.js
  teacherDashboardStatsStyles.js
  teacherDashboardRaceListStyles.js
  teacherDashboardMobileStyles.js
```

## 5. Recommended Style Levels

### Level 1 — Global Design Tokens

```text
client/src/styles/tokens.css
client/src/styles/themes.css
```

Contains color variables, typography tokens, radius, shadows, focus ring, z-index, light/dark values.

### Level 2 — Shared UI Component Styles

Inside shared components or:

```text
client/src/shared/styles/
```

Contains styles used by shared UI components.

### Level 3 — Feature Styles

Inside each feature:

```text
client/src/features/<feature>/styles/
```

Contains feature-specific layout and visual class groups.

## 6. Feature Style File Example

```js
export const STUDENT_JOIN_PAGE_STYLES = {
  page: "min-h-dvh bg-[var(--qw-bg)] text-[var(--qw-text)]",
  shell: "mx-auto flex w-full max-w-md flex-col px-5 py-6",
  card: "rounded-[var(--qw-radius-xl)] bg-[var(--qw-surface)] shadow-[var(--qw-shadow-card)]",
};
```

## 7. Content vs Style vs Config

Do not mix everything together.

Use:

```text
content/  for user-facing strings
styles/   for Tailwind class groups
config/   for non-secret constants and options
utils/    for pure helper functions
```

## 8. Good Feature Folder Example

```text
features/teacherDashboard/
  pages/
  components/
  hooks/
  content/
    teacherDashboardContent.js
  config/
    teacherDashboardNavConfig.js
    teacherDashboardStatsConfig.js
  styles/
    teacherDashboardLayoutStyles.js
    teacherDashboardSidebarStyles.js
    teacherDashboardStatsStyles.js
    teacherDashboardRaceListStyles.js
  utils/
    teacherDashboardViewModelUtils.js
```

## 9. What Not to Do

Avoid huge 800-line style files, repeated Tailwind class groups in JSX, feature-specific styles inside shared UI components, user text inside styles/config, and magic numbers scattered inside components.

## 10. Recommended Rule

If a style constant file is over roughly 200–250 lines, consider splitting it.

If a style group is used by only one tiny component and is short, inline classes are acceptable.

## 11. Recommendation for Diana's Current Approach

Keep the centralized constants idea.

Change only the file organization:

```text
from: one large style file
into: several focused style files per feature area
```

This keeps the benefit of readable JSX while making maintenance easier.

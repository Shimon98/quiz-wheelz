# QuizWheelz — Client Next Changes Plan

## 1. Purpose

This document explains what should change next in the QuizWheelz client after the design foundation documents were created locally.

It does not replace:

- `CLIENT_DESIGN_FOUNDATION.md`
- `CLIENT_DESIGN_FOUNDATION_HE.md`
- `CLIENT_IMPLEMENTATION_PHASES.md`

It turns those planning files into the next concrete repo steps.

---

## 2. Current Situation

The client design direction is already planned.

The current local files are:

```text
CLIENT_DESIGN_FOUNDATION.md
CLIENT_DESIGN_FOUNDATION_HE.md
CLIENT_IMPLEMENTATION_PHASES.md
```

The next goal is to organize these files in the repo and then continue with controlled implementation phases.

No application code should be changed before the repo docs and current-state audit are clean.

---

## 3. Immediate File Cleanup

### 3.1 Fix the file name with the extra space

If the local file is named:

```text
CLIENT_DESIGN_FOUNDATION .md
```

rename it to:

```text
CLIENT_DESIGN_FOUNDATION.md
```

The extra space before `.md` can cause confusion later.

### 3.2 Move files into the docs folder

Recommended final location:

```text
docs/CLIENT_DESIGN_FOUNDATION.md
docs/CLIENT_DESIGN_FOUNDATION_HE.md
docs/CLIENT_IMPLEMENTATION_PHASES.md
docs/CLIENT_NEXT_CHANGES_PLAN.md
```

### 3.3 Add design reference folder

Create:

```text
docs/design-references/
```

Save the approved design board image as:

```text
docs/design-references/quizwheelz-entry-main.png
```

Later, when separate design images are created, add:

```text
docs/design-references/quizwheelz-student-join-flow.png
docs/design-references/quizwheelz-teacher-auth.png
docs/design-references/quizwheelz-dark-mode-example.png
docs/design-references/quizwheelz-settings-popup.png
```

---

## 4. Important Documentation Fix

The English design file currently says that no design images are embedded yet, while the Hebrew file already references design images.

This should be synchronized.

Recommended decision:

- `CLIENT_DESIGN_FOUNDATION.md` is the official AI/coding source of truth.
- `CLIENT_DESIGN_FOUNDATION_HE.md` is the Hebrew reading version.
- Both files should describe the same decisions.
- Both files should reference the same design image folder.
- Do not leave broken image links in either file.

If only one design image exists right now, reference only:

```text
./design-references/quizwheelz-entry-main.png
```

Do not reference the student/teacher/dark/settings images until those files actually exist.

---

## 5. What Must Not Change Yet

Do not change application source code yet.

Do not edit:

```text
client/src/routes/AppRouter.jsx
client/src/features/auth/pages/LoginPage.jsx
client/src/shared/components/ui/PageBackground.jsx
client/src/shared/components/brand/AppLogo.jsx
client/src/shared/components/ui/TextInput.jsx
client/src/shared/components/ui/Button.jsx
client/src/shared/components/ui/Card.jsx
```

These files will be audited first, then changed in later phases.

Do not install packages yet.

Do not add i18n yet.

Do not migrate teacher login yet.

Do not continue GameEntry / Entry Preview visual experiments.

---

## 6. Next Required File: Current State Audit

Before implementation, create:

```text
docs/CLIENT_CURRENT_STATE_AUDIT.md
```

This audit should document what already exists in the client.

The audit should inspect and describe:

```text
client/package.json
client/src/routes/AppRouter.jsx
client/src/constants/routeConstants.js
client/src/api/httpClient.js
client/src/constants/apiEndpointConstants.js
client/src/shared/components/ui/Button.jsx
client/src/shared/components/ui/TextInput.jsx
client/src/shared/components/ui/Card.jsx
client/src/shared/components/ui/PageBackground.jsx
client/src/shared/components/brand/AppLogo.jsx
client/src/features/auth/pages/LoginPage.jsx
client/src/features/auth/components/LoginForm.jsx
client/src/features/teacherDashboard/constants/teacherDashboardAssets.js
client/src/styles/theme.js
```

The audit should answer:

1. What can be reused?
2. What is legacy and should be deprecated later?
3. Which files should not be touched yet?
4. Which components are safe to extend?
5. Which components are too tied to the old design?
6. Which assets can be moved to shared assets?
7. Which libraries are already installed?
8. Which package installs are still missing?
9. What is the safest first implementation phase?

---

## 7. Expected Audit Findings

Based on the current repo direction, likely findings are:

### Reusable

```text
Button
Card
React Router setup
Axios/httpClient pattern
Zustand pattern
Lucide icons
Some existing dashboard icons
Some existing feature/component structure
```

### Needs refactor or replacement later

```text
PageBackground
AppLogo as the main public/auth logo
TextInput styling
styles/theme.js old UI_CLASSES
large auth background images
```

### Must not be deleted immediately

```text
PageBackground
AppLogo
old login backgrounds
old gameLogo
teacher dashboard assets
```

These may still be used by the current working app. Deprecate gradually.

---

## 8. Implementation Order From Here

### Step 1 — Documentation cleanup only

Add/move docs and design image references.

No app code.

### Step 2 — Create current state audit

Create:

```text
docs/CLIENT_CURRENT_STATE_AUDIT.md
```

No app code.

### Step 3 — Design tokens plan

Create a plan for:

```text
client/src/styles/tokens.css
client/src/styles/themes.css
```

or JS token files.

No global migration yet.

### Step 4 — Minimal PublicEntryLayout

Create a new layout but do not migrate existing login yet.

Suggested future files:

```text
client/src/shared/layouts/PublicEntryLayout.jsx
client/src/shared/layouts/styles/publicEntryLayoutStyles.js
client/src/shared/layouts/config/publicEntryLayoutConfig.js
```

### Step 5 — Minimal public UI components

Only create what the first new page needs.

Possible files:

```text
client/src/shared/components/brand/QuizWheelzWordmark.jsx
client/src/shared/components/publicEntry/PublicEntryCard.jsx
client/src/shared/components/publicEntry/RoleSelectCard.jsx
```

### Step 6 — Student join two-step flow

Only after layout and components exist.

Flow:

```text
/join
→ room code
→ display name
→ POST /api/race-players/join
→ waiting page
```

Locked rule:

```text
QR can prefill room code.
RacePlayer is created only after display name submit.
```

### Step 7 — Teacher auth migration

Only after student join/public layout is stable.

### Step 8 — Settings popup and i18n

Add theme/language foundation after the layout is stable.

---

## 9. Claude / Codex Prompt for the Next Step

Use this prompt for the next AI coding assistant step:

```text
Project: QuizWheelz

We already created the client design foundation documents locally.

Current task:
Documentation organization only.

Do not change app code.
Do not install packages.
Do not touch routes.
Do not touch teacher dashboard.
Do not continue GameEntry or visual experiments.
Do not commit.

Goal:
1. Put the client design planning files under docs/.
2. Fix the filename CLIENT_DESIGN_FOUNDATION .md if it has an extra space.
3. Create docs/design-references/ if needed.
4. Add the approved design board image as docs/design-references/quizwheelz-entry-main.png if the file is available locally.
5. Make sure CLIENT_DESIGN_FOUNDATION.md and CLIENT_DESIGN_FOUNDATION_HE.md do not reference missing image files.
6. Add this file as docs/CLIENT_NEXT_CHANGES_PLAN.md.
7. Return a summary of changed documentation files only.

Important:
No client/src changes.
No package.json changes.
No backend changes.
No route changes.
No UI implementation yet.
```

---

## 10. Done of This Step

This step is done when:

- Docs are in `docs/`.
- Design reference folder exists.
- Existing design image link works.
- No broken image references remain.
- No application code changed.
- Next audit step is clear.

---

## 11. Next Step After This File

After this file is added, the next file should be:

```text
docs/CLIENT_CURRENT_STATE_AUDIT.md
```

Only after the audit is approved should implementation begin.

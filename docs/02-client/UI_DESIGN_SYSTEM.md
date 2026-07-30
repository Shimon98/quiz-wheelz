# UI Design System

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the approved visual identity, actual color tokens, component ownership and responsive rules

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Product direction

```text
Jungle Monkey Hover-Kart Learning Race
```

The product should feel playful, safe, clear and polished for children while
remaining professional and readable for teachers.

## Actual brand primitives

These values come from the current token implementation:

| Token | Value | Use |
|---|---:|---|
| Jungle green | `#2FA84F` | primary action |
| Deep green | `#1D7A39` | depth/hover |
| Soft green | `#E6F6EC` | student soft surface |
| Sky | `#3BA9F4` | secondary/info |
| Deep sky | `#1E6FB8` | teacher/secondary |
| Banana | `#FFD43B` | playful accent |
| Gold | `#F5A623` | trophy/achievement |
| Race red | `#E5484D` | error/danger |
| Navy | `#0F2A43` | strong brand/text |
| Deep navy | `#0A1D2E` | dark background |

Do not copy the older green palette from planning files. CSS tokens and Mantine theme
are the implementation source of truth.

## Semantic tokens

Components consume:

```text
--qw-bg
--qw-surface
--qw-surface-alt
--qw-text
--qw-text-muted
--qw-border
--qw-primary
--qw-secondary
--qw-accent
--qw-success
--qw-warning
--qw-error
--qw-info
```

Dark mode is deep jungle/navy, not pure black with neon colors.

## Typography and shape

- rounded, readable headings/body
- bold action labels
- large readable numbers in game HUD
- radius from shared scale
- navy-tinted shadows
- visible focus ring
- large mobile tap targets.

Use the fonts already approved/loaded by the project; do not add a new font per
screen.

## Component ownership

### Mantine

Normal UI:

- Button, ActionIcon
- TextInput, PasswordInput, PinInput, Select, NumberInput
- Paper, Card, Grid, Stack, Group
- Modal, Drawer, Menu, Popover, Tooltip
- Alert, Notification, Loader, Skeleton
- Badge, Progress, Table
- form and disclosure hooks.

### Custom composition

Only QuizWheelz-specific visuals:

- public hero + overlapping sheet
- jungle decorative layers
- teacher branded sidebar/hero
- student full-screen game frame
- Pixi world and game effects
- question-panel decorative frame.

## Responsive rules

### Student

Mobile-first, full viewport. Supported checks:

```text
320, 375, 390, 430, 768, 1024
```

- no horizontal scroll
- no required keyboard during race
- question and all four answers remain reachable
- world visible above the persistent panel
- safe-area support.

### Public entry

```text
< 1200px: hero on top + overlapping white sheet
≥ 1200px: connected split composition
```

Do not switch at 1024px.

### Teacher

- desktop/tablet workspace
- desktop sidebar
- mobile navigation
- tables become cards/lists instead of squeezed tables
- projector live screen prioritizes track and leaderboard.

## Screen-state requirement

Every async screen must design:

```text
loading
error
empty
disabled/submitting
success/feedback
reconnect/session expired when relevant
```

## Accessibility

- semantic labels
- keyboard navigation for teacher/admin UI
- visible focus
- sufficient contrast
- reduced motion
- dialogs with focus management
- readable RTL/LTR
- no text baked into images.

# QuizWheelz — Mantine-First Implementation Roadmap

## 1. Core rule

This can be a large refactor, but it must be staged safely.

Do not combine:
- UI library migration
- route changes
- auth behavior changes
- backend changes
- game implementation
- full dashboard rewrite

in one uncontrolled pass.

## 2. Priority order

```text
1. Docs cleanup and Mantine-first decision
2. Claude/Mantine/ReactBits setup
3. Mantine provider + theme
4. PublicEntryShell responsive fix
5. Landing/auth UI refactor with Mantine
6. Student join flow with Mantine
7. Create race modal with Mantine
8. Teacher waiting room polish
9. Student race UI shell
10. Teacher live race shell
11. Result screens
12. Cleanup old UI code
```

## 3. UI-00 — Documentation cleanup

Goal:
- replace old shadcn/Tailwind-first docs
- commit the new Mantine-first docs

Done:
- old docs archived or removed
- new docs committed
- Claude prompt ready

## 4. UI-01 — AI tooling setup

Goal:
- make Claude able to inspect Mantine and ReactBits components quickly

Tasks:
- add Mantine MCP/docs setup to Claude environment if available
- add Mantine skills if Claude Code supports them
- add ReactBits registry/MCP setup only if animations are needed

Done:
- Claude can query Mantine docs/components/props
- Claude can inspect ReactBits registry before adding animated snippets

## 5. UI-02 — Mantine foundation

Tasks:
- install Mantine core packages
- add CSS imports
- add MantineProvider
- add ModalsProvider
- add Notifications
- create QuizWheelz Mantine theme
- decide theme interaction with any existing ThemeProvider

Done:
- app builds
- current routes still render
- Mantine Button/Input/Modal smoke test works
- RTL still works

## 6. UI-03 — PublicEntryShell responsive fix

Goal:
- fix the landing layout before adding more screens

Tasks:
- keep shell custom
- desktop split only at 1200px+
- phone/tablet: hero top + white sheet
- settings overlay inside shell
- hero uses responsive height
- object-position protects mascot/kart crop
- no horizontal scroll

QA:
```text
320
375
390
430
768
1024
1200
1366
1440
```

Done:
- 1024px tablet portrait no longer gets broken desktop split
- landing feels like product page, not small centered frame

## 7. UI-04 — Landing content with Mantine

Tasks:
- use Mantine Paper/Card/UnstyledButton/ActionIcon/Text/Title where useful
- keep hero shell custom
- role cards can become Mantine-based
- settings menu can use Mantine Menu/Popover/ActionIcon

Done:
- landing uses Mantine for normal UI
- custom CSS only remains for shell/hero composition

## 8. UI-05 — Teacher auth with Mantine

Screens:
- login
- register
- forgot password
- verify code
- reset password

Tasks:
- use @mantine/form
- use TextInput, PasswordInput, PinInput, Checkbox, Button, Alert
- connect login to existing auth API
- keep old LoginPage until new route works

Done:
- teacher login works end-to-end
- old auth UI can be deprecated

## 9. UI-06 — Student join flow with Mantine

Screens:
- room code
- display name
- waiting page

Rules:
- QR/link only pre-fills room code
- RacePlayer is created only after display name submit
- use @mantine/form
- use Mantine PinInput/TextInput/Button/Card/Loader/Alert

Done:
- mobile-first flow works
- backend errors are handled
- no client game logic

## 10. UI-07 — Create race modal with Mantine

Tasks:
- use Mantine Modal or Drawer
- use @mantine/form
- use Select, NumberInput, TextInput, SegmentedControl, Checkbox
- only show fields supported by backend
- future fields documented but not fake-enabled

Done:
- teacher can create race
- modal/drawer is responsive
- validation is clear

## 11. UI-08 — Teacher dashboard critical refactor

Goal:
- use Mantine to reduce custom dashboard UI where it matters for submission

Tasks:
- do not rewrite every dashboard component if it works
- replace high-value pieces:
  - cards
  - stats
  - race list
  - badges
  - loading/error/empty states
  - modals
  - menu/settings

Done:
- dashboard looks consistent
- old huge style files stop growing

## 12. UI-09 — Teacher waiting room

Tasks:
- use Mantine Card/Paper/Grid/Badge/Button/CopyButton/Notification
- show room code
- participants
- player count
- start button
- responsive layout

Done:
- waiting room is usable on desktop/tablet
- no fake participants if backend has real data

## 13. UI-10 — Student race UI shell

Tasks:
- PixiJS placeholder or real canvas area
- Mantine overlay for:
  - question card
  - answer buttons
  - progress
  - timer
  - score
  - feedback alert

Rules:
- frontend does not validate correctness
- frontend does not calculate score/progress

## 14. UI-11 — Teacher live race shell

Tasks:
- Mantine panels/cards/table/progress/leaderboard
- consume server state when available
- no frontend race calculations

## 15. UI-12 — Results

Tasks:
- student result screen
- teacher summary screen
- Mantine cards, table, badges, progress, notifications
- ReactBits celebration if lightweight

## 16. UI-13 — Cleanup

Delete old UI only after zero imports:
- AuthButton
- TextInput legacy
- AuthCard
- PageBackground
- AppLogo legacy
- styles/theme.js / UI_CLASSES
- old Button/Card/Modal/Badge if replaced

Done:
- build passes
- no dead imports
- docs match code

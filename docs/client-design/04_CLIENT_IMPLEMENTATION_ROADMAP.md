# QuizWheelz — Mantine-First Implementation Roadmap

> Updated order after UI-05: teacher flow first, then student flow.  
> Purpose: keep the roadmap close to the original, but reorder the next UI stages according to the real product flow and the teacher dashboard visual references.

---

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

The current direction is:

```text
Teacher product flow first:
teacher auth → teacher dashboard → create race → teacher waiting room
then:
student join → student waiting/race → teacher live race → results
```

Why:
- A student cannot join a useful flow before the teacher can create and manage a race.
- The old dashboard visual language is no longer the target.
- The teacher dashboard becomes the design anchor for the rest of the app.
- Each new screen should replace old UI gradually, then old files are removed only after import checks.

---

## 2. Visual references from the uploaded images

### Reference A — Teacher dashboard desktop

The main desktop dashboard image shows the target direction for the teacher area:
- Left fixed sidebar with the QuizWheelz logo.
- Jungle/race visual at the bottom of the sidebar.
- Top bar with settings, language, theme and teacher profile.
- Main dashboard content with greeting, large create-race button, stat cards and races table.
- Race rows include thumbnail, race name, room code, subject, status, players and action buttons.

This image defines the direction for:
```text
UI-06 — Teacher dashboard Mantine foundation
UI-07 — Create race action entry point
UI-08 — Teacher waiting room continuation
```

### Reference B — Teacher dashboard flow up to date

The flow image shows the order of the teacher product:
```text
1. Teacher dashboard desktop
2. Teacher dashboard mobile
3. Create new race
4. Race screen / active race view
5. Race summary / results
```

This image confirms that the correct implementation order should be teacher-first:
```text
dashboard → create race → waiting/room → live race → summary
```

Student join should come after the teacher has a working race room and room code screen.

---

## 3. Updated Priority order

```text
1. Docs cleanup and Mantine-first decision
2. Claude/Mantine/ReactBits setup
3. Mantine provider + theme
4. PublicEntryShell responsive fix
5. Landing/auth UI refactor with Mantine

6. Teacher dashboard Mantine foundation
7. Create race modal/drawer with Mantine
8. Teacher waiting room / race room with Mantine
9. Student join + student waiting flow with Mantine
10. Student race UI shell
11. Teacher live race shell
12. Result screens
13. Cleanup old UI code
```

---

## 4. UI-00 — Documentation cleanup

Goal:
- replace old shadcn/Tailwind-first docs
- commit the new Mantine-first docs
- keep this roadmap aligned with the current teacher-first UI order

Done:
- old docs archived or removed
- new docs committed
- Claude prompt ready
- roadmap reflects the real product flow

---

## 5. UI-01 — AI tooling setup

Goal:
- make Claude able to inspect Mantine and ReactBits components quickly

Tasks:
- add Mantine MCP/docs setup to Claude environment if available
- add Mantine skills if Claude Code supports them
- add ReactBits registry/MCP setup only if animations are needed

Done:
- Claude can query Mantine docs/components/props
- Claude can inspect ReactBits registry before adding animated snippets

---

## 6. UI-02 — Mantine foundation

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

---

## 7. UI-03 — PublicEntryShell responsive fix

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

---

## 8. UI-04 — Landing content with Mantine

Tasks:
- use Mantine Paper/Card/UnstyledButton/ActionIcon/Text/Title where useful
- keep hero shell custom
- role cards can become Mantine-based
- settings menu can use Mantine Menu/Popover/ActionIcon

Done:
- landing uses Mantine for normal UI
- custom CSS only remains for shell/hero composition

---

## 9. UI-05 — Teacher auth with Mantine

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
- keep old LoginPage only until the new route works
- do not fake server behavior for register/forgot-password before backend is ready

Done:
- teacher login works end-to-end
- old auth UI can be deprecated
- `/login` should redirect or be removed only after the new teacher login is verified
- register / forgot-password screens can stay client-ready, but server-pending

---

## 10. UI-06 — Teacher dashboard Mantine foundation

Goal:
- rebuild the teacher dashboard direction first, because it is the center of the product flow.

Visual reference:
- Based on the desktop dashboard image and the mobile dashboard screen in the flow image.
- The dashboard should feel like the new QuizWheelz product, not the old custom UI.

Tasks:
- build or refactor the teacher dashboard shell with Mantine-first components
- keep the existing API/hook logic where possible
- create a clean teacher dashboard layout:
  - sidebar on desktop
  - mobile top/bottom navigation on small screens
  - top bar with settings/language/theme/profile
  - greeting area
  - create-race primary action
  - stats cards
  - races list/table
- use Mantine for:
  - AppShell / layout parts where useful
  - Paper/Card
  - SimpleGrid/Grid
  - Table or cards list
  - Badge
  - Button / ActionIcon
  - Menu
  - Loader / Skeleton
  - Alert / Empty state
- preserve RTL support
- preserve existing dashboard API calls
- do not implement game logic
- do not rewrite backend
- do not delete old dashboard files until zero imports remain

Design notes from image:
- left sidebar should hold logo and navigation
- jungle decoration may stay decorative only
- main dashboard should have large spacing and rounded cards
- create race button should be visually primary
- race rows should show room code, status, subject, players and actions
- mobile dashboard should compress into card/list layout, not a desktop table squeezed into a phone

Done:
- teacher dashboard loads real data
- dashboard matches the new visual direction
- old huge dashboard style files stop growing
- loading/error/empty states are Mantine-based
- no horizontal scroll on mobile/tablet
- no old UI replacement is deleted before import verification

---

## 11. UI-07 — Create race modal/drawer with Mantine

Goal:
- create the race creation flow in the new dashboard style.

Visual reference:
- Based on screen 3 in the flow image: “יצירת מרוץ חדש”.
- The form should feel like part of the teacher dashboard, not a separate old modal.

Tasks:
- use Mantine Modal or Drawer
- use @mantine/form
- use Select, NumberInput, TextInput, SegmentedControl, Checkbox where useful
- only show fields supported by backend
- future fields are documented but not fake-enabled
- keep validation clear and friendly
- after successful creation, refresh dashboard data and/or navigate to the race room

Recommended fields for current backend-supported flow:
- race title
- subject
- max players
- total distance / race length if supported
- optional settings only if backend supports them

Out of scope:
- no advanced game rules
- no vehicle selection
- no question settings that the server cannot save yet
- no fake toggles that appear to work but are ignored

Done:
- teacher can create race from the dashboard
- modal/drawer is responsive
- validation is clear
- created race appears in the dashboard
- create action can lead naturally into the waiting room

---

## 12. UI-08 — Teacher waiting room / race room with Mantine

Goal:
- after race creation/opening, the teacher sees a clear room screen with code, participants and start action.

Visual reference:
- This is the missing bridge between the create-race screen and the active race screen.
- It should reuse the same dashboard shell style from UI-06 and the same card language from the images.

Tasks:
- use Mantine Card/Paper/Grid/Badge/Button/CopyButton/Notification
- show room code clearly
- allow copy room code
- show race title, subject, status and player count
- show joined participants from real backend data
- show empty waiting state when no players joined
- show start button with disabled/loading/error states
- keep start action server-owned
- keep ownership/security behavior from backend
- no fake participants if backend has real data

Suggested layout:
```text
Header: race title + status
Main card: room code + copy/share/QR later
Participants area: slots/cards
Action panel: start race / back to dashboard
```

Done:
- waiting room is usable on desktop/tablet
- teacher can clearly share the room code
- teacher sees real participants after students join
- start button uses server state and handles errors
- no frontend race/game calculations

---

## 13. UI-09 — Student join + student waiting flow with Mantine

Goal:
- build the mobile-first student join flow only after the teacher can create/open a race room.

Important UX decision:
- for now, use one join form:
```text
room code + display name → submit once
```

Reason:
- the current join endpoint receives both `roomCode` and `displayName` together.
- splitting the flow into “code first” and “name second” would only discover invalid room codes after the second step unless a new backend validation endpoint is added.
- children should not lose progress or move through unnecessary screens if the code is wrong.

Screens:
- student join page
- student waiting page after successful join

Rules:
- QR/link can pre-fill room code
- RacePlayer is created only after submit
- use @mantine/form
- use Mantine TextInput/PinInput/Button/Card/Loader/Alert
- backend errors stay on the same form
- do not add vehicle selection until backend supports it
- no client game logic

Future option:
- if backend adds a safe room preview endpoint, the student join flow can become:
```text
room code verification → display name → waiting
```

Done:
- mobile-first flow works
- backend errors are handled
- student can join a waiting race
- student moves to a waiting page
- no client game logic
- no unsupported vehicle picker

---

## 14. UI-10 — Student race UI shell

Goal:
- create the first mobile student race screen shell for answering questions.

Tasks:
- PixiJS placeholder or real canvas area
- Mantine overlay for:
  - question card
  - answer buttons
  - progress
  - timer
  - score
  - feedback alert
- connect to real question/answer APIs when available
- keep touch targets large
- keep phone layout first

Rules:
- frontend does not validate correctness
- frontend does not calculate score/progress
- frontend does not decide winner
- server owns race/game rules

Done:
- student can see the race/question shell
- UI is mobile-first
- no keyboard required for answers
- answer buttons are clear and child-friendly

---

## 15. UI-11 — Teacher live race shell

Goal:
- build the teacher live race view after dashboard, race creation, waiting room and student join exist.

Visual reference:
- Based on screen 4 in the flow image: teacher live race view.
- The view should show race progress, leaderboard and live updates in the teacher dashboard style.

Tasks:
- Mantine panels/cards/table/progress/leaderboard
- consume server state when available
- show players and progress
- show leaderboard
- show race status
- prepare for SSE later
- no frontend race calculations

Rules:
- frontend renders server state only
- no fake winner logic
- no scoring in React
- no per-frame server writes

Done:
- teacher can open active race screen
- real players/progress can render when backend state exists
- screen is ready for SSE/live updates later

---

## 16. UI-12 — Result screens

Goal:
- show race summary after race finish.

Visual reference:
- Based on screen 5 in the flow image: race summary / final winner card.

Tasks:
- student result screen
- teacher summary screen
- winner card
- leaderboard / final ranking
- stats cards
- Mantine cards, table, badges, progress, notifications
- ReactBits celebration only if lightweight and not distracting

Rules:
- server owns final ranking and statistics
- frontend only displays results

Done:
- teacher can see final race summary
- student can see personal/final result
- layout matches the new dashboard style

---

## 17. UI-13 — Cleanup

Delete old UI only after zero imports:
- AuthButton
- TextInput legacy
- AuthCard
- PageBackground
- AppLogo legacy
- styles/theme.js / UI_CLASSES
- old Button/Card/Modal/Badge if replaced
- old dashboard style/components after Mantine replacements are verified

Cleanup policy:
```text
1. Build replacement
2. Switch imports
3. Test screen
4. Search imports
5. Delete only if zero imports remain
6. Run npm run lint
7. Run npm run build
```

Done:
- build passes
- lint passes
- no dead imports
- docs match code
- no duplicate UI system remains in the main flow

---

## 18. Current next step

The next practical task is:

```text
UI-06 — Teacher dashboard Mantine foundation
```

Recommended branch:

```bash
git checkout main
git pull origin main
git checkout -b ui-06-teacher-dashboard-mantine
```

If UI-05 is still on a branch, merge UI-05 first, then start UI-06 from updated main.

UI-06 should not include:
- student join
- backend changes
- game/race engine
- full results screen
- final cleanup of unrelated old UI

UI-06 should include:
- the teacher dashboard visual foundation
- Mantine-first dashboard components
- real existing dashboard data
- responsive desktop/mobile behavior
- clear route/action path toward creating a race

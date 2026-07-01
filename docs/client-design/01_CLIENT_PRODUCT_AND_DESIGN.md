# QuizWheelz — Product and Design Direction

## 1. Product identity

Approved direction:

```text
Jungle Monkey Kart Learning Race
```

QuizWheelz should feel:
- modern
- playful
- educational
- safe
- fast
- clear
- mobile-first for students
- professional enough for teachers

## 2. Target users

```text
Students:
Mostly phone users. Need large tap targets, short flows, strong visual hierarchy.

Teachers:
Mostly desktop/tablet users. Need clear dashboard, race creation, waiting room, and live race view.
```

## 3. Visual identity

Main mascot direction:

```text
A cute original monkey driving a kart in a jungle racing world.
```

Logo direction:

```text
Banana + checkered flag + QuizWheelz wordmark
```

## 4. Brand palette

Use these as the product colors and map them into Mantine theme.

```text
Jungle Green:   #35B51F
Deep Green:     #248C17
Sky Blue:       #2F8CFF
Banana Yellow:  #F7C948
Trophy Gold:    #F4B400
Race Red:       #EF4444
Deep Navy:      #10213F
```

Light mode:

```text
Background:     #F7FBF2
Surface:        #FFFFFF
Surface Soft:   #F2F8EF
Text Strong:    #10213F
Text Muted:     #64748B
Border:         #DDE7D8
Primary:        #35B51F
Secondary:      #2F8CFF
Accent:         #F7C948
Error:          #EF4444
```

Dark mode:

```text
Background:     #07140F
Surface:        #12251C
Surface Soft:   #183426
Text Strong:    #F8FAFC
Text Muted:     #B6C2CF
Border:         #2D4A38
Primary:        #5DE34D
Secondary:      #60A5FA
Accent:         #FFD166
Error:          #FB7185
```

Dark mode must feel like deep jungle/navy, not black + neon.

## 5. Typography

Preferred fonts:

```text
Fredoka / Varela Round / Rubik / Heebo
```

Recommended:
- Headings: bold rounded font
- Body: readable rounded font
- Buttons: bold
- HUD/numbers: bold rounded display style

## 6. What Mantine should own

Mantine should own normal application UI:
- forms
- inputs
- buttons
- cards/papers
- modals
- drawers
- menus
- badges
- alerts
- tables
- loaders
- skeletons
- notifications
- tabs
- progress
- layout primitives

## 7. What stays custom

Custom layout/CSS is allowed only for QuizWheelz-specific visuals:

```text
PublicEntryShell
Hero image composition
Jungle/mascot/kart visuals
Mobile hero + white sheet behavior
Desktop split frame behavior
PixiJS race scene
Game-specific animation layers
```

## 8. Public entry / landing design rules

The public entry shell is a product landing/auth shell, not a generic form page.

Mobile/tablet portrait:

```text
Hero image at top.
White card/sheet overlaps the hero.
Role cards and auth forms live inside the white sheet.
Settings button is overlayed, not layout flow.
No huge dead area above the hero.
```

Wide desktop, 1200px+:

```text
Hero side + card side.
Hero and card feel like one connected composition.
RTL: hero on left, card on right.
LTR: mirror logically.
```

Important breakpoint rule:

```text
Do not switch to desktop side-by-side at Tailwind lg = 1024px.
Use 1200px+ for desktop split.
Tablet portrait should stay top-hero + sheet.
```

## 9. Settings menu

Public/auth screens:
- settings gear overlay
- language
- appearance
- reduced motion / accessibility later
- sound later

Dashboard:
- settings in sidebar or user menu

Do not place separate dark-mode buttons outside settings.

## 10. Footer

Public/auth screens should include:
- all rights reserved
- terms
- privacy

## 11. Assets

Preferred future asset folders:

```text
assets/brand/
assets/mascot/
assets/illustrations/
assets/game/
```

Use WebP/AVIF for large hero images where possible.

The image assets provide identity; Mantine provides app UI.

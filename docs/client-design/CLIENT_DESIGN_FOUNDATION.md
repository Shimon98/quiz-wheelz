# QuizWheelz — Client Design Foundation

## 1. Purpose

This document defines the new visual direction for the QuizWheelz client.

The goal is to build one consistent visual language across public pages, student flows, teacher flows, gameplay screens, and result screens.

## 2. Approved Visual Direction

The selected direction is:

```text
Jungle Monkey Kart Learning Race
```

## 3. Product Feeling

QuizWheelz should feel modern, friendly, playful, educational, fast, safe, clear, mobile-first for students, and professional enough for teachers.

## 4. Mascot Direction

The main mascot is:

```text
A cute monkey driving a kart in a jungle racing world.
```

The mascot should be friendly, energetic, child-safe, original, not based on copyrighted characters, and usable in multiple poses.

Future mascot poses:

```text
monkey driving
monkey waving
monkey celebrating
monkey waiting
monkey sad/confused for error states
monkey result/winner pose
```

## 5. Logo Direction

The new logo direction is:

```text
Banana + checkered flag + QuizWheelz wordmark
```

Why:

- Banana connects to the monkey mascot.
- Checkered flag clearly communicates racing.
- It avoids the previous wheel/flag symbol that could look like a wheelchair.
- It works well for children and teachers.

## 6. Color Palette

The new palette should be inspired by the jungle race image, but implemented as a clean app design system.

### Primary Colors

```text
Jungle Green:   #35B51F
Deep Green:     #248C17
Sky Blue:       #2F8CFF
Banana Yellow:  #F7C948
Trophy Gold:    #F4B400
Race Red:       #EF4444
Deep Navy:      #10213F
```

### Light Mode

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

### Dark Mode

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

## 7. Dark Mode Principle

Dark mode should not be black + neon. Use deep navy / dark jungle green + readable white text + controlled brand accents.

## 8. Typography

Recommended fonts:

- Heebo
- Rubik

Suggested use:

```text
Headings: Rubik or bold Heebo
Body: Heebo
Buttons: bold Heebo/Rubik
Numbers/HUD: bold rounded display style
```

## 9. Student Screens

Student screens are mobile-first and must have large tap targets, short flows, strong visual hierarchy, and desktop/tablet fallback.

## 10. Teacher Screens

Teacher screens should be more professional than student screens, still branded, less visually noisy, clear on desktop, and usable on mobile.

## 11. Settings Menu

All public/auth screens should include a small gear settings button.

Settings menu should include:

```text
Language: Hebrew / English
Appearance: Light / Dark / System
Accessibility: Reduced motion / High contrast later
Sound: Music / sound on-off later
```

Important decision:

```text
Do not place separate dark mode buttons outside settings.
Appearance belongs inside settings.
```

In teacher dashboard, settings should live in the sidebar or user menu.

## 12. Footer Links

Landing and public/auth screens should include:

```text
All rights reserved
Terms of Use
Privacy Policy
```

## 13. Visual Assets

Recommended asset groups:

```text
brand/
  quizwheelz-logo.svg
  quizwheelz-icon.svg
mascot/
  monkey-driving.webp
  monkey-waving.webp
  monkey-waiting.webp
  monkey-celebrating.webp
illustrations/
  jungle-entry-hero.webp
  teacher-auth-illustration.webp
  student-waiting-illustration.webp
game/
  jungle-road-background.webp
  monkey-kart-back.webp
  opponent-kart-green.webp
  opponent-kart-blue.webp
  opponent-kart-purple.webp
  dust-spritesheet.webp
```

## 14. What Is Built in Code

Build cards, forms, inputs, buttons, badges, dashboard panels, lists, settings popup, theme switching, layouts, question card, and answer buttons in React/Tailwind.

## 15. What Is Built as Assets

Use image/SVG assets for mascot, jungle illustration, race background, kart sprites, trophy art, and logo symbol if needed.

## 16. PixiJS Race Direction

Student race visual direction:

```text
Pseudo-3D / over-the-shoulder jungle kart race.
```

PixiJS owns the race scene rendering. React owns the question card, answers, timer, score, combo, position, and UI states.

The frontend may animate but must not own game rules.

## 17. Locked UX Decisions

1. Student screens are mobile-first.
2. Student screens still work on desktop.
3. QR links only prefill room code.
4. RacePlayer is created only after display name submit.
5. Public/auth pages share one visual system.
6. Settings contain language/theme/accessibility/sound.
7. Teacher dashboard settings belong in sidebar/user menu.
8. The monkey mascot is the main visual candidate.
9. The banana + flag logo direction is approved for exploration.
10. PixiJS remains the race renderer direction for now.

# QuizWheelz — UI Library Decision

## 1. Selected Direction

QuizWheelz will keep Tailwind CSS as the main styling foundation.

For reusable UI components, the preferred direction is to use `shadcn/ui` selectively.

## 2. Why shadcn/ui

shadcn/ui fits the project because:

- It works well with Tailwind.
- It provides accessible component patterns.
- It gives the project ownership over component code.
- It supports gradual adoption.
- AI tools can inspect and modify the copied component code.
- It does not require adopting a full visual system all at once.

## 3. What We May Use

Potential shadcn/ui components:

```text
Button
Card
Input
Label
Dialog
Popover
Tabs
Switch
Select
Badge
Alert
Skeleton
Table
Form
Separator
```

## 4. Adoption Rule

Add a component only when a real issue needs it.

Do not install or import many components just because they exist.

## 5. First Good Targets

Good first targets:

```text
Popover / Dialog / Switch
```

For public settings popup, theme mode selector, language selector, accessibility/sound switches.

Next targets: Input, Label, Form, Card, Button for student join and teacher auth.

## 6. What We Will Not Do

Do not:

- Import a full UI system at once.
- Rewrite the whole app to shadcn.
- Mix shadcn, daisyUI, Mantine, and Headless UI together.
- Add daisyUI now.
- Add Mantine now.
- Add Headless UI if Radix/shadcn already covers the needed primitive.

## 7. daisyUI Decision

Rejected for now as the main UI foundation.

Reason: fast and theme-friendly, but may make QuizWheelz feel generic and less aligned with a custom product identity.

## 8. Mantine Decision

Rejected for now.

Reason: powerful but too invasive for the current Tailwind-based direction. It would introduce another design system and provider layer.

May be reconsidered for a future admin dashboard only.

## 9. Headless UI Decision

Optional only if shadcn/Radix is not used for the same primitive.

Do not add it now.

## 10. Customization Rule

Every adopted component must be adapted to QuizWheelz tokens, RTL, dark mode, and accessibility rules.

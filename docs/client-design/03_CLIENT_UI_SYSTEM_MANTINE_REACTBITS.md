# QuizWheelz — UI System: Mantine First + ReactBits Polish

## 1. Main decision

```text
Mantine is the primary UI library.
ReactBits is optional animated polish.
Custom CSS/Tailwind is for brand/game visuals only.
```

## 2. Mantine-first rule

If Mantine provides a component or hook, use it instead of building a custom primitive.

Use Mantine for:
- app layout primitives
- forms
- inputs
- buttons
- action icons
- cards/papers
- modals
- drawers
- popovers
- menus
- tooltips
- badges
- alerts
- tables
- loaders
- skeletons
- progress
- notifications
- tabs
- stepper
- segmented controls

## 3. Runtime packages to install

Core packages:

```bash
cd client
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/modals
```

Optional packages only when actually used:

```bash
npm install @mantine/dates
npm install @mantine/carousel
npm install @mantine/dropzone
npm install @mantine/spotlight
npm install @mantine/charts
```

Do not install heavy extensions such as rich text editor unless there is a real feature requiring them.

## 4. Mantine CSS imports

In the client entry file:

```js
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
```

Add extension CSS only when used.

## 5. Provider setup

Add in `client/src/app/providers/AppProviders.jsx`:

```jsx
<LanguageProvider>
  <MantineProvider theme={quizWheelzMantineTheme} defaultColorScheme="light">
    <ModalsProvider>
      <Notifications position="top-center" />
      {children}
    </ModalsProvider>
  </MantineProvider>
</LanguageProvider>
```

If a custom `ThemeProvider` already exists, do not delete it immediately. Decide whether Mantine color scheme replaces it or whether it remains only for CSS variables used by custom shells.

## 6. Mantine theme

Create:

```text
client/src/app/theme/quizWheelzMantineTheme.js
```

Theme goals:
- QuizWheelz colors
- rounded radius
- child-friendly font
- large touch targets
- readable teacher UI
- dark mode support
- consistent button/input/card defaults

## 7. Use @mantine/form for all new forms

All new forms should use:

```text
@mantine/form
```

Examples:
- TeacherLoginForm
- TeacherRegisterForm
- ForgotPasswordForm
- ResetPasswordForm
- StudentRoomCodeForm
- StudentDisplayNameForm
- CreateRaceForm
- RaceSettingsForm

Do not use `react-hook-form` for new screens unless there is a strong reason.

`react-hook-form` can stay only for legacy screens until migrated.

## 8. Use @mantine/hooks for UI behavior

Use Mantine hooks when they reduce code:

```text
useDisclosure      -> Modal/Drawer/Popover open-close
useMediaQuery      -> JS responsive decisions only when needed
useLocalStorage    -> simple local settings, if not global
useClipboard       -> copy room code
useClickOutside    -> custom popovers only if needed
useReducedMotion   -> disable decorative motion
useTimeout         -> UI timer
useInterval        -> UI polling/countdown only, not game rules
useHotkeys         -> keyboard shortcuts, if needed
```

Mantine hooks do not replace feature hooks. Feature hooks still own API/loading/error behavior.

## 9. Mantine AI setup for Claude

Mantine provides LLM docs, skills, and an MCP server. Configure Claude/Cursor with Mantine docs before refactoring.

Useful references:

```text
https://mantine.dev/llms.txt
https://mantine.dev/llms-full.txt
```

MCP server config idea:

```json
{
  "mcpServers": {
    "mantine": {
      "command": "npx",
      "args": ["-y", "@mantine/mcp-server"]
    }
  }
}
```

Mantine skills, if Claude Code supports skills:

```bash
npx skills add https://github.com/mantinedev/skills --skill mantine-form
npx skills add https://github.com/mantinedev/skills --skill mantine-combobox
npx skills add https://github.com/mantinedev/skills --skill mantine-custom-components
```

Before using the commands, Claude should verify the official Mantine docs in the current environment.

## 10. ReactBits role

ReactBits is not the main UI system.

Use ReactBits for selected animated/decorative pieces:
- landing hero polish
- animated card entrance
- subtle background/mascot effects
- student waiting animation
- empty states
- result celebration
- small interactive visual effects

Do not use ReactBits for:
- forms
- inputs
- modals
- tables
- app layout
- API logic
- auth logic
- game/race logic

## 11. ReactBits setup for Claude

ReactBits can be configured through a shadcn-style registry.

`components.json` registry idea:

```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

MCP init idea:

```bash
npx shadcn@latest mcp init --client claude
```

Before using ReactBits:
1. Inspect the component dependencies.
2. Add only one animated component first.
3. Make sure it works with Vite/React.
4. Make sure it does not conflict with Mantine.
5. Add reduced-motion support.
6. Do not add many animations at once.

## 12. Do not mix UI systems

Do not add these unless a future decision explicitly changes direction:

```text
Material UI
HeroUI
Fluent UI
Ant Design
Chakra
DaisyUI
shadcn as main UI system
Radix directly
Headless UI
React Aria
Base UI
```

Exception:
ReactBits may internally use registry/shadcn tooling for animated snippets, but it is not the app UI library.

## 13. Package cleanup

Keep:
```text
react
react-dom
vite
react-router-dom
axios
zustand
lucide-react
pixi.js
@pixi/react
tailwindcss
```

Add:
```text
@mantine/core
@mantine/hooks
@mantine/form
@mantine/notifications
@mantine/modals
```

Check duplicate animation libraries:
```text
framer-motion
motion
```

Choose one. Prefer `motion` unless existing code requires `framer-motion`.

Do not delete before import search + build.

## 14. UI migration policy

Build replacement first, delete later.

```text
1. Build Mantine replacement.
2. Switch imports.
3. Test screen.
4. Search old component imports.
5. Delete only when zero imports remain.
6. Run lint/build.
```

## 15. Summary

```text
Mantine handles structure and UI.
ReactBits adds life.
Custom code handles the QuizWheelz game identity.
```

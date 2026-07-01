# QuizWheelz — Current State and Cleanup Plan

## 1. Current assumptions

Current client stack:
- React
- Vite
- Tailwind v4
- React Router
- Zustand
- Axios
- react-hook-form in legacy login
- lucide-react
- PixiJS installed for future race rendering
- motion/framer-motion overlap should be checked

## 2. Direction change

Old UI direction:

```text
Tailwind + shadcn selectively.
Mantine rejected.
```

New UI direction:

```text
Mantine-first.
ReactBits optional for animation polish.
Tailwind/custom only for brand/game visuals.
```

## 3. Existing code to keep

Keep:
```text
api/httpClient.js
api clients
authStore
languageStore
ProtectedRoute
RoleRoute
routeConstants
apiEndpointConstants
PixiJS dependencies
assets
current working teacher flow until replacement exists
```

## 4. Existing UI to replace gradually

Replace with Mantine:

```text
AuthButton       -> Mantine Button
TextInput legacy -> Mantine TextInput/PasswordInput
AuthCard         -> Mantine Paper/Card
PageBackground   -> PublicEntryShell + Mantine Paper
AppLogo legacy   -> BrandWordmark / Mantine layout
Button           -> Mantine Button or thin QwButton wrapper
Card             -> Mantine Card/Paper
Modal            -> Mantine Modal
Badge            -> Mantine Badge
LoadingState     -> Mantine Loader/Skeleton
ErrorState       -> Mantine Alert
EmptyState       -> Mantine Paper + illustration/ReactBits if useful
```

## 5. Delete policy

Do not delete by feeling.

```text
1. Build replacement.
2. Switch imports.
3. Test screen.
4. Search imports.
5. Delete only if zero imports remain.
6. Run npm run lint and npm run build.
```

## 6. Package cleanup policy

### Add

```text
@mantine/core
@mantine/hooks
@mantine/form
@mantine/notifications
@mantine/modals
```

### Add only when needed

```text
@mantine/dates
@mantine/carousel
@mantine/dropzone
@mantine/spotlight
@mantine/charts
```

### Do not add

```text
MUI
HeroUI
Fluent UI
Ant Design
Chakra
DaisyUI
shadcn as main UI system
Radix directly
Headless UI
```

### Check and possibly remove later

```text
react-hook-form
```

Only remove after all forms move to `@mantine/form`.

```text
framer-motion / motion
```

Keep one. Remove the other only after import search.

## 7. Known current issues to address

### Landing responsive behavior

Problem:
- desktop split triggers too early at 1024px
- iPad portrait looks like tiny desktop
- mobile/tablet should remain hero top + sheet

Fix:
```text
desktop split = 1200px+
phone/tablet = top hero + sheet
```

### Legacy auth UI

Problem:
- old AuthCard/PageBackground/AppLogo/TextInput visual language
- hardcoded RTL/text
- duplicates generic UI

Fix:
- new teacher auth inside PublicEntryShell
- Mantine forms/components
- delete old auth UI after replacement

### Duplicate UI systems

Problem:
- old shared UI components
- new Mantine components
- possible shadcn docs

Fix:
- Mantine is the default
- old UI deprecated
- do not add shadcn

### Animation overlap

Problem:
- both framer-motion and motion may exist

Fix:
- choose one
- ReactBits only for selected animated components
- respect reduced motion

## 8. Cleanup order

```text
1. Install Mantine and provider.
2. Fix shell responsive.
3. Replace landing/auth UI.
4. Replace student join UI.
5. Replace create race modal.
6. Replace dashboard high-value pieces.
7. Remove old shared UI components when unused.
8. Remove unused packages.
```

## 9. Final target

```text
Mantine handles app UI.
ReactBits handles selected polish.
Custom handles QuizWheelz visual identity.
Server owns race/game rules.
```

# Client Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the implemented React/UI/game-rendering capabilities and remaining integration work

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Stack

- React 19
- Vite 8
- React Router
- Mantine
- Tailwind 4 for custom composition
- i18next/react-i18next
- Axios
- Zustand
- PixiJS
- Lucide React
- react-qr-code
- motion/framer-motion overlap to clean after import audit.

## Implemented product areas

### Foundation

- app/router/providers
- auth/language/theme global stores
- HTTP client with credentials
- role and guest guards
- API and route constant files
- shared notification/error handling
- light/dark design tokens.

### Public and teacher UI

- product landing shell
- teacher login
- client registration/forgot-password screens
- teacher workspace shell
- dashboard and race list
- create-race form
- teacher waiting room
- start-race action
- Hebrew/English namespaces.

### Student pre-race

- join by code/name
- code-from-route support
- waiting screen
- mobile-first shell.

### Student race UI-10 foundation

Implemented A–G:

- runtime contract
- API wrappers for current question/answer
- shared status constants
- asset keys/manifest/config
- manual Pixi renderer
- local snapshot runtime
- perspective road/jungle/kart/effects layers
- unified projection
- near/mid/far depth zones
- full-screen world + React overlay layout
- persistent question-panel shell
- dev-only preview.

## Missing integration

- real `/student/race` route
- race-state bootstrap and route guard
- server snapshot mapper
- real question content and timer
- submit/feedback/next-question flow
- HUD
- heartbeat/leave/reconnect
- opponent vehicles
- teacher live page
- SSE
- results pages
- full auth server flows.

## Stale client state to clean

- race-state is still commented as “not implemented”
- heartbeat/leave/reconnect constants are missing
- live/results route constants exist without routes
- student race route constant is missing
- nested source-folder READMEs duplicate canonical documentation
- both `framer-motion` and `motion` are installed
- `@pixi/react` is installed while the approved renderer is manual `pixi.js`.

Cleanup must follow import search → removal → lint/build. Do not remove packages by
assumption.

## Immediate client priority

```text
Contract/constants cleanup
→ student race route/bootstrap
→ question panel
→ answer/snapshot mapping
→ HUD + reconnect
→ real assets/opponents
→ teacher live/SSE
```

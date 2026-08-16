# AGENTS.md — QuizWheelz Working Rules

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`

Read this file before planning, editing, reviewing, or generating code.

## 1. Product

QuizWheelz is a real-time educational racing game for teachers and elementary-school
students.

```text
Teacher creates race
→ RacePlayer joins by room code
→ Teacher starts race
→ Server generates and persists questions
→ RacePlayer answers
→ Server updates score, progress, speed, streak and status
→ Clients render server-owned state
→ Race finishes and results are shown
```

The first subject is Math. Shared architecture must stay open to future subjects.

## 2. Non-negotiable architecture

```text
The server is the source of truth.
```

The client never decides correctness, score, progress, speed, difficulty, rank,
winner, finish state, game effects, or whether an action is allowed.

React owns application UI. PixiJS owns frame-by-frame rendering. MySQL owns durable
data. Redis owns temporary runtime/presence data only.

## 3. Start every task here

Read, in order:

1. `docs/README.md`
2. `docs/00-project/CURRENT_STATE.md`
3. `docs/00-project/MASTER_IMPLEMENTATION_ROADMAP.md`
4. The relevant server or client plan.
5. The relevant rules document.
6. The actual code.

Do not use deleted Stage A/Stage B/client-design documents as current instructions.

## 4. Reuse and library-first rule

Before creating code:

1. Search the repository.
2. Reuse an existing component, service, hook, DTO, mapper, policy, config,
   constant, asset or test pattern.
3. Extend it when the responsibility matches.
4. Create new code only when no existing owner fits.
5. Prefer an already-installed, maintained library when it correctly owns the
   problem and reduces custom code.

Do not add packages merely to avoid understanding a small problem. Do not hand-roll
security, form, modal, notification, i18n, HTTP, QR, icon, cache, or rendering
primitives when the approved stack already provides them.

## 5. One owner per value and responsibility

A value has one canonical owner.

### Server

```text
Endpoint paths                 → ApiPaths
Success response messages      → ApiMessages
Structured API errors          → ErrorCode
Environment/property names     → ConfigPropertyKeys
Authorization expressions      → SecurityExpressions
JWT claim names                → JwtClaims
Cookie internals               → Cookie constants/utilities
Business/game limits           → focused Rules classes
Class-local implementation     → private static final
```

### Client

```text
Global routes                  → routeConstants
Global endpoints               → apiEndpointConstants
Global server enum mirrors     → shared constants
Feature visual/config values   → feature config
User-facing Hebrew/English     → i18n namespace
Pure mapping/calculation       → utils/runtime mapper
Async feature behavior         → feature hook/controller
Frame interpolation            → Pixi renderer/config
Asset file mapping             → asset manifest
```

Do not create a giant generic `Constants` file.

## 6. Backend rules

- Controllers are thin.
- DTO validation handles request shape.
- Services own business rules and transactions.
- Repositories own persistence queries.
- Entities are never returned directly to clients.
- Ownership and role checks are server-side.
- Use pessimistic locking only where concurrent writes require it.
- Generated questions and choices are persisted before delivery.
- Correct-answer flags never reach the student client.
- Cache loss must not destroy durable game truth.
- Do not put unrelated engines into one God service.
- Add tests for every decision-making rule.

The domain participant is always `RacePlayer`.

## 7. Frontend rules

Use the flow:

```text
API wrapper
→ feature hook/controller
→ page
→ feature components
→ Mantine/custom visual layer
```

- API wrappers contain no JSX, navigation or UI text.
- Pages compose and navigate; they do not become giant components.
- Hooks own loading, errors, mutations, retry and view-model preparation.
- Components render props and emit callbacks.
- Pure logic goes to `utils`, mappers or focused runtime modules.
- User-facing text goes to i18n, not JSX.
- Zustand is only for state shared across unrelated areas.
- Mantine is the default for normal UI.
- Custom CSS/Tailwind is for QuizWheelz-specific layout and game visuals.
- PixiJS never calls the backend and never owns game rules.
- Never invent an endpoint, success state or server field.

## 8. Approved client stack

Use existing packages before adding alternatives:

- Mantine: normal UI, forms, modals, drawers, notifications and hooks.
- i18next/react-i18next: Hebrew/English.
- Axios: HTTP through the shared client.
- React Router: routes and guards.
- Zustand: limited global state.
- PixiJS: race-world rendering.
- Lucide React: icons.
- react-qr-code: room QR.
- One motion library only after import audit.

`@pixi/react`, `framer-motion`, and `motion` must not all remain by habit. Remove an
unused package only after repository-wide import search and successful build.

## 9. Student race rendering rules

- One continuous, lane-less muddy road.
- Player kart is screen-fixed and player-centered.
- Server `laneNumber` is only an invisible lateral slot.
- Screen depth is a pure function of server position: **Depth Lock**.
- One projection function owns all track objects.
- Near/mid/far are logical depth zones, not separate road images.
- React renders question/HUD; Pixi renders world/effects.
- No text is baked into game art.
- Assets are loaded through metadata/manifest keys.
- Recycle sprites with object pooling for repeating props.
- Current vehicle direction: hover karts without visible wheels.

Full contract: `docs/02-client/STUDENT_RACE_SCREEN_AND_ASSETS.md`.

## 10. Infrastructure rules

Current decision:

```text
Keep Redis.
Do not refactor to Caffeine before the playable loop.
```

Target local development:

```text
Run Spring Boot
→ application connects to existing local MySQL at localhost:3306
→ Spring Boot starts Redis through Docker Compose
→ Redis health check passes and its connection details are applied automatically
```

Local MySQL and Docker Desktop are external prerequisites. Tests use H2 and must not
start Docker Compose.

## 11. Git and AI workflow

- Branch from updated `main`.
- One issue, one branch, one primary responsibility, one PR.
- Do not let multiple AI agents edit the same files concurrently.
- Before editing: `git status`, inspect actual code, search reuse candidates,
  propose plan, list expected files.
- Do not touch unrelated files.
- Do not delete old code before replacement has zero imports.
- Run relevant tests before PR.
- Update canonical status/plan docs in the same PR when implementation status changes.

Full workflow: `docs/03-quality/ISSUE_PR_AND_AI_WORKFLOW.md`.

## 12. Definition of done

A feature is not done because a page renders or a happy-path request returns 200.
It is done only when its contract, validation, authorization, error/loading/empty
states, tests, responsive behavior, documentation and real integration pass.

Full checklist: `docs/03-quality/TESTING_AND_DEFINITION_OF_DONE.md`.

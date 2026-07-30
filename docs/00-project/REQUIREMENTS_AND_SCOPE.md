# Requirements and Scope

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the product/lecturer requirements and the project decision for each one

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Core product requirement

QuizWheelz combines learning and a real-time race. A teacher creates a room, up to
eight RacePlayers join, questions are generated live, and server-owned game state is
rendered as a race.

## Traceability matrix

| Requirement | Current decision | Status |
|---|---|---|
| Client/server architecture | Spring Boot owns rules; React/Pixi render state | DONE foundation |
| Teacher creates race and room code | Existing teacher flow | DONE |
| Up to 8 participants | Server capacity/lane rules | DONE foundation |
| Student joins by room code | RacePlayer join/session | DONE |
| Student sees open races/registers | Current UX is room-code join; confirm whether a public open-race list is also required | OPEN REQUIREMENT |
| Teacher may approve registrations | Current decision is automatic valid join; approval can be added only if required | DEFERRED decision |
| Teacher starts/finishes race | Start exists; finish is engine-driven | PARTIAL |
| Generated questions, not fixed bank | Template-driven on-demand generation | DONE |
| Four mobile answer choices | Server and UI direction locked | PARTIAL integration |
| Difficulty adaptation | Basic difficulty progression exists; richer skill policy later | PARTIAL |
| Fair scoring/progress | Server engine exists | DONE foundation |
| Teacher projected live dashboard | Initial state + SSE + visual race required | PLANNED |
| SSE for live updates | Preferred first live mechanism | PLANNED |
| Live overtake/streak/bonus alerts | Derived from server events, never pixels | PLANNED |
| Probabilistic decision event | Junction offer after server policy threshold/probability | REQUIRED LATER |
| Highway option | Hard question, high reward/high risk | REQUIRED LATER |
| Dirt-road option | Short sequence of easier questions, safer lower reward | REQUIRED LATER |
| Fair luck events | Controlled probability, cooldowns and anti-frustration limits | REQUIRED LATER |
| Help weaker players | Secret eligibility based on being genuinely behind and struggling | REQUIRED LATER |
| Full teacher registration/auth | Email, verification, reset, secure sessions | REQUIRED LATER |
| Two-factor authentication | TOTP/authenticator-style second factor | REQUIRED LATER |
| Results/winner | Server-owned finish and final results screen | PLANNED |

## Current release priority

The project is ordered by dependency, not by visual excitement:

1. Automatic reproducible development infrastructure.
2. Real student playable loop.
3. Teacher live state and SSE.
4. Results and full integration.
5. Junction, luck, catch-up and live event announcements.
6. Full registration, recovery and 2FA.
7. Production migrations, deployment and hardening.

The authentication requirement is mandatory, but it follows the first playable loop
so the team can validate the core product before expanding identity flows.

## Non-goals

- No physics simulation or vehicle collisions.
- No client-owned scoring or winner calculation.
- No fixed prewritten question bank as the main system.
- No WebSocket unless a real bidirectional requirement appears.
- No permanent child account requirement in the current RacePlayer model.
- No custom replacement for established UI/security/i18n/cache libraries without a
  documented reason.

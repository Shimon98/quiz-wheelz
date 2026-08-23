# Server Rules and Conventions

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** backend package ownership, constants, services, security, persistence and testing rules

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Layer responsibilities

### Controller

Allowed:

- receive request/path/cookie-resolved principal
- rely on Bean Validation
- call one application/service entry point
- return response DTO.

Not allowed:

- question correctness
- scoring
- entity mutation
- repository orchestration
- cookie/JWT parsing
- ownership logic copied from services
- large try/catch error mapping.

### Service/application layer

Owns:

- transaction boundaries
- business validation
- ownership checks
- state transitions
- orchestration of focused policies/engines
- DTO mapping through dedicated mappers when nontrivial.

Split a service when it has multiple independent reasons to change. Do not split
merely to create empty wrappers.

### Repository

Owns persistence access and clearly named queries. Use locking queries only for
concurrent state changes such as join/start/answer.

### DTO

- request DTOs define validation
- response DTOs expose safe client contracts
- internal engine results are not automatically API responses
- entities never cross the controller boundary.

## Constant ownership

| Value | Owner |
|---|---|
| API path | `ApiPaths` |
| Success message | `ApiMessages` |
| Structured error/status | `ErrorCode` |
| Environment/property name | `ConfigPropertyKeys` |
| Security expression | `SecurityExpressions` |
| JWT claim | `JwtClaims` |
| Cookie detail | cookie constants/utility |
| Race limit | `RaceRules` or focused rules class |
| Question timing/generation rule | focused question rules |
| Score/progress rule | focused engine rules/policy |
| One-class algorithm value | `private static final` |

Do not create one `Constants.java`.

## Naming

- Participant in a race: `RacePlayer`.
- Generated question for a player: keep the existing project name consistently.
- `laneNumber` is a fixed server visual slot, never rank.
- Vehicle state uses stable keys, never image paths.
- Boolean and status names must describe domain truth, not UI presentation.

## Question pipeline

```text
resolve RacePlayer
→ validate race/player state
→ return existing active unexpired question OR
→ choose template/plan
→ generate question and distractors
→ persist question + choices
→ map safe DTO
```

Answer pipeline:

```text
lock player/question
→ validate ownership/status/time/selected choice
→ persist answer
→ apply race engine
→ produce deltas + shared snapshot
→ return safe result
```

Do not leak `isCorrect` on choices before submission.

## Race engine

Keep separate focused owners for:

- scoring
- progress
- speed
- streak
- difficulty
- finish
- future effect resolution.

The orchestrator may call these policies; it should not contain every formula inline.

## Redis and cache

- Redis is temporary.
- Use namespaced keys and explicit TTL.
- Every cache-only lookup needs a DB or reconstructable fallback when correctness
  depends on it.
- Presence expiry may mean “temporarily offline”; durable disconnect is a server
  rule, not automatic Redis truth.
- Do not cache entities as mutable shared objects.
- Do not use Redis as a substitute for missing persistence.
- Treat the presence lease and trusted gameplay activity as separate values.
- Only heartbeat and reconnect may create or renew the presence lease.
- Heartbeat may renew an existing lease but never performs reconnect settlement or
  re-anchors movement. A missing lease requires explicit reconnect before renewal.
- Active `RACING + IN_PROGRESS` race-state, current-question and answer may record
  valid gameplay activity. When presence is absent they settle only to the trusted
  cutoff, record nothing, and require explicit reconnect; only reconnect may
  re-anchor the timeline. Terminal/non-playable race-state bypasses presence and
  activity recording so authoritative final state remains readable; terminal state
  reached during settlement also takes precedence over the older presence decision.
- Hidden/reconnect never changes ACTIVE question ownership or `expiresAt`.

## Security

- JWT parsing lives in the authentication layer.
- Controllers use authenticated principal/current-user services.
- Teacher ownership resolves through `User → Race`.
- RacePlayer session is scoped to one player/race.
- Return generic forgot-password responses.
- Store verification/reset/recovery secrets hashed where practical.
- Rate-limit auth and code attempts.
- Never implement TOTP, password hashing or cryptographic tokens manually.

## Persistence

Development may use `ddl-auto=update`. Production must move to migrations and
`validate`.

Seeders must be idempotent. A clean environment must recreate subjects/templates
without manual SQL.

## Error handling

Use one global response/error pattern. New services throw domain/API exceptions with
existing `ErrorCode` values or add a focused new code. Do not return ad-hoc maps.

## Test rules

Test business decisions at the service/policy level. Add integration tests when
security, transactions, locking, Redis or serialization are the risk.

Every rejected state deserves a test, not only the successful state.

## Code quality limits

- Added or modified Java files, including tests, contain no comments or
  Javadocs. Structure and names must carry the explanation.
- Added or modified Java files stay at or below 500 lines. Split services and
  tests by one coherent responsibility before adding more behavior.
- Transactional operation owners stay focused; a facade delegates and does not
  absorb heartbeat, reconnect, disconnect and leave rules into one service.
- Logger templates and repeated operation labels use focused constants. Do not
  pass explanatory string literals directly from logger call sites.
- Legacy violations outside the task are documented as backlog and remain out
  of scope unless they block the change.

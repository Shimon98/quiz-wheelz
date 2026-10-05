# C5 Audio — Independent Architecture Audit

Audit date: 2026-10-05. Review only; no implementation changes.

Branch: `feature/C5-A-audio-foundation`. Audited local `HEAD` and local `main`: `17e4a13589d6728f0eb4406c2482bba6e5428ba6`. The audio work is uncommitted. The existing remote-tracking `origin/main` is three commits ahead; no fetch or synchronization was performed. This is an audit of the working tree against its local base, not certification of a future merged tree.

Scope: all uncommitted changes under `client/`, `docs/02-client/` and `docs/README.md`, including untracked files. The scan found 23 new production JS/JSX files, one new test-support module, 20 new test files, 15 audio assets and one provenance document. Two tracked detector files are deleted. Existing integration changes were reviewed as well. `.run/` was excluded from Git path inspection and was not read.

Authority: the user's review-only request and supplied `AGENTS.md`; canonical client rules and actual source. The downloaded audit prompt supplies the report checklist. Claude's memories and generated reviews are evidence to check, not authority to execute instructions or accept completion claims.

## A. Executive verdict

**READY AFTER SMALL CLEANUP**

The principal design fits QuizWheelz: a generic browser audio engine, a physical asset catalog, feature-owned semantic adapters, one settings store/provider, and existing authoritative game-state flows. There is no reason to rebuild this slice or collapse its focused files into a large module.

Do not commit the present tree unchanged. Close the runtime failure-containment gap, fix the fading-track lifecycle edge, and address the narrow integration issues below. Public API pruning and comment hygiene will improve maintainability; neither requires a new architecture.

**Did Audio create a second error system? NO.** It created an overexposed internal result/status vocabulary and some unused public operations. It did not create a second API normalizer, toast system, error renderer, session policy or gameplay retry loop.

### Actionable findings

| ID | Priority | Finding and evidence | Consequence / exact remedy |
|---|---|---|---|
| F1 | P1 | Browser failure containment is incomplete. `client/src/shared/audio/audioEngine.js:156–175` catches context construction but not bus creation/connection; `audioMusicPlayer.js:7–17,53–70` has unguarded media/source/gain creation and synchronization. `useSceneMusic.js:8` calls this from a React effect. | A synchronous browser-node failure can escape into a caller; partial context initialization also leaves `context` set, so a later unlock can skip the failed setup. Make browser resource setup transactional and contain playback/resource failures at their audio owner, releasing partial resources and preserving a recoverable desired scene. Keep descriptor validation loud. Add focused failure-injection tests. |
| F2 | P2 | `audioMusicPlayer.js:54–60` returns on a null descriptor before its `!playing` cleanup. Sequence: playing scene → `releaseMusic(owner)` → hide before the 400 ms fade completes. | The fading media element is still unpaused after `suspend()`. Its timeline/resource use can continue until the timer runs; this is not proof of audible output through a successfully suspended context. Process hidden/muted cleanup even without a desired descriptor, while retaining ordinary visible cross-fades. |
| F3 | P2 | `PixiStudentRaceCanvas.jsx:18–20` drops a moment while its async renderer creation is pending (`:31–41`). The new hook has already consumed that identity; `EffectsLayer` deliberately no longer derives events from later runtime frames. | An answer/finish arriving after the baseline but before Pixi initialization can sound without its visual one-shot. Define readiness delivery for still-relevant, newly emitted moments within that mount. Do not replay initial snapshots or restore a second detector. Add a delayed-initialization test; the current screen test mocks away the imperative handle. This is source-proven conditional behavior, not an observed physical-device failure. |
| F4 | P2 | `useTeacherRoomSound.js:7` uses `racePlayerId ?? displayName`; its test supplies `racePlayerId`. The actual waiting-room DTO is `server/src/main/java/com/quiz_wheelz/dto/teacher/TeacherRaceRoomPlayerResponse.java:14–15`: **`playerId`**, `displayName`. Live-event DTOs have a different shape. | Production silently falls back to names rather than durable identity. Unique current names mask the issue; no claim that ordinary joins currently fail. Use the real room identifier and actual DTO-shaped test data. The same mistake predates Audio in `RacePlayersPanel.jsx:90`; record that adjacent legacy issue rather than silently widening this patch. |
| F5 | P1, policy | The current supplied `AGENTS.md` §12 and client rules prohibit comments in added/modified JS/JSX. The touched-file scan found 102 parser comment tokens covering 203 lines, including inherited comments; no touched code/test file exceeds 500 lines. | Resolve the comments against the current canonical rule before PR. Preserve useful explanations in documentation. Claude memory contains exceptions and a preserve-existing-comments rule, but those conflict with the instructions supplied for this review. See E for a complete disposition inventory. |

F1/F2 were reproduced against the actual source with in-memory dependency injection. The reproductions printed `media routing failed` escaping `claimMusic`, `gain allocation failed` escaping `unlock`, and `true` for an outgoing media element still playing immediately after hidden suspension. No application source or test file was changed to run them. These demonstrate control flow under injected failures, not the frequency of those failures on real devices.

## B. What is architecturally strong

- `shared/audio` imports no Student/Teacher feature, API wrapper, server contract or notification module. It owns browser mechanics, not correctness, score, ranking or gameplay effects.
- `gameAudioCatalog.js` owns each physical URL exactly once. Student and Teacher adapters select keys and mix policy. A generic engine should not import this catalog itself; registration at the application composition boundary is reasonable.
- `AudioProvider` reuses `useBrowserLifecycleEvents`; it does not add a competing visibility implementation. Stable handlers and subscription cleanup fit existing provider patterns. It sits outside Mantine's direction-keyed subtree.
- `audioSettingsStore` follows the established Zustand/manual-localStorage pattern. Its settings sanitizer is shared with the engine; it is not a duplicate persistence framework.
- `AudioSettingsControls` is genuinely shared between the normal settings dialog and the compact button. Mantine owns switches, popover, focus handling and accessibility primitives; Hebrew/English labels use the existing namespace.
- The Student moment derivation replaces the previous Pixi detector. Both consumers receive one batch. Accepted answer identity and server streak drive answer sounds; a speed rise no longer invents BOOST.
- Teacher finish sounds consume feed items derived by the existing event registry and reducer. Recovery preserves the current feed, and authoritative hydration creates no replay feed. Waiting-room joins use the existing room refresh; start sounds follow a successful server command.
- Music owner tokens prevent a stale screen cleanup from releasing the next screen's scene. Lazy media creation, loader deduplication, one-shot dropping while locked, loop replacement cleanup and bounded playback parameters are useful mechanics with regression coverage.
- Existing packages/browser APIs are used. Neither `client/package.json` nor `client/package-lock.json` changed for this slice.

## C. Reuse opportunities

| Current code | Existing primitive/pattern checked | Recommendation | Benefit | Risk |
|---|---|---|---|---|
| `AudioProvider` lifecycle | `shared/hooks/useBrowserLifecycleEvents.js` | KEEP: already reused correctly | One lifecycle convention | Do not add another global activation abstraction without another consumer |
| Audio store | `themeStore.js`, `languageStore.js` | KEEP manual persistence; keep audio-specific validation | Consistency without a generic storage framework | A migration to Zustand persist would add scope and change hydration |
| Audio settings controls | `LanguageSelector`, `ThemeModeSelector`, `PublicSettingsDialog`, `PublicSettingsButton` | KEEP controls + compact button | Real reuse in three UI surfaces | The existing gear button opens all settings; making it handle scene audio would mix purposes |
| Time-up predicate | Previous logic in `StudentRaceQuestionPanel` | KEEP extracted `isQuestionTimeUp` | Panel and audio use identical presentation precedence | Do not let this predicate decide server expiry/penalties |
| Student one-shots | Previous `detectRuntimeEffectTriggers`, feedback mapper, runtime constants | KEEP replacement owner; fix F3 | Removes duplicate detection and inferred BOOST | Readiness handoff must not lose fresh visual effects |
| Teacher fresh-feed detection | `useFreshFeedItem`, reducer and event registry | KEEP separate audio batch consumer | Audio needs all fresh finishes and a batch priority; the existing hook only exposes the latest item relative to mount | Forcing reuse would lose events or create a general event bus |
| `useTeacherRoomSound` | Teacher workspace room data/polling | MOVE to `features/teacherWorkspace/hooks/` only as optional ownership polish; fix identifier first | The actual caller and data owner are the waiting-room feature | Existing cross-feature projector-art preloading already makes this dependency direction familiar; moving is not a blocker |
| `sanitizeGain` / `sanitizePlaybackRate` | Existing numeric clamping/mappers | KEEP together inside audio | Audio-specific ranges and invalid-value semantics | A repository-wide clamp helper would not remove the domain validation |
| Silent diagnostics | `studentRaceWorldAssets.js:43–48`, `studentRaceVehicleAssets.js:60–75` | Reuse the **warn-once pattern**, not the Pixi loader | Unknown keys and broken invariants become diagnosable | No shared logger currently owns this; do not invent a logging framework |
| `startMusic/pauseMusic/resumeMusic/stopMusic` | Production `useSceneMusic` → token claims | DELETE unused alternate controls; adapt tests to production claims | One public music ownership path | Preserve legitimate cross-fade/interruption coverage when updating tests |
| Result/status barrel exports | Local `audioTypes.js` and internal cue policy | Internalize unused barrel exports | Smaller application-facing contract | Keep policy behavior and diagnostics testable internally |

No duplicate API client, notification system, cache framework, gameplay clock, EventSource or polling loop was added by Audio.

## D. Error-system audit

The actual API path remains `httpClient` → `normalizeApiError` / semantic predicates → feature decisions → localized UI/notification. `ApiContractError` represents malformed API success envelopes. Static audio fetch/decode failures are not API-envelope or identity failures; putting them through this normalizer would be incorrect.

### Exact result/status usage

Counts below are source member references such as `RESULT.LOCKED` or `AUDIO_PLAY_RESULTS.LOCKED`, not runtime call counts. Definitions and imports are excluded. Test counts include direct assertions and other member references, not equivalent string-literal assertions. Production references are entirely **inside the audio implementation**. **Zero production feature/provider callers branch on any returned play result or engine status.**

| Concept | Production / test references | Actual consumer and meaning | Action |
|---|---:|---|---|
| `AUDIO_PLAY_RESULTS` | 8 values; 16 production member references in total | Engine returns them; cue policy returns denial reasons; callers ignore results | SIMPLIFY public contract; keep local diagnostic outcomes if useful |
| `PLAYED` | 3 / 6 | Return from SFX/loop/music request, not proof of audible sound. Loop returns it even if a buffer is still loading or node start failed. | Do not expose as playback-success truth; remove unused wrapper results or document local request acceptance |
| `MUTED` | 2 / 2 | User setting disables SFX/music; expected control outcome | KEEP internally; never an app error |
| Play `LOCKED` | 3 / 4 | No running context; also covers interrupted/suspended/unavailable contexts for the request | KEEP internally; no UI error or retry policy |
| `NOT_READY` | 1 / 1 | SFX buffer absent; initiate load and drop this one-shot | KEEP internal distinction if debugging needs it; never replay this event automatically |
| `COOLDOWN` | 1 / 2 | Cue policy denied another cue inside its interval | KEEP local policy; engine only tests truthiness of the denial |
| `VOICE_LIMIT` | 1 / 2 | Cue policy denied too many overlapping voices | KEEP local policy; not a failure notification |
| `MISSING` | 3 / 3 | Unknown key, wrong kind or invalid loop channel | KEEP internal invariant signal; optional once-only DEV diagnostic rather than silent permanent absence |
| `FAILED` | 2 / 1 | SFX node construction/start failure | KEEP local runtime failure outcome; current callers ignore it |
| `AUDIO_ENGINE_STATUS` | 5 values; 5 production member references | `status()` constructs diagnostic state and lifecycle return values | Remove unused barrel exposure; `getState` can remain an explicitly diagnostic seam |
| Engine `LOCKED` | 1 / 2 | Context not created | Internal lifecycle state, KEEP |
| `RUNNING` | 1 / 5 | Context state is running | Internal lifecycle state, KEEP |
| `SUSPENDED` | 1 / 1 | Non-running state fallback | KEEP locally; no evidence that an application error category is needed |
| `INTERRUPTED` | 1 / 0 | Context reports interruption; direct constant not asserted in tests, although interruption behavior is exercised | KEEP browser distinction internally; do not confuse zero literal assertions with unused behavior |
| `UNAVAILABLE` | 1 / 1 | Context creation unavailable/failed | KEEP diagnostic state; gameplay stays usable |

None of these concepts is localized, rendered as an application error, or logged by the current audio engine. The internal `isRunning()` checks the browser state directly; production behavior does not consume the exported `AUDIO_ENGINE_STATUS` vocabulary.

### Other failures and catches

| Concept/path | Actual use | Classification | Recommendation |
|---|---|---|---|
| Registry validation strings / `throw Error` | Invalid shape, unknown field, duplicate/conflicting key; manifest registered at provider module import | Programmer/configuration errors | KEEP loud in development/tests and registration validation. Do not normalize as API errors or hide a malformed shipped catalog |
| `AudioLoadError` | Constructed once in loader; imported by loader tests; no production `instanceof`/name branching; `url`/`cause` discarded by the engine catch | Real local asset failure, not app/API error | Class is optional. Prefer a private ordinary Error with cause, or retain privately if a diagnostic consumer is added. No reason to expand taxonomy |
| HTTP status / HTML fallback / decode rejection / timeout | Loader protects static asset download/decode and evicts failed entry | Local asset failure | KEEP validation, abort and fresh-download behavior. The timeout covers fetching bytes, not a never-settling decoder callback |
| Promise rejection from media `play()` | `audioMusicPlayer.js:70` handles rejection | Browser playback failure | KEEP containment; F1 concerns uncovered synchronous resource paths |
| `resume()` / `suspend()` failure | `afterContextCall` catches throws/rejections from the context operation | Browser lifecycle failure | KEEP recoverability. Its later `syncPlayback` call can itself throw/reject; close this hole at the owning resource boundary |
| Broad loader-ready callback catch | `audioEngine.js:72` catches both load failure and bugs in `onReady` | Mixed runtime containment and hidden programmer failures | Preserve gameplay safety; add focused DEV diagnosis for unexpected invariant failures, not toast spam |
| Consumer catch | `useStudentRaceMoments.js:18–23` lets other consumers run | Presentation fault isolation | KEEP isolation. Swallowing all failures without DEV signal hides renderer bugs; do not route them to API errors |
| localStorage read/write catches | Defaults on corrupt/blocked storage, in-memory setters | Expected environment fallback | KEEP; consistent with theme/language stores |

**Second error system: NO.** There is no second normalizer, global error category map, error component, notification service or retry scheduler. Future requests retry failed asset loads after cache eviction; this is loader recovery, not gameplay/API retry. Ordinary gestures retry browser activation through the same owner.

Recommended balance: keep runtime playback failure silent to the player, keep invalid configuration loud at validation, and expose unexpected missing assets/programmer failures once in DEV if diagnostics are added. Existing Pixi asset loaders already demonstrate deduplicated warnings, but they are not a reusable generic logger. Message templates should follow focused constant ownership. No logger was implemented in this audit.

## E. Comment/prose audit

The comment issue has two separate causes: new explanatory comments and inherited prose in files Audio touched. The count is **102 lexical comment tokens / 203 comment lines in 29 touched files**, including JSX comment expressions and existing headers. Adjacent `//` lines count as separate tokens. It would be misleading to call all 203 lines newly added by Claude.

Policy conflict: the attachment accepts short WHY comments; Claude's `why_comments_for_subtle_fixes.md` records a historical exception, and `frontend_working_style.md` also says to preserve old comments. The current user-supplied `AGENTS.md` and canonical client rules contain an unconditional prohibition. This audit does not silently rewrite that policy using a memory note.

The table classifies the **explanatory value** using the requested vocabulary. Under the current canonical rule, KEEP/SHORTEN means retain that explanation in the existing docs, not leave a source comment. If the owner later explicitly adopts a narrow WHY-comment exception, those are the only candidates worth retaining in code. No bulk cleanup outside the touched set is recommended.

Paths below are relative to `client/src/`. Every comment in a touched/new JS/JSX file is covered; files absent from the table have none.

| File | Lines and classification | Reason / canonical disposition |
|---|---|---|
| `app/providers/AudioProvider.jsx` | 8–10 SHORTEN; 19–20 KEEP | Gesture/re-interruption and effect ordering are non-obvious; move concise invariants to lifecycle docs |
| `app/providers/AppProviders.jsx` | 6–16 MOVE TO DOCS | Long provider architecture header, expanded by Audio |
| `features/studentRace/audio/studentRaceSounds.js` | 6 REMOVE; 8,10 MOVE TO DOCS | File responsibility is evident; mix/pitch rationale belongs with audio configuration documentation |
| `features/studentRace/hooks/useStudentRaceMoments.js` | 5–7 MOVE TO DOCS; 22 SHORTEN | Contract/lifecycle prose; preserve isolation reason in docs |
| `features/studentRace/hooks/useStudentRaceSound.js` | 7–8 REMOVE | Narrates the hook body |
| `features/studentRace/runtime/deriveStudentRaceMoments.js` | 17–20 MOVE TO DOCS | Baseline/identity contract is valuable but is architecture prose |
| `features/studentRace/utils/isQuestionTimeUp.js` | 3–4 SHORTEN | Useful precedence invariant, duplicated by meaningful helper and tests |
| `features/teacherLiveRace/audio/teacherRaceSounds.js` | 4–5,7 MOVE TO DOCS; 23 REMOVE | Product mix policy versus narration of the priority function |
| `features/teacherLiveRace/hooks/useTeacherLiveRaceSound.js` | 7–8 MOVE TO DOCS | Baseline/replay policy |
| `features/teacherLiveRace/hooks/useTeacherRoomSound.js` | 9–10 MOVE TO DOCS | Join-batch policy |
| `shared/audio/audioEngine.js` | 71 REMOVE; 185–186 SHORTEN; 197–198 SHORTEN; 201 KEEP; 248–249 SHORTEN | Keep browser activation/interruption and owner-token rationale in concise docs; line 71 narrates the catch scope |
| `shared/audio/audioLoader.js` | 17,28,66 KEEP | HTML host fallback, decode API compatibility and detached buffers are useful browser invariants |
| `shared/audio/audioMusicPlayer.js` | 12 KEEP; 38 SHORTEN; 69 SHORTEN | Source ownership, fade revival and rejection semantics |
| `shared/components/publicSettings/__tests__/AudioSettings.test.jsx` | 14 KEEP | Explains jsdom/Mantine test environment; retain in test documentation under current rule |
| `shared/gameAudio/gameAudioCatalog.js` | 18–19 MOVE TO DOCS | Ownership/provenance already has canonical documentation |
| `stores/audioSettingsStore.js` | 24 REMOVE | Same inherited catch explanation as other stores; behavior is straightforward |
| `features/studentJoin/config/studentJoinConfig.js` | 1–4,14–16,19–21 MOVE TO DOCS; 11 REMOVE; 24 MOVE TO DOCS | Most prose predates Audio; new mix rationale is one line |
| `features/studentJoin/hooks/useWaitingRace.js` | 15–39 MOVE TO DOCS; 48,56 REMOVE; 70 SHORTEN | Existing 25-line flow narrative is the largest block; start-cue baseline invariant is useful |
| `features/studentJoin/layout/StudentShell.jsx` | 9–15 MOVE TO DOCS | Existing shell architecture header |
| `features/studentRace/components/StudentRaceQuestionPanel.jsx` | 10–24 MOVE TO DOCS; 26–28 SHORTEN; 78 REMOVE; 117–118 REMOVE; 135–137 SHORTEN; 192–193 KEEP; 218–221 SHORTEN; 229–230 REMOVE; 262–263 SHORTEN | Existing task history and visual layout explanations; preserve bidi/accessibility invariants in docs |
| `features/studentRace/config/studentRaceConfig.js` | 1–10 MOVE TO DOCS; 12,14 REMOVE; 16 MOVE TO DOCS; 19–22 SHORTEN; 25–27 SHORTEN | Timings are named; architecture/history is not needed beside each value |
| `features/studentRace/runtime/studentRaceRuntimeConstants.js` | 1–10 MOVE TO DOCS; 12,21 REMOVE; 29–30 MOVE TO DOCS | Vocabulary ownership belongs in the runtime contract |
| `features/studentRace/pixi/layers/EffectsLayer.js` | 52 REMOVE | Method name and caller already express that the layer renders supplied moments |
| `features/teacherLiveRace/styles/teacherRaceProjectorStyles.js` | 38 KEEP | Fullscreen popover stacking reason; documentation under strict rule |
| `i18n/locales/en/publicSettings.js` | 1 REMOVE | File path already identifies namespace/language |
| `i18n/locales/he/publicSettings.js` | 1 REMOVE | Same |
| `shared/components/publicSettings/PublicSettingsDialog.jsx` | 8–13 MOVE TO DOCS | Existing composition narrative |
| `shared/components/publicSettings/publicSettingsConfig.js` | 1–5 REMOVE; 11–18 SHORTEN; 24–27 REMOVE | Endonym rationale useful; most comments narrate option objects |
| `test/setupTests.js` | 5–6 KEEP; 9,23 SHORTEN | Test-environment constraints; move to testing docs under current rule |

## F. File/abstraction audit

Line counts include comments and blank lines, excluding trailing blank lines. Paths are relative to `client/src/`. Importers are actual production imports, summarized where a barrel re-exports the file.

| New production file | Lines | Production importer(s) / responsibility | Decision |
|---|---:|---|---|
| `app/providers/AudioProvider.jsx` | 43 | `AppProviders`; store, gesture, visibility and registration wiring | KEEP |
| `features/studentRace/audio/studentRaceSounds.js` | 55 | `StudentRaceScreen`, `useStudentRaceSound`; semantic mapping/mix/rate | KEEP |
| `features/studentRace/hooks/useStudentRaceMoments.js` | 26 | `StudentRaceScreen`; stateful identity observation and fan-out | KEEP; two real consumers, not a global event bus |
| `features/studentRace/hooks/useStudentRaceSound.js` | 26 | `StudentRaceScreen`; preload, scene and loop lifecycle | KEEP |
| `features/studentRace/runtime/deriveStudentRaceMoments.js` | 52 | Moment hook; pure transition derivation | KEEP; replaces old detector |
| `features/studentRace/utils/isQuestionTimeUp.js` | 8 | Screen and question panel; one shared predicate | KEEP; small but removes real duplication |
| `features/teacherLiveRace/audio/teacherRaceSounds.js` | 28 | Live/room hooks; teacher cue policy | KEEP |
| `features/teacherLiveRace/hooks/useTeacherLiveRaceSound.js` | 24 | `TeacherRaceLivePage`; feed consumption/scene | KEEP |
| `features/teacherLiveRace/hooks/useTeacherRoomSound.js` | 28 | `TeacherRaceRoomPage` in teacherWorkspace; room lifecycle | KEEP for current cleanup; optional MOVE to caller's feature |
| `shared/audio/audioCuePolicy.js` | 20 | Engine; cooldown/concurrent voice bookkeeping | KEEP; focused internal owner |
| `shared/audio/audioEngine.js` | 367 | Barrel and scene hook; context/buses/control orchestration | KEEP and prune unused public operations; no 500-line violation or reason to split blindly |
| `shared/audio/audioLoader.js` | 77 | Engine; download/decode/cache lifecycle | KEEP; simplify custom Error only if useful |
| `shared/audio/audioMusicPlayer.js` | 81 | Engine; media/fade resource lifecycle | KEEP; fix F1/F2 here |
| `shared/audio/audioPlaybackOptions.js` | 12 | Engine; gain/rate validation in multiple call paths | KEEP; single-file importer is not sufficient reason to merge |
| `shared/audio/audioRegistry.js` | 55 | Engine; descriptor validation/registration | KEEP |
| `shared/audio/audioSettings.js` | 28 | Engine and store; settings defaults/validation | KEEP; genuine cross-owner reuse |
| `shared/audio/audioTypes.js` | 29 | Registry, engine, cue policy, barrel | KEEP internal vocabulary; narrow barrel |
| `shared/audio/index.js` | 8 | Provider, catalog, Student/Teacher hooks and adapters | KEEP a small public facade; remove two unused status/result re-exports |
| `shared/audio/useSceneMusic.js` | 11 | Student shell and Student/Teacher sound hooks through barrel | KEEP; token cleanup is meaningful behavior, not a call-renaming wrapper |
| `shared/components/publicSettings/AudioSettingsButton.jsx` | 26 | Student HUD composition and Teacher header through settings barrel | KEEP |
| `shared/components/publicSettings/AudioSettingsControls.jsx` | 32 | Settings dialog and compact button; also re-exported | KEEP; direct barrel re-export currently has no external production consumer |
| `shared/gameAudio/gameAudioCatalog.js` | 54 | Provider and eight feature/hook/adapter files | KEEP; common asset owner |
| `stores/audioSettingsStore.js` | 46 | Provider and both audio controls | KEEP |

`shared/audio/audioTestFakes.js` is **test support**, not a production abstraction: 169 lines, seven test importers, zero production importers. Keeping fixtures beside their owners follows existing `studentRaceTestFixtures` / `teacherRaceLiveTestFixtures` conventions. It does not need a new global testing framework.

Material existing changes are coherent: HUD gets a controls slot, overlay passes it, the screen composes sound/moments, canvas/renderer forward batches, EffectsLayer stops detecting, question panel reuses expiry precedence, HUD reuses `comboMinStreak`, waiting hooks add confirmed transition cues, Teacher pages compose hooks, projector header uses a non-portaled popover, and translations extend the existing namespace. The preview's `interactionEnabled` change aligns the flag with production connection readiness; feedback still gates answer input, so removing the old flag assertion is not by itself a gameplay regression.

## G. Shared-vs-feature ownership

`shared/audio` is appropriately generic. The engine's `ENGINE`/`AMBIENCE` loop channels are an intentional small channel contract, not awareness of RacePlayer rules; only ENGINE currently has a production caller. Keep the channel guard without adding more future channels speculatively.

`shared/gameAudio` is justified: it is the common physical catalog for Student and Teacher sound assets, analogous to shared results art. Putting it in Student would make Teacher depend on Student semantics; putting it inside generic audio would contaminate the engine. A directory rename to `shared/assets` offers no demonstrated benefit.

Student config ownership is mostly sound: combo onset is now owned by `STUDENT_RACE_CONFIG.comboMinStreak` and reused by HUD and sound; higher sound tiers (5/10), scene gain and rate envelope belong to the sound adapter. They select presentation from a server streak/speed and do not calculate rewards. Move these into a dedicated config file only when another real consumer emerges.

| Value | Current owner | Assessment |
|---|---|---|
| Bus/parameter ramp 0.05 s; loop fade 0.25 s; unlock dedupe 1000 ms | Private engine constants | Correct mechanics ownership |
| Music fade 0.4 s | Private music-player constant | Correct; separate from loop fade |
| Download timeout 10000 ms | Loader constant | Correct; do not duplicate in features |
| Asset gain, cue cooldown, max voices | Catalog descriptors; registry fills generic defaults | Correct |
| Student/Teacher scene gains, Student pitch envelope | Feature adapters / Student join config | Correct independent scene mix choices, even when two gains happen to equal 0.6 |
| Combo threshold 2 | Student config used by HUD + audio | Improved reuse |
| Higher combo tiers 5/10 | Student sound mapping | Presentation policy, not server difficulty/scoring |
| Existing 2-second waiting poll / 4-second teacher-room poll | Existing waiting controllers | No new audio polling |

## H. Settings/store/provider audit

The store has per-field boolean/volume validation, synchronous initial read, ignored invalid setter values, safe blocked-storage fallback and persisted reset. The small local setter factory avoids four repeated validators. Volume fields have no sliders yet, but are actively consumed as engine bus levels; they are not unused values. No middleware migration or shared storage abstraction is warranted.

The new controls reading the store themselves is consistent with existing language/theme settings components. `AudioSettingsControls` subscribes to the whole small store; narrower selectors are optional polish, not an observed performance problem. Its heading/group/switch layout does not justify inventing a general settings-row API for three small components.

`AudioSettingsButton` uses Mantine's focus trap/return focus and i18n labels. The projector passes `withinPortal={false}` and raises header stacking, so the dropdown remains inside the fullscreen element. DOM tests cover that containment, not actual fullscreen behavior or phone geometry.

The provider owns one gesture listener set and one store subscription with cleanup. StrictMode coverage confirms cleanup does not destroy the singleton. Language/theme changes do not recreate the provider. No existing generic activation-listener helper was found that should replace these four listeners. Source-level F1 remains despite these good lifecycle choices.

## I. Moment/event audit

Student: the accepted-answer ID is carried through the existing feedback mapper, `deriveStudentRaceMoments` records seen IDs and first-observation baseline, and `useStudentRaceMoments` delivers one batch to Pixi/audio. Repeated polls and remounts do not replay accepted feedback. FINISH requires an observed false→true transition. No BOOST is inferred from `targetSpeed`. Combo tiers consume the accepted server streak.

TIME_UP is an expiry **presentation cue** using the same `isQuestionTimeUp` predicate as the panel, including answer/in-flight precedence. The existing question controller still owns deadline handling and refresh; no new timeout scheduler, penalty or expiry mutation was added. The moment lives in the presentation runtime's `visual` bag; naming that bag is pre-existing and is not worth a cross-feature rename here.

The deleted detector has no remaining source import. Its relevant no-replay/identity behavior was moved into pure/hook tests. Fix the renderer readiness seam in F3 while preserving this single detector.

Teacher: `teacherLiveEventRegistry` maps/derives feed events, `teacherRaceLiveReducer` rejects stale/gapped events and preserves feed on same-race recovery, then audio selects at most one finish cue from fresh items. A race-finished cue outranks a player-finished cue in one batch. There is no competing stream or event bus. The existing latest-feed visual hook is not a drop-in batch consumer.

Waiting-room join sound uses existing polling, because that route has no Teacher live stream. The start cue is emitted after successful `startTeacherRace`, because the live page connects after the start event. These are valid existing integration points, not duplicated server-event machinery. Correct the room ID mapping in F4.

## J. Tests

### Verification performed in this audit

| Check | Result |
|---|---|
| Full client suite: `node node_modules/vitest/vitest.mjs run --reporter=dot` from `client/` | **147 files / 1274 tests passed** |
| `npm.cmd run lint` | PASS, exit 0 |
| `npm.cmd run build` | PASS, exit 0; Vite reports its large-chunk warning |
| `git diff --check -- client docs` | PASS |
| Source import/usage, line-limit and parser comment inventories | Completed; no touched code/test file >500 lines |
| Actual-source fault injection | F1 and F2 reproduced; no files added to application/test source |
| Live backend, physical phones/tablets, real fullscreen, listening | Not run by this audit |

One attempt to launch tests through `npm.cmd` failed because that executable was unavailable in that command environment; the installed Vitest entry point above then ran the entire suite successfully. The test run emits jsdom canvas/media-not-implemented messages and a few i18next-initialization warnings; passing tests do not prove browser audio playback. These warnings are test-environment output, not a second application error system. Build and tests generated only their normal ignored outputs.

There are 20 new test files, one old detector test file removed, and several existing integration suites extended. This volume is broadly justified by a new subsystem. Registry validation, buffer detachment/retry, voice policy, music ownership, fake-context interruption, store persistence, UI sharing, event baselines and semantic mapping are different boundaries.

| Test group | Assessment |
|---|---|
| Registry, loader, cue policy | KEEP meaningful shape/concurrency/timeout tests |
| `audioEngine.test`, `audioEngineMusic.test`, `audioEngineHardening.test` | KEEP failure/ownership coverage. Hardening overlaps engine/music responsibilities in naming; move cases to their owner suites when editing rather than delete tests to lower count |
| Scene hook + engine ownership | KEEP both: React cleanup and actual engine token behavior differ |
| Moment pure tests + hook tests + screen tests | KEEP derivation, StrictMode fan-out and integration coverage; some baseline cases overlap but protect different seams |
| Student/Teacher sound mapping and lifecycle | KEEP; replace fictional waiting-room ID fixtures |
| Store, provider, shared controls | KEEP; independently protect hydration, subscriptions and cross-surface UI |
| Catalog | Keep uniqueness/validity/preload tests. Exact artistic mix-order assertions are lower value and optional if tuning makes them noisy |

Missing regression boundaries worth adding during cleanup: transactional context setup failure; media-node opening failure through a real scene/store caller; release-to-silence followed immediately by hidden/mute; delayed Pixi initialization after a fresh moment; actual waiting-room DTO identity. Preserve tests for failed decode redownload, overlapping unlocks, stale music cleanup, first-observation silence and no speed-derived BOOST.

The existing music hardening test covers a fade between **two non-null desired keys**, explaining why it misses F2. The screen integration suite mocks Pixi as a plain div without exposing `playMoments`, explaining why it misses F3. No new tests were committed or left in the tree by this audit.

## K. Public API surface

### `shared/audio/index.js`

| Export | Outside production need | Recommendation |
|---|---|---|
| `audioEngine` | Provider and feature adapters/hooks | KEEP |
| `useSceneMusic` | Student shell, Student race, Teacher room/live | KEEP |
| `AUDIO_KINDS` | Physical catalog | KEEP |
| `AUDIO_LOOP_CHANNELS` | Student loop hook | KEEP |
| `AUDIO_ENGINE_STATUS` | No outside production consumer | INTERNALIZE; tests already import the internal types module |
| `AUDIO_PLAY_RESULTS` | No outside production consumer | INTERNALIZE |

`shared/gameAudio` has no barrel. `gameAudioCatalog.js` exports exactly `GAME_AUDIO` (feature keys) and `GAME_AUDIO_MANIFEST` (provider registration). Both are justified; KEEP.

### Methods on the exported engine

| Methods | Actual production use | Recommendation |
|---|---|---|
| `register`, `configure`, `unlock`, `suspend`, `resume` | Application provider | KEEP |
| `preload`, `playSfx`, `startLoop`, `stopLoop` | Feature lifecycle/adapters | KEEP; no caller consumes play/start return values |
| `claimMusic`, `releaseMusic` | `useSceneMusic` | KEEP token ownership as the production path |
| `startMusic`, `pauseMusic`, `resumeMusic`, `stopMusic` | Tests only in repository source | REMOVE alternate unowned control path and obsolete `musicPaused` machinery if no intended external consumer is established |
| `setLoopParams` | Tests only; production updates via `startLoop` with the same key | REMOVE or internalize; one update path is sufficient |
| `getState` | Tests; Claude's review reports manual browser diagnosis | KEEP explicitly diagnostic if that inspection seam is desired; do not pretend it is an application state store |
| `dispose` | Test teardown; not provider unmount | KEEP factory/resource teardown, avoid normal StrictMode teardown |

The engine factory and focused module factories are valid test seams and internal dependencies, not application barrel exports. `AudioLoadError`'s exported class is only used for test assertions and can be made private/simplified. `AudioSettingsControls`'s extra settings-barrel re-export is unused by outside production code; removing it is optional, since direct sibling reuse already works.

## L. Documentation/provenance and working-guidance audit

### Claude memories, skills and canonical docs

Reviewed the repository's `CLAUDE.md`, `.claude/skills/quizwheelz-frontend-collaboration/SKILL.md`, `.agents/skills/quizwheelz-client-collaboration/SKILL.md`, and the relevant Claude project memory files under `C:/Users/lagzi/.claude/projects/C--Users-lagzi-Documents-GitHub-quiz-wheelz/memory/`: `MEMORY.md`, `c5_audio_foundation.md`, `canonical_docs_and_task_workflow.md`, `frontend_working_style.md`, `why_comments_for_subtle_fixes.md`, `planning_and_modularity_feedback.md`, `skill_usage_policy.md`. The prior generated audio review was checked after inspecting the actual implementation.

| Source | Finding | Effect on this audit |
|---|---|---|
| `CLAUDE.md` and Claude collaboration skill | Correct canonical reading order, reuse, Mantine/i18n and thin layers; skill still requests short comments for config numbers | Mostly aligned; canonical no-comment policy conflict must be made explicit |
| Codex collaboration skill `.agents/.../SKILL.md` | Still points at deleted Stage A documents, recommends `content/*.js` and short config comments | Stale instructions. Follow current canonical i18n/rules instead; flag skill maintenance separately |
| Claude `frontend_working_style.md` | Contains English-only replies and `content/*.js`, later newer Hebrew/i18n expectations, preserve-existing-comments guidance and tighter later comment rules | Conflicting accumulated memory, not one reliable current specification |
| Claude `skill_usage_policy.md` | Old skill/UI references, including selective shadcn language | Canonical Mantine-first rules take precedence for current client work |
| Claude `why_comments_for_subtle_fixes.md` | Records a short-WHY-comment exception from a prior task | Historical rationale, not independent authorization to override the current supplied rules |
| Claude audio memory | Claims finalization and 1274 passing tests; documents owner tokens and current catalog | Test count and architecture verified live here. “Ready”/“complete” remains subject to findings and device QA |
| Generated audio review | Useful description of intended boundaries, bot race and listening choices | Prior live/device claims were not rerun; not treated as new audit evidence |

The implementation did follow modern i18n/Mantine ownership despite those stale notes. Do not conclude that the entire implementation is wrong merely because the instruction collection is inconsistent. No memory or skill file was edited by this audit.

### Comparison with mature client areas

| Existing area | Matches | Drift |
|---|---|---|
| Student synchronization/feedback | Hook-owned lifecycle, pure derivation, authoritative identities, focused tests | New imperative delivery needs readiness handling; some new comments restate architecture |
| Teacher SSE/live registry | Reuses accepted reducer/feed rather than new transport | Room identity test does not match room DTO; room-specific hook lives under live feature |
| Public Settings/stores | Mantine, i18n, one store per cross-feature value, manual safe storage | Whole-store subscription is minor; no structural duplication |
| Results/API error handling | Thin feature composition and safe localized API errors remain intact | Audio has local browser outcomes instead of API normalization, which is appropriate; broad silence needs bounded diagnostics |

Existing source itself contains long legacy comments, including mature synchronization and error modules. The current canonical rule is stricter than that legacy baseline. A fair report must distinguish those facts rather than call every inherited comment a new Audio mistake.

### Assets and provenance

- All 15 production files match catalog/provenance rows: **2 music files, 12 one-shot WAVs and 1 loop WAV**. Sometimes “13 in-house sounds” includes the loop; “13 sounds plus the loop” in the implementation plan double-counts it and should be corrected.
- Binary header inspection confirms all 13 WAVs are PCM16, mono, 48 kHz. The two music files have MP4/M4A containers; this audit did not independently decode/measure their full AAC profile, duration, peak or seamlessness. Those processing facts remain the provenance document's claims.
- Hash inspection found no duplicate among the 15 physical audio assets. The audio asset tree contains no source originals or temporary rendering scripts. Source URLs are imported and the production build emits fingerprinted audio assets.
- Music import URLs do not themselves download media. Media elements are created only for an enabled/running scene; short-sound preload lists stay feature-specific. The registry is shared metadata, not eager music fetch.
- Source-page authors, original filenames and CC0 labels match the provenance rows, checked on 2026-10-05: [Bamboo Blitz — Tsorthan Grove](https://opengameart.org/content/bamboo-blitz), [Joyful Jungle — MintoDog](https://opengameart.org/content/joyful-jungle). This verifies page metadata, not a binary chain of custody or legal opinion.
- The canonical provenance document records author/source/license/processing, while private recipes remain under the existing ignored `docs/vision/` convention. Publishing private originals is not required for this audit. Content-level regeneration of the synthesized sounds was not attempted.

The client plan/state now describe audio ownership and manual device limits, but their COMPLETE wording should be qualified until the identified gaps are closed. Project-level current-state/roadmap text still says audio is planned; update the current checkpoint narrowly in the cleanup documentation, without rewriting historical checkpoints. The docs also promise all browser failures remain inside Audio, which F1 currently disproves under fault injection.

## M. Recommended cleanup plan

The priority labels below use the requested checklist's meaning: **P0 = before accepting this PR**, not a claim of a catastrophic production incident.

### P0 — PR gate

1. Close F1 in `client/src/shared/audio/audioEngine.js` and `audioMusicPlayer.js`; extend the existing engine/music hardening tests. A failed resource allocation/open must leave the application usable, release partial resources and permit an appropriate later recovery. Do not absorb invalid catalog registration into the playback fallback.
2. Bring comments in the touched files listed in E into compliance with current `AGENTS.md` / `CLIENT_RULES_AND_CONVENTIONS.md`. Move only necessary invariant explanations into existing docs. If the owner chooses a short-WHY exception instead, that must be explicit and consistent across canonical rules; a stale memory is insufficient.

### P1 — should clean before PR

3. Fix release-to-silence followed by hide/mute in `audioMusicPlayer.js` and `shared/audio/__tests__/audioEngineMusic.test.js` (F2).
4. Cover and resolve delayed renderer readiness in `features/studentRace/pixi/PixiStudentRaceCanvas.jsx` and the existing screen/renderer integration test area (F3). Preserve first-observation silence; no event bus or parallel detector.
5. Correct the waiting-room identifier in `features/teacherLiveRace/hooks/useTeacherRoomSound.js` and its existing test (F4); use `playerId` from the actual room contract.
6. Narrow `shared/audio/index.js` and remove the unused alternate music/loop update operations from `audioEngine.js`, adapting affected engine tests to `claimMusic/releaseMusic` and same-key `startLoop` calls. Retain meaningful behavior coverage.
7. Update current audio status/failure claims and the asset count in `docs/02-client/CLIENT_CURRENT_STATE.md` / `CLIENT_IMPLEMENTATION_PLAN.md`, and narrowly reconcile the present audio status in the project current-state/roadmap docs. Keep physical-device/fullscreen checks explicitly open.

### P2 — optional polish or separate maintenance

8. Internalize/simplify `AudioLoadError` if no diagnostic consumer is added; use a bounded DEV diagnostic for missing keys/unexpected swallowed callbacks if useful. No new logging service or application error taxonomy.
9. Consider relocating `useTeacherRoomSound` to teacherWorkspace. No need to relocate the shared catalog or merge focused engine modules.
10. Reduce broad store subscriptions/unneeded barrel exports only if already editing those files. Do not introduce a settings-row abstraction or storage middleware for cosmetic uniformity.
11. Repair the stale repository skill guidance in a separately scoped guidance update. Review Claude's accumulated notes with the owner before changing them; this audit itself is not authorization to update memory.

After the cleanup: run the client suite, lint, build and scoped diff check once; then perform the outstanding real-device/fullscreen/listening/reconnect checks. Synchronizing with the newer remote main is a separate user-controlled Git step, and should be followed by relevant verification against the integrated state.

## N. Estimated cleanup size

**MEDIUM** overall because strict comment-policy reconciliation touches more than five files, and regression tests/documentation accompany the targeted runtime fixes.

The architecture changes themselves are small and local: resource containment, a music lifecycle branch, renderer readiness, one DTO identifier and a narrower facade. “READY AFTER SMALL CLEANUP” describes the absence of a required architectural redesign; it does not imply fewer than five total files when canonical hygiene is counted. A large rewrite, package swap, global error unification, generalized event bus or wholesale consolidation is not justified.

## O. Final answer

**Run one cleanup patch before commit.** The foundation is broadly built in the same style as the established project. Preserve the engine/catalog/feature split, shared settings, existing lifecycle reuse, authoritative Student moments and Teacher registry integration.

The user's suspicion is partly supported: there is excess exposed vocabulary/API, conflicting working guidance, comment drift and several concrete boundary gaps. It is not supported as a claim that Audio created a second application error system or that most new files should be deleted.

Only this report was added. No implementation, tests, canonical docs, skills or memories were edited; nothing was staged, committed, pushed, merged, reset, restored, stashed or cleaned.

CODEX AUDIO ARCHITECTURE AUDIT COMPLETE — NO CODE CHANGES MADE

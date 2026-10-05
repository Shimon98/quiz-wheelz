# Audio Asset Provenance

**Status:** Canonical  
**Audit date:** 2026-10-05  
**This document owns:** the origin, license and processing record of every shipped audio file

> Every file under `client/src/assets/audio/` must have a row here before it is merged.
> Chat or browser history is never provenance. If a file is removed, remove its row.

## Shipped files

### Music — third-party, CC0

| Production key | File | Purpose | Source title | Author | Source page | License | Original file | Acquired | Original format | Final format | Processing | Attribution |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `music-game-main` | `music/bamboo-blitz.m4a` | Game and pre-race music (student waiting room, teacher waiting room) | Bamboo Blitz | Tsorthan Grove | https://opengameart.org/content/bamboo-blitz | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `bamboo_blitz.flac` | 2026-10-05 | FLAC, 48 kHz, 24-bit, stereo, 76.8 s | M4A, AAC-LC, 48 kHz, stereo, ~130 kbps | Transcoded once with the Windows Media Foundation AAC encoder (128 kbps target). No edits. | Not required |
| `music-race-main` | `music/joyful-jungle.m4a` | Active race music (student race screen, teacher projector) | Joyful Jungle | MintoDog | https://opengameart.org/content/joyful-jungle | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `joyful_jungle_bpm140.mp3` | 2026-10-05 | MP3, 44.1 kHz, 320 kbps, joint stereo, 85.8 s | M4A, AAC-LC, 48 kHz, stereo, ~130 kbps | Transcoded once with the Windows Media Foundation AAC encoder (128 kbps target, resampled to 48 kHz). No edits. | Not required |

### Sound effects and engine loop — in-house

All in-house sounds were designed for QuizWheelz and approved by ear in the Sound Lab review
(2026-10-04/05). They are rendered offline from the same Web Audio synthesis code with
`OfflineAudioContext` (oscillators, filtered white noise, gain envelopes, the same limiter as the
lab), then trimmed of trailing silence below -60 dBFS, given a 10 ms fade-out and peak-normalized
to -1 dBFS. No third-party samples are involved, so there is no external license. They are
project-owned and may be modified freely. The render recipe lives in the private, untracked asset
pipeline (`docs/vision/audio-source/render-sfx.html`), like the other art pipelines.

| Production key | File | Purpose | Design | Format |
|---|---|---|---|---|
| `sfx-answer-correct` | `sfx/answer-correct.wav` | Student: accepted correct answer | Two rising bell notes (A5, E6) with a short high sparkle | WAV PCM16, 48 kHz, mono |
| `sfx-answer-wrong` | `sfx/answer-wrong.wav` | Student: accepted wrong answer | Two soft falling triangle notes through a low-pass, small thud | WAV PCM16, 48 kHz, mono |
| `sfx-combo-tier-1` | `sfx/combo-tier-1.wav` | Student: correct answer with a server streak of 2 to 4 | Five rising pentatonic pluck and marimba notes into a bell | WAV PCM16, 48 kHz, mono |
| `sfx-combo-tier-2` | `sfx/combo-tier-2.wav` | Student: correct answer with a server streak of 5 to 9 | Six notes, two semitones higher | WAV PCM16, 48 kHz, mono |
| `sfx-combo-tier-3` | `sfx/combo-tier-3.wav` | Student: correct answer with a server streak of 10 or more | Eight notes, five semitones higher | WAV PCM16, 48 kHz, mono |
| `sfx-question-time-up` | `sfx/question-time-up.wav` | Student: the question's time ran out | Two ticks and a falling whistle | WAV PCM16, 48 kHz, mono |
| `sfx-race-finish` | `sfx/race-finish.wav` | Student: own authoritative finish | "Winning marimba": rising pentatonic marimba run into a bell chord, soft kick and shimmer | WAV PCM16, 48 kHz, mono |
| `sfx-race-start` | `sfx/race-start.wav` | Student: race opens (waiting to racing) | Three quick square pips and a high GO tone (0.74 s, a start flourish, not a countdown) | WAV PCM16, 48 kHz, mono |
| `loop-hover-engine` | `loops/hover-engine.wav` | Student: own kart engine while racing | Sawtooth and square voices with a sub, vibrato and filtered air noise; one 2.000 s period cut from the steady state so every voice closes a whole cycle | WAV PCM16, 48 kHz, mono, seamless loop |
| `sfx-projector-player-joined` | `sfx/projector-player-joined.wav` | Teacher waiting room: a roster refresh brought new players | Two soft rising bubble pops | WAV PCM16, 48 kHz, mono |
| `sfx-projector-race-start` | `sfx/projector-race-start.wav` | Teacher: race started (on a successful Start) | Soft G major pad with three bell notes | WAV PCM16, 48 kHz, mono |
| `sfx-projector-player-finished` | `sfx/projector-player-finished.wav` | Teacher projector: one player finished | "Wood and bell": two woodblock taps and a soft bell | WAV PCM16, 48 kHz, mono |
| `sfx-projector-race-finished` | `sfx/projector-race-finished.wav` | Teacher projector: race finished | "Jungle drums": accelerating conga roll into a marimba chord, kick, clap and cymbal | WAV PCM16, 48 kHz, mono |

## Reviewed and not shipped

| Asset | Author | Source page | License | Why not shipped |
|---|---|---|---|---|
| Jungle Battle Loop (`BattleLoop2.ogg`, file tag "Taylor Harris 2017") | omfgdude | https://opengameart.org/content/jungle-battle-loop | CC0 | Liked by Shimon and kept for a future Safe/Turbo music pair; no current scene uses it, so it is not shipped. |
| Joyful Jungle Climax (155 BPM) | MintoDog | https://opengameart.org/content/joyful-jungle | CC0 | Idea for the last stretch of a race; not part of the current scene list. |

## Adding a file

1. Prefer CC0. A simple attribution license is acceptable only after review, and its credit must be added here and in the product credits.
2. Never ship NC, ND, unclear "royalty free", ripped or commercial game audio.
3. Record the source page, author, license, original file name, acquisition date, original and final format and every edit before the file is merged.

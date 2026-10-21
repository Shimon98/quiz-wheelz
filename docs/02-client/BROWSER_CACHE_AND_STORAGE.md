# Browser Cache and Storage

**Status:** Canonical  
**Audit date:** 2026-10-19  
**This document owns:** what the client keeps in the browser (Web Storage, the HTTP cache, in-memory
caches), the provenance of the self-hosted fonts, and the future HTTP caching specification

> The code is authoritative. Rows marked OPEN were not verified in this audit: do not quote them in a
> privacy notice or a deployment until their owner confirms them.

## Rules

- The server owns identity and race truth. Web Storage never holds tokens, cookie values, headers or
  raw API responses, and no session decision is made from it.
- Web Storage holds only the interface preferences and the join display cache listed below.
- No Service Worker, Workbox/PWA, IndexedDB, CacheStorage, fetch interceptor or persisted store for
  race state. Redis and Caffeine are server-side only.
- No cookie consent banner while the product has no non-essential cookies or scripts. An information
  notice with an "I understand" button is not consent; its wording waits for approval and is not built.
- Fonts and every other static file are served by the app itself. A new third-party origin needs a
  decision and a row in this document.

## Inventory

| Item | Kind | Key or name | Purpose | Contents (field names only) | Essential | Owner | Lifetime | Sent to the server | User control | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Teacher session | cookie set by the server | OPEN | keeps the teacher signed in | not readable by the client | yes | server | OPEN | yes, with every API call (`withCredentials`) | sign out (OPEN: whether it clears the cookie) | OPEN: name, `HttpOnly`/`Secure`/`SameSite`, lifetime. Project docs describe a teacher JWT `HttpOnly` cookie |
| Student race session | cookie set by the server at join | OPEN | identifies the RacePlayer in one race | not readable by the client | yes | server | OPEN | yes, API calls and the event stream | leaving the race (OPEN) | OPEN, as above. Project docs describe a separate race-specific cookie; one per browser, a new join replaces it |
| Sound settings | `localStorage` | `qw-audio` | music and effects switches and volumes | `musicEnabled`, `sfxEnabled`, `musicVolume`, `sfxVolume` | no | client | until site data is cleared | no | sound settings | verified, `stores/audioSettingsStore.js` |
| Language | `localStorage` | `qw-language` | Hebrew or English | `he` or `en` | no | client | until site data is cleared | no | language switch | verified, `stores/languageStore.js` |
| Theme | `localStorage` | `qw-theme-mode` | light, dark or system | `light`, `dark` or `system` | no | client | until site data is cleared | no | theme switch | verified, `stores/themeStore.js` |
| Join display cache | `sessionStorage` | `quizwheelz.studentJoin` | the waiting room's name, lane and player count after a join or a refresh | `player.displayName`, `player.laneNumber`, `raceTitle`, `roomCode`, `currentPlayers`, `maxPlayers` | no, display only | client | this tab: the next join replaces it, closing the tab clears it | no | close the tab | verified, allowlist in `features/studentJoin/utils/readStoredJoinData.js` |
| HTTP cache | browser | n/a | public static files (JS, CSS, images, audio, fonts) | public files only | no, speed | hosting | per the headers below | n/a | browser settings | spec only, hosting OPEN |
| In-memory caches | page memory | n/a | Pixi textures (`Assets` cache), decoded audio and in-flight downloads, React state | files and interface state | no | client | until the page closes or reloads | no | reload | verified, nothing persists |

Join display cache notes (2026-10-19):

- Only the six fields above are written, whatever else the join response carries now or later, and
  only values of the expected type are read back (text for names and codes, whole numbers for the
  lane and the counts). A missing, broken or wrong-typed value shows the server's race-state instead.
- A blocked or full storage no longer leaves the student on the join form after the server accepted
  the join: the student enters the waiting room, which then shows the server's race-state without the
  extras.
- A value stored before this change (a tab opened earlier) is trimmed to the six fields the first
  time the waiting room reads it; if the browser refuses that write, the six fields still show.
  A tab that never returns to the waiting room keeps the old value until its next join or until it
  closes. A broken value is left as it is and shows nothing.
- It is not cleared on race exit: the next join replaces it and the tab's end clears it, so no
  extra lifecycle was added.

External origins: the client source holds no hardcoded external URL. On the DEV server the landing
page, teacher sign-in and registration, the join form and the waiting room request nothing outside
the app and its API (`VITE_API_BASE_URL`). The teacher dashboard, live race, results and student race
routes were not captured in this audit (OPEN).

## Self-hosted fonts

`client/src/styles/fonts.css` holds the `@font-face` rules Google Fonts served on 2026-10-19 for
`family=Fredoka:wght@400;500;600;700&family=Varela+Round&display=swap` (same descriptors, same
`unicode-range`, `font-display: swap`), pointing at local copies that Vite fingerprints at build time.
Text renders as before: 80 screens compared pixel by pixel on DEV (5 pages, 4 widths, Hebrew and
English, light and dark) matched within the GPU noise of two runs of the old code.

| Family | Google Fonts version | Files (bytes) | License | Acquired |
|---|---|---|---|---|
| Fredoka | v17 (variable, one file per subset serves 400–700) | `fredoka-hebrew.woff2` (8,852), `fredoka-latin-ext.woff2` (4,576), `fredoka-latin.woff2` (29,732) | SIL OFL 1.1, Copyright 2016 The Fredoka Project Authors, no Reserved Font Name | 2026-10-19 from `fonts.gstatic.com`; `OFL.txt` from `github.com/google/fonts` `ofl/fredoka` |
| Varela Round | v21 | `varela-round-hebrew.woff2` (8,012), `varela-round-latin-ext.woff2` (20,328), `varela-round-latin.woff2` (22,948) | SIL OFL 1.1, Copyright 2023 The Varela Round Project Authors, Reserved Font Names "Varela" and "Varela Round" | 2026-10-19 from `fonts.gstatic.com`; `OFL.txt` from `github.com/google/fonts` `ofl/varelaround` |

- The files are byte-identical to Google's; the licenses sit next to them in
  `client/src/assets/fonts/<family>/OFL.txt`.
- Varela Round's Reserved Font Names forbid shipping a modified copy under that name: replace these
  files whole and never edit or subset them here.
- The Vietnamese Varela Round subset is not shipped; the app speaks Hebrew and English.
- Varela Round is a fallback in the font stack: the audited pages never downloaded it, before or
  after the move.
- To update: fetch the same CSS URL with a current Chrome user agent, replace the files whole, keep
  the rules identical apart from the local URLs, and repeat the pixel comparison.

## Future HTTP caching (specification, not active)

The hosting is not chosen, so nothing below is configured anywhere yet.

| Resource | Header | Caution |
|---|---|---|
| Vite build files under `/assets/` (JS, CSS, images, audio, WOFF2, all content-hashed) | `Cache-Control: public, max-age=31536000, immutable` | only for public files whose URL changes with their content |
| `index.html` and any other HTML entry | `Cache-Control: no-cache`, with an ETag or Last-Modified | never `immutable`: it names the current hashes |
| Unhashed files copied from `client/public/` (`favicon.svg`, `icons.svg`) | `no-cache` or a short `max-age` | a long lifetime delays an icon change |
| Authenticated API responses (teacher, student, race, questions, answers) | `Cache-Control: no-store` | race state never comes from a browser cache |
| Event streams (`.../events/stream`) | `no-store`, streaming without proxy buffering, long read timeouts | the proxy or host must pass events through unbuffered |
| SPA routes | unknown non-file paths fall back to `index.html` under the HTML rule | missing `/assets/` files must answer 404, not the HTML |

OPEN decisions:

| Decision | Owner |
|---|---|
| Hosting, CDN and HTTPS | Shimon and Diana |
| SPA fallback and compression (Brotli or gzip for JS and CSS; WOFF2 is already compressed) | hosting owner |
| Whether the API already sends `no-store` (not verified on the server in this audit) | Diana |
| Cookie flags, CORS, CSRF and `SameSite` for production | Diana |
| Event stream proxy settings | hosting owner |

Measured on DEV only (Vite dev server, not production behavior):
- **Cold load:** each needed font file downloads once.
- **Later pages:** they revalidate it with a 179-byte answer.
- **Production:** with the specification above, a returning visit would make no request for a fingerprinted file. That is NOT TESTED until the hosting exists.

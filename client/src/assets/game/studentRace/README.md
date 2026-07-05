# studentRace game assets

Visual assets for the student race screen (UI-10). Every file here must map
to a key in
`client/src/features/studentRace/pixi/assets/raceAssetManifest.js` — the
renderer loads through the manifest and never references file names directly.

## Rules

- **Never change a key when swapping art.** Replace the file, keep the name —
  placeholder to final art must be a zero-code-change swap.
- **No text baked into images.** Score, labels, questions — everything
  textual comes from React (and localizes through i18n).
- **WebP for everything by default** — this repo's standard: all app art was
  converted to WebP (2026-07-05, ~10MB → ~1.2MB) with alpha preserved. Use
  lossy WebP for large backgrounds, lossless WebP where crisp alpha edges
  matter. AVIF is fine where it wins. Keep PNG only as an offline source
  format; don't ship it.
- **Placeholders are allowed** (Diana-approved): until real art exists the
  renderer draws simple shapes under the same keys.
- **Trim baked-in transparent margins before export** — learned on the
  entry-shell plants: transparent padding breaks edge-hugging placement.
- The road texture must **loop seamlessly** vertically; parallax backgrounds
  should tile or be tall enough to scroll.

## Expected layout

```text
client/src/assets/game/studentRace/
  backgrounds/
    jungle-background-far.webp
    jungle-background-mid.webp
    jungle-foreground-leaves.webp
  road/
    road-loop.webp
    road-side-dirt.webp
  karts/
    player-kart.webp
  effects/
    dust-effect.webp
    correct-effect.webp
    wrong-effect.webp
  finish/
    finish-line.webp
  props/
    small-track-prop-01.webp
```

Folders are created when their first real asset lands — no empty
placeholder directories.

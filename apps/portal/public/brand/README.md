# Yushi — the review seal

Yushi takes its name from the Chinese office of the imperial censor, associated
with reviewing documents and exercising oversight. The identity carries that
idea into thoughtful AI code review.

## Design

- A vermilion, clipped-corner seal evokes a traditional stamped impression.
- Paired code brackets connect the seal to software.
- A tapered, brush-like review mark expresses careful examination.
- A serif English wordmark gives the international name a literary character.

The symbol is a contemporary abstraction, not a historical seal or a rendering
of Chinese seal-script characters. A check mark represents the review process,
not a guarantee that AI-reviewed code is correct.

## Assets

- `yushi-mark.svg`: primary, font-independent vector symbol with transparent surroundings.
- `yushi-mark-mono.svg`: ink-and-white version for monochrome use.
- `yushi-mark.png`: 512 × 512 transparent PNG for profiles and other raster uses.
- `yushi-logo.svg`: horizontal symbol and English wordmark; uses Georgia with serif fallbacks.
- `yushi-brand-preview.svg` / `.png`: presentation sheet with light, dark, and small-size examples.

The Portal header uses the primary SVG directly. `src/app/icon.svg` mirrors it
for browser tabs; `src/app/apple-icon.png` is its 180 × 180 raster export.
Update those exports together if the master mark changes.

## Palette and usage

| Color | Hex | Role |
| --- | --- | --- |
| Vermilion | `#A8322D` | Seal |
| Ink | `#242722` | Wordmark and monochrome applications |
| Paper | `#FFF8EB` | Reversed details |

Allow clear space of at least one quarter of the symbol's width. Prefer the
symbol alone below 32 px; use the full wordmark at larger sizes. Keep the symbol
square, retain its colors, and avoid shadows or gradients.

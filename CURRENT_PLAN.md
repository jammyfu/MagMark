# CURRENT_PLAN.md

## Active: responsive cover MVP (2026-09-19)

Approved branch: `codex/2.0.0-beta`. Re-read remote base `694d9ccc2d1692f46574316a6432229771cd4814` before implementation. The user repeatedly approved implementation and beta synchronization. This change does not authorize a main merge, force push, deployment, external model charge, or publication.

### Implemented in this iteration

- A structured one-design/six-variant workflow, accessible from the existing cover dialog's `一稿多比例` action.
- Shared title/subtitle, image, font, alignment and colors; field-level variant overrides including empty text and hidden layers. Global updates preserve local overrides. Reset, undo/redo and versioned design-file save/load.
- Ratio-aware layout for 2.35:1, 1:1, 3:4, 16:9, 9:16 and 4:5; measured text fitting, focal-point crops without stretching, optional centered square safety zone and non-exported guides.
- Current PNG, sequential six-ratio ZIP, and insertion of the current real PNG. Preview and export use the same canvas renderer. Export blocks overflow and missing images rather than silently producing clipped content.
- Original freeform editor retained byte-for-byte as `src/cover/cover-panel-legacy.ts`; its public API remains at `cover-panel.ts`. The responsive entry imports title/subtitle and an eligible first local raster image, not arbitrary legacy layout or flattened text.

### Verification gate

Local isolated strict TypeScript compilation passed. The shared 25 model/layout cases and 21 additional real Chromium/UI/file checks passed (46 total). Actual PNG and ZIP downloads were inspected, including all six image dimensions and CRCs. Browser: Chromium 144.0.7559.96. A complete local checkout could not be downloaded in this runtime, so these are scoped checks, not a claim of full-project validation.

The existing read-only Publishing quality workflow now includes this beta branch and `scripts/check-responsive-covers.cjs`. Re-read its result for the new commit before claiming full typecheck/build/regression success. No CI permission expansion or deployment step was added.

### Next ordered work

1. Inspect the new commit's ordinary CI results and fix any regressions attributable to this change.
2. Add genuine image-provider adapters and a secure key-handling backend, separately from this deterministic editing MVP.
3. Integrate mono-color design rules with attribution; do not bundle the upstream restricted example images.
4. Improve design families, glyph/word-aware composition, face/subject detection, arbitrary multi-layer migration, and real-device/WebKit acceptance separately. They are not complete in this MVP.

Usage and limitations: [RESPONSIVE_COVERS.md](docs/project-governance/RESPONSIVE_COVERS.md).

All prior execution plans, ongoing publishing work, beta deployment history and restrictions remain preserved unchanged in [the prior plan](docs/project-governance/archive/2026-09-19-before-responsive-CURRENT_PLAN.md). This focused feature does not mark those previous tasks complete.

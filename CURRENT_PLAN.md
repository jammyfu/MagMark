# CURRENT_PLAN.md

Current release fix: bundle the header logo through Vite; verify decoded image and SEO assets; restore missing production brand assets and push the focused beta fix.

## Current deployment: layer workspace and SEO/GEO refresh (2026-09-19)

User authorized redeploying the beta with SEO/GEO. Pull origin beta 4e7ae79, verify new layer interactions and pixel exports, expand both static guides with the four-layer workflow and explicit PSD limitations, rebuild and publish the beta with a recoverable backup. Retain the mobile touch fix and all current sitemap URLs.

## Current integration: Photoshop-inspired cover layers and QA (2026-09-19)

The user explicitly requested committing and synchronizing the recovered PS layer workspace and bug fixes into `codex/2.0.0-beta`. Integration base is `c14df796bcfe26e337325ddcdce312d7e03ed024`, four commits after the package base `7db014e`. Preserve all intervening mobile, SEO and deployment documentation. This synchronization does not authorize a main merge, force push, deployment or model-provider charges.

- Integrate the seven responsive layer modules, 29 state/parser/layout cases and two browser regression scripts. Preserve the existing freeform editor and all six output ratios.
- Adapt the existing cover-entry browser test to select contextual text properties; retain every original assertion. Add the two layer scripts to existing read-only CI without changing permissions or dependencies.
- Fresh local strict TypeScript compilation and 29 state cases passed. The same source passed 25 layer UI/file/pixel checks and 16 additional regressions in offline Chromium, using a local CJS bundle and the hash-verified embedded logo. Network navigation is administratively blocked in this runtime; full-project validation remains assigned to the ordinary GitHub CI after synchronization.
- Read the new commit's full CI before claiming repository-wide success. Details and boundaries: [PHOTOSHOP_LAYERS.md](docs/project-governance/PHOTOSHOP_LAYERS.md).

## Current fix: mobile / WeChat gesture containment (2026-09-19)

Fix editor page drift during touch scrolling: lock the outer mobile viewport, retain panel scrolling, stop boundary propagation in older webviews, and track visible viewport height for keyboard/browser chrome changes. Preserve pinch zoom, text selection, native controls and canvas dragging. Verify touch boundaries, keyboard-size transitions and desktop cleanup before publishing the beta fix.

## Current release: latest beta, SEO and source documentation (2026-09-19)

The user explicitly authorized pulling the latest MagMark 2 beta, improving SEO/GEO and deploying to `https://bubufu.com/tools/magmark2/`. Release base is `7db014e`; upstream publishing CI passed. Build in an isolated checkout to preserve the unrelated local PROMOTION.md draft.

- Publish the latest responsive cover implementation with Chinese/English static guides containing verified workflows, dimensions, persistence rules and limits.
- Align application metadata, canonical identity, guide alternates, sitemap and optional llms source index. Do not introduce install prompts, fabricated language routes, ratings or unimplemented AI claims.
- Make the dedicated web build reproducible and check built metadata, linked assets and guide crawlability.
- Run deep repo checks, actual cover PNG/ZIP tests and desktop/mobile production smoke checks; back up the beta before deployment; verify public URLs and root sitemap discovery.

The earlier feature-specific deployment restriction below is superseded for this release by the user's explicit deployment request. Stable MagMark remains a separate release.

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

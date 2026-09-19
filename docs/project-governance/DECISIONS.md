# DECISIONS.md

2026-09-20: Header logo uses a bundled SVG import through HTML instead of an unchecked public path. Existing public brand URLs remain compatible for open sessions.

## 2026-09-19 — PS layer synchronization and QA

Reconcile the recovered package against current beta `c14df796bcfe26e337325ddcdce312d7e03ed024`, not its stale `7db014e` base. Preserve intervening mobile and SEO changes. Keep the PS-inspired workspace additive to the existing freeform entry and retain all original browser assertions. Shared metadata follows modification scope; position edits remain local. Store optional allowlisted stack metadata without changing the v1 file discriminator, retaining old-design import compatibility.

Normalize active selection after deselection, clamp one movement delta for a selected group, exclude locked/hidden members, cancel transient menus/captures/rename controls at lifecycle boundaries, and reset only the selected layer's owned local content/geometry/metadata. No-op edits retain history identity. Invalidate stale composition before asynchronous asset loading. Save uses exactly the same byte-size/schema contract as import. Four content roles plus pinned paper remain the explicit limit; no arbitrary layers, groups, masks, blend modes, PSD or AI-generation claims.

## 2026-09-19 — Mobile scroll containment

Use a fixed editor shell and VisualViewport dimensions at the mobile breakpoint, with CSS overscroll containment plus a directional touch-boundary fallback for older embedded webviews. Cancel only unconsumed single-finger scroll gestures, not native controls, canvas pointer handling, selection or pinch zoom. Guides use normal document scrolling and do not load this module. Physical WeChat behavior still requires on-device confirmation.

## 2026-09-19 — Discoverable beta documentation

Use static Chinese and English guides linked from the editor file menu and sitemap so descriptions remain readable without the editing bundle. Guide translations have reciprocal hreflang and self canonicals; do not claim translated editor URLs because UI language is a client preference. Describe PDF as browser printing and the cover engine as deterministic layout. Keep persistence and network boundaries explicit. llms.txt is supplementary documentation, not a Google ranking mechanism; follow https://developers.google.com/search/docs/fundamentals/ai-optimization-guide .

## 2026-09-19 — Responsive cover boundary

Retain the existing freeform editor without behavioral replacement. Introduce the structured workflow through an explicit action at the same public CoverPanel entry. Import only the current title/subtitle and an eligible local first raster image; the old freeform draft remains intact. Do not claim lossless migration of arbitrary HTML, multiple layers, or AI-flattened text.

Master content is shared, while each target keeps field-level content and normalized layer overrides. Shared edits preserve local exceptions, including empty strings and false. Geometry manipulation is local to the selected ratio. Reset clears only that variant. Export operates on an immutable starting snapshot and is cancelled on close.

Use one canvas renderer for preview, thumbnails and PNG output, with measured text layout and explicit overflow diagnostics. Crop only from safe local raster data and a user-set focal point; do not stretch or claim automatic face detection. Reuse the already approved monochrome logo asset and tint its alpha, never regenerate the mark.

Save editable state in a versioned, validated JSON file with bounded inline images. Do not persist provider keys, request external image models, or claim cloud/autosave durability. Inserted PNG is flattened; the separate saved design remains editable.

The existing read-only CI keeps contents:read and pinned actions. Adding beta coverage does not add deploy steps or expand permissions.

## Prior decisions

All preceding decisions remain available unchanged in [2026-09-19-before-responsive-DECISIONS.md](archive/2026-09-19-before-responsive-DECISIONS.md). This focused feature does not supersede the existing article-safety, mobile, localization, source-preservation or deployment boundaries.

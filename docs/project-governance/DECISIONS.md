# DECISIONS.md

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

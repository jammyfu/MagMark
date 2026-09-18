# DECISIONS.md

## 2026-09-18 — Cover text canvas interaction

Use direct manipulation with separate proportional font scaling and text-box width controls, following Canva double-click editing and Adobe Express text sizing patterns. Preserve independent/shared media scope. Use explicit opaque ink/backing pairs (#172033 / #ffffff) for title and subtitle to avoid unpredictable gradient/image contrast; read theme variables from body. Keep selection chrome outside artwork and strip editing metadata before exports. Font sizes use em and widths use percentages for media adaptation; movement retains the existing pixel offsets. Undo/redo is bounded to 50 changes in the current canvas and resets on template/media rebuild, not persisted draft history.

References: https://www.canva.com/help/add-and-edit-text/ ; https://developer.adobe.com/express/add-ons/docs/guides/learn/how-to/resize-elements ; https://www.adobe.com/learn/express/web/edit-text-express .

## 2026-09-18 — Stable typography controls

Default to scroll view in initial state and reset defaults. Use the existing range steps (font 1px, line height .05, letter spacing .01em) for explicit arrow controls. Store toolbar viewport position independently from selected blocks; initialize once near the first selection and retain it across selection changes/reflow. Dedicated pointer-captured handle supports dragging and keyboard movement; viewport resize clamps position. Remove transformed entry positioning and cancel delayed single-click toolbar updates when a newer multi-selection is shown.

## 2026-09-18 — Flexible clipboard input, one source document

Keep Markdown as the canonical saved document. Ordinary-text mode changes font and language presentation only, never removes existing markup or rewrites the document. It is a plain editing mode, not a Word-compatible WYSIWYG editor. Automatic paste prefers literal Markdown when detected, except Office HTML; explicit plain/Markdown choices bypass HTML conversion. Extract Office structural hints in an inert tree, then pass through the existing shared sanitizer before generating Markdown. Retain tables as safe HTML to preserve merged cells and report unavailable local images. Use one source transaction per paste, preserving undo/autosave. No new package dependency or binary Word file parser.

## 2026-09-18 — Precise font-size controls

Keep the existing slider and add labelled up/down buttons, using its 1px step and 10–64px limits. Dispatch the existing input/change events so individual and batch selection share the established style update and repagination path. Use neutral high-contrast controls independent of article theme, following frontend-design guidance within the existing toolbar.

## 2026-09-18 — Screenshot follow-up: justified prose

Supersedes the earlier left-aligned default after explicit user feedback about ragged right edges. Restore auto justification for magazine paragraphs, lists and quotes with left-aligned last lines. Scope .94em Latin/digit optical sizing to mixed prose; preserve source text, full English words, code, links and pure English paragraphs. Bare URLs get their own break-all span to avoid pushing a whole reference onto the next line. Render these spans before measurement, including print rules. WeChat's own paste sanitizer still enforces its platform-safe left alignment; no claim of platform justification support.

## 2026-09-18 — One typography path before pagination

Use native CSS Text autospace and contextual punctuation trim where supported; otherwise apply conservative cross-inline spacing before measurement. Remove Han CDN rendering from Web/print entry points so no post-pagination DOM decoration changes line metrics. Default body/list/quote alignment to left: CSS-only justification cannot guarantee CLReq gap bounds for long Latin tokens. Keep explicit source spacing and literal code/links intact; portable copy materializes spaces only in output. Theme fonts gain CJK-capable families. Research, limitations and fixtures: docs/MIXED_TYPOGRAPHY.md.

## 2026-09-18 — Independent beta and preview source identity

User confirmed 2.0 belongs on an independent branch; keep remote main at 1.6.0. Use codex/2.0.0-beta and version 2.0.0-beta.1, without deployment. Renderer-owned, bounded in-memory range identifiers are retained through sanitization and pagination for preview editing. Resolve only against the exact original document; fallback text matching remains conservative for renderers without identifiers.

## 2026-09-18 — Media-specific cover variants

Separate media placement from generic aspect ratio. Each placement retains its own ratio and editable draft; shared edits explicitly overwrite content/template/position across variants but never force all variants to one ratio. Preview uses a scaled output-size canvas. PNG output is separate from legacy article-cover insertion. Distinguish official guidance from third-party practice; document evidence dates and no guaranteed platform acceptance. Cover drafts remain session-only and are labelled accordingly.

## 2026-09-18 — Local draft history and undo controls

Keep CodeMirror undo/redo as session edit history. Independently persist up to 30 source-and-image snapshots in IndexedDB, including blobs for associated directories, without uploads. Restore only after the current source is saved, and compare the latest persisted version ID inside a write transaction to avoid silently overwriting another tab. Do not claim typography parameters, generated covers or remote resources are backed up. Browser storage is not a substitute for exported backups.

## 2026-09-17 — Floating toolbar contrast

The consistently dark floating toolbar uses explicit light labels/values and slider colors independent of article palette. Numeric values use tabular figures and a subtle contrasting backing.

## 2026-09-17 — Delete selected content

Delete through source ranges, never preview DOM removal alone. Resolve every selected block before one atomic source edit, deduplicate ranges and refuse ambiguous matches. Preserve untouched source and image files; use the CodeMirror bridge for undo.

## 2026-09-17 — Workspace splitter pointer support

Share 25–70% bounds for pointer and keyboard resizing. Use pointer capture, preserve the grab offset, and clean up drag state on release/cancel/blur/disposal. Keep the visible divider thin with a wider transparent hit target.

## 2026-09-17 — WeChat list text runs

Apply native leaf text grouping to list items as well as paragraphs/headings/cells. Use an inert HTML tree instead of paired-tag regex so nested lists remain block children, and already grouped runs are not double-wrapped. This addresses an observed export omission; it is not proof of acceptance by the live WeChat checker.

## 2026-09-17 — Source-preserving preview text editing

Double-click opens a nearby Markdown text editor, not mutable article HTML. Resolve unique heading/paragraph AST child offsets against the original source, preserve surrounding syntax, and commit through the existing CodeMirror bridge. Refuse ambiguous, split and HTML/image blocks and concurrent source changes. Escape cancels, composing shortcuts do not commit. Delay single-click floating-toolbar display to prevent it intercepting the second click.

## 2026-09-17 — Independent workspace appearance

Use a light/dark header selector with a guarded local preference. Workspace CSS tokens and native select color-scheme are independent of article themes and exported content. Unavailable storage does not prevent switching. Native option colors are explicitly paired to avoid legacy dark/light contrast conflicts.

## 2026-09-17 — Portable images when copying to WeChat

Preserve pasted raster data URLs and encode decoded local/directory blob images into the clipboard HTML. Do not replace readable images merely because their source is local. Report unavailable images explicitly; target-platform acceptance must be verified separately from clipboard generation.

## 2026-09-15 — Shared trust and quiet interaction boundaries

- Parse raw HTML with parse5 through rehype-raw; sanitize with rehype-sanitize before current primary DOM/output paths. Formatting is not sanitization. Preserve semantic tables and passive image resources; remove executable tags/events/URLs, unapproved CSS and clobbering names. Namespace local IDs and references idempotently.
- Source inspection/editing must never instantiate executable HTML. Inert AST ranges retain exact repeated-image source coordinates; normalization of raw HTML is limited to a user-requested image edit.
- Auxiliary controls use native dialogs in supporting browsers, with explicit Tab wrapping and focus return. Legacy DOM-only hosts have an explicitly non-modal fallback; do not call that fallback equivalent to native accessibility support.
- Aspect ratio applies to placeholder/generation preferences, not destructive replacement or fictitious cropping of an existing image. Remove nonfunctional crop buttons rather than advertise a feature that does not work.
- UI style is independent from article style. Advanced ratio and optional AI configuration stay collapsed. No new permanent toolbar controls or automatic source normalization.
- Preview commits are source/layout-version checked at asynchronous boundaries. Keep visible content while updating, clear empty source immediately, and disable output actions until the matching preview finishes. Font/image load readiness is a separate, still-open acceptance gate.
- Build/test integration uses a deterministic, hashed file manifest and exact parent, then full fresh checks before a non-force push to the approved feature branch. Temporary integration/snapshot helpers are removed; ordinary CI remains read-only.

## 2026-09-15 — less-is-more workspace

Simplify discovery rather than delete capability. The shell owns independent colors, workspace views and inspector state. Existing renderers and control IDs remain authoritative; source, image-directory, image-edit and target-specific export contracts are preserved.

CodeMirror adapts one textarea instance. It does not mutate browser prototypes or normalize source automatically. External source changes are narrow and undoable; composition guards do not substitute for real operating-system IME validation.

A native export dialog groups copy and file actions. State must not imply durable saving, uploading, publication or complete PNG output when the known page diagnostics indicate otherwise. Article styles remain independent from the light workspace.

Build the actual web entry by default and preserve an explicit optional library build. Keep strictness and include root entries. Lower-level unimplemented export backends return explicit unavailable results, never fake file bytes. Shared sanitization and parser migration remain open work.

Integration is restricted to the approved feature branch. One-time write-enabled helpers are removed after verified use; ordinary CI has contents:read, pinned actions and no persisted checkout credentials. No merge, deployment or WeChat account action.

## Inherited decisions

The complete earlier decisions are preserved byte-for-byte in [2026-09-14-DECISIONS.md](archive/2026-09-14-DECISIONS.md). In particular retain exact-range image editing, local-directory permission boundaries, native WeChat tables, 24px/20px paper insets, separate Word/WeChat output paths and the existing emphasis fix. Later entries in that historical document supersede its earlier workarounds.
## 2026-09-18 — Aspect-aware layer canvas

Cover templates supply background and theme; their former nested text layouts are normalized into individually editable absolute layers. Percentage geometry and relative type preserve manual positions within an aspect ratio. Shared edits deliberately recompose other media into safe regions (wide: image beside text; square/portrait: image above text), whereas individual edits stay local. Conservative line estimation supports detached thumbnails, with actual font overflow checks in the editor. A user-invoked auto-layout is undoable.

Layer history includes addition, deletion, visibility and ordering, not only text/styles. Imports accept decoded local PNG/JPEG/WebP up to 10MB each and embed data URLs; no external image upload occurs. Object-fit/object-position are allowed only in the cover sanitization profile. This is a session-local editor, not persisted cover storage; switching media/templates resets local undo history. New text/image layers survive template switching.
## 2026-09-18 — Cover title justification and icons

Distinguish normal justification (natural final line) from distributed alignment (final line justified too). Use CSS text-align/text-align-last and CJK inter-character justification rather than inserting spacing characters into source text. Alignment is layer-local and undoable, and disabled for image selections. Reuse the workspace icon decorator with matching project-authored alignment geometry, accessible labels, tooltips and pressed states.

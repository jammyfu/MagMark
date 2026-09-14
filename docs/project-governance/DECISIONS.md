# DECISIONS.md

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

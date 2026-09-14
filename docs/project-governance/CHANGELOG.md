# CHANGELOG.md

## 2026-09-15 — Continuation (feature branch; not released)

- Add shared HTML trust processing for current magazine, SDK, WeChat, clipboard and cover paths; keep source inspection inert and preserve anchors/table references.
- Refine image/cover tools to quiet native dialogs with keyboard containment and return focus. Collapse infrequent ratio/AI settings and remove nonfunctional crop controls.
- Preserve the selected image through ratio preference changes; restore placeholder insertion after clearing an image.
- Prevent old queued previews from reappearing after source changes/clearing; guard output while layout is pending. Zoom retains article nodes and edit identity.
- Extend trust, image-state and production workspace regressions. Local results and remaining remote/OS-IME/WeChat/slow-resource gates are recorded separately.

## 2026-09-15 — quiet workspace, branch only

- Add a neutral light workspace with write/compare/preview, mobile single-pane presentation, an optional typography inspector, a file disclosure and one export dialog.
- Connect the actual web editor to CodeMirror. Preserve Markdown, source selection, repeated-image targeting and undo. Guard external replacements during composition.
- Block blank and known oversized-page PNG exports; remove stale dialog feedback and false reset/download-success implications.
- Repair baseline strict errors, check the real app entry, and make the default production build output the website rather than only a library.
- Replace lower-level fake export results with explicit unavailable errors.
- Add focused unit tests and production-asset Chromium workspace tests. Fresh remote installation, typecheck, build, deep checks and browser suites passed in integration run 34877645243 before commit e226271.
- Remove temporary diagnostic/integration helpers. Ordinary CI remains read-only. Not deployed or merged; the broader publishing migration remains unfinished.

## Previous changes

The complete previous changelog is preserved unchanged in [2026-09-14-CHANGELOG.md](archive/2026-09-14-CHANGELOG.md).

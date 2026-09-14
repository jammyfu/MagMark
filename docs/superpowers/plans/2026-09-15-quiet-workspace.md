# Quiet workspace implementation plan

Goal: simplify the actual MagMark web editor without removing image editing, typography or publication paths.
Architecture: existing renderers and IDs remain; an independent light workspace and per-textarea CodeMirror adapter manage presentation and transactions. Markdown remains authoritative.
Baseline: verified remote afb7dca. Earlier unpushed-local claims were not assumed recovered.

## Tasks

- [x] Add structural UI regressions before implementation.
- [x] Refactor index.html with file disclosure, write/compare/preview, optional inspector and labelled native export dialog; preserve controller IDs.
- [x] Add responsive workspace state, source-preserving view changes, focus return, Escape handling and reduced-motion styling.
- [x] Wire real-entry CodeMirror with narrow undoable external edits, literal source, selection synchronization and composition guards; no prototype mutation.
- [x] Add self-contained first-run sample and honest empty/download/oversized states.
- [x] Repair baseline type errors without reducing strictness; include root entries; default build emits index.html.
- [x] Run local unit, text, SDK, gate, pagination and production-workspace browser tests plus strict typecheck/build/deep verification.
- [x] Push actual implementation and verify fresh remote integration run 34877645243 before repairs/lock commit e226271.
- [ ] Confirm ordinary read-only CI after helper cleanup; retain PR draft and open publishing acceptance gates.

Acceptance: source survives view/theme changes and undo; repeated images edit only the selected occurrence; normal-state document width fits 375/768/1440px; controls have reachable close/focus behavior; article colors do not recolor the shell. No network-navigation, OS IME or WeChat round-trip certification is implied.

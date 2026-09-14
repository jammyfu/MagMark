# CURRENT_PLAN.md

## Active: quiet workspace and CJK publishing upgrade (2026-09-15)

Branch: `feat/cjk-publishing-upgrade-20260914`. Original base: `7020c3b`; this iteration resumed verified `afb7dca`. No main update, merge, force-push, deployment or WeChat account action is authorized.

This is the only current execution entry. Earlier status and complete execution history are preserved byte-for-byte in [the prior plan](docs/project-governance/archive/2026-09-14-CURRENT_PLAN.md). Earlier unpushed-local claims were not assumed recovered.

### Implemented and verified

- [x] Quiet light workspace: write/compare/preview, optional typography inspector, file disclosure, one export dialog. Original image, theme, copy and export callbacks remain connected.
- [x] Actual web entry uses CodeMirror with literal Markdown, native selection synchronization, narrow source changes and isolated undo. No global prototype mutation or automatic normalization.
- [x] Mobile single-pane layout, independent article/workspace colors, focus return, Escape, keyboard navigation and reduced motion.
- [x] Explicit blank-source and known oversized-page PNG guards; no false cloud-save/publication status.
- [x] Fix strict baseline errors without relaxing strictness; include app.ts, editor.ts and vite.config.ts.
- [x] Default production build produces dist/index.html; optional library build is separate, not an SDK release.
- [x] Lower-level export placeholders reject or return unavailable rather than fake file bytes.
- [x] Local: 88 Vitest, 59 text, 6 SDK guard, 7 verification-gate, 17 pagination-DOM and 14 production-asset workspace checks passed in separate scopes. Strict typecheck, build and deep checks passed.
- [x] Remote integration run 34877645243 passed fresh npm ci, strict typecheck, all configured tests, actual web build, deep checks, Chromium pagination and production-asset workspace checks before pushing e2262712d00b3260127b2f9b28ece9356c588616.
- [x] Existing locked dependency versions/integrities retained; add only the five required CodeMirror direct dependencies and their transitive dependencies.
- [ ] Confirm the subsequent ordinary read-only Publishing quality run after integration-helper cleanup; do not infer success from the workflow file.

Evidence and reproduction: [QUIET_WORKSPACE.md](docs/project-governance/QUIET_WORKSPACE.md), [remote verification](docs/project-governance/REMOTE_WORKSPACE_VERIFICATION.md).

### Remaining ordered work

- [ ] Mature shared HTML trust enforcement before executable DOM insertion, including image-source helpers.
- [ ] Unified source-aware Markdown semantics for magazine and WeChat; preserve existing image syntax and legacy line breaks.
- [ ] Non-destructive cross-inline typography profiles with one spacing engine and explicit normalization preview.
- [ ] Resource readiness and stale-render cancellation with full source/image mapping regression.
- [ ] Real OS Chinese IME, Firefox/WebKit/mobile WebView, live WeChat paste-save-reload and network-navigation validation.
- [ ] Reproducible Paged.js/Vivliostyle comparison, dependency advisory triage and SDK distribution packaging. Keep the current print backend until measured evidence supports changing it.

The UI milestone does not complete the publishing upgrade. Keep PR #7 draft and the live site unchanged.

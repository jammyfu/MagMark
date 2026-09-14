# CURRENT_PLAN.md

## Active: CJK Publishing Upgrade (2026-09-14)

- Branch: `feat/cjk-publishing-upgrade-20260914`; base: `7020c3ba575e77bf7f25cbdeeaf50d1c80636197`.
- User approved direct branch development of the full optimization proposal. Do not merge, force-push, deploy or publish WeChat articles.
- Detailed status and remaining acceptance gates: `docs/project-governance/CJK_UPGRADE.md`.
- [x] Push literal-safe inline tokenization and Unicode-aware, conservative prose spacing with regression checks.
- [x] Integrate text checks into `npm test`; make requested deep verification fail when checks cannot run.
- [x] Remove quadratic reference-detection backtracking and add a 250k-character prose case.
- [x] Commit a read-only CI workflow for dependency installation, tests, typecheck, build and deep verification.
- [ ] Confirm actual CI execution and fix/reconcile full-project baseline failures without weakening strictness.
- [ ] Implement a shared HTML trust boundary and honest public export capability errors.
- [ ] Unify source-aware Markdown semantics, preserving existing image extensions and legacy line-break behavior.
- [ ] Implement non-destructive typography profiles and cross-inline text runs without stacked spacing engines.
- [ ] Repair legal Unicode pagination, multi-page oversized blocks, resource readiness and stale render cancellation.
- [ ] Integrate CodeMirror into the actual textarea-based entry and verify source editing, selection, undo and IME behavior.
- [ ] Run browser/WeChat round-trip regression and a reproducible Paged.js/Vivliostyle comparison before selecting a publication backend.
- Current executed checks: 59 text-module cases passed; 7 verification-gate unit tests passed. These are separate scopes, not a full-editor pass.
- Container clone failed on GitHub DNS; remote GitHub connector writes succeeded. Full-project build/browser checks have not been claimed. A workflow file is not evidence of a successful workflow run.

## Previous Execution History (preserved; historical scopes below do not limit the active upgrade)

## Completed: Long-Article Image Resize And Batch Mapping (2026-09-14)

- [x] Universal image-bounds resize overlay for Markdown and raw HTML images; write sizes back to source and account for preview zoom.
- [x] Missing-image click opens a menu with batch directory association first; header exposes batch image import.
- [x] Browser verified both image forms, batch file chooser, and resizing at 50% zoom. 43 unit tests and targeted strict TypeScript pass.

## Completed: Long-Article Selection And Missing Images (2026-09-14)

- [x] Generate long-view block IDs, restore style overrides and attach block-selection listeners.
- [x] Display missing-image placeholders that retain their original source and support direct replacement.
- [x] Parse Markdown image destinations with the AST, preserving parentheses, angle-wrapped spaces and title attributes; resolve separately selected image directories without ambiguous matches.
- [x] Long-view browser checks: three valid image path variants load, one missing image is editable, replacement stays in place, and selected paragraph styling persists. 41 unit tests and targeted TypeScript checks pass.
- Single Markdown-file selection still requires image-directory permission; the UI now explains this rather than implying adjacent files were imported.

## Active: Local Image Workflow (2026-09-14)

- [x] Add article-directory import and article-relative image mapping, including duplicate filenames.
- [x] Add in-place image context actions for Markdown and HTML images without duplicating edited images.
- [x] Verify real article editing and repeated-image targeting in the browser.
- Browser-extension-based bulk WeChat uploading is not implemented in this change. Await the user's choice on installing an unpacked Chrome extension; do not present local mapping as uploading.

## Completed: WeChat Tables And Mobile Headings (2026-09-14)

- [x] Replace lossy table-to-paragraph export with native responsive table cells on both WeChat paths.
- [x] Normalize heading and descendant wrapping instead of inheriting magazine keep-all rules.
- [x] Add regression coverage: 32 tests and changed-module typecheck pass.
- [x] Preserve the user's updated draft text and images, repair its two tables, then increase article font sizes by 2px at the user's request. Save/reload verifies exact text, two tables, 13 images, 16px body and normal heading breaks. No publication or deployment.

## Completed: WeChat Paper Insets (2026-09-14)

- [x] Restore 24px vertical / 20px horizontal padding inside the copied article background; preserve Word spacing.
- [x] Verify 320/375/677px widths, image sizing and sanitizer round trips. All three widths pass the live platform structure checker.
- [x] With explicit user approval, restore the empty draft, save and reload through native Chrome. All 4200 non-whitespace characters and 13 hosted images retained; padding and background survive saving. No publication.
- [x] 31 tests, changed-module typecheck and repository verification pass.

## Completed: Magazine To WeChat Copy (2026-09-14)

- [x] Reproduce Garden long-article clipboard output with the reported Markdown.
- [x] Add WeChat-compatible copying of the current magazine appearance.
- [x] Preserve colors/backgrounds/image proportions, remove browser layout internals, protect image URLs.
- [x] Verify native Chrome paste, save and reload: all 4200 non-whitespace characters and 13 uploaded images retained; platform structure checker passes.
- [x] Run 30 unit tests, targeted strict TypeScript checks and repository verification. Full-project typecheck remains blocked by existing unrelated errors.
- Public-site deployment is not part of this change; the new copy button is available in the local editor.

## Previous Completed Plan

## Goal

Stop Han.css CJK 着重号 (sesame/circle dots under every glyph) on Markdown `*italic*` / `_italic_`. Magazine preview keeps readable italic. WeChat paste never emits `<em>` / `font-style:italic` / `text-emphasis` marks.

## Tasks

- [x] Confirm Han.css `em:lang(zh|ja)` default (`text-emphasis: filled circle` + dotted-border fallback) and that `index.html` loads it globally (magazine + WeChat preview share the stylesheet).
- [x] Override Han.css emphasis on `em`/`i` in `editor.css`; skip `Han.normalize.renderEm` in magazine init.
- [x] Same override in Paged.js print-preview HTML (loads Han.css independently).
- [x] WeChat `inlineMd`: map `*...*` / `_..._` to color `<span>`, not `<em>`.
- [x] `sanitizeWechatPasteHtml` strips `text-emphasis*` and remaps leftover `<em>`/`<i>`.
- [x] Unit tests in `tests/wechat-paste-html.test.ts`.
- [x] `python3 tools/verify.py` + WeChat paste tests.
- [x] Ready (non-draft) PR.

## Out Of Scope

- Magazine Han spacing / biaodian / hanging punctuation (only the emphasis-mark routine).
- Vendoring a Han.css fork.
- Changing blockquote `font-style: italic` (not `<em>`, not the reported bug).
- Inventing new Markdown syntax.

## Verification

- `python3 tools/verify.py`
- `npm run typecheck` and `npm run test`
- WeChat paste tests: no `<em>`, no `font-style:italic` on emphasis, no `text-emphasis` other than `none`

## Next Candidates

- Maintainer: `gh repo edit jammyfu/MagMark --homepage https://bubufu.com/tools/magmark/`
- Define release-quality acceptance criteria.
- Document export-engine boundaries in code comments without changing behavior.

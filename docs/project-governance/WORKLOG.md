# WORKLOG.md

## 2026-09-18 — Stable multi-selection toolbar and long-view default

- Added .05 line-height and .01em letter-spacing arrow controls using the existing update pipeline; default and reset view now use scroll mode. Applied frontend-design guidance to retain high contrast and wrap the toolbar within narrow viewports.
- Removed per-input selected-block repositioning and duplicate translated entry offsets. Added pointer-captured drag handle and keyboard movement; viewport coordinates survive multi-selection and reflow. Cancel delayed single-click toolbar updates when newer selections appear.
- Live browser: dragged toolbar, Shift-selected two paragraphs, incremented line height and spacing, and restored both. Position stayed exactly 763.997px/250.375px throughout; both paragraphs changed from 24.5px line height to 25.2px and back, with matching spacing updates. Long view was active by default.
- Three new tests cover stable anchoring, viewport bounds and fractional steps. Isolated beta tree passed typecheck, 156 Vitest tests, 59 text checks, 6 SDK guards and production build. Governance verifier passed; unrelated untracked dependency experiments preserved/excluded as before. Existing bundle-size warning remains. No commit, push or deployment.

## 2026-09-18 — Flexible writing and Word clipboard input

- Added ordinary-text presentation (no Markdown syntax highlighter, proportional font) and independent automatic/Markdown/plain clipboard choices. Mode changes preserve the source byte-for-byte; this is not WYSIWYG and does not hide Markdown markers. Followed frontend-design guidance to keep the controls compact within the existing workspace.
- Inert Office hint extraction plus shared sanitization converts headings, inline emphasis, lists, links, quotes and code; merged tables remain safe HTML. Unusable local clipboard image references are reported. No binary .doc/.docx support or external conversion service. Paste is one undoable source transaction with block boundaries; existing autosave receives the input event.
- Added eight conversion tests and two source-editor integration tests. Browser fixture verified rich paste conversion, one-step undo, and plain-text selection from a dual-format clipboard. Live workspace verified ordinary-mode switching without replacing user content. Actual desktop Word clipboard/RTF-only sources and OS IME remain unverified.
- Isolated source tree passed typecheck, all 153 Vitest tests, 59 text checks, 6 SDK guards, build and governance checks. Working-directory typecheck remains blocked only by the pre-existing unrelated untracked sanitize-html.ts missing dompurify/jsdom typings; excluded experiments were not changed. Large-bundle warning remains. No commit, push or deployment.

## 2026-09-18 — Selected-text font-size arrows

- Added labelled up/down buttons beside the existing font-size slider. Each click changes 1px through the same individual/batch style and pagination handlers; buttons disable at 10px and 64px. Applied frontend-design guidance for neutral high-contrast controls consistent with the toolbar.
- Four new stepper tests cover repeated changes, event order, bounds and selection/slider synchronization. Live browser confirmed selected paragraph 14px → 15px → 14px after repagination, preserving the article content; restored the original size after testing.
- Isolated beta tree passed typecheck, 143 Vitest tests, 59 text checks, 6 SDK guards, build and governance verification. Unrelated untracked dependency/deployment experiments were excluded and preserved. Existing large-bundle warning remains. No commit, push or deployment.

## 2026-09-18 — Screenshot-specific CJK justification follow-up

- User rejected the ragged-right result. Restored magazine paragraph/list/quote justification with a left-aligned final line, rather than returning to English-only inter-word justification. Added idempotent render-time optical Latin/digit spans (.94em) and separate breakable bare-reference spans. Kept words, code, links, pure English paragraphs and Markdown characters intact. Print uses matching styles; WeChat retains its platform-safe alignment rules.
- Used frontend-design guidance to validate the exact screenshot text in tests/fixtures/justified-typography.html. Local browser measurement: maximum non-final right-edge gap 97.29px before versus 0.02px after; SemiAnalysis intact, no horizontal overflow or tested punctuation violations. Rechecked 345px and 560px generic fixtures with no overflow/violations. Live editor confirmed justify/left and 14px CJK versus 13.16px Latin.
- Isolated source tree passed typecheck, 139 Vitest tests, 59 text checks, 6 SDK guard checks, production build and governance verification. Existing unrelated untracked dependency experiments remain excluded and untouched. No commit, push or deployment. Saved an actual before/after screenshot in the task visualization directory.

## 2026-09-18 — Chinese/Latin mixed typography

- Applied frontend-design typography guidance within the existing UI. Consulted W3C CLReq, CSS Text 3/4 and Han.js official documentation; recorded sources and tradeoffs in docs/MIXED_TYPOGRAPHY.md.
- Confirmed the live page used inter-word justification, keep-all headings, Latin-only theme font stacks and 349 Han punctuation/spacing wrappers. Removed Web/print Han CDN execution and moved compatibility spacing before pagination; native spacing leaves preview text unchanged. Portable output uses idempotent cross-inline spacing, preserving literal code/links and existing whitespace.
- A visual fixture exposed large justified gaps before a long URL even with auto justification, so reading-first paragraphs/lists/quotes now default left-aligned. This is a deliberate compromise, not a claim of full CLReq print-grid justification. Fonts have CJK fallbacks; print uses the actual article's computed family.
- Browser checks at 345px and 560px: no horizontal overflow and zero tested line-start/end punctuation violations. Live editor: no Han wrapper nodes, normal CJK wrapping, left alignment and CJK font stack. User article was not replaced by test content. Screenshot saved outside the repository in the task visualization directory.
- Isolated source tree (excluding pre-existing unrelated untracked sanitize-html/deployment experiments) passed strict typecheck, all 138 Vitest tests, 59 text checks, 6 SDK guard cases, production build and governance verification. Working-directory typecheck remains blocked only by those pre-existing missing dompurify/jsdom imports. Real WeChat save/reload, Firefox/WebKit and font-load timing remain acceptance gaps. No commit, push or deployment in this iteration.

## 2026-09-18 — 2.0 beta release preparation and preview editing repair

- User confirmed an independent 2.0 branch; created codex/2.0.0-beta and set package/lockfile/UI/README version to 2.0.0-beta.1. Fetched origin and confirmed main remains 7020c3b, version 1.6.0; no main mutation or deployment.
- Fixed renderer/parser mismatch for list titles and continuation text with renderer-owned source ranges, session-scoped identifiers and exact-document validation. Repeated and paginated blocks use their original ranges rather than ambiguous text lookup; legacy renderers retain conservative matching.
- Browser verified that the current article's “情怀撕开” list title opens with its Markdown formatting intact. Cancelled without changing the user's article. Replaced screenshots/magmark-main.png with an actual current dark workspace capture used by all four README translations.
- Isolated staged release tree passed strict typecheck, 132 Vitest tests, 59 text cases, 6 SDK guard cases, production build and governance verification. Working-directory checks still fail only on unrelated untracked sanitize-html experiments with missing dompurify/jsdom types; those files and untracked deployment output/config remain untouched and excluded from the beta commit. Build reports the existing large-JS-chunk warning.

## 2026-09-18 — Multi-media cover editing

- Researched cover placements and recorded cited recommendations in docs/MEDIA_COVER_SIZES.md, including current YouTube official 3840×2160 / 2160×3840 guidance. XHS, WeChat and Bilibili recommendations are explicitly not claimed as verified official constraints.
- Applied frontend-design guidance within the existing restrained workspace: media selector, scoped edits, small variant preview grid, exact output-size canvas, preset reset and current PNG action. Added exact 2.35:1 instead of approximating it as 21:9.
- Three tests passed for preset arithmetic and real panel switching/local/shared edit isolation. Browser showed all nine preview variants and 940×400 WeChat output. PNG action ran, but the in-app browser download event timed out; switched to an attached Blob download link. Download receipt and all-platform acceptance remain unverified. Existing missing dompurify/jsdom types still block full typecheck. Governance/diff checks passed. No deployment or AI API request.

## 2026-09-18 — Autosave, local history and undo/redo

- Added undo/redo actions with live enabled states, history dialog with dated previews, bounded local snapshots, guarded restore and actual-save status. Captures pasted image data and associated directory blobs; stores only locally. Does not include typography state or generated cover state.
- 14 targeted draft/source/workspace tests passed. Browser verified a new 420-character version, undo/redo/undo returning to original 413 characters, automatic save, and refresh reporting recovered local draft. The original text was restored. Image blob round-trip and multi-tab conflict are not browser-certified in this turn.
- Governance verification passed. Full typecheck still reports existing missing dompurify and jsdom types in the unrelated untracked sanitize-html file. No deployment.

## 2026-09-17 — Readable typography values

Removed article-primary color inheritance from floating typography values. Browser computed styles verified all three values at 12px and rgb(245,247,255), with a subtle backing. Labels, slider thumbs and count badge also use independent contrast colors. Governance verification and whitespace checks passed.

## 2026-09-17 — Selection delete icon

Added an accessible trash icon to the floating toolbar and connected figure selection to it. Deletion resolves unique text block/image reference ranges and commits through the source bridge. Three focused tests passed for multiple text blocks, image attributes and atomic ambiguity refusal. Browser verified the icon appears for selected text; did not delete user content through the UI. Governance and whitespace checks passed. Typecheck remains blocked by the existing unrelated sanitize-html missing dependencies.

## 2026-09-17 — Restore splitter dragging

Found only keyboard handlers on the workspace separator. Added pointer capture and bounded drag resizing with cleanup; widened hit target to 13px. Six targeted splitter/workspace tests passed. Browser drag changed the editor from about 789px (42%) to 959px (51%). Governance verification passed; no deployment.

## 2026-09-17 — WeChat list warning follow-up

- Inspected actual starter-article clipboard: 14px body / 28px line-height were already safe numerically, but all three list items lacked leaf grouping. The screenshot's paragraphs 10–12 are consistent with this omission; live checker causality remains unverified.
- Replaced text-run regex with inert-tree grouping including list items and nested block boundaries. Added list/nesting/idempotence regressions; adjusted image assertion to permit the existing image-paragraph class after style.
- 32 clipboard/WeChat tests passed; actual browser clipboard contains three list items and three directly grouped leaf runs after the change. Governance verification and diff check passed. Typecheck still has the existing unrelated missing dompurify/jsdom type dependencies. User must retry live WeChat paste; no WeChat account actions performed.

## 2026-09-17 — Restore directory-image clipboard export

- Removed the unconditional WeChat placeholder replacement for local images. Embedded raster data is preserved; loaded blob/local images are encoded as PNG in the exported HTML. Missing placeholders and unreadable images still report a replacement requirement.
- Clipboard and content-trust tests: 22 passed. This verifies exported image data and sanitization, not WeChat server-side upload or persistence. Governance verification and whitespace checks passed.

## 2026-09-17 — Preview selection refinements

- Made image figures shrink-wrap their rendered content so edit outlines no longer reserve a mostly empty block around narrower images.
- Added semantic batch selection to the existing floating typography toolbar: body copy excluding headings/images/separators, H1, H2, H3, H4–H6, and all headings. The selected scope reuses the existing multi-block typography controls.
- Compact imported image-only HTML paragraphs by tagging the safe `<p><img><br><em>` structure during sanitization, suppressing empty BR line boxes and restoring a deliberate caption line height. The supplied 7,202-character article identified all 6 imported image paragraphs; measured blocks fell from roughly 325–349px to 206–224px with only caption height plus about 7px internal spacing remaining.
- Browser verification selected 8 body blocks with zero headings and 2 H2 blocks with zero body paragraphs in the starter article. The floating toolbar is clamped inside the viewport after its final controls and count badge are laid out.
- Targeted workspace/image tests passed (6/6); compact image sanitization/workspace tests passed (19/19). Browser console remained clear, `git diff --check` and governance verification passed. Full typecheck/test remain blocked by pre-existing untracked `src/core/sanitize-html.ts` / `tests/sanitize-html.test.ts` dependencies (`dompurify`, `@types/jsdom`); `editor.ts` also retains its existing ESLint baseline findings.

## 2026-09-15 — Continuation after quiet workspace

- Resumed remote 6815b10 and read-only snapshot e0b0a5c, not earlier unpushed claims. Confirmed prior ordinary CI 34878022617 succeeded. Only the approved feature branch is used.
- Reproduced four failures in six initial trust cases: WeChat/SDK executable markup and image references falsely found inside comments, script strings and quoted attributes. Added shared rehype-raw/rehype-sanitize processing before live DOM, passive URL/CSS policy, idempotent anchor/IDREF namespacing, and exact inert source ranges.
- Reproduced image ratio replacing a real asset and clearing an image preventing placeholder insertion; both now pass targeted regression. Removed crop controls that only toggled CSS classes and never performed cropping.
- Added quiet native auxiliary dialogs with real Chromium focus wrap/return, Escape and composing-Enter checks; guarded unavailable preference storage and set saved field values as DOM properties, not HTML interpolation. These checks do not certify a real OS input method.
- Reproduced stale content after clearing during queued pagination and article DOM replacement on zoom. Revision checks and synchronous empty-source invalidation prevent stale commits; pending output actions are guarded. Zoom is transform-only.
- Local final scopes: 104 Vitest in 17 files, 59 standalone text, 6 isolated SDK guards, 7 verification gate tests, 17 controlled pagination and 21 production-asset/offline Chromium cases passed. Strict typecheck, web build and deep verification passed. Browser: 144.0.7559.96.
- Added an optional localhost HTTP navigation mode for CI. Local browser navigation returned ERR_BLOCKED_BY_ADMINISTRATOR; the policy was not modified or retried through an alternate host. HTTP navigation is unverified locally, pending the ordinary GitHub runner. External CDN resources remain blocked in fixtures to exercise graceful offline behavior.
- Locked two direct HTML trust packages, adding only their required closure; existing package versions/integrities remain unchanged. Bundle-size warning and pre-existing dependency advisories remain open.
- Remote integration and final CI evidence will be recorded after execution. No merge, deployment, WeChat login/image upload or publication.

## 2026-09-15 — quiet workspace implementation and remote verification

Resumed verified remote afb7dca from its checksummed source/dependency artifact. Previously described unpushed changes were absent and were not counted as recovered. Implemented the real-entry CodeMirror bridge, optional inspector, three workspace views, file disclosure and native export dialog with independent light styling. Source and repeated-image targeting/undo passed actual Chromium interactions. Fixed baseline strict errors and included root entries in typecheck; default production build now emits the website. Lower-level placeholder exports no longer pretend to create files.

Local evidence: 88 Vitest, 59 text, 6 SDK guards, 7 gate checks, 17 pagination DOM cases and 14 production-asset workspace interactions passed in separate scopes. Strict typecheck, web build and deep verification passed. Network navigation, OS IME, other browser engines and live WeChat round trips remain unverified.

- `7958a2283e4e32dfda85462ea4a21f9f6d13550e`: actual UI, controller, CodeMirror adapter, tests and configuration pushed through the GitHub connector.
- Run `34877645243`, job `104088701081`: hash-checked 13 baseline repairs against tested source, resolved pinned CodeMirror dependencies while retaining all existing locked versions/integrities, performed fresh npm ci, strict typecheck, unit/text/SDK/gate checks, web build, deep verification, Chromium pagination and production-asset workspace checks. Every step passed.
- `e2262712d00b3260127b2f9b28ece9356c588616`: verified repaired source and lockfile pushed only after those checks. No main writes, force-push, merge or deployment.
- Remove one-time integration/diagnostic workflows and helpers after successful integration. Ordinary CI retains read-only permission and now tests the production workspace too. Its subsequent run must be checked separately.

Current details: [QUIET_WORKSPACE.md](QUIET_WORKSPACE.md) and [remote evidence](REMOTE_WORKSPACE_VERIFICATION.md).

## 2026-09-17 — Workspace light/dark preference

- Added a labelled header appearance selector, guarded preference persistence and listener cleanup. Updated workspace surfaces, editor text, auxiliary panels and native dropdown colors without mutating article themes.
- Six targeted appearance/workspace tests passed, including restored preference, unavailable storage, disposal and article identity preservation. Browser interaction confirmed dark workspace with unchanged light article, then restored light mode; inspected native options as dark text on white with light color-scheme.
- Governance verification passed. Full typecheck remains blocked by existing untracked `src/core/sanitize-html.ts` imports for missing `dompurify` and `@types/jsdom`; no unrelated dependency changes were made. No deployment.

## Prior execution history

## 2026-09-17 — Double-click preview text editing

- Added a source-preserving contextual editor for uniquely matched Markdown headings/paragraphs/list text. Save updates the existing source bridge; cancel leaves source untouched. Ambiguous/unsupported mapping and concurrent changes fail closed.
- Fixed the floating selection toolbar intercepting the second click by delaying its single-click display and cancelling on double-click.
- Ten targeted preview/workspace tests passed. Real browser verified double-click, edit/save, updated rendered heading, reopen/cancel, and CodeMirror undo restoring the original article. Real OS IME and all unsupported markup variants are not certified.
- Governance-only verifier and diff whitespace checks passed. Typecheck still reports only the existing untracked sanitize-html missing dompurify/jsdom types. No deployment.

The complete earlier worklog is preserved unchanged, using its original Git blob, in [2026-09-14-WORKLOG.md](archive/2026-09-14-WORKLOG.md). Historical test scopes and earlier platform checks are not reclassified as tests of this UI iteration.

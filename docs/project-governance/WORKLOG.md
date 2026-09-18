# WORKLOG.md

## 2026-09-18 — Mobile beta optimization

- Added phone-only single-panel navigation, persistent full-width bottom actions, visible header icons, 44px touch targets, safe-area spacing, compact writing options and constrained dialogs.
- Bootstrap now paints icons/loading status before the editing engine; mobile no longer requests Google Fonts. Cover editing and PNG export load on demand. Starter hero converted from 1,576,400 bytes to 56,662 bytes WebP; original retained.
- Typecheck, deep verifier (203 tests) and production build passed. Headless Chrome tested 320/390/430/768/1280 widths, header and navigation icon visibility, no horizontal overflow, mutually exclusive preview/layout panels, appearance/palette/locale switching. This is viewport emulation, not physical-device testing.

## 2026-09-18 — Dedicated promotional document PROMOTION.md with QR code

- Refactored PROMOTION.md into concise, premium Apple-style copywriting focusing purely on substance, craftsmanship, and economic delivery without excessive slang.
- Added bubufu-url.svg QR code to public/brand and web-public/brand, embedded at the bottom of PROMOTION.md with "扫码查看" and bound in starter.ts for bundled URL resolution.
- Featured tool icon search decoration matching, CJK typography, smart pagination, 3x supersampled PNG export, and lossless WeChat rich text copy.
- Preserved mandatory brand hero and dark/light SVG picture tags; passed strict typecheck, all 203 Vitest tests across 38 suites, and deep governance verification.

## 2026-09-18 — Cover title readability and direct manipulation

- Researched official Canva double-click text editing and Adobe Express resizing/text layout documentation (links in DECISIONS). Applied frontend-design guidance to expand the canvas, consolidate text controls, collapse optional ratio settings and put media previews in a horizontal strip.
- Fixed theme-variable lookup to body; explicit opaque title/subtitle surfaces use #172033/#ffffff pairs and render above template decorations. Text input colors follow workspace appearance. Long initial titles shrink to fit the output viewport. Added direct plaintext editing with IME guards, pointer-captured movement and corner scaling, side width control, numeric adjustments, position reset, current-canvas undo/redo and keyboard movement. Editor chrome is excluded from exported HTML.
- Browser verified rich title double-click edit/commit/undo, real corner drag changing font and width, size restoration, wide WeChat bounds and both workspace appearances. Main article content was preserved. Built-in template contrast/export cleanup and history integration tests passed; isolated tree passed typecheck, 164 Vitest tests, 59 text and 6 SDK checks, production build and governance. Existing unrelated untracked dependency experiments stayed excluded; bundle warning remains. Real downloaded PNG inspection, OS IME and non-Chromium engines remain unverified.
- Previous Git push remains blocked by the recorded automatic approval rejection; no attempt to bypass it or publish these new changes.

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

## 2026-09-18 — Readable table groups and sheets

- Replaced whole-table scaling with at most three columns per group, repeated keys/headers, row packing and long-cell continuation preserving code and emphasis. Added group/sheet captions and actual print-area sizing.
- Browser verification on the current article: 20 table sheets across 35 total article pages, all tables at 14px, no scale transforms, sheet widths 241–483px and height 666px inside the A4 content area. Earlier long-view measurement confirmed no table-to-wrapper overflow. Regression test verifies complete long formatted text reconstruction, keys and column limits; isolated strict typecheck passed. Physical printing and PDF export are not verified.

## 2026-09-18 — Wide table overflow

- Constrained table cells and nested inline code/links to paper width. Added session-only magazine layout choices: fitting, vertical records and measured 90-degree rotation with explicit occupied width/height.
- Isolated TypeScript checking passed. Live browser rotation/export verification remains outstanding; source and existing unrelated experiments were preserved.

## 2026-09-18 — README dark-mode logo contrast

- The black supplied monochrome SVG disappeared against GitHub's dark README background. Added a white derived SVG and a theme-aware `picture` source to each localized README.
- Brand regression coverage checks both sources and the dark media condition. Brand tests, governance verification and whitespace checks pass.

## 2026-09-18 — Formatted direct editing

- Replaced the Markdown textarea for prose/lists with formatted editable content rendered from the complete mapped source. Lists, emphasis, links and inline code are visible as formatting; code blocks retain literal text editing.
- Save reuses the safe rich-text conversion path, unchanged content preserves original source, and cancel/concurrent-edit checks remain. Opening starts at the beginning instead of scrolling to the last character.
- All 18 focused preview-edit and writing-import tests passed; governance verification passed.

## 2026-09-17 — Double-click preview text editing

- Added a source-preserving contextual editor for uniquely matched Markdown headings/paragraphs/list text. Save updates the existing source bridge; cancel leaves source untouched. Ambiguous/unsupported mapping and concurrent changes fail closed.
- Fixed the floating selection toolbar intercepting the second click by delaying its single-click display and cancelling on double-click.
- Ten targeted preview/workspace tests passed. Real browser verified double-click, edit/save, updated rendered heading, reopen/cancel, and CodeMirror undo restoring the original article. Real OS IME and all unsupported markup variants are not certified.
- Governance-only verifier and diff whitespace checks passed. Typecheck still reports only the existing untracked sanitize-html missing dompurify/jsdom types. No deployment.

The complete earlier worklog is preserved unchanged, using its original Git blob, in [2026-09-14-WORKLOG.md](archive/2026-09-14-WORKLOG.md). Historical test scopes and earlier platform checks are not reclassified as tests of this UI iteration.
## 2026-09-18 — Adaptive multilayer cover follow-up

- Replaced fixed shared cover positioning with normalized layer geometry and aspect-aware image/text safe areas; all media thumbnails and synchronized drafts are recomposed for their own ratio.
- Added editable text layers and decoded local image imports, selection list, stacking, visibility, duplication/deletion, numeric size/width, colors/alignment and contain/cover image fitting. Template changes retain added layers; each canvas has reversible layer operations.
- Used frontend-design to retain the quiet editor with a compact layer list and explicit session/history limitations, rather than adding unrelated visual decoration.
- Browser verification: imported the user-provided sample PNG locally, confirmed loaded images and no measured title overflow across all nine media presets. Checked responsive preview dimensions, added-text composition, double-click multiline editing and undo back to the original layers. Test-only cover drafts were cleared by development reload; article source was preserved.
- Validation: isolated beta source tree passed strict typecheck, all 174 Vitest tests, 59 text checks, 6 SDK guards and production build. Workspace governance verification and diff whitespace check passed. Build retains the existing large-chunk/CJS warnings. Unrelated untracked deployment/sanitizer experiments remain excluded and untouched. Actual PNG visual export and non-Chromium/OS IME remain unverified; no push/deployment performed.
## 2026-09-18 — Cover alignment follow-up

- Added five alignment modes and synchronized pressed state with selected layer, undo/redo and media switching. Reused shared SVG decoration for cover and layer buttons; frontend-design guided the compact segmented controls and existing visual style.
- Browser checked distributed title alignment, measured no overflow and confirmed active icon state. Added regression coverage for all five modes, icon rendering, undo/redo and cross-media preservation. Tests run in the existing isolated beta tree to exclude unrelated untracked experiments.
- Validation: strict typecheck, 20 targeted cover/icon regression tests, production build, governance verification and whitespace checks passed. Existing bundle-size warning remains. No publication or remote push performed.
## 2026-09-18 — Workspace appearance and selection

- Added live OS appearance following, explicit light/dark overrides and three muted palette families with separate local preferences and listener cleanup.
- Matched article-style picker surfaces/selected items and native/CodeMirror/block/marquee selection to workspace tokens. Article content/theme remains independent.
- Strict typecheck, seven appearance/workspace tests and isolated production build passed before the final CSS-only selection refinement; governance and browser checks follow.
- Governance and whitespace checks passed. Restored the stopped local Vite service; browser verified dark slate selection uses light ink rgb(224,230,237) over rgb(57,79,104), and article-style selected options use the same paired colors. Restored the user's light/slate choice after checking. Existing build chunk-size warning remains.
# 2026-09-18 — Marquee overlay cleanup

- User screenshot confirms a transient selection rectangle remains after leaving/resizing the window. Existing code only disposed it on document mouseup and allowed overlapping gesture listeners.
- Added single-use mouse gesture lifecycle: window-capture mouseup, cancel on leave/blur/resize/visibility/Escape/new press and missing left-button state. Restore prior user-select; remove overlay before applying selection. Interrupted gestures preserve the previous selection.
- Validation: 7 focused Vitest cases pass; isolated tracked-source strict typecheck passes; git diff --check and governance-only tools/verify.py pass. Working-tree typecheck remains blocked by pre-existing untracked sanitize-html.ts missing dompurify/jsdom types. No live outside-window browser reproduction performed; no Git commit/push in this fix.
# 2026-09-18 — Splitter double-line fix

- Live browser confirmed the focused 1px splitter inherited the generic offset focus outline, producing parallel rails. Replaced only its outline with a contiguous solid accent focus bar; preserved keyboard resizing and 13px pointer target.
- Live browser after CSS hot update: focus-visible true, outline none, accent pseudo-element extends 1px each side, hit target approximately 13px. Both splitter pointer/keyboard tests pass; governance-only verification and diff whitespace checks pass. No source content or saved preferences changed.
# 2026-09-18 — Supplied monochrome brand and README hero

- Packaged the user-provided SVG unchanged as `public/brand/magmark-monochrome.svg` and its companion PNG as `screenshots/magmark-brand-hero.png`.
- Replaced the application header mark and all localized README marks/head images. Dark workspace uses a visual inversion only; document images retain localized alternative text.
- Live browser verified the header at desktop size in dark workspace: the horizontal logo is visible, proportionate, and does not displace the document title. Brand regression test now also checks all README asset references.
# 2026-09-18 — Selected rich-block contrast

- User screenshot exposed a selected code block with pale code foreground on an incorrectly transparent surface. Live computed styles identified the cause: workspace selection chrome overrode `.magmark pre`'s `#0f111a` background but not its `#e2e4f0` text.
- Limited transparent selection fill to plain blocks; pre/table/figure selections retain their own surface while sharing the workspace outline/ring.
- Validation: focused contrast and brand suites pass (8 tests); live browser confirms selected pre foreground `rgb(226, 228, 240)` on preserved `rgb(15, 17, 26)` surface; governance-only verification and whitespace checks pass.
- Follow-up after user rejection: strengthened primary/secondary selection indicators without changing foreground colors. Added renderer-owned source ranges to fenced code bodies and enabled code double-click editing. Live browser confirms the code block has a visible blue solid/inset selection ring and its editor contains the exact visible code body; cancel left source unchanged. Focused preview/selection/marquee suites pass (17 tests).

# 2026-09-18 — Image ratio panel readability

- Replaced inherited fixed light selected fills with palette-aware surfaces and restored full-opacity workspace text colors for direction choices, aspect ticks, current value and reset.
- Raised direction labels to 11px and ratio ticks from 7.5px to 10px; inactive options remain visibly available while accent identifies only the active value.
- Focused image-panel suites pass (5 tests). Live dark-workspace verification confirms inactive text `rgb(173,180,193)`, active text `rgb(231,233,238)`, 10px ticks, 11px direction/reset controls and an accent badge with dark readable ink.

# 2026-09-18 — Complete list direct editing

- Traced the incomplete editor to a semantic mismatch: the selection outline belonged to the top-level list while double-click source lookup chose the nearest list item.
- Added a complete renderer-owned source range to ordered/unordered lists and promote child double-clicks to that range. The dialog label now explicitly says it edits the complete list; item markers, inline Markdown, nested lines and undoable source replacement are preserved.
- Eleven focused preview/selection tests and isolated strict typecheck pass. Live verification against the reported three-item “Bot 名 / 角色” list loaded all three source lines and both later labels; the dialog was cancelled without changing article content.
# 2026-09-18 — Image appearance controls and README startup

- Added image-panel ink/background controls with preview and PNG export; retained original source until applying changes.
- Bundled README and brand assets as the first-run document; saved drafts remain preserved. Removed system-theme picture selection from starter artwork.
- Full typecheck still reports pre-existing missing dompurify/jsdom declarations in untracked src/core/sanitize-html.ts; validating tracked application separately.
- Validation: 12 focused image tests pass, isolated tracked-source typecheck passes, Vite production build includes README hero and logo, governance verification and diff checks pass. Native browser visual inspection was not performed in this turn.
# 2026-09-18 — Picture source identity repair

- Fixed theme-selected currentSrc being mistaken for Markdown source identity. Added regression coverage for picture fallback differing from the displayed source.
- Browser verification on the user's existing README: double-click opened image editor; automatic ink preview produced PNG; applying closed the dialog and article displayed the saved PNG successfully.
# 2026-09-18 — SVG-only appearance UI

- Compact appearance card with conditional custom swatch and background swatch. SVG detection hides ink controls for raster images and clears stale settings when replacing assets. Preview uses article paper color.
- Added regression coverage for SVG-to-PNG switching, conditional swatches and paper preview color.
# 2026-09-18 — Four workspace languages

- Added persistent locale selector, localized chrome and panel strings, four bundled README starters, and explicit README loading for edited drafts. Localized README headers now share hero-first order.
- Converted primary writing/compare/preview, pagination, image/cover/layout, file and export actions to icon buttons with accessible labels.
- Regression tests cover all four language changes, dynamic dialogs, article/source exclusion, counters and distinct localized README content. Browser verified English labels, accessible icon names and translated layout inspector without replacing the current draft.
# 2026-09-18 — Selector icons

- Added decorative language, appearance and palette icons beside native selects, including article style. Icons use currentColor, ignore pointer events and preserve native accessible controls.
# 2026-09-18 — Header selector styling

- Consolidated header selector styling in workspace.css with contained icons, 36px controls, uniform corners and chevrons. Narrow windows retain native menus behind icon-sized controls.
# 2026-09-18 — Confirmed link navigation

- Added an inert, high-contrast link token style to direct rich-text editing and a dialog guard for preview links that leave the current editor. The dialog exposes the resolved address and provides stay/open actions.
- Added regression checks for external-link interception, anchor preservation and edit-session reporting.

# 2026-09-18 — MagMark 2.0 beta SEO and production deployment

- Added a dedicated canonical, search snippet controls, Open Graph/Twitter metadata, WebApplication and breadcrumb JSON-LD for `https://bubufu.com/tools/magmark2/`.
- Added a scoped web manifest, beta sitemap and concise `llms.txt`; parameterized the standalone Vite base path and bundled beta-owned brand, favicon and social preview assets.
- Kept the existing stable `/tools/magmark/` route outside the beta deployment boundary.
- Pinned DOMPurify 3.4.15 and completed the deep verifier: typecheck plus 203 tests passed. The production Vite build completed with `/tools/magmark2/` as its base.
- Published the static beta to `/opt/sites/bubufu.com/public/tools/magmark2`; public HTML, bundled CSS/JS, manifest, sitemap, `llms.txt` and 1200×630 share image return HTTP 200. A browser smoke test confirmed the initialized editor and dynamic beta title.
- Added the beta URL to the main `https://bubufu.com/sitemap.xml` while preserving the stable URL. The portal container remained healthy and unchanged; the sitemap was installed as an exact Nginx-served XML generated from the verified portal build because full-image upload bandwidth was unsuitable for a one-file SEO update.


## 2026-09-18 — Disable browser install promotion

User requested a normal website without the Chrome install promotion. Removed the manifest link and installable web manifest. Preserve canonical, JSON-LD, share metadata, favicon and editor behavior. Production update is limited to removing the manifest link/file; no browser data or drafts are cleared. Browser-owned manual install menus cannot be disabled by the website.

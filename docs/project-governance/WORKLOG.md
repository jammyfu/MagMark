# WORKLOG.md

## 2026-09-14

- Added long-view universal image resize handles; browser verified Markdown width 40% to 56%, raw HTML 200px to 49%, and resizing at 50% preview zoom. Fixed legacy action-strip empty space intercepting small-image clicks.
- Missing-image click now opens a menu with batch directory association instead of forcing individual replacement. Browser file-chooser check passed. All 43 unit tests and targeted strict TypeScript checks passed.

- Fixed long-article selection: renderScroll previously omitted block IDs and click listeners. Long-view blocks now use their own IDs and restore saved block style overrides.
- Added explicit missing-image art with preserved source identity, click-to-replace, right-click editing, double-click editing and keyboard Enter support. Kept placeholder SVGs out of WeChat image exports; valid loaded images retain their sizing.
- Fixed Markdown image parsing for parenthesized/space-containing destinations and made edited Markdown paths safe to parse again. Added unique suffix mapping for separately selected image subfolders and file URLs, while still rejecting ambiguous matches.
- Long-view browser verification: three valid Markdown image variants load; one missing image opens the editor and is replaced without duplication; paragraph selection and a 22px override work. 41 unit tests and changed-module strict typecheck pass. No changes to the user's live WeChat draft.

- Added right-click image editing, replacement, alignment, width presets, source selection and deletion. Markdown AST source ranges prevent edits to code examples or the wrong occurrence of repeated images; stale/ambiguous source mappings are rejected.
- Existing figure Edit now applies changes at the original source instead of inserting another image. HTML images retain surrounding links, local source paths and unrelated attributes; editing preserves alt text. Added figure controls to long-article mode.
- Added article-folder import with explicit article selection when multiple Markdown files exist. Resolve images relative to the selected article before considering unique suffix matches; support parent paths and URL-encoded filenames.
- Browser regression: actual 13-image article changed from 50% to 70% width without duplication or loss of local paths. Multi-article folder selected the correct same-named image; repeated-image action changed only the selected occurrence. Bulk WeChat upload remains unimplemented pending the extension installation decision.

- Restored semantic table/thead/tbody/th/td export on both magazine and WeChat-theme paths. Tables use fixed percentage layout, bounded cell padding, border-box sizing and native leaf text runs instead of repeating column labels in paragraphs.
- Removed inherited keep-all/nowrap/anywhere heading combinations from magazine copying; WeChat headings and their copied descendants now use normal wrapping, break-word fallback and strict CJK line breaking.
- Preserved the user's latest draft edits while restoring its two table grids. A screenshot resized in WeChat retained fixed height; restored proportional height without changing its desktop width. During paste verification detected duplicated content and replaced it with the backed-up single complete article before final verification.
- At the user's subsequent request increased every explicit article font size by 2px and maintained line-height ratios. Native save/reload confirmed exact text equality, 13 images, two tables, 16px body and normal heading breaks. 32 tests and targeted strict TypeScript check pass. No publication or public deployment.

- Fixed the magazine-to-WeChat export forcing outer padding to zero. Set mobile-safe paper insets to 24px vertically and 20px horizontally with border-box sizing; kept Word export spacing unchanged. Regression test first failed with 0px, then all 31 tests passed.
- Native paste at 375px and full-article layout at 320/375/677px have no horizontal/image overflow; platform structure checks pass at all widths. With explicit user approval, restored the now-empty draft and saved/reloaded it: 4200 non-whitespace characters, 13 hosted images, cream background and padding:24px 20px retained. Changed-module strict typecheck passes; no publication or deployment.

- Reproduced the reported Garden long-article copy failure using the actual Markdown and native Chrome UI. Existing image paths contained emphasis-generated HTML and pointed at localhost; 13 images failed insertion.
- Added current-magazine WeChat copying, computed-style allowlisting, local image-directory association and explicit clipboard/image status. Protected raw HTML attributes and generated inline elements from Markdown emphasis replacement.
- Replaced direct paragraph text with native span[leaf] text runs. The live platform checker counts overlapping inline Range rects, so increasing line-height alone did not solve mixed bold/link/code paragraphs.
- Uploaded 13 images through the native WeChat picker, pasted the corrected article, saved the draft and reloaded it. Verified exact equality of 4200 non-whitespace characters, 13 hosted images, no Han custom tags, green typography, cream background and percentage image widths. No publication performed; Chrome JavaScript automation setting remained disabled.
- Verification: 30 unit tests pass; changed-module strict TypeScript checks pass; tools/verify.py and git diff --check pass. Full-project typecheck still reports unrelated existing errors. Live platform verifyArticleStructure returned isValid:true for the final article. Private draft artifacts stay outside tracked source files.

- Disabled Han.css CJK 着重号 on Markdown `*emphasis*`: `editor.css` + print-preview override `text-emphasis: none` on `em:lang(zh|ja)`, and skip `Han.normalize.renderEm`. Magazine path keeps italic without sesame/circle dots.
- WeChat paste maps `*...*` / `_..._` to a color `<span>` (`font-style:normal; text-emphasis:none`), not `<em>`. Sanitizer remaps leftover `<em>`/`<i>` and strips `text-emphasis*`.
- Added WeChat paste unit tests for the user fixture `*视频里的标题画面：The Legend of Trump。*`.

- Tightened the WeChat paste path against the editor dump: line-height ≥ 2× font-size (Range.getClientRects fragments inlines), text-align:left on every text tag, no font-family, no container padding, images/tables marked `data-ignore-width`, GFM tables flattened to paragraphs, no `<br>` inside `<p>`.
- Converted unitless line-heights to explicit px/em, defaulted body `text-align` to `left`, flattened theme/export gradients, and set image `width:100%` with captions that carry a safe line-height.
- Extended `tests/wechat-paste-html.test.ts` so every built-in theme is checked with a long text-only article and an image-rich article.
- Captured real editor screenshots from `npm run dev` (Playwright) and committed `screenshots/magmark-main.png`, `image-panel-smart.png`, `wechat-paste-preview.png`, `print-preview.png`. Added `!screenshots/*.png` so the global `*.png` gitignore no longer drops them.
- Split the public README into four languages (`README.md` 简体 default, `README.zh-Hant.md`, `README.ja.md`, `README.en.md`) with a centered language switcher.
- Cited the live editor https://bubufu.com/tools/magmark/ in all four READMEs, `llms.txt`, and `llms-full.txt`. Kept magazine vs WeChat path honesty and MIT.
- Rebased GEO public-entity docs from `origin/cursor/geo-public-entity-31c9` onto current main (WeChat paste HTML fix #2, tip `92b9922`).
- Deepened README / `llms.txt` / `llms-full.txt` with the shipped WeChat Official Account inline-CSS HTML path (复制富文本; no `text-justify`; no oversized widths) and explicit non-claims (no GitHub Pages, no MagMark 2.0 SEO module as product).
- Kept both governance histories: WeChat paste-fix entries below plus the 2026-09-01 GEO notes.
- Fixed WeChat Official Account paste HTML so 内容结构检测 stops flagging long articles.
- Removed `text-align:justify` / `text-justify` from WeChat themes (editor #2.6 / spec #1.6).
- Replaced `<figure>` + `margin:auto` image blocks with a single `text-align:center` paragraph + `max-width:100%` img (spec #1.4).
- Added `sanitizeWechatPasteHtml` on `renderWechatHtml` / `copyWechatHtml` and unit tests in `tests/wechat-paste-html.test.ts`.
- Magazine Han/Paged preview path was left unchanged.

## 2026-09-01

- GEO pass for the public MagMark entity: README now opens with H1 `MagMark`, bilingual product lead, FAQ, and comparison vs Typora / VuePress / Vivliostyle.
- Demoted `personal-project-standard-entry` to the README footer; governance files kept.
- Added root `llms.txt` and `llms-full.txt`. MIT LICENSE untouched. Docs/metadata only.

## 2026-04-18

- Bootstrapped the repository into the `continuous-project-loop` structure.
- Added durable planning files, governance logs, and a repo-level verification entry.
- Standardized the README entry section and automation guidance for `MagMark`.

# CHANGELOG.md

## 2026-09-14 — CJK upgrade branch (not released)

- Preserve exact-length backtick code spans, escaped delimiters, nested tokens and image attributes in the shared inline guard.
- Make prose spacing Unicode-aware and conservative around code, math, links, raw HTML and references. Avoid long-prose regex backtracking; add a 250k-character case.
- Add `test:text` and run it before Vitest in `npm test`; add separate verification-gate unit tests via `test:verify`.
- Requested deep verification now fails if checks cannot run; governance-only success is explicitly scoped.
- Add a pinned, read-only CI workflow. Workflow execution, full build, browser tests and the larger publishing upgrade are not represented as completed.

## 2026-09-14

- Long-article Markdown and HTML images now have direct drag-resize handles that persist to source. Missing-image menus expose batch directory mapping, and the header labels this action explicitly.

- Fixed long-article block selection and style retention, added editable missing-image placeholders, and fixed Markdown image paths containing parentheses or spaces. Single-file imports now explain when an image directory must be associated.

- Added article-folder import and accurate relative image mapping, plus in-place right-click image actions. Fixed figure editing inserting duplicate images and enabled figure controls in long-article mode.

- Restored proper WeChat table columns, headers and cell borders instead of flattened labeled paragraphs. Fixed mobile subheadings inheriting desktop keep-all/nowrap wrapping rules.

- Fixed WeChat article text touching the background edges: copied magazine layouts now include 24px top/bottom and 20px left/right paper insets, preserved after saving. Images remain proportional without overflow; general Word spacing is unchanged.

- Added current-layout "复制到公众号" alongside general rich-text copy, including visible error/local-image status and local image-directory association.
- Fixed underscore-containing image URLs being rewritten as Markdown emphasis, lost clipboard colors, and redundant legacy clipboard writes.
- Added save-stable native WeChat text runs, portable styles, paper background preservation and proportional images. Verified an actual 13-image draft by native paste, save and reload without publishing.

- Markdown `*italic*` no longer gets Han.css 着重号 dots. Magazine/print override `text-emphasis` on `em`; WeChat paste uses a colored `<span>` and the sanitizer strips leftover `text-emphasis*` / `<em>`.
- WeChat paste HTML now flattens CSS gradients, forces line-height ≥ 2× font-size (Range-rect safe), writes `text-align: left` on every text tag, strips `font-family`, flattens GFM tables, and marks images `data-ignore-width`.
- Added image-free and image-rich paste fixtures that must stay clean on every built-in WeChat theme.
- Added four-language READMEs (简体 default), real editor screenshots under `screenshots/`, and the live editor URL https://bubufu.com/tools/magmark/ in human and machine docs.
- Landed GEO public-entity docs from `cursor/geo-public-entity-31c9` (PR #1) onto main after the WeChat paste HTML fix, and deepened README / `llms.txt` / `llms-full.txt` so magazine PDF/PNG and WeChat Official Account paste HTML are cited as separate shipped paths.
- WeChat paste HTML no longer emits `text-justify` or non-standard `text-align` values.
- WeChat images/captions use a simple centered `<p>` + `max-width:100%` pattern instead of `<figure>` with nested auto margins.
- Added a WeChat-only sanitizer and unit tests that reject oversized fixed widths and unsafe alignment.

## 2026-09-01

- README lead is now the MagMark product entity; internal project-entry chrome is demoted to the footer.
- Added `llms.txt` and `llms-full.txt` for generative-engine citation.
- Documented author identity: Fu Jam / jammyfu / PaintingCoder.

## 2026-04-18

- Added standardized governance files and continuous loop entrypoints.
- Added a repo-level `tools/verify.py` and `tools/next_plan.py`.
- Normalized the README entry section for agent and human navigation.

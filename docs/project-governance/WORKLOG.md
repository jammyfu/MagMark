# WORKLOG.md

## 2026-09-14

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

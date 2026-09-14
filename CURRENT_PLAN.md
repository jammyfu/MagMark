# CURRENT_PLAN.md

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

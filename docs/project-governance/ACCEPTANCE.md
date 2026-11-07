# ACCEPTANCE.md

## Current Acceptance Gates

- WeChat paste HTML (`renderWechatHtml`) contains no `text-justify` and only `text-align: left|right|center`.
- WeChat paste Markdown `*emphasis*` / `_emphasis_` is a `<span>` with no `<em>` / `font-style:italic` / `text-emphasis` other than `none`.
- WeChat paste HTML has no CSS gradients on text backgrounds, and every text-bearing style has line-height ≥ 2× font-size (explicit px or em).
- WeChat standalone images do not use `<figure>` or fixed widths above the ~677px content column.
- Image-free and image-rich WeChat paste fixtures stay clean on every built-in theme.
- Public README H1 is `MagMark`; first screen answers Markdown → Chinese magazine layout/export, names https://magmark.cn/, and embeds existing screenshots `screenshots/magmark-main.png`, `print-preview.png`, and `wechat-paste-preview.png`. Older editor chrome on those captures is captioned. Print PDF and WeChat Official Account HTML remain separate paths.
- Four READMEs exist (`README.md`, `README.zh-Hant.md`, `README.ja.md`, `README.en.md`) and every `screenshots/*` path they embed is a real committed file.
- `llms.txt` / `llms-full.txt` live at the repo root with absolute github.com links to the four READMEs; cite the bubufu online editor; do not invent a GitHub Pages URL.

- Stale local worktree artifacts are removed.
- Governance and loop files exist.
- Verify script can run typecheck and tests when dependencies are present.

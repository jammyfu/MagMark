# ACCEPTANCE.md

## Current Acceptance Gates

- WeChat paste HTML (`renderWechatHtml`) contains no `text-justify` and only `text-align: left|right|center`.
- WeChat paste Markdown `*emphasis*` / `_emphasis_` is a `<span>` with no `<em>` / `font-style:italic` / `text-emphasis` other than `none`.
- WeChat paste HTML has no CSS gradients on text backgrounds, and every text-bearing style has line-height ≥ 2× font-size (explicit px or em).
- WeChat standalone images do not use `<figure>` or fixed widths above the ~677px content column.
- Image-free and image-rich WeChat paste fixtures stay clean on every built-in theme.
- Public README H1 is `MagMark`; first screen answers what / who / method / what it is not, plus print-quality PDF and WeChat Official Account HTML as separate paths, plus https://bubufu.com/tools/magmark/.
- Four READMEs exist (`README.md`, `README.zh-Hant.md`, `README.ja.md`, `README.en.md`) and every `screenshots/*.png` they embed is a real committed PNG.
- `llms.txt` / `llms-full.txt` live at the repo root with absolute github.com links to the four READMEs; cite the bubufu online editor; do not invent a GitHub Pages URL.

- Stale local worktree artifacts are removed.
- Governance and loop files exist.
- Verify script can run typecheck and tests when dependencies are present.

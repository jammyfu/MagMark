# ACCEPTANCE.md

## Current Acceptance Gates

- WeChat paste HTML (`renderWechatHtml`) contains no `text-justify` and only `text-align: left|right|center`.
- WeChat standalone images do not use `<figure>` or fixed widths above the ~677px content column.
- Public README H1 is `MagMark`; first screen answers what / who / method / what it is not, plus print-quality PDF and WeChat Official Account HTML as separate paths.
- `llms.txt` / `llms-full.txt` live at the repo root with absolute github.com links; do not invent a GitHub Pages URL.

- Stale local worktree artifacts are removed.
- Governance and loop files exist.
- Verify script can run typecheck and tests when dependencies are present.

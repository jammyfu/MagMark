# CURRENT_PLAN.md

## Goal

Restore real product screenshots, rewrite the public README into four languages (简体 default), and cite the live editor at https://bubufu.com/tools/magmark/ everywhere it belongs. Docs + screenshots only.

## Tasks

- [x] Capture real UI PNGs from a running `npm run dev` (Playwright + system Chrome): `magmark-main.png`, `image-panel-smart.png`, `wechat-paste-preview.png`, `print-preview.png`.
- [x] Allow `screenshots/*.png` in `.gitignore` so the PNGs can be committed.
- [x] Rewrite `README.md` as 简体中文; add `README.zh-Hant.md`, `README.ja.md`, `README.en.md` with a centered language switcher.
- [x] Put https://bubufu.com/tools/magmark/ in the lead of all four READMEs, `llms.txt`, and `llms-full.txt`.
- [x] Keep magazine vs WeChat paths distinct; keep MIT; do not invent features or GitHub Pages.
- [x] Open a ready (non-draft) docs/screenshots PR against main.

## Out Of Scope

- Rendering, pagination, WeChat sanitizer, or export code changes.
- Replacing `scripts/capture-screenshot.js` (legacy stub kept; real capture is `scripts/capture-readme-screenshots.mjs`).
- Setting GitHub About/homepage via API (propose in the PR body; maintainer applies with `gh repo edit --homepage`).
- Inventing GitHub Pages, metrics, users, or badges.
- Treating MagMark 2.0 SEO-module planning docs as shipped product.

## Verification

- Run `python3 tools/verify.py`
- Confirm all four README image paths exist under `screenshots/` as PNGs.
- Confirm H1 stays `MagMark` and the first screen answers what / who / method / what it is not, plus the bubufu URL.

## Next Candidates

- Maintainer: `gh repo edit jammyfu/MagMark --homepage https://bubufu.com/tools/magmark/` and keep the bubufu URL in the About description if space allows (≤350 chars).
- Optional later: GitHub Pages-hosted `/llms.txt` (not required; repo-root `llms.txt` is enough).
- Define release-quality acceptance criteria.
- Document export-engine boundaries in code comments without changing behavior.

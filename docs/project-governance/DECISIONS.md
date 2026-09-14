# DECISIONS.md

## 2026-09-14

- WeChat paste line-height is at least 2× font-size, in explicit px. Official #2.3.2 divides contentHeight by Range.getClientRects().length; nested strong/em/a/code splits one visual line into several rects, so 1.6–1.85 unitless (or the same ratio in px) still fails on 2-line paragraphs.
- Body text blocks that omit `text-align` get `left`. 公众号 paste serializes the CSS initial `start`, which the editor flags as #2.6.
- CSS gradients are flattened to the first solid color on the paste path (and removed from built-in themes). Spec #4.1.2 flags gradient behind text; decorative `hr` gradients are also removed so every theme is export-safe.
- GFM tables are flattened to paragraphs on the WeChat path. A real `<table>` is one detector paragraph: every `th` is a #1.4 width candidate, and the table Range looks like overlapping line-height.
- Do not inject `font-family` on WeChat paste HTML (spec §3). WeChat paste also omits container padding so `width:100%` images keep widthRatio ≈ 1 across 375/585/677.
- Default public README is Simplified Chinese. Traditional Chinese, Japanese, and English live beside it with a language switcher; English keeps the GEO narrative and the same facts.
- The live product URL is https://bubufu.com/tools/magmark/. Cite it as the online editor. Do not invent GitHub Pages or a `github.io` `/llms.txt`.
- README screenshots must be real captures from the running editor, committed as PNGs under `screenshots/`. Do not keep broken image links.
- Public docs must keep magazine (Han.css / Paged.js / 3× PNG) and WeChat Official Account paste HTML (`src/wechat/*`) as separate shipped paths. Do not describe WeChat paste as magazine Han/Paged typography.
- WeChat export HTML (`src/wechat/*`) is a separate paste path from magazine preview. Only this path is sanitized for 公众号「内容结构检测」.
- Safe `text-align` values for WeChat paste: `left` | `right` | `center` | omit. Never emit `justify`, `start`, `end`, or `text-justify`.
- Standalone images use one centering method: a `<p style="text-align:center">` wrapper and `max-width:100%` on the img. No `<figure>`, no `display:block` + `margin:auto`, no fixed pixel widths.
- Magazine (Han/Paged) rendering in `editor.ts` stays on its own figure/justify typography.
- Repo-root `llms.txt` is the machine brief. Do not invent a GitHub Pages `/llms.txt` URL while `has_pages` is false.
- GEO docs from PR #1 are landed on a new branch/PR that supersedes the conflicting draft rather than rewriting history on `cursor/geo-public-entity-31c9`.

## 2026-09-01

- Public README lead is the MagMark product entity (what / who / CJK magazine typography). The `personal-project-standard-entry` block stays in README but only after License, so agents can still find the markers.
- Typography claims in public docs are limited to features implemented in the 1.6 editor and Paged.js print-preview document (Han.css, Paged.js `@page`, Vivliostyle-style break rules, line-break fix). Do not cite MagMark 2.0 SEO-module docs as the shipped product.
- GitHub About description and topics are proposed in the PR body for a human to apply; this change set does not write repository settings.

## 2026-04-18

- Adopt `CURRENT_PLAN.md` as the only current execution entry for `MagMark`.
- Keep the repository-specific product or technical direction unchanged during governance bootstrap.
- Use `python3 tools/verify.py` as the canonical verification entrypoint.

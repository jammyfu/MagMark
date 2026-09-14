# DECISIONS.md

## 2026-09-14

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

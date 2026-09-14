# DECISIONS.md

## 2026-09-14

- Long-view resizing uses image bounds and the actual preview scale, not fixed page width or figure caption bounds. Source edits remain authoritative. Local image access requires one directory selection, never one file selection per missing image.

- Long-article selection uses a separate scroll block-ID namespace instead of relying on pagination-generated IDs. Missing-image placeholders retain original source metadata so replacing one never writes placeholder SVG data into the Markdown.
- Parse Markdown image destinations before regex inline formatting. Do not treat a single selected Markdown file as permission to read neighboring images; expose directory association requirements explicitly.

- Image editing must replace a validated source range, not find the first matching alt/src or append new Markdown. Reject edits if the source has changed while the image panel was open. Preserve local source URLs when an unchanged Blob preview is applied.
- Folder import prioritizes the selected Markdown file's directory and refuses ambiguous fallback image matches. Directory association is local preview only; it must not claim that WeChat images were uploaded.

- Supersede table flattening: preserve real column semantics with fixed-layout full-width tables and wrapping cells. Native leaf text runs avoid mixed-inline false positives without discarding table structure.
- WeChat heading export must not inherit desktop magazine keep-all or nowrap. Normalize all copied heading descendants as well as the heading itself; use normal word breaks and strict CJK punctuation, with break-word only for oversized tokens.

- Magazine-to-WeChat export uses bounded outer paper padding (24px vertical, 20px horizontal) rather than the earlier zero-padding workaround. An auto-width border-box root and percentage images stay within the reduced content width, validated at 320/375/677px and through native save/reload. Do not copy large A4 page margins or alter the general Word-copy path.

- Add a dedicated WeChat-compatible export of the current magazine theme; do not force users to switch to a separate WeChat theme. General Word copying remains separate. Limit copied CSS to portable visual properties, flatten Han wrappers, preserve effective paper background and image proportions.
- Native WeChat span[leaf] text runs supersede the assumption that a 2x line-height alone prevents structure-check warnings. Preserve paragraph text styles in these runs so saving/reopening retains them and mixed inline marks do not inflate the platform's paragraph line count.
- Do not pretend local/blob/localhost image URLs are publishable. Associate a user-selected local image directory for preview, and report numbered upload placeholders on WeChat copy. Actual WeChat images must be uploaded through the platform or already hosted; no private account tokens enter source code.
- Clipboard API success must not be overwritten by a second legacy copy attempt. A fallback counts as success only when the copy event receives both HTML and text and execCommand succeeds.

- Han.css v3 paints `em:lang(zh|ja)` with `text-emphasis: filled circle` (着重号). MagMark Markdown `*...*` must not use that look. Magazine/print keep italic via a CSS override and by skipping `Han.normalize.renderEm`. WeChat paste does not emit `<em>` or `font-style:italic` (Han.css is global on `index.html`; the Official Account editor also remaps italic/em).
- WeChat paste line-height is at least 2× font-size, in explicit px. Official #2.3.2 divides contentHeight by Range.getClientRects().length; nested strong/span/a/code splits one visual line into several rects, so 1.6–1.85 unitless (or the same ratio in px) still fails on 2-line paragraphs.
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

# DECISIONS.md

## 2026-09-01

- Public README lead is the MagMark product entity (what / who / CJK magazine typography). The `personal-project-standard-entry` block stays in README but only after License, so agents can still find the markers.
- Typography claims in public docs are limited to features implemented in the 1.6 editor and Paged.js print-preview document (Han.css, Paged.js `@page`, Vivliostyle-style break rules, line-break fix). Do not cite MagMark 2.0 SEO-module docs as the shipped product.
- GitHub About description and topics are proposed in the PR body for a human to apply; this change set does not write repository settings.

## 2026-04-18

- Adopt `CURRENT_PLAN.md` as the only current execution entry for `MagMark`.
- Keep the repository-specific product or technical direction unchanged during governance bootstrap.
- Use `python3 tools/verify.py` as the canonical verification entrypoint.

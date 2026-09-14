# CURRENT_PLAN.md

## Goal

Land the GEO public-entity docs from `cursor/geo-public-entity-31c9` (PR #1) onto current `main` (includes WeChat paste HTML fix #2), then deepen SEO/GEO so ChatGPT / Perplexity / Google AI Overviews can cite MagMark as a stable public entity. Docs/metadata only.

## Tasks

- [x] Fetch `origin/cursor/geo-public-entity-31c9` and rebase its docs onto current `main` (`92b9922`).
- [x] Prefer GEO versions of README.md, llms.txt, llms-full.txt, and product-facing PROJECT_BRIEF.md.
- [x] Keep both governance histories: WeChat paste-fix entries from main plus GEO notes.
- [x] Deepen README / llms.txt / llms-full.txt with the shipped WeChat Official Account HTML path; keep magazine Han/Paged and 3× PNG distinct.
- [x] Keep MIT LICENSE unchanged. No editor.ts / CSS / WeChat renderer code changes.
- [x] Open a ready (non-draft) docs-only PR against main that supersedes conflicting draft PR #1 (https://github.com/jammyfu/MagMark/pull/3).

## Out Of Scope

- Rendering, pagination, WeChat sanitizer, or export code changes.
- Setting GitHub About/topics via API (propose in the PR body only; maintainer applies with `gh repo edit`).
- Inventing GitHub Pages, metrics, users, or badges.
- Treating MagMark 2.0 SEO-module planning docs as shipped product.
- Destroying governance files or wiping the WeChat paste-fix history.

## Verification

- Run `python3 tools/verify.py`
- Confirm README H1 is `MagMark` and the first screen answers what / who / method / what it is not, plus print PDF and WeChat HTML.
- Confirm `llms.txt` follows the H1 → blockquote → prose → H2 link-list shape with absolute github.com links.

## Next Candidates

- Apply the proposed GitHub About description and topics in the repository settings after review (`gh repo edit`).
- Optional later: GitHub Pages-hosted `/llms.txt` (not required; repo-root `llms.txt` is enough).
- Define release-quality acceptance criteria.
- Document export-engine boundaries in code comments without changing behavior.
- Add typography regression fixtures to the governance loop.

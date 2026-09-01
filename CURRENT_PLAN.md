# CURRENT_PLAN.md

## Goal

Publish MagMark as a stable public entity for generative engines (ChatGPT, Perplexity, AI Overviews) without touching rendering or export code.

## Tasks

- [x] Investigate README lead, GitHub About/topics, and implemented CJK/export capabilities (no invented typography).
- [x] Put the MagMark product entity first in `README.md`; demote the internal project-entry block.
- [x] Add FAQ (CJK magazine Markdown, Markdown to print-quality PDF) plus comparison vs Typora / VuePress / Vivliostyle, and author jammyfu / PaintingCoder.
- [x] Add root `llms.txt` and `llms-full.txt`.
- [x] Leave MIT `LICENSE` unchanged.
- [ ] Open a docs-only PR with a proposed GitHub About description (≤350 chars) and 8–12 topics. Do not merge.

## Out Of Scope

- Rendering, pagination, or export code changes.
- Setting GitHub About/topics via API (propose in the PR body only).
- Destroying governance files.

## Verification

- Run `python3 tools/verify.py`
- Confirm README H1 is `MagMark` and the first screen answers “what is MagMark” without the internal planning chrome.
- Confirm `llms.txt` follows the H1 → blockquote → prose → H2 link-list shape.

## Next Candidates

- Apply the proposed GitHub About description and topics in the repository settings after review.
- Define release-quality acceptance criteria.
- Document export-engine boundaries.

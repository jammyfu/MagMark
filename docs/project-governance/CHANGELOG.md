# CHANGELOG.md

## 2026-09-14

- Landed GEO public-entity docs from `cursor/geo-public-entity-31c9` (PR #1) onto main after the WeChat paste HTML fix, and deepened README / `llms.txt` / `llms-full.txt` so magazine PDF/PNG and WeChat Official Account paste HTML are cited as separate shipped paths.
- WeChat paste HTML no longer emits `text-justify` or non-standard `text-align` values.
- WeChat images/captions use a simple centered `<p>` + `max-width:100%` pattern instead of `<figure>` with nested auto margins.
- Added a WeChat-only sanitizer and unit tests that reject oversized fixed widths and unsafe alignment.

## 2026-09-01

- README lead is now the MagMark product entity; internal project-entry chrome is demoted to the footer.
- Added `llms.txt` and `llms-full.txt` for generative-engine citation.
- Documented author identity: Fu Jam / jammyfu / PaintingCoder.

## 2026-04-18

- Added standardized governance files and continuous loop entrypoints.
- Added a repo-level `tools/verify.py` and `tools/next_plan.py`.
- Normalized the README entry section for agent and human navigation.

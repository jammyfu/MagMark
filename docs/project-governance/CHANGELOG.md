# CHANGELOG.md

## 2026-09-14

- WeChat paste HTML no longer emits `text-justify` or non-standard `text-align` values.
- WeChat images/captions use a simple centered `<p>` + `max-width:100%` pattern instead of `<figure>` with nested auto margins.
- Added a WeChat-only sanitizer and unit tests that reject oversized fixed widths and unsafe alignment.

## 2026-04-18

- Added standardized governance files and continuous loop entrypoints.
- Added a repo-level `tools/verify.py` and `tools/next_plan.py`.
- Normalized the README entry section for agent and human navigation.

# WORKLOG.md

## 2026-09-19 — One-design / six-ratio cover MVP

- Read the actual `codex/2.0.0-beta` HEAD (`694d9cc`), current cover implementation, media presets, layer editor, tests and governance. Did not use main or overwrite older assumptions onto the current beta.
- Added a structured responsive editor through the existing public CoverPanel API. Preserved the complete freeform implementation as the exact original Git blob `69ee8d609433911084a998c1976235724817833d` in cover-panel-legacy.ts.
- Implemented immutable master/variant state, field-level override/reset, local undo/redo, strict versioned JSON import, six target layouts, measured text fitting, focal crops, square safety guides, bundled logo reuse, PNG/ZIP export and actual PNG insertion.
- Scoped local compilation and 25 model/layout assertions passed. A Chromium 144.0.7559.96 fixture using the actual new panel passed 21 further UI/file checks (46 combined), including local override survival, undo/redo, reset, real downloads, six exact PNG sizes, ZIP CRC validation, design round-trip, safe text, insertion, reopen and a 390px viewport. This is not full-app or physical-device certification.
- Added a separate reproducible browser regression through the public production CoverPanel entry, and added the beta branch to the existing read-only Publishing quality workflow. Full CI status must be read after push; it is not assumed successful here.
- No package versions changed, no model API was called, no third-party reference artwork was copied, no main merge or website deployment was performed.

## Prior history

The previous worklog is preserved byte-for-byte in [2026-09-19-before-responsive-WORKLOG.md](archive/2026-09-19-before-responsive-WORKLOG.md). Its historical checks and deployments are not evidence for this new change.

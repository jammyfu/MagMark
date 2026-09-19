# WORKLOG.md

## 2026-09-19 — Latest beta and SEO/GEO release

- Fetched origin/codex/2.0.0-beta at 7db014e; existing checkout was already synchronized. Isolated release checkout preserves the uncommitted PROMOTION.md edits.
- Confirmed latest upstream CI success at https://github.com/jammyfu/MagMark/actions/runs/35409232016 .
- Added two static guides with workflows, six actual output dimensions, FAQ, editable design persistence, network boundaries and MVP limitations. Updated editor metadata, guide discovery, schema identity and generated sitemap/llms source index.
- Added reproducible build:web pipeline and built-asset SEO checks; retained beta website behavior without a manifest/install promotion.
- Verification: upstream CI passed for 7db014e; local deep verifier passed 231 tests and typecheck; responsive cover browser checks passed 13 cases including all six PNG dimensions and ZIP CRCs. Production build/SEO checks and 390px/1280px production browser tests passed for editor, new covers, guide layout and language navigation.
- Published beta assets and both guides; updated the main sitemap with both guide URLs while retaining all existing entries. Backup: `/opt/stack/backups/magmark2-before-seo-20260919-1320` (site and main sitemap). HTML SHA256 `1948a1f4ca745f2987ed29d1e641421dcb94f82b504e3daa94bf8b36fd9bc380` matches the build. Main sitemap SHA256 `f8fb55767896a64ac3fe38b221cf0bb9cc3981c8b43a073b867fb7e97b061fa5` matches the reviewed update.
- Online 390px/1280px editor, responsive cover, guide navigation and JavaScript-disabled guide checks passed. Public robots permits crawling and advertises the main sitemap. The main sitemap is the existing Nginx-served `/opt/sites/bubufu.com/public/sitemap.xml`; future portal deployments must retain the guide URLs. Search Console submission and actual indexing were not claimed or automated.

## 2026-09-19 — One-design / six-ratio cover MVP

- Read the actual `codex/2.0.0-beta` HEAD (`694d9cc`), current cover implementation, media presets, layer editor, tests and governance. Did not use main or overwrite older assumptions onto the current beta.
- Added a structured responsive editor through the existing public CoverPanel API. Preserved the complete freeform implementation as the exact original Git blob `69ee8d609433911084a998c1976235724817833d` in cover-panel-legacy.ts.
- Implemented immutable master/variant state, field-level override/reset, local undo/redo, strict versioned JSON import, six target layouts, measured text fitting, focal crops, square safety guides, bundled logo reuse, PNG/ZIP export and actual PNG insertion.
- Scoped local compilation and 25 model/layout assertions passed. A Chromium 144.0.7559.96 fixture using the actual new panel passed 21 further UI/file checks (46 combined), including local override survival, undo/redo, reset, real downloads, six exact PNG sizes, ZIP CRC validation, design round-trip, safe text, insertion, reopen and a 390px viewport. This is not full-app or physical-device certification.
- Added a separate reproducible browser regression through the public production CoverPanel entry, and added the beta branch to the existing read-only Publishing quality workflow. Full CI status must be read after push; it is not assumed successful here.
- No package versions changed, no model API was called, no third-party reference artwork was copied, no main merge or website deployment was performed.

## Prior history

The previous worklog is preserved byte-for-byte in [2026-09-19-before-responsive-WORKLOG.md](archive/2026-09-19-before-responsive-WORKLOG.md). Its historical checks and deployments are not evidence for this new change.

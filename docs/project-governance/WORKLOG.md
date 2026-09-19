# WORKLOG.md

## 2026-09-19 — Layer workspace redeployment

- Fetched and integrated origin beta 4e7ae79 in the isolated release directory; preserved the local PROMOTION.md draft.
- Extended Chinese/English crawlable guides and application structured features with layer ordering, names, locks, visibility, opacity and editable-state guidance. Explicitly document four content roles and lack of PSD, mask/group/blend-mode support.
- Verified upstream CI success for 4e7ae79. Local deep checks passed 267 tests and typecheck. Browser suites passed 25 layer checks, 16 regressions and 13 responsive-cover checks including PNG pixels/ZIP outputs. Production 390px/1280px smoke and built SEO checks passed. Multi-selection fixtures now use ControlOrMeta so native macOS contextual Control-click is not mistaken for a selection failure.
- Redeployed beta and guides; backup `/opt/stack/backups/magmark2-before-layers-20260919-1500`. Online 390px/1280px checks passed including four content layers, mobile scroll containment and guide navigation; guide content is available with JavaScript disabled. Live HTML SHA256 `e82310e343e20cf0d6e0d6cafd6e8a39adab17a099409759180763e0f8c66242` matches the build. Main robots/sitemap retain crawl access and both guide URLs; llms source index now documents layer functionality and limits. No search indexing outcome is claimed.

## 2026-09-19 — PS layer integration onto current beta

- Re-read beta at `c14df796bcfe26e337325ddcdce312d7e03ed024` and compared it with the recovered package's `7db014e` base. All four newer commits are retained; their responsive core and cover test files were unchanged. No reset or overwrite of mobile/SEO work.
- Verified all 13 package SHA-256 checksums. Integrated the PS-inspired layer workspace and ten previously reproduced QA fixes, including selection normalization, common-delta movement, transient-state cleanup, per-layer content reset, no-op history, stale-preview invalidation and symmetric save/import size validation.
- Fresh strict isolated TypeScript compilation and all 29 state/parser/layout cases passed. Re-ran the 25 layer UI/file/pixel checks and 16 additional regressions against the compiled source in real offline Chromium: 41 passed, no browser errors. Six PNG dimensions and ZIP CRCs were verified.
- Local Git clone could not resolve github.com; intercepted browser navigation returned ERR_BLOCKED_BY_ADMINISTRATOR. Offline tests used setContent, the installed Chromium, a local CJS bundle and the approved logo via its supported source argument. No network restriction was disabled, no application stub was introduced, and these local adapters are not committed. Full-project validation is delegated to the ordinary read-only CI and must be read after push.
- Preserved all original cover-entry assertions while adding contextual layer selections. Added both new browser scripts to existing CI. No dependency updates, permission expansion, main merge, deployment or image-model calls.

## 2026-09-19 — WeChat/mobile page drift

- Added mobile viewport sizing, fixed outer shell and directional boundary guards. Internal panel scrolling remains native; canvas gestures, text selection and pinch zoom are not globally disabled.
- Deep verifier passed 238 tests including seven new gesture/viewport regressions; build:web and SEO checks passed. Chrome production smoke passed with native header drag and a reduced visible viewport; root scroll remained at zero and navigation stayed visible.
- Chromium native touch scrolling moves the CodeMirror scroller while root scroll remains zero. WebKit 26 production smoke passed at 390px and 1280px, including reduced viewport navigation and cover dialogs. These are browser-engine tests, not a claim of physical WeChat testing.
- Published to `/tools/magmark2/` with backup `/opt/stack/backups/magmark2-before-touchfix-20260919`. Online Chrome touch/viewport tests passed at 390px and 1280px. Live HTML SHA256 `64cf66e0117953a0c9c4cb797ec24ec766ef49be304d72de2707ced3e422b852` matches the tested build. Existing guides and sitemap remain available.

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

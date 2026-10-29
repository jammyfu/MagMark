## 2026-10-29 — ICP display and requested verification-file inspection

- User requests the website filing number and the platform verification file. Read the exact Tencent filing entry: magmark.cn, status normal, 京ICP备2026065859号-1. The supplied detail page provides no site-root verification filename, token or download; no arbitrary file or private registration material is published.
- Added a centered site-shell registration footer and MIIT link, plus both static guide footers. Mobile footer reserves space above the persistent navigation. Site registration stays outside article preview/export content.
- Build/SEO and production-entry browser checks pass; footer visibility at desktop/mobile widths and reduced viewport heights is verified before deployment. Repackage only the MagMark app container; keep the shared edge and private environment intact with previous image available for rollback.

## 2026-10-29 — Docker production deployment verified

- PR #11 integrated MagMark 2 into main (950dc02); PR #12 integrated Docker packaging and final magmark.cn identity (cb468fe). Latest code candidate 11316bf passed complete CI 40814059154 and is an ancestor of main with matching source tree.
- Deployed the validated amd64 magmark-web:11316bf image behind shared Caddy HTTPS. Compose project shared-websites uses independent edge/app containers, per-site config, persistent certificates, shared-web-edge network, no app host-port publication, and 128 MB limits per container. Owner environment and release/image identity records remain outside source control.
- Verified transferred archive SHA256 before Docker load; server app image manifest cc9ec0b85e9bdc828a874b39358d6a1f77566ea420f018511c748d663a51355b and revision label 11316bf574c9d849c106b8861bff23e45a288763. Live HTML SHA256 a0d33a3de6e969634ab992fd8516d2d89752cbe491ffecf3ba2fbd6fdf79e760 matches the tested build.
- Let’s Encrypt certificate issued. Public TLS initially failed because the cloud firewall had no 443 rule. Following the user's explicit action-time confirmation, added IPv4 TCP 443 for the shared HTTPS gateway. Public HTTPS now returns 200; HTTP redirects to HTTPS. Existing SSH/HTTP/Ping rules preserved.
- Live Chrome acceptance passes at 390px and 1280px: editor, decoded logo, icons, mobile touch/viewport containment, panels, six cover formats, four layers and bilingual guides. Guide content remains available with JavaScript disabled. Homepage, both guides, robots, sitemap and QR asset return 200.
- Native Vision barcode detection decoded the regenerated QR as https://magmark.cn/. Default article URLs, public metadata and GitHub About/homepage use the final domain. Local temporary container was stopped and removed. No passwords, private SSH material, actual deployment environment or user drafts were committed or included in the image.

## 2026-10-29 — Docker and final domain follow-up

- Main integration 950dc02 completed after CI 40812932781 passed. User subsequently requests an independent Docker website and changes the final domain to magmark.cn, including article hyperlinks.
- Root SSH access established through a user-entered password and a private control socket; password is not recorded. Read-only inspection found Docker 29.6.1 / Compose v5.3.1, no existing containers or website proxy, free public 80/443, 961 MB RAM, 2 GB swap and 32 GB disk available.
- Google Public DNS resolves magmark.cn to 82.156.172.219. www is absent and will not be added without a DNS record. The earlier magamark.cn identity is superseded.
- Added allowlisted artifact-only Docker packaging, non-root app on an unexposed internal port, shared network, separate TLS edge and 128 MB limits per container. Migrated public/editor/starter links and generated a QR encoding https://magmark.cn/.
- Docker integration testing found the upstream Caddy binary carries cap_net_bind_service, which conflicts with the deliberately empty capability bounding set. Strip that unnecessary file capability in the app image (it listens on 8080) and add a CI health smoke test with production read-only/cap-drop flags.
- Updated source passed typecheck, 267 unit tests, 59 text cases, 6 SDK guards and standalone build/SEO (including scanning runtime bundles for old MagMark URLs). Docker/browser/live deployment checks are recorded below after execution.

## 2026-10-29 — Main integration and standalone deployment preparation

- User explicitly authorizes merging latest remote MagMark 2 into main and deploying to magamark.cn on 82.156.172.219, with multi-site capacity. Integrated beta head 72ca416 into main base 17cac6b without conflicts in an isolated checkout; original worktrees preserved.
- Added MAGMARK_SITE_URL-driven entry identity, static guides, sitemap, robots and build/browser verification. Default Bubufu build remains supported. Added main CI and standalone-domain build/browser checks.
- Fixed the pre-existing logo test's stale public-path expectation to match Vite's bundled source image; actual logo decoding passes in browser tests. No product logic changed by this correction.
- Node 22.23.4: typecheck, 267 unit tests, 59 text compatibility cases, 6 SDK guards and standalone web build/SEO pass. Chrome checks at 390px and 1280px pass editor loading, logo decode, mobile scroll containment, panels, six cover formats, four layers and static bilingual guides. Existing Vite bundle-size/CJS warnings remain.
- CI run 40812602446 passed all existing checks and the standalone build/SEO, but screenshot saving failed because the pre-existing web-release script hardcoded macOS /private/tmp. Use os.tmpdir() for Linux/macOS portability and rerun the complete candidate checks.
- Prepared shared Caddy gateway templates with per-site configuration, release roots, persistent certificates and rollback. No actual server environment or credentials included. SSH TCP/22 is reachable; login details still required. No server installation or public deployment has occurred at this point.

# WORKLOG.md

2026-09-20: Production header brand URL returned HTTP 404 after the previous selectively assembled archive omitted brand/. Isolated this correction from ongoing local cover edits. Added image decode verification; retain existing SEO/GEO documents.

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

- Validation: production build and SEO asset checks passed; governance verification passed. Restored missing production brand directory and verified real Chrome image decoding at 390px and 1280px (2048 × 720 source). Existing deployed editor and SEO/GEO guide content retained.

## 2026-10-22

Node 22 构建环境固定至安全版本 22.23.4；自动质量检查从 .node-version 读取，保持静态应用、用户本地数据和现有发布地址不变。

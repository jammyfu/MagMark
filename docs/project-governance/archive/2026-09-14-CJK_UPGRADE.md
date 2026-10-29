# CJK publishing upgrade — execution status

## Approved scope

The maintainer approved direct implementation on an isolated branch of the preceding MagMark optimization proposal. Markdown source remains authoritative; parsing, visual typography, pagination and target-specific output are separate responsibilities. This document records execution, not completion of the whole proposal.

Repository: `jammyfu/MagMark`.
Branch: `feat/cjk-publishing-upgrade-20260914`.
Base: `7020c3ba575e77bf7f25cbdeeaf50d1c80636197`.

## Implemented and pushed

- [x] Exact-length backtick spans, escaped delimiters, literal HTML inside code, attribute preservation, nested token restoration and unknown-token preservation in `src/core/inline-tokens.ts`.
- [x] Unicode code-point-aware Han/Latin spacing, combining-mark protection, existing-space preservation, configurable spacing, opaque code/math/reference AST subtrees in `src/plugins/cjk-spacer.ts`.
- [x] Linear fixed-width reference detection and a large reference-free prose regression. Ambiguous @ and // runs are intentionally preserved wholesale.
- [x] `npm test` invokes the text regression script before the unchanged Vitest invocation. No dependency or lockfile update was needed.
- [x] Deep verification rejects missing dependencies and unconfigured/skipped checks; default verification identifies governance-only scope.
- [x] Read-only, pinned CI configuration for dependency installation, text tests, gate unit tests, typecheck, Vitest, build and deep verification. Runtime success has to be verified separately.

## Executed evidence (separate scopes)

| Check | Result | Scope |
| --- | --- | --- |
| Text compatibility | 59 passed, 0 failed | Real compiled inline/CJK modules, not full renderers |
| Baseline inline regressions | 12 passed, 15 failed | Original blob verified as `d38d5932462e13dc1276240a120badd5d08ba64a` |
| Verification gate unit tests | 7 passed | Real gate logic with mocked subprocess outcomes; not project npm execution |
| Baseline gate tests | 5 failures out of 7 | Original `verify.py` blob verified as `eb56f8e179fad2330d832627d5848f51c2071c50` |
| Large-prose scanner probe | Previous scanner exceeded 2-second watchdog | 250,000 Latin characters plus Han, isolated Node process |
| Module strict TypeScript compilation | Passed | Two changed production text modules only |
| Full npm test/typecheck/build | Not executed locally | Container cannot resolve GitHub and has no full repository dependency install |
| Browser/IME/WeChat save-reload | Not executed | No fabricated screenshots or platform checks |

Local tooling: Node v22.16.0; installed global TypeScript exposed through NODE_PATH. In a complete checkout, `npm ci` provides the project compiler. Do not add the container's NODE_PATH to project configuration.

## Remaining ordered work and acceptance gates

### P0 — trustworthy content and real verification

- [ ] Confirm an actual CI run, record full-project failures and distinguish existing problems from regressions. Do not lower strictness or suppress failed checks.
- [ ] Add a mature shared HTML sanitization boundary before executable DOM insertion. Preserve valid tables, images, widths and source metadata; reject event handlers, script schemes, unsafe SVG/iframe/style content and clobbering attributes.
- [ ] Replace public export API log/empty-result placeholders with real implementations or explicit capability errors. Browser PNG/print capabilities and SDK capabilities must be described separately.

### P1 — unified semantics and non-destructive typography

- [ ] Introduce a single source-aware Markdown parser, reusing unified/remark rather than adding another regex parser. Keep original offsets, legacy soft-break compatibility and image extension syntax.
- [ ] Migrate magazine and WeChat adapters independently; compare text, table cells, links and image identity using the same fixtures.
- [ ] Add reading/magazine/WeChat/print profiles. Exactly one native/Han/fallback spacing mechanism owns a text run; visual spacing does not edit Markdown.
- [ ] Handle boundaries across strong/emphasis/link nodes without changing code, href, source positions or undo history. Source normalization is an explicit previewable, undoable command.

### P2 — reliable pagination

- [ ] Use one text-node coordinate space including pure whitespace and legal grapheme boundaries. Protect supplementary Han, combining accents, variation selectors and ZWJ emoji.
- [ ] Paginate remaining content iteratively across three or more pages instead of requiring the entire remainder to fit one page. Preserve numbered-list continuation, table caption/colgroup/cell semantics and repeated headers.
- [ ] Add progress guards, explicit oversized-block diagnostics, heading keep-with-next and widow/orphan controls.
- [ ] Await bounded font/image readiness for final layout; reject stale render results and clean measurement containers in finally blocks.
- [ ] Verify semantic content conservation plus selection/image-edit mapping after pagination and preview zoom.

### P3 — actual editor integration and publication comparison

- [ ] Integrate CodeMirror into `index.html`/root `editor.ts`, not only the unused Tiptap component. Preserve opening/saving, directory images, precise source edits, selection, undo and keyboard shortcuts.
- [ ] Use transactions and composition-safe edits; do not replace the full document during IME composition.
- [ ] Run Chromium/Firefox/WebKit fixtures, long-document measurements and real desktop/mobile IME checks. State untested platforms explicitly.
- [ ] Compare Paged.js and Vivliostyle with the same source, fonts, dimensions, images and print cases. Keep the existing backend unless measured evidence supports migration; do not invent comparison scores.

## Reproduction and release gates

In a full checkout of this branch:

```sh
npm ci
npm run test:text
npm run test:verify
npm run typecheck
npm test
npm run build
python3 tools/verify.py --deep
npm run test:e2e
git diff --check
```

The presence of these commands or a CI workflow does not mean they passed. Keep the upgrade draft until implemented features and the relevant migration/functional gates actually pass. The approved project is not complete at the module-fix milestone.

## Non-regression and release boundaries

Keep image original-range editing, repeated-image targeting, directory association, missing-image placeholders, preview scale mapping and batching. Preserve native WeChat tables and 24px vertical/20px horizontal paper insets, plus separate general-rich-text and WeChat-copy rules. Do not publish user drafts, upload account images, store secrets, change licensing, add paid services, deploy or merge without separate authorization.

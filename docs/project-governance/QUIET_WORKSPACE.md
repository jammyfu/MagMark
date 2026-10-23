# Quiet workspace — implementation and verification

## Scope

The current branch implements a quieter workspace, not a replacement of the article rendering engine. The neutral shell uses independent `--ws-*` variables; article theme tokens remain separate. Existing magazine, WeChat, image-directory, image-edit and export control IDs retain their original handlers.

The web entry is now `app.ts`: it initializes the existing editor and adds the workspace controller plus a per-element CodeMirror bridge. Source assignments are narrow, undo-isolated transactions; native value/selection are synchronized for existing image tools. CodeMirror is not wired only to the unused React editor. No browser prototype is modified and ordinary writing does not add spaces or normalize punctuation.

## User-facing changes

Write, compare and preview are explicit workspace modes. The default desktop workspace compares source with output; phones show one pane. File import/save is a disclosure. Typography controls are in an optional inspector, with infrequent settings further collapsed. Export and copying share one native dialog, including a visible scope and a warning that local images need separate upload. Escape/focus return, keyboard editor navigation and reduced motion are supported.

Blank source cannot export old content. Known oversized fixed-page diagnostics block clipped PNG output. Source saving reports only that a browser download was requested, not that the file was durably saved or uploaded. The first-run sample is short and self-contained; it uses no remote image URLs.

## Build and reliability work

`npm run build` now emits the actual website `dist/index.html`. The old library output is separate via `npm run build:lib`; it is not a completed SDK distribution release. Strictness was not relaxed. `tsconfig.json` now includes `app.ts`, `editor.ts` and `vite.config.ts`, which were omitted before, and uses the repository as rootDir.

Baseline repairs include typed Tiptap commands/DOM tuples, optional-meta array construction, undefined sitemap defaults, native Canvas typing, and removal of unused bindings. Lower-level export placeholders reject or return an explicit unavailable result rather than fake file bytes. Source, image and WeChat renderers are otherwise preserved.

## Executed local evidence

Restored source: `afb7dca8f1aab557fea66bbe500716de5d9866ac`.
Source archive SHA-256: `c53523fe11492eecb6340d81d496efa016a55ac5117a5bebce164a33c3bf0618`.
Environment: Node 22.16.0, npm 10.9.2, Linux Chromium 144.0.7559.96. Dependencies were restored from the matching GitHub Actions artifact, then the proposed dependency list was reduced to the five required CodeMirror modules and the lockfile reconciled offline. Fresh npm ci on GitHub remains a separate verification gate.

| Check | Result | Scope |
| --- | --- | --- |
| Baseline Vitest | 67 passed | Actual remote snapshot, not prior unpushed claims |
| Structural UI baseline | 3 failed / 1 passed | Red tests before UI implementation |
| Lower-level export baseline | 5 failed | Old placeholder behavior |
| Optional metadata baseline | 4 failed | Existing generators before fixes |
| Current Vitest | 88 passed | 15 test files, including real CodeMirror jsdom integration |
| Standalone text | 59 passed | Production text modules, not full browser rendering |
| SDK guard | 6 passed | Explicit capability errors |
| Verification gate | 7 passed | Gate logic, separately from actual npm execution |
| Pagination browser | 17 passed | Controlled real DOM cases |
| Workspace browser | 14 passed | Production-built Vite JS/CSS, real Chromium DOM interactions |
| Typecheck | Passed | Strict settings, including real root entries |
| Web build | Passed | index.html plus bundled assets |
| Deep verification | Passed | Configured typecheck and npm tests actually ran |

Browser fixtures inject the built assets into an offline page: network navigation is restricted in this runtime. They are not a live-site navigation test. Chinese/emoji insertion and undo are real browser interactions; OS IME candidate windows are not simulated. The jsdom composition guard is a focused unit test, not real IME certification. No WeChat account or live draft was accessed.

The 14 workspace cases cover desktop defaults, source preservation across views, Chinese/emoji input and undo, arrow-key isolation, inspector focus/Escape, theme isolation, dialog focus, WeChat zoom/reset, file disclosure, 375/768px layouts, repeated-image targeting plus undo, blank export, oversized diagnostics and uncaught-error checking. Screenshots are actual captures, not generated mockups.

## Reproduction

```sh
npm ci
npm run typecheck
npm test
npm run test:verify
npm run build
python3 tools/verify.py --deep
npx playwright install --with-deps chromium
npm run test:pagination
WORKSPACE_BUILD=1 npm run test:workspace
```

For an already installed Chromium use `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for workspace checks and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for pagination checks. `WORKSPACE_SCREENSHOTS=/absolute/path` writes workspace captures. No fixture substitutes network loading, Firefox/WebKit, OS IME or WeChat round trips.

## Open gates

Shared HTML sanitization, parser unification, resource-ready/stale-render handling, cross-inline typography, further browsers, WeChat save/reload and a print-backend comparison remain unfinished. The web bundle still raises a size warning; this change does not suppress it. Existing dependency advisories require their own reviewed upgrade, not an automatic force-update. Keep the PR draft and the deployed site unchanged.

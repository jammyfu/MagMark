# Remote continuation verification — 2026-09-15

## Code and immutable identity

- Repository: `jammyfu/MagMark`.
- Branch: `feat/cjk-publishing-upgrade-20260914`.
- Implementation commit: `d1e3846f6f1054608c8b6f09bbdc99023f8dfc8d`.
- Tested and committed tree: `74d37001cca4f6240c33a8003698af8088413399`.
- Reviewed patch SHA-256: `5421f72da6a1300311ab75930742eea72003b550674d11c939b6736214938990`.
- The complete tree matched the local reviewed staging tree. All 25 manifest file results matched their recorded Git blob hashes.

## Executed remote checks

Run [34886333340](https://github.com/jammyfu/MagMark/actions/runs/34886333340), job `104117800154`, applied the exact reviewed patch before testing. Node `22.23.2`, npm `10.9.8`, Playwright Chromium `145.0.7632.6` on the GitHub Ubuntu runner.

| Scope | Observed result |
| --- | --- |
| Fresh locked install | Passed: `npm ci` |
| Strict TypeScript | Passed; strictness retained |
| Vitest | 104 passed in 17 files |
| Standalone text | 59 passed |
| SDK capability guards | 6 passed |
| Verification-gate tests | 7 passed |
| Controlled DOM pagination | 17 passed |
| Real production HTML, JavaScript and CSS over HTTP | 22 passed |
| Web production build | Passed |
| Deep verification | Passed; all configured commands executed |

The HTTP test served only built `dist` files from a loopback server and blocked external CDN requests. It included source/undo, repeated-image targeting, mobile layout, hostile HTML, stale frames, blank-source clearing, pending output, view-only zoom, auxiliary dialog focus and synthetic composition checks. This is not a deployment, real OS IME certification, Firefox/WebKit test or live WeChat save/reload validation. Local offline execution had 21 workspace cases; remote HTTP mode adds one actual asset-loading case. These are separate executions, not cumulative test counts.

## Branch update and permission boundary

The verification and cleanup/commit steps succeeded. The final bot push failed because `GITHUB_TOKEN` did not have permission to update `.github/workflows/publishing-quality.yml`; therefore the entire one-time workflow is correctly marked failed. No test failed, and this document does not relabel that workflow as successful.

After checking the resulting commit, exact parent and complete tree identity, the already authorized GitHub connector fast-forwarded the approved feature branch to `d1e3846`. The bot token was not given broader permissions, main was unchanged, and no force update was used. Temporary snapshot and integration helpers were removed in the tested implementation tree. Ordinary Publishing quality CI keeps `contents: read` and now runs the real-HTTP workspace mode. The subsequent ordinary read-only run is recorded below.

## Subsequent ordinary read-only CI

[Publishing quality run 34886672517](https://github.com/jammyfu/MagMark/actions/runs/34886672517), job `104118927125`, completed with **success** for implementation commit `d1e3846`. Every configured step passed: fresh locked installation, text/SDK/gate checks, Chromium pagination, strict typecheck, unit tests, production web build, production workspace interactions over real HTTP, and deep verification. This is a separate successful run after temporary helper cleanup; it does not erase or relabel the preceding bot-push permission failure.

## Remaining acceptance gates

The local browser's administrator navigation restriction was left intact; HTTP verification ran on the normal remote CI runner. External font/image readiness, export jobs already in flight, shared Markdown semantics, cross-inline typography, real OS IME, additional engines/WebViews, WeChat round trips, publication-backend comparison and SDK packaging remain open. npm reported existing dependency advisories and Vite retained its large-bundle warning; neither is claimed resolved. This feature branch has not been merged, deployed or published.

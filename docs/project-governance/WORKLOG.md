# WORKLOG.md

## 2026-09-15 — Continuation after quiet workspace

- Resumed remote 6815b10 and read-only snapshot e0b0a5c, not earlier unpushed claims. Confirmed prior ordinary CI 34878022617 succeeded. Only the approved feature branch is used.
- Reproduced four failures in six initial trust cases: WeChat/SDK executable markup and image references falsely found inside comments, script strings and quoted attributes. Added shared rehype-raw/rehype-sanitize processing before live DOM, passive URL/CSS policy, idempotent anchor/IDREF namespacing, and exact inert source ranges.
- Reproduced image ratio replacing a real asset and clearing an image preventing placeholder insertion; both now pass targeted regression. Removed crop controls that only toggled CSS classes and never performed cropping.
- Added quiet native auxiliary dialogs with real Chromium focus wrap/return, Escape and composing-Enter checks; guarded unavailable preference storage and set saved field values as DOM properties, not HTML interpolation. These checks do not certify a real OS input method.
- Reproduced stale content after clearing during queued pagination and article DOM replacement on zoom. Revision checks and synchronous empty-source invalidation prevent stale commits; pending output actions are guarded. Zoom is transform-only.
- Local final scopes: 104 Vitest in 17 files, 59 standalone text, 6 isolated SDK guards, 7 verification gate tests, 17 controlled pagination and 21 production-asset/offline Chromium cases passed. Strict typecheck, web build and deep verification passed. Browser: 144.0.7559.96.
- Added an optional localhost HTTP navigation mode for CI. Local browser navigation returned ERR_BLOCKED_BY_ADMINISTRATOR; the policy was not modified or retried through an alternate host. HTTP navigation is unverified locally, pending the ordinary GitHub runner. External CDN resources remain blocked in fixtures to exercise graceful offline behavior.
- Locked two direct HTML trust packages, adding only their required closure; existing package versions/integrities remain unchanged. Bundle-size warning and pre-existing dependency advisories remain open.
- Remote integration and final CI evidence will be recorded after execution. No merge, deployment, WeChat login/image upload or publication.

## 2026-09-15 — quiet workspace implementation and remote verification

Resumed verified remote afb7dca from its checksummed source/dependency artifact. Previously described unpushed changes were absent and were not counted as recovered. Implemented the real-entry CodeMirror bridge, optional inspector, three workspace views, file disclosure and native export dialog with independent light styling. Source and repeated-image targeting/undo passed actual Chromium interactions. Fixed baseline strict errors and included root entries in typecheck; default production build now emits the website. Lower-level placeholder exports no longer pretend to create files.

Local evidence: 88 Vitest, 59 text, 6 SDK guards, 7 gate checks, 17 pagination DOM cases and 14 production-asset workspace interactions passed in separate scopes. Strict typecheck, web build and deep verification passed. Network navigation, OS IME, other browser engines and live WeChat round trips remain unverified.

- `7958a2283e4e32dfda85462ea4a21f9f6d13550e`: actual UI, controller, CodeMirror adapter, tests and configuration pushed through the GitHub connector.
- Run `34877645243`, job `104088701081`: hash-checked 13 baseline repairs against tested source, resolved pinned CodeMirror dependencies while retaining all existing locked versions/integrities, performed fresh npm ci, strict typecheck, unit/text/SDK/gate checks, web build, deep verification, Chromium pagination and production-asset workspace checks. Every step passed.
- `e2262712d00b3260127b2f9b28ece9356c588616`: verified repaired source and lockfile pushed only after those checks. No main writes, force-push, merge or deployment.
- Remove one-time integration/diagnostic workflows and helpers after successful integration. Ordinary CI retains read-only permission and now tests the production workspace too. Its subsequent run must be checked separately.

Current details: [QUIET_WORKSPACE.md](QUIET_WORKSPACE.md) and [remote evidence](REMOTE_WORKSPACE_VERIFICATION.md).

## Prior execution history

The complete earlier worklog is preserved unchanged, using its original Git blob, in [2026-09-14-WORKLOG.md](archive/2026-09-14-WORKLOG.md). Historical test scopes and earlier platform checks are not reclassified as tests of this UI iteration.

# Responsive cover CI follow-up

Implementation: e28247c78b0c80a364c0556280641dd3fa6fd76a. First complete ordinary PR run: https://github.com/jammyfu/MagMark/actions/runs/35408012252 .

The initial run passed full strict typecheck, 228 Vitest tests, 59 text cases, 6 SDK guards, 7 verifier tests, 17 pagination fixtures, production build and deep verification. It did not pass all browser checks.

The new cover fixture opened an about:blank document with a base tag. Its HTTP logo rendered but tainted the output canvas because a base tag does not change the document origin. Reproduced locally: `Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported.` The fixture now navigates to an intercepted same-origin document and asserts the origin before exercising the real entry, logo and download. No browser security flags or image-origin checks were disabled. The restricted local browser does not allow HTTP navigation; same-origin validation is performed by the ordinary authorized GitHub runner.

Second run for 3bc2628: https://github.com/jammyfu/MagMark/actions/runs/35408787370 . All 13 responsive-cover public-entry checks now passed, including six actual PNG files, ZIP CRCs, PNG insertion and preservation of the original freeform draft. Typecheck, all 228 Vitest tests, build, pagination and deep verification passed again. The unrelated workspace suite still had two failures.

## Remaining workspace failures and bounded fixes

1. The current zh-Hans starter uses `PROMOTION.md`, whose primary heading is literal HTML `<h1 align="center">MagMark</h1>`, not an ATX Markdown heading. The fixture now extracts either supported heading form and compares the exact source heading. It does not relax the source/preview or nonempty-document checks.
2. Waiting for focus restoration did not fix it. Inspection found the existing editor lazy loader disables `#btn-cover` before awaiting the cover module, causing the browser to blur the trigger before createPanelDialog captures the active element. Reproduced with the actual helper in Chromium: after Escape, focus was BODY, not the trigger. A small cover-specific adapter remembers the busy lazy-load trigger and restores it only after closing, only when enabled/connected and no other dialog is open. The same reproduction then passed with focus at `btn-cover`. Three targeted regressions cover restoration, modal handoff and cleanup. The full workspace assertion remains unchanged and must pass on the next run.

Six further local image/gesture checks passed: shared uploaded image, shared focal point, local keyboard movement, actual pointer drag, one-undo gesture restoration, and real image export without guides. The scoped cover suite has 52 checks, plus the separately reproduced red/green focus case. No main merge, deployment, dependency changes or paid model requests were made. Each subsequent run must be checked rather than assumed green.

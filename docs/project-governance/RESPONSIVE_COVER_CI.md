# Responsive cover CI follow-up

Implementation: e28247c78b0c80a364c0556280641dd3fa6fd76a. First complete ordinary PR run: https://github.com/jammyfu/MagMark/actions/runs/35408012252 .

The initial run passed full strict typecheck, 228 Vitest tests, 59 text cases, 6 SDK guards, 7 verifier tests, 17 pagination fixtures, production build and deep verification. It did not pass all browser checks.

The new cover fixture opened an about:blank document with a base tag. Its HTTP logo rendered but tainted the output canvas because a base tag does not change the document origin. Reproduced locally: `Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported.` The fixture now navigates to an intercepted same-origin document and asserts the origin before exercising the real entry, logo and download. No browser security flags or image-origin checks were disabled. The restricted local browser does not allow HTTP navigation; same-origin validation is performed by the ordinary authorized GitHub runner.

The existing workspace fixture still expected the retired `LEGACY_STARTER_MARKDOWN` heading, while current `starterForLocale('zh-Hans')` uses `PROMOTION.md`. The check now compares against the declared current starter's first heading. All other source/preview assertions remain in place. The cover focus assertion now waits for the native asynchronous close event before checking the same required invoker.

Six further local image/gesture checks passed: shared uploaded image, shared focal point, local keyboard movement, actual pointer drag, one-undo gesture restoration, and real image export without guides. Local scoped total is now 52. No production behavior changed in this test-fixture follow-up. The rerun result must still be checked rather than assumed green.

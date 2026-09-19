# Remote quiet-workspace verification

## Verified integration

Repository: jammyfu/MagMark. Branch: feat/cjk-publishing-upgrade-20260914.
UI/configuration commit: 7958a2283e4e32dfda85462ea4a21f9f6d13550e.
Verified repairs/lock commit: e2262712d00b3260127b2f9b28ece9356c588616.

GitHub Actions run: https://github.com/jammyfu/MagMark/actions/runs/34877645243
Job: 104088701081, integrate. Observed conclusion: success, all steps completed successfully.

The run checked original and resulting SHA-256 hashes for 13 existing production files, then resolved the five pinned CodeMirror direct dependencies. It asserted that every existing locked package version and integrity remained unchanged. It then performed:

- Fresh npm ci.
- Strict typecheck including app.ts, root editor.ts and vite.config.ts.
- Full configured npm test, including text and SDK guards plus Vitest.
- Verification-gate unit tests.
- Actual web production build.
- Deep repository verification.
- Chromium installation and controlled DOM pagination tests.
- Workspace interactions against production Vite assets.

Only after all these checks succeeded did the job commit the repaired files and package-lock.json and fast-forward the feature branch. It checked that the remote ref had not changed before pushing. There were no main writes, force pushes, merges or deployments.

## Scope and limits

Browser tests use offline asset injection with real Chromium DOM/layout/keyboard interactions. They are not network navigation, OS input-method candidate-window validation, Firefox/WebKit, a live WeChat save/reload test or a print-backend comparison. Package advisories and the existing bundle-size warning are not claimed resolved.

The ordinary read-only Publishing quality workflow is extended to run the same production-asset workspace checks. The cleanup commit's subsequent CI status is a separate result, not inferred from this integration run. Check the PR checks for the exact latest SHA.

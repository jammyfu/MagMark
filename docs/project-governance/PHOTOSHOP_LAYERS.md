# Photoshop-inspired cover layer workspace

Integration base: `c14df796bcfe26e337325ddcdce312d7e03ed024`, `codex/2.0.0-beta`.
Recovered package base: `7db014e9037a13cede72bd92c10a833011ed8a87`. All four intervening beta commits are retained.
Scope: the responsive cover editor accessed through **封面 → 一稿多比例**. The freeform editor, article source, main branch and deployment are not changed by this integration.

## Interaction

The central canvas is surrounded by a left tool rail and a right dock. The fixed-height properties section avoids moving the layer list when the active layer changes. The lower dock shows top-first stacking, eye controls, type/image thumbnails, exact user-defined layer names and lock controls. The paper substrate remains pinned below four content roles: title, subtitle, approved logo and main image.

Click selects one layer; Shift selects an inclusive range and Ctrl/Command toggles noncontiguous layers. Double-click the name or use F2 to rename without changing the article title. Drag rows to the highlighted insertion line; up/down controls and Ctrl/Command brackets provide a keyboard/touch alternative. The panel's order is also used by canvas painting and hit testing. Opacity affects actual PNG pixels, not just the editor preview. Context actions include rename, visibility, lock, arrange and restoring the selected layer's local overrides.

Locked layers reject direct text, geometry, opacity and image replacement operations in the current variant. They may still be made visible/hidden and reordered, matching the useful distinction between editing a layer and moving it in the stack. Lock is not a freeze of shared master content; explicit per-variant content overrides control that. Bulk movement skips locked/hidden layers. This is not a full Photoshop lock-mode implementation.

State changes reuse the cover undo/redo history. The `stack` metadata is an optional extension to the existing version-1 design document, allowlisted on import. Old saved designs still load. Local metadata and order override only their respective fields and survive subsequent shared updates. Do not round-trip these new documents through older clients that do not recognize `stack` metadata.

## QA hardening

Ten previously reproduced failures are covered: active selection after Ctrl deselection, restoring selection from the text tool, menu cleanup across reopen, menu keyboard navigation, common-delta group movement at safe-area edges, resetting a layer's owned local content, no-op transform history, clearing selection on empty canvas, stale editable preview after an asset error, and write-only oversized design downloads. Additional cancellation, lock, malformed import, overflow and all-six-PNG/ZIP CRC regressions are included.

## Intentional limits

- Four content-layer roles and a pinned paper substrate. Arbitrary duplicate/new layers, nesting/groups, masks, blend modes, Photoshop layer effects and PSD import/export are not implemented.
- The freeform editor remains available for its existing arbitrary-layer operations; no lossless conversion of arbitrary freeform layouts is claimed.
- V focuses the move/select canvas. T focuses the editable text properties. This is not a full on-canvas Photoshop text tool.
- UI is currently Chinese with a scoped dark editing surface. Full four-language UI coverage, physical-device gestures and WebKit/Firefox are separate acceptance items for this layer change.
- No model-provider calls, AI fees, remote image URLs or third-party sample art are introduced.

## Fresh integration evidence

The thirteen recovered package files were SHA-256 verified. Strict isolated TypeScript compilation and all 29 state/parser/layout cases passed. The two browser scripts' existing assertions passed with actual Chromium in an offline local fixture: 25 layer interaction/file/pixel checks and 16 additional regressions. Actual PNG dimensions, ZIP CRCs, compositing order, alpha and JSON round trips are checked.

The runtime could not clone GitHub because DNS was unavailable. Browser network navigation was administratively blocked. Local runs therefore used setContent, a CJS bundle from the strict TypeScript output, the installed Chromium and the hash-verified approved logo supplied via the supported constructor parameter. No application stub or local test adapter is included in the repository. These scoped local results are not a full-repository build or CI claim.

The ordinary read-only Publishing quality workflow runs the three cover browser scripts along with typecheck, all unit tests, pagination, production build, workspace interactions and deep verification. Check the new commit's run before reporting complete repository validation.

```sh
npm ci
npm run typecheck
npm test
npx playwright install --with-deps chromium
node scripts/check-responsive-covers.cjs
node scripts/check-photoshop-layers.cjs
node scripts/check-layer-regressions.cjs
npm run build
WORKSPACE_BUILD=1 WORKSPACE_NETWORK=1 npm run test:workspace
python3 tools/verify.py --deep
```

## Design references recorded during the earlier design pass

Adobe's interaction documentation was used as reference, not proprietary application code or artwork:

- https://helpx.adobe.com/photoshop/desktop/create-manage-layers/get-started-layers/work-with-the-layers-panel.html
- https://helpx.adobe.com/photoshop/desktop/create-manage-layers/transform-manipulate-layers/select-layers.html
- https://helpx.adobe.com/photoshop/using/moving-stacking-locking-layers.html
- https://www.adobe.com/products/photoshop/unlock-layers.html

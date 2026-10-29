# Quiet workspace continuation: trust and preview identity

This is one verified implementation milestone, not completion of the entire publishing roadmap. Branch: `feat/cjk-publishing-upgrade-20260914`; resumed remote `6815b10` via snapshot `e0b0a5c`. Main and the public site are unchanged.

## Behavior and boundaries

`src/security/inert-html.ts` parses raw HTML using the parse5-backed `rehype-raw` tree without creating live DOM or loading image resources. `article-html.ts` applies `rehype-sanitize`, then a conservative CSS/URL policy and idempotent local ID/reference namespacing. The current root magazine renderer, SDK render method, WeChat sanitizer, rich clipboard paths and cover injection use this boundary. Image-reference inspection and raw-image edits use source-positioned inert nodes. Original Markdown is not rewritten during rendering.

Safe article structure, captions, table cells/spans/header references, image sizes and permitted inline typography remain. Scripts, event attributes, inline SVG/MathML, frames, object/embed, executable link/image schemes and CSS fetching/escape functions are rejected. Passive SVG image resources remain supported as `img` sources. Cover-specific positioning and gradients have a separate restricted profile. This does not claim all future/public third-party rendering integrations are automatically safe, or that arbitrary author styling produces a valid page layout.

Image/cover panels use neutral light surfaces and labelled native dialogs. Tab wraps at the visible control boundaries; Escape closes; focus returns to the invoking control. Enter during composition does not initiate image loading or AI generation. Preference storage failures do not prevent opening the image tool, and preference values are assigned as DOM properties rather than interpolated into HTML. Real OS IME candidate windows are not certified by synthetic key events. Unsupported native-dialog hosts have a non-modal fallback, not equivalent focus guarantees.

Image placeholder/generation ratio choices and optional cover AI inputs are progressive disclosures. Existing-image tools do not pretend to implement cropping: the old crop buttons changed only CSS selection state and were removed. Changing a ratio no longer substitutes an existing image with placeholder data. Clearing an image permits a fresh placeholder without another ratio gesture.

Preview frames capture a revision and source/layout identity before asynchronous work. Superseded frames cannot overwrite newer output. Empty source invalidates queued work immediately. Pending copy/PNG/print actions are disabled and handler guarded. Zoom modifies transforms without reparsing or replacing article elements. Slow font/image readiness, export jobs already in flight and broader publication consistency remain separate follow-up work.

## Verification evidence and scope

| Check | Local result | Scope |
| --- | --- | --- |
| Vitest | 104 passed in 17 files | Existing tests plus trust and image-state regressions |
| Standalone text | 59 passed | Two text modules, not added to the Vitest count |
| SDK guards | 6 passed | Unavailable capabilities reject before renderer dependencies |
| Gate tests | 7 passed | Verification-script command propagation |
| Chromium pagination | 17 passed | Controlled DOM geometry fixtures |
| Production workspace | 21 passed | Actual built assets injected into offline Chromium 144.0.7559.96 |
| Strict TypeScript | Passed | Existing strictness and actual root entry retained |
| Web build | Passed | Real `dist/index.html` and assets; bundle-size warning retained |
| Deep verification | Passed | All configured local commands ran |
| Local HTTP navigation | Blocked by browser administrator policy | Not reported as a passing local test |

Initial trust regressions ran red (4/6 failed) before implementation. Existing-image ratio and clear-state tests both failed before their fixes. Queued empty-source rendering, view-only zoom and collapsed auxiliary controls also produced observed red browser checks before corrections. IDs/IDREFs were tested for stable repeated sanitation. Existing image editing, directories, Unicode pagination and WeChat tables/insets retain their tests.

The optional HTTP mode starts a loopback server serving only the production `dist` directory and navigates to its real HTML/CSS/JavaScript. External CDN requests are blocked, no user account is accessed. Local policy was left intact. HTTP and fresh-lock installation results must be established on the normal CI runner before integration. A workflow configuration is not evidence of a successful run.

## Reproduction

```sh
npm ci
npm run typecheck
npm test
npm run test:verify
npm run build
npm run test:pagination
WORKSPACE_BUILD=1 npm run test:workspace
WORKSPACE_BUILD=1 WORKSPACE_NETWORK=1 npm run test:workspace
python3 tools/verify.py --deep
```

For an already-installed local Chromium, the pagination script uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; the workspace script uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. CI uses Playwright's installed Chromium with neither override.

## Open work

Shared source-aware Markdown semantics, cross-inline non-destructive typography, bounded resource readiness, full export snapshot consistency, real OS IME/mobile WebView, Firefox/WebKit, live WeChat save/reload, measured publication-backend comparison, dependency advisory triage and SDK distribution packaging are not completed by this milestone. No automatic merge, deployment or article publication is authorized.

# Unicode-safe block fragmentation — 2026-09-14

## Implemented in the actual editor engine

The root editor already imports `src/engine/layout.ts`; this change is not an
unused editor component. Supported paragraphs, code blocks, lists and tables
now consume a fitting prefix even when they are the first block on a page.
The rest can occupy any number of later pages. Prefix fit and minimum text-line
constraints no longer share an incorrect binary-search branch.

- `text-boundaries.ts` uses native grapheme segmentation plus conservative
  punctuation/word-boundary candidates. It does not rewrite Markdown, insert
  spaces, split a surrogate pair, or advertise a code-point fallback as full
  grapheme support. Without Intl.Segmenter, an oversized paragraph is retained
  atomically and the limitation is reported.
- `block-fragmentation.ts` keeps every text node in one UTF-16 coordinate space,
  including whitespace between inline marks. DOM Range cloning preserves
  formatting and image identities. Code newlines remain in the output instead
  of disappearing between pages.
- Ordered lists retain start, reversed and individual value semantics. Tables
  retain multiple tbody groups, column definitions and cell content; headers
  repeat, the caption occurs once, and the footer occurs on the final fragment.
  A cut never crosses a rowspan group, including rowspan=0.
- Combined measurement applies the same block typography as final output.
  Paragraph/code fragments enforce a two-text-line minimum under the controlled
  layout. A lone heading plus atomic oversized content makes forward progress.
  Measurement containers are removed in finally, including exceptional paths.

## Executed evidence

The original layout blob was verified as
`9e626cf74af7eccd2322e1a9718f1656aaabd48b` before testing. The same final Node
browser suite produced **2 passes and 15 failures on that original engine**;
the heading/atomic case hit the external 15-second progress watchdog. The
changed engine produced **17 passes and zero failures**.

These are real Chromium DOM measurements with controlled local CSS and fonts,
not mocked heights. The test checks text/cell/newline conservation, numbering,
Unicode boundaries, image identities, dimensions, overrides and cleanup.
Runtime: Node 22.16.0, Chromium 144.0.7559.96; the available Playwright core runtime
was 1.57.0-beta-1764944708000. No package dependency was changed to that version.
Strict TypeScript 5.8.3 checks passed for layout, fragmentation, text boundaries,
state and the export-capabilities module with ES2020 + DOM libraries.

Reproduce in a complete checkout:

```sh
npm ci
npx playwright install chromium
npm run test:pagination
npm run test:sdk
npm test
npm run typecheck
npm run build
python3 tools/verify.py --deep
```

`test:pagination` uses the actual modules and the shared cases in
`tests/pagination-browser-cases.js`. It creates a new browser page per case and
has an external progress watchdog. An existing Chromium can be selected using
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Project dependencies resolve normally;
container-specific NODE_PATH settings must not be committed into the project.

## Explicit limits and remaining gates

`PageResult.diagnostics` describes an oversized unsplittable block or missing
grapheme support. It does not claim that an arbitrarily tall image/row/list item
has been resized, that the existing fixed-height preview cannot clip it, or
that a diagnostics UI is already connected. The root editor still needs to
surface these diagnostics before export. The source content is retained.

Image/font readiness, stale async-render cancellation, post-Han measurement,
full-editor selection/image-edit regression, arbitrary custom CSS/vertical
writing, browser matrix, IME and actual WeChat save/reload are NOT certified by
this controlled fixture suite. No publication backend was changed. Full npm
build/typecheck/tests remain separate gates; a CI workflow pending action is
not a passing CI run. P0 HTML sanitization, unified parsing and CodeMirror are
still open items in CJK_UPGRADE.md.

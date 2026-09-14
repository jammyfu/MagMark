# SDK export capabilities

The `MagMark` class does not currently connect its high-level file/image export
methods to a compiler, screenshot renderer or file writer. These methods used
to log a success-like message or return an empty image array. They now reject
with `UnsupportedExportError`, with stable code `MAGMARK_EXPORT_UNAVAILABLE`
and an `operation` field, before parsing the document or creating output.

```ts
import { MagMark, UnsupportedExportError } from './src/index';
const sdk = new MagMark();
const capabilities = sdk.getExportCapabilities();
// capabilities.scope === 'sdk'
// capabilities.operations.images.available === false
try {
  await sdk.exportImages('# Article');
} catch (error) {
  if (!(error instanceof UnsupportedExportError)) throw error;
  console.error(error.code, error.operation, error.message);
}
```

This is an intentional correction to false-success behavior, not the removal
of a working compiler. The browser editor's PNG/print controls and WeChat HTML
clipboard functions remain unchanged. Lower-level adapters are separate APIs;
the capability query does not certify their availability, installed binaries,
licensing or platform support. No external service is configured automatically.

## Verification scope

`NODE_PATH=$(npm root -g) node tests/sdk-export-cases.cjs` was run in the isolated
container using the real SDK export method bodies. Six assertions failed on the
hash-verified original SDK and passed after the change. Rendering-only imports
are isolated and throw if used; neither construction nor Markdown rendering is
claimed as tested by this runner. In a normal checkout, local TypeScript resolves
without NODE_PATH. The added Vitest suite exercises normal SDK construction too;
that suite requires `npm ci` and has not been run in this container.

The new capabilities module passed strict TypeScript compilation. Full-project
build/typecheck and browser export integration are separate release gates.

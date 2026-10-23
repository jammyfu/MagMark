#!/usr/bin/env node
/** Compile and exercise the real, dependency-free text modules in isolation.
 * Requires the project's TypeScript devDependency (npm ci first).
 * This does NOT replace npm test, npm run typecheck or browser integration tests.
 */
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const root = resolve(__dirname, '..');
const output = mkdtempSync(join(tmpdir(), 'magmark-text-'));
(async () => {
  try {
    const tsc = require.resolve('typescript/bin/tsc', { paths: [root] });
    execFileSync(process.execPath, [tsc,
      'src/core/inline-tokens.ts', 'src/plugins/cjk-spacer.ts',
      '--target', 'ES2022', '--module', 'CommonJS', '--strict',
      '--skipLibCheck', '--outDir', output,
    ], { cwd: root, stdio: 'inherit' });
    await require('../tests/text-compat-cases.cjs')(
      require(join(output, 'core/inline-tokens.js')),
      require(join(output, 'plugins/cjk-spacer.js')),
    );
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

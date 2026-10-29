'use strict';
// Focused guard tests: real compiled SDK method bodies, not a renderer test.
// Rendering-only imports are isolated because none may be called by an
// unavailable export. Constructor/Markdown rendering are covered by Vitest.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const external = new Set([
  '../security/article-html', // Must not run when an export backend is unavailable.
  'unified', 'remark-parse', 'remark-rehype', 'rehype-stringify', '../plugins',
  '../schemas/input-schema', '../export/typst-converter',
  '../export/princexml-converter', '../export/image-renderer',
  '../export/xiaohongshu-zipper', '../export/wechat-combiner',
]);
function forbidden(name) {
  return new Proxy(function () { throw new Error(`Unexpected rendering dependency: ${name}`); }, {
    get(_target, key) {
      if (key === '__esModule') return false;
      return forbidden(`${name}.${String(key)}`);
    },
  });
}
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  }}).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const requireIsolated = specifier => {
    if (specifier === './export-capabilities') {
      return load(path.join(path.dirname(filename), 'export-capabilities.ts'));
    }
    if (external.has(specifier)) return forbidden(specifier);
    throw new Error(`Unexpected module dependency: ${specifier}`);
  };
  vm.runInThisContext(`(function(exports, require, module) {\n${compiled}\n})`, { filename })(module.exports, requireIsolated, module);
  return module.exports;
}
async function main() {
  const { MagMark } = load(path.join(root, 'src/core/magmark.ts'));
  let passed = 0, failed = 0;
  const check = async (name, fn) => {
    try { await fn(); passed++; console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
  };
  const pairs = [
    ['exportTypst', 'typst', ['/tmp/private.typ']],
    ['exportPrince', 'prince', ['/tmp/private.pdf']],
    ['exportImages', 'images', ['untrusted markdown']],
    ['exportXiaohongshu', 'xiaohongshu', ['/tmp/private.zip', 'untrusted markdown']],
    ['exportWeChat', 'wechatLongImage', ['/tmp/private.png', 'untrusted markdown']],
  ];
  for (const [method, operation, args] of pairs) {
    await check(`${method} rejects explicitly before rendering`, async () => {
      const sdk = Object.create(MagMark.prototype);
      sdk.render = () => { throw new Error('Rendering must not start'); };
      await assert.rejects(sdk[method](...args), error => {
        assert.equal(error.name, 'UnsupportedExportError');
        assert.equal(error.code, 'MAGMARK_EXPORT_UNAVAILABLE');
        assert.equal(error.operation, operation);
        assert.ok(error instanceof Error);
        assert.match(error.message, /SDK/);
        assert.ok(!error.message.includes('/tmp/private'));
        return true;
      });
    });
  }
  await check('capability query is explicit and immutable', () => {
    const sdk = Object.create(MagMark.prototype);
    const capabilities = sdk.getExportCapabilities();
    assert.equal(capabilities.scope, 'sdk');
    assert.ok(Object.isFrozen(capabilities));
    for (const [, operation] of pairs) {
      assert.equal(capabilities.operations[operation].available, false);
      assert.ok(capabilities.operations[operation].reason.length > 0);
      assert.ok(Object.isFrozen(capabilities.operations[operation]));
    }
    assert.ok(Object.isFrozen(capabilities.operations));
  });
  console.log(`${passed} passed; ${failed} failed (SDK guard scope only)`);
  if (failed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });

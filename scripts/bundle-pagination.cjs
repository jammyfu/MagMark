'use strict';
// Bundle the actual, dependency-free pagination modules for browser fixture tests.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function buildPaginationBundle() {
  const modules = new Map();
  function collect(file) {
    if (modules.has(file)) return;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    }}).outputText;
    modules.set(file, output);
    for (const match of output.matchAll(/require\("([^"\n]+)"\)/g)) {
      if (!match[1].startsWith('.')) throw new Error(`Unexpected dependency: ${match[1]}`);
      collect(path.posix.normalize(path.posix.join(path.posix.dirname(file), `${match[1]}.ts`)));
    }
  }
  collect('src/core/state.ts');
  collect('src/engine/layout.ts');
  return `(() => { const factories = {${[...modules].map(([key, code]) =>
    `${JSON.stringify(key)}: function(exports, require) {\n${code}\n}`).join(',')}};
    const cache = {};
    function load(key) {
      if (cache[key]) return cache[key];
      if (!factories[key]) throw new Error('Missing fixture module: ' + key);
      const exports = cache[key] = {};
      factories[key](exports, relative => {
        const parts = key.split('/'); parts.pop();
        for (const part of relative.split('/')) {
          if (part === '..') parts.pop(); else if (part !== '.') parts.push(part);
        }
        return load(parts.join('/') + '.ts');
      });
      return exports;
    }
    window.mmPagination = load('src/engine/layout.ts');
    window.mmState = load('src/core/state.ts');
  })();`;
}
module.exports = { buildPaginationBundle };
if (require.main === module) process.stdout.write(buildPaginationBundle());

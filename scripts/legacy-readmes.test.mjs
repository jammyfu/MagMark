import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {hostedReadme, readmeNames, writeLegacyReadmes} from './legacy-readmes.mjs';

test('hosted README links preserve language navigation and resolve repository-only assets', () => {
  const result = hostedReadme('<a href="README.ja.md">JA</a><img src="screenshots/hero.png"> [Guide](docs/guide.md) ![Example](screenshots/example.png) [Site](https://bubufu.com/) [Section](#help)');
  assert.match(result, /href="README.ja.md"/);
  assert.match(result, /src="https:\/\/raw.githubusercontent.com\/jammyfu\/MagMark\/refs\/heads\/codex\/2.0.0-beta\/screenshots\/hero.png"/);
  assert.match(result, /\[Guide\]\(https:\/\/github.com\/jammyfu\/MagMark\/blob\/codex\/2.0.0-beta\/docs\/guide.md\)/);
  assert.match(result, /!\[Example\]\(https:\/\/raw.githubusercontent.com/);
  assert.match(result, /\[Site\]\(https:\/\/bubufu.com\/\) \[Section\]\(#help\)/);
});

test('all four actual hosted language documents are generated without broken relative links', () => {
  const dir = mkdtempSync(join(tmpdir(), 'magmark-readmes-'));
  try {
    writeLegacyReadmes(dir);
    for (const name of readmeNames) {
      const text = readFileSync(join(dir, name), 'utf8');
      assert.ok(text.length > 1000, name);
      for (const match of text.matchAll(/(?:href|src|srcset)="([^"]+)"|\]\(([^\s)]+)\)/g)) {
        const url = match[1] || match[2];
        assert.ok(/^(?:https?:|#)/.test(url) || readmeNames.includes(url), `${name}: ${url}`);
      }
    }
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const readmeNames = ['README.md', 'README.en.md', 'README.zh-Hant.md', 'README.ja.md'];
const root = fileURLToPath(new URL('../', import.meta.url));
const source = 'https://github.com/jammyfu/MagMark/blob/codex/2.0.0-beta/';
const raw = 'https://raw.githubusercontent.com/jammyfu/MagMark/refs/heads/codex/2.0.0-beta/';

// READMEs are embedded in the editor. Their language/document links must also
// resolve when followed from the hosted editor instead of the Git repository.
export function hostedReadme(text) {
  const target = (url, image = false) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return url;
    if (readmeNames.includes(url)) return url;
    return (image ? raw : source) + url.replace(/^\.\//, '');
  };
  return text
    .replace(/\b(href|src|srcset)="([^"]+)"/g, (_, attr, url) => `${attr}="${target(url, attr !== 'href')}"`)
    .replace(/(!?)\[([^\]]*)\]\(([^\s)]+)\)/g, (_, image, label, url) => `${image}[${label}](${target(url, !!image)})`);
}

export function writeLegacyReadmes(output = resolve(root, 'web-public')) {
  mkdirSync(output, {recursive: true});
  for (const name of readmeNames) {
    writeFileSync(resolve(output, name), hostedReadme(readFileSync(resolve(root, name), 'utf8')));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeLegacyReadmes(process.argv[2]);
}

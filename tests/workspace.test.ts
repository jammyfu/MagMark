// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
function fixture() { document.documentElement.innerHTML = html.replace(/<!DOCTYPE html>/i, ''); }

describe('quiet workspace structure', () => {
  it('has a single primary export entry and three workspace views', () => {
    fixture();
    expect(document.querySelectorAll('[data-workspace-view]')).toHaveLength(3);
    expect(document.querySelectorAll('#btn-publish')).toHaveLength(1);
  });
  it('keeps advanced controls in a closed inspector instead of a permanent toolbar', () => {
    fixture();
    expect(document.querySelector('#layout-inspector')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('#layout-inspector #ctrl-letterspacing')).not.toBeNull();
  });
  it('retains existing rendering and publication controls exactly once', () => {
    fixture();
    for (const id of ['markdown-input','ctrl-theme','ctrl-format','ctrl-font','btn-export','btn-export-all','btn-wc-copy',
      'btn-copy-page-wechat','btn-copy-page-rich','article-directory-input','asset-directory-input','btn-image', 'btn-cover']) {
      expect(document.querySelectorAll(`#${id}`), id).toHaveLength(1);
    }
  });
  it('puts all publication actions in a labelled native dialog', () => {
    fixture();
    expect(document.querySelector('#export-dialog')?.tagName).toBe('DIALOG');
    expect(document.querySelector('#export-dialog #btn-export')).not.toBeNull();
  });
});

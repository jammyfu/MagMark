// @vitest-environment jsdom
import {afterEach, describe, expect, it} from 'vitest';
import {mountLocale, translate} from '../src/workspace/locale';
import {starterForLocale} from '../src/workspace/starter';
let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); document.body.innerHTML = ''; });
describe('workspace languages', () => {
  it('switches labels and dynamic dialogs while preserving article/source content', async () => {
    document.body.innerHTML = '<header id="app-header"><select id="workspace-language"><option value="zh-Hans">简</option><option value="zh-Hant">繁</option><option value="ja">日</option><option value="en">EN</option></select><button title="写作" aria-label="写作">写作</button></header><div id="preview-area">写作</div><div id="source-editor" contenteditable>写作</div>';
    dispose = mountLocale(() => {});
    const select = document.querySelector('select')!;
    for (const [language, expected] of [['en','Write'], ['ja','執筆'], ['zh-Hant','寫作'], ['zh-Hans','写作']]) {
      select.value = language; select.dispatchEvent(new Event('change'));
      expect(document.querySelector('button')!.textContent).toBe(expected);
      expect(document.querySelector('button')!.getAttribute('aria-label')).toBe(expected);
      expect(document.getElementById('preview-area')!.textContent).toBe('写作');
      expect(document.getElementById('source-editor')!.textContent).toBe('写作');
    }
    select.value = 'en'; select.dispatchEvent(new Event('change'));
    const dialog = document.createElement('dialog'); dialog.innerHTML = '<button>关闭</button><div contenteditable>关闭</div>';
    document.body.append(dialog); await new Promise(resolve => setTimeout(resolve, 0));
    expect(dialog.querySelector('button')!.textContent).toBe('Close');
    expect(dialog.querySelector('[contenteditable]')!.textContent).toBe('关闭');
  });
  it('selects distinct bundled READMEs with local artwork', () => {
    const docs = ['zh-Hans','zh-Hant','ja','en'].map(locale => starterForLocale(locale as Parameters<typeof starterForLocale>[0]));
    expect(new Set(docs).size).toBe(4);
    for (const doc of docs) { expect(doc).toContain('magmark-brand-hero'); expect(doc).not.toContain('<picture>'); }
    expect(docs[3]).toContain('Write in Markdown.');
  });
  it('translates changing counters without modifying their values', () => {
    expect(translate('5,117 字符', 'en')).toBe('5,117 characters');
    expect(translate('5,117 characters', 'ja')).toBe('5,117 文字');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { mountWorkspaceIcons, ICON_BINDINGS } from '../src/workspace/icons';
import { ICONS } from '../src/workspace/lucide-icons';

let dispose: (() => void) | undefined;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
afterEach(() => { dispose?.(); document.body.replaceChildren(); });

describe('Monochrome brand and functional icons', () => {
  it('uses the supplied monochrome logo in the entry and matching public SVG', () => {
    const html = readFileSync('index.html', 'utf8');
    const svg = readFileSync('public/brand/magmark-monochrome.svg', 'utf8');
    document.body.innerHTML = html;
    const mark = document.querySelector('[data-brand="monochrome"]');
    expect(mark).not.toBeNull();
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.querySelector('img')?.getAttribute('src')).toBe('/brand/magmark-monochrome.svg');
    expect(svg).toContain('MagMark — monochrome vector logo');
    expect(svg).toContain('fill="#000000"');
    expect(html).toContain('href="/favicon.svg"');
  });
  it('uses the supplied hero in every localized README', () => {
    for (const file of ['README.md', 'README.en.md', 'README.zh-Hant.md', 'README.ja.md']) {
      const readme = readFileSync(file, 'utf8');
      expect(readme).toContain('public/brand/magmark-monochrome.svg');
      expect(readme).toContain('screenshots/magmark-brand-hero.png');
    }
  });
  it('maps every slot to a real vendored Lucide icon', () => {
    expect(ICON_BINDINGS.length).toBeGreaterThan(35);
    for (const binding of ICON_BINDINGS) expect(ICONS[binding.icon]).toBeTruthy();
  });
  it('keeps control identity, events, labels and disabled state', () => {
    document.body.innerHTML = '<header id="app-header"><button id="btn-undo" aria-label="撤销" disabled>↶</button><button id="btn-save">保存 Markdown <kbd>⌘ S</kbd></button></header>';
    const button = document.getElementById('btn-save')!;
    let clicks = 0;
    button.addEventListener('click', () => { clicks++; });
    dispose = mountWorkspaceIcons(document);
    button.click();
    expect(document.getElementById('btn-save')).toBe(button);
    expect(clicks).toBe(1);
    expect(button.textContent).toContain('保存 Markdown');
    expect(button.querySelector('kbd')?.textContent).toBe('⌘ S');
    const undo = document.querySelector<HTMLButtonElement>('#btn-undo')!;
    expect(undo.disabled).toBe(true);
    expect(undo.getAttribute('aria-label')).toBe('撤销');
    expect(undo.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('restores an icon after a controller replaces a button label, without duplication', async () => {
    document.body.innerHTML = '<header id="app-header"><button id="btn-save">保存 Markdown</button></header>';
    dispose = mountWorkspaceIcons(document);
    const button = document.getElementById('btn-save')!;
    button.textContent = '已保存';
    await tick(); await tick();
    expect(button.querySelectorAll('.mm-ui-icon')).toHaveLength(1);
    expect(button.textContent).toBe('已保存');
  });
  it('handles new auxiliary panels but never edits article markup', async () => {
    document.body.innerHTML = '<div id="preview-area"><button id="btn-save">用户原文 ✨ →</button><svg><path d="M0 0"/></svg></div>';
    const before = document.getElementById('preview-area')!.innerHTML;
    dispose = mountWorkspaceIcons(document);
    const dialog = document.createElement('dialog');
    dialog.className = 'mm-panel-dialog';
    dialog.innerHTML = '<button id="mm-ip-gen-btn">✨ 生成</button><button id="mm-ip-insert-btn">插入 →</button>';
    document.body.appendChild(dialog);
    await tick(); await tick();
    expect(dialog.querySelectorAll('.mm-ui-icon')).toHaveLength(2);
    expect(document.getElementById('preview-area')!.innerHTML).toBe(before);
    expect(dialog.querySelector('#mm-ip-insert-btn')?.textContent).toContain('插入');
  });
  it('stops observing when disposed', async () => {
    document.body.innerHTML = '<header id="app-header"><button id="btn-save">保存</button></header>';
    dispose = mountWorkspaceIcons(document);
    dispose();
    document.getElementById('btn-save')!.textContent = '保存';
    await tick();
    expect(document.querySelector('.mm-ui-icon')).toBeNull();
  });
});

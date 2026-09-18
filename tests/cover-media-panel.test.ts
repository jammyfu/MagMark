// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { CoverPanel } from '../src/cover/cover-panel';
import { mountWorkspaceIcons } from '../src/workspace/icons';
let panel: CoverPanel;
afterEach(() => { panel?.destroy(); document.body.replaceChildren(); vi.restoreAllMocks(); });
it('keeps alignment icons and actual title styles synchronized across undo and media', () => {
  panel = new CoverPanel(vi.fn()); panel.open('中文标题混排 English，多行封面文字', '副标题');
  const stopIcons = mountWorkspaceIcons();
  const button = (value: string) => document.querySelector<HTMLButtonElement>(`[data-cover-align="${value}"]`)!;
  const frame = document.querySelector<HTMLIFrameElement>('#mm-cp-iframe')!;
  for (const mode of ['left','center','right','justify','distributed']) {
    button(mode).click();
    expect(button(mode).querySelector('svg')).not.toBeNull();
    expect(button(mode).getAttribute('aria-pressed')).toBe('true');
    const title = frame.contentDocument!.querySelector<HTMLElement>('.mm-cover-title')!;
    expect(title.style.textAlign).toBe(mode === 'distributed' ? 'justify' : mode);
    expect(title.style.textAlignLast).toBe(mode === 'distributed' ? 'justify' : 'auto');
  }
  document.querySelector<HTMLButtonElement>('#mm-cp-text-undo')!.click();
  expect(button('justify').getAttribute('aria-pressed')).toBe('true');
  document.querySelector<HTMLButtonElement>('#mm-cp-text-redo')!.click();
  const media = document.querySelector<HTMLSelectElement>('#mm-cp-media')!;
  media.value='wx-wide'; media.dispatchEvent(new Event('change'));
  expect(frame.contentDocument!.querySelector<HTMLElement>('.mm-cover-title')!.style.textAlignLast).toBe('justify');
  expect(button('distributed').getAttribute('aria-pressed')).toBe('true');
  stopIcons();
});
it('switches output sizes, keeps local text separate, and synchronizes shared text', () => {
  panel = new CoverPanel(vi.fn()); panel.open('共同标题', '简介');
  const media = document.querySelector<HTMLSelectElement>('#mm-cp-media')!;
  const title = document.querySelector<HTMLInputElement>('#mm-cp-title-input')!;
  const scope = document.querySelector<HTMLSelectElement>('#mm-cp-scope')!;
  const frame = document.querySelector<HTMLIFrameElement>('#mm-cp-iframe')!;
  expect(frame.style.width).toBe('1080px'); expect(frame.style.height).toBe('1440px');
  scope.value = 'one'; title.value = '小红书独立'; title.dispatchEvent(new Event('input'));
  media.value = 'wx-wide'; media.dispatchEvent(new Event('change'));
  expect(title.value).toBe('共同标题'); expect(frame.style.width).toBe('940px'); expect(frame.style.height).toBe('400px');
  media.value = 'xhs-note'; media.dispatchEvent(new Event('change'));
  expect(title.value).toBe('小红书独立');
  scope.value = 'all'; title.value = '全平台同步'; title.dispatchEvent(new Event('input'));
  media.value = 'wx-wide'; media.dispatchEvent(new Event('change'));
  expect(title.value).toBe('全平台同步'); expect(frame.style.height).toBe('400px');
  expect(document.querySelectorAll('.mm-cp-media-card')).toHaveLength(9);
});

it('uses readable text pairs in every built-in template and exports no editing controls', () => {
  const insert = vi.fn(); panel = new CoverPanel(insert); panel.open('可读标题', '可读副标题');
  const frame = document.querySelector<HTMLIFrameElement>('#mm-cp-iframe')!;
  for (const button of document.querySelectorAll<HTMLButtonElement>('.mm-cp-tpl-btn')) {
    button.click();
    const title = frame.contentDocument!.querySelector<HTMLElement>('.mm-cover-title')!;
    const dark = frame.contentDocument!.querySelector('.mm-cover-dark');
    expect(title.style.color).toBe(dark ? 'rgb(255, 255, 255)' : 'rgb(23, 32, 51)');
    expect(title.style.backgroundColor).toBe(dark ? 'rgb(23, 32, 51)' : 'rgb(255, 255, 255)');
    expect(title.style.opacity).toBe('1');
  }
  document.querySelector<HTMLButtonElement>('#mm-cp-insert-btn')!.click();
  expect(insert.mock.calls[0][0]).not.toMatch(/data-mm-cover-editor|contenteditable|tabindex|等比缩放文字/);
  expect(insert.mock.calls[0][0]).toContain('可读标题');
});

it('undoes title edits and size adjustments while preserving per-media edits', () => {
  panel = new CoverPanel(vi.fn()); panel.open('原始标题', '副标题');
  const title = document.querySelector<HTMLTextAreaElement>('#mm-cp-title-input')!;
  title.value = '编辑后'; title.dispatchEvent(new Event('input'));
  document.querySelector<HTMLButtonElement>('#mm-cp-text-undo')!.click(); expect(title.value).toBe('原始标题');
  document.querySelector<HTMLButtonElement>('#mm-cp-text-redo')!.click(); expect(title.value).toBe('编辑后');
  const size = document.querySelector<HTMLInputElement>('#mm-cp-text-size')!;
  size.value = '72'; size.dispatchEvent(new Event('change'));
  const frame = document.querySelector<HTMLIFrameElement>('#mm-cp-iframe')!;
  expect(frame.contentDocument!.querySelector<HTMLElement>('.mm-cover-title')!.style.fontSize).toContain('em');
  document.querySelector<HTMLButtonElement>('#mm-cp-text-undo')!.click();
  expect(document.querySelector<HTMLButtonElement>('#mm-cp-text-redo')!.disabled).toBe(false);
});

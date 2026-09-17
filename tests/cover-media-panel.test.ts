// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { CoverPanel } from '../src/cover/cover-panel';
let panel: CoverPanel;
afterEach(() => { panel?.destroy(); document.body.replaceChildren(); vi.restoreAllMocks(); });
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

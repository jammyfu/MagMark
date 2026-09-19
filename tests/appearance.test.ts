// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountAppearance } from '../src/workspace/appearance';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function fixture() {
  document.body.innerHTML = '<select><option value="auto">跟随系统</option><option value="light">亮色</option><option value="dark">暗色</option></select><select id="workspace-palette"><option value="neutral">灰</option><option value="sand">砂</option><option value="sage">松</option><option value="slate">蓝</option></select><article>正文</article>';
  return document.querySelector('select')!;
}
describe('workspace appearance', () => {
  it('follows live system changes only in auto and restores independent palette preference', () => {
    let listener: (() => void) | undefined;
    const system = { matches: true, addEventListener: vi.fn((_name, fn) => listener = fn), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', vi.fn(() => system));
    const select = fixture(), dispose = mountAppearance(select);
    expect(select.value).toBe('auto');
    expect(document.body.dataset.workspaceTheme).toBe('dark');
    system.matches = false; listener!(); expect(document.body.dataset.workspaceTheme).toBe('light');
    select.value = 'dark'; select.dispatchEvent(new Event('change')); listener!();
    expect(document.body.dataset.workspaceTheme).toBe('dark');
    const palette = document.querySelector<HTMLSelectElement>('#workspace-palette')!;
    palette.value = 'sage'; palette.dispatchEvent(new Event('change'));
    expect(document.body.dataset.workspacePalette).toBe('sage');
    dispose(); expect(system.removeEventListener).toHaveBeenCalled();
    const again = mountAppearance(select);
    expect(palette.value).toBe('sage'); expect(select.value).toBe('dark'); again();
  });
  it('switches and persists without changing article theme or content', () => {
    const select = fixture();
    document.body.dataset.theme = 'wc-green';
    const article = document.querySelector('article');
    const dispose = mountAppearance(select);
    expect(document.body.dataset.workspaceTheme).toBe('light');
    select.value = 'dark'; select.dispatchEvent(new Event('change'));
    expect(document.body.dataset.workspaceTheme).toBe('dark');
    expect(window.localStorage.getItem('magmark.workspace.appearance')).toBe('dark');
    expect(document.body.dataset.theme).toBe('wc-green');
    expect(document.querySelector('article')).toBe(article);
    dispose();
    const disposeAgain = mountAppearance(select);
    expect(select.value).toBe('dark');
    select.value = 'light'; select.dispatchEvent(new Event('change'));
    expect(document.body.dataset.workspaceTheme).toBe('light');
    disposeAgain();
  });
  it('works when preference storage is unavailable', () => {
    vi.mocked(window.localStorage.getItem).mockImplementation(() => { throw new Error('denied'); });
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw new Error('denied'); });
    const select = fixture(), dispose = mountAppearance(select);
    select.value = 'dark'; select.dispatchEvent(new Event('change'));
    expect(document.body.dataset.workspaceTheme).toBe('dark');
    dispose();
    select.value = 'light'; select.dispatchEvent(new Event('change'));
    expect(document.body.dataset.workspaceTheme).toBe('dark');
  });
});

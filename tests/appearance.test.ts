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
  document.body.innerHTML = '<select><option value="light">亮色</option><option value="dark">暗色</option></select><article>正文</article>';
  return document.querySelector('select')!;
}
describe('workspace appearance', () => {
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

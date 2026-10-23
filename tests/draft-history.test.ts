// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { retainVersions, mountDraftHistory, type DraftVersion } from '../src/workspace/draft-history';

it('retains the latest 30 versions including empty documents', () => {
  let versions: DraftVersion[] = [];
  for (let i = 0; i < 35; i++) versions = retainVersions(versions, { id: String(i), time: i, text: '', images: { pasted: [], directory: [], path: '' } });
  expect(versions).toHaveLength(30); expect(versions[0].id).toBe('5'); expect(versions.at(-1)?.id).toBe('34');
});
it('reports unavailable storage without claiming saved or changing source', async () => {
  vi.stubGlobal('indexedDB', { open: () => { throw new Error('denied'); } });
  document.body.innerHTML = '<textarea>保留原文</textarea><span id="autosave-status"></span><button id="btn-history"></button>';
  const input = document.querySelector('textarea')!;
  const dispose = mountDraftHistory(input, { key: () => '', capture: vi.fn(), restore: vi.fn() }, vi.fn());
  await vi.waitFor(() => expect(document.getElementById('autosave-status')?.textContent).toContain('不可用'));
  expect(input.value).toBe('保留原文'); dispose(); vi.unstubAllGlobals();
});

// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { layoutTableSheets } from '../src/workspace/table-sheets';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });
it('groups wide tables, repeats keys/headers and preserves long formatted cell content across sheets', () => {
  // Deterministic line measurement; actual layout is also checked in the browser.
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.tagName !== 'TABLE') return 0;
    return 30 + Array.from((this as HTMLTableElement).rows).reduce((height, row) =>
      height + Math.max(...Array.from(row.cells).map(cell => Math.ceil((cell.textContent?.length || 1) / 20))) * 24, 0);
  });
  const content = '长文Alpha-0123'.repeat(70);
  const result = layoutTableSheets(`<table><thead><tr><th>名称</th><th>内容</th><th>说明</th><th>来源</th></tr></thead><tbody><tr><td>记录 A</td><td><strong>${content}</strong></td><td>备注</td><td><code>source-id</code></td></tr></tbody></table>`,
    { width: 250, height: 650, fontSize: 14, lineHeight: 1.75, fontFamily: 'serif' });
  document.body.innerHTML = result;
  const tables = Array.from(document.querySelectorAll('table'));
  expect(tables.length).toBeGreaterThan(2);
  expect(tables.every(table => table.rows[0].cells.length <= 3)).toBe(true);
  expect(tables.every(table => table.style.transform === 'rotate(90deg)')).toBe(true);
  expect(tables.every(table => table.style.fontSize === '14px')).toBe(true);
  expect(tables.every(table => table.tBodies[0].rows[0].cells[0].textContent === '记录 A')).toBe(true);
  expect(Array.from(document.querySelectorAll('strong')).map(node => node.textContent).join('')).toBe(content);
  expect(document.querySelector('code')?.textContent).toBe('source-id');
});

// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { deleteSelectedSource } from '../src/workspace/delete-selection';
function blocks(html: string) { const host = document.createElement('div'); host.innerHTML = html; return [...host.children] as HTMLElement[]; }
it('removes entire selected text blocks while preserving other Markdown', () => {
  expect(deleteSelectedSource('# 标题\n\n**正文**\n\n保留', blocks('<h1>标题</h1><p>正文</p>'), x=>x)).toBe('\n\n\n\n保留');
});
it('deletes an image including its sizing attributes without touching other images', () => {
  expect(deleteSelectedSource('![图](mm-img://one){width=50%}\n\n![另](two.png)', blocks('<figure><img src="data:image/png;base64,AAAA"></figure>'), x=>x==='mm-img://one'?'data:image/png;base64,AAAA':x)).toBe('\n\n![另](two.png)');
});
it('rejects ambiguous selections atomically', () => {
  expect(deleteSelectedSource('# 标题\n\n重复\n\n重复', blocks('<h1>标题</h1><p>重复</p>'), x=>x)).toBeNull();
});

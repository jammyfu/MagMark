// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { findEditableText, mountPreviewEdit, markEditableSource, getEditableSource } from '../src/workspace/preview-edit';
import { sanitizeArticleHtml } from '../src/security/article-html';

describe('preview text source mapping', () => {
  it('preserves renderer ranges through sanitization, repeated text and split list rendering', () => {
    const source = '重复\n\n重复\n\n1. **标题**  \n   说明';
    const marker = markEditableSource(source, 4, 6);
    document.body.innerHTML = sanitizeArticleHtml(`<p${marker}>重复</p>`);
    const id = document.querySelector('p')!.getAttribute('data-mm-edit')!;
    expect(getEditableSource(source, id)).toEqual({ from: 4, to: 6, value: '重复' });
    expect(getEditableSource(source + '新内容', id)).toBeNull();
    const start = source.indexOf('**');
    const listMarker = markEditableSource(source, start, source.indexOf('\n', start));
    document.body.innerHTML = `<li${listMarker}>标题</li>`;
    expect(getEditableSource(source, document.querySelector('li')!.dataset.mmEdit!)?.value).toBe('**标题**  ');
  });
  it('keeps heading markers and inline formatting', () => {
    const source = '# **标题**\n\n正文 [链接](https://example.com)。';
    expect(findEditableText(source, '标题', 'H1')?.value).toBe('**标题**');
    expect(findEditableText(source, '正文 链接 。', 'P')?.value).toBe('正文 [链接](https://example.com)。');
  });
  it('preserves list and quote prefixes outside edited ranges', () => {
    expect(findEditableText('- 项目\n\n> 引用', '项目', 'LI')?.value).toBe('项目');
    expect(findEditableText('- 项目\n\n> 引用', '引用', 'P')?.value).toBe('引用');
  });
  it('fails closed on repeated, split, HTML and image paragraphs', () => {
    expect(findEditableText('重复\n\n重复', '重复', 'P')).toBeNull();
    expect(findEditableText('跨页的完整文字', '跨页的', 'P')).toBeNull();
    expect(findEditableText('正文 <b>粗体</b>', '正文 粗体', 'P')).toBeNull();
    expect(findEditableText('文字 ![图](a.png)', '文字 ', 'P')).toBeNull();
    expect(findEditableText('> 第一行\n> 第二行', '第一行第二行', 'P')).toBeNull();
  });
});

function fixture() {
  document.body.innerHTML = '<textarea id="source"></textarea><div id="preview" tabindex="-1"><div class="magmark"><h1>标题</h1></div></div>';
  const input = document.querySelector<HTMLTextAreaElement>('#source')!;
  input.value = '# 标题\n\n不变';
  const report = vi.fn();
  const dispose = mountPreviewEdit(document.querySelector('#preview')!, input, report);
  document.querySelector('h1')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  return { input, report, dispose, field: document.querySelector<HTMLTextAreaElement>('#preview-text-input')! };
}
describe('preview editing interaction', () => {
  it('edits the complete list selected by the outer block instead of only the clicked item', () => {
    const source = '- **第一项**：说明\n- 第二项\n- 第三项';
    document.body.innerHTML = `<textarea></textarea><div id="preview"><div class="magmark"><ul${markEditableSource(source, 0, source.length)}><li>第一项：说明</li><li>第二项</li><li>第三项</li></ul></div></div>`;
    const input = document.querySelector('textarea')!;
    input.value = source;
    const dispose = mountPreviewEdit(document.querySelector('#preview')!, input, vi.fn());
    document.querySelector('li')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const field = document.querySelector<HTMLTextAreaElement>('#preview-text-input')!;
    expect(field.querySelectorAll('li')).toHaveLength(3);
    expect(field.querySelector('strong')?.textContent).toBe('第一项');
    expect(field.textContent).not.toContain('**');
    expect(document.querySelector('label')!.textContent).toBe('编辑完整列表');
    field.innerHTML = '<ul><li><strong>第一项</strong>：已更新</li><li>第二项</li><li>第三项</li></ul>';
    document.querySelector<HTMLButtonElement>('.preview-text-save')!.click();
    expect(input.value).toBe('- **第一项**：已更新\n- 第二项\n- 第三项');
    dispose();
  });
  it('edits exactly the fenced code body and preserves its fences', () => {
    const source = '```text\n第一行\n第二行\n```\n\n后文';
    const from = source.indexOf('第一行');
    const to = source.indexOf('\n```');
    document.body.innerHTML = `<textarea></textarea><div id="preview"><div class="magmark"><pre${markEditableSource(source, from, to)}><code>第一行\n第二行</code></pre></div></div>`;
    const input = document.querySelector('textarea')!;
    input.value = source;
    const dispose = mountPreviewEdit(document.querySelector('#preview')!, input, vi.fn());
    document.querySelector('code')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const field = document.querySelector<HTMLTextAreaElement>('#preview-text-input')!;
    expect(field.value).toBe('第一行\n第二行');
    expect(document.querySelector('label')!.textContent).toBe('编辑代码块内容');
    field.value = '更新内容';
    document.querySelector<HTMLButtonElement>('.preview-text-save')!.click();
    expect(input.value).toBe('```text\n更新内容\n```\n\n后文');
    dispose();
  });
  it('edits a paginated fragment using the full renderer-owned source range', () => {
    const source = '完整的跨页段落';
    document.body.innerHTML = `<textarea></textarea><div id="preview"><div class="magmark"><p${markEditableSource(source, 0, source.length)}>跨页段落</p></div></div>`;
    const input = document.querySelector('textarea')!;
    input.value = source;
    const dispose = mountPreviewEdit(document.querySelector('#preview')!, input, vi.fn());
    document.querySelector('p')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(document.querySelector('#preview-text-input')!.textContent).toBe(source);
    dispose();
  });
  it('commits only the mapped range and emits input', () => {
    const { input, field, dispose } = fixture();
    const onInput = vi.fn(); input.addEventListener('input', onInput);
    field.textContent = '新标题';
    document.querySelector<HTMLButtonElement>('.preview-text-save')!.click();
    expect(input.value).toBe('# 新标题\n\n不变');
    expect(onInput).toHaveBeenCalledOnce();
    expect(document.querySelector('.preview-text-editor')).toBeNull();
    dispose();
  });
  it('ignores IME Enter and cancels without changing source', () => {
    const { input, field, dispose } = fixture(); field.textContent = '未保存';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, isComposing: true, bubbles: true }));
    expect(input.value).toBe('# 标题\n\n不变');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('.preview-text-editor')).toBeNull();
    expect(input.value).toBe('# 标题\n\n不变'); dispose();
  });
  it('does not overwrite concurrent source changes', () => {
    const { input, field, report, dispose } = fixture();
    input.value = '# 其他修改'; field.textContent = '旧编辑';
    document.querySelector<HTMLButtonElement>('.preview-text-save')!.click();
    expect(input.value).toBe('# 其他修改');
    expect(report).toHaveBeenCalled(); dispose();
  });
});

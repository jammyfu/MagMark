// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { undo } from '@codemirror/commands';
import { mountSourceEditor, changedRange } from '../src/workspace/source-editor';
const cleanup: Array<() => void> = [];
afterEach(() => { cleanup.splice(0).forEach(fn => fn()); document.body.replaceChildren(); vi.restoreAllMocks(); });
function setup(value = '中文**API**工具\n\n`中文_key` 与 👩🏽‍💻') {
  const textarea = document.createElement('textarea'); textarea.value = value;
  const host = document.createElement('div'); document.body.append(textarea, host);
  const input = vi.fn(); textarea.addEventListener('input', input);
  const mounted = mountSourceEditor(textarea, host); cleanup.push(mounted.destroy);
  return { textarea, host, input, ...mounted };
}
describe('transactional source editor bridge', () => {
  it('preserves literal Markdown and changes only the adapted textarea', () => {
    const prototype = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    const source = '中文**API**工具\n`中文_key` 👩🏽‍💻'; const item = setup(source);
    expect(item.view.state.doc.toString()).toBe(source);
    expect(item.textarea.value).toBe(source);
    expect(Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')).toEqual(prototype);
    expect(document.createElement('textarea').value).toBe('');
  });
  it('uses the narrowest replacement', () => {
    expect(changedRange('![图](a.png){width=40%}', '![图](a.png){width=60%}')).toEqual({ from: 18, to: 19, insert: '6' });
  });
  it('makes an external image/source edit undoable as one operation', () => {
    const source = '![图](a.png){width=40%}'; const item = setup(source);
    item.textarea.value = '![图](a.png){width=60%}';
    expect(item.view.state.doc.toString()).toContain('60%'); expect(item.input).not.toHaveBeenCalled();
    expect(undo(item.view)).toBe(true); expect(item.textarea.value).toBe(source);
  });
  it('reflects user transactions through the existing input event', () => {
    const item = setup('中文'); item.view.dispatch({ changes: {from: 2, insert: 'API𠀀'} });
    expect(item.textarea.value).toBe('中文API𠀀'); expect(item.input).toHaveBeenCalledTimes(1);
  });
  it('preserves source-range selection including reverse selection', () => {
    const item = setup('甲\n𠀀API乙'); item.textarea.setSelectionRange(2, 7, 'backward');
    expect(item.view.state.selection.main.from).toBe(2); expect(item.view.state.selection.main.to).toBe(7);
    expect(item.view.state.selection.main.head).toBe(2); expect(item.textarea.selectionStart).toBe(2);
  });
  it('refuses whole-value writes during composition without changing source', () => {
    const item = setup('中文'); vi.spyOn(item.view, 'composing', 'get').mockReturnValue(true);
    expect(() => { item.textarea.value = '覆盖'; }).toThrow('IME'); expect(item.textarea.value).toBe('中文');
  });
  it('restores a usable textarea when destroyed', () => {
    const item = setup('原文'); item.view.dispatch({changes:{from:2,insert:'API'}}); item.destroy(); cleanup.pop();
    expect(item.textarea.hidden).toBe(false); expect(item.textarea.value).toBe('原文API');
    item.textarea.value = '继续'; expect(item.textarea.value).toBe('继续');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { CJKSpacers } from '../src/editor/extensions/cjk-spacers';
import { MagazineNodes } from '../src/editor/extensions/magazine-nodes';
import { PageBreakControls } from '../src/editor/extensions/page-break-controls';

const editors: Editor[] = [];
function create(content: string) {
  const editor = new Editor({ content, extensions: [StarterKit, Link, CJKSpacers, MagazineNodes, PageBreakControls] });
  editors.push(editor); return editor;
}
afterEach(() => { editors.splice(0).forEach(editor => editor.destroy()); vi.restoreAllMocks(); });

describe('structured editor source safety', () => {
  it('does not rewrite Chinese source text on ordinary editing', () => {
    const editor = create('<p>中文API</p>');
    editor.commands.insertContentAt(1, '前');
    expect(editor.getText()).toBe('前中文API');
  });
  it('normalizes across inline marks and multiple blocks in one undoable command', () => {
    const editor = create('<p>𠀀<strong>API</strong>中文</p><p>用é测试</p>');
    const before = editor.getJSON();
    expect(editor.commands.addCJKSpacing()).toBe(true);
    expect(editor.getText()).toBe('𠀀 API 中文\n\n用 é 测试');
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getJSON()).toEqual(before);
  });
  it('does not change code, code blocks or link destinations/labels', () => {
    const editor = create('<p>中文API <code>中文_key</code> <a href="https://x.test/中文API">中文API</a></p><pre><code>中文API</code></pre>');
    editor.commands.addCJKSpacing();
    const root = document.createElement('div'); root.innerHTML = editor.getHTML();
    expect(root.querySelector('p code')?.textContent).toBe('中文_key');
    expect(root.querySelector('pre')?.textContent).toBe('中文API');
    expect(root.querySelector('a')?.textContent).toBe('中文API');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('https://x.test/中文API');
  });
  it('capability checks do not change spacing or indicator state', () => {
    const editor = create('<p>中文API</p>');
    const before = editor.getJSON();
    const classBefore = editor.view.dom.className;
    expect(editor.can().addCJKSpacing()).toBe(true);
    expect(editor.can().toggleCJKSpacing()).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(editor.view.dom.className).toBe(classBefore);
  });
  it('does not normalize while the input method is composing', () => {
    const editor = create('<p>中文API</p>');
    vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
    expect(editor.commands.addCJKSpacing()).toBe(false);
    expect(editor.getText()).toBe('中文API');
  });
  it('removes multiple page breaks without stale transaction positions', () => {
    const editor = create('<p>甲</p><span data-page-break="true"></span><p>乙</p><span data-page-break="true"></span><p>丙</p><span data-page-break="true"></span><p>丁</p>');
    expect(editor.commands.removeAllPageBreaks()).toBe(true);
    expect(editor.getText()).toBe('甲\n\n乙\n\n丙\n\n丁');
    expect(editor.getJSON().content?.some(node => node.type === 'pageBreak')).toBe(false);
  });
  it('shows initial page indicators and can turn them off without changing content', () => {
    const editor = create('<p>正文</p><span data-page-break="true"></span>');
    const before = editor.getJSON();
    expect(editor.view.dom.querySelector('.mm-page-break-widget')).not.toBeNull();
    expect(editor.commands.togglePageBreakIndicators()).toBe(true);
    expect(editor.view.dom.querySelector('.mm-page-break-widget')).toBeNull();
    expect(editor.getJSON()).toEqual(before);
  });
  it('rejects an out-of-range page-break position instead of throwing', () => {
    const editor = create('<p>正文</p>');
    expect(editor.commands.insertPageBreakAt(-1)).toBe(false);
    expect(editor.commands.insertPageBreakAt(9999)).toBe(false);
  });
});

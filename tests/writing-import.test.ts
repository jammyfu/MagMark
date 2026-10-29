import { describe, expect, it } from 'vitest';
import { importClipboard, richTextToMarkdown } from '../src/workspace/writing-import';

describe('writing clipboard import', () => {
  it('converts Word headings, inline formatting and list paragraphs', () => {
    const result = richTextToMarkdown('<p class="MsoHeading1">标题</p><p>中文<span style="font-weight:700">加粗</span>和<i>斜体</i></p><p class="MsoListParagraph">• 第一项</p><p class="MsoListParagraph">2. 第二项</p>');
    expect(result.text).toContain('# 标题');
    expect(result.text).toContain('中文**加粗**和*斜体*');
    expect(result.text).toContain('- 第一项');
    expect(result.text).toContain('2. 第二项');
  });
  it('keeps Markdown clipboard text exact even when browser also supplies HTML', () => {
    const source = '# 标题\r\n\r\n**加粗**';
    expect(importClipboard(source, '<h1>标题</h1><p>加粗</p>', 'auto').text).toBe(source);
  });
  it('prefers Word structure and offers an explicit plain-text bypass', () => {
    const html = '<p class="MsoHeading1">标题</p>';
    expect(importClipboard('标题', html, 'auto').text).toBe('# 标题');
    expect(importClipboard('标题', html, 'plain').text).toBe('标题');
    expect(importClipboard('标题', html, 'markdown').text).toBe('标题');
  });
  it('does not guess headings or modify ordinary text, Unicode or whitespace', () => {
    const text = '普通标题\r\n下一行\n\n  中文 👩🏽‍💻\t';
    expect(importClipboard(text, '', 'auto').text).toBe(text);
  });
  it('preserves nested lists, quotes, links and code', () => {
    const result = richTextToMarkdown('<ol start="3"><li>一<ul><li>子项</li></ul></li><li>二</li></ol><blockquote><p>引用</p></blockquote><p><a href="https://example.com">链接</a></p><pre>a\n```\nb</pre>');
    expect(result.text).toContain('3. 一\n   - 子项');
    expect(result.text).toContain('4. 二');
    expect(result.text).toContain('> 引用');
    expect(result.text).toContain('[链接](<https://example.com>)');
    expect(result.text).toContain('````\na\n```\nb\n````');
  });
  it('retains merged tables as sanitized HTML and reports inaccessible images', () => {
    const result = richTextToMarkdown('<table><tr><td colspan="2">合并</td></tr></table><img src="file:///local/image.png" alt="图">');
    expect(result.text).toContain('colspan="2"');
    expect(result.warnings).toHaveLength(2);
    expect(result.text).not.toContain('file:');
  });
  it('strips active HTML, event handlers and dangerous URLs before conversion', () => {
    const result = richTextToMarkdown('<script>alert(1)</script><p onclick="alert(1)">正文<a href="javascript:alert(1)">链接</a></p><iframe src="https://evil.test"></iframe>');
    expect(result.text).toBe('正文链接');
  });
  it('escapes literal rich-text Markdown characters', () => {
    expect(richTextToMarkdown('<p># 普通 * 星号</p>').text).toBe('\\# 普通 \\* 星号');
  });
});

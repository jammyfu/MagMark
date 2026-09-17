import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareMixedPreview, spaceMixedHtml, styleMixedRuns } from '../src/core/mixed-typography';
import { sanitizeWechatPasteHtml } from '../src/wechat/wechat-sanitize';

describe('mixed Chinese/Latin typography', () => {
  it('spaces across inline emphasis boundaries and preserves inline structure', () => {
    expect(spaceMixedHtml('<p>使用<strong>GPT</strong>模型和<em>2026</em>年的café测试</p>'))
      .toBe('<p>使用<strong> GPT</strong> 模型和<em> 2026</em> 年的 café 测试</p>');
  });
  it('preserves existing whitespace, URLs, code, ruby and separate blocks', () => {
    const html = '<p>中文 AI\u00a0模型</p><p>中文</p><p>AI</p><pre>中文GPT</pre><p><code>汉字API</code><a href="https://例.com/中文API">https://例.com/中文API</a><ruby>汉<rt>hàn</rt></ruby></p>';
    expect(spaceMixedHtml(html)).toBe(html);
    expect(spaceMixedHtml('<p>https://例.com/中文API</p>')).toBe('<p>https://例.com/中文API</p>');
  });
  it('is idempotent and handles combining marks, supplementary Han and numeric units', () => {
    const html = '<p>𠀀café测试2026年，速度5.71美元，70%流量和ＡＢＣ中文。</p>';
    const result = spaceMixedHtml(html);
    expect(result).toBe('<p>𠀀 café 测试 2026 年，速度 5.71 美元，70%流量和ＡＢＣ中文。</p>');
    expect(spaceMixedHtml(result)).toBe(result);
  });
  it('uses exactly one spacing path and does not mutate native preview text', () => {
    const html = '<p data-mm-edit="test">中文<strong>AI</strong>测试</p>';
    expect(prepareMixedPreview(html, true).replace(/<[^>]*>/g, '')).toBe('中文AI测试');
    expect(prepareMixedPreview(html, false).replace(/<[^>]*>/g, '')).toBe('中文\u2009AI\u2009测试');
    expect(prepareMixedPreview(prepareMixedPreview(html, false), false)).toBe(prepareMixedPreview(html, false));
  });
  it('sizes Latin in mixed prose without splitting proper names, changing text or nesting spans', () => {
    const html = '<p>机构SemiAnalysis的<strong>70%流量（Agent）</strong>，https://example.com/longpath。</p><p>English only.</p><pre>中文API</pre>';
    const rendered = styleMixedRuns(html);
    expect(rendered).toContain('<span class="mm-latin-run">SemiAnalysis</span>');
    expect(rendered).toContain('<span class="mm-latin-run">70%</span>');
    expect(rendered).toContain('<span class="mm-reference-run">https://example.com/longpath</span>');
    expect(rendered).toContain('<p>English only.</p><pre>中文API</pre>');
    expect(rendered.replace(/<[^>]*>/g, '')).toBe(html.replace(/<[^>]*>/g, ''));
    expect(styleMixedRuns(rendered)).toBe(rendered);
  });
  it('preserves portable spacing through repeated WeChat sanitization', () => {
    const once = sanitizeWechatPasteHtml('<p>中文<strong>AI</strong>测试</p>');
    expect(once).toContain(' AI');
    const text = (html: string) => html.replace(/<[^>]*>/g, '');
    expect(text(sanitizeWechatPasteHtml(once))).toBe(text(once));
  });
  it('keeps display/print rules aligned and removes post-pagination Han mutation', () => {
    const css = readFileSync('editor.css', 'utf8');
    const editor = readFileSync('editor.ts', 'utf8');
    const entry = readFileSync('index.html', 'utf8');
    expect(css).not.toContain('text-justify: inter-word');
    expect(css).not.toContain('word-break: keep-all');
    expect(css).toContain('text-autospace: normal');
    expect(editor).not.toContain('Han(document.body).render()');
    expect(entry).not.toContain('han.min');
    expect(css).not.toContain("--th-font-body: 'DejaVu");
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MagMark } from '../src/core/magmark';
import { sanitizeWechatPasteHtml } from '../src/wechat/wechat-sanitize';
import { findImageReferences } from '../src/image/image-context-menu';

const hostile = '<section id="app-header"><script>window.__unsafe = 1</script><style>body{display:none}</style><iframe srcdoc="bad"></iframe><svg onload="bad()"><script>bad()</script></svg><img src="assets/photo.png" onerror="bad()"><a href="java&#x09;script:bad()">链接</a><p style="color:#123456;background-image:url(https://invalid.test/pixel);position:fixed">正文</p></section>';
function parsed(html: string) { return new DOMParser().parseFromString(html, 'text/html'); }
function expectSafe(html: string) {
  const doc = parsed(html);
  expect(doc.querySelector('script,style,iframe,svg,object,embed,form')).toBeNull();
  expect(doc.querySelector('[onerror],[onload],[srcdoc],[id="app-header"]')).toBeNull();
  expect(doc.querySelector('a')?.getAttribute('href')).toBeNull();
  expect(html).not.toMatch(/background-image|position\s*:\s*fixed/i);
  expect(doc.querySelector('img')?.getAttribute('src')).toBe('assets/photo.png');
  expect(doc.body.textContent).toContain('正文');
}

describe('content trust at shipped entry boundaries', () => {
  it('removes active HTML from the WeChat output boundary', () => {
    expectSafe(sanitizeWechatPasteHtml(hostile));
  });
  it('cleans SDK output without changing authoritative Markdown', async () => {
    const result = await new MagMark().render(hostile);
    expect(result.markdown).toBe(hostile);
    expectSafe(result.html);
  });
  it('retains table semantics, safe inline widths and decoded text', () => {
    const result = parsed(sanitizeWechatPasteHtml('<table><caption>价目</caption><thead><tr><th>项目</th></tr></thead><tbody><tr><td rowspan="2">A &amp; B</td></tr><tr></tr></tbody></table><img src="assets/a_b.png" style="width:50%;height:auto" alt="中文API">'));
    expect(result.querySelector('td')?.textContent).toBe('A & B');
    expect(result.querySelector('td')?.getAttribute('rowspan')).toBe('2');
    expect(result.querySelector('img')?.getAttribute('style')).toMatch(/width:\s*50%/);
  });
  it('does not treat markup in comments or scripts as editable images', () => {
    const refs = findImageReferences('<!-- <img src="comment.png"> -->\n\n<script>const sample = "<img src=script.png>";</script>\n\n<img src="real.png" alt="A &amp; B">');
    expect(refs.map(ref => ref.src)).toEqual(['real.png']);
    expect(refs[0].alt).toBe('A & B');
  });
  it('does not invent images from quoted attribute values', () => {
    const refs = findImageReferences('<div title="<img src=not-an-image.png>">说明</div>\n\n<img src="actual.png">');
    expect(refs.map(ref => ref.src)).toEqual(['actual.png']);
  });
  it('leaves raw HTML code examples as literal text', async () => {
    const code = '<img src=x onerror=bad()>';
    const result = await new MagMark().render('```html\n'+code+'\n```');
    expect(parsed(result.html).querySelector('code')?.textContent?.trim()).toBe(code);
    expect(parsed(result.html).querySelector('img')).toBeNull();
  });
});

import { sanitizeArticleHtml, isSafeImageSource } from '../src/security/article-html';
import { ImagePanel } from '../src/image/image-panel';

describe('shared HTML policy details', () => {
  it.each(['javascript:bad()', 'java\nscript:bad()', 'data:text/html,<script>bad()</script>', 'vbscript:bad()'])('rejects executable image source %s', src => {
    expect(isSafeImageSource(src)).toBe(false);
    expect(parsed(sanitizeArticleHtml(`<img src="${src}">`)).querySelector('img')?.hasAttribute('src')).toBe(false);
  });
  it('namespaces anchors idempotently and preserves table header references', () => {
    const output = sanitizeArticleHtml('<h2 id="section-one">标题</h2><a href="#section-one">目录</a><table><tr><th id="price">价格</th><td headers="price">10</td></tr></table>');
    expect(sanitizeArticleHtml(output)).toBe(output);
    const doc = parsed(output);
    expect(doc.querySelector('h2')?.id).toBe('mm-user-section-one');
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('#mm-user-section-one');
    expect(doc.querySelector('td')?.getAttribute('headers')).toBe('mm-user-price');
  });
  it('preserves safe cover layout but not executable HTML or CSS URLs', () => {
    const out = parsed(sanitizeArticleHtml('<div class="mm-cover" style="position:relative;display:flex;background:linear-gradient(90deg,#fff,#eee)"><h1 class="mm-cover-title" style="position:absolute;left:10%;transform:translate(2px,3px);background:url(https://invalid.test/x)" onclick="bad()">标题</h1></div>', 'cover'));
    expect(out.querySelector('h1')?.getAttribute('onclick')).toBeNull();
    expect(out.querySelector('h1')?.getAttribute('style')).toContain('position:absolute');
    expect(out.querySelector('h1')?.getAttribute('style')).toContain('transform:translate(2px,3px)');
    expect(out.querySelector('h1')?.getAttribute('style')).not.toContain('url(');
  });
  it('uses image attributes as data in the actual image panel', () => {
    const panel = new ImagePanel(() => {});
    const src = 'https://example.test/a" onerror="bad()';
    try {
      panel.openWithSrc(src, {alt:'说明" onload="bad()',layout:'center',width:50,caption:''});
      const image = document.querySelector('#mm-ip-preview-area img');
      expect(image?.getAttribute('src')).toBe(src);
      expect(image?.getAttribute('alt')).toBe('说明" onload="bad()');
      expect(image?.getAttribute('onerror')).toBeNull();
      expect(image?.getAttribute('onload')).toBeNull();
    } finally { panel.destroy(); }
  });
  it('does not allow CSS escapes or active fetch functions', () => {
    const out = sanitizeArticleHtml('<p style="background:u\\72l(https://invalid.test/a);color:#123456;border-image: url(x);font-family:evil(1)">文本</p>');
    expect(parsed(out).querySelector('p')?.getAttribute('style')).toBe('color:#123456');
  });
});

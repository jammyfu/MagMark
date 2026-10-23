// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { MagMark } from '../src/core/magmark';
import { createMagazinePipeline, paginationNodes, typographyEnhancers } from '../src/plugins';

async function html(source: string, plugins = createMagazinePipeline()) {
  return String(await unified().use(remarkParse).use(plugins)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true }).process(source));
}
function dom(markup: string) {
  const result = document.createElement('div'); result.innerHTML = markup; return result;
}

describe('real Markdown plugin pipeline', () => {
  it('runs attachers before transformers instead of invoking transformers without a tree', async () => {
    const source = '# 标题\n\n中文API，测试。';
    const rendered = await new MagMark().render(source);
    expect(rendered.markdown).toBe(source);
    expect(dom(rendered.html).querySelector('h1')?.textContent).toBe('标题');
    expect(dom(rendered.html).querySelector('p')?.textContent).toBe('中文 API，测试。');
  });
  it('preserves code literals, URL destinations, and source Markdown', async () => {
    const source = '中文`const 中文_key = "中文API"`和[API](https://example.test/中文API?key=x_y)。';
    const result = await new MagMark().render(source);
    const parsed = dom(result.html);
    expect(result.markdown).toBe(source);
    expect(parsed.querySelector('code')?.textContent).toBe('const 中文_key = "中文API"');
    expect(decodeURI(parsed.querySelector('a')!.getAttribute('href')!)).toBe('https://example.test/中文API?key=x_y');
    expect(parsed.textContent).not.toMatch(/[\u200b\u2060]/u);
  });
  it('renders a captioned standalone image as a valid figure', async () => {
    const parsed = dom(await html('![图注](assets/photo.png "图片标题")'));
    expect(parsed.firstElementChild?.tagName).toBe('FIGURE');
    expect(parsed.querySelector('figure > img')?.getAttribute('src')).toBe('assets/photo.png');
    expect(parsed.querySelector('figcaption')?.textContent).toBe('图注');
    expect(parsed.querySelector('img')?.getAttribute('title')).toBe('图片标题');
  });
  it('keeps an inline image inline instead of losing it in a HAST/mdast mismatch', async () => {
    const parsed = dom(await html('前文![图注](assets/a.png)后文'));
    expect(parsed.querySelector('p > img')?.getAttribute('src')).toBe('assets/a.png');
    expect(parsed.querySelector('figure')).toBeNull();
    expect(parsed.textContent).toBe('前文后文');
  });
  it('supports exact comment page markers and avoids duplicate chapter breaks', async () => {
    const parsed = dom(await html('# 一\n\n正文\n\n<!-- page-break -->\n\n# 二'));
    expect(parsed.querySelectorAll('[data-page-break="true"]')).toHaveLength(1);
    expect(parsed.querySelectorAll('h1')).toHaveLength(2);
  });
  it('does not erase arbitrary HTML because its class contains page-break', async () => {
    const parsed = dom(await html('<div class="page-break-info">这不是分页指令</div>'));
    expect(parsed.textContent).toBe('这不是分页指令');
    expect(parsed.querySelector('[data-page-break]')).toBeNull();
  });
  it('respects an empty marker list and an explicit chapter switch', async () => {
    const output = await html('开始\n\n---\n\n# 标题', [[paginationNodes, { markers: [], chapterNewPage: false }]]);
    const parsed = dom(output);
    expect(parsed.querySelector('hr')).not.toBeNull();
    expect(parsed.querySelector('[data-page-break]')).toBeNull();
  });
  it('typography defaults use style metadata, not invisible source characters', async () => {
    const parsed = dom(await html('中文，测试。\n\n# The final English words', [[typographyEnhancers, { smartQuotes: false }]]));
    expect(parsed.querySelector('p')?.textContent).toBe('中文，测试。');
    expect(parsed.querySelector('h1')?.textContent).toBe('The final English words');
    expect(parsed.querySelector('p')?.classList.contains('mm-no-widows')).toBe(true);
  });
});

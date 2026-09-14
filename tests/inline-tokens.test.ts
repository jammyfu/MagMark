import { describe, expect, it } from 'vitest';
import { protectInlineContent } from '../src/core/inline-tokens';
import { renderWechatHtml } from '../src/wechat/wechat-renderer';
import { WECHAT_THEMES } from '../src/wechat/wechat-themes';

describe('image URLs and literal inline content', () => {
    const src = 'assets/TheLegendOfTrump_Development/White_House_X_Title_Screen.png';
    it('keeps raw HTML attributes intact while allowing emphasis around the image', () => {
        const original = `<a href="${src}"><img src="${src}" alt="a_b_c" width="320"></a> _说明_`;
        const tokens = protectInlineContent(original, code => `<code>${code}</code>`);
        const result = tokens.restore(tokens.text.replace(/_([^_]+)_/g, '<em>$1</em>'));
        expect(result).toBe(`<a href="${src}"><img src="${src}" alt="a_b_c" width="320"></a> <em>说明</em>`);
    });
    it('resolves raw HTML images without changing link attributes', () => {
        const tokens = protectInlineContent(`<img src="${src}">`, code => code, () => 'data:image/png;base64,AAAA');
        expect(tokens.restore(tokens.text)).toBe('<img src="data:image/png;base64,AAAA">');
    });
    it('does not apply emphasis within inline code', () => {
        const tokens = protectInlineContent('`a_b_c *literal*`', code => `<code>${code}</code>`);
        expect(tokens.restore(tokens.text.replace(/_([^_]+)_/g, '<em>$1</em>'))).toBe('<code>a_b_c *literal*</code>');
    });
    it('keeps image and link underscores intact in the WeChat renderer', () => {
        const html = renderWechatHtml(`<img src="${src}" alt="a_b_c" />\n\n看 ![插图](https://example.com/a_b_c.png) 和 [原图](https://example.com/a_b_c.png)`, {
            theme: WECHAT_THEMES.minimalist, fontFamily: '', fontSizeMultiplier: 1,
        });
        expect(html).toContain(`src="${src}"`);
        expect(html).toContain('src="https://example.com/a_b_c.png"');
        expect(html).toContain('href="https://example.com/a_b_c.png"');
        expect(html).not.toMatch(/src="[^">]*<(em|span)/);
    });
});

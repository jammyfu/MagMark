/**
 * WeChat Official Account paste HTML must pass 内容结构检测.
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { renderWechatHtml } from '../src/wechat/wechat-renderer';
import {
    collectOversizedWidths,
    collectTextAlignValues,
    sanitizeWechatPasteHtml,
    WECHAT_CONTENT_MAX_WIDTH_PX,
} from '../src/wechat/wechat-sanitize';
import { WECHAT_THEMES, WechatTheme } from '../src/wechat/wechat-themes';

const FONT = '-apple-system, BlinkMacSystemFont, sans-serif';

function render(md: string, theme: WechatTheme = WECHAT_THEMES.minimalist): string {
    return renderWechatHtml(md, {
        theme,
        fontFamily: FONT,
        fontSizeMultiplier: 1,
    });
}

const LONG_ARTICLE = `作为一枚铁粉，任凭。

这次刷到 White House 的 X 账号发的视频 The Legend of Trump，看到「懂王」的样子，真没想到。你这个米国政府是要拿铁杆粉开刀吗？

![The Legend of Trump](https://example.com/legend-of-trump.jpg)

看着看着突然冒出一个念头：既然铁粉都没了，干脆让「懂王」真的能玩起来？

于是我把视频交给 Codex，并说「懂王」让「懂王」像样一点儿，不过是在 White House 前走动，收集物品，一路加到挥剑、蓄力攻击、拉弓射 Boss。手机端上也能到了推到按键。

这一段很长，用来模拟公众号长文里图文混排的正文。中英文混排 The Legend of Trump 也应保持可读行距。

![海报说明](https://example.com/poster.png){.center width=1200}

再接一段两端对齐曾经会触发检测的正文：微信公众号正文栏大约 677 像素，固定宽度图片和 figure 居中会在窄屏溢出。
`;

describe('WeChat paste HTML — content structure', () => {
    it('does not emit text-justify from any built-in theme', () => {
        for (const theme of Object.values(WECHAT_THEMES)) {
            const html = render(LONG_ARTICLE, theme);
            expect(html, theme.nameEn).not.toMatch(/style="[^"]*text-justify/i);
            expect(JSON.stringify(theme.styles), theme.nameEn).not.toMatch(/text-justify/i);
            expect(theme.styles.p, theme.nameEn).not.toMatch(/text-align\s*:\s*justify/i);
        }
    });

    it('only uses WeChat-safe text-align values (left|right|center)', () => {
        const html = render(LONG_ARTICLE);
        const aligns = collectTextAlignValues(html);
        expect(aligns.length).toBeGreaterThan(0);
        for (const value of aligns) {
            expect(['left', 'right', 'center']).toContain(value);
        }
        expect(html).not.toMatch(/style="[^"]*text-align\s*:\s*justify/i);
        expect(html).not.toMatch(/style="[^"]*text-align\s*:\s*start/i);
        expect(html).not.toMatch(/style="[^"]*text-align\s*:\s*end/i);
    });

    it('does not wrap standalone images in figure or nest margin:auto centering', () => {
        const html = render(LONG_ARTICLE);
        expect(html).not.toMatch(/<figure\b/i);
        expect(html).toMatch(
            /<p style="[^"]*text-align:\s*center[^"]*"><img src="https:\/\/example.com\/legend-of-trump\.jpg"/,
        );
        expect(html).toMatch(
            /<p style="[^"]*text-align:\s*center[^"]*">The Legend of Trump<\/p>/,
        );
        expect(html).not.toMatch(/margin:[^;"']*auto/i);
        expect(html).not.toMatch(/display\s*:\s*block/i);
    });

    it('does not emit fixed widths larger than the WeChat content column', () => {
        const html = render(LONG_ARTICLE);
        expect(collectOversizedWidths(html)).toEqual([]);
        expect(html).toMatch(/max-width:100%/);
        expect(html).not.toMatch(/width\s*:\s*1200/i);
        expect(html).not.toMatch(/width=["']1200/i);
    });

    it('keeps body paragraphs readable without justify', () => {
        const html = render(LONG_ARTICLE);
        expect(html).toMatch(/<p style="[^"]*line-height:\s*1\.85/);
        expect(html).toMatch(/letter-spacing:\s*0\.02em/);
        expect(html).toContain('作为一枚铁粉');
        expect(html).toContain('White House');
    });

    it('table cell alignment only uses left/right/center', () => {
        const md = `
| Left | Mid | Right |
|:-----|:---:|------:|
| a | b | c |
`;
        const html = render(md);
        const aligns = collectTextAlignValues(html);
        for (const value of aligns) {
            expect(['left', 'right', 'center']).toContain(value);
        }
        expect(html).toMatch(/text-align:center/);
        expect(html).toMatch(/text-align:right/);
    });
});

describe('sanitizeWechatPasteHtml', () => {
    it('strips text-justify and non-standard text-align', () => {
        const dirty = `<section style="text-align:justify;text-justify:inter-ideograph;">
<p style="text-align: start;">hello</p>
<p style="text-align:end;">bye</p>
<p style="text-align:center;">ok</p>
</section>`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(clean).not.toMatch(/text-justify/i);
        expect(clean).not.toMatch(/text-align:justify/i);
        expect(clean).not.toMatch(/text-align:start/i);
        expect(clean).not.toMatch(/text-align:end/i);
        expect(clean).toMatch(/text-align:center/);
        for (const value of collectTextAlignValues(clean)) {
            expect(['left', 'right', 'center']).toContain(value);
        }
    });

    it('rewrites figure + margin:auto images into a single centering pattern', () => {
        const dirty = `<figure style="margin:20px 0;text-align:center;">
<img src="x.jpg" alt="The Legend of Trump" width="1080" style="max-width:100%;margin:20px auto;display:block;width:900px;">
<p style="text-align:center;">The Legend of Trump</p>
</figure>`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(clean).not.toMatch(/<figure\b/i);
        expect(clean).not.toMatch(/display\s*:\s*block/i);
        expect(clean).not.toMatch(/margin:[^;"']*auto/i);
        expect(clean).not.toMatch(/width:900px/);
        expect(clean).not.toMatch(/width="1080"/);
        expect(collectOversizedWidths(clean)).toEqual([]);
        expect(clean).toMatch(/<p style="[^"]*text-align:\s*center[^"]*"><img /);
        expect(clean).toMatch(/The Legend of Trump/);
        expect(clean).toMatch(/max-width:100%/);
    });

    it('clamps percentage widths and drops oversized max-width px', () => {
        const dirty = `<p style="width:120%">x</p><img src="a.jpg" style="max-width:900px">`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(clean).toMatch(/width:100%/);
        expect(clean).toMatch(/max-width:100%/);
        expect(collectOversizedWidths(clean)).toEqual([]);
        expect(WECHAT_CONTENT_MAX_WIDTH_PX).toBe(677);
    });
});

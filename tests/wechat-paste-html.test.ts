/**
 * WeChat Official Account paste HTML must pass 内容结构检测.
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { renderWechatHtml } from '../src/wechat/wechat-renderer';
import {
    collectGradientValues,
    collectOversizedWidths,
    collectTextAlignValues,
    collectUnsafeLineHeights,
    isLineHeightSafeForFontSize,
    normalizeWechatEmphasisStyle,
    rewriteWechatStyle,
    sanitizeWechatPasteHtml,
    WECHAT_CONTENT_MAX_WIDTH_PX,
    WECHAT_MIN_LINE_HEIGHT_RATIO,
} from '../src/wechat/wechat-sanitize';
import { WECHAT_THEMES, WechatTheme } from '../src/wechat/wechat-themes';

const FONT = '-apple-system, BlinkMacSystemFont, sans-serif';

function render(
    md: string,
    theme: WechatTheme = WECHAT_THEMES.minimalist,
    fontSizeMultiplier = 1,
): string {
    return renderWechatHtml(md, {
        theme,
        fontFamily: FONT,
        fontSizeMultiplier,
    });
}

function assertSafePasteHtml(html: string, label: string): void {
    expect(collectGradientValues(html), `${label} gradients`).toEqual([]);
    expect(html, label).not.toMatch(/(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i);
    expect(collectUnsafeLineHeights(html), `${label} line-height`).toEqual([]);
    expect(collectOversizedWidths(html), `${label} widths`).toEqual([]);
    const aligns = collectTextAlignValues(html);
    for (const value of aligns) {
        expect(['left', 'right', 'center'], `${label} text-align=${value}`).toContain(value);
    }
    expect(html, label).not.toMatch(/text-justify/i);
    expect(html, label).not.toMatch(/(?:^|;|\s)text-align\s*:\s*(start|end|justify|inherit|initial|unset|match-parent)/i);
    expect(html, label).not.toMatch(/font-family\s*:/i);
    expect(html, label).not.toMatch(/<(em|i)\b/i);
    expect(html, label).not.toMatch(/(?:-webkit-|-moz-)?text-emphasis(?:-style|-color|-position)?\s*:\s*(?!none\b)/i);
}

const TEXT_ONLY_ARTICLE = `# 作为一枚铁粉，任凭

这次刷到 White House 的 X 账号发的视频 The Legend of Trump，看到「懂王」的样子，真没想到。你这个米国政府是要拿铁杆粉开刀吗？

## 长文正文不应触发封面检测

看着看着突然冒出一个念头：既然铁粉都没了，干脆让「懂王」真的能玩起来？于是我把视频交给 Codex，并说「懂王」让「懂王」像样一点儿，不过是在 White House 前走动，收集物品，一路加到挥剑、蓄力攻击、拉弓射 Boss。手机端上也能到了推到按键。

这一段很长，用来模拟公众号长文里只有文字、没有图片的正文。中英文混排 The Legend of Trump 也应保持可读行距。微信公众号正文栏大约 677 像素，固定宽度和错误行高会在窄屏叠字。

### 列表与引用也要安全

- 第一项：行高必须大于等于字号，多行列表不能重叠
- 第二项：text-align 只能是 left、right 或 center
- 第三项：文字背景不能使用渐变色

1. 有序列表第一行同样是多行文本时不能行高塌缩
2. 有序列表第二行继续写很长的中文说明，用来撑出第二行第三行

> 引用块里的多行文字也要能换行。这是一段足够长的引用，用来确认 blockquote 内部段落在字号倍率变化后行高仍然不小于字体大小。

再接一段曾经会触发两端对齐检测的正文：不要 justify，也不要 start / end。公众号编辑器会把省略的对齐写成 start。

| 左列长标题 | 中间说明 | 右侧备注 |
|:-----------|:--------:|---------:|
| 单元格里也是多行可能换行的中文内容 | 居中 | 右对齐 |

---

最后再写一段收束，确保分隔线、加粗 **懂王**、斜体 *White House* 和 \`inline code\` 混排后，每一个带字号的节点都有安全行高。
`;

const IMAGE_RICH_ARTICLE = `作为一枚铁粉，任凭。

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
            const html = render(IMAGE_RICH_ARTICLE, theme);
            expect(html, theme.nameEn).not.toMatch(/style="[^"]*text-justify/i);
            expect(JSON.stringify(theme.styles), theme.nameEn).not.toMatch(/text-justify/i);
            expect(theme.styles.p, theme.nameEn).not.toMatch(/text-align\s*:\s*justify/i);
        }
    });

    it('only uses WeChat-safe text-align values (left|right|center)', () => {
        const html = render(IMAGE_RICH_ARTICLE);
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
        const html = render(IMAGE_RICH_ARTICLE);
        expect(html).not.toMatch(/<figure\b/i);
        expect(html).toMatch(
            /<p[^>]*style="[^"]*text-align:\s*center[^"]*"><img[^>]*src="https:\/\/example.com\/legend-of-trump\.jpg"/,
        );
        expect(html).toMatch(
            /<p style="[^"]*text-align:\s*center[^"]*">The Legend of Trump<\/p>/,
        );
        expect(html).not.toMatch(/margin:[^;"']*auto/i);
        expect(html).not.toMatch(/display\s*:\s*block/i);
    });

    it('does not emit fixed widths larger than the WeChat content column', () => {
        const html = render(IMAGE_RICH_ARTICLE);
        expect(collectOversizedWidths(html)).toEqual([]);
        expect(html).toMatch(/max-width:100%/);
        expect(html).not.toMatch(/width\s*:\s*1200/i);
        expect(html).not.toMatch(/width=["']1200/i);
    });

    it('keeps body paragraphs readable without justify', () => {
        const html = render(IMAGE_RICH_ARTICLE);
        expect(html).toMatch(/<p style="[^"]*line-height:\s*32px/);
        expect(html).toMatch(/letter-spacing:\s*0\.02em/);
        expect(html).toMatch(/text-align:left/);
        expect(html).toContain('作为一枚铁粉');
        expect(html).toContain('White House');
    });

    it('flattens GFM tables into paragraphs instead of table/th (avoids #1.4 / #2.3.2)', () => {
        const md = `
| Left | Mid | Right |
|:-----|:---:|------:|
| a | b | c |
`;
        const html = render(md);
        expect(html).not.toMatch(/<table\b/i);
        expect(html).not.toMatch(/<th\b/i);
        expect(html).toContain('Left');
        expect(html).toContain('a');
        const aligns = collectTextAlignValues(html);
        for (const value of aligns) {
            expect(['left', 'right', 'center']).toContain(value);
        }
    });

    it('image-free long articles stay clean on every built-in theme', () => {
        for (const theme of Object.values(WECHAT_THEMES)) {
            const html = render(TEXT_ONLY_ARTICLE, theme);
            assertSafePasteHtml(html, `text-only ${theme.nameEn}`);
            expect(html, theme.nameEn).not.toMatch(/<img\b/i);
            expect(html, theme.nameEn).toContain('作为一枚铁粉');
        }
    });

    it('image-rich articles stay clean on every built-in theme', () => {
        for (const theme of Object.values(WECHAT_THEMES)) {
            const html = render(IMAGE_RICH_ARTICLE, theme);
            assertSafePasteHtml(html, `image-rich ${theme.nameEn}`);
            expect(html, theme.nameEn).toMatch(/<img\b[^>]*data-ignore-width/i);
            expect(html, theme.nameEn).toMatch(/The Legend of Trump/);
        }
    });

    it('built-in theme source styles do not paint text with CSS gradients', () => {
        for (const theme of Object.values(WECHAT_THEMES)) {
            expect(JSON.stringify(theme.styles), theme.nameEn).not.toMatch(
                /(?:repeating-)?(?:linear|radial|conic)-gradient/i,
            );
        }
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
        expect(clean).toMatch(/<p[^>]*style="[^"]*text-align:\s*center[^"]*"><img /);
        expect(clean).toMatch(/The Legend of Trump/);
        expect(clean).toMatch(/max-width:100%/);
        assertSafePasteHtml(clean, 'figure rewrite');
    });

    it('clamps percentage widths and drops oversized max-width px', () => {
        const dirty = `<p style="width:120%">x</p><img src="a.jpg" style="max-width:900px">`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(clean).toMatch(/width:100%/);
        expect(clean).toMatch(/max-width:100%/);
        expect(collectOversizedWidths(clean)).toEqual([]);
        expect(WECHAT_CONTENT_MAX_WIDTH_PX).toBe(677);
    });

    it('replaces gradient text backgrounds with a solid color', () => {
        const dirty = `<h2 style="font-size:22px;line-height:1.4;color:#fff;background:linear-gradient(45deg, #f4511e, #ffb300);">日落</h2>
<hr style="height:4px;background:linear-gradient(to right, #ff5722, transparent);border:none;">
<p style="font-size:16px;line-height:1.85;background-image:linear-gradient(rgb(248, 245, 247), rgb(194, 43, 76));">渐变正文</p>`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(collectGradientValues(clean)).toEqual([]);
        expect(clean).not.toMatch(/gradient\s*\(/i);
        expect(clean).toMatch(/#f4511e|#ff5722|rgb\(248,\s*245,\s*247\)/);
        expect(collectUnsafeLineHeights(clean)).toEqual([]);
        expect(WECHAT_MIN_LINE_HEIGHT_RATIO).toBe(2);
    });

    it('raises unitless or undersized line-height to at least font-size, including after fontSizeMultiplier', () => {
        const dirty = `<p style="font-size:16px;line-height:1.85;">正文</p>
<p style="font-size:16px;line-height:12px;">过小</p>
<p style="font-size:13px;color:#888;text-align:center;">无行高说明</p>
<h2 style="font-size:22px;line-height:1.3;">标题</h2>`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(collectUnsafeLineHeights(clean)).toEqual([]);
        expect(isLineHeightSafeForFontSize('16px', '32px')).toBe(true);
        expect(clean).toMatch(/font-size:16px;[^"]*line-height:32px/);
        expect(clean).toMatch(/font-size:13px;[^"]*line-height:26px/);
        expect(clean).toMatch(/font-size:22px;[^"]*line-height:44px/);

        const scaled = render(TEXT_ONLY_ARTICLE, WECHAT_THEMES.minimalist, 1.5);
        assertSafePasteHtml(scaled, 'fontSizeMultiplier 1.5 text-only');
        expect(scaled).toMatch(/font-size:24px/);
        expect(scaled).toMatch(/line-height:48px/);
        expect(WECHAT_MIN_LINE_HEIGHT_RATIO).toBe(2);
    });
});

describe('rewriteWechatStyle helpers', () => {
    it('defaults text blocks to left align and a safe line-height', () => {
        const next = rewriteWechatStyle('font-size:15px;color:#333', { tag: 'p' });
        expect(next).toMatch(/text-align:left/);
        expect(next).toMatch(/line-height:30px/);
        expect(isLineHeightSafeForFontSize('15px', '30px')).toBe(true);
    });
});

describe('WeChat paste HTML — Markdown emphasis without 着重号', () => {
    const ITALIC_MD = '*视频里的标题画面：The Legend of Trump。*';
    const UNDERSCORE_MD = '_Hey! Listen!_';
    const BOLD_ITALIC_MD = '***懂王***';

    it('renders *...*_/_..._ as span color emphasis, never em + italic + text-emphasis', () => {
        for (const theme of Object.values(WECHAT_THEMES)) {
            const html = render(ITALIC_MD, theme);
            expect(html, theme.nameEn).toContain('The Legend of Trump');
            expect(html, theme.nameEn).toContain('视频里的标题画面');
            expect(html, theme.nameEn).not.toMatch(/<(em|i)\b/i);
            expect(html, theme.nameEn).not.toMatch(/font-style\s*:\s*italic/i);
            expect(html, theme.nameEn).not.toMatch(
                /(?:-webkit-|-moz-)?text-emphasis(?:-style|-color|-position)?\s*:\s*(?!none\b)/i,
            );
            expect(html, theme.nameEn).toMatch(/<span style="[^"]*text-emphasis:none/);
            expect(html, theme.nameEn).toMatch(/<span style="[^"]*font-style:normal/);
            expect(html, theme.nameEn).toMatch(/<span style="[^"]*color:/);
            assertSafePasteHtml(html, `emphasis ${theme.nameEn}`);
        }
    });

    it('keeps Elegant Teal color on emphasis without Han.css sesame dots', () => {
        const html = render(ITALIC_MD, WECHAT_THEMES.elegant);
        expect(html).toMatch(/color:#00a7a7/);
        expect(html).not.toMatch(/filled (circle|sesame)/i);
    });

    it('maps underscore and ***bold+italic*** the same way', () => {
        const under = render(UNDERSCORE_MD);
        expect(under).toContain('Hey! Listen!');
        expect(under).not.toMatch(/<(em|i)\b/i);
        expect(under).not.toMatch(/font-style\s*:\s*italic/i);

        const both = render(BOLD_ITALIC_MD);
        expect(both).toMatch(/<strong[^>]*>[\s\S]*<span style="/);
        expect(both).toContain('懂王');
        expect(both).not.toMatch(/<(em|i)\b/i);
    });

    it('normalizeWechatEmphasisStyle drops italic and 着重号, keeps color', () => {
        const next = normalizeWechatEmphasisStyle(
            'font-style: italic; color: #00a7a7; -webkit-text-emphasis: filled circle; text-emphasis: filled circle;',
            '#333',
        );
        expect(next).toMatch(/color:#00a7a7/);
        expect(next).toMatch(/font-style:normal/);
        expect(next).toMatch(/text-emphasis:none/);
        expect(next).not.toMatch(/italic/);
        expect(next).not.toMatch(/filled circle/);
        expect(normalizeWechatEmphasisStyle('font-style: italic;', '#07c160')).toMatch(/color:#07c160/);
    });
});

describe('sanitizeWechatPasteHtml — emphasis / text-emphasis', () => {
    it('strips Han.css text-emphasis and remaps <em font-style:italic> to span', () => {
        const dirty = `<p style="font-size:16px;line-height:32px;">
<em style="font-style:italic;color:#00a7a7;-webkit-text-emphasis:filled circle;text-emphasis:filled circle;text-emphasis-position:under;">视频里的标题画面：The Legend of Trump。</em>
</p>`;
        const clean = sanitizeWechatPasteHtml(dirty);
        expect(clean).not.toMatch(/<(em|i)\b/i);
        expect(clean).not.toMatch(/font-style\s*:\s*italic/i);
        expect(clean).not.toMatch(
            /(?:-webkit-|-moz-)?text-emphasis(?:-style|-color|-position)?\s*:\s*(?!none\b)/i,
        );
        expect(clean).toMatch(/<span[^>]*>视频里的标题画面：The Legend of Trump。<\/span>/);
        expect(clean).toMatch(/color:#00a7a7/);
        expect(clean).toMatch(/text-emphasis:none/);
        assertSafePasteHtml(clean, 'han emphasis sanitize');
    });
});

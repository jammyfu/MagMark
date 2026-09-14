import { sanitizeArticleHtml } from '../security/article-html';
/**
 * MagMark — WeChat Official Account paste sanitizer
 *
 * WeChat 公众号「内容结构检测」flags paste HTML against
 * https://developers.weixin.qq.com/doc/subscription/guide/product/plugin_spec.html
 *
 * Rules this pass targets (editor labels may number them differently):
 *   #1.3 / editor #2.3.2 line-height-overlapping — computed line-height must
 *                 be ≥ font-size on any multi-line text node
 *   #1.4 width  — overflow / inconsistent centering from fixed px widths,
 *                 figure + margin:auto + percentage tricks
 *   #1.6 / editor #2.6 text-align — only left | right | center are safe;
 *                 justify / start / end / inherit / text-justify are rejected
 *   #4.1.2 darkmode-no-gradient — no CSS gradient behind text
 *
 * Also: Markdown *emphasis* must not carry Han.css / theme text-emphasis
 * (CJK 着重号 sesame/circle dots). Strip those props and remap <em>/<i>.
 *
 * Applied on the WeChat export path only (renderWechatHtml / copyWechatHtml).
 */

/** WeChat editor content column is ~677px on desktop. */
export const WECHAT_CONTENT_MAX_WIDTH_PX = 677;

/**
 * Keep readable spacing. Inline fragments must also be grouped into native
 * span[leaf] runs: increasing line-height alone cannot fix fragment counting
 * on single-line paragraphs containing bold text or links.
 */
export const WECHAT_MIN_LINE_HEIGHT_RATIO = 2;

const SAFE_TEXT_ALIGN = new Set(['left', 'right', 'center']);

/** Block / cell tags that wrap text and must carry font-size + line-height. */
const TEXT_BLOCK_TAGS = new Set([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'li', 'td', 'th', 'blockquote', 'pre', 'figcaption',
    'section', 'div', 'ul', 'ol',
]);

/** WeChat serializes omitted align as `start` — set left on these too. */
const ALIGN_TAGS = new Set([
    ...TEXT_BLOCK_TAGS,
    'a', 'strong', 'em', 'b', 'i', 'span', 'code', 'thead', 'tbody', 'tr',
]);

const VOID_OR_MEDIA = new Set(['img', 'hr', 'br', 'input', 'col', 'colgroup', 'source']);

const FIXED_WIDTH_RE = /^(-?[\d.]+)(px|pt|cm|mm|in|pc|q)$/i;

const GRADIENT_FN_RE = /(?:-webkit-)?(?:repeating-)?(?:linear|radial|conic)-gradient\(|-webkit-gradient\(/i;

const NAMED_TRANSPARENT = /^(transparent|currentcolor)$/i;

/** Han.css + WeChat both treat these as 着重号. Never keep them on paste HTML. */
const TEXT_EMPHASIS_PROPS = new Set([
    'text-emphasis',
    'text-emphasis-style',
    'text-emphasis-color',
    'text-emphasis-position',
    '-webkit-text-emphasis',
    '-webkit-text-emphasis-style',
    '-webkit-text-emphasis-color',
    '-webkit-text-emphasis-position',
    '-moz-text-emphasis',
    '-moz-text-emphasis-style',
    '-moz-text-emphasis-color',
    '-moz-text-emphasis-position',
]);

function cssPx(value: number, unit: string): number {
    const n = parseFloat(String(value));
    if (!Number.isFinite(n)) return NaN;
    switch (unit.toLowerCase()) {
        case 'px':
            return n;
        case 'pt':
            return n * (96 / 72);
        case 'pc':
            return n * 16;
        case 'in':
            return n * 96;
        case 'cm':
            return n * (96 / 2.54);
        case 'mm':
            return n * (96 / 25.4);
        case 'q':
            return n * (96 / 2.54 / 40);
        default:
            return n;
    }
}

function stripImportant(value: string): string {
    return value.replace(/!important/gi, '').trim();
}

/** Keep percentage widths ≤100%; drop fixed lengths (they trip #1.4). */
export function clampWechatWidthValue(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    if (/^auto$/i.test(value)) return null;

    const pct = value.match(/^(-?[\d.]+)%$/);
    if (pct) {
        const n = parseFloat(pct[1]);
        if (!Number.isFinite(n) || n <= 0) return null;
        return `${Math.min(n, 100)}%`;
    }

    const fixed = value.match(FIXED_WIDTH_RE);
    if (fixed) {
        // Any fixed pixel width is #1.4-unsafe (centering + overflow across viewports).
        return null;
    }

    return null;
}

function rewriteMarginWithoutAuto(value: string): string | null {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) {
        return /auto/i.test(parts[0]) ? null : value.trim();
    }
    if (parts.length === 2) {
        const [y, x] = parts;
        if (/auto/i.test(x)) return /auto/i.test(y) ? null : y;
        return value.trim();
    }
    if (parts.length === 3) {
        const [top, x, bottom] = parts;
        if (/auto/i.test(x)) return `${top} 0 ${bottom}`;
        return value.trim();
    }
    const [top, right, bottom, left] = parts;
    if (/auto/i.test(right) || /auto/i.test(left)) {
        return `${top} 0 ${bottom} 0`;
    }
    return value.trim();
}

function extractBalancedFn(value: string, start: number): { end: number; inner: string } | null {
    if (value[start] !== '(') return null;
    let depth = 0;
    for (let i = start; i < value.length; i++) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')') {
            depth--;
            if (depth === 0) return { end: i, inner: value.slice(start + 1, i) };
        }
    }
    return null;
}

/**
 * First non-transparent color inside a gradient / background shorthand.
 * Used to flatten #4.1.2 text-background gradients to a solid fill.
 */
export function firstSolidColorFromCssValue(value: string): string | null {
    const colorRe = /#(?:[0-9a-f]{3,8})\b|rgba?\(\s*[\d.]+\s*(?:,\s*[\d.]+%\s*){0,3}(?:,\s*[\d.]+\s*)?\)|rgba?\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+%?)?\s*\)|hsla?\(\s*[\d.]+(?:deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = colorRe.exec(value))) {
        const raw = m[0];
        if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*0(?:\.0+)?\s*\)$/i.test(raw)) continue;
        if (/\/\s*0(?:\.0+)?%?\s*\)$/i.test(raw)) continue;
        if (/^#(?:0000|00000000)$/i.test(raw)) continue;
        return raw;
    }
    const named = value.match(/\b([a-z]{3,})\b/gi);
    if (named) {
        for (const word of named) {
            if (NAMED_TRANSPARENT.test(word)) continue;
            if (/^(to|from|at|in|left|right|top|bottom|center|circle|ellipse|closest|farthest|side|corner|repeat|px|em|rem|deg|turn|rad|grad)$/i.test(word)) continue;
            return word;
        }
    }
    return null;
}

/** Replace every CSS gradient function with a solid color (or drop the token). */
export function flattenCssGradients(value: string): string {
    let out = value;
    const marker = /(?:-webkit-)?(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(|-webkit-gradient\s*\(/ig;
    let m: RegExpExecArray | null;
    const replacements: Array<{ start: number; end: number; next: string }> = [];
    while ((m = marker.exec(out))) {
        const open = m.index + m[0].length - 1;
        const balanced = extractBalancedFn(out, open);
        if (!balanced) break;
        const full = out.slice(m.index, balanced.end + 1);
        const solid = firstSolidColorFromCssValue(full);
        replacements.push({ start: m.index, end: balanced.end + 1, next: solid || '' });
        marker.lastIndex = balanced.end + 1;
    }
    for (let i = replacements.length - 1; i >= 0; i--) {
        const r = replacements[i];
        out = out.slice(0, r.start) + r.next + out.slice(r.end);
    }
    return out.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').replace(/\s+/g, ' ').trim();
}

function rewriteBackgroundWithoutGradient(prop: string, value: string): { prop: string; value: string } | null {
    if (!GRADIENT_FN_RE.test(value)) return { prop, value };
    const flattened = flattenCssGradients(value);
    const solid = firstSolidColorFromCssValue(value) || firstSolidColorFromCssValue(flattened);
    if (prop === 'background-image') {
        return solid ? { prop: 'background-color', value: solid } : null;
    }
    if (prop === 'background' || prop === 'background-color') {
        return solid ? { prop: 'background', value: solid } : null;
    }
    return flattened ? { prop, value: flattened } : null;
}

export function parseFontSizePx(raw: string | undefined | null): number | null {
    if (!raw) return null;
    const value = stripImportant(raw);
    const m = value.match(/^(-?[\d.]+)(px|pt|pc|in|cm|mm|q|em|rem)$/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    const unit = m[2].toLowerCase();
    if (unit === 'em' || unit === 'rem') return n * 16;
    const px = cssPx(n, unit);
    return Number.isFinite(px) && px > 0 ? px : null;
}

export interface ParsedLineHeight {
    px: number | null;
    ratio: number | null;
}

/** Resolve line-height against an optional font-size (px). */
export function parseLineHeight(raw: string | undefined | null, fontSizePx: number | null): ParsedLineHeight {
    if (!raw) return { px: null, ratio: null };
    const value = stripImportant(raw).toLowerCase();
    if (!value || /^(normal|inherit|initial|unset|revert)$/i.test(value)) {
        return { px: null, ratio: null };
    }
    const m = value.match(/^(-?[\d.]+)(px|pt|pc|in|cm|mm|q|em|rem|%)?$/i);
    if (!m) return { px: null, ratio: null };
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n) || n < 0) return { px: null, ratio: null };
    const unit = (m[2] || '').toLowerCase();
    if (!unit) {
        return { px: fontSizePx != null ? n * fontSizePx : null, ratio: n };
    }
    if (unit === 'em' || unit === 'rem') {
        return { px: fontSizePx != null ? n * fontSizePx : null, ratio: n };
    }
    if (unit === '%') {
        return { px: fontSizePx != null ? (n / 100) * fontSizePx : null, ratio: n / 100 };
    }
    const px = cssPx(n, unit);
    return {
        px: Number.isFinite(px) ? px : null,
        ratio: fontSizePx ? px / fontSizePx : null,
    };
}

/**
 * Pick a WeChat-safe line-height declaration.
 * Official checker (#2.3.2): multi-line text with computed lh < 0.95×font-size.
 * WeChat paste often rewrites unitless `1.85` as `1.85px`, so emit explicit px
 * when font-size is known, otherwise `1.6em`.
 */
export function safeLineHeightDeclaration(
    fontSizeRaw: string | undefined,
    lineHeightRaw: string | undefined,
    opts: { textBlock?: boolean } = {},
): string | null {
    const fontPx = parseFontSizePx(fontSizeRaw);
    const parsed = parseLineHeight(lineHeightRaw, fontPx);

    if (fontPx) {
        const ratio = parsed.ratio;
        const px = parsed.px;
        const usable = (px != null && px >= fontPx) || (ratio != null && ratio >= 1);
        const useRatio = usable && ratio != null && ratio >= 1
            ? Math.max(ratio, WECHAT_MIN_LINE_HEIGHT_RATIO)
            : WECHAT_MIN_LINE_HEIGHT_RATIO;
        const nextPx = Math.max(fontPx, Math.round(fontPx * useRatio * 100) / 100);
        return `${nextPx}px`;
    }

    if (opts.textBlock) {
        if (parsed.ratio != null && parsed.ratio >= 1) return `${parsed.ratio}em`;
        return `${WECHAT_MIN_LINE_HEIGHT_RATIO}em`;
    }

    if (parsed.ratio != null && parsed.ratio > 0 && parsed.ratio < 1) {
        return `${WECHAT_MIN_LINE_HEIGHT_RATIO}em`;
    }
    if (parsed.px != null && parsed.px > 0 && parsed.px < 16) {
        return `${WECHAT_MIN_LINE_HEIGHT_RATIO}em`;
    }
    if (parsed.ratio != null && parsed.ratio >= 1) return `${parsed.ratio}em`;
    return lineHeightRaw ? stripImportant(lineHeightRaw) : null;
}

export function isLineHeightSafeForFontSize(fontSizeRaw: string, lineHeightRaw: string): boolean {
    const fontPx = parseFontSizePx(fontSizeRaw);
    if (!fontPx) return true;
    const parsed = parseLineHeight(lineHeightRaw, fontPx);
    return parsed.px != null && parsed.px >= fontPx;
}

export interface RewriteWechatStyleOptions {
    isImg?: boolean;
    tag?: string;
}

/**
 * Rewrite one inline style string to WeChat-safe declarations.
 */
export function rewriteWechatStyle(
    style: string,
    opts: RewriteWechatStyleOptions = {},
): string {
    const tag = (opts.tag || (opts.isImg ? 'img' : '')).toLowerCase();
    const isImg = opts.isImg || tag === 'img';
    const isTextBlock = TEXT_BLOCK_TAGS.has(tag);
    const decls = style.split(';').map((s) => s.trim()).filter(Boolean);
    const map = new Map<string, string>();

    for (const decl of decls) {
        const colon = decl.indexOf(':');
        if (colon < 0) continue;
        const prop = decl.slice(0, colon).trim().toLowerCase();
        const value = stripImportant(decl.slice(colon + 1).trim()).replace(/"/g, "'");
        if (!prop || !value) continue;

        if (prop === 'font-family' || prop === 'text-justify' || prop === 'text-align-last') {
            map.delete(prop);
            continue;
        }

        if (TEXT_EMPHASIS_PROPS.has(prop)) {
            map.delete(prop);
            continue;
        }

        if ((tag === 'em' || tag === 'i' || tag === 'span') && prop === 'font-style' && /^italic$/i.test(value)) {
            map.delete(prop);
            continue;
        }

        if (prop === 'text-align') {
            const align = value.toLowerCase().split(/\s+/)[0];
            if (SAFE_TEXT_ALIGN.has(align)) map.set('text-align', align);
            else map.delete('text-align');
            continue;
        }

        if (prop === 'width' || prop === 'min-width') {
            const clamped = clampWechatWidthValue(value);
            if (clamped) map.set(prop, clamped);
            else map.delete(prop);
            continue;
        }

        if (prop === 'max-width') {
            const pct = value.match(/^(-?[\d.]+)%$/);
            if (pct) {
                const n = parseFloat(pct[1]);
                if (Number.isFinite(n) && n > 0) map.set('max-width', `${Math.min(n, 100)}%`);
                continue;
            }
            const fixed = value.match(FIXED_WIDTH_RE);
            if (fixed) {
                const px = cssPx(parseFloat(fixed[1]), fixed[2]);
                map.set(
                    'max-width',
                    Number.isFinite(px) && px <= WECHAT_CONTENT_MAX_WIDTH_PX ? value : '100%',
                );
            }
            continue;
        }

        if (prop === 'display' && /^block$/i.test(value)) {
            map.delete('display');
            continue;
        }

        if (isImg && (prop === 'margin' || prop === 'margin-left' || prop === 'margin-right')) {
            if (prop === 'margin-left' || prop === 'margin-right') {
                if (/auto/i.test(value)) map.delete(prop);
                else map.set(prop, value);
                continue;
            }
            const rewritten = rewriteMarginWithoutAuto(value);
            if (rewritten) map.set('margin', rewritten);
            else map.delete('margin');
            continue;
        }

        if (prop === 'background' || prop === 'background-image' || prop === 'background-color') {
            const next = rewriteBackgroundWithoutGradient(prop, value);
            if (!next) {
                map.delete(prop);
                continue;
            }
            if (next.prop !== prop) map.delete(prop);
            map.set(next.prop, next.value);
            continue;
        }

        if (GRADIENT_FN_RE.test(value)) {
            const flattened = flattenCssGradients(value);
            if (flattened) map.set(prop, flattened);
            else map.delete(prop);
            continue;
        }

        map.set(prop, value);
    }

    if (isImg && !map.has('max-width')) map.set('max-width', '100%');
    if (isImg && !map.has('width')) map.set('width', '100%');

    if (tag === 'table') {
        map.set('width', '100%');
        map.set('max-width', '100%');
        map.set('table-layout', 'fixed');
        map.set('border-collapse', 'collapse');
        map.set('box-sizing', 'border-box');
    }
    if (tag === 'td' || tag === 'th') {
        map.set('white-space', 'normal');
        map.set('word-break', 'normal');
        map.set('overflow-wrap', 'anywhere');
        map.set('padding', '8px');
        map.set('vertical-align', 'top');
        map.set('box-sizing', 'border-box');
    }
    if (/^h[1-6]$/.test(tag)) {
        map.set('white-space', 'normal');
        map.set('word-break', 'normal');
        map.set('overflow-wrap', 'break-word');
        map.set('line-break', 'strict');
    }

    if (isTextBlock && !map.has('font-size') && !isImg) {
        map.set('font-size', '16px');
    }

    const needsLineHeight = isTextBlock || ALIGN_TAGS.has(tag);
    const safeLh = safeLineHeightDeclaration(map.get('font-size'), map.get('line-height'), {
        textBlock: needsLineHeight,
    });
    if (safeLh) map.set('line-height', safeLh);
    else if (needsLineHeight && !map.has('line-height') && !isImg) {
        map.set('line-height', `${WECHAT_MIN_LINE_HEIGHT_RATIO}em`);
    }

    if (ALIGN_TAGS.has(tag) && !map.has('text-align')) {
        map.set('text-align', 'left');
    }

    if (tag === 'em' || tag === 'i' || tag === 'span') {
        map.set('font-style', 'normal');
        map.set('text-emphasis', 'none');
        map.set('-webkit-text-emphasis', 'none');
    }

    return [...map.entries()].map(([prop, value]) => `${prop}:${value}`).join(';');
}

/**
 * Markdown *emphasis* look for WeChat: color / underline, never italic or 着重号.
 * Han.css `em:lang(zh)` and the Official Account editor both remap italic/em to dots.
 */
export function normalizeWechatEmphasisStyle(style: string, fallbackColor?: string): string {
    const decls = style.split(';').map((s) => s.trim()).filter(Boolean);
    const map = new Map<string, string>();
    for (const decl of decls) {
        const colon = decl.indexOf(':');
        if (colon < 0) continue;
        const prop = decl.slice(0, colon).trim().toLowerCase();
        const value = stripImportant(decl.slice(colon + 1).trim()).replace(/"/g, "'");
        if (!prop || !value) continue;
        if (TEXT_EMPHASIS_PROPS.has(prop)) continue;
        if (prop === 'font-style' && /^italic$/i.test(value)) continue;
        map.set(prop, value);
    }
    if (!map.has('color') && fallbackColor) map.set('color', fallbackColor);
    map.set('font-style', 'normal');
    map.set('text-emphasis', 'none');
    map.set('-webkit-text-emphasis', 'none');
    return [...map.entries()].map(([prop, value]) => `${prop}:${value}`).join(';');
}

/** Remap <em>/<i> to <span> so Han.css `em:lang(zh)` and WeChat em-semantics cannot add 着重号. */
function rewriteEmphasisTags(html: string): string {
    return html
        .replace(/<(em|i)\b([^>]*)>/gi, (_full, _tag: string, attrs: string) => {
            let next = attrs;
            if (/\sstyle\s*=/i.test(next)) {
                next = next.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m: string, style: string) => {
                    const rewritten = normalizeWechatEmphasisStyle(style);
                    return rewritten ? ` style="${rewritten}"` : '';
                });
            } else {
                next += ` style="${normalizeWechatEmphasisStyle('')}"`;
            }
            return `<span${next}>`;
        })
        .replace(/<\/(em|i)>/gi, '</span>');
}

function rewriteStyleAttrs(html: string): string {
    return html.replace(/<([a-zA-Z][\w:-]*)([^>]*?)>/g, (_full, tag: string, attrs: string) => {
        const tagName = tag.toLowerCase();
        const isImg = tagName === 'img';
        let nextAttrs = attrs.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m: string, style: string) => {
            const rewritten = rewriteWechatStyle(style, { isImg, tag: tagName });
            return rewritten ? ` style="${rewritten}"` : '';
        });
        nextAttrs = nextAttrs.replace(/\salign\s*=\s*(["']?)([^"'>\s]+)\1/gi, (_m: string, _q: string, raw: string) => {
            const align = raw.toLowerCase();
            return SAFE_TEXT_ALIGN.has(align) ? ` align="${align}"` : '';
        });
        if ((TEXT_BLOCK_TAGS.has(tagName) || ALIGN_TAGS.has(tagName)) && !/\sstyle\s*=/i.test(nextAttrs) && !VOID_OR_MEDIA.has(tagName)) {
            nextAttrs += ` style="${rewriteWechatStyle('', { tag: tagName })}"`;
        }
        if ((tagName === 'img' || tagName === 'table') && !/data-ignore-width/i.test(nextAttrs)) {
            nextAttrs += ' data-ignore-width=""';
        }
        return `<${tag}${nextAttrs}>`;
    });
}

function stripOversizedImgDimensions(html: string): string {
    return html.replace(/<img\b([^>]*)>/gi, (_full, attrs: string) => {
        let next = attrs.replace(/\s(width|height)\s*=\s*(["']?)(\d+)\2/gi, (m: string, name: string, _q: string, raw: string) => {
            const n = parseInt(raw, 10);
            if (name.toLowerCase() === 'width' && n > WECHAT_CONTENT_MAX_WIDTH_PX) return '';
            return m;
        });
        if (!/\sstyle\s*=/i.test(next)) {
            next += ' style="max-width:100%;width:100%"';
        }
        return `<img${next}>`;
    });
}

function rewriteFigures(html: string): string {
    return html.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_full, inner: string) => {
        const imgMatch = String(inner).match(/<img\b[^>]*>/i);
        const img = imgMatch ? imgMatch[0] : '';
        const captionMatch = String(inner).match(
            /<(?:p|figcaption)\b[^>]*>([\s\S]*?)<\/(?:p|figcaption)>/i,
        );
        const caption = captionMatch ? captionMatch[1].trim() : '';
        if (!img) return String(inner).trim();
        let out = `<p data-ignore-width="" style="text-align:center;margin:20px 0;">${img}</p>`;
        if (caption) {
            out += `<p style="text-align:center;font-size:13px;line-height:26px;color:#888;margin:8px 0 0;">${caption}</p>`;
        }
        return out;
    });
}

function eachStyleAttr(html: string, visit: (style: string, tag?: string) => void): void {
    const re = /<([a-zA-Z][\w:-]*)([^>]*?)\sstyle\s*=\s*"([^"]*)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) visit(m[3], m[1].toLowerCase());
}

function getDecl(style: string, prop: string): string | null {
    const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
    const m = style.match(re);
    return m ? m[1].trim() : null;
}

/** Collect every text-align value from inline style attributes. */
export function collectTextAlignValues(html: string): string[] {
    const values: string[] = [];
    eachStyleAttr(html, (style) => {
        const re = /(?:^|;)\s*text-align\s*:\s*([^;]+)/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(style))) {
            values.push(m[1].trim().toLowerCase().split(/\s+/)[0]);
        }
    });
    return values;
}

/** Collect CSS / HTML widths that are fixed pixels larger than the content column. */
export function collectOversizedWidths(html: string): number[] {
    const found: number[] = [];
    eachStyleAttr(html, (style) => {
        const styleRe = /(?:max-)?width\s*:\s*([\d.]+)(px|pt|cm|mm|in|pc)/gi;
        let m: RegExpExecArray | null;
        while ((m = styleRe.exec(style))) {
            const px = cssPx(parseFloat(m[1]), m[2]);
            if (Number.isFinite(px) && px > WECHAT_CONTENT_MAX_WIDTH_PX) found.push(px);
        }
    });
    const attrRe = /<(?:img|table|section|div|p)\b[^>]*\bwidth\s*=\s*["']?(\d+)/gi;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(html))) {
        const px = parseInt(m[1], 10);
        if (px > WECHAT_CONTENT_MAX_WIDTH_PX) found.push(px);
    }
    return found;
}

/** True when any inline style still contains a CSS gradient. */
export function collectGradientValues(html: string): string[] {
    const found: string[] = [];
    eachStyleAttr(html, (style) => {
        if (GRADIENT_FN_RE.test(style)) found.push(style);
    });
    return found;
}

export interface UnsafeLineHeightHit {
    tag: string;
    fontSize: string | null;
    lineHeight: string | null;
}

/**
 * Text-bearing inline styles whose line-height would fail #2.3.2
 * (missing, or computed px < font-size).
 */
export function collectUnsafeLineHeights(html: string): UnsafeLineHeightHit[] {
    const hits: UnsafeLineHeightHit[] = [];
    eachStyleAttr(html, (style, tag) => {
        const fontSize = getDecl(style, 'font-size');
        const lineHeight = getDecl(style, 'line-height');
        const isText = TEXT_BLOCK_TAGS.has(tag || '');
        if (!isText && !fontSize) return;
        if (!lineHeight) {
            if (isText || fontSize) hits.push({ tag: tag || '?', fontSize, lineHeight });
            return;
        }
        if (fontSize && !isLineHeightSafeForFontSize(fontSize, lineHeight)) {
            hits.push({ tag: tag || '?', fontSize, lineHeight });
        }
        if (!fontSize && isText) {
            const parsed = parseLineHeight(lineHeight, null);
            if (parsed.ratio == null || parsed.ratio < 1) {
                hits.push({ tag: tag || '?', fontSize, lineHeight });
            }
        }
    });
    return hits;
}

/**
 * Strip / rewrite WeChat-forbidden styles in generated paste HTML.
 */
export function sanitizeWechatPasteHtml(html: string): string {
    let out = sanitizeArticleHtml(html);
    out = rewriteFigures(out);
    out = rewriteEmphasisTags(out);
    out = rewriteStyleAttrs(out);
    out = stripOversizedImgDimensions(out);
    out = out.replace(/text-justify\s*:\s*[^;"]+;?/gi, '');
    out = out.replace(/(?:-webkit-|-moz-)?text-emphasis(?:-style|-color|-position)?\s*:\s*(?!none\b)[^;"]+;?/gi, '');
    out = out.replace(/\sstyle="\s*"/g, '');
    out = wrapWechatTextBlocks(out);
    return out;
}

/** Native text runs keep inline marks together when WeChat parses and saves HTML. */
function wrapWechatTextBlocks(html: string): string {
    return html.replace(/<(p|h[1-6]|td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, tag: string, attrs: string, inner: string) => {
            if (!inner.replace(/<[^>]*>/g, '').trim()) return full;
            if (/<(?:p|div|section|blockquote|pre|table|ul|ol|li|h[1-6])\b/i.test(inner)) return full;
            if (/^\s*<span\b[^>]*\sleaf\s*=/.test(inner) && /<\/span>\s*$/.test(inner)) return full;
            const style = attrs.match(/\sstyle="([^"]*)"/i)?.[1] || '';
            const textProps = new Set(['color', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-decoration']);
            const textStyle = style.split(';').filter(decl => textProps.has(decl.split(':')[0].trim())).join(';');
            return `<${tag}${attrs}><span leaf="" style="${textStyle}">${inner}</span></${tag}>`;
        });
}

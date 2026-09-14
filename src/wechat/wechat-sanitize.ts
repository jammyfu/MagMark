/**
 * MagMark — WeChat Official Account paste sanitizer
 *
 * WeChat 公众号「内容结构检测」flags paste HTML against
 * https://developers.weixin.qq.com/doc/subscription/guide/product/plugin_spec.html
 *
 * Rules this pass targets (editor labels may number them differently):
 *   #1.4 width  — overflow / inconsistent centering from fixed px widths,
 *                 figure + margin:auto + percentage tricks
 *   #1.6 / editor #2.6 text-align — only left | right | center are safe;
 *                 justify / start / end / text-justify are rejected
 *
 * Applied on the WeChat export path only (renderWechatHtml / copyWechatHtml).
 */

/** WeChat editor content column is ~677px on desktop. */
export const WECHAT_CONTENT_MAX_WIDTH_PX = 677;

const SAFE_TEXT_ALIGN = new Set(['left', 'right', 'center']);

const FIXED_WIDTH_RE = /^(-?[\d.]+)(px|pt|cm|mm|in|pc|q)$/i;

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

export interface RewriteWechatStyleOptions {
    isImg?: boolean;
}

/**
 * Rewrite one inline style string to WeChat-safe declarations.
 */
export function rewriteWechatStyle(
    style: string,
    opts: RewriteWechatStyleOptions = {},
): string {
    const decls = style.split(';').map((s) => s.trim()).filter(Boolean);
    const map = new Map<string, string>();

    for (const decl of decls) {
        const colon = decl.indexOf(':');
        if (colon < 0) continue;
        const prop = decl.slice(0, colon).trim().toLowerCase();
        const value = decl.slice(colon + 1).trim();
        if (!prop || !value) continue;

        if (prop === 'text-justify') {
            map.delete('text-justify');
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

        if (opts.isImg && prop === 'display' && /^block$/i.test(value)) {
            map.delete('display');
            continue;
        }

        if (opts.isImg && (prop === 'margin' || prop === 'margin-left' || prop === 'margin-right')) {
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

        map.set(prop, value);
    }

    if (opts.isImg && !map.has('max-width')) map.set('max-width', '100%');

    return [...map.entries()].map(([prop, value]) => `${prop}:${value}`).join(';');
}

function rewriteStyleAttrs(html: string): string {
    return html.replace(/<([a-zA-Z][\w:-]*)([^>]*?)>/g, (_full, tag: string, attrs: string) => {
        const isImg = tag.toLowerCase() === 'img';
        const nextAttrs = attrs.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m: string, style: string) => {
            const rewritten = rewriteWechatStyle(style, { isImg });
            return rewritten ? ` style="${rewritten}"` : '';
        });
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
            next += ' style="max-width:100%"';
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
        let out = `<p style="text-align:center;margin:20px 0;">${img}</p>`;
        if (caption) {
            out += `<p style="text-align:center;font-size:13px;color:#888;margin:8px 0 0;">${caption}</p>`;
        }
        return out;
    });
}

function eachStyleAttr(html: string, visit: (style: string) => void): void {
    const re = /\sstyle\s*=\s*"([^"]*)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) visit(m[1]);
}

/** Collect every text-align value from inline style attributes. */
export function collectTextAlignValues(html: string): string[] {
    const values: string[] = [];
    eachStyleAttr(html, (style) => {
        const re = /text-align\s*:\s*([^;]+)/gi;
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

/**
 * Strip / rewrite WeChat-forbidden styles in generated paste HTML.
 */
export function sanitizeWechatPasteHtml(html: string): string {
    let out = html;
    out = rewriteFigures(out);
    out = rewriteStyleAttrs(out);
    out = stripOversizedImgDimensions(out);
    out = out.replace(/text-justify\s*:\s*[^;"]+;?/gi, '');
    out = out.replace(/\sstyle="\s*"/g, '');
    return out;
}

/**
 * MagMark — WeChat (公众号) Renderer
 *
 * 将 Markdown 转换为带内联 CSS 样式的 HTML，
 * 可直接复制粘贴到微信公众号后台，保留完整排版效果。
 */

import { WechatTheme, WechatThemeStyles } from './wechat-themes';

/** 将 CSS 字符串注入到元素的 style 属性前，合并字体设置 */
function applyStyle(cssStr: string, fontFamily: string, fontSizeMultiplier = 1): string {
    if (!cssStr) return `font-family: ${fontFamily};`;
    // 应用字号倍率
    if (fontSizeMultiplier !== 1) {
        cssStr = cssStr.replace(/font-size:\s*([\d.]+)px/g, (_, n) => {
            return `font-size: ${Math.round(parseFloat(n) * fontSizeMultiplier)}px`;
        });
    }
    // 注入字体（如果 cssStr 没有 font-family，或者用户选择了非默认字体）
    if (!cssStr.includes('font-family')) {
        return `font-family: ${fontFamily}; ${cssStr}`;
    }
    return cssStr;
}

/** 转义 HTML 特殊字符 */
function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 转义属性值 */
function escAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 内联 Markdown 转 HTML（粗体、斜体、代码、链接、图片、删除线） */
function inlineMd(text: string, styles: WechatThemeStyles, font: string, mult: number): string {
    if (!text) return '';
    return text
        // 图片
        .replace(/!\[([^\]]*)\]\(([^)"]+)(?:\s+"[^"]*")?\)/g,
            (_, alt, src) => `<img src="${escAttr(src)}" alt="${escAttr(alt)}" style="${applyStyle(styles.img, font, mult)}" referrerpolicy="no-referrer">`)
        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            (_, label, href) => `<a href="${escAttr(href)}" style="${applyStyle(styles.a, font, mult)}">${escHtml(label)}</a>`)
        // 行内代码
        .replace(/`([^`]+)`/g,
            (_, code) => `<code style="${applyStyle(styles.code, font, mult)}">${escHtml(code)}</code>`)
        // 粗体+斜体
        .replace(/\*{3}(.+?)\*{3}/g,
            (_, t) => `<strong style="${applyStyle(styles.strong, font, mult)}"><em style="${applyStyle(styles.em, font, mult)}">${t}</em></strong>`)
        // 粗体
        .replace(/\*\*(.+?)\*\*/g,
            (_, t) => `<strong style="${applyStyle(styles.strong, font, mult)}">${t}</strong>`)
        .replace(/__(.+?)__/g,
            (_, t) => `<strong style="${applyStyle(styles.strong, font, mult)}">${t}</strong>`)
        // 斜体
        .replace(/\*(.+?)\*/g,
            (_, t) => `<em style="${applyStyle(styles.em, font, mult)}">${t}</em>`)
        .replace(/_([^_]+)_/g,
            (_, t) => `<em style="${applyStyle(styles.em, font, mult)}">${t}</em>`)
        // 删除线
        .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

export interface WechatRenderOptions {
    theme: WechatTheme;
    fontFamily: string;
    fontSizeMultiplier: number;
    /** 图片 blob store 的解析函数（兼容 MagMark 的 mm-img:// 协议） */
    resolveImageSrc?: (src: string) => string;
}

/**
 * 将 Markdown 文本渲染为带完整内联样式的微信公众号 HTML。
 *
 * 支持的 Markdown 语法：
 *   - 标题 H1–H3
 *   - 段落、粗体、斜体、行内代码
 *   - 有序/无序列表（支持嵌套）
 *   - 引用块
 *   - 分隔线
 *   - 代码块（围栏 ``` ）
 *   - 表格（GFM）
 *   - 图片（块级和内联）
 *   - 链接
 */
export function renderWechatHtml(md: string, opts: WechatRenderOptions): string {
    const { theme, fontFamily, fontSizeMultiplier, resolveImageSrc } = opts;
    const s = theme.styles;
    const font = fontFamily;
    const mult = fontSizeMultiplier;
    const resolve = resolveImageSrc || ((src: string) => src);

    // 预处理：去掉 YAML frontmatter
    const strippedMd = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const lines = strippedMd.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    let i = 0;

    const isBlank = (l: string) => l.trim() === '';
    const isHr = (l: string) => /^(\*{3,}|-{3,}|_{3,})\s*$/.test(l.trim());
    const isHeading = (l: string) => /^#{1,6} /.test(l);
    const isFence = (l: string) => l.startsWith('```') || l.startsWith('~~~');
    const isQuote = (l: string) => l.startsWith('>');
    const isTable = (l: string) => l.startsWith('|');
    const isUlItem = (l: string) => /^(\s*)[-*+] /.test(l);
    const isOlItem = (l: string) => /^(\s*)\d+\. /.test(l);
    const isListItem = (l: string) => isUlItem(l) || isOlItem(l);
    const isFigureLine = (l: string) => /^\s*!\[[^\]]*\]\([^)]+\)(\{[^}]*\})?\s*$/.test(l);
    const isBlockStop = (l: string) =>
        isBlank(l) || isHeading(l) || isFence(l) || isQuote(l) ||
        isTable(l) || isListItem(l) || isHr(l) || isFigureLine(l);

    // ── 围栏代码块 ──────────────────────────────────
    function parseFence(): string {
        const opener = lines[i];
        const fence = opener.startsWith('~~~') ? '~~~' : '```';
        const lang = opener.slice(fence.length).trim().split(/\s+/)[0] || '';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trimEnd().startsWith(fence)) {
            codeLines.push(escHtml(lines[i]));
            i++;
        }
        i++; // 跳过 closing fence
        const langAttr = lang ? ` data-lang="${escAttr(lang)}"` : '';
        return `<pre style="${applyStyle(s.pre, font, mult)}"${langAttr}><code>${codeLines.join('\n')}</code></pre>`;
    }

    // ── 引用块 ──────────────────────────────────────
    function parseBlockquote(): string {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('>')) {
            quoteLines.push(lines[i].replace(/^>\s?/, ''));
            i++;
        }
        // 递归处理内部内容
        const inner = quoteLines.map(l => inlineMd(l, s, font, mult)).join('<br>');
        return `<blockquote style="${applyStyle(s.blockquote, font, mult)}"><p style="${applyStyle(s.p, font, mult)}">${inner}</p></blockquote>`;
    }

    // ── 表格 ────────────────────────────────────────
    function parseTable(): string {
        const tableLines: string[] = [];
        while (i < lines.length && isTable(lines[i])) {
            tableLines.push(lines[i]);
            i++;
        }
        if (tableLines.length < 2) {
            return `<p style="${applyStyle(s.p, font, mult)}">${tableLines.map(l => inlineMd(l, s, font, mult)).join('<br>')}</p>`;
        }
        const parseCells = (row: string) =>
            row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const headerCells = parseCells(tableLines[0]);
        const sepCells = parseCells(tableLines[1]);
        const aligns = sepCells.map(sep => {
            const t = sep.trim();
            if (t.startsWith(':') && t.endsWith(':')) return 'center';
            if (t.endsWith(':')) return 'right';
            return 'left';
        });
        const dataRows = tableLines.slice(2);
        const alignAttr = (idx: number) => {
            const a = aligns[idx];
            return a && a !== 'left' ? `text-align:${a};` : '';
        };
        const headBg = s.thead ? `style="${s.thead}"` : '';
        const thead = `<thead ${headBg}><tr>${headerCells.map((c, j) =>
            `<th style="${alignAttr(j)}${applyStyle(s.th, font, mult)}">${inlineMd(c, s, font, mult)}</th>`
        ).join('')}</tr></thead>`;
        const tbody = dataRows.length
            ? `<tbody style="${s.tbody || ''}">${dataRows.map(row =>
                `<tr>${parseCells(row).map((c, j) =>
                    `<td style="${alignAttr(j)}${applyStyle(s.td, font, mult)}">${inlineMd(c, s, font, mult)}</td>`
                ).join('')}</tr>`
            ).join('')}</tbody>`
            : '';
        return `<table style="${applyStyle(s.table, font, mult)}">${thead}${tbody}</table>`;
    }

    // ── 列表 ────────────────────────────────────────
    function parseList(ordered: boolean): string {
        const getIndent = (l: string) => l.match(/^(\s*)/)?.[1].length ?? 0;
        function buildItems(minIndent: number, _ordered: boolean): string {
            let html = '';
            while (i < lines.length) {
                const line = lines[i];
                if (isBlank(line)) { i++; continue; }
                if (!isListItem(line)) break;
                const indent = getIndent(line);
                if (indent < minIndent) break;
                const ulMatch = line.match(/^\s*[-*+] (\[[ x]\] )?(.*)$/);
                const olMatch = line.match(/^\s*\d+\. (.*)$/);
                if (!ulMatch && !olMatch) break;
                let content = ulMatch ? ulMatch[2] : olMatch![1];
                if (ulMatch && ulMatch[1]) {
                    const checked = ulMatch[1].includes('x');
                    content = `<input type="checkbox" ${checked ? 'checked' : ''} disabled> ${inlineMd(content, s, font, mult)}`;
                } else {
                    content = inlineMd(content, s, font, mult);
                }
                i++;
                let nested = '';
                if (i < lines.length && isListItem(lines[i])) {
                    const nextIndent = getIndent(lines[i]);
                    if (nextIndent > indent) {
                        const nextIsOl = isOlItem(lines[i]);
                        const tag = nextIsOl ? 'ol' : 'ul';
                        const nestedStyle = nextIsOl ? applyStyle(s.ol, font, mult) : applyStyle(s.ul, font, mult);
                        nested = `<${tag} style="${nestedStyle}">${buildItems(nextIndent, nextIsOl)}</${tag}>`;
                    }
                }
                html += `<li style="${applyStyle(s.li, font, mult)}">${content}${nested}</li>`;
            }
            return html;
        }
        const baseIndent = getIndent(lines[i]);
        const inner = buildItems(baseIndent, ordered);
        const tag = ordered ? 'ol' : 'ul';
        const listStyle = ordered ? applyStyle(s.ol, font, mult) : applyStyle(s.ul, font, mult);
        return `<${tag} style="${listStyle}">${inner}</${tag}>`;
    }

    // ── 独立图片行 → 块级 ───────────────────────────
    function parseFigureLine(): string {
        const line = lines[i].trim();
        i++;
        const match = line.match(/^!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/);
        if (!match) return `<p style="${applyStyle(s.p, font, mult)}">${inlineMd(line, s, font, mult)}</p>`;
        const [, alt, src, title] = match;
        const resolvedSrc = resolve(src);
        const titleAttr = title ? ` title="${escAttr(title)}"` : '';
        const altText = alt && !alt.startsWith('mm-img://') ? alt : '';
        const caption = altText ? `<p style="text-align:center;font-size:13px;color:#888;margin:8px 0 0;">${escHtml(altText)}</p>` : '';
        return `<figure style="margin:20px 0;text-align:center;"><img src="${escAttr(resolvedSrc)}" alt="${escAttr(alt)}"${titleAttr} style="${applyStyle(s.img, font, mult)}" referrerpolicy="no-referrer">${caption}</figure>`;
    }

    // ── 段落 ────────────────────────────────────────
    function parseParagraph(): string {
        const paraLines: string[] = [];
        while (i < lines.length && !isBlockStop(lines[i])) {
            paraLines.push(inlineMd(lines[i], s, font, mult));
            i++;
        }
        if (!paraLines.length) return '';
        return `<p style="${applyStyle(s.p, font, mult)}">${paraLines.join('<br>')}</p>`;
    }

    // ── 主循环 ───────────────────────────────────────
    while (i < lines.length) {
        const line = lines[i];
        if (isBlank(line)) { i++; continue; }
        if (isFence(line)) { blocks.push(parseFence()); continue; }
        if (isHr(line)) {
            blocks.push(`<hr style="${applyStyle(s.hr, font, mult)}">`);
            i++;
            continue;
        }
        // 标题
        const hm = line.match(/^(#{1,6}) (.+)$/);
        if (hm) {
            const level = hm[1].length as 1 | 2 | 3;
            const tagLevel = Math.min(level, 3) as 1 | 2 | 3;
            const hStyle = level === 1 ? s.h1 : level === 2 ? s.h2 : s.h3;
            blocks.push(`<h${tagLevel} style="${applyStyle(hStyle, font, mult)}">${inlineMd(hm[2], s, font, mult)}</h${tagLevel}>`);
            i++;
            continue;
        }
        if (isQuote(line)) { blocks.push(parseBlockquote()); continue; }
        if (isTable(line)) { blocks.push(parseTable()); continue; }
        if (isUlItem(line)) { blocks.push(parseList(false)); continue; }
        if (isOlItem(line)) { blocks.push(parseList(true)); continue; }
        if (isFigureLine(line)) { blocks.push(parseFigureLine()); continue; }
        const para = parseParagraph();
        if (para) blocks.push(para);
    }

    // 包裹容器
    const containerStyle = applyStyle(s.container || 'background-color:#ffffff;color:#333;padding:20px;', font, mult);
    return `<section style="${containerStyle}">${blocks.join('\n')}</section>`;
}

/**
 * 将 renderWechatHtml 输出的 HTML 写入剪贴板（富文本格式）。
 * 可直接粘贴到微信公众号后台，保留所有内联样式。
 */
export async function copyWechatHtml(html: string): Promise<boolean> {
    // 现代 API
    try {
        if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([html.replace(/<[^>]+>/g, '').trim()], { type: 'text/plain' }),
                }),
            ]);
            return true;
        }
    } catch { /* 降级 */ }

    // 降级：execCommand
    const holder = document.createElement('div');
    holder.contentEditable = 'true';
    Object.assign(holder.style, {
        position: 'fixed', left: '-9999px', top: '0',
        whiteSpace: 'pre-wrap', userSelect: 'text',
    });
    holder.innerHTML = html;
    document.body.appendChild(holder);
    holder.focus();
    const range = document.createRange();
    range.selectNodeContents(holder);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    let ok = false;
    const onCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        e.clipboardData?.setData('text/html', html);
        e.clipboardData?.setData('text/plain', html.replace(/<[^>]+>/g, '').trim());
        ok = true;
    };
    document.addEventListener('copy', onCopy, { once: true });
    document.execCommand('copy');
    document.removeEventListener('copy', onCopy);
    sel?.removeAllRanges();
    holder.remove();
    return ok;
}

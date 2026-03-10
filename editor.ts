import { store, AppState, PageSetting, getFormatDefaultSetting } from './src/core/state';
import { paginate, getPageDimensions } from './src/engine/layout';
import * as htmlToImage from 'html-to-image';
import { ImagePanel, buildImageMarkdown } from './src/image/image-panel';

/**
 * 图片 Blob 存储 — 将大体积 data URL 存入内存，Markdown 中用短引用 mm-img://uuid
 * 避免 textarea 中出现数百KB 的 base64 字符串
 */
const imageStore = new Map<string, string>(); // uuid → data URL

function storeImage(dataUrl: string): string {
    const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    imageStore.set(uuid, dataUrl);
    return `mm-img://${uuid}`;
}

function resolveImageSrc(src: string): string {
    if (src.startsWith('mm-img://')) {
        return imageStore.get(src.slice(9)) || src;
    }
    return src;
}

/**
 * MagMark 1.4 - Professional Refactored Entry
 * (C) 2026 Editorial Elite System
 *
 * 排版增强层：
 *   • Han.css  — CJK 汉字与标点的精细排印（字间距、标点挤压、引号配对）
 *   • Paged.js — CSS Paged Media 多栏/页眉/页脚（打印预览窗口）
 *   • Vivliostyle 理念 — 严格孤行/寡行控制、CSS @page 分页
 */

// Han.css 全局函数声明（由 <script src="han.min.js"> 注入）
declare const Han: ((el: Element) => { render(): void }) | undefined;

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;

// UI Elements
const markdownInput = $('#markdown-input') as HTMLTextAreaElement;
const previewArea = $('#preview-area');
const paginationBar = $('#pagination-bar');
const pageInfo = $('#page-info');
const toolbar = $('#block-toolbar');

// Multi-selection state
let selectedBlockIds: Set<string> = new Set();

// Pending image insertion (from floating toolbar buttons)
let pendingInsert: { direction: 'above' | 'below'; blockEl: HTMLElement } | null = null;
let marqueeEl: HTMLElement | null = null;
let marqueeStart = { x: 0, y: 0 };
let isDraggingMarquee = false;

/**
 * Han.css 初始化 — 对所有 .magmark 内容元素执行汉字排印处理
 * 包括：CJK↔拉丁间距修正、标点宽度压缩、引号配对
 */
function initHanTypography() {
    if (typeof Han === 'undefined') return;
    previewArea.querySelectorAll('.magmark').forEach(el => {
        try {
            Han(el).render();
        } catch {
            // Han.css 在某些边缘 DOM 状态下可能抛出，安全忽略
        }
    });
}

/**
 * Debounce helper for expensive render calls
 */
function debounce(fn: Function, delay: number) {
    let timeout: number;
    const wrapped = (...args: any[]) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
    wrapped.cancel = () => clearTimeout(timeout);
    return wrapped as ((...args: any[]) => void) & { cancel: () => void };
}

/**
 * MAIN RENDER PIPELINE
 */
async function render() {
    const state = store.getState();
    const md = markdownInput.value;
    store.setState({ md });

    if (!md.trim()) {
        previewArea.innerHTML = '<div class="placeholder"><div class="placeholder-icon">✦</div><p>开始创作您的杂志大作...</p></div>';
        paginationBar.style.display = 'none';
        return;
    }

    if (state.viewMode === 'multi') {
        // Convert MD to raw HTML blocks
        // Using a simplified block splitter for refactor
        const rawHtml = convertMarkdown(md);
        const temp = document.createElement('div');
        temp.innerHTML = rawHtml;
        const blocks = Array.from(temp.children).map(c => c.outerHTML);

        const pages = await paginate(blocks, state, state.manualPagination);
        const nextCurrentPage = Math.min(store.getState().currentPage, Math.max(1, pages.length));
        store.setState({ pageHtmls: pages, totalPages: pages.length, currentPage: nextCurrentPage });

        renderPages();
    } else {
        renderScroll(md);
    }
}

const debouncedRender = debounce(render, 300);
// Slower debounce for style sliders: instant visual update, lazy re-paginate
const debouncedRenderSlow = debounce(render, 1000);

function finalizePaginationUpdate() {
    debouncedRenderSlow.cancel();
    render();
}

/**
 * Multi-Page Display Logic
 */
/**
 * Multi-Page Display Logic
 * Uses opacity fade to prevent flash-of-blank during re-render
 */
function renderPages() {
    const state = store.getState();
    const magmarkClass = state.showParagraphDividers ? 'magmark' : 'magmark magmark-hide-paragraph-dividers';

    // Fade-to-invisible first to prevent blank flash
    previewArea.style.opacity = '0';
    previewArea.style.transition = 'opacity 0.12s ease';

    // Use requestAnimationFrame to allow paint before rebuilding
    requestAnimationFrame(() => {
        previewArea.innerHTML = '';

        state.pageHtmls.forEach((pageData, i) => {
            const pageNum = i + 1;
            const page = document.createElement('div');
            const formatClass = 'page-' + state.format;
            page.className = `page ${formatClass}`;
            page.dataset.page = String(pageNum);
            page.style.display = pageNum === state.currentPage ? 'block' : 'none';

            // Apply scale transform
            const scale = state.scale;
            const dims = getPageDimensions(state.format);
            page.style.transformOrigin = 'top center';
            page.style.transform = `scale(${scale})`;
            // Compensate margin so scaled page doesn't leave too much gap or overlap
            const scaledH = dims.h * scale;
            const deltaH = scaledH - dims.h;
            page.style.marginBottom = `${Math.max(0, deltaH) + 32}px`;

            // Apply page-level styles
            const s = pageData.settings;
            page.style.setProperty('--mm-font-size', s.fontSize + 'px');
            page.style.setProperty('--mm-line-height', String(s.lineHeight));
            page.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
            page.style.setProperty('--mm-font-family', state.fontFamily);

            let indicator = state.pageOverrides[pageNum] ? '<div class="page-setting-indicator">独立样式</div>' : '';
            const footer = state.format === 'xiaohongshu'
                ? ''
                : `<div class="page-footer">PAGE ${pageNum} / ${state.totalPages}</div>`;

            page.innerHTML = `
                ${indicator}
                <div class="page-content ${magmarkClass}" lang="zh">${pageData.html}</div>
                ${footer}
            `;
            previewArea.appendChild(page);
        });

        // Re-attach block listeners and inject figure action buttons
        attachBlockListeners();
        attachFigureListeners();
        updatePaginationUI();
        renderPageStrip();

        // Fade back in，然后触发 Han.css 排印处理
        requestAnimationFrame(() => {
            previewArea.style.opacity = '1';
            // 延迟一帧确保 DOM 完全可见后再处理 Han.css
            requestAnimationFrame(initHanTypography);
        });
    });
}

function renderScroll(md: string) {
    const html = convertMarkdown(md);
    const state = store.getState();
    const formatClass = 'page-' + state.format;
    const magmarkClass = state.showParagraphDividers ? 'magmark' : 'magmark magmark-hide-paragraph-dividers';
    previewArea.innerHTML = `
        <div class="page ${formatClass} scrollable" style="transform-origin:top center;transform:scale(${state.scale})">
            <div class="scroll-container ${magmarkClass}" lang="zh">${html}</div>
        </div>`;
    paginationBar.style.display = 'none';
    // Han.css 排印处理
    requestAnimationFrame(initHanTypography);
}

/**
 * Interaction Logic
 */
function attachBlockListeners() {
    const state = store.getState();

    previewArea.querySelectorAll('.magmark > *').forEach(block => {
        const b = block as HTMLElement;
        const bid = b.dataset.blockId;
        if (!bid) return;

        // Restore selection highlights from state
        if (bid === state.selectedBlockId) {
            b.classList.add('block-editing');
        } else if (selectedBlockIds.has(bid)) {
            b.classList.add('block-selected');
        }

        b.addEventListener('click', (e) => {
            e.stopPropagation();
            const me = e as MouseEvent;
            if (me.shiftKey) {
                shiftSelectBlock(b);
            } else {
                selectBlock(b);
            }
        });
    });
    // Note: marquee mousedown is bound once in init()
}

/** Single-click select (clears previous selection) */
function selectBlock(el: HTMLElement) {
    const bid = el.dataset.blockId;
    if (!bid) return;

    // Clear all highlights
    selectedBlockIds.clear();
    previewArea.querySelectorAll('.block-editing, .block-selected').forEach(b => {
        b.classList.remove('block-editing', 'block-selected');
    });

    store.setState({ selectedBlockId: bid });
    el.classList.add('block-editing');

    showToolbar([el]);
}

/** Shift-click to add/remove from multi-selection */
function shiftSelectBlock(el: HTMLElement) {
    const bid = el.dataset.blockId;
    if (!bid) return;

    if (selectedBlockIds.has(bid)) {
        // Deselect
        selectedBlockIds.delete(bid);
        el.classList.remove('block-selected', 'block-editing');
    } else {
        selectedBlockIds.add(bid);
        el.classList.add('block-selected');
        // Demote any existing block-editing to block-selected too
        const state = store.getState();
        if (state.selectedBlockId && state.selectedBlockId !== bid) {
            selectedBlockIds.add(state.selectedBlockId);
            const prev = previewArea.querySelector(`[data-block-id="${state.selectedBlockId}"]`);
            prev?.classList.remove('block-editing');
            prev?.classList.add('block-selected');
        }
    }

    // If there are multi-selected blocks, show combined toolbar
    const allSelected = Array.from(
        previewArea.querySelectorAll('.block-selected, .block-editing')
    ) as HTMLElement[];

    if (allSelected.length > 0) {
        store.setState({ selectedBlockId: allSelected[0].dataset.blockId || null });
        showToolbar(allSelected);
    } else {
        toolbar.style.display = 'none';
        store.setState({ selectedBlockId: null });
    }
}

function showToolbar(els: HTMLElement | HTMLElement[]) {
    const elArray = Array.isArray(els) ? els : [els];
    if (elArray.length === 0) return;

    const primary = elArray[0];
    toolbar.style.display = 'flex';
    positionToolbar(primary);

    const bid = primary.dataset.blockId!;
    const state = store.getState();
    const over = state.blockOverrides[bid] || {
        fontSize: parseInt(getComputedStyle(primary).fontSize),
        lineHeight: parseFloat(getComputedStyle(primary).lineHeight) / parseInt(getComputedStyle(primary).fontSize) || 1.75,
        letterSpacing: 0
    };

    $<HTMLInputElement>('#toolbar-fontsize').value = String(over.fontSize);
    $('#toolbar-val-fontsize').textContent = over.fontSize + 'px';
    $<HTMLInputElement>('#toolbar-lineheight').value = String(over.lineHeight);
    $('#toolbar-val-lineheight').textContent = over.lineHeight.toFixed(2);
    $<HTMLInputElement>('#toolbar-letterspacing').value = String(over.letterSpacing);
    $('#toolbar-val-letterspacing').textContent = over.letterSpacing.toFixed(2);

    // Show count badge if multi-select
    const count = elArray.length + selectedBlockIds.size;
    const countBadge = $('#toolbar-count');
    if (countBadge) {
        countBadge.textContent = count > 1 ? `${count} 块已选` : '';
        (countBadge as HTMLElement).style.display = count > 1 ? 'block' : 'none';
    }
}

function positionToolbar(el: HTMLElement) {
    if (toolbar.style.display === 'none') return;
    const rect = el.getBoundingClientRect();
    // Position above the element
    const tbHeight = toolbar.offsetHeight || 48;
    toolbar.style.top = `${rect.top - tbHeight - 10}px`;
    toolbar.style.left = `${Math.max(8, rect.left)}px`;
}

/* ── Marquee (PS Box Select) ── */
let justFinishedMarquee = false;

function onMarqueeStart(e: MouseEvent) {
    // Only start marquee if clicking on the preview background (not on a block)
    const target = e.target as HTMLElement;
    if (target.closest('.magmark > *') || target.closest('.floating-toolbar')) return;
    if (e.button !== 0) return;

    // Prevent browser text selection during drag
    e.preventDefault();

    isDraggingMarquee = false;
    marqueeStart = { x: e.clientX, y: e.clientY };

    const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - marqueeStart.x;
        const dy = ev.clientY - marqueeStart.y;
        if (!isDraggingMarquee && Math.abs(dx) + Math.abs(dy) > 6) {
            isDraggingMarquee = true;
            // Disable text selection on entire page while dragging
            document.body.style.userSelect = 'none';
            marqueeEl = document.createElement('div');
            marqueeEl.id = 'marquee-rect';
            // Inherit theme variables
            document.body.appendChild(marqueeEl);
        }
        if (!isDraggingMarquee || !marqueeEl) return;

        const x = Math.min(ev.clientX, marqueeStart.x);
        const y = Math.min(ev.clientY, marqueeStart.y);
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        // Keep CSS class styles; only override position/size
        marqueeEl.style.cssText =
            `position:fixed;z-index:3000;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    };

    const onUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        // Re-enable text selection
        document.body.style.userSelect = '';

        if (isDraggingMarquee && marqueeEl) {
            applyMarqueeSelection(ev);
            marqueeEl.remove();
            marqueeEl = null;
            // Signal to the click handler not to clear selection
            justFinishedMarquee = true;
            setTimeout(() => { justFinishedMarquee = false; }, 50);
        }
        isDraggingMarquee = false;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function applyMarqueeSelection(endEvent: MouseEvent) {
    const x1 = Math.min(endEvent.clientX, marqueeStart.x);
    const y1 = Math.min(endEvent.clientY, marqueeStart.y);
    const x2 = Math.max(endEvent.clientX, marqueeStart.x);
    const y2 = Math.max(endEvent.clientY, marqueeStart.y);

    if (x2 - x1 < 6 && y2 - y1 < 6) return;

    // Clear old selection
    selectedBlockIds.clear();
    previewArea.querySelectorAll('.block-editing, .block-selected').forEach(b => {
        b.classList.remove('block-editing', 'block-selected');
    });
    store.setState({ selectedBlockId: null });

    const hit: HTMLElement[] = [];
    previewArea.querySelectorAll('.magmark > *').forEach(block => {
        const b = block as HTMLElement;
        const bid = b.dataset.blockId;
        if (!bid) return;
        const r = b.getBoundingClientRect();
        const overlaps = r.left < x2 && r.right > x1 && r.top < y2 && r.bottom > y1;
        if (overlaps) {
            hit.push(b);
            selectedBlockIds.add(bid);
        }
    });

    if (hit.length === 0) return;

    // First element = primary (block-editing), rest = block-selected
    hit[0].classList.add('block-editing');
    hit.slice(1).forEach(b => b.classList.add('block-selected'));
    store.setState({ selectedBlockId: hit[0].dataset.blockId! });
    showToolbar(hit);
}

/** Clears all block selections and hides the floating toolbar */
function clearSelection() {
    selectedBlockIds.clear();
    store.setState({ selectedBlockId: null });
    previewArea.querySelectorAll('.block-editing, .block-selected').forEach(b => {
        b.classList.remove('block-editing', 'block-selected');
    });
    toolbar.style.display = 'none';
}

/**
 * Comprehensive Markdown → HTML block converter.
 *
 * Supported syntax:
 *   Headings:        # H1  ## H2  ### H3  #### H4  ##### H5  ###### H6
 *   HR / page-break: --- or *** or ___
 *   Bold:            **text** or __text__
 *   Italic:          *text* or _text_
 *   Bold+italic:     ***text***
 *   Strikethrough:   ~~text~~
 *   Inline code:     `code`
 *   Links:           [label](url)
 *   Images:          ![alt](src) or ![alt](src "title")
 *   Fenced code:     ```lang … ```
 *   Blockquote:      > text (nested >> supported)
 *   Unordered list:  - / * / + items (indent for nesting)
 *   Ordered list:    1. items (indent for nesting)
 *   Task list:       - [ ] / - [x] items
 *   Table:           | col | col |  (with --- separator row)
 *   Paragraph:       consecutive non-blank lines (hard-wrap with <br>)
 *
 * Returns a newline-joined string of top-level block HTML elements.
 * Each block becomes one pagination unit in the layout engine.
 */
function convertMarkdown(md: string): string {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    let i = 0;

    /** Helpers ──────────────────────────────────────────── */
    const isBlank     = (l: string) => l.trim() === '';
    const isHrLine    = (l: string) => /^(\*{3,}|-{3,}|_{3,})\s*$/.test(l.trim());
    const isHeading   = (l: string) => /^#{1,6} /.test(l);
    const isFence     = (l: string) => l.startsWith('```') || l.startsWith('~~~');
    const isQuote     = (l: string) => l.startsWith('>');
    const isTable     = (l: string) => l.startsWith('|');
    const isUlItem    = (l: string) => /^(\s*)[-*+] /.test(l);
    const isOlItem    = (l: string) => /^(\s*)\d+\. /.test(l);
    const isListItem  = (l: string) => isUlItem(l) || isOlItem(l);
    // 独立图片行：整行内容只有一个图片标记（可带 {attrs}），作为块级 <figure>
    const isFigureLine = (l: string) =>
        /^\s*!\[[^\]]*\]\([^)]+\)(\{[^}]*\})?\s*$/.test(l);
    const isBlockStop = (l: string) =>
        isBlank(l) || isHeading(l) || isFence(l) || isQuote(l) ||
        isTable(l) || isListItem(l) || isHrLine(l) || isFigureLine(l);

    // ── Fenced code block ─────────────────────────────────
    function parseFenceBlock(): string {
        const opener = lines[i];
        const fence  = opener.startsWith('~~~') ? '~~~' : '```';
        const lang   = opener.slice(fence.length).trim().split(/\s+/)[0] || '';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trimEnd().startsWith(fence)) {
            codeLines.push(escapeHtml(lines[i]));
            i++;
        }
        i++; // skip closing fence
        const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        return `<pre><code${cls}>${codeLines.join('\n')}</code></pre>`;
    }

    // ── Blockquote ────────────────────────────────────────
    function parseBlockquote(): string {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('>')) {
            // Strip one level of '>' prefix (> or >space)
            quoteLines.push(lines[i].replace(/^>\s?/, ''));
            i++;
        }
        // Recursively convert inner content (supports nested blockquotes)
        const inner = convertMarkdown(quoteLines.join('\n'))
            .replace(/<\/?p>/g, '') // keep inner markup clean
            || quoteLines.map(l => inlineMarkdown(l)).join('<br>');
        return `<blockquote><p>${inner}</p></blockquote>`;
    }

    // ── Table ─────────────────────────────────────────────
    function parseTable(): string {
        const tableLines: string[] = [];
        while (i < lines.length && isTable(lines[i])) {
            tableLines.push(lines[i]);
            i++;
        }
        if (tableLines.length < 2) {
            // Not a real table — treat as paragraph
            return `<p>${tableLines.map(l => inlineMarkdown(l)).join('<br>')}</p>`;
        }
        const parseCells = (row: string) =>
            row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

        const headerCells = parseCells(tableLines[0]);
        // Row 1 is separator (|:---|:---:|), skip it
        const dataRows = tableLines.slice(2);

        const thead = `<thead><tr>${headerCells.map(c =>
            `<th>${inlineMarkdown(c)}</th>`).join('')}</tr></thead>`;
        const tbody = dataRows.length
            ? `<tbody>${dataRows.map(row =>
                `<tr>${parseCells(row).map(c =>
                    `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`
              ).join('')}</tbody>`
            : '';

        return `<table>${thead}${tbody}</table>`;
    }

    // ── List (ul / ol with nesting) ───────────────────────
    function parseList(isOrdered: boolean): string {
        function getIndent(l: string): number {
            return l.match(/^(\s*)/)?.[1].length ?? 0;
        }
        function buildItems(minIndent: number, ordered: boolean): string {
            let html = '';
            while (i < lines.length) {
                const line = lines[i];
                if (isBlank(line)) { i++; continue; }
                if (!isListItem(line)) break;

                const indent = getIndent(line);
                if (indent < minIndent) break;

                // Determine item type at current indent level
                const ulMatch = line.match(/^\s*[-*+] (\[[ x]\] )?(.*)$/);
                const olMatch = line.match(/^\s*\d+\. (.*)$/);
                if (!ulMatch && !olMatch) break;

                let content = ulMatch ? ulMatch[2] : olMatch![1];
                let isTask  = false;
                let checked = false;

                // Task list item
                if (ulMatch && ulMatch[1]) {
                    isTask  = true;
                    checked = ulMatch[1].includes('x');
                    const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} disabled> `;
                    content = checkbox + inlineMarkdown(content);
                } else {
                    content = inlineMarkdown(content);
                }

                i++;

                // Check for nested list
                let nested = '';
                if (i < lines.length && isListItem(lines[i])) {
                    const nextIndent = getIndent(lines[i]);
                    if (nextIndent > indent) {
                        const nextIsOl = isOlItem(lines[i]);
                        nested = nextIsOl
                            ? `<ol>${buildItems(nextIndent, true)}</ol>`
                            : `<ul>${buildItems(nextIndent, false)}</ul>`;
                    }
                }

                html += `<li>${content}${nested}</li>`;
            }
            return html;
        }

        const baseIndent = getIndent(lines[i]);
        const inner = buildItems(baseIndent, isOrdered);
        return isOrdered ? `<ol>${inner}</ol>` : `<ul>${inner}</ul>`;
    }

    // ── Figure (standalone image line → block <figure>) ───
    function parseFigureLine(): string {
        const line = lines[i].trim();
        i++;
        // Extended: ![alt](src "title"){.layout width=N%}
        const ext = line.match(/^!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)\{([^}]*)\}/);
        if (ext) return buildFigureHtml(ext[2], ext[1], ext[3] || '', ext[4]);
        // Plain standalone: ![alt](src "title")
        const plain = line.match(/^!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)$/);
        if (plain) {
            // No layout attrs — center figure with auto caption from alt
            return buildFigureHtml(plain[2], plain[1], plain[3] || '', '');
        }
        // Fallback — render as inline paragraph
        return `<p>${inlineMarkdown(line)}</p>`;
    }

    // ── Paragraph ─────────────────────────────────────────
    function parseParagraph(): string {
        const paraLines: string[] = [];
        while (i < lines.length && !isBlockStop(lines[i])) {
            paraLines.push(inlineMarkdown(lines[i]));
            i++;
        }
        return paraLines.length ? `<p>${paraLines.join('<br>')}</p>` : '';
    }

    // ── Main parsing loop ─────────────────────────────────
    while (i < lines.length) {
        const line = lines[i];

        if (isBlank(line))  { i++; continue; }

        // Fenced code block
        if (isFence(line))  { blocks.push(parseFenceBlock()); continue; }

        // HR / page-break marker
        if (isHrLine(line)) { blocks.push('<hr>'); i++; continue; }

        // Headings (longest prefix first to avoid h1 matching h2/h3)
        const hm = line.match(/^(#{1,6}) (.+)$/);
        if (hm) {
            const level = hm[1].length;
            blocks.push(`<h${level}>${inlineMarkdown(hm[2])}</h${level}>`);
            i++;
            continue;
        }

        // Blockquote
        if (isQuote(line))      { blocks.push(parseBlockquote()); continue; }

        // Table
        if (isTable(line))      { blocks.push(parseTable()); continue; }

        // Unordered list
        if (isUlItem(line))     { blocks.push(parseList(false)); continue; }

        // Ordered list
        if (isOlItem(line))     { blocks.push(parseList(true)); continue; }

        // Standalone figure (image-only line → block <figure>)
        if (isFigureLine(line)) { blocks.push(parseFigureLine()); continue; }

        // Paragraph (catch-all)
        const para = parseParagraph();
        if (para) blocks.push(para);
    }

    return blocks.join('\n');
}

/**
 * Build a <figure> element from extended image attrs like:
 *   {.float-left width=50%}
 *   {.float-right width=40%}
 *   {.full}
 *   {.center}
 *
 * Attr string examples:
 *   ".float-left width=50%"
 *   ".full"
 *   ".center"
 */
function buildFigureHtml(src: string, alt: string, title: string, attrStr: string): string {
    const parts = (attrStr || '').trim().split(/\s+/).filter(Boolean);
    let layout = 'center';
    let width: string | null = null;
    let caption = '';

    for (const part of parts) {
        if (part.startsWith('.')) {
            const cls = part.slice(1);
            if (['float-left', 'float-right', 'full', 'center', 'inline'].includes(cls)) {
                layout = cls;
            }
        } else if (part.startsWith('width=')) {
            width = part.slice(6); // e.g. "50%"
        } else if (part.startsWith('caption=')) {
            caption = decodeURIComponent(part.slice(8));
        }
    }

    // Resolve mm-img:// references to actual data URLs
    const resolvedSrc = resolveImageSrc(src);

    const figStyle = layout === 'float-left' || layout === 'float-right'
        ? (width ? ` style="width:${escapeAttr(width)}"` : '')
        : '';
    const imgStyle = layout === 'center' && width ? ` style="width:${escapeAttr(width)}"` : '';
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    // Use explicit caption if provided, otherwise use alt (if non-empty and not a UUID ref)
    const displayCaption = caption || (alt && !alt.startsWith('mm-img://') ? alt : '');
    const captionHtml = displayCaption
        ? `<figcaption>${escapeHtml(displayCaption)}</figcaption>`
        : '';

    // data-mm-src stores the ORIGINAL (unresolved) src so deletion can search the markdown directly
    return `<figure class="mm-figure mm-${layout}"${figStyle} data-mm-src="${escapeAttr(src)}">` +
        `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${titleAttr}${imgStyle} loading="lazy">` +
        captionHtml +
        `</figure>`;
}

/**
 * Inline Markdown → HTML.
 * Processing order matters: bold+italic first, then bold, then italic, etc.
 */
function inlineMarkdown(text: string): string {
    if (!text) return '';
    // Guard against extremely long lines
    if (text.length > 5000) return escapeHtml(text);

    return text
        // Extended image with layout attrs in inline context (e.g. inside a paragraph)
        // Only apply width; layout attrs are for block-level figures handled by parseFigureLine
        .replace(/!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)\{([^}]*)\}/g,
            (_, alt, src, _title, attrs) => {
                const widthMatch = attrs.match(/width=(\d+%?)/);
                const style = widthMatch ? ` style="width:${widthMatch[1]}"` : '';
                const resolvedSrc = resolveImageSrc(src);
                return `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${style} loading="lazy">`;
            })
        // Plain image — resolve mm-img:// if needed
        .replace(/!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/g,
            (_, alt, src, title) => {
                const t = title ? ` title="${escapeAttr(title)}"` : '';
                const resolvedSrc = resolveImageSrc(src);
                return `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${t} loading="lazy">`;
            })
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Inline code (before bold/italic to protect content)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold + italic
        .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
        .replace(/_{3}(.+?)_{3}/g,   '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g,     '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

/** Escape HTML special chars (for code block content) */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Escape attribute values */
function escapeAttr(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Render the page thumbnail strip below the pagination controls
 */
function renderPageStrip() {
    const state = store.getState();
    const strip = document.getElementById('page-strip');
    if (!strip) return;

    if (state.viewMode !== 'multi' || state.totalPages <= 1) {
        strip.innerHTML = '';
        strip.style.display = 'none';
        return;
    }

    strip.style.display = 'flex';
    const total = state.totalPages;

    // Rebuild only if page count changed — avoids re-render flicker
    const existing = strip.querySelectorAll('.page-thumb');
    if (existing.length !== total) {
        strip.innerHTML = '';
        for (let i = 1; i <= total; i++) {
            const thumb = document.createElement('button');
            thumb.className = 'page-thumb';
            thumb.dataset.page = String(i);
            thumb.title = `跳转第 ${i} 页`;
            thumb.innerHTML = `<span class="pt-num">${i}</span>`;
            thumb.addEventListener('click', () => {
                store.setState({ currentPage: i });
                renderPages();
                syncControlsToPage(i);
            });
            strip.appendChild(thumb);
        }
    }

    // Update active state
    strip.querySelectorAll('.page-thumb').forEach(el => {
        const el2 = el as HTMLElement;
        const pg = parseInt(el2.dataset.page || '0');
        el2.classList.toggle('active', pg === state.currentPage);
    });

    // Scroll active thumb into view smoothly
    const active = strip.querySelector('.page-thumb.active') as HTMLElement | null;
    if (active) {
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function getFormatBaseSetting(state: AppState): PageSetting {
    const defaults = getFormatDefaultSetting(state.format);
    return {
        fontSize: state.fontSize ?? defaults.fontSize,
        lineHeight: state.lineHeight ?? defaults.lineHeight,
        letterSpacing: state.letterSpacing ?? defaults.letterSpacing,
    };
}

function getPageSetting(state: AppState, pageNum: number): PageSetting {
    return state.pageOverrides[pageNum] || getFormatBaseSetting(state);
}

function getBlockBaseSetting(el: HTMLElement, state: AppState): PageSetting {
    const pageNum = parseInt(el.closest('.page')?.getAttribute('data-page') || String(state.currentPage), 10);
    const pageSetting = getPageSetting(state, pageNum);
    const computed = getComputedStyle(el);
    const fontSize = parseFloat(computed.fontSize);
    const lineHeightPx = parseFloat(computed.lineHeight);
    const letterSpacingPx = parseFloat(computed.letterSpacing);

    return {
        fontSize: Number.isFinite(fontSize) ? fontSize : pageSetting.fontSize,
        lineHeight: Number.isFinite(lineHeightPx) && Number.isFinite(fontSize) && fontSize > 0
            ? lineHeightPx / fontSize
            : pageSetting.lineHeight,
        letterSpacing: Number.isFinite(letterSpacingPx) && Number.isFinite(fontSize) && fontSize > 0
            ? letterSpacingPx / fontSize
            : pageSetting.letterSpacing,
    };
}

/**
 * 打印预览窗口（Paged.js + Han.css）
 *
 * 在独立弹出窗口中加载 Paged.js polyfill，对内容应用 CSS Paged Media
 * 规则（页边距、页眉页脚、页码），并通过 Han.css 进行 CJK 排印处理。
 */
function openPrintPreview() {
    const state = store.getState();
    if (!state.pageHtmls || state.pageHtmls.length === 0) {
        alert('请先输入内容再使用打印预览');
        return;
    }

    // 读取当前生效的 CSS 变量
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    const mmFontSize     = rootStyle.getPropertyValue('--mm-font-size').trim()     || '14px';
    const mmLineHeight   = rootStyle.getPropertyValue('--mm-line-height').trim()   || '1.75';
    const mmLetterSpacing = rootStyle.getPropertyValue('--mm-letter-spacing').trim() || '0.01em';
    const userFont       = rootStyle.getPropertyValue('--user-font-family').trim();
    const thFontBody     = rootStyle.getPropertyValue('--th-font-body').trim();
    const mmFontFamily   = rootStyle.getPropertyValue('--mm-font-family').trim()   || "'Source Han Serif SC', serif";
    const effectiveFont  = userFont || thFontBody || mmFontFamily;
    const thPrimary  = rootStyle.getPropertyValue('--th-primary').trim()  || '#d4af37';
    const thAccent   = rootStyle.getPropertyValue('--th-accent').trim()   || '#e67e22';
    const thBgPage   = rootStyle.getPropertyValue('--th-bg-page').trim()  || '#ffffff';
    const thTextPage = rootStyle.getPropertyValue('--th-text-page').trim() || '#1a1a2e';

    // 拼合所有分页 HTML，每页之间插入强制分页符
    const combinedHtml = state.pageHtmls
        .map((pd, i) =>
            `<section class="mm-page-section"${i < state.pageHtmls.length - 1 ? ' style="break-after:page;page-break-after:always;"' : ''}>${pd.html}</section>`)
        .join('\n');

    const htmlDoc = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MagMark — 打印预览</title>
<link href="https://fonts.googleapis.com/css2?family=Source+Han+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/han-css@3/dist/han.min.css">
<!-- Paged.js polyfill：自动处理 CSS Paged Media @page 规则 -->
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
<style>
/* ── Paged.js @page 规则 ──────────────────────── */
@page {
    size: A4;
    margin: 22mm 18mm 28mm 18mm;
    /* Paged.js 页脚：居中页码 */
    @bottom-center {
        content: counter(page) " / " counter(pages);
        font-family: ${effectiveFont};
        font-size: 8pt;
        color: #aaa;
        letter-spacing: 0.12em;
    }
}
@page :first {
    @bottom-center { content: none; }
}
@page :left  { margin-left: 24mm; margin-right: 14mm; }
@page :right { margin-left: 14mm; margin-right: 24mm; }

/* ── 基础重置 ─────────────────────────────────── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { background: #f0ede8; }
body {
    font-family: ${effectiveFont};
    font-size: ${mmFontSize};
    line-height: ${mmLineHeight};
    letter-spacing: ${mmLetterSpacing};
    color: ${thTextPage};
    background: ${thBgPage};
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "locl" 1;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
}

/* ── 分页区块容器 ─────────────────────────────── */
.mm-page-section { width: 100%; }

/* ── 正文排版 ────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
    font-family: ${effectiveFont};
    page-break-after: avoid; break-after: avoid;
    word-break: keep-all; overflow-wrap: break-word;
    font-feature-settings: "kern" 1;
}
h1 {
    font-size: calc(${mmFontSize} * 2.2);
    font-weight: 700; line-height: 1.2;
    margin-bottom: 0.8em;
    color: ${thPrimary};
    border-bottom: 3px solid ${thAccent};
    padding-bottom: 10px;
}
h2 {
    font-size: calc(${mmFontSize} * 1.65);
    font-weight: 600; line-height: 1.3;
    margin-top: 1.6em; margin-bottom: 0.7em;
    color: ${thPrimary};
    border-bottom: 2px solid ${thAccent};
    padding-bottom: 7px;
}
h3 {
    font-size: calc(${mmFontSize} * 1.35);
    font-weight: 600; line-height: 1.4;
    margin-top: 1.3em; margin-bottom: 0.5em;
    color: ${thPrimary};
}
h4 {
    font-size: calc(${mmFontSize} * 1.15);
    font-weight: 600;
    margin-top: 1em; margin-bottom: 0.4em;
}
p {
    text-align: justify;
    text-justify: inter-character;
    hyphens: auto;
    margin-bottom: 1em;
    word-break: normal;
    overflow-wrap: break-word;
    line-break: strict;
    hanging-punctuation: first last;
    orphans: 3; widows: 3;
}
strong { font-weight: 700; color: ${thPrimary}; }
em     { font-style: italic; }
a      { color: ${thPrimary}; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
del    { text-decoration: line-through; opacity: 0.6; }

/* ── 代码 ────────────────────────────────────── */
code {
    font-family: 'JetBrains Mono', 'Menlo', monospace;
    background: #f4f4f8; padding: 2px 6px;
    border-radius: 4px; color: #c0392b;
    font-size: 0.88em; border: 1px solid #e8e8ee;
    font-feature-settings: normal;
}
pre {
    background: #0f111a; color: #e2e4f0;
    padding: 18px 22px; border-radius: 10px;
    white-space: pre-wrap; overflow-wrap: break-word;
    word-break: normal;
    margin: 1.6em 0;
    border-left: 4px solid ${thPrimary};
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.86em; line-height: 1.7;
    page-break-inside: avoid; break-inside: avoid;
    font-feature-settings: normal;
}
pre code { background: none; padding: 0; border: none; color: inherit; }

/* ── 引用块 ──────────────────────────────────── */
blockquote {
    border-left: 4px solid ${thPrimary};
    margin: 1.4em 0; padding: 14px 22px;
    font-style: italic; color: #555;
    border-radius: 0 8px 8px 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.03) 0%, transparent 100%);
    page-break-inside: avoid; break-inside: avoid;
}
blockquote p { margin-bottom: 0.4em; }

/* ── 列表 ────────────────────────────────────── */
ul, ol { padding-left: 1.75em; margin-bottom: 1em; }
li { margin-bottom: 0.25em; line-height: ${mmLineHeight}; word-break: normal; overflow-wrap: break-word; }
li::marker { color: ${thPrimary}; }

/* ── 表格 ────────────────────────────────────── */
table {
    width: 100%; border-collapse: separate; border-spacing: 0;
    margin: 1.4em 0; border: 1px solid #e0e0e8;
    border-radius: 8px; overflow: hidden; font-size: 0.92em;
    page-break-inside: avoid; break-inside: avoid;
}
th, td { border: 1px solid #e8e8ee; padding: 9px 13px; text-align: left; }
th { background: linear-gradient(to bottom, #fafafe, #f0f0f5); font-weight: 600; }
tr:nth-child(even) { background: #fafaff; }

/* ── 分隔线 ──────────────────────────────────── */
hr {
    border: none;
    border-top: 2px solid color-mix(in srgb, ${thPrimary} 30%, transparent);
    margin: 1.5em 0;
}

/* ── 图片 ────────────────────────────────────── */
img {
    max-width: 100%; height: auto;
    border-radius: 8px; display: block;
    margin: 0.8em auto;
    page-break-inside: avoid; break-inside: avoid;
}

/* ── Paged.js 过渡状态隐藏闪烁 ───────────────── */
.pagedjs_pages { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 20px; }
.pagedjs_page  { background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
</style>
</head>
<body lang="zh">
<div class="magmark">
${combinedHtml}
</div>
<!-- Han.js — 必须在内容渲染后执行 -->
<script src="https://cdn.jsdelivr.net/npm/han-css@3/dist/han.min.js"></script>
<script>
// Paged.js 完成分页后再运行 Han.css，确保所有文本节点均已插入 DOM
if (typeof PagedPolyfill !== 'undefined') {
    PagedPolyfill.preview().then(function() {
        if (typeof Han === 'function') Han(document.body).render();
    });
} else {
    window.addEventListener('load', function() {
        if (typeof Han === 'function') Han(document.body).render();
    });
}
</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=860,menubar=yes,toolbar=yes');
    if (!win) {
        alert('弹出窗口被拦截，请在浏览器设置中允许此页面弹出窗口后重试');
        return;
    }
    win.document.open();
    win.document.write(htmlDoc);
    win.document.close();
}

/**
 * Insert text at the current cursor position in a textarea,
 * then move the cursor to after the inserted text.
 */
function insertAtCursor(ta: HTMLTextAreaElement, text: string) {
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd   ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(end);
    // Ensure we're on a new line before the insertion
    const needsNewLine = before.length > 0 && !before.endsWith('\n');
    const prefix = needsNewLine ? '\n' : '';
    ta.value = before + prefix + text + after;
    const newPos = start + prefix.length + text.length;
    ta.setSelectionRange(newPos, newPos);
    ta.dispatchEvent(new Event('input'));
}

/**
 * Insert image markdown above or below the block corresponding to the given element.
 *
 * Strategy: use the block element's trimmed text content as a search key within
 * the raw markdown. Find the containing paragraph/heading, then inject the image
 * markdown before or after it, with surrounding blank lines for clean parsing.
 */
function insertImageRelativeToBlock(
    direction: 'above' | 'below',
    blockEl: HTMLElement,
    imageMd: string
) {
    const md = markdownInput.value;
    const lines = md.split('\n');

    // Build a search key from the block's plain text (first 30 meaningful chars)
    const blockText = (blockEl.textContent ?? '').trim().replace(/\s+/g, ' ');
    const searchKey = blockText.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let targetLine = -1;
    if (searchKey.length >= 4) {
        // Strip common markdown syntax characters before comparing
        const clean = (s: string) => s.replace(/[#*_`!>\-\[\]]/g, '').trim();
        for (let i = 0; i < lines.length; i++) {
            if (clean(lines[i]).includes(searchKey.slice(0, 20))) {
                targetLine = i;
                break;
            }
        }
    }

    if (targetLine === -1) {
        // Fallback: insert at textarea cursor position
        insertAtCursor(markdownInput, '\n' + imageMd + '\n');
        debouncedRender();
        return;
    }

    // Expand the block range: walk back to the first non-blank line of this paragraph
    let blockStart = targetLine;
    while (blockStart > 0 && lines[blockStart - 1].trim() !== '') blockStart--;

    // Walk forward to the last non-blank line of this paragraph
    let blockEnd = targetLine;
    while (blockEnd + 1 < lines.length && lines[blockEnd + 1].trim() !== '') blockEnd++;

    let insertAfterLine: number; // index AFTER which to insert
    if (direction === 'above') {
        insertAfterLine = blockStart - 1; // insert before blockStart
    } else {
        insertAfterLine = blockEnd; // insert after blockEnd
    }

    // Build the new markdown
    const before = lines.slice(0, insertAfterLine + 1).join('\n');
    const after  = lines.slice(insertAfterLine + 1).join('\n');

    // Ensure blank-line separators so the image is a standalone block
    const sep = '\n\n';
    let newMd: string;
    if (direction === 'above') {
        newMd = before + (before.trimEnd() ? sep : '') + imageMd + sep + after.trimStart();
    } else {
        newMd = before.trimEnd() + sep + imageMd + sep + after.trimStart();
    }

    markdownInput.value = newMd;
    // Move cursor to just after the inserted image line
    const insertedEnd = (before.trimEnd() + sep + imageMd).length;
    markdownInput.setSelectionRange(insertedEnd, insertedEnd);
    markdownInput.dispatchEvent(new Event('input'));
    debouncedRender();
}

/**
 * Inject interactive action buttons (Edit ✎ / Delete ✕) into every mm-figure
 * in the preview. Called by renderPages() after each DOM rebuild.
 * Event delegation in init() handles the actual click logic.
 */
function attachFigureListeners() {
    previewArea.querySelectorAll('figure.mm-figure').forEach(fig => {
        const figEl = fig as HTMLElement;
        if (!figEl.querySelector('.mm-fig-actions')) {
            const div = document.createElement('div');
            div.className = 'mm-fig-actions';
            div.innerHTML =
                '<button class="mm-fig-btn mm-fig-edit" title="编辑图片">✎</button>' +
                '<button class="mm-fig-btn mm-fig-delete" title="删除图片">✕</button>';
            figEl.appendChild(div);
        }
    });
}

/**
 * Remove an image from the raw markdown by searching for its original src
 * (stored in data-mm-src on the figure element).
 */
function deleteFigureFromMarkdown(figEl: HTMLElement) {
    const originalSrc = figEl.dataset.mmSrc || '';
    const imgEl = figEl.querySelector('img') as HTMLImageElement | null;
    const alt = imgEl?.alt || '';

    const md = markdownInput.value;
    const lines = md.split('\n');

    let targetLine = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('![')) continue;
        // Match by original src (mm-img://uuid or plain URL)
        if (originalSrc && line.includes(originalSrc)) { targetLine = i; break; }
        // Fallback: match by alt text
        if (alt && line.includes(`![${alt}]`)) { targetLine = i; break; }
    }

    if (targetLine === -1) return;

    // Excise the line and clean up surrounding blank lines
    const before = lines.slice(0, targetLine).join('\n').trimEnd();
    const after  = lines.slice(targetLine + 1).join('\n').trimStart();
    const newMd = before && after ? before + '\n\n' + after
                : (before || after).trim();

    markdownInput.value = newMd;
    markdownInput.dispatchEvent(new Event('input'));
    debouncedRender();
}

/**
 * INITIALIZATION
 */
function init() {
    // Listen for data changes
    markdownInput.addEventListener('input', () => {
        $('#char-count').textContent = markdownInput.value.length + ' 字符';
        debouncedRender();
    });

    // Global Controls
    $<HTMLInputElement>('#ctrl-fontsize').addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        const state = store.getState();
        if ($<HTMLInputElement>('#chk-page-override').checked) {
            const overrides = { ...state.pageOverrides };
            overrides[state.currentPage] = { ...getPageSetting(state, state.currentPage), fontSize: val };
            store.setState({ pageOverrides: overrides });
        } else {
            store.setState({ fontSize: val, pageOverrides: {} });
        }
        $('#val-fontsize').textContent = val + 'pt';
        // Instant preview, re-paginate after 800ms to handle overflow
        applyStylesOnly();
        debouncedRenderSlow();
    });
    $<HTMLInputElement>('#ctrl-fontsize').addEventListener('change', finalizePaginationUpdate);

    $<HTMLInputElement>('#ctrl-lineheight').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        const state = store.getState();
        if ($<HTMLInputElement>('#chk-page-override').checked) {
            const overrides = { ...state.pageOverrides };
            overrides[state.currentPage] = { ...getPageSetting(state, state.currentPage), lineHeight: val };
            store.setState({ pageOverrides: overrides });
        } else {
            store.setState({ lineHeight: val, pageOverrides: {} });
        }
        $('#val-lineheight').textContent = val.toFixed(2) + '×';
        // Instant preview, re-paginate after 800ms to keep page flow accurate
        applyStylesOnly();
        debouncedRenderSlow();
    });
    $<HTMLInputElement>('#ctrl-lineheight').addEventListener('change', finalizePaginationUpdate);

    $<HTMLInputElement>('#ctrl-letterspacing').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        const state = store.getState();
        if ($<HTMLInputElement>('#chk-page-override').checked) {
            const overrides = { ...state.pageOverrides };
            overrides[state.currentPage] = { ...getPageSetting(state, state.currentPage), letterSpacing: val };
            store.setState({ pageOverrides: overrides });
        } else {
            store.setState({ letterSpacing: val, pageOverrides: {} });
        }
        $('#val-letterspacing').textContent = val.toFixed(2) + 'em';
        // Instant preview, re-paginate after 800ms because width changes affect wrapping
        applyStylesOnly();
        debouncedRenderSlow();
    });
    $<HTMLInputElement>('#ctrl-letterspacing').addEventListener('change', finalizePaginationUpdate);

    $<HTMLSelectElement>('#ctrl-format').addEventListener('change', (e) => {
        const fmt = (e.target as HTMLSelectElement).value as AppState['format'];
        const formatSetting = getFormatDefaultSetting(fmt);
        // Auto-scale: xiaohongshu 1080px @ 75% is comfortable on most screens
        const autoScale = fmt === 'xiaohongshu' ? 0.75 : 1;
        store.setState({
            format: fmt,
            fontSize: formatSetting.fontSize,
            lineHeight: formatSetting.lineHeight,
            letterSpacing: formatSetting.letterSpacing,
            pageOverrides: {},
            blockOverrides: {},
            currentPage: 1,
            scale: autoScale,
        });
        // Sync the scale dropdown to the nearest available option
        const scaleEl = $<HTMLSelectElement>('#ctrl-scale');
        const options = Array.from(scaleEl.options);
        const best = options.reduce((prev, opt) =>
            Math.abs(parseFloat(opt.value) - autoScale) < Math.abs(parseFloat(prev.value) - autoScale) ? opt : prev
        );
        scaleEl.value = best.value;
        syncControlsToPage(1);
        applyGlobalStyles();
        render();
    });

    $<HTMLInputElement>('#chk-manual-pagination').addEventListener('change', (e) => {
        store.setState({ manualPagination: (e.target as HTMLInputElement).checked });
        render();
    });

    $<HTMLInputElement>('#chk-show-paragraph-dividers').addEventListener('change', (e) => {
        store.setState({ showParagraphDividers: (e.target as HTMLInputElement).checked });
        render();
    });

    $<HTMLSelectElement>('#ctrl-theme').addEventListener('change', (e) => {
        const theme = (e.target as HTMLSelectElement).value;
        store.setState({ theme });
        applyTheme();
        render();
    });

    // Font selector — sets user override variable so it wins over theme fonts
    $<HTMLSelectElement>('#ctrl-font').addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        store.setState({ fontFamily: val });
        document.documentElement.style.setProperty('--user-font-family', val);
        applyGlobalStyles();
        debouncedRender();
    });

    // Scale selector
    $<HTMLSelectElement>('#ctrl-scale').addEventListener('change', (e) => {
        const scale = parseFloat((e.target as HTMLSelectElement).value);
        store.setState({ scale });
        render();
    });

    // Marquee drag \u2014 bind ONCE here, not in attachBlockListeners
    previewArea.addEventListener('mousedown', onMarqueeStart);

    // Click on preview bg \u2192 deselect all (skip immediately after marquee)
    previewArea.addEventListener('click', (e) => {
        if (justFinishedMarquee) return;
        const target = e.target as HTMLElement;
        if (!target.closest('.magmark > *') && !target.closest('.floating-toolbar')) {
            clearSelection();
        }
    });

    // View Mode
    $('#btn-multi').addEventListener('click', () => {
        $('.mode-btn.active').classList.remove('active');
        $('#btn-multi').classList.add('active');
        store.setState({ viewMode: 'multi' });
        render();
    });

    $('#btn-scroll').addEventListener('click', () => {
        $('.mode-btn.active').classList.remove('active');
        $('#btn-scroll').classList.add('active');
        store.setState({ viewMode: 'scroll' });
        render();
    });

    // Navigation
    $('#btn-prev').addEventListener('click', () => navigate(-1));
    $('#btn-next').addEventListener('click', () => navigate(1));

    // Keyboard navigation: ← → to turn pages, Cmd/Ctrl+S to save
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { clearSelection(); return; }

        // Don't intercept arrow keys while the textarea is focused
        const focused = document.activeElement;
        const inTextarea = focused === markdownInput;
        const inInput = focused && (focused.tagName === 'INPUT' || focused.tagName === 'SELECT');
        if (inTextarea || inInput) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigate(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            navigate(-1);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveMd();
        }
    });

    // Toolbar init
    initToolbar();

    // Image Panel — data URLs 自动存储为 mm-img://uuid 短引用
    const imagePanel = new ImagePanel((opts) => {
        let src = opts.src;
        // 如果是 data URL（base64图片），存入内存并使用短引用
        if (src.startsWith('data:')) {
            src = storeImage(src);
        }
        const md = buildImageMarkdown({ ...opts, src });

        if (pendingInsert) {
            // Insert relative to selected block (from toolbar ↑🖼 / ↓🖼 buttons)
            const { direction, blockEl } = pendingInsert;
            pendingInsert = null;
            insertImageRelativeToBlock(direction, blockEl, md);
        } else {
            insertAtCursor(markdownInput, md + '\n');
            debouncedRender();
        }
    });
    const btnImage = document.getElementById('btn-image');
    if (btnImage) btnImage.addEventListener('click', () => imagePanel.open());

    // Floating toolbar image insert buttons
    const toolbarInsertAbove = document.getElementById('toolbar-insert-above');
    const toolbarInsertBelow = document.getElementById('toolbar-insert-below');
    if (toolbarInsertAbove) {
        toolbarInsertAbove.addEventListener('click', () => {
            const bid = store.getState().selectedBlockId;
            if (!bid) return;
            const blockEl = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
            if (!blockEl) return;
            pendingInsert = { direction: 'above', blockEl };
            imagePanel.open();
        });
    }
    if (toolbarInsertBelow) {
        toolbarInsertBelow.addEventListener('click', () => {
            const bid = store.getState().selectedBlockId;
            if (!bid) return;
            const blockEl = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
            if (!blockEl) return;
            pendingInsert = { direction: 'below', blockEl };
            imagePanel.open();
        });
    }

    // Figure interaction — event delegation covers dynamically injected action buttons
    previewArea.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        // ── Delete button ────────────────────────────────────────────────────
        if (target.closest('.mm-fig-delete')) {
            const figEl = target.closest('figure.mm-figure') as HTMLElement | null;
            if (figEl) {
                figEl.classList.remove('mm-fig-selected');
                deleteFigureFromMarkdown(figEl);
            }
            e.stopPropagation();
            return;
        }

        // ── Edit button ──────────────────────────────────────────────────────
        if (target.closest('.mm-fig-edit')) {
            const figEl = target.closest('figure.mm-figure') as HTMLElement | null;
            if (figEl) {
                const imgEl = figEl.querySelector('img') as HTMLImageElement | null;
                if (imgEl) {
                    const layout = (['float-left','float-right','full','center'] as const)
                        .find(cls => figEl.classList.contains('mm-' + cls)) || 'center';
                    const widthStr = figEl.style.width || imgEl.style.width || '60%';
                    const width = parseInt(widthStr) || 60;
                    const caption = figEl.querySelector('figcaption')?.textContent || '';
                    figEl.classList.remove('mm-fig-selected');
                    imagePanel.openWithSrc(imgEl.src, { layout, width, alt: imgEl.alt, caption });
                }
            }
            e.stopPropagation();
            return;
        }

        // ── Figure body click → toggle selected state ────────────────────────
        const figEl = target.closest('figure.mm-figure') as HTMLElement | null;
        if (figEl) {
            e.stopPropagation();
            // Deselect all other figures
            previewArea.querySelectorAll('figure.mm-figure.mm-fig-selected').forEach(f => {
                if (f !== figEl) f.classList.remove('mm-fig-selected');
            });
            figEl.classList.toggle('mm-fig-selected');
            return;
        }

        // ── Click on non-figure area → clear all figure selections ───────────
        previewArea.querySelectorAll('figure.mm-figure.mm-fig-selected').forEach(f => {
            f.classList.remove('mm-fig-selected');
        });
    });

    // Print Preview (Paged.js + Han.css)
    const btnPrintPreview = document.getElementById('btn-print-preview');
    if (btnPrintPreview) btnPrintPreview.addEventListener('click', openPrintPreview);

    // Export PNG (current page)
    $('#btn-export').addEventListener('click', exportPng);

    // Export ALL pages
    const btnExportAll = document.getElementById('btn-export-all');
    if (btnExportAll) btnExportAll.addEventListener('click', exportAllPng);

    // Save .md file
    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', saveMd);

    // Reset all settings
    $('#btn-reset').addEventListener('click', () => {
        if (confirm('确定要重置所有排版设置到默认值吗？\n（内容不会清除）')) {
            resetAll();
        }
    });

    // File open
    $<HTMLInputElement>('#file-input').addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (text) {
                markdownInput.value = text;
                $('#char-count').textContent = text.length + ' 字符';
                render();
            }
        };
        reader.readAsText(file, 'utf-8');
        // Reset so same file can be re-loaded
        (e.target as HTMLInputElement).value = '';
    });

    // Initial Load
    loadDefault();
    applyTheme();
    applyGlobalStyles();
}

function navigate(dir: number) {
    const state = store.getState();
    const target = state.currentPage + dir;
    if (target < 1 || target > state.totalPages) return;

    store.setState({ currentPage: target });
    renderPages();
    syncControlsToPage(target);
}

function syncControlsToPage(pageNum: number) {
    const state = store.getState();
    const s = getPageSetting(state, pageNum);

    $<HTMLInputElement>('#ctrl-fontsize').value = String(s.fontSize);
    $('#val-fontsize').textContent = s.fontSize + 'pt';
    $<HTMLInputElement>('#ctrl-lineheight').value = String(s.lineHeight);
    $('#val-lineheight').textContent = s.lineHeight.toFixed(2) + '×';
    $<HTMLInputElement>('#ctrl-letterspacing').value = String(s.letterSpacing);
    $('#val-letterspacing').textContent = s.letterSpacing.toFixed(2) + 'em';
}

function applyGlobalStyles() {
    const s = getFormatBaseSetting(store.getState());
    document.documentElement.style.setProperty('--mm-font-size', s.fontSize + 'px');
    document.documentElement.style.setProperty('--mm-line-height', String(s.lineHeight));
    document.documentElement.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
}

/**
 * Lightweight style-only update: updates CSS vars on existing page elements
 * WITHOUT rebuilding the DOM. Eliminates flicker on slider drag.
 */
function applyStylesOnly() {
    const state = store.getState();
    const s = getFormatBaseSetting(state);
    // Update root vars
    document.documentElement.style.setProperty('--mm-font-size', s.fontSize + 'px');
    document.documentElement.style.setProperty('--mm-line-height', String(s.lineHeight));
    document.documentElement.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
    // Patch all existing page elements directly
    previewArea.querySelectorAll('.page').forEach(page => {
        const p = page as HTMLElement;
        const pageNum = parseInt(p.dataset.page || '1', 10);
        const pageSetting = getPageSetting(state, pageNum);
        p.style.setProperty('--mm-font-size', pageSetting.fontSize + 'px');
        p.style.setProperty('--mm-line-height', String(pageSetting.lineHeight));
        p.style.setProperty('--mm-letter-spacing', pageSetting.letterSpacing + 'em');
    });
}

function applyTheme() {
    const theme = store.getState().theme;
    document.body.dataset.theme = theme;
}

function updatePaginationUI() {
    const state = store.getState();
    paginationBar.style.display = state.viewMode === 'multi' ? 'flex' : 'none';
    pageInfo.textContent = `第 ${state.currentPage} / ${state.totalPages} 页`;
    ($<HTMLButtonElement>('#btn-prev')).disabled = state.currentPage <= 1;
    ($<HTMLButtonElement>('#btn-next')).disabled = state.currentPage >= state.totalPages;
}

function initToolbar() {
    const debouncedApply = debounce(render, 400);
    const finalizeToolbarPagination = () => {
        debouncedApply.cancel();
        render();
    };

    $<HTMLInputElement>('#toolbar-fontsize').addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        updateBlockStyle('fontSize', val);
        $('#toolbar-val-fontsize').textContent = val + 'px';
        debouncedApply();
    });
    $<HTMLInputElement>('#toolbar-fontsize').addEventListener('change', finalizeToolbarPagination);

    $<HTMLInputElement>('#toolbar-lineheight').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateBlockStyle('lineHeight', val);
        $('#toolbar-val-lineheight').textContent = val.toFixed(2);
        debouncedApply();
    });
    $<HTMLInputElement>('#toolbar-lineheight').addEventListener('change', finalizeToolbarPagination);

    $<HTMLInputElement>('#toolbar-letterspacing').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateBlockStyle('letterSpacing', val);
        $('#toolbar-val-letterspacing').textContent = val.toFixed(2);
        debouncedApply();
    });
    $<HTMLInputElement>('#toolbar-letterspacing').addEventListener('change', finalizeToolbarPagination);

    $('#toolbar-close').addEventListener('click', () => {
        toolbar.style.display = 'none';
        store.setState({ selectedBlockId: null });
        selectedBlockIds.clear();
        previewArea.querySelectorAll('.block-editing, .block-selected').forEach(b => {
            b.classList.remove('block-editing', 'block-selected');
        });
    });
}

function updateBlockStyle(prop: keyof PageSetting, val: number) {
    const state = store.getState();
    const bid = state.selectedBlockId;
    if (!bid) return;

    // Collect all selected block IDs (primary + multi-select)
    const allBids = new Set<string>([bid, ...selectedBlockIds]);
    const blockStyles = { ...state.blockOverrides };

    allBids.forEach(id => {
        const el = previewArea.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
        const baseSetting = el ? getBlockBaseSetting(el, state) : getPageSetting(state, state.currentPage);
        blockStyles[id] = {
            ...(blockStyles[id] || baseSetting),
            [prop]: val
        };
        // Instant DOM feedback for all selected blocks
        if (el) {
            if (prop === 'fontSize') el.style.fontSize = val + 'px';
            if (prop === 'lineHeight') el.style.lineHeight = String(val);
            if (prop === 'letterSpacing') el.style.letterSpacing = val + 'em';
        }
    });

    store.setState({ blockOverrides: blockStyles });

    // Reposition toolbar to primary
    const primary = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement;
    if (primary) positionToolbar(primary);
}

async function exportPng() {
    const state = store.getState();

    // In multi-page mode, find the current page by data-page attribute.
    // In scroll mode, the single .page div has no data-page attribute.
    let activePage = state.viewMode === 'multi'
        ? previewArea.querySelector(`.page[data-page="${state.currentPage}"]`) as HTMLElement | null
        : previewArea.querySelector('.page') as HTMLElement | null;

    if (!activePage) {
        alert('没有可导出的页面，请先输入内容');
        return;
    }

    const btn = $('#btn-export') as HTMLButtonElement;
    btn.textContent = '⏳ 导出中...';
    btn.disabled = true;

    try {
        const dataUrl = await htmlToImage.toPng(activePage, {
            pixelRatio: 3,
            backgroundColor: getComputedStyle(activePage).backgroundColor || '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `MagMark-1.4-Page-${state.currentPage}.png`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        console.error('Export failed', e);
        alert('导出失败，请查看控制台错误信息');
    } finally {
        btn.innerHTML = '📸 导出 PNG';
        btn.disabled = false;
    }
}

/**
 * Export ALL pages as separate PNG files (zipped in-browser)
 */
async function exportAllPng() {
    const state = store.getState();
    if (state.viewMode !== 'multi' || state.totalPages === 0) {
        alert('请先切换到分页模式并输入内容');
        return;
    }

    const btn = document.getElementById('btn-export-all') as HTMLButtonElement | null;
    if (btn) { btn.textContent = '⏳ 导出中...'; btn.disabled = true; }

    // Temporarily show all pages so html-to-image can capture them
    const allPages = Array.from(
        previewArea.querySelectorAll('.page[data-page]')
    ) as HTMLElement[];

    // Show all pages temporarily
    allPages.forEach(p => (p.style.display = 'block'));

    const links: HTMLAnchorElement[] = [];
    for (let i = 0; i < allPages.length; i++) {
        try {
            const dataUrl = await htmlToImage.toPng(allPages[i], {
                pixelRatio: 3,
                backgroundColor: getComputedStyle(allPages[i]).backgroundColor || '#ffffff',
            });
            const a = document.createElement('a');
            a.download = `MagMark-Page-${i + 1}.png`;
            a.href = dataUrl;
            links.push(a);
        } catch (e) {
            console.error(`Page ${i + 1} export failed`, e);
        }
    }

    // Restore visibility
    allPages.forEach((p, i) => {
        const pNum = parseInt(p.dataset.page || '0');
        p.style.display = pNum === state.currentPage ? 'block' : 'none';
    });

    // Trigger all downloads (staggered to avoid browser blocking)
    for (let i = 0; i < links.length; i++) {
        await new Promise<void>(res => setTimeout(() => { links[i].click(); res(); }, i * 200));
    }

    if (btn) { btn.textContent = '🗂 导出全部'; btn.disabled = false; }
}

/**
 * Save current Markdown content as a .md file
 */
function saveMd() {
    const content = markdownInput.value;
    if (!content.trim()) { alert('内容为空，无法保存'); return; }
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MagMark-' + new Date().toISOString().slice(0, 10) + '.md';
    a.click();
    URL.revokeObjectURL(url);
}


function loadDefault() {
    markdownInput.value = `# MagMark 1.4 🎨✨

**世界级杂志级 Markdown 排版引擎 — 终极优化版**

将您的 Markdown 转换为具备专业字体排版、智能分页和高精度导出的出版级文档。MagMark 1.4 彻底革新了导出流水线，带来了媲美《VOGUE》等高端纸媒的视觉体验。

## 🏷️ 为什么叫 MagMark？

**MagMark** 是由两个核心概念组合而成的：

- **Mag** (取自 **Magazine**)：打破 Markdown 预览"简陋"的印象，赋予文字现代杂志感。
- **Mark** (取自 **Markdown**)：坚持轻量级创作体验，让您专注于内容本身。

**MagMark = 像写 Markdown 一样简单，像做杂志一样精美。**

---

## 🚀 1.4 核心升级

### 🎞️ 彻底抛弃 PDF 中间层
直接采用 **高精度 Canvas + SVG 混合采样**，输出 3x 超采样 600DPI 级别超清 PNG，字体嵌入完美，所见即所得。

### 🖱️ 块级点击浮动微调 ✨
**像编辑纸媒一样编辑预览！** 点击任何段落，立即激活浮动工具栏，支持 Shift 点击与拖拽框选多块同步调整。

### 🎨 11 套专业主题
覆盖从东方金石到北欧极简，从科幻科技到自然植物的全系列设计风格，一键切换风格。

### 📄 智能分页控制
- 手动分页：\`---\` 仅在开启"手动分页"时生效
- 单页独立样式：每页可独立设置字号、行距
- 预览比例：50% ～ 150% 自由缩放

---

## 🛠️ 本地开发

\`\`\`bash
npm install
npm run dev
\`\`\`

访问 http://localhost:5173 开启排版之旅。

---

**为追求极致排版美学的创作者而生 ❤️**

*MagMark 1.4 · 2026*
`;
    render();
}

// Start the App
init();
window.addEventListener('resize', () => {
    const selected = store.getState().selectedBlockId;
    if (selected) {
        const el = previewArea.querySelector(`[data-block-id="${selected}"]`) as HTMLElement;
        if (el) positionToolbar(el);
    }
});

/**
 * Reset all settings to factory defaults
 */
function resetAll() {
    const a4Defaults = getFormatDefaultSetting('a4');
    const defaults = {
        fontSize: a4Defaults.fontSize,
        lineHeight: a4Defaults.lineHeight,
        letterSpacing: a4Defaults.letterSpacing,
        fontFamily: "'Source Han Serif SC', 'Noto Serif SC', serif",
        format: 'a4' as AppState['format'],
        viewMode: 'multi' as AppState['viewMode'],
        manualPagination: false,
        showParagraphDividers: false,
        theme: 'elite',
        scale: 1,
        pageOverrides: {} as Record<number, any>,
        blockOverrides: {} as Record<string, any>,
        selectedBlockId: null,
        currentPage: 1,
    };
    store.setState(defaults);

    // Sync UI controls
    $<HTMLInputElement>('#ctrl-fontsize').value = String(defaults.fontSize);
    $('#val-fontsize').textContent = defaults.fontSize + 'pt';
    $<HTMLInputElement>('#ctrl-lineheight').value = String(defaults.lineHeight);
    $('#val-lineheight').textContent = defaults.lineHeight.toFixed(2) + '×';
    $<HTMLInputElement>('#ctrl-letterspacing').value = String(defaults.letterSpacing);
    $('#val-letterspacing').textContent = defaults.letterSpacing.toFixed(2) + 'em';
    $<HTMLSelectElement>('#ctrl-font').value = defaults.fontFamily;
    $<HTMLSelectElement>('#ctrl-format').value = defaults.format;
    $<HTMLSelectElement>('#ctrl-scale').value = String(defaults.scale);
    $<HTMLSelectElement>('#ctrl-theme').value = defaults.theme;
    $<HTMLInputElement>('#chk-manual-pagination').checked = false;
    $<HTMLInputElement>('#chk-show-paragraph-dividers').checked = false;
    $<HTMLInputElement>('#chk-page-override').checked = false;

    // Reset mode buttons
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    $('#btn-multi').classList.add('active');

    // Reset user font override
    document.documentElement.style.removeProperty('--user-font-family');

    applyTheme();
    applyGlobalStyles();
    render();
}

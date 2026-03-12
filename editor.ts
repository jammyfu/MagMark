import { store, AppState, PageSetting, getFormatDefaultSetting } from './src/core/state';
import { paginate, getPageDimensions } from './src/engine/layout';
import * as htmlToImage from 'html-to-image';
import { ImagePanel, buildImageMarkdown } from './src/image/image-panel';
import { CoverPanel } from './src/cover/cover-panel';
import { version } from './package.json';

// Module-level cover HTML (null = no cover)
let coverHtml: string | null = null;

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
 * MagMark 1.6.0 - Professional Refactored Entry
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

/**
 * Update UI version strings from package.json
 */
function updateUIVersion() {
    document.title = `MagMark ${version} — Ultra-Precision Magazine Markdown Editor`;
    const logoVersion = $('.logo-version');
    if (logoVersion) logoVersion.textContent = version;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', metaDesc.getAttribute('content')!.replace(/MagMark [\d\.]+/, `MagMark ${version}`));
    }
}
updateUIVersion();

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
async function render(stabilized = false) {
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

        renderPages(stabilized);
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
function renderPages(stabilized = false) {
    const state = store.getState();
    const magmarkClass = state.showParagraphDividers ? 'magmark' : 'magmark magmark-hide-paragraph-dividers';
    const shouldFade = !stabilized;

    if (shouldFade) {
        // Only hide the preview on the first pass. The stabilized pass should
        // swap in quietly so format/theme switches do not visibly double-flash.
        previewArea.style.opacity = '0';
        previewArea.style.transition = 'opacity 0.12s ease';
    }

    // Use requestAnimationFrame to allow paint before rebuilding
    requestAnimationFrame(() => {
        previewArea.innerHTML = '';

        // ── Render cover page first if one is set ──────────────────────
        if (coverHtml) {
            const coverPage = document.createElement('div');
            const formatClass = 'page-' + state.format;
            coverPage.className = `page ${formatClass} mm-cover-page`;
            coverPage.dataset.page = '0';
            // Cover is visible only on page 0; real pages start at 1
            const isCurrent = state.currentPage === 0;
            coverPage.style.display = isCurrent ? 'block' : 'none';
            coverPage.style.setProperty('--page-scale', String(state.scale));
            coverPage.style.marginBottom = `${Math.max(0, getPageDimensions(state.format).h * state.scale - getPageDimensions(state.format).h) + 32}px`;
            coverPage.innerHTML = `<div class="mm-cover-wrap" style="width:100%;height:100%;overflow:hidden;">${coverHtml}</div>
                <button class="mm-cover-remove-btn" title="移除封面">✕</button>`;
            coverPage.querySelector('.mm-cover-remove-btn')!.addEventListener('click', (e) => {
                e.stopPropagation();
                coverHtml = null;
                updateCoverBtn();
                render();
            });
            previewArea.appendChild(coverPage);
        }

        state.pageHtmls.forEach((pageData, i) => {
            const pageNum = i + 1;
            const page = document.createElement('div');
            const formatClass = 'page-' + state.format;
            page.className = `page ${formatClass}`;
            page.dataset.page = String(pageNum);
            page.style.display = pageNum === state.currentPage ? 'block' : 'none';

            const scale = state.scale;
            page.style.setProperty('--page-scale', String(scale));
            page.style.marginBottom = `${Math.max(0, getPageDimensions(state.format).h * scale - getPageDimensions(state.format).h) + 32}px`;

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
        fixRenderedPageImages();

        // Run Han.css after DOM is attached. If we need a stabilization pass,
        // keep this first paint hidden and reveal only after the final pass.
        requestAnimationFrame(() => {
            initHanTypography();
            // Han.css 会插入额外排印节点，初始化后高度可能变化。
            // 对分页视图补做一次稳定化分页，避免“初始化能塞下，缩放后却换页”。
            if (!stabilized && store.getState().viewMode === 'multi') {
                requestAnimationFrame(() => render(true));
                return;
            }
            previewArea.style.opacity = '1';
        });
    });
}

/**
 * After rendering pages into the DOM, ensure images that fail to load (404 or
 * cross-origin block) don't silently collapse to 0-height and break the layout.
 * For each <img> in the preview area:
 *   • If already broken  → apply fallback size immediately
 *   • If still loading   → attach an onerror handler
 * The fallback size matches what fixImageDimensions() uses for the measurer,
 * so the pagination reservations and visual output stay consistent.
 */
function fixRenderedPageImages(): void {
    previewArea.querySelectorAll<HTMLImageElement>('img').forEach(img => {
        const containerW = () => img.closest('.page-content')?.clientWidth || 400;

        const applyFallback = () => {
            if (img.naturalWidth > 0) return; // already decoded successfully
            img.style.width      = '100%';
            img.style.height     = Math.round(containerW() * 9 / 16) + 'px';
            img.style.background = 'rgba(128,128,128,0.06)';
            img.style.borderRadius = '8px';
        };

        const clearFallback = () => {
            img.style.width      = '';
            img.style.height     = '';
            img.style.background = '';
            img.style.borderRadius = '';
        };

        if (img.complete) {
            // Already decoded (success or error)
            if (img.naturalWidth === 0) applyFallback();
        } else {
            // Not yet decoded — apply placeholder immediately so the page doesn't
            // collapse the image to 0-height while loading
            applyFallback();
            img.addEventListener('load',  clearFallback, { once: true });
            img.addEventListener('error', applyFallback, { once: true });
        }
    });
}

function renderScroll(md: string) {
    const html = convertMarkdown(md);
    const state = store.getState();
    const formatClass = 'page-' + state.format;
    const magmarkClass = state.showParagraphDividers ? 'magmark' : 'magmark magmark-hide-paragraph-dividers';
    previewArea.innerHTML = `
        <div class="page ${formatClass} scrollable" style="--page-scale:${state.scale};transform:scale(var(--page-scale));margin-bottom:${Math.max(0, getPageDimensions(state.format).h * state.scale - getPageDimensions(state.format).h) + 32}px">
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
            if ((e.target as HTMLElement).closest('.mm-fig-actions')) return;
            // Don't intercept clicks on resize handles — let pointerdown handle them
            if ((e.target as HTMLElement).closest('.mm-fig-handle')) return;
            e.stopPropagation();

            // ── Figure: toggle resize handles selection ────────────────────
            if (b.classList.contains('mm-figure')) {
                previewArea.querySelectorAll('figure.mm-figure.mm-fig-selected').forEach(f => {
                    if (f !== b) f.classList.remove('mm-fig-selected');
                });
                b.classList.toggle('mm-fig-selected');
            } else {
                // Non-figure block clicked → clear all figure selections
                previewArea.querySelectorAll('figure.mm-figure.mm-fig-selected').forEach(f => {
                    f.classList.remove('mm-fig-selected');
                });
            }

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
    const isSingleFigure = elArray.length === 1 && primary.classList.contains('mm-figure');
    toolbar.querySelectorAll<HTMLElement>('.toolbar-typography-item').forEach(item => {
        item.style.display = isSingleFigure ? 'none' : 'flex';
    });
    const imageToolbar = toolbar.querySelector<HTMLElement>('#toolbar-image-align');
    if (imageToolbar) imageToolbar.style.display = isSingleFigure ? 'flex' : 'none';

    if (isSingleFigure) {
        const activeLayout = (['float-left', 'center', 'float-right', 'full'] as const)
            .find(layout => primary.classList.contains(`mm-${layout}`)) || 'center';
        toolbar.querySelectorAll<HTMLElement>('.toolbar-align-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `toolbar-align-${activeLayout.replace('float-', '')}`);
        });
        return;
    }

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
function stripFrontmatter(md: string): string {
    // Strip YAML frontmatter: starts with `---` on line 1, ends with `---`
    const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    return match ? md.slice(match[0].length) : md;
}

function convertMarkdown(md: string): string {
    const lines = stripFrontmatter(md).replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    let i = 0;

    /** Helpers ──────────────────────────────────────────── */
    const isBlank = (l: string) => l.trim() === '';
    const isHrLine = (l: string) => /^(\*{3,}|-{3,}|_{3,})\s*$/.test(l.trim());
    const isHeading = (l: string) => /^#{1,6} /.test(l);
    const isFence = (l: string) => l.startsWith('```') || l.startsWith('~~~');
    const isQuote = (l: string) => l.startsWith('>');
    const isTable = (l: string) => l.startsWith('|');
    const isUlItem = (l: string) => /^(\s*)[-*+] /.test(l);
    const isOlItem = (l: string) => /^(\s*)\d+\. /.test(l);
    const isListItem = (l: string) => isUlItem(l) || isOlItem(l);
    // 独立图片行：整行内容只有一个图片标记（可带 {attrs}），作为块级 <figure>
    const isFigureLine = (l: string) =>
        /^\s*!\[[^\]]*\]\([^)]+\)(\{[^}]*\})?\s*$/.test(l);
    const isBlockStop = (l: string) =>
        isBlank(l) || isHeading(l) || isFence(l) || isQuote(l) ||
        isTable(l) || isListItem(l) || isHrLine(l) || isFigureLine(l);

    // ── Fenced code block ─────────────────────────────────
    function parseFenceBlock(): string {
        const opener = lines[i];
        const fence = opener.startsWith('~~~') ? '~~~' : '```';
        const lang = opener.slice(fence.length).trim().split(/\s+/)[0] || '';
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
        // Row 1 is separator — parse alignment (:---|:---:|---:)
        const sepCells = parseCells(tableLines[1]);
        const aligns = sepCells.map(sep => {
            const s = sep.trim();
            if (s.startsWith(':') && s.endsWith(':')) return 'center';
            if (s.endsWith(':')) return 'right';
            return 'left';
        });
        const dataRows = tableLines.slice(2);

        const alignAttr = (idx: number) => {
            const a = aligns[idx];
            return a && a !== 'left' ? ` style="text-align:${a}"` : '';
        };

        const thead = `<thead><tr>${headerCells.map((c, j) =>
            `<th${alignAttr(j)}>${inlineMarkdown(c)}</th>`).join('')}</tr></thead>`;
        const tbody = dataRows.length
            ? `<tbody>${dataRows.map(row =>
                `<tr>${parseCells(row).map((c, j) =>
                    `<td${alignAttr(j)}>${inlineMarkdown(c)}</td>`).join('')}</tr>`
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
                let isTask = false;
                let checked = false;

                // Task list item
                if (ulMatch && ulMatch[1]) {
                    isTask = true;
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
    // Badge line: entire line is a linked image  [![alt](img)](link)
    const isBadgeLine = (l: string) =>
        /^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)\s*$/.test(l.trim());

    function parseParagraph(): string {
        const rawLines: string[] = [];
        const paraLines: string[] = [];
        while (i < lines.length && !isBlockStop(lines[i])) {
            rawLines.push(lines[i]);
            paraLines.push(inlineMarkdown(lines[i]));
            i++;
        }
        if (!paraLines.length) return '';
        // Badge row: all lines are linked-image (shields.io style) → inline flex
        if (rawLines.length > 0 && rawLines.every(isBadgeLine)) {
            return `<p class="mm-badge-row">${paraLines.join(' ')}</p>`;
        }
        return `<p>${paraLines.join('<br>')}</p>`;
    }

    // ── Main parsing loop ─────────────────────────────────
    while (i < lines.length) {
        const line = lines[i];

        if (isBlank(line)) { i++; continue; }

        // Fenced code block
        if (isFence(line)) { blocks.push(parseFenceBlock()); continue; }

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
        if (isQuote(line)) { blocks.push(parseBlockquote()); continue; }

        // Table
        if (isTable(line)) { blocks.push(parseTable()); continue; }

        // Unordered list
        if (isUlItem(line)) { blocks.push(parseList(false)); continue; }

        // Ordered list
        if (isOlItem(line)) { blocks.push(parseList(true)); continue; }

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

    const figStyle = width && layout !== 'full'
        ? ` style="width:${escapeAttr(width)}"`
        : '';
    const imgStyle = (layout === 'full' || !!width)
        ? ' style="width:100%;height:auto"'
        : '';
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    // Use explicit caption if provided, otherwise use alt (if non-empty and not a UUID ref)
    const displayCaption = caption || (alt && !alt.startsWith('mm-img://') ? alt : '');
    const captionHtml = displayCaption
        ? `<figcaption>${escapeHtml(displayCaption)}</figcaption>`
        : '';

    // data-mm-src stores the ORIGINAL (unresolved) src so deletion can search the markdown directly
    return `<figure class="mm-figure mm-${layout}"${figStyle} data-mm-src="${escapeAttr(src)}">` +
        `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${titleAttr}${imgStyle}>` +
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
                return `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${style}>`;
            })
        // Plain image — resolve mm-img:// if needed
        .replace(/!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/g,
            (_, alt, src, title) => {
                const t = title ? ` title="${escapeAttr(title)}"` : '';
                const resolvedSrc = resolveImageSrc(src);
                return `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}"${t}>`;
            })
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Inline code (before bold/italic to protect content)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold + italic
        .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
        .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
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
                renderPages(true);
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
    const mmFontSize = rootStyle.getPropertyValue('--mm-font-size').trim() || '14px';
    const mmLineHeight = rootStyle.getPropertyValue('--mm-line-height').trim() || '1.75';
    const mmLetterSpacing = rootStyle.getPropertyValue('--mm-letter-spacing').trim() || '0.01em';
    const userFont = rootStyle.getPropertyValue('--user-font-family').trim();
    const thFontBody = rootStyle.getPropertyValue('--th-font-body').trim();
    const mmFontFamily = rootStyle.getPropertyValue('--mm-font-family').trim() || "'Source Han Serif SC', serif";
    const effectiveFont = userFont || thFontBody || mmFontFamily;
    const thPrimary = rootStyle.getPropertyValue('--th-primary').trim() || '#d4af37';
    const thAccent = rootStyle.getPropertyValue('--th-accent').trim() || '#e67e22';
    const thBgPage = rootStyle.getPropertyValue('--th-bg-page').trim() || '#ffffff';
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

/* ── Badge 行 (shields.io 等行内徽章) ──────── */
.mm-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
    margin: 0.3em 0 0.1em;
    line-height: 1;
}
.mm-badge-row img {
    display: inline-block;
    margin: 0;
    border-radius: 3px;
    vertical-align: middle;
    height: auto;
}
.mm-badge-row + figure {
    margin-top: 0.5em;
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
    const end = ta.selectionEnd ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
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
    const searchKey = blockText.slice(0, 30);

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
    const after = lines.slice(insertAfterLine + 1).join('\n');

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
        // Resize handles (8-point, PS style) — only injected once per figure
        if (!figEl.querySelector('.mm-fig-handles')) {
            const handles = document.createElement('div');
            handles.className = 'mm-fig-handles';
            handles.innerHTML =
                '<div class="mm-fig-handle" data-dir="nw"></div>' +
                '<div class="mm-fig-handle" data-dir="n"></div>' +
                '<div class="mm-fig-handle" data-dir="ne"></div>' +
                '<div class="mm-fig-handle" data-dir="e"></div>' +
                '<div class="mm-fig-handle" data-dir="se"></div>' +
                '<div class="mm-fig-handle" data-dir="s"></div>' +
                '<div class="mm-fig-handle" data-dir="sw"></div>' +
                '<div class="mm-fig-handle" data-dir="w"></div>';
            figEl.appendChild(handles);
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
    const after = lines.slice(targetLine + 1).join('\n').trimStart();
    const newMd = before && after ? before + '\n\n' + after
        : (before || after).trim();

    markdownInput.value = newMd;
    markdownInput.dispatchEvent(new Event('input'));
    debouncedRender();
}

/**
 * Update the width attribute of a figure's markdown source line.
 * Called after a resize drag completes to persist the new size.
 */
function updateFigureWidthInMarkdown(figEl: HTMLElement, widthStr: string) {
    const originalSrc = figEl.dataset.mmSrc || '';
    const imgEl = figEl.querySelector('img') as HTMLImageElement | null;
    const alt = imgEl?.alt || '';

    // Determine current layout class
    const layout = (['float-left', 'float-right', 'full', 'center'] as const)
        .find(cls => figEl.classList.contains('mm-' + cls)) || 'center';

    const md = markdownInput.value;
    const lines = md.split('\n');

    let targetLine = -1;
    for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (!line.includes('![')) continue;
        if (originalSrc && line.includes(originalSrc)) { targetLine = j; break; }
        if (alt && line.includes(`![${alt}]`)) { targetLine = j; break; }
    }
    if (targetLine === -1) return;

    const line = lines[targetLine];
    let newLine: string;
    if (line.includes('{')) {
        // Update width inside existing {attrs}
        newLine = line.replace(/\{([^}]*)\}/, (_match, inner) => {
            const updated = inner.includes('width=')
                ? inner.replace(/width=\S+/, `width=${widthStr}`)
                : (inner.trim() ? `${inner.trim()} width=${widthStr}` : `width=${widthStr}`);
            return `{${updated}}`;
        });
    } else {
        // Append new attrs  — keep layout if non-default
        const attrContent = layout !== 'center'
            ? `.${layout} width=${widthStr}`
            : `width=${widthStr}`;
        newLine = line.trimEnd() + `{${attrContent}}`;
    }
    lines[targetLine] = newLine;
    markdownInput.value = lines.join('\n');
    markdownInput.dispatchEvent(new Event('input'));
    debouncedRender();
}

function updateFigureLayoutInMarkdown(figEl: HTMLElement, layout: 'float-left' | 'center' | 'float-right' | 'full') {
    const originalSrc = figEl.dataset.mmSrc || '';
    const imgEl = figEl.querySelector('img') as HTMLImageElement | null;
    const alt = imgEl?.alt || '';
    const md = markdownInput.value;
    const lines = md.split('\n');

    let targetLine = -1;
    for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (!line.includes('![')) continue;
        if (originalSrc && line.includes(originalSrc)) { targetLine = j; break; }
        if (alt && line.includes(`![${alt}]`)) { targetLine = j; break; }
    }
    if (targetLine === -1) return;

    const line = lines[targetLine];
    const layoutToken = layout === 'center' ? '' : `.${layout}`;
    let newLine: string;

    if (line.includes('{')) {
        newLine = line.replace(/\{([^}]*)\}/, (_match, inner) => {
            const tokens = inner
                .split(/\s+/)
                .filter(Boolean)
                .filter(token => !['.float-left', '.float-right', '.full', '.center'].includes(token));
            if (layoutToken) tokens.unshift(layoutToken);
            return `{${tokens.join(' ')}}`;
        });
    } else {
        newLine = layoutToken ? `${line.trimEnd()}{${layoutToken}}` : line;
    }

    lines[targetLine] = newLine;
    markdownInput.value = lines.join('\n');
    markdownInput.dispatchEvent(new Event('input'));
    debouncedRender();
}

// ── Resize drag state ──────────────────────────────────────────────────────
interface FigResizeDrag {
    figEl: HTMLElement;
    dir: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    pageW: number;
    scale: number;
}
let figResizeDrag: FigResizeDrag | null = null;

// ── Cover helpers ────────────────────────────────────────────────────────────
function updateCoverBtn() {
    const btn = document.getElementById('btn-cover');
    if (!btn) return;
    if (coverHtml) {
        btn.classList.add('has-cover');
        btn.title = '封面已设置（点击重新生成）';
    } else {
        btn.classList.remove('has-cover');
        btn.title = '生成封面';
    }
}

// ── Zoom helpers ────────────────────────────────────────────────────────────
function syncZoomUI(scale: number) {
    const pct = Math.round(scale * 100);
    const input = document.getElementById('zoom-value') as HTMLInputElement | null;
    if (input) input.value = String(pct);
}

function getRequestedZoomScale(): number {
    const input = document.getElementById('zoom-value') as HTMLInputElement | null;
    const typedPct = input ? parseFloat(input.value) : NaN;
    if (!Number.isNaN(typedPct) && typedPct > 0) {
        return typedPct / 100;
    }
    return store.getState().scale;
}

function applyZoom(scale: number) {
    const clamped = Math.min(3, Math.max(0.25, Math.round(scale * 100) / 100));
    store.setState({ scale: clamped });
    syncZoomUI(clamped);
    const state = store.getState();
    if (state.viewMode === 'multi') {
        renderPages(true);
    } else {
        renderScroll(markdownInput.value);
    }
}

function computeFitScale(): number {
    const dims = getPageDimensions(store.getState().format);
    const availW = previewArea.clientWidth - 64; // 32px padding each side
    const raw = availW / dims.w;
    // Round down to nearest 5%
    return Math.floor(raw * 20) / 20;
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
        // Auto-suggest best font for format
        const FORMAT_FONT_MAP: Partial<Record<AppState['format'], string>> = {
            xiaohongshu: "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
            mobile:      "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
            a4:          "'Source Han Serif SC', 'Noto Serif SC', serif",
            desktop:     "'Source Han Serif SC', 'Noto Serif SC', serif",
        };
        const autoFont = FORMAT_FONT_MAP[fmt] || "'Source Han Serif SC', 'Noto Serif SC', serif";
        store.setState({
            format: fmt,
            fontSize: formatSetting.fontSize,
            lineHeight: formatSetting.lineHeight,
            letterSpacing: formatSetting.letterSpacing,
            fontFamily: autoFont,
            pageOverrides: {},
            blockOverrides: {},
            currentPage: 1,
            scale: autoScale,
        });
        // Sync zoom input to auto-scale
        syncZoomUI(autoScale);
        // Sync font selector to auto-font
        $<HTMLSelectElement>('#ctrl-font').value = autoFont;
        document.documentElement.style.setProperty('--user-font-family', autoFont);
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

    // Zoom controls (Photoshop-style)
    $('#zoom-out').addEventListener('click', () => applyZoom(getRequestedZoomScale() - 0.1));
    $('#zoom-in').addEventListener('click',  () => applyZoom(getRequestedZoomScale() + 0.1));
    $('#zoom-100').addEventListener('click', () => applyZoom(1));
    $('#zoom-fit').addEventListener('click', () => applyZoom(computeFitScale()));
    const zoomInput = $<HTMLInputElement>('#zoom-value');
    zoomInput.addEventListener('change', (e) => {
        const pct = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(pct)) applyZoom(pct / 100);
    });
    zoomInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const pct = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(pct)) applyZoom(pct / 100);
            (e.target as HTMLInputElement).blur();
        }
    });

    // Ctrl/Cmd + scroll wheel to zoom
    previewArea.addEventListener('wheel', (e) => {
        const mod = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey;
        if (!mod) return;
        e.preventDefault();
        applyZoom(store.getState().scale + (e.deltaY < 0 ? 0.05 : -0.05));
    }, { passive: false });

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

        // Zoom shortcuts (work even in textarea context)
        const mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === '=' || e.key === '+')) {
            e.preventDefault(); applyZoom(store.getState().scale + 0.1); return;
        } else if (mod && e.key === '-') {
            e.preventDefault(); applyZoom(store.getState().scale - 0.1); return;
        } else if (mod && e.key === '0') {
            e.preventDefault(); applyZoom(computeFitScale()); return;
        } else if (mod && e.key === '1') {
            e.preventDefault(); applyZoom(1); return;
        }

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

    // Cover Panel
    const coverPanel = new CoverPanel((html) => {
        coverHtml = html;
        updateCoverBtn();
        render();
    });

    $('#btn-cover').addEventListener('click', () => {
        // Auto-extract title from first H1 in markdown
        const md = markdownInput.value;
        const titleMatch = md.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : '';
        coverPanel.open(title);
    });

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

    [
        ['toolbar-align-left', 'float-left'],
        ['toolbar-align-center', 'center'],
        ['toolbar-align-right', 'float-right'],
        ['toolbar-align-full', 'full'],
    ].forEach(([id, layout]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', () => {
            const bid = store.getState().selectedBlockId;
            if (!bid) return;
            const figEl = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
            if (!figEl || !figEl.classList.contains('mm-figure')) return;

            figEl.classList.remove('mm-float-left', 'mm-center', 'mm-float-right', 'mm-full');
            figEl.classList.add(`mm-${layout}`);
            updateFigureLayoutInMarkdown(figEl, layout as 'float-left' | 'center' | 'float-right' | 'full');
            showToolbar(figEl);
            render();
        });
    });

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
                    const layout = (['float-left', 'float-right', 'full', 'center'] as const)
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

    // ── Figure resize drag (PS-style handles) ────────────────────────────────
    previewArea.addEventListener('pointerdown', (e) => {
        const handle = (e.target as HTMLElement).closest('.mm-fig-handle') as HTMLElement | null;
        if (!handle) return;
        const figEl = handle.closest('figure.mm-figure') as HTMLElement | null;
        if (!figEl) return;

        const dir = handle.dataset.dir || 'se';
        const scale = store.getState().scale;
        const pageContent = figEl.closest('.page-content') as HTMLElement | null;
        const pageW = pageContent ? pageContent.clientWidth : 400;

        figResizeDrag = {
            figEl, dir,
            startX: e.clientX,
            startY: e.clientY,
            startW: figEl.clientWidth,
            startH: figEl.clientHeight,
            pageW, scale,
        };
        figEl.classList.add('mm-fig-resizing');
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('pointermove', (e) => {
        if (!figResizeDrag) return;
        const { figEl, dir, startX, startY, startW, startH, pageW, scale } = figResizeDrag;

        // Convert viewport px → layout px (account for page scale transform)
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;

        let newW = startW;
        if (dir.includes('e'))       newW = startW + dx;
        else if (dir.includes('w')) newW = startW - dx;
        else if (dir === 's')       newW = startW + dy * (startW / Math.max(startH, 1));
        else if (dir === 'n')       newW = startW - dy * (startW / Math.max(startH, 1));

        const pct = Math.round((newW / pageW) * 100);
        const clamped = Math.max(15, Math.min(100, pct));

        // Live preview — inline style on figure
        figEl.style.width = clamped + '%';
        const imgEl = figEl.querySelector('img') as HTMLImageElement | null;
        if (imgEl) { imgEl.style.width = '100%'; imgEl.style.height = 'auto'; }

        e.preventDefault();
    });

    document.addEventListener('pointerup', () => {
        if (!figResizeDrag) return;
        const { figEl, pageW } = figResizeDrag;
        figResizeDrag = null;
        figEl.classList.remove('mm-fig-resizing');

        const finalPct = Math.round((figEl.clientWidth / pageW) * 100);
        const clampedPct = Math.max(15, Math.min(100, finalPct));
        updateFigureWidthInMarkdown(figEl, clampedPct + '%');
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
    renderPages(true);
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
        link.download = `MagMark-${version}-Page-${state.currentPage}.png`;
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
    markdownInput.value = `# MagMark 1.6.0 🎨✨

**世界级杂志级 Markdown 排版引擎 — CJK 高精度排印版**

将您的 Markdown 转换为具备专业字体排版、智能分页和高精度导出的出版级文档。MagMark 1.6 引入封面生成器全面升级，并继承 Han.css + Paged.js + Vivliostyle CSS 三层排版增强，带来媲美《VOGUE》等高端纸媒的中文视觉体验。

[![版本](https://img.shields.io/badge/version-1.6.0-gold.svg)](https://github.com/jammyfu/MagMark)
[![许可](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![MagMark 编辑器预览](screenshots/magmark-main.png)

---

## 🏷️ 为什么叫 MagMark？

**MagMark** 是由两个核心概念组合而成的：

- **Mag** (取自 **Magazine**)：打破 Markdown 预览"简陋"的印象，赋予文字具有现代杂志感的排版美学。
- **Mark** (取自 **Markdown**)：坚持轻量级、纯文本的创作体验，让您专注于内容。

**MagMark = 像写 Markdown 一样简单，像做杂志一样精美。**

---

## 🆕 1.6.0 新增：封面生成器全面升级

### 🖼 封面比例自由出图

封面生成面板比例选择逻辑与图片插入面板完全对齐：

- **10 档比例**：9:16 → 21:9，覆盖竖版（小红书/微信）、方形、横版（PPT/公众号封面）全场景
- **可视比例框**：实时直观显示当前比例，支持一键翻转横/竖
- **滑杆 + 分类按钮**：「竖向 / 方形 / 横向」快速跳转 + 精细滑动选择
- **预览随比例自适应**：切换比例时，预览框平滑过渡，无需重新生成

### ✦ 标题 / 副标题可拖拽定位

- 预览区中，标题与副标题元素显示金色虚线轮廓，**鼠标直接拖拽**即可调整位置
- 使用 CSS \`transform: translate()\` 叠加偏移，不破坏模板原始布局
- **拖拽位置随插入保留**：最终插入文章的 HTML 完整包含位置信息
- 输入文字实时更新（直接操作 iframe DOM），**拖拽后再改文字，位置不丢失**

---

## 🆕 1.5.0 核心升级：三层 CJK 排版增强

### 1. 🈶 Han.css — 汉字高精度排印

集成 [Han.css v3](https://hanzi.pro/) 开源排版框架，对预览内容进行深度 CJK 处理：

- **汉字↔拉丁字间距**：自动在中文与英文/数字之间插入 1/4 em 间距，告别"中英文混排拥挤感"。
- **标点宽度压缩**：句号、逗号、顿号等全角标点不再占据完整字宽，版面更紧凑匀称。
- **引号悬挂**：「」『』等 CJK 引号正确向行首/行末悬挂，实现光学对齐。
- **OpenType 字距**：启用 \`kern\`、\`liga\`、\`calt\`、\`locl\` 特性，在支持的字体（如思源宋体）上实现亚像素级字距微调。

### 2. 🖨 Paged.js — CSS Paged Media 打印预览

新增"🖨 打印预览"按钮，在独立弹出窗口中加载 [Paged.js](https://pagedjs.org/) polyfill：

- **\`@page\` 规则完整支持**：A4 页面边距 22mm/18mm/28mm，首页特殊处理，左右页面交替内侧边距（适合装订）。
- **CSS 页脚页码**：\`@bottom-center\` 自动注入 \`PAGE n / total\` 样式页码。
- **全主题继承**：自动读取编辑器当前主题色变量，打印预览与编辑器视觉完全一致。
- **打印预览同时启用 Han.css**：Paged.js 分页完成后触发 Han.js 排印处理，中文输出质量达到印刷标准。

### 3. 📐 Vivliostyle CSS — 孤行寡行 & 分页规则

采用 [Vivliostyle](https://vivliostyle.org/) 排版标准中的 CSS 分页规则：

- **孤行/寡行控制**：\`orphans: 3; widows: 3\` 防止段落首行或末行孤立在页底/页顶。
- **标题防分页**：\`break-after: avoid\` 确保标题后至少跟随一段正文，不出现"标题挂在页尾"的情况。
- **代码块/表格完整性**：\`break-inside: avoid\` 防止代码块和表格在中间被分页打断。
- **\`@media print\`**：浏览器原生打印时自动隐藏编辑器 UI，仅输出页面内容，\`print-color-adjust: exact\` 保证主题背景色正确打印。

### 4. 🔧 word-break 关键修复

修复了原版中错误的 \`word-break: break-all\` 设置（该值会将英文单词在任意字符处强制折断）：

| | 修改前 | 修改后 |
|---|---|---|
| \`word-break\` | \`break-all\` ❌ | \`normal\` ✅ |
| 溢出处理 | — | \`overflow-wrap: break-word\` ✅ |
| CJK 禁则 | — | \`line-break: strict\` ✅ |
| 行末标点悬挂 | \`first last\` | \`first last\` ✅ |

---

## 🚀 1.4 核心功能（继承）

### 🎞️ 高精度 Canvas 导出
直接采用 **3× 超采样**，输出 600DPI 级别超清 PNG，字体嵌入完美，所见即所得。

### 🖱️ 块级点击浮动微调
点击任何段落，立即激活浮动工具栏，支持 Shift 点击与拖拽框选多块同步调整字号、行高、字间距。

### 🎨 11 套专业主题
覆盖从东方金石到北欧极简的全系列风格，主题色自动传递至打印预览和导出。

### 📄 智能分页控制
手动/自动分页、单页独立样式、50%～150% 自由缩放预览。

---

## ✨ 完整特性列表

| 特性 | 说明 |
|---|---|
| Han.css CJK 排印 | 字间距、标点压缩、引号悬挂 |
| Paged.js 打印预览 | @page 规则、页码、装订边距 |
| Vivliostyle CSS 分页 | 孤行/寡行控制、标题防分页 |
| word-break 修正 | 正确处理中英文混排换行 |
| 3× PNG 导出 | 全页/当页高精度导出 |
| 11 套主题 | 一键切换，打印预览同步 |
| 块级浮动微调 | 点击/框选块，独立调整排版 |
| 手动分页 | \`---\` 作为精确分页符 |
| 小红书格式 | 1080×1440 竖版原尺寸 |
| A4 / 移动 / 桌面 | 多格式自适应排版 |
| 🖼 智能图片面板 | 拖拽/URL/AI 生成/占位图，自动判断意图 |
| 🎨 封面生成面板 | 4 套模板 + AI 生成 + 10 档比例 + 拖拽定位文字 |

### 🖼 智能图片插入面板

全新 v2.0 智能图片面板——一个窗口完成所有图片操作，自动判断意图：

- **拖拽 / 粘贴图片** → 直接上传预览
- **输入 URL** → 按 Enter 自动加载
- **输入描述文字** → AI 生成（Gemini / OpenAI）
- **留空** → 插入指定比例的占位图

支持 10 种比例选择（9:16 ~ 21:9）、4 种裁切适配模式、图文混排布局和宽度调节。

![智能图片面板](screenshots/image-panel-smart.png)

---

## 🔑 API Key 配置

MagMark 支持通过 \`.env\` 文件预设 AI 生成图片 / 封面所需的 API Key，省去每次手动填写。

\`\`\`bash
# 复制示例文件
cp .env.example .env

# 用编辑器打开 .env，填写您的 Key
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENAI_API_KEY=your_openai_key_here
\`\`\`

| 变量 | 用途 | 申请地址 |
|---|---|---|
| \`VITE_GEMINI_API_KEY\` | AI 生成图片（Imagen 3）、AI 生成封面（Gemini Flash） | https://aistudio.google.com/app/apikey |
| \`VITE_OPENAI_API_KEY\` | AI 生成图片（DALL-E 3） | https://platform.openai.com/api-keys |

> **安全提示**：\`.env\` 已加入 \`.gitignore\`，不会被提交到版本库。Key 仅在浏览器端使用，不经过任何中间服务器。
> 也可以不配置 \`.env\`，直接在编辑器界面的图片/封面面板中填写，Key 会保存在浏览器 \`localStorage\`。

---

## 🚀 快速开始

\`\`\`bash
npm install
npm run dev
\`\`\`

访问 \`http://localhost:5173/\` 开启排版之旅。

### 使用打印预览

1. 在编辑器中输入 Markdown 内容
2. 点击右上角 **🖨 打印预览** 按钮
3. 新窗口中 Paged.js 自动分页，Han.css 完成 CJK 排印
4. 使用浏览器 \`Ctrl+P\` / \`Cmd+P\` 打印或另存为 PDF

---

## 📁 项目结构

\`\`\`bash
magmark/
├── .env.example       # API Key 配置示例（复制为 .env 填写实际 Key）
├── .env               # 本地 API Key（已加入 .gitignore，不提交）
├── editor.ts          # 核心逻辑：分页引擎、Han.js 初始化、打印预览生成
├── editor.css         # 样式系统：Han.css 集成、@page 规则、@media print
├── index.html         # UI 框架：引入 Han.css CDN、打印预览按钮
├── src/
│   ├── core/          # 状态管理
│   ├── engine/        # 分页引擎
│   ├── image/         # 图片插入面板（v2 智能单窗口）
│   └── cover/         # 封面生成面板（v2 比例+拖拽）
└── README.md
\`\`\`

---

## 🔗 技术栈

- [Han.css](https://hanzi.pro/) — CJK 汉字排版框架
- [Paged.js](https://pagedjs.org/) — CSS Paged Media polyfill
- [Vivliostyle](https://vivliostyle.org/) — CSS 分页排版标准
- [html-to-image](https://github.com/bubkoo/html-to-image) — 高精度 PNG 导出
- [Vite](https://vitejs.dev/) + TypeScript

---

## 📄 许可证

基于 MIT 协议发布。详见 [LICENSE](LICENSE)。

---

**为追求极致排版美学的创作者而生 ❤️**

*最近更新：2026-03-12 · v1.6.0*
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
    syncZoomUI(defaults.scale);
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

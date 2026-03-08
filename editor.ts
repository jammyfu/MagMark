import { store, AppState, PageSetting, getFormatDefaultSetting } from './src/core/state';
import { paginate, getPageDimensions } from './src/engine/layout';
import * as htmlToImage from 'html-to-image';

/**
 * MagMark 1.4 - Professional Refactored Entry
 * (C) 2026 Editorial Elite System
 */

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;

// UI Elements
const markdownInput = $('#markdown-input') as HTMLTextAreaElement;
const previewArea = $('#preview-area');
const paginationBar = $('#pagination-bar');
const pageInfo = $('#page-info');
const toolbar = $('#block-toolbar');

// Multi-selection state
let selectedBlockIds: Set<string> = new Set();
let marqueeEl: HTMLElement | null = null;
let marqueeStart = { x: 0, y: 0 };
let isDraggingMarquee = false;

/**
 * Debounce helper for expensive render calls
 */
function debounce(fn: Function, delay: number) {
    let timeout: number;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
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
        store.setState({ pageHtmls: pages, totalPages: pages.length });

        renderPages();
    } else {
        renderScroll(md);
    }
}

const debouncedRender = debounce(render, 300);
// Slower debounce for style sliders: instant visual update, lazy re-paginate
const debouncedRenderSlow = debounce(render, 1000);

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
                <div class="page-content ${magmarkClass}">${pageData.html}</div>
                ${footer}
            `;
            previewArea.appendChild(page);
        });

        // Re-attach block listeners
        attachBlockListeners();
        updatePaginationUI();
        renderPageStrip();

        // Fade back in
        requestAnimationFrame(() => {
            previewArea.style.opacity = '1';
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
            <div class="scroll-container ${magmarkClass}">${html}</div>
        </div>`;
    paginationBar.style.display = 'none';
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
    const isBlockStop = (l: string) =>
        isBlank(l) || isHeading(l) || isFence(l) || isQuote(l) ||
        isTable(l) || isListItem(l) || isHrLine(l);

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
        if (isQuote(line))   { blocks.push(parseBlockquote()); continue; }

        // Table
        if (isTable(line))   { blocks.push(parseTable()); continue; }

        // Unordered list
        if (isUlItem(line))  { blocks.push(parseList(false)); continue; }

        // Ordered list
        if (isOlItem(line))  { blocks.push(parseList(true)); continue; }

        // Paragraph (catch-all)
        const para = parseParagraph();
        if (para) blocks.push(para);
    }

    return blocks.join('\n');
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
        // Image before link (so ![…](…) is not parsed as link)
        .replace(/!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/g,
            (_, alt, src, title) => {
                const t = title ? ` title="${escapeAttr(title)}"` : '';
                return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${t} loading="lazy">`;
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
        // Instant CSS-only update — never re-paginates, zero flicker
        applyStylesOnly();
    });

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
        // Instant CSS-only update — never re-paginates, zero flicker
        applyStylesOnly();
    });

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

    $<HTMLInputElement>('#toolbar-fontsize').addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        updateBlockStyle('fontSize', val);
        $('#toolbar-val-fontsize').textContent = val + 'px';
        debouncedApply();
    });

    $<HTMLInputElement>('#toolbar-lineheight').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateBlockStyle('lineHeight', val);
        $('#toolbar-val-lineheight').textContent = val.toFixed(2);
        debouncedApply();
    });

    $<HTMLInputElement>('#toolbar-letterspacing').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateBlockStyle('letterSpacing', val);
        $('#toolbar-val-letterspacing').textContent = val.toFixed(2);
        debouncedApply();
    });

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

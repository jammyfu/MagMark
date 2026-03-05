import { store, AppState, PageSetting } from './src/core/state';
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
                <div class="page-content magmark">${pageData.html}</div>
                ${footer}
            `;
            previewArea.appendChild(page);
        });

        // Re-attach block listeners
        attachBlockListeners();
        updatePaginationUI();

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
    previewArea.innerHTML = `
        <div class="page ${formatClass} scrollable" style="transform-origin:top center;transform:scale(${state.scale})">
            <div class="scroll-container magmark">${html}</div>
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
 * Robust line-by-line Markdown → HTML converter.
 * Returns a string of top-level block elements (h1, h2, p, pre, ul, ol, blockquote, table, hr).
 * Each top-level element becomes one paginate block.
 */
function convertMarkdown(md: string): string {
    // Normalize line endings
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // ── Fenced code block ──────────────────────────────
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(escapeHtml(lines[i]));
                i++;
            }
            i++; // skip closing ```
            blocks.push(`<pre><code class="language-${lang}">${codeLines.join('\n')}</code></pre>`);
            continue;
        }

        // ── Headings ────────────────────────────────────────
        const h3 = line.match(/^### (.+)$/);
        if (h3) { blocks.push(`<h3>${inlineMarkdown(h3[1])}</h3>`); i++; continue; }
        const h4 = line.match(/^#### (.+)$/);
        if (h4) { blocks.push(`<h4>${inlineMarkdown(h4[1])}</h4>`); i++; continue; }
        const h2 = line.match(/^## (.+)$/);
        if (h2) { blocks.push(`<h2>${inlineMarkdown(h2[1])}</h2>`); i++; continue; }
        const h1 = line.match(/^# (.+)$/);
        if (h1) { blocks.push(`<h1>${inlineMarkdown(h1[1])}</h1>`); i++; continue; }

        // ── HR ──────────────────────────────────────────────
        if (/^---+$/.test(line.trim())) { blocks.push('<hr>'); i++; continue; }

        // ── Blockquote ──────────────────────────────────────
        if (line.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(inlineMarkdown(lines[i].slice(2)));
                i++;
            }
            blocks.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
            continue;
        }

        // ── Table ───────────────────────────────────────────
        // A table row starts with '|'. We collect header, skip separator, then data rows.
        if (line.startsWith('|')) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            if (tableLines.length >= 1) {
                // Parse cells from a row string
                const parseCells = (row: string) =>
                    row.split('|').slice(1, -1).map(c => c.trim());

                const headerCells = parseCells(tableLines[0]);
                // Row index 1 is the separator row (|---|---|), skip it
                const dataRows = tableLines.slice(2);

                const thead = `<thead><tr>${headerCells.map(c =>
                    `<th>${inlineMarkdown(c)}</th>`).join('')}</tr></thead>`;
                const tbody = `<tbody>${dataRows.map(row =>
                    `<tr>${parseCells(row).map(c =>
                        `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`
                ).join('')}</tbody>`;

                blocks.push(`<table>${thead}${tbody}</table>`);
            }
            continue;
        }

        // ── Unordered list ──────────────────────────────────
        if (/^[-*] /.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*] /.test(lines[i])) {
                items.push(`<li>${inlineMarkdown(lines[i].slice(2))}</li>`);
                i++;
            }
            blocks.push(`<ul>${items.join('')}</ul>`);
            continue;
        }

        // ── Ordered list ────────────────────────────────────
        if (/^\d+\. /.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
                items.push(`<li>${inlineMarkdown(lines[i].replace(/^\d+\. /, ''))}</li>`);
                i++;
            }
            blocks.push(`<ol>${items.join('')}</ol>`);
            continue;
        }

        // ── Blank line: skip ────────────────────────────────
        if (line.trim() === '') { i++; continue; }

        // ── Paragraph: collect consecutive non-blank lines ─
        const paraLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '' &&
            !lines[i].startsWith('#') && !lines[i].startsWith('```') &&
            !lines[i].startsWith('> ') && !lines[i].startsWith('|') &&
            !/^[-*] /.test(lines[i]) &&
            !/^\d+\. /.test(lines[i]) && !/^---+$/.test(lines[i].trim())) {
            paraLines.push(inlineMarkdown(lines[i]));
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push(`<p>${paraLines.join('<br>')}</p>`);
        }
    }

    return blocks.join('\n');
}

/** Inline markdown: bold, italic, code, links.
 *  Uses lazy quantifiers (.+?) to prevent catastrophic backtracking
 *  on lines with many asterisks (e.g., table cells with **bold** text).
 */
function inlineMarkdown(text: string): string {
    // Guard: skip processing on very long lines to prevent any edge-case hang
    if (text.length > 2000) return escapeHtml(text);
    return text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/** Escape HTML special chars for code blocks */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
            overrides[state.currentPage] = { ...(overrides[state.currentPage] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing }), fontSize: val };
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
            overrides[state.currentPage] = { ...(overrides[state.currentPage] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing }), lineHeight: val };
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
            overrides[state.currentPage] = { ...(overrides[state.currentPage] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing }), letterSpacing: val };
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
        // Auto-scale: xiaohongshu 1080px @ 75% is comfortable on most screens
        const autoScale = fmt === 'xiaohongshu' ? 0.75 : 1;
        store.setState({ format: fmt, pageOverrides: {}, scale: autoScale });
        // Sync the scale dropdown to the nearest available option
        const scaleEl = $<HTMLSelectElement>('#ctrl-scale');
        const options = Array.from(scaleEl.options);
        const best = options.reduce((prev, opt) =>
            Math.abs(parseFloat(opt.value) - autoScale) < Math.abs(parseFloat(prev.value) - autoScale) ? opt : prev
        );
        scaleEl.value = best.value;
        render();
    });

    $<HTMLInputElement>('#chk-manual-pagination').addEventListener('change', (e) => {
        store.setState({ manualPagination: (e.target as HTMLInputElement).checked });
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

    // Esc key also deselects
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') clearSelection();
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

    // Toolbar init
    initToolbar();

    // Export PNG
    $('#btn-export').addEventListener('click', exportPng);

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
    const s = state.pageOverrides[pageNum] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing };

    $<HTMLInputElement>('#ctrl-fontsize').value = String(s.fontSize);
    $('#val-fontsize').textContent = s.fontSize + 'pt';
    $<HTMLInputElement>('#ctrl-lineheight').value = String(s.lineHeight);
    $('#val-lineheight').textContent = s.lineHeight.toFixed(2) + '×';
    $<HTMLInputElement>('#ctrl-letterspacing').value = String(s.letterSpacing);
    $('#val-letterspacing').textContent = s.letterSpacing.toFixed(2) + 'em';
}

function applyGlobalStyles() {
    const s = store.getState();
    document.documentElement.style.setProperty('--mm-font-size', s.fontSize + 'px');
    document.documentElement.style.setProperty('--mm-line-height', String(s.lineHeight));
    document.documentElement.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
}

/**
 * Lightweight style-only update: updates CSS vars on existing page elements
 * WITHOUT rebuilding the DOM. Eliminates flicker on slider drag.
 */
function applyStylesOnly() {
    const s = store.getState();
    // Update root vars
    document.documentElement.style.setProperty('--mm-font-size', s.fontSize + 'px');
    document.documentElement.style.setProperty('--mm-line-height', String(s.lineHeight));
    document.documentElement.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
    // Patch all existing page elements directly
    previewArea.querySelectorAll('.page').forEach(page => {
        const p = page as HTMLElement;
        p.style.setProperty('--mm-font-size', s.fontSize + 'px');
        p.style.setProperty('--mm-line-height', String(s.lineHeight));
        p.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
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
        blockStyles[id] = {
            ...(blockStyles[id] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing }),
            [prop]: val
        };
        // Instant DOM feedback for all selected blocks
        const el = previewArea.querySelector(`[data-block-id="${id}"]`) as HTMLElement;
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
    const defaults = {
        fontSize: 14,
        lineHeight: 1.75,
        letterSpacing: 0.01,
        fontFamily: "'Source Han Serif SC', 'Noto Serif SC', serif",
        format: 'a4' as AppState['format'],
        viewMode: 'multi' as AppState['viewMode'],
        manualPagination: false,
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

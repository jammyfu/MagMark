import { store, AppState, PageSetting } from './src/core/state';
import { paginate, getPageDimensions } from './src/engine/layout';
// @ts-ignore
import { htmlToImage } from 'html-to-image';

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

/**
 * Multi-Page Display Logic
 */
function renderPages() {
    const state = store.getState();
    previewArea.innerHTML = '';

    state.pageHtmls.forEach((pageData, i) => {
        const pageNum = i + 1;
        const page = document.createElement('div');
        const formatClass = 'page-' + state.format;
        page.className = `page ${formatClass}`;
        page.dataset.page = String(pageNum);
        page.style.display = pageNum === state.currentPage ? 'block' : 'none';

        // Apply page-level styles
        const s = pageData.settings;
        page.style.setProperty('--mm-font-size', s.fontSize + 'px');
        page.style.setProperty('--mm-line-height', String(s.lineHeight));
        page.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
        page.style.setProperty('--mm-font-family', state.fontFamily);

        let indicator = state.pageOverrides[pageNum] ? '<div class="page-setting-indicator">独立样式</div>' : '';

        page.innerHTML = `
            ${indicator}
            <div class="page-content magmark">${pageData.html}</div>
            <div class="page-footer">PAGE ${pageNum} / ${state.totalPages}</div>
        `;
        previewArea.appendChild(page);
    });

    // Re-attach block listeners
    attachBlockListeners();
    updatePaginationUI();
}

function renderScroll(md: string) {
    const html = convertMarkdown(md);
    previewArea.innerHTML = `<div class="scroll-container magmark">${html}</div>`;
    paginationBar.style.display = 'none';
}

/**
 * Interaction Logic
 */
function attachBlockListeners() {
    previewArea.querySelectorAll('.magmark > *').forEach(block => {
        const b = block as HTMLElement;
        const bid = b.dataset.blockId;

        if (bid === store.getState().selectedBlockId) {
            b.classList.add('block-editing');
            setTimeout(() => positionToolbar(b), 10);
        }

        b.addEventListener('click', (e) => {
            e.stopPropagation();
            selectBlock(b);
        });
    });
}

function selectBlock(el: HTMLElement) {
    const bid = el.dataset.blockId;
    if (!bid) return;

    previewArea.querySelectorAll('.block-editing').forEach(b => b.classList.remove('block-editing'));
    store.setState({ selectedBlockId: bid });
    el.classList.add('block-editing');

    showToolbar(el);
}

function showToolbar(el: HTMLElement) {
    toolbar.style.display = 'flex';
    positionToolbar(el);

    const bid = el.dataset.blockId!;
    const state = store.getState();
    const over = state.blockOverrides[bid] || {
        fontSize: parseInt(getComputedStyle(el).fontSize),
        lineHeight: parseFloat(getComputedStyle(el).lineHeight) / parseInt(getComputedStyle(el).fontSize) || 1.75,
        letterSpacing: 0
    };

    $<HTMLInputElement>('#toolbar-fontsize').value = String(over.fontSize);
    $('#toolbar-val-fontsize').textContent = over.fontSize + 'px';
    $<HTMLInputElement>('#toolbar-lineheight').value = String(over.lineHeight);
    $('#toolbar-val-lineheight').textContent = over.lineHeight.toFixed(2);
    $<HTMLInputElement>('#toolbar-letterspacing').value = String(over.letterSpacing);
    $('#toolbar-val-letterspacing').textContent = over.letterSpacing.toFixed(2);
}

function positionToolbar(el: HTMLElement) {
    if (toolbar.style.display === 'none') return;
    const rect = el.getBoundingClientRect();
    toolbar.style.top = `${rect.top}px`;
    toolbar.style.left = `${rect.left}px`;
}

/**
 * Utility: Simplified Markdown (Real version should use unified/remark)
 * For the sake of the refactor script, we'll use a placeholder or keep previous logic if accessible
 */
function convertMarkdown(md: string): string {
    // In a real Google-grade app, we'd use a robust renderer plugin
    // Here we'll implement a basic one or wrap the existing library if available
    // For this demonstration, we'll use a simple regex-based one (mock)
    let html = md
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/---/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>');

    return `<p>${html}</p>`.replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>');
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
        applyGlobalStyles();
        debouncedRender();
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
        applyGlobalStyles();
        debouncedRender();
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
        applyGlobalStyles();
        debouncedRender();
    });

    $<HTMLSelectElement>('#ctrl-format').addEventListener('change', (e) => {
        store.setState({ format: (e.target as HTMLSelectElement).value as any, pageOverrides: {} });
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
        render(); // Re-render to ensure layouts handle new fonts
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
        previewArea.querySelectorAll('.block-editing').forEach(b => b.classList.remove('block-editing'));
    });
}

function updateBlockStyle(prop: keyof PageSetting, val: number) {
    const state = store.getState();
    const bid = state.selectedBlockId;
    if (!bid) return;

    const blockStyles = { ...state.blockOverrides };
    blockStyles[bid] = {
        ...(blockStyles[bid] || { fontSize: state.fontSize, lineHeight: state.lineHeight, letterSpacing: state.letterSpacing }),
        [prop]: val
    };
    store.setState({ blockOverrides: blockStyles });

    // Instant DOM feedback
    const el = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement;
    if (el) {
        if (prop === 'fontSize') el.style.fontSize = val + 'px';
        if (prop === 'lineHeight') el.style.lineHeight = String(val);
        if (prop === 'letterSpacing') el.style.letterSpacing = val + 'em';
        positionToolbar(el);
    }
}

async function exportPng() {
    const state = store.getState();
    const activePage = previewArea.querySelector(`.page[data-page="${state.currentPage}"]`);
    if (!activePage) return;

    const btn = $('#btn-export');
    btn.textContent = '⌛ 导出中...';

    try {
        // @ts-ignore
        const dataUrl = await window.htmlToImage.toPng(activePage, {
            pixelRatio: 3,
            backgroundColor: getComputedStyle(activePage).backgroundColor
        });

        const link = document.createElement('a');
        link.download = `MagMark-1.4-Page-${state.currentPage}.png`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        console.error('Export failed', e);
        alert('导出失败，请重试');
    } finally {
        btn.innerHTML = '📸 导出 PNG';
    }
}

function loadDefault() {
    markdownInput.value = `# MagMark 1.4 — 极致排版重构版

**Editorial Elite 配色系统已激活**
在这里开启您的顶级杂志排版之旅。点击文字块，调节独立样式。

## 🌟 重构核心亮点
1. **模块化物理拆分**：逻辑解理，速度提升。
2. **Editorial Elite 主色调**：金石配色，极致专业。
3. **响应式排版算法**：支持复杂块级覆盖。

---

*Google Engineer & Designer Philosophy | 2026*
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

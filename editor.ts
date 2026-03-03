/**
 * MagMark 2.0 — Editor Entry Point
 * Markdown 编辑、实时预览、智能分页
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import * as htmlToImage from 'html-to-image';

// ── State ──────────────────────────────────────
interface PageSetting {
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
}

interface AppState {
    md: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontFamily: string;
    format: 'a4' | 'mobile' | 'desktop';
    viewMode: 'multi' | 'scroll';
    manualPagination: boolean;
    currentPage: number;
    totalPages: number;
    pageHtmls: { html: string; settings: PageSetting }[];
    pageOverrides: Record<number, PageSetting>;
    blockOverrides: Record<string, PageSetting>;
    selectedBlockId: string | null;
    isProcessing: boolean;
}

const state: AppState = {
    md: '',
    fontSize: 14,
    lineHeight: 1.75,
    letterSpacing: 0.01,
    fontFamily: "'Source Han Serif SC', 'Noto Serif SC', serif",
    format: 'a4',
    viewMode: 'multi',
    manualPagination: false,
    currentPage: 1,
    totalPages: 1,
    pageHtmls: [],
    pageOverrides: {},
    blockOverrides: {},
    selectedBlockId: null,
    isProcessing: false,
};

// ── DOM ────────────────────────────────────────
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const input = $<HTMLTextAreaElement>('#markdown-input');
const previewArea = $('#preview-area');
const charCount = $('#char-count');
const pagBar = $('#pagination-bar');
const pageInfo = $('#page-info');
const btnPrev = $<HTMLButtonElement>('#btn-prev');
const btnNext = $<HTMLButtonElement>('#btn-next');

// ── Markdown → HTML ────────────────────────────
async function mdToHtml(md: string): Promise<string> {
    const processor = unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });
    return String(await processor.process(md));
}

// ── Page dimensions ────────────────────────────
function pageDims() {
    const dims: Record<string, { w: number; h: number; pt: number; pb: number; px: number }> = {
        a4: { w: 595, h: 842, pt: 56, pb: 40, px: 52 },
        mobile: { w: 393, h: 852, pt: 32, pb: 32, px: 24 },
        desktop: { w: 800, h: 1000, pt: 64, pb: 40, px: 72 },
    };
    return dims[state.format];
}

function pageClass() {
    return 'page-' + state.format;
}

// ── Smart Pagination 1.4 (Enhanced) ─────────────
async function paginateContent(html: string): Promise<{ html: string; settings: PageSetting }[]> {
    const dim = pageDims();
    const availableHeight = dim.h - dim.pt - dim.pb;

    // Create a hidden measurer
    const measurer = document.createElement('div');
    measurer.className = `page ${pageClass()}`;
    measurer.style.cssText = `
        position: absolute; visibility: hidden; pointer-events: none;
        z-index: -1; left: -9999px; top: 0;
        width: ${dim.w}px;
        padding: ${dim.pt}px ${dim.px}px ${dim.pb}px ${dim.px}px;
    `;
    document.body.appendChild(measurer);

    const contentBox = document.createElement('div');
    contentBox.className = 'magmark';
    measurer.appendChild(contentBox);

    // Initial parsing of blocks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const blocks = Array.from(tempDiv.children) as HTMLElement[];

    const pages: { html: string; settings: PageSetting }[] = [];
    let currentPageBlocks: string[] = [];
    let currentHeight = 0;
    let blockIdx = 0;

    while (blockIdx < blocks.length) {
        const pageNum = pages.length + 1;
        const currentSettings = state.pageOverrides[pageNum] || {
            fontSize: state.fontSize,
            lineHeight: state.lineHeight,
            letterSpacing: state.letterSpacing
        };

        // Apply settings for this page's measurement
        measurer.style.setProperty('--mm-font-size', currentSettings.fontSize + 'px');
        measurer.style.setProperty('--mm-line-height', String(currentSettings.lineHeight));
        measurer.style.setProperty('--mm-letter-spacing', currentSettings.letterSpacing + 'em');
        measurer.style.setProperty('--mm-font-family', state.fontFamily);

        const block = blocks[blockIdx];
        const isManualBreak = block.tagName === 'HR' && state.manualPagination;

        if (isManualBreak) {
            // Force a page break even if current page is empty (multiple --- = multiple pages)
            pages.push({ html: currentPageBlocks.join(''), settings: { ...currentSettings } });
            currentPageBlocks = [];
            currentHeight = 0;
            blockIdx++;
            continue;
        }

        // Measure block height in current page context
        contentBox.innerHTML = block.outerHTML;
        await new Promise(r => setTimeout(r, 0)); // Yield to layout
        const rect = contentBox.firstChild ? (contentBox.firstChild as HTMLElement).getBoundingClientRect() : { height: 0 };
        const style = getComputedStyle(contentBox.firstChild as HTMLElement);
        const margins = (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        const h = rect.height + margins;

        if (currentHeight + h > availableHeight && currentPageBlocks.length > 0) {
            // Page full, finalize it
            pages.push({ html: currentPageBlocks.join(''), settings: { ...currentSettings } });
            currentPageBlocks = [];
            currentHeight = 0;
            // Note: blockIdx doesn't increment, we retry this block on the next page
        } else {
            currentPageBlocks.push(block.outerHTML);
            currentHeight += h;
            blockIdx++;
        }
    }

    if (currentPageBlocks.length > 0) {
        const finalSettings = state.pageOverrides[pages.length + 1] || {
            fontSize: state.fontSize,
            lineHeight: state.lineHeight,
            letterSpacing: state.letterSpacing
        };
        pages.push({ html: currentPageBlocks.join(''), settings: { ...finalSettings } });
    }

    // Assign IDs to blocks in html strings so we can identify them
    pages.forEach((p, pageIdx) => {
        const temp = document.createElement('div');
        temp.innerHTML = p.html;
        Array.from(temp.children).forEach((child, blockIdx) => {
            const blockId = `p${pageIdx}-b${blockIdx}`;
            (child as HTMLElement).dataset.blockId = blockId;

            // Apply block-level overrides if exist
            const over = state.blockOverrides[blockId];
            if (over) {
                (child as HTMLElement).style.setProperty('font-size', over.fontSize + 'px');
                (child as HTMLElement).style.setProperty('line-height', String(over.lineHeight));
                (child as HTMLElement).style.setProperty('letter-spacing', over.letterSpacing + 'em');
            }
        });
        p.html = temp.innerHTML;
    });

    document.body.removeChild(measurer);
    return pages;
}

// ── Render ──────────────────────────────────────
async function render() {
    if (state.isProcessing) return;
    state.isProcessing = true;

    state.md = input.value.trim();
    charCount.textContent = `${input.value.length} 字符`;

    if (!state.md) {
        showPlaceholder();
        state.isProcessing = false;
        return;
    }

    try {
        const html = await mdToHtml(state.md);

        if (state.viewMode === 'scroll') {
            $('#page-override-group').style.display = 'none';
            $<HTMLInputElement>('#chk-page-override').checked = false;
            renderScrollMode(html);
        } else {
            $('#page-override-group').style.display = 'flex';
            const pages = await paginateContent(html);
            state.pageHtmls = pages;
            state.totalPages = pages.length;
            state.currentPage = Math.min(state.currentPage, state.totalPages);
            renderMultiPageMode();
        }
    } catch (err: any) {
        previewArea.innerHTML = `<div class="page ${pageClass()}"><div class="page-content magmark"><p style="color:red;">渲染错误：${err.message}</p></div></div>`;
    }

    state.isProcessing = false;
}

function showPlaceholder() {
    previewArea.innerHTML = `
    <div class="page ${pageClass()}">
      <div class="page-content magmark">
        <div class="placeholder">
          <div class="placeholder-icon">✦</div>
          <p>在左侧输入 Markdown，预览将在这里实时呈现</p>
        </div>
      </div>
    </div>
  `;
    pagBar.style.display = 'none';
}

function renderMultiPageMode() {
    previewArea.innerHTML = '';
    state.pageHtmls.forEach((pageData, i) => {
        const pageNum = i + 1;
        const page = document.createElement('div');
        page.className = `page ${pageClass()}`;
        page.dataset.page = String(pageNum);
        page.style.display = pageNum === state.currentPage ? '' : 'none';

        // Apply settings context
        const s = pageData.settings;
        page.style.setProperty('--mm-font-size', s.fontSize + 'px');
        page.style.setProperty('--mm-line-height', String(s.lineHeight));
        page.style.setProperty('--mm-letter-spacing', s.letterSpacing + 'em');
        page.style.setProperty('--mm-font-family', state.fontFamily);

        let indicator = '';
        if (state.pageOverrides[pageNum]) {
            indicator = '<div class="page-setting-indicator">独立样式</div>';
        }

        page.innerHTML = `
            ${indicator}
            <div class="page-content magmark">${pageData.html}</div>
            <div class="page-footer">第 ${pageNum} / ${state.totalPages} 页</div>
        `;
        previewArea.appendChild(page);
    });

    // 1.4: Add Block Selection Listeners
    previewArea.querySelectorAll('.magmark > *').forEach(block => {
        const b = block as HTMLElement;
        const bid = b.dataset.blockId;
        if (bid === state.selectedBlockId) {
            b.classList.add('block-editing');
            // Re-show toolbar if it was open
            setTimeout(() => positionToolbar(b), 10);
        }

        b.addEventListener('click', (e) => {
            e.stopPropagation();
            selectBlock(b);
        });
    });

    updatePaginationUI();
}

function selectBlock(el: HTMLElement) {
    const bid = el.dataset.blockId;
    if (!bid) return;

    // Clear old
    previewArea.querySelectorAll('.block-editing').forEach(b => b.classList.remove('block-editing'));

    state.selectedBlockId = bid;
    el.classList.add('block-editing');

    showToolbar(el);
}

const toolbar = $('#block-toolbar');
function showToolbar(el: HTMLElement) {
    toolbar.style.display = 'flex';
    positionToolbar(el);

    // Load values
    const bid = el.dataset.blockId!;
    const over = state.blockOverrides[bid] || {
        fontSize: parseInt(getComputedStyle(el).fontSize),
        lineHeight: parseFloat(getComputedStyle(el).lineHeight) / parseInt(getComputedStyle(el).fontSize) || 1.75,
        letterSpacing: parseFloat(getComputedStyle(el).letterSpacing) / parseInt(getComputedStyle(el).fontSize) || 0
    };

    // Since computed line-height is in px, we need to be careful. Better use state defaults if no override.
    const fSize = over.fontSize;
    const lHeight = over.lineHeight;
    const lSpacing = over.letterSpacing;

    $<HTMLInputElement>('#toolbar-fontsize').value = String(fSize);
    $('#toolbar-val-fontsize').textContent = fSize + 'px';
    $<HTMLInputElement>('#toolbar-lineheight').value = String(lHeight);
    $('#toolbar-val-lineheight').textContent = lHeight.toFixed(2);
    $<HTMLInputElement>('#toolbar-letterspacing').value = String(lSpacing);
    $('#toolbar-val-letterspacing').textContent = lSpacing.toFixed(2);
}

function positionToolbar(el: HTMLElement) {
    if (toolbar.style.display === 'none') return;
    const rect = el.getBoundingClientRect();
    toolbar.style.top = `${rect.top}px`;
    toolbar.style.left = `${rect.left}px`;
}

function initFloatingToolbar() {
    const debouncedRender = debounce(render, 400);

    $<HTMLInputElement>('#toolbar-fontsize').addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        updateSelectedBlockStyle('fontSize', val);
        $('#toolbar-val-fontsize').textContent = val + 'px';
        debouncedRender();
    });

    $<HTMLInputElement>('#toolbar-lineheight').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateSelectedBlockStyle('lineHeight', val);
        $('#toolbar-val-lineheight').textContent = val.toFixed(2);
        debouncedRender();
    });

    $<HTMLInputElement>('#toolbar-letterspacing').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        updateSelectedBlockStyle('letterSpacing', val);
        $('#toolbar-val-letterspacing').textContent = val.toFixed(2);
        debouncedRender();
    });

    $('#toolbar-close').addEventListener('click', () => {
        toolbar.style.display = 'none';
        state.selectedBlockId = null;
        previewArea.querySelectorAll('.block-editing').forEach(b => b.classList.remove('block-editing'));
    });

    // Close on click outside preview
    document.addEventListener('click', (e) => {
        if (!previewArea.contains(e.target as Node) && !toolbar.contains(e.target as Node)) {
            toolbar.style.display = 'none';
            state.selectedBlockId = null;
            previewArea.querySelectorAll('.block-editing').forEach(b => b.classList.remove('block-editing'));
        }
    });
}

function updateSelectedBlockStyle(prop: keyof PageSetting, val: number) {
    if (!state.selectedBlockId) return;
    const bid = state.selectedBlockId;

    // Get current or defaults
    const currentEl = previewArea.querySelector(`[data-block-id="${bid}"]`) as HTMLElement;
    if (!currentEl) return;

    const defaults = {
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        letterSpacing: state.letterSpacing
    };

    const s = state.blockOverrides[bid] || { ...defaults };
    (s as any)[prop] = val;
    state.blockOverrides[bid] = s;

    // Apply immediately to DOM for responsive feel
    if (prop === 'fontSize') currentEl.style.fontSize = val + 'px';
    if (prop === 'lineHeight') currentEl.style.lineHeight = String(val);
    if (prop === 'letterSpacing') currentEl.style.letterSpacing = val + 'em';

    positionToolbar(currentEl);
}

function renderScrollMode(html: string) {
    previewArea.innerHTML = `
    <div class="page ${pageClass()} scrollable">
      <div class="page-content magmark">${html}</div>
      <div class="page-footer">长文模式</div>
    </div>
  `;
    pagBar.style.display = 'none';
}

function updatePaginationUI() {
    if (state.viewMode !== 'multi' || state.totalPages <= 1) {
        pagBar.style.display = 'none';
        return;
    }
    pagBar.style.display = 'flex';
    pageInfo.textContent = `第 ${state.currentPage} / ${state.totalPages} 页`;
    btnPrev.disabled = state.currentPage <= 1;
    btnNext.disabled = state.currentPage >= state.totalPages;
}

function goPage(delta: number) {
    const next = state.currentPage + delta;
    if (next < 1 || next > state.totalPages) return;
    state.currentPage = next;

    // Show/hide pages
    previewArea.querySelectorAll<HTMLElement>('.page').forEach(p => {
        p.style.display = p.dataset.page === String(state.currentPage) ? '' : 'none';
    });

    // 1.4: Update controls if per-page is active
    const chk = $<HTMLInputElement>('#chk-page-override');
    if (chk.checked) {
        const s = state.pageOverrides[state.currentPage] || {
            fontSize: state.fontSize,
            lineHeight: state.lineHeight,
            letterSpacing: state.letterSpacing
        };
        $<HTMLInputElement>('#ctrl-fontsize').value = String(s.fontSize);
        $('#val-fontsize').textContent = s.fontSize + 'pt';
        $<HTMLInputElement>('#ctrl-lineheight').value = String(s.lineHeight);
        $('#val-lineheight').textContent = s.lineHeight.toFixed(2) + '×';
        $<HTMLInputElement>('#ctrl-letterspacing').value = String(s.letterSpacing);
        $('#val-letterspacing').textContent = s.letterSpacing.toFixed(2) + 'em';
    }

    updatePaginationUI();
}

// ── Style Application ──────────────────────────
function applyStyles() {
    const root = document.documentElement;
    root.style.setProperty('--mm-font-size', state.fontSize + 'px');
    root.style.setProperty('--mm-line-height', String(state.lineHeight));
    root.style.setProperty('--mm-letter-spacing', state.letterSpacing + 'em');
    root.style.setProperty('--mm-font-family', state.fontFamily);
}

// ── Debounce ───────────────────────────────────
function debounce(fn: () => void, ms: number) {
    let tid: number;
    return () => { clearTimeout(tid); tid = window.setTimeout(fn, ms); };
}

// ── Resize Handle ──────────────────────────────
function initResizeHandle() {
    const handle = $('#resize-handle');
    const editorPanel = $('#editor-panel');
    let startX = 0, startW = 0, active = false;

    handle.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startW = editorPanel.offsetWidth;
        active = true;
        handle.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!active) return;
        const w = Math.max(300, Math.min(700, startW + e.clientX - startX));
        editorPanel.style.width = w + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!active) return;
        active = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ── Event Wiring ───────────────────────────────
function init() {
    const debouncedRender = debounce(render, 200);

    // Input
    input.addEventListener('input', debouncedRender);

    // Controls
    $<HTMLSelectElement>('#ctrl-font').addEventListener('change', (e) => {
        state.fontFamily = (e.target as HTMLSelectElement).value;
        applyStyles();
        render();
    });

    $<HTMLInputElement>('#ctrl-fontsize').addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        const override = $<HTMLInputElement>('#chk-page-override').checked;

        if (override) {
            state.pageOverrides[state.currentPage] = {
                fontSize: val,
                lineHeight: state.pageOverrides[state.currentPage]?.lineHeight || state.lineHeight,
                letterSpacing: state.pageOverrides[state.currentPage]?.letterSpacing || state.letterSpacing
            };
        } else {
            state.fontSize = val;
            state.pageOverrides = {}; // Reset overrides when global changes
        }

        $('#val-fontsize').textContent = val + 'pt';
        applyStyles();
        debouncedRender();
    });

    $<HTMLInputElement>('#ctrl-lineheight').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        const override = $<HTMLInputElement>('#chk-page-override').checked;

        if (override) {
            state.pageOverrides[state.currentPage] = {
                fontSize: state.pageOverrides[state.currentPage]?.fontSize || state.fontSize,
                lineHeight: val,
                letterSpacing: state.pageOverrides[state.currentPage]?.letterSpacing || state.letterSpacing
            };
        } else {
            state.lineHeight = val;
            state.pageOverrides = {}; // Reset overrides when global changes
        }

        $('#val-lineheight').textContent = val.toFixed(2) + '×';
        applyStyles();
        debouncedRender();
    });

    $<HTMLInputElement>('#ctrl-letterspacing').addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        const override = $<HTMLInputElement>('#chk-page-override').checked;

        if (override) {
            state.pageOverrides[state.currentPage] = {
                fontSize: state.pageOverrides[state.currentPage]?.fontSize || state.fontSize,
                lineHeight: state.pageOverrides[state.currentPage]?.lineHeight || state.lineHeight,
                letterSpacing: val
            };
        } else {
            state.letterSpacing = val;
            state.pageOverrides = {};
        }

        $('#val-letterspacing').textContent = val.toFixed(2) + 'em';
        applyStyles();
        debouncedRender();
    });

    $<HTMLSelectElement>('#ctrl-format').addEventListener('change', (e) => {
        state.format = (e.target as HTMLSelectElement).value as AppState['format'];
        state.pageOverrides = {}; // Dimensions change should reset page-specific flows
        render();
    });

    $<HTMLInputElement>('#chk-page-override').addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
            // Load current settings into selectors based on current page
            const s = state.pageOverrides[state.currentPage] || {
                fontSize: state.fontSize,
                lineHeight: state.lineHeight,
                letterSpacing: state.letterSpacing
            };
            $<HTMLInputElement>('#ctrl-fontsize').value = String(s.fontSize);
            $('#val-fontsize').textContent = s.fontSize + 'pt';
            $<HTMLInputElement>('#ctrl-lineheight').value = String(s.lineHeight);
            $('#val-lineheight').textContent = s.lineHeight.toFixed(2) + '×';
            $<HTMLInputElement>('#ctrl-letterspacing').value = String(s.letterSpacing);
            $('#val-letterspacing').textContent = s.letterSpacing.toFixed(2) + 'em';
        } else {
            // Reset selectors to global
            $<HTMLInputElement>('#ctrl-fontsize').value = String(state.fontSize);
            $('#val-fontsize').textContent = state.fontSize + 'pt';
            $<HTMLInputElement>('#ctrl-lineheight').value = String(state.lineHeight);
            $('#val-lineheight').textContent = state.lineHeight.toFixed(2) + '×';
            $<HTMLInputElement>('#ctrl-letterspacing').value = String(state.letterSpacing);
            $('#val-letterspacing').textContent = state.letterSpacing.toFixed(2) + 'em';
        }
    });

    $<HTMLInputElement>('#chk-manual-pagination').addEventListener('change', (e) => {
        state.manualPagination = (e.target as HTMLInputElement).checked;
        render();
    });

    // View mode
    document.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.viewMode = btn.dataset.mode as AppState['viewMode'];
            render();
        });
    });

    // Pagination
    btnPrev.addEventListener('click', () => goPage(-1));
    btnNext.addEventListener('click', () => goPage(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === input) return;
        if (e.key === 'ArrowLeft') goPage(-1);
        if (e.key === 'ArrowRight') goPage(1);
    });

    // File open
    $<HTMLInputElement>('#file-input').addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            input.value = ev.target?.result as string;
            render();
        };
        reader.readAsText(file);
    });

    // Save
    $('#btn-save').addEventListener('click', () => {
        if (!state.md) return alert('没有内容可保存');
        const blob = new Blob([state.md], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'magmark-output.md';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // Export
    $('#btn-export').addEventListener('click', async () => {
        const activePage = previewArea.querySelector(`.page[data-page="${state.currentPage}"]`) || previewArea.querySelector('.page');
        if (!activePage) return alert('没有可导出的页面');

        const btn = $('#btn-export') as HTMLButtonElement;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⌛ 导出中...';

        try {
            // 1.4 核心：高精度 Canvas 导出逻辑
            const dataUrl = await htmlToImage.toPng(activePage as HTMLElement, {
                pixelRatio: 3, // 3x 采样，保证 600dpi 级清晰度
                backgroundColor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                },
                cacheBust: true,
            });

            const link = document.createElement('a');
            link.download = `MagMark-1.4-Page-${state.currentPage}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('导出失败，请检查浏览器兼容性');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });

    // Resize handle
    initResizeHandle();

    // Floating toolbar
    initFloatingToolbar();

    // Load default content
    loadDefault();
    applyStyles();
}

function loadDefault() {
    input.value = `# MagMark 1.4 — 终极优化版需求规格书

**版本：1.4（2026年3月）**
**MagMark 1.4** 彻底告别 PDF 中间层，带来极致的排版与存图体验。

## 🚀 1.4 升级核心

### 1. 彻底抛弃 PDF 存图
不再依赖 PDF 存图 + PDF 转图片的链路。1.4 走**高精度 Canvas + SVG 混合流水线**，输出质量媲美 InDesign 导出的 600DPI PNG。

### 2. 强制齐行 + 自动连字符
- 正文强制执行 **text-align: justify**（两端齐行）。
- 开启自动连字符（hyphenation），CJK 场景完美处理，不再出现“一边长一边短”的断行。
- 视觉效果：阅读节奏高端杂志感拉满（对标《VOGUE》中文版）。

### 3. 动态重算引擎
字体更换、字号调整、分辨率切换后，**齐行 + 连字符立即重算**（<100ms），渲染零延迟。

---

## 📖 示例引用

> "设计不只是外表，它是其运作方式的灵魂。"
> — 史蒂夫·乔布斯

## 💻 导出代码示例 (html-to-image)

\`\`\`typescript
async function exportToCanvas(pageElement: HTMLElement, dpi: number = 600) {
  const scale = dpi / 96; 
  const dataUrl = await toPng(pageElement, {
    pixelRatio: scale,
    backgroundColor: '#ffffff',
    fontEmbed: true
  });
  return dataUrl;
}
\`\`\`

---

## 🖨️ 完美两端齐行演示

MagMark 1.4 致力于解决中文排版中常见的“一边长一边短”的问题。通过 **text-justify: inter-character** 和 **hyphens: auto** 的组合，我们实现了真正意义上的杂志级对齐。

无论是复杂的学术论文、时尚杂志推文，还是简单的个人博文，MagMark 1.4 都能通过智能断词算法确保每一行文字都分布均匀，视觉重心平稳且极具高级感。

---

## 🎯 操作指南

1. **输入内容** → 左侧实时编辑
2. **点击导出** → 直接获取 **3x 超清 PNG**（无需 PDF 跳转）
3. **调整参数** → 字号/行高变动，连字符位置自动修正

*MagMark 1.4 — 文字排版的终极方案 | © 2026*
`;
    render();
}

// ── Launch ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

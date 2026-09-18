import { store } from '../core/state';
import { mountAppearance } from './appearance';
import { mountSplitter } from './splitter';
import { getPageDimensions, type PaginationDiagnostic } from '../engine/layout';
import { WECHAT_DEVICE_OPTIONS } from '../wechat/wechat-themes';

export type WorkspaceView = 'write' | 'compare' | 'preview';
const views: WorkspaceView[] = ['write', 'compare', 'preview'];
const required = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing workspace element: ${id}`);
  return element as T;
};

/** Presentation state only. Changing workspace views never changes article source. */
export function mountWorkspace() {
  const body = document.body;
  const disposeAppearance = mountAppearance(required<HTMLSelectElement>('workspace-appearance'), body);
  const input = required<HTMLTextAreaElement>('markdown-input');
  const inspector = required('layout-inspector');
  const layoutButton = required<HTMLButtonElement>('btn-layout');
  const exportButton = required<HTMLButtonElement>('btn-publish');
  const dialog = required<HTMLDialogElement>('export-dialog');
  const fileMenu = required<HTMLDetailsElement>('file-menu');
  const preview = required('preview-area');
  const status = required('workspace-status');
  const media = window.matchMedia('(max-width: 800px)');
  const layoutHome = layoutButton.parentElement!;
  const placeLayoutButton = () => {
    (media.matches ? required('workspace-tabs') : layoutHome).append(layoutButton);
  };
  placeLayoutButton();
  let currentView: WorkspaceView = media.matches ? 'write' : 'compare';
  let previousExportView: WorkspaceView = currentView;
  let autoFit = true;
  let fitting = false;
  let toastTimer: ReturnType<typeof setTimeout>;
  const aborter = new AbortController();
  const signal = aborter.signal;
  function listen(target: EventTarget, name: string, callback: EventListener, capture = false) {
    target.addEventListener(name, callback, { signal, capture });
  }
  function report(message: string) {
    clearTimeout(toastTimer);
    status.textContent = message; status.hidden = !message;
    if (message) toastTimer = setTimeout(() => { status.hidden = true; }, 6500);
  }
  function setView(view: WorkspaceView, focus = false) {
    currentView = media.matches && view === 'compare' ? 'write' : view;
    body.dataset.workspace = currentView;
    document.querySelectorAll<HTMLButtonElement>('[data-workspace-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.workspaceView === currentView));
    });
    if (focus) {
      if (currentView === 'preview') preview.focus({ preventScroll: true });
      else input.focus({ preventScroll: true });
    }
    scheduleFit();
  }
  function closeInspector(restoreFocus = true) {
    inspector.hidden = true; delete body.dataset.inspector;
    layoutButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) layoutButton.focus({ preventScroll: true });
    scheduleFit();
  }
  function showSource() {
    if (media.matches) closeInspector(false);
    if (currentView === 'preview') setView(media.matches ? 'write' : 'compare');
  }
  function refreshDocument() {
    const value = input.value;
    const title = value.match(/^#\s+(.+)$/m)?.[1].replace(/[*_`]/g, '').trim() || '未命名文章';
    const titleElement = required('document-title');
    titleElement.textContent = title; titleElement.title = title;
    required('char-count').textContent = `${Array.from(value).length.toLocaleString('zh-CN')} 字符`;
    exportButton.disabled = !value.trim();
    required<HTMLButtonElement>('btn-save').disabled = !value.trim();
    required('document-status').textContent = value.trim() ? 'Markdown 原文' : '从一个想法开始';
  }
  function syncOutput() {
    const wechat = required<HTMLSelectElement>('ctrl-theme').value.startsWith('wc-');
    body.dataset.output = wechat ? 'wechat' : 'magazine';
    required('wechat-preview-label').hidden = !wechat;
    document.querySelectorAll<HTMLButtonElement>('.preview-mode .mode-btn').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
    // Legacy typography values are pixels, not typographic points.
    const size = required('val-fontsize');
    size.textContent = size.textContent?.replace(/pt$/i, 'px') || '';
    updateExportContext(); scheduleFit();
  }
  function updateExportContext() {
    const s = store.getState();
    const scope = body.dataset.output === 'wechat' || s.viewMode === 'scroll' ? '全文' : `第 ${s.currentPage} / ${s.totalPages} 页`;
    const name = required<HTMLSelectElement>('ctrl-theme').selectedOptions[0]?.textContent || '当前风格';
    required('export-context').textContent = `${scope} · ${name}。复制和单页导出使用当前预览。`;
    const pages = s.pageHtmls as Array<{ diagnostics?: PaginationDiagnostic[] }>;
    const paginated = body.dataset.output !== 'wechat' && s.viewMode === 'multi';
    const pageBlocked = paginated && !!pages[s.currentPage - 1]?.diagnostics?.length;
    const anyBlocked = paginated && pages.some(page => page.diagnostics?.length);
    const unavailable = !input.value.trim() || s.isProcessing;
    exportButton.disabled = !input.value.trim();
    for (const id of ['btn-copy-page-wechat','btn-wc-copy','btn-copy-page-rich','btn-print-preview']) {
      required<HTMLButtonElement>(id).disabled = unavailable;
    }
    required<HTMLButtonElement>('btn-export').disabled = pageBlocked || unavailable;
    required<HTMLButtonElement>('btn-export-all').disabled = anyBlocked || unavailable;
    const warning = document.getElementById('export-warning');
    if (warning) {
      warning.hidden = !anyBlocked || body.dataset.output === 'wechat';
      warning.textContent = anyBlocked ? '部分内容超出页面高度，PNG 导出已暂停。请调整字号、图片尺寸，或切换长文视图后导出。' : '';
      // Long view has no fixed-page clipping; stale pagination diagnostics do not apply.
      if (s.viewMode === 'scroll') { warning.hidden = true; required<HTMLButtonElement>('btn-export').disabled = unavailable; }
    }
  }
  function applyWechatZoom(scale: number) {
    const clamped = Math.max(.25, Math.min(3, Math.round(scale * 100) / 100));
    store.setState({ scale: clamped });
    required<HTMLInputElement>('zoom-value').value = String(Math.round(clamped * 100));
    required('ctrl-wc-device').dispatchEvent(new Event('change', { bubbles: true }));
  }
  function fit() {
    if (!autoFit || fitting || preview.clientWidth === 0) return;
    fitting = true;
    try {
      if (body.dataset.output === 'wechat') {
        const device = required<HTMLSelectElement>('ctrl-wc-device').value as keyof typeof WECHAT_DEVICE_OPTIONS;
        applyWechatZoom(Math.floor((preview.clientWidth - (media.matches ? 24 : 64)) / WECHAT_DEVICE_OPTIONS[device].width * 20) / 20);
      } else {
        const s = store.getState(), dim = getPageDimensions(s.format);
        const scale = Math.max(.25, Math.min(1, Math.floor((preview.clientWidth - (media.matches ? 24 : 64)) / dim.w * 20) / 20));
        if (Math.abs(s.scale - scale) < .001) return;
        required<HTMLInputElement>('zoom-value').value = String(Math.round(scale * 100));
        required('zoom-value').dispatchEvent(new Event('change', { bubbles: true }));
      }
    } finally { fitting = false; }
  }
  let frame = 0;
  function scheduleFit() { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }

  document.querySelectorAll<HTMLElement>('[data-workspace-view]').forEach(button => {
    listen(button, 'click', () => {
      const view = button.dataset.workspaceView as WorkspaceView;
      if (views.includes(view)) { closeInspector(false); setView(view, true); }
    });
  });
  listen(layoutButton, 'click', () => {
    if (!inspector.hidden) { closeInspector(); return; }
    if (currentView === 'write') setView(media.matches ? 'preview' : 'compare');
    inspector.hidden = false; body.dataset.inspector = 'open';
    layoutButton.setAttribute('aria-expanded', 'true');
    required('inspector-title').focus({ preventScroll: true }); scheduleFit();
  });
  listen(required('btn-layout-close'), 'click', () => closeInspector());
  listen(exportButton, 'click', () => {
    previousExportView = currentView; closeInspector(false); fileMenu.open = false;
    for (const id of ['copy-page-status', 'wc-copy-status']) {
      const message = document.getElementById(id); if (message) message.textContent = '';
    }
    if (currentView === 'write') setView(media.matches ? 'preview' : 'compare');
    updateExportContext();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { report('当前浏览器不支持导出面板，请使用新版浏览器。'); setView(previousExportView); }
  });
  listen(required('btn-export-close'), 'click', () => dialog.close());
  listen(dialog, 'close', () => { setView(previousExportView); exportButton.focus({ preventScroll: true }); });
  listen(dialog, 'click', event => {
    if (event.target !== dialog) return;
    const mouse = event as MouseEvent, rect = dialog.getBoundingClientRect();
    if (mouse.clientX < rect.left || mouse.clientX > rect.right || mouse.clientY < rect.top || mouse.clientY > rect.bottom) dialog.close();
  });
  document.querySelectorAll<HTMLElement>('[data-open-input]').forEach(button => {
    listen(button, 'click', () => { fileMenu.open = false; required(button.dataset.openInput!).click(); });
  });
  listen(required('btn-save'), 'click', () => {
    fileMenu.open = false;
    required('document-status').textContent = '已发起 Markdown 下载';
    report('已发起 Markdown 下载；请在浏览器下载记录中确认。');
  });
  listen(document, 'pointerdown', event => { if (!fileMenu.contains(event.target as Node)) fileMenu.open = false; });
  listen(document, 'keydown', event => {
    const key = event as KeyboardEvent;
    // Auxiliary native dialogs own their input, Escape, Tab and shortcuts.
    if (key.target instanceof Element && key.target.closest('dialog.mm-panel-dialog[open]')) return;
    if (key.isComposing) return;
    if (key.key === 'Escape') {
      if (dialog.open) return;
      if (fileMenu.open) { fileMenu.open = false; fileMenu.querySelector('summary')?.focus(); key.preventDefault(); key.stopImmediatePropagation(); }
      else if (!inspector.hidden) { closeInspector(); key.preventDefault(); key.stopImmediatePropagation(); }
    }
    if ((key.metaKey || key.ctrlKey) && key.key.toLowerCase() === 's') {
      key.preventDefault(); key.stopImmediatePropagation(); required('btn-save').click();
    }
    if (dialog.open || fileMenu.contains(key.target as Node) || inspector.contains(key.target as Node)) {
      key.stopPropagation();
    }
  }, true);
  listen(input, 'input', refreshDocument);
  listen(required('ctrl-theme'), 'change', syncOutput);
  for (const id of ['btn-multi','btn-scroll','btn-prev','btn-next','ctrl-fontsize']) listen(required(id), id.startsWith('ctrl') ? 'input' : 'click', syncOutput);
  listen(required('ctrl-format'), 'change', () => { autoFit = true; syncOutput(); });
  let resetBefore = store.getState();
  listen(required('btn-reset'), 'click', () => { resetBefore = store.getState(); }, true);
  listen(required('btn-reset'), 'click', () => {
    if (store.getState() === resetBefore) return;
    required('ctrl-theme').dispatchEvent(new Event('change', { bubbles: true }));
    autoFit = true; syncOutput(); report('已恢复默认排版，Markdown 内容未改变。');
  });
  listen(required('page-info'), 'click', () => {
    const open = body.dataset.pageMap !== 'open';
    body.dataset.pageMap = open ? 'open' : 'closed';
    required('page-info').setAttribute('aria-expanded', String(open));
  });
  const zoom = required('zoom-value');
  zoom.setAttribute('aria-label', '预览缩放百分比');
  listen(required('preview-panel'), 'click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('.zoom-btn');
    if (!button) return;
    autoFit = button.id === 'zoom-fit';
    if (button.id === 'zoom-fit') { event.preventDefault(); event.stopImmediatePropagation(); scheduleFit(); return; }
    if (body.dataset.output !== 'wechat') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const scale = store.getState().scale;
    if (button.id === 'zoom-fit') scheduleFit();
    else applyWechatZoom(button.id === 'zoom-100' ? 1 : scale + (button.id === 'zoom-in' ? .1 : -.1));
  }, true);
  listen(zoom, 'change', event => {
    if (!fitting) autoFit = false;
    if (body.dataset.output !== 'wechat') return;
    event.stopImmediatePropagation();
    const percent = Number((zoom as HTMLInputElement).value);
    if (Number.isFinite(percent) && percent > 0) applyWechatZoom(percent / 100);
  }, true);
  const resize = required('resize-handle');
  const disposeSplitter = mountSplitter(resize, required('editor-panel'), scheduleFit);
  const mediaChanged = () => { placeLayoutButton(); closeInspector(false); setView(media.matches ? (currentView === 'preview' ? 'preview' : 'write') : 'compare'); };
  media.addEventListener('change', mediaChanged);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleFit) : undefined;
  observer?.observe(preview);
  const feedback = required('copy-page-status');
  const feedbackObserver = new MutationObserver(() => { if (!dialog.open && feedback.textContent) report(feedback.textContent); });
  feedbackObserver.observe(feedback, { childList: true, subtree: true, characterData: true });
  const unsubscribe = store.subscribe(updateExportContext);
  setView(currentView); refreshDocument(); syncOutput();
  return {
    setView, showSource, refreshDocument, report,
    destroy() { disposeSplitter(); disposeAppearance(); unsubscribe(); aborter.abort(); media.removeEventListener('change', mediaChanged); observer?.disconnect(); feedbackObserver.disconnect(); cancelAnimationFrame(frame); clearTimeout(toastTimer); },
  };
}

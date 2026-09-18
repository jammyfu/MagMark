import { ICONS, type IconName } from './lucide-icons';

type Binding = { selector: string; icon: IconName; label?: string; only?: boolean; flip?: boolean };
/** Explicit functional mapping; never infer an icon from user-supplied text. */
export const ICON_BINDINGS: readonly Binding[] = [
  { selector: '[data-cover-align="left"]', icon: 'text-left', only: true, label: '左对齐' },
  { selector: '[data-cover-align="center"]', icon: 'text-center', only: true, label: '居中对齐' },
  { selector: '[data-cover-align="right"]', icon: 'text-right', only: true, label: '右对齐' },
  { selector: '[data-cover-align="justify"]', icon: 'text-justify', only: true, label: '两端对齐' },
  { selector: '[data-cover-align="distributed"]', icon: 'text-distributed', only: true, label: '分散对齐（末行也齐行）' },
  { selector: '#mm-cp-add-text', icon: 'pencil-line' },
  { selector: '#mm-cp-add-image', icon: 'image-plus' },
  { selector: '#mm-cp-auto-layout', icon: 'panels-top-left' },
  { selector: '[data-layer-action="up"]', icon: 'arrow-up-to-line', only: true, label: '图层上移' },
  { selector: '[data-layer-action="down"]', icon: 'arrow-up-to-line', only: true, label: '图层下移', flip: true },
  { selector: '[data-layer-action="duplicate"]', icon: 'files', only: true, label: '复制图层' },
  { selector: '[data-layer-action="hide"]', icon: 'eye', only: true, label: '显示或隐藏图层' },
  { selector: '[data-layer-action="delete"]', icon: 'trash', only: true, label: '删除选中图层' },
  { selector: '#mm-cp-edit-text', icon: 'pencil-line' },
  { selector: '#mm-cp-reset-text', icon: 'rotate-ccw' },
  { selector: '#mm-cp-size-down', icon: 'minus', only: true, label: '封面字号减小' },
  { selector: '#mm-cp-size-up', icon: 'plus', only: true, label: '封面字号增大' },
  { selector: '#mm-cp-text-undo', icon: 'undo-2', only: true, label: '撤销封面文字调整' },
  { selector: '#mm-cp-text-redo', icon: 'redo-2', only: true, label: '重做封面文字调整' },
  { selector: '[data-workspace-view="write"]', icon: 'pencil-line' },
  { selector: '[data-workspace-view="compare"]', icon: 'columns-2' },
  { selector: '[data-workspace-view="preview"]', icon: 'eye' },
  { selector: '#file-menu > summary', icon: 'folder-open' },
  { selector: '#file-upload-label', icon: 'file-up' },
  { selector: '[data-open-input="article-directory-input"]', icon: 'folder-input' },
  { selector: '[data-open-input="asset-directory-input"]', icon: 'folder-search' },
  { selector: '#btn-save', icon: 'file-down' },
  { selector: '#btn-undo', icon: 'undo-2', only: true, label: '撤销' },
  { selector: '#btn-redo', icon: 'redo-2', only: true, label: '重做' },
  { selector: '#btn-history', icon: 'clock', only: true, label: '历史记录' },
  { selector: '#btn-image', icon: 'image-plus' },
  { selector: '#btn-cover', icon: 'panels-top-left' },
  { selector: '#btn-layout', icon: 'sliders-horizontal' },
  { selector: '#btn-multi', icon: 'files' },
  { selector: '#btn-scroll', icon: 'scroll-text' },
  { selector: '#btn-publish', icon: 'download' },
  { selector: '#btn-copy-page-wechat, #btn-wc-copy, #btn-copy-page-rich', icon: 'clipboard-copy' },
  { selector: '#btn-export', icon: 'image-down' },
  { selector: '#btn-export-all', icon: 'images' },
  { selector: '#btn-print-preview', icon: 'printer' },
  { selector: '#btn-prev', icon: 'chevron-left', only: true, label: '上一页' },
  { selector: '#btn-next', icon: 'chevron-right', only: true, label: '下一页' },
  { selector: '#zoom-out', icon: 'minus', only: true, label: '缩小预览' },
  { selector: '#zoom-in', icon: 'plus', only: true, label: '放大预览' },
  { selector: '#zoom-fit', icon: 'maximize', only: true, label: '适合窗口' },
  { selector: '#btn-reset, #mm-ip-ratio-reset, #mm-cp-ratio-reset', icon: 'rotate-ccw' },
  { selector: '#btn-layout-close', icon: 'check' },
  { selector: '#btn-export-close, #toolbar-close, #mm-ip-close, .mm-cp-close', icon: 'x', only: true, label: '关闭面板' },
  { selector: '#toolbar-delete', icon: 'trash', only: true, label: '删除选中内容' },
  { selector: '#toolbar-align-left', icon: 'align-horizontal-justify-start', only: true, label: '图片左对齐' },
  { selector: '#toolbar-align-center', icon: 'align-horizontal-justify-center', only: true, label: '图片居中' },
  { selector: '#toolbar-align-right', icon: 'align-horizontal-justify-end', only: true, label: '图片右对齐' },
  { selector: '#toolbar-align-full', icon: 'move-horizontal', only: true, label: '图片全宽' },
  { selector: '#toolbar-insert-above', icon: 'arrow-up-to-line', only: true, label: '在此块上方插入图片' },
  { selector: '#toolbar-insert-below', icon: 'arrow-up-to-line', only: true, label: '在此块下方插入图片', flip: true },
  { selector: '#mm-ip-browse-btn', icon: 'file-up' },
  { selector: '#mm-ip-gen-btn, #mm-cp-generate-btn', icon: 'sparkles' },
  { selector: '#mm-ip-preview-clear', icon: 'x', only: true, label: '清除图片' },
  { selector: '#mm-ip-md-btn', icon: 'clipboard-copy' },
  { selector: '#mm-ip-insert-btn, #mm-cp-insert-btn', icon: 'image-plus' },
  { selector: '#mm-cp-download', icon: 'image-down' },
  { selector: '.mm-ip-layout-btn[data-layout="center"]', icon: 'align-horizontal-justify-center' },
  { selector: '.mm-ip-layout-btn[data-layout="float-left"]', icon: 'align-horizontal-justify-start' },
  { selector: '.mm-ip-layout-btn[data-layout="float-right"]', icon: 'align-horizontal-justify-end' },
  { selector: '.mm-ip-layout-btn[data-layout="full"]', icon: 'move-horizontal' },
  { selector: '.mm-cp-title', icon: 'panels-top-left' },
];
const UI_ROOTS = '#app-header, .workspace-panel-header, .preview-toolbar, .preview-footer, #layout-inspector, #export-dialog, #block-toolbar, dialog.mm-panel-dialog';
const ARTICLE = '#preview-area, #source-editor, #markdown-input, .magmark, .cm-editor, [contenteditable]';
const LEGACY_GLYPHS = /[↶↷◷☷↗×✕⇄✨→←＋⌄]/g;

function makeIcon(doc: Document, binding: Binding): SVGSVGElement {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({
    viewBox: '0 0 24 24', width: '16', height: '16', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true', focusable: 'false', class: 'mm-ui-icon', 'data-icon': binding.icon,
  })) svg.setAttribute(key, value);
  // Only compile-time, locally licensed SVG geometry enters this sink.
  svg.innerHTML = ICONS[binding.icon];
  if (binding.flip) svg.classList.add('mm-ui-icon-flip');
  return svg;
}
function decorate(element: HTMLElement, binding: Binding): void {
  if (element.closest(ARTICLE)) return;
  element.classList.add('mm-has-icon');
  if (binding.only) {
    element.classList.add('mm-icon-only');
    if (!element.hasAttribute('aria-label')) element.setAttribute('aria-label', binding.label!);
    if (!element.hasAttribute('title')) element.setAttribute('title', binding.label!);
  }
  // Keep the button itself, attached handlers, shortcuts and stateful child nodes.
  for (const child of Array.from(element.children)) {
    if (child.tagName.toLowerCase() === 'svg' && !child.classList.contains('mm-ui-icon')) child.remove();
  }
  const walker = element.ownerDocument.createTreeWalker(element, 4 /* SHOW_TEXT */);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const node of texts) {
    if (node.parentElement?.closest('.mm-ui-icon, kbd')) continue;
    const next = binding.only ? '' : node.data.replace(LEGACY_GLYPHS, '');
    if (next !== node.data) node.data = next;
  }
  const existing = element.querySelector<SVGSVGElement>(':scope > .mm-ui-icon');
  if (existing?.dataset.icon === binding.icon) return;
  existing?.remove();
  element.prepend(makeIcon(element.ownerDocument, binding));
}

/** Observe application chrome only; article/CodeMirror trees are never watched. */
export function mountWorkspaceIcons(doc: Document = document): () => void {
  const observed = new Map<Element, MutationObserver>();
  let disposed = false;
  const apply = (root: Element) => {
    for (const binding of ICON_BINDINGS) {
      root.querySelectorAll<HTMLElement>(binding.selector).forEach(element => decorate(element, binding));
    }
  };
  const scanRoots = () => {
    if (disposed) return;
    for (const [root, observer] of observed) {
      if (!root.isConnected) { observer.disconnect(); observed.delete(root); }
    }
    doc.querySelectorAll(UI_ROOTS).forEach(root => {
      if (root.closest(ARTICLE) || observed.has(root)) return;
      apply(root);
      const observer = new MutationObserver(() => { if (!disposed) apply(root); });
      observer.observe(root, { childList: true, subtree: true, characterData: true });
      observed.set(root, observer);
    });
  };
  scanRoots();
  // Auxiliary panels are attached directly to body. Do not observe body.subtree.
  const panels = new MutationObserver(scanRoots);
  panels.observe(doc.body, { childList: true });
  return () => {
    disposed = true;
    panels.disconnect();
    observed.forEach(observer => observer.disconnect());
    observed.clear();
  };
}

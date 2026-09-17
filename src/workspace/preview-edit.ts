import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Root, PhrasingContent } from 'mdast';

const normalize = (text: string) => text.replace(/[\s\u200b\u00ad]/g, '');
const sourceRanges = new Map<string, { source: string; from: number; to: number }>();
let nextRangeId = 0;
const editSessionId = crypto.randomUUID();

/** Renderer-owned positions survive typography wrappers and pagination clones. */
export function markEditableSource(source: string, from: number, to: number): string {
  const id = `${editSessionId}-${++nextRangeId}`;
  sourceRanges.set(id, { source, from, to });
  if (sourceRanges.size > 10000) sourceRanges.delete(sourceRanges.keys().next().value!);
  return ` data-mm-edit="${id}"`;
}

export function getEditableSource(source: string, id: string) {
  const range = sourceRanges.get(id);
  if (!range || range.source !== source) return null;
  return { from: range.from, to: range.to, value: source.slice(range.from, range.to) };
}
function plain(nodes: PhrasingContent[]): string {
  return nodes.map(node => {
    if (node.type === 'text' || node.type === 'inlineCode') return node.value;
    if (node.type === 'break') return '\n';
    if ('children' in node) return plain(node.children);
    return '';
  }).join('');
}

/** Exact, unambiguous source ranges only. Never guess among repeated paragraphs. */
export function findEditableText(source: string, text: string, tag: string) {
  const tree = unified().use(remarkParse).parse(source) as Root;
  const matches: Array<{ from: number; to: number; value: string }> = [];
  visit(tree, node => {
    if (node.type !== 'heading' && node.type !== 'paragraph') return;
    if (/^H[1-6]$/.test(tag) ? node.type !== 'heading' || node.depth !== Number(tag[1]) : node.type !== 'paragraph') return;
    if (!normalize(text) || normalize(plain(node.children)) !== normalize(text)) return;
    // Images and raw HTML have their own editors and must not be rewritten here.
    let unsafe = false;
    visit(node, child => { if (['html', 'image', 'imageReference'].includes(child.type)) unsafe = true; });
    if (unsafe) return;
    const from = node.children[0]?.position?.start.offset;
    const to = node.children.at(-1)?.position?.end.offset;
    if (from === undefined || to === undefined) return;
    const value = source.slice(from, to);
    // Multiline nested Markdown includes structural prefixes between child offsets.
    // Keep those cases in the source editor rather than accidentally deleting them.
    if (/\n\s*(?:>|[-+*] |\d+\. )/.test(value)) return;
    matches.push({ from, to, value });
  });
  return matches.length === 1 ? matches[0] : null;
}

export function mountPreviewEdit(preview: HTMLElement, input: HTMLTextAreaElement, report: (message: string) => void) {
  let close: (() => void) | undefined;
  const edit = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || event.target.closest('img, figure, pre, button')) return;
    const block = event.target.closest<HTMLElement>('h1,h2,h3,h4,h5,h6,p,li');
    if (!block || !block.closest('.magmark, .wc-content') || block.querySelector('img, ul, ol')) return;
    event.preventDefault(); event.stopPropagation();
    if (close) { report('请先保存或取消当前文字编辑。'); return; }
    const original = input.value;
    const marker = block.getAttribute('data-mm-edit');
    const range = marker ? getEditableSource(original, marker) : findEditableText(original, block.textContent || '', block.tagName);
    if (!range) { report('这段内容无法唯一定位到原文（可能重复、跨页或包含 HTML），请在左侧 Markdown 中编辑。'); return; }
    const panel = document.createElement('section');
    panel.className = 'preview-text-editor';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '编辑预览文字');
    const label = document.createElement('label');
    label.htmlFor = 'preview-text-input';
    label.textContent = '编辑文字 · 保留 Markdown 格式';
    const field = document.createElement('textarea');
    field.id = 'preview-text-input'; field.value = range.value;
    const hint = document.createElement('p');
    hint.textContent = '⌘ / Ctrl + Enter 保存 · Esc 取消；编辑完整原文块，跨页内容也会一起更新。';
    const actions = document.createElement('div');
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.textContent = '取消';
    const save = document.createElement('button');
    save.type = 'button'; save.textContent = '保存文字'; save.className = 'preview-text-save';
    actions.append(cancel, save); panel.append(label, field, hint, actions);
    document.body.append(panel);
    const toolbar = document.getElementById('block-toolbar');
    if (toolbar) toolbar.style.display = 'none';
    const rect = block.getBoundingClientRect();
    panel.style.width = `${Math.min(Math.max(rect.width, 320), window.innerWidth - 24)}px`;
    field.style.height = `${Math.min(Math.max(rect.height, 90), window.innerHeight * .4)}px`;
    panel.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - panel.offsetWidth - 12))}px`;
    panel.style.top = `${Math.max(12, Math.min(rect.top, window.innerHeight - panel.offsetHeight - 12))}px`;
    close = () => { panel.remove(); close = undefined; preview.focus({ preventScroll: true }); };
    cancel.addEventListener('click', () => close?.());
    save.addEventListener('click', () => {
      if (input.value !== original) { report('原文已发生变化，请取消后重新双击编辑，避免覆盖新内容。'); return; }
      if (field.value === range.value) { close?.(); return; }
      try {
        input.value = original.slice(0, range.from) + field.value + original.slice(range.to);
      } catch { report('请先完成正在进行的中文输入，再保存。'); return; }
      close?.();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      report('文字已更新，可在 Markdown 编辑区撤销。');
    });
    panel.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); close?.(); }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); save.click(); }
    });
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  };
  preview.addEventListener('dblclick', edit);
  return () => { close?.(); preview.removeEventListener('dblclick', edit); };
}

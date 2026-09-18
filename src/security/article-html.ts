import { unified } from 'unified';
import rehypeSanitize, { defaultSchema, type Options } from 'rehype-sanitize';
import type { Element, Root, RootContent } from 'hast';
import { parseInertHtml, serializeInertHtml } from './inert-html';

export type HtmlProfile = 'article' | 'cover';
const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'form', 'base', 'link', 'meta', 'noscript'];
const schema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'figure', 'figcaption', 'section', 'caption', 'colgroup', 'col'],
  strip: [...(defaultSchema.strip || []), ...blockedTags],
  // IDs are namespaced idempotently below; names are never retained.
  clobber: [],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []).filter(item => item !== 'name'),
      'className', 'style', 'lang', 'dir', 'dataMmSrc', 'dataPageBreak', 'dataBreakType',
      'dataLanguage', 'dataIgnoreWidth', 'dataMmEdit', 'leaf'],
    img: [...(defaultSchema.attributes?.img || []), 'width', 'height', 'loading', 'decoding', 'referrerPolicy'],
    ol: [...(defaultSchema.attributes?.ol || []), 'start', 'reversed'],
    li: [...(defaultSchema.attributes?.li || []), 'value'],
    td: [...(defaultSchema.attributes?.td || []), 'rowSpan', 'colSpan'],
    th: [...(defaultSchema.attributes?.th || []), 'rowSpan', 'colSpan', 'scope'],
    col: ['span', 'width', 'style'],
  },
  protocols: { ...defaultSchema.protocols, src: ['http', 'https', 'blob', 'data', 'file', 'mm-img'], href: ['http', 'https', 'mailto', 'tel'] },
};
const sanitizer = unified().use(rehypeSanitize, schema);
const styleProperties = new Set([
  'color', 'background', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'font-variant', 'font-feature-settings', 'line-height', 'letter-spacing', 'word-spacing',
  'text-align', 'text-align-last', 'text-indent', 'text-transform', 'text-decoration',
  'text-decoration-color', 'text-decoration-style', 'text-underline-offset', 'text-shadow',
  'white-space', 'word-break', 'overflow-wrap', 'word-wrap', 'line-break', 'hyphens',
  'vertical-align', 'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-width', 'border-style', 'border-radius', 'border-collapse', 'border-spacing',
  'box-sizing', 'box-shadow', 'opacity', 'float', 'clear', 'display', 'table-layout', 'list-style-type',
  'list-style-position', 'break-before', 'break-after', 'break-inside', 'page-break-before',
  'page-break-after', 'page-break-inside', 'orphans', 'widows',
  'text-autospace', 'text-spacing-trim', 'hanging-punctuation', 'text-justify',
  'text-emphasis', '-webkit-text-emphasis',
]);
const coverProperties = new Set([
  'object-fit', 'object-position',
  'position', 'top', 'right', 'bottom', 'left', 'inset', 'transform', 'transform-origin', 'z-index',
  'overflow', 'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self',
  'gap', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows',
]);
const safeFunctions = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch',
  'color', 'color-mix', 'linear-gradient', 'radial-gradient', 'conic-gradient',
  'repeating-linear-gradient', 'repeating-radial-gradient', 'calc', 'min', 'max', 'clamp', 'var']);
const coverFunctions = new Set(['translate', 'translatex', 'translatey', 'scale', 'scalex', 'scaley', 'rotate']);

/** A deliberately small CSS value language: never URLs, escapes, imports or arbitrary functions. */
export function sanitizeInlineStyle(style: string, profile: HtmlProfile = 'article'): string {
  const declarations: string[] = [];
  for (const part of style.split(';')) {
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    const property = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim().replace(/\s*!important\s*$/i, '');
    if (!styleProperties.has(property) && !(profile === 'cover' && coverProperties.has(property))) continue;
    if (!value || /[\\<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f{}@]|\/\*|\*\//.test(value)) continue;
    if ([...value.matchAll(/([\w-]+)\s*\(/g)].some(match =>
      !safeFunctions.has(match[1].toLowerCase()) && !(profile === 'cover' && coverFunctions.has(match[1].toLowerCase())))) continue;
    if (property === 'position' && !/^(relative|absolute|static)$/i.test(value)) continue;
    if (/^(?:-webkit-)?text-emphasis$/.test(property) && value !== 'none') continue;
    declarations.push(`${property}:${value}`);
  }
  return declarations.join(';');
}

/** Passive image sources only; SVG is supported as an img resource, never inline/executable SVG. */
export function isSafeImageSource(value: string): boolean {
  if (!value.trim()) return false;
  const probe = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  if (/^data:/i.test(probe)) return /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|svg\+xml)(?:;[^,]*)?,/i.test(probe);
  try { return ['http:', 'https:', 'blob:', 'file:', 'mm-img:'].includes(new URL(probe, 'https://magmark.invalid/').protocol); }
  catch { return false; }
}
function isSafeLink(value: string): boolean {
  try { return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value.replace(/[\u0000-\u0020\u007f-\u009f]/g, ''), 'https://magmark.invalid/').protocol); }
  catch { return false; }
}
function visitElements(tree: Root | Element, visit: (node: Element) => void) {
  for (const child of tree.children) {
    if (child.type !== 'element') continue;
    visit(child); visitElements(child, visit);
  }
}

function isImageParagraph(element: Element): boolean {
  if (element.tagName !== 'p') return false;
  let hasImage = false;
  for (const child of element.children) {
    if (child.type === 'text') {
      if (child.value.trim()) return false;
      continue;
    }
    if (child.type !== 'element' || !['img', 'br', 'em'].includes(child.tagName)) return false;
    if (child.tagName === 'img') hasImage = true;
  }
  return hasImage;
}

/** Shared trust boundary for article/SDK/clipboard/cover HTML. Does not modify Markdown. */
export function sanitizeArticleHtml(html: string, profile: HtmlProfile = 'article'): string {
  const tree = sanitizer.runSync(parseInertHtml(html)) as Root;
  const ids = new Map<string, string>();
  visitElements(tree, element => {
    const p = element.properties;
    delete p.name;
    if (typeof p.id === 'string') {
      const id = p.id;
      if (/^[\p{L}\p{N}_:.-]+$/u.test(id)) { p.id = id.startsWith('mm-user-') ? id : `mm-user-${id}`; ids.set(id, p.id); }
      else delete p.id;
    }
    if (typeof p.style === 'string') {
      const style = sanitizeInlineStyle(p.style, profile);
      if (style) p.style = style; else delete p.style;
    }
    if (p.className) {
      const values = Array.isArray(p.className) ? p.className.map(String) : String(p.className).split(/\s+/);
      p.className = values.filter(value => /^(?:mm-[\w-]+|language-[\w+-]+|hljs(?:-[\w-]+)?|token|contains-task-list|task-list-item)$/.test(value));
      if (!p.className.length) delete p.className;
    }
    if (isImageParagraph(element)) {
      const values = Array.isArray(p.className) ? p.className.map(String) : [];
      if (!values.includes('mm-image-paragraph')) p.className = [...values, 'mm-image-paragraph'];
    }
    if (typeof p.src === 'string' && !isSafeImageSource(p.src)) delete p.src;
    if (typeof p.href === 'string' && !isSafeLink(p.href)) delete p.href;
  });
  visitElements(tree, element => {
    const properties = element.properties;
    // Keep IDREF relationships in the same namespace as their target elements.
    for (const key of ['headers', 'ariaLabelledBy', 'ariaDescribedBy', 'htmlFor']) {
      const value = properties[key];
      if (Array.isArray(value)) properties[key] = value.map(id => ids.get(String(id)) || String(id));
      else if (typeof value === 'string') properties[key] = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
    }
    const href = properties.href;
    if (typeof href === 'string' && href.startsWith('#')) {
      let target = href.slice(1); try { target = decodeURIComponent(target); } catch { /* Preserve a literal malformed fragment. */ }
      const id = ids.get(target); if (id) element.properties.href = `#${id}`;
    }
  });
  return serializeInertHtml(tree);
}

/** Inspect source without treating comments, attribute text or raw script contents as images. */
export function inertImageElements(html: string): Element[] {
  const result: Element[] = [];
  const visit = (node: Root | RootContent) => {
    if (node.type === 'element') {
      if (blockedTags.includes(node.tagName)) return;
      if (node.tagName === 'img') result.push(node);
    }
    if ('children' in node) node.children.forEach(visit);
  };
  visit(parseInertHtml(html));
  return result;
}

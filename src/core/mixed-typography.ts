import type { Element, Root, Text, ElementContent, RootContent } from 'hast';
import { parseInertHtml, serializeInertHtml } from '../security/inert-html';
import { addCJKSpacing } from '../plugins/cjk-spacer';

const blocks = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'figcaption', 'blockquote', 'div', 'section']);
const opaque = new Set(['pre', 'code', 'kbd', 'samp', 'script', 'style', 'math', 'svg', 'a', 'ruby', 'rt', 'textarea']);

/** Cross-inline fallback for trusted rendered HTML, never Markdown or URLs.
 * Native autospace doesn't need text mutation. Portable HTML uses ordinary spaces
 * because external editors may strip CSS; applying this twice is harmless.
 */
export function spaceMixedHtml(html: string, space = ' '): string {
  const tree = parseInertHtml(html);
  let previous: Text | undefined;
  function walk(parent: Root | Element) {
    for (const child of parent.children) {
      if (child.type === 'text') {
        if (!child.value) continue;
        if (/\/\/|www\.|mailto:|@/iu.test(child.value)) { previous = undefined; continue; }
        const last = previous && Array.from(previous.value).reverse().find(c => !/\p{Mark}/u.test(c));
        const first = Array.from(child.value)[0];
        if (last && first && addCJKSpacing(last + first, space) !== last + first) child.value = space + child.value;
        child.value = addCJKSpacing(child.value, space);
        previous = child;
      } else if (child.type === 'element') {
        const name = child.tagName;
        if (opaque.has(name) || ['br', 'hr', 'img', 'wbr'].includes(name)) { previous = undefined; continue; }
        if (blocks.has(name)) previous = undefined;
        walk(child);
        if (blocks.has(name)) previous = undefined;
      }
    }
  }
  walk(tree);
  return serializeInertHtml(tree);
}

/** Decide before measurement, never decorate already-paginated content. */
export function prepareMixedPreview(html: string, nativeSpacing = typeof CSS !== 'undefined' && CSS.supports('text-autospace', 'normal')): string {
  const spaced = nativeSpacing ? html : spaceMixedHtml(html, '\u2009');
  return styleMixedRuns(spaced);
}

/** Match Latin optical size to CJK prose without changing characters or splitting words. */
export function styleMixedRuns(html: string): string {
  const tree = parseInertHtml(html);
  const textOf = (node: Root | RootContent): string => node.type === 'text' ? node.value
    : 'children' in node ? node.children.map(textOf).join('') : '';
  function walk(parent: Root | Element, mixed = false) {
    if (parent.type === 'element') {
      if (opaque.has(parent.tagName) || String(parent.properties.className || '').includes('mm-latin-run') || String(parent.properties.className || '').includes('mm-reference-run')) return;
      if (blocks.has(parent.tagName)) mixed = !/^h[1-6]$/.test(parent.tagName) && /\p{Script=Han}/u.test(textOf(parent));
    }
    const children: RootContent[] = [];
    for (const child of parent.children) {
      if (child.type !== 'text' || !mixed) {
        if (child.type === 'element') walk(child, mixed);
        children.push(child); continue;
      }
      // References remain exact; only their visual line-breaking is relaxed.
      const tokens = /(?:https?:\/\/|www\.)[^\s<>，。！？、；：）》」』】]+|[\p{Script=Latin}\d][\p{Script=Latin}\p{M}\d]*(?:[._'’+\-][\p{Script=Latin}\p{M}\d]+)*%?/gu;
      // Email/custom references stay conservative rather than splitting their address.
      if (/@|mailto:/i.test(child.value)) { children.push(child); continue; }
      let end = 0;
      for (const match of child.value.matchAll(tokens)) {
        if (match.index! > end) children.push({ type: 'text', value: child.value.slice(end, match.index) });
        const reference = /^(?:https?:\/\/|www\.)/i.test(match[0]);
        children.push({ type: 'element', tagName: 'span', properties: { className: [reference ? 'mm-reference-run' : 'mm-latin-run'] }, children: [{ type: 'text', value: match[0] }] });
        end = match.index! + match[0].length;
      }
      if (end < child.value.length) children.push({ type: 'text', value: child.value.slice(end) });
    }
    if (parent.type === 'root') parent.children = children;
    else parent.children = children.filter((child): child is ElementContent => child.type !== 'doctype');
  }
  walk(tree);
  return serializeInertHtml(tree);
}

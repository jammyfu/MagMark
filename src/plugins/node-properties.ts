import type { Node, Data } from 'unist';
import type { Element, ElementContent, Properties } from 'hast';

export interface HtmlData extends Data {
  hName?: string;
  hProperties?: Properties;
  hChildren?: ElementContent[];
}

/** remark-rehype's documented data bridge; keep mdast and hast node kinds separate. */
export function htmlData(node: Node): HtmlData {
  return (node.data ??= {}) as HtmlData;
}
export function properties(node: Node): Properties {
  return (htmlData(node).hProperties ??= {});
}
export function addClasses(node: Node, ...classes: string[]): void {
  const props = properties(node);
  const existing = props.className ?? props.class;
  const tokens = Array.isArray(existing) ? existing.map(String) : String(existing ?? '').split(/\s+/);
  props.className = [...new Set([...tokens, ...classes].filter(Boolean))];
  delete props.class;
}
export function addStyle(node: Node, css: string): void {
  const props = properties(node);
  props.style = `${String(props.style ?? '').replace(/;?\s*$/, '')}; ${css}`.replace(/^;\s*/, '');
}
export function element(tagName: string, props: Properties = {}, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties: props, children };
}

import { unified } from 'unified';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import type { Element, Root } from 'hast';

// parse5, not innerHTML/DOMParser: inspecting source never loads an image or
// creates a live element. This tree is UNTRUSTED until article-html sanitizes it.
const parser = unified().use(rehypeRaw);
const serializer = unified().use(rehypeStringify, { quote: '"', characterReferences: { useNamedReferences: true } });
export function parseInertHtml(html: string): Root {
  return parser.runSync({ type: 'root', children: [{ type: 'raw', value: html }] } as Root) as Root;
}
export function serializeInertHtml(tree: Root | Element): string {
  return String(serializer.stringify(tree.type === 'root' ? tree : { type: 'root', children: [tree] }));
}

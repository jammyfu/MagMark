import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { RootContent } from 'mdast';
import { findImageReferences } from '../image/image-context-menu';

type TextNode = { type: string; value?: string; children?: TextNode[] };
const normalize = (text: string) => text.replace(/[\s\u200b\u00ad]/g, '');
function textOf(node: TextNode): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value || '';
  return (node.children || []).map(textOf).join('');
}

/** Resolve every target before deleting anything; ambiguity leaves source intact. */
export function deleteSelectedSource(source: string, blocks: HTMLElement[], resolveImage: (src: string) => string) {
  const tree = unified().use(remarkParse).parse(source);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const block of blocks) {
    const image = block.matches('img') ? block as HTMLImageElement : block.querySelector('img');
    if (image) {
      const refs = findImageReferences(source).filter(ref => resolveImage(ref.src) === image.getAttribute('src') || ref.src === block.dataset.mmSrc);
      if (refs.length !== 1) return null;
      ranges.push(refs[0]); continue;
    }
    const tag = block.tagName.toLowerCase();
    const types: Record<string, string> = { p: 'paragraph', blockquote: 'blockquote', ul: 'list', ol: 'list', pre: 'code', hr: 'thematicBreak' };
    const matches = tree.children.filter((node: RootContent) => {
      if (/^h[1-6]$/.test(tag)) {
        if (node.type !== 'heading' || node.depth !== Number(tag[1])) return false;
      } else if (node.type !== types[tag]) return false;
      return normalize(textOf(node)) === normalize(block.textContent || '');
    });
    if (matches.length !== 1) return null;
    const start = matches[0].position?.start.offset, end = matches[0].position?.end.offset;
    if (start === undefined || end === undefined) return null;
    ranges.push({ start, end });
  }
  const unique = [...new Map(ranges.map(range => [`${range.start}:${range.end}`, range])).values()].sort((a,b) => b.start - a.start);
  let result = source;
  for (const range of unique) result = result.slice(0, range.start) + result.slice(range.end);
  return result;
}

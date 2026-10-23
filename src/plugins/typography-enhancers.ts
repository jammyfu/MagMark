/** Typography metadata is separate from source text. Literal nodes are opaque. */
import { visit } from 'unist-util-visit';
import type { Root, Nodes } from 'mdast';
import { addClasses, addStyle } from './node-properties';

export interface TypographyOptions {
  preventWidows?: boolean;
  preventOrphans?: boolean;
  widowMinWords?: number;
  hangingPunctuation?: boolean;
  smartQuotes?: boolean;
  opticalAlignment?: boolean;
  baseFontSize?: number;
}
const opaque = new Set(['code', 'inlineCode', 'html', 'link', 'linkReference', 'image', 'imageReference', 'definition', 'math', 'inlineMath', 'yaml', 'toml']);

/** Explicit prose-only conversion, never raw Markdown, code or a URL. */
export function smartenQuotes(text: string): string {
  if (!text || /\/\/|www\.|mailto:|@/iu.test(text)) return text;
  const chars = Array.from(text);
  return chars.map((char, index) => {
    if (char !== '"' && char !== "'") return char;
    const previous = chars[index - 1], next = chars[index + 1];
    if (char === "'" && previous && next && /\p{L}/u.test(previous) && /\p{L}/u.test(next)) return '’';
    const opening = !previous || /[\s(\[{（【《「『]/u.test(previous);
    return char === '"' ? (opening ? '“' : '”') : (opening ? '‘' : '’');
  }).join('');
}

export function typographyEnhancers(options: TypographyOptions = {}) {
  return (tree: Root): Root => {
    if (options.smartQuotes !== false) {
      const pending: Nodes[] = [tree];
      while (pending.length) {
        const node = pending.pop()!;
        if (opaque.has(node.type)) continue;
        if (node.type === 'text') node.value = smartenQuotes(node.value);
        if ('children' in node) pending.push(...node.children);
      }
    }
    visit(tree, 'paragraph', node => {
      addClasses(node, 'mm-paragraph',
        ...(options.preventWidows !== false ? ['mm-no-widows'] : []),
        ...(options.preventOrphans !== false ? ['mm-no-orphans'] : []),
        ...(options.hangingPunctuation !== false ? ['mm-hanging-punctuation'] : []));
      addStyle(node, 'line-break: strict;');
      if (options.preventWidows !== false) addStyle(node, 'widows: 2;');
      if (options.preventOrphans !== false) addStyle(node, 'orphans: 2;');
      if (options.hangingPunctuation !== false) addStyle(node, 'hanging-punctuation: first last;');
    });
    visit(tree, 'heading', node => {
      addClasses(node, 'mm-heading', `mm-h${node.depth}`,
        ...(options.preventWidows !== false ? ['mm-no-widows'] : []));
    });
    visit(tree, 'blockquote', node => addClasses(node, 'mm-pull-quote', 'mm-no-break'));
    return tree;
  };
}

/** Explicit legacy string utility. Not called by automatic paragraph rendering. */
export function noWidows(text: string, minWords = 2): string {
  if (!text || !Number.isInteger(minWords) || minWords < 2) return text;
  const words = text.split(' ');
  if (words.length <= minWords) return text;
  return `${words.slice(0, -minWords).join(' ')} ${words.slice(-minWords).join('\u00a0')}`;
}
/** Explicit legacy utility; automatic rendering uses CSS and never inserts ZWSP. */
export function cjkBreaks(text: string): string {
  return text.replace(/([，。！？、；：])(?![\n\r\u200b])/gu, '$1\u200b');
}
export default typographyEnhancers;

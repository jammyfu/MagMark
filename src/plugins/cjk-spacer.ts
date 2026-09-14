/**
 * Conservative Han/Latin spacing for prose AST nodes.
 * This rendering transformation changes AST text, not the Markdown source.
 * It is not a complete CJK line-breaking or cross-inline typography engine.
 */
const HAN = /\p{Script=Han}/u;
const LATIN = /\p{Script=Latin}/u;
const MARK = /\p{Mark}/u;
const FULLWIDTH_LATIN = /[Ａ-Ｚａ-ｚ]/u;
// Without GFM, a bare URL/email can still be an ordinary text node. Preserve
// the entire such run rather than guessing where its editable prose ends.
// Fixed-width signals avoid quadratic backtracking on long reference-free prose.
// Treat any @ or // conservatively; a false positive preserves text, not corrupts it.
const LITERAL_REFERENCE = /\/\/|www\.|mailto:|@/iu;

type CharacterKind = 'han' | 'latin-number' | 'other';
function characterKind(character: string): CharacterKind {
  if (HAN.test(character)) return 'han';
  if ((LATIN.test(character) && !FULLWIDTH_LATIN.test(character)) || /[0-9]/.test(character)) {
    return 'latin-number';
  }
  return 'other';
}

/** Plain prose only. Do not pass raw Markdown, HTML, URLs or source code here. */
export function addCJKSpacing(text: string, space = ' '): string {
  if (!text || typeof text !== 'string' || !space || LITERAL_REFERENCE.test(text)) return text;
  const result: string[] = [];
  let previous: CharacterKind = 'other';
  // for...of iterates code points, not UTF-16 halves. Combining marks and
  // variation selectors remain attached to their preceding base character.
  for (const character of text) {
    if (MARK.test(character)) {
      result.push(character);
      continue;
    }
    const current = characterKind(character);
    if ((previous === 'han' && current === 'latin-number') ||
        (previous === 'latin-number' && current === 'han')) {
      result.push(space);
    }
    result.push(character);
    previous = current;
  }
  return result.join('');
}

export interface CJKSpacerOptions {
  enabled?: boolean;
  space?: string;
}

interface ProseNode {
  type: string;
  value?: string;
  children?: ProseNode[];
}

// Link subtrees are deliberately conservative: a visible autolink can itself
// be an executable URL. A future source-aware text-run adapter may distinguish
// descriptive link labels, but this transformer must not guess.
const OPAQUE_TYPES = new Set([
  'inlineCode', 'code', 'math', 'inlineMath', 'html',
  'link', 'linkReference', 'image', 'imageReference', 'definition',
  'yaml', 'toml',
]);

/** Existing async transformer contract retained for current consumers. */
export function cjkSpacer(options: CJKSpacerOptions = {}) {
  const { enabled = true, space = ' ' } = options;
  return async <T extends ProseNode>(tree: T): Promise<T> => {
    if (!enabled || !space) return tree;
    const pending: ProseNode[] = [tree];
    while (pending.length) {
      const node = pending.pop()!;
      if (OPAQUE_TYPES.has(node.type)) continue;
      if (node.type === 'text' && typeof node.value === 'string') {
        node.value = addCJKSpacing(node.value, space);
      }
      if (node.children) {
        for (let index = node.children.length - 1; index >= 0; index--) {
          pending.push(node.children[index]);
        }
      }
    }
    return tree;
  };
}

export function containsCJK(text: string): boolean {
  return typeof text === 'string' && HAN.test(text);
}

/** Explicit cleanup only: remove a single ASCII space between Han characters.
 * Existing NBSPs, tabs, newlines and other intentional spacing are preserved.
 */
export function normalizeCJKSpacing(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/(\p{Script=Han}) (?=\p{Script=Han})/gu, '$1');
}

export default cjkSpacer;

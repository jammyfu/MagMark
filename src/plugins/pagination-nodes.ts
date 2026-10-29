/** Semantic page-break metadata. Physical DOM pagination lives in src/engine. */
import { visit } from 'unist-util-visit';
import type { Root, RootContent, ThematicBreak } from 'mdast';
import type { Element, Properties } from 'hast';
import { addClasses, element, htmlData, properties } from './node-properties';

export const DEFAULT_PAGE_BREAK_MARKERS = ['---', '<!-- page-break -->', '<!--page-break-->', '{page-break}', '[[page-break]]'];
export const PageBreakType = { MANUAL: 'manual', CHAPTER: 'chapter', SECTION: 'section', AUTO: 'auto' } as const;
export interface PaginationOptions {
  markers?: string[];
  chapterNewPage?: boolean;
  avoidBreakInside?: boolean;
  avoidBreakInsideSelectors?: string[];
  addPageNumbers?: boolean;
  pageNumberFormat?: 'numeric' | 'roman' | 'alpha';
}

export function createPageBreakNode(type: string = PageBreakType.MANUAL, options: Properties = {}): Element {
  return element('span', { className: ['mm-page-break', `mm-page-break--${type}`],
    'data-page-break': 'true', 'data-break-type': type, ...options });
}
function semanticBreak(type: string): ThematicBreak {
  return { type: 'thematicBreak', data: { hName: 'span', hProperties: createPageBreakNode(type).properties } };
}
export function createPageNumberNode(number: number, format: 'numeric' | 'roman' | 'alpha' = 'numeric'): Element {
  if (!Number.isSafeInteger(number) || number < 1) throw new RangeError('Page number must be a positive safe integer');
  let value = String(number);
  if (format === 'roman' && number <= 3999) {
    let remaining = number; value = '';
    for (const [symbol, amount] of [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]] as const) {
      const count = Math.floor(remaining / amount); value += symbol.repeat(count); remaining -= count * amount;
    }
  } else if (format === 'alpha') {
    let remaining = number; value = '';
    while (remaining > 0) { remaining--; value = String.fromCharCode(65 + remaining % 26) + value; remaining = Math.floor(remaining / 26); }
  }
  return element('span', { className: ['mm-page-number'], 'data-page-number': String(number) }, [{ type: 'text', value }]);
}

export function paginationNodes(options: PaginationOptions = {}) {
  const markers = new Set(options.markers ?? DEFAULT_PAGE_BREAK_MARKERS);
  return (tree: Root): Root => {
    visit(tree, 'thematicBreak', node => {
      if (markers.has('---')) Object.assign(htmlData(node), semanticBreak(PageBreakType.MANUAL).data);
    });
    visit(tree, 'html', (node, index, parent) => {
      // Exact markers only: never delete arbitrary user HTML containing "page-break".
      if (parent && index !== undefined && markers.has(node.value.trim())) {
        parent.children[index] = semanticBreak(PageBreakType.MANUAL);
      }
    });
    visit(tree, 'paragraph', (node, index, parent) => {
      const child = node.children.length === 1 ? node.children[0] : undefined;
      if (parent && index !== undefined && child?.type === 'text' && markers.has(child.value.trim())) {
        parent.children[index] = semanticBreak(PageBreakType.MANUAL);
      }
    });
    if (options.chapterNewPage !== false) {
      const result: RootContent[] = [];
      // Chapters are top-level sections, not headings inside a list/quote.
      for (const node of tree.children) {
        const previous = result[result.length - 1];
        if (node.type === 'heading' && node.depth === 1 && previous &&
            htmlData(previous).hProperties?.['data-page-break'] !== 'true') {
          result.push(semanticBreak(PageBreakType.CHAPTER));
        }
        result.push(node);
      }
      tree.children = result;
    }
    if (options.avoidBreakInside !== false) {
      const selectors = new Set(options.avoidBreakInsideSelectors ?? ['table', 'pre', 'blockquote', 'figure', 'img']);
      visit(tree, node => {
        const tag = node.type === 'code' ? 'pre' : node.type === 'image' ? 'img' : node.type;
        if (selectors.has(tag)) { addClasses(node, 'mm-no-break'); properties(node)['data-break-inside'] = 'avoid'; }
      });
    }
    return tree;
  };
}

export interface PaginationElement { height?: number; preventBreak?: boolean }
export interface HeightPaginationOptions { minContentHeight?: number; orphans?: number; widows?: number }
/** Whole-block estimator only; widow/orphan rules require real text-line measurements. */
export function calculatePagination<T extends PaginationElement>(elements: T[], availableHeight: number, _options: HeightPaginationOptions = {}): T[][] {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) throw new RangeError('Available height must be positive');
  const pages: T[][] = [];
  let page: T[] = []; let used = 0;
  for (const item of elements) {
    const height = item.height ?? 0;
    if (!Number.isFinite(height) || height < 0) throw new RangeError('Element height must be nonnegative');
    if (page.length && used + height > availableHeight) { pages.push(page); page = []; used = 0; }
    page.push(item); used += height;
  }
  if (page.length) pages.push(page);
  return pages;
}
export function insertPageBreak(): Element { return createPageBreakNode(PageBreakType.MANUAL); }
export function insertChapterBreak(): Element { return createPageBreakNode(PageBreakType.CHAPTER); }
export default paginationNodes;

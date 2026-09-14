import { legalTextBreaks } from './text-boundaries';

export interface FragmentMeasurement { height: number; lines: number }
export interface FragmentContext {
  availableHeight: number;
  measurePrefix(html: string): FragmentMeasurement;
  measureRemainder(html: string): FragmentMeasurement;
}
export interface BlockSplit { before: string; after: string; beforeHeight: number }
interface FragmentPair { before: HTMLElement; after: HTMLElement }

/** Text offsets and DOM Range offsets share ALL text nodes, including whitespace. */
function textNodes(root: HTMLElement): Text[] {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  return nodes;
}

/** Count visual text lines, coalescing inline Range rectangles on the same line. */
export function countTextLines(root: HTMLElement | null, stopAfter = Number.POSITIVE_INFINITY): number {
  if (!root) return 0;
  const bands: { top: number; bottom: number }[] = [];
  for (const node of textNodes(root)) {
    if (!node.data) continue;
    const range = root.ownerDocument.createRange();
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const band = bands.find(b => Math.min(b.bottom, rect.bottom) - Math.max(b.top, rect.top) > 0.5);
      if (band) { band.top = Math.min(band.top, rect.top); band.bottom = Math.max(band.bottom, rect.bottom); }
      else bands.push({ top: rect.top, bottom: rect.bottom });
      if (bands.length >= stopAfter) return bands.length;
    }
  }
  return bands.length;
}

function textFragments(element: HTMLElement, nodes: Text[], offset: number): FragmentPair {
  let remaining = offset;
  let boundary = nodes[nodes.length - 1];
  for (const node of nodes) {
    boundary = node;
    if (remaining <= node.length) break;
    remaining -= node.length;
  }
  const make = (before: boolean): HTMLElement => {
    const target = element.cloneNode(false) as HTMLElement;
    const range = element.ownerDocument.createRange();
    if (before) { range.setStart(element, 0); range.setEnd(boundary, remaining); }
    else { range.setStart(boundary, remaining); range.setEnd(element, element.childNodes.length); }
    target.appendChild(range.cloneContents());
    target.classList.add(before ? 'mm-split-fragment--before' : 'mm-split-fragment--after');
    target.dataset.splitFragment = before ? 'before' : 'after';
    return target;
  };
  return { before: make(true), after: make(false) };
}

/** Search only the monotone prefix-fit condition; the remainder may span MANY pages. */
function chooseSplit(
  candidates: number[],
  build: (position: number) => FragmentPair,
  context: FragmentContext,
  minimumTextLines = 0,
): BlockSplit | null {
  let low = 0, high = candidates.length - 1, best = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const pair = build(candidates[mid]);
    const measured = context.measurePrefix(pair.before.outerHTML);
    if (measured.height <= context.availableHeight) { best = mid; low = mid + 1; }
    else high = mid - 1;
  }
  // Widow/orphan checks are deliberately outside binary search: a prefix that
  // is too short must NOT move the upper bound in the same way as an overflow.
  while (best >= 0) {
    const pair = build(candidates[best]);
    const measured = context.measurePrefix(pair.before.outerHTML);
    if (minimumTextLines && measured.lines < minimumTextLines) return null;
    if (minimumTextLines && context.measureRemainder(pair.after.outerHTML).lines < minimumTextLines) {
      best--;
      continue;
    }
    if (measured.height <= context.availableHeight) {
      return { before: pair.before.outerHTML, after: pair.after.outerHTML, beforeHeight: measured.height };
    }
    best--;
  }
  return null;
}

function splitText(element: HTMLElement, context: FragmentContext, code: boolean): BlockSplit | null {
  const nodes = textNodes(element);
  const text = nodes.map(node => node.data).join('');
  if (!nodes.length || !text) return null;
  const candidates = code
    ? [...text.matchAll(/\n/g)].map(match => match.index! + 1).filter(index => index < text.length)
    : legalTextBreaks(text);
  return chooseSplit(candidates, offset => textFragments(element, nodes, offset), context, 2);
}

function splitList(list: HTMLElement, context: FragmentContext): BlockSplit | null {
  const items = Array.from(list.children).filter(el => el.tagName === 'LI') as HTMLLIElement[];
  if (items.length < 2) return null;
  const ordered = list.tagName === 'OL';
  const ol = list as HTMLOListElement;
  let number = ol.hasAttribute('start') ? ol.start : ol.reversed ? items.length : 1;
  const numbers = items.map(item => {
    if (item.hasAttribute('value')) number = item.value;
    const value = number;
    number += ol.reversed ? -1 : 1;
    return value;
  });
  const make = (start: number, end: number): HTMLElement => {
    const fragment = list.cloneNode(false) as HTMLElement;
    if (ordered) fragment.setAttribute('start', String(numbers[start]));
    fragment.append(...items.slice(start, end).map(item => item.cloneNode(true)));
    return fragment;
  };
  return chooseSplit(items.slice(1).map((_item, i) => i + 1), index => ({
    before: make(0, index), after: make(index, items.length),
  }), context);
}

function bodyRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.tBodies).flatMap(body => Array.from(body.rows));
}

function splitTable(table: HTMLTableElement, context: FragmentContext): BlockSplit | null {
  const rows = bodyRows(table);
  if (rows.length < 2) return null;
  const unsafe = new Set<number>();
  let base = 0;
  for (const body of Array.from(table.tBodies)) {
    const group = Array.from(body.rows);
    group.forEach((row, index) => {
      for (const cell of Array.from(row.cells)) {
        const end = cell.rowSpan === 0 ? group.length : Math.min(group.length, index + cell.rowSpan);
        for (let cut = index + 1; cut < end; cut++) unsafe.add(base + cut);
      }
    });
    base += group.length;
  }
  const candidates = rows.slice(1).map((_row, i) => i + 1).filter(index => !unsafe.has(index));
  const make = (start: number, end: number): HTMLElement => {
    // Clone table sections instead of rebuilding only the first tbody. This
    // preserves column widths, multiple row groups, nested tables and metadata.
    const fragment = table.cloneNode(true) as HTMLTableElement;
    bodyRows(fragment).forEach((row, index) => { if (index < start || index >= end) row.remove(); });
    Array.from(fragment.tBodies).forEach(body => { if (!body.rows.length) body.remove(); });
    if (start > 0) fragment.caption?.remove();
    if (end < rows.length) fragment.tFoot?.remove();
    return fragment;
  };
  return chooseSplit(candidates, index => ({ before: make(0, index), after: make(index, rows.length) }), context);
}

/** Fragment supported blocks without editing the source document or flattening inline markup. */
export function splitContentBlock(html: string, context: FragmentContext): BlockSplit | null {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const element = wrapper.firstElementChild as HTMLElement | null;
  if (!element) return null;
  switch (element.tagName) {
    case 'P': return splitText(element, context, false);
    case 'PRE': return splitText(element, context, true);
    case 'UL': case 'OL': return splitList(element, context);
    case 'TABLE': return splitTable(element as HTMLTableElement, context);
    default: return null;
  }
}

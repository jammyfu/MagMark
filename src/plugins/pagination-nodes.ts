/**
 * MagMark 2.0 - Pagination Nodes Plugin
 * Handles manual page breaks and pagination controls
 */
import { visit } from 'unist-util-visit';
import { u } from 'unist-builder';

/**
 * Default page break markers
 */
export const DEFAULT_PAGE_BREAK_MARKERS = [
  '---',
  '<!-- page-break -->',
  '<!--page-break-->',
  '{page-break}',
  '[[page-break]]'
];

/**
 * Page break types
 */
export const PageBreakType = {
  MANUAL: 'manual',
  CHAPTER: 'chapter',
  SECTION: 'section',
  AUTO: 'auto'
};

/**
 * Configuration options
 */
export interface PaginationOptions {
  /** Markers that trigger page breaks */
  markers?: string[];
  /** Enable automatic page breaks at chapters */
  chapterNewPage?: boolean;
  /** Avoid breaking inside elements */
  avoidBreakInside?: boolean;
  /** Elements to avoid breaking inside */
  avoidBreakInsideSelectors?: string[];
  /** Add page numbers */
  addPageNumbers?: boolean;
  /** Page number format */
  pageNumberFormat?: 'numeric' | 'roman' | 'alpha';
}

const defaultOptions = {
  markers: DEFAULT_PAGE_BREAK_MARKERS,
  chapterNewPage: true,
  avoidBreakInside: true,
  avoidBreakInsideSelectors: ['table', 'pre', 'blockquote', 'figure', 'img'],
  addPageNumbers: false,
  pageNumberFormat: 'numeric'
};

/**
 * Check if text is a page break marker
 */
function isPageBreakMarker(text, markers) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return markers.some(marker => trimmed === marker);
}

/**
 * Check if HTML comment is a page break marker
 */
function isPageBreakComment(comment, markers) {
  if (!comment || typeof comment !== 'string') return false;
  const trimmed = comment.trim();
  return markers.some(marker => {
    // Check for HTML comment format
    if (marker.startsWith('<!--') && marker.endsWith('-->')) {
      return trimmed === marker.slice(4, -3).trim();
    }
    return trimmed === marker;
  });
}

/**
 * Create a page break node
 */
export function createPageBreakNode(type = PageBreakType.MANUAL, options = {}) {
  return u('element', {
    tagName: 'span',
    properties: {
      class: `mm-page-break mm-page-break--${type}`,
      'data-page-break': 'true',
      'data-break-type': type,
      ...options
    }
  });
}

/**
 * Create a page number marker
 */
export function createPageNumberNode(number, format = 'numeric') {
  let formattedNumber = number;
  
  switch (format) {
    case 'roman':
      formattedNumber = toRoman(number);
      break;
    case 'alpha':
      formattedNumber = toAlpha(number);
      break;
    default:
      formattedNumber = String(number);
  }
  
  return u('element', {
    tagName: 'span',
    properties: {
      class: 'mm-page-number',
      'data-page-number': String(number)
    }
  }, [u('text', formattedNumber)]);
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num) {
  const roman = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let str = '';
  
  for (let i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  
  return str;
}

/**
 * Convert number to letters (A, B, C...)
 */
function toAlpha(num) {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/**
 * Main pagination plugin
 */
export function paginationNodes(options = {}) {
  const opts = { ...defaultOptions, ...options };
  
  return async (tree, file) => {
    const transformations = [];
    
    // Find and transform thematic breaks (---) to page breaks
    visit(tree, 'thematicBreak', (node, index, parent) => {
      transformations.push({
        type: 'replace',
        parent,
        index,
        newNode: createPageBreakNode(PageBreakType.MANUAL)
      });
    });

    // Find HTML comments that are page break markers
    visit(tree, 'html', (node, index, parent) => {
      const html = node.value || '';
      
      // Check for HTML comment page breaks
      if (html.startsWith('<!--') && html.endsWith('-->')) {
        const comment = html.slice(4, -3);
        if (isPageBreakComment(comment, opts.markers)) {
          transformations.push({
            type: 'replace',
            parent,
            index,
            newNode: createPageBreakNode(PageBreakType.MANUAL)
          });
        }
      }
      
      // Check for div with page-break class
      if (html.includes('page-break') || html.includes('pageBreak')) {
        transformations.push({
          type: 'replace',
          parent,
          index,
          newNode: createPageBreakNode(PageBreakType.MANUAL)
        });
      }
    });

    // Find paragraphs that contain only page break markers
    visit(tree, 'paragraph', (node, index, parent) => {
      if (node.children && node.children.length === 1) {
        const child = node.children[0];
        if (child.type === 'text' && isPageBreakMarker(child.value, opts.markers)) {
          transformations.push({
            type: 'replace',
            parent,
            index,
            newNode: createPageBreakNode(PageBreakType.MANUAL)
          });
        }
      }
    });

    // Add page breaks before h1 if chapterNewPage is enabled
    if (opts.chapterNewPage) {
      visit(tree, 'heading', (node, index, parent) => {
        if (node.depth === 1 && index > 0) {
          // Check if previous node is already a page break
          const prevNode = parent.children[index - 1];
          if (!prevNode?.properties?.['data-page-break']) {
            transformations.push({
              type: 'insertBefore',
              parent,
              index,
              newNode: createPageBreakNode(PageBreakType.CHAPTER)
            });
          }
        }
      });
    }

    // Apply all transformations
    // Sort by index in reverse order to avoid index shifting
    transformations.sort((a, b) => b.index - a.index);
    
    transformations.forEach(({ type, parent, index, newNode }) => {
      if (type === 'replace') {
        parent.children[index] = newNode;
      } else if (type === 'insertBefore') {
        parent.children.splice(index, 0, newNode);
      }
    });

    // Add break-inside-avoid to specified elements
    if (opts.avoidBreakInside) {
      const selectors = [
        'table',
        'code',
        'blockquote', 
        'figure',
        'img',
        ...(opts.avoidBreakInsideSelectors || [])
      ];
      
      visit(tree, ['code', 'blockquote', 'table'], (node) => {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        const currentClass = node.data.hProperties.class || '';
        node.data.hProperties.class = `${currentClass} mm-no-break`.trim();
      });
    }

    return tree;
  };
}

/**
 * Calculate page heights and distribute content across pages
 * Pure JS pagination for interactive mode
 */
export function calculatePagination(elements, availableHeight, options = {}) {
  const {
    minContentHeight = 100,
    orphans = 2,
    widows = 2
  } = options;
  
  const pages = [];
  let currentPage = [];
  let currentHeight = 0;
  
  elements.forEach((element, index) => {
    const height = element.height || 0;
    const canBreak = !element.preventBreak;
    
    // Check if element fits on current page
    if (currentHeight + height <= availableHeight) {
      currentPage.push(element);
      currentHeight += height;
    } else {
      // Element doesn't fit - check if we can break
      if (canBreak && currentHeight >= minContentHeight) {
        // Start new page
        pages.push(currentPage);
        currentPage = [element];
        currentHeight = height;
      } else {
        // Can't break - try to fit anyway or force break
        if (currentHeight === 0) {
          // First element on page - add it anyway
          currentPage.push(element);
          currentHeight += height;
        } else {
          // Move to new page
          pages.push(currentPage);
          currentPage = [element];
          currentHeight = height;
        }
      }
    }
  });
  
  // Add last page
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  return pages;
}

/**
 * Insert manual page break
 * Utility function for programmatic use
 */
export function insertPageBreak() {
  return createPageBreakNode(PageBreakType.MANUAL);
}

/**
 * Insert chapter page break
 */
export function insertChapterBreak() {
  return createPageBreakNode(PageBreakType.CHAPTER);
}

export default paginationNodes;

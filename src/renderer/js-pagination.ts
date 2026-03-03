/**
 * MagMark 2.0 - JavaScript Pagination Engine
 * Pure JS height calculation for interactive drag-and-drop pagination
 */

export interface PaginationElement {
  id: string;
  type: 'text' | 'heading' | 'image' | 'quote' | 'code' | 'list' | 'table' | 'break';
  content: string;
  height: number;
  preventBreak?: boolean;
  breakBefore?: boolean;
  breakAfter?: boolean;
}

export interface PageLayout {
  id: string;
  elements: PaginationElement[];
  height: number;
  availableHeight: number;
}

export interface PaginationOptions {
  /** Available height per page in pixels */
  availableHeight: number;
  /** Minimum content height to avoid tiny pages */
  minContentHeight?: number;
  /** Number of lines to keep together (widows/orphans) */
  widowOrphanLines?: number;
  /** Line height in pixels */
  lineHeight?: number;
  /** Allow manual drag point adjustment */
  dragPointSupport?: boolean;
  /** Breakpoints inserted by user */
  manualBreakpoints?: number[];
}

const defaultOptions: Partial<PaginationOptions> = {
  minContentHeight: 100,
  widowOrphanLines: 2,
  lineHeight: 28, // 16px * 1.75
  dragPointSupport: true,
  manualBreakpoints: [],
};

/**
 * Measure the rendered height of an element
 */
export function measureElementHeight(
  element: HTMLElement,
  containerWidth: number
): number {
  // Create a hidden measurement container
  const measurer = document.createElement('div');
  measurer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${containerWidth}px;
    left: -9999px;
  `;
  
  // Clone the element for measurement
  const clone = element.cloneNode(true) as HTMLElement;
  measurer.appendChild(clone);
  document.body.appendChild(measurer);
  
  const height = clone.offsetHeight;
  
  document.body.removeChild(measurer);
  
  return height;
}

/**
 * Calculate optimal page breaks
 */
export function calculatePageHeights(
  elements: PaginationElement[],
  options: PaginationOptions
): PageLayout[] {
  const opts = { ...defaultOptions, ...options };
  const { availableHeight, minContentHeight, widowOrphanLines, lineHeight } = opts;
  
  const pages: PageLayout[] = [];
  let currentPage: PaginationElement[] = [];
  let currentHeight = 0;
  let pageId = 1;
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const elementHeight = element.height;
    
    // Handle forced page breaks
    if (element.type === 'break' || element.breakBefore) {
      if (currentPage.length > 0) {
        pages.push({
          id: `page-${pageId++}`,
          elements: [...currentPage],
          height: currentHeight,
          availableHeight,
        });
        currentPage = [];
        currentHeight = 0;
      }
      continue;
    }
    
    // Check if element fits on current page
    if (currentHeight + elementHeight <= availableHeight) {
      currentPage.push(element);
      currentHeight += elementHeight;
      
      // Check for break-after
      if (element.breakAfter) {
        pages.push({
          id: `page-${pageId++}`,
          elements: [...currentPage],
          height: currentHeight,
          availableHeight,
        });
        currentPage = [];
        currentHeight = 0;
      }
    } else {
      // Element doesn't fit - need to break
      
      // Check if we can split text elements
      if (element.type === 'text' && !element.preventBreak) {
        const remainingSpace = availableHeight - currentHeight;
        
        // If there's enough space for minimum content
        if (remainingSpace >= minContentHeight!) {
          // Split the text element
          const splitResult = splitTextElement(
            element,
            remainingSpace,
            availableHeight,
            lineHeight!
          );
          
          if (splitResult.before) {
            currentPage.push(splitResult.before);
          }
          
          pages.push({
            id: `page-${pageId++}`,
            elements: [...currentPage],
            height: currentHeight + (splitResult.before?.height || 0),
            availableHeight,
          });
          
          currentPage = splitResult.after ? [splitResult.after] : [];
          currentHeight = splitResult.after?.height || 0;
        } else {
          // Not enough space - start new page
          if (currentPage.length > 0) {
            pages.push({
              id: `page-${pageId++}`,
              elements: [...currentPage],
              height: currentHeight,
              availableHeight,
            });
          }
          
          // Check if element itself needs splitting
          if (elementHeight > availableHeight) {
            const splitResult = splitTextElement(
              element,
              availableHeight,
              availableHeight,
              lineHeight!
            );
            
            currentPage = splitResult.before ? [splitResult.before] : [];
            currentHeight = splitResult.before?.height || 0;
            
            if (splitResult.after) {
              pages.push({
                id: `page-${pageId++}`,
                elements: [...currentPage],
                height: currentHeight,
                availableHeight,
              });
              currentPage = [splitResult.after];
              currentHeight = splitResult.after.height;
            }
          } else {
            currentPage = [element];
            currentHeight = elementHeight;
          }
        }
      } else {
        // Non-splittable element - start new page
        if (currentPage.length > 0) {
          pages.push({
            id: `page-${pageId++}`,
            elements: [...currentPage],
            height: currentHeight,
            availableHeight,
          });
        }
        
        currentPage = [element];
        currentHeight = elementHeight;
      }
    }
  }
  
  // Add final page
  if (currentPage.length > 0) {
    pages.push({
      id: `page-${pageId++}`,
      elements: currentPage,
      height: currentHeight,
      availableHeight,
    });
  }
  
  return pages;
}

/**
 * Split a text element across pages
 */
function splitTextElement(
  element: PaginationElement,
  firstPageSpace: number,
  availableHeight: number,
  lineHeight: number
): { before?: PaginationElement; after?: PaginationElement } {
  // Calculate lines that fit on first page
  const linesOnFirstPage = Math.floor(firstPageSpace / lineHeight);
  const minLines = 2; // Prevent widows/orphans
  
  if (linesOnFirstPage < minLines) {
    // Not enough space for minimum lines
    return { after: element };
  }
  
  // Split content by lines
  const lines = element.content.split('\n');
  
  if (lines.length <= linesOnFirstPage) {
    // All lines fit
    return { before: element };
  }
  
  const beforeLines = lines.slice(0, linesOnFirstPage - minLines);
  const afterLines = lines.slice(linesOnFirstPage - minLines);
  
  return {
    before: {
      ...element,
      id: `${element.id}-1`,
      content: beforeLines.join('\n'),
      height: beforeLines.length * lineHeight,
    },
    after: {
      ...element,
      id: `${element.id}-2`,
      content: afterLines.join('\n'),
      height: afterLines.length * lineHeight,
    },
  };
}

/**
 * Adjust page break at a specific drag point
 */
export function adjustPageBreak(
  pages: PageLayout[],
  pageIndex: number,
  elementIndex: number,
  moveToNextPage: boolean
): PageLayout[] {
  const newPages = [...pages];
  const currentPage = newPages[pageIndex];
  
  if (moveToNextPage && pageIndex < newPages.length - 1) {
    // Move element to next page
    const element = currentPage.elements[elementIndex];
    const nextPage = newPages[pageIndex + 1];
    
    currentPage.elements.splice(elementIndex, 1);
    currentPage.height -= element.height;
    
    nextPage.elements.unshift(element);
    nextPage.height += element.height;
  } else if (!moveToNextPage && pageIndex > 0) {
    // Move element to previous page
    const element = currentPage.elements[elementIndex];
    const prevPage = newPages[pageIndex - 1];
    
    currentPage.elements.splice(elementIndex, 1);
    currentPage.height -= element.height;
    
    prevPage.elements.push(element);
    prevPage.height += element.height;
  }
  
  return newPages;
}

/**
 * Insert a manual page break
 */
export function insertManualPageBreak(
  pages: PageLayout[],
  pageIndex: number,
  elementIndex: number
): PageLayout[] {
  const newPages = [...pages];
  const currentPage = newPages[pageIndex];
  
  // Split current page at element index
  const beforeElements = currentPage.elements.slice(0, elementIndex);
  const afterElements = currentPage.elements.slice(elementIndex);
  
  const beforeHeight = beforeElements.reduce((sum, el) => sum + el.height, 0);
  const afterHeight = afterElements.reduce((sum, el) => sum + el.height, 0);
  
  // Update current page
  newPages[pageIndex] = {
    ...currentPage,
    elements: beforeElements,
    height: beforeHeight,
  };
  
  // Insert new page
  newPages.splice(pageIndex + 1, 0, {
    id: `page-${Date.now()}`,
    elements: afterElements,
    height: afterHeight,
    availableHeight: currentPage.availableHeight,
  });
  
  return newPages;
}

/**
 * Calculate total page count
 */
export function getPageCount(pages: PageLayout[]): number {
  return pages.length;
}

/**
 * Get total content height
 */
export function getTotalHeight(pages: PageLayout[]): number {
  return pages.reduce((sum, page) => sum + page.height, 0);
}

/**
 * Find element by ID across all pages
 */
export function findElement(
  pages: PageLayout[],
  elementId: string
): { pageIndex: number; elementIndex: number; element: PaginationElement } | null {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const elementIndex = page.elements.findIndex(el => el.id === elementId);
    
    if (elementIndex !== -1) {
      return {
        pageIndex: i,
        elementIndex,
        element: page.elements[elementIndex],
      };
    }
  }
  
  return null;
}

export default {
  measureElementHeight,
  calculatePageHeights,
  adjustPageBreak,
  insertManualPageBreak,
  getPageCount,
  getTotalHeight,
  findElement,
};

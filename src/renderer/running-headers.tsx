/**
 * MagMark 2.0 - Running Headers Component
 * Automated header/footer generation for paginated content
 */

export interface RunningHeaderConfig {
  /** Show running headers */
  enabled?: boolean;
  /** Header content */
  header?: {
    left?: string | ((page: number, pageCount: number) => string);
    center?: string | ((page: number, pageCount: number) => string);
    right?: string | ((page: number, pageCount: number) => string);
  };
  /** Footer content */
  footer?: {
    left?: string | ((page: number, pageCount: number) => string);
    center?: string | ((page: number, pageCount: number) => string);
    right?: string | ((page: number, pageCount: number) => string);
  };
  /** Different headers for first page */
  firstPage?: {
    header?: boolean;
    footer?: boolean;
  };
  /** Different headers for odd/even pages */
  alternating?: boolean;
  /** Page number format */
  pageNumberFormat?: 'numeric' | 'roman' | 'alpha';
  /** Page number start */
  startPageNumber?: number;
}

const defaultConfig: RunningHeaderConfig = {
  enabled: true,
  header: {
    left: '',
    center: '',
    right: '',
  },
  footer: {
    left: '',
    center: (page) => String(page),
    right: '',
  },
  firstPage: {
    header: false,
    footer: true,
  },
  alternating: false,
  pageNumberFormat: 'numeric',
  startPageNumber: 1,
};

/**
 * Format page number
 */
function formatPageNumber(
  page: number,
  format: 'numeric' | 'roman' | 'alpha'
): string {
  switch (format) {
    case 'roman':
      return toRoman(page);
    case 'alpha':
      return toAlpha(page);
    default:
      return String(page);
  }
}

/**
 * Convert to Roman numerals
 */
function toRoman(num: number): string {
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let str = '';
  
  for (const [letter, value] of Object.entries(roman)) {
    const count = Math.floor(num / value);
    num -= count * value;
    str += letter.repeat(count);
  }
  
  return str;
}

/**
 * Convert to letters (A, B, C...)
 */
function toAlpha(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/**
 * Resolve header/footer content
 */
function resolveContent(
  content: string | ((page: number, pageCount: number) => string) | undefined,
  page: number,
  pageCount: number
): string {
  if (!content) return '';
  if (typeof content === 'function') {
    return content(page, pageCount);
  }
  return content;
}

/**
 * Generate running headers for a page
 */
export function generateRunningHeaders(
  page: number,
  pageCount: number,
  config: RunningHeaderConfig = {}
): {
  header: { left: string; center: string; right: string };
  footer: { left: string; center: string; right: string };
} {
  const opts = { ...defaultConfig, ...config };
  const actualPage = page + (opts.startPageNumber || 1) - 1;
  
  // Check if first page has different headers
  if (page === 1 && opts.firstPage) {
    const header = opts.firstPage.header
      ? { left: '', center: '', right: '' }
      : {
          left: resolveContent(opts.header?.left, actualPage, pageCount),
          center: resolveContent(opts.header?.center, actualPage, pageCount),
          right: resolveContent(opts.header?.right, actualPage, pageCount),
        };
    
    const footer = opts.firstPage.footer
      ? {
          left: resolveContent(opts.footer?.left, actualPage, pageCount),
          center: formatPageNumber(actualPage, opts.pageNumberFormat || 'numeric'),
          right: resolveContent(opts.footer?.right, actualPage, pageCount),
        }
      : { left: '', center: '', right: '' };
    
    return { header, footer };
  }
  
  // Handle alternating pages
  const isEven = page % 2 === 0;
  
  return {
    header: {
      left: resolveContent(opts.header?.left, actualPage, pageCount),
      center: resolveContent(opts.header?.center, actualPage, pageCount),
      right: resolveContent(opts.header?.right, actualPage, pageCount),
    },
    footer: {
      left: resolveContent(opts.footer?.left, actualPage, pageCount),
      center: resolveContent(
        opts.footer?.center || ((p) => formatPageNumber(p, opts.pageNumberFormat || 'numeric')),
        actualPage,
        pageCount
      ),
      right: resolveContent(opts.footer?.right, actualPage, pageCount),
    },
  };
}

/**
 * Generate CSS for running headers
 */
export function generateRunningHeaderCSS(config: RunningHeaderConfig = {}): string {
  const opts = { ...defaultConfig, ...config };
  
  if (!opts.enabled) return '';
  
  return `
    @page {
      @top-left {
        content: "${opts.header?.left || ''}";
        font-size: 10pt;
        color: #666;
      }
      @top-center {
        content: "${opts.header?.center || ''}";
        font-size: 10pt;
        color: #666;
      }
      @top-right {
        content: "${opts.header?.right || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-left {
        content: "${opts.footer?.left || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-center {
        content: "${opts.footer?.center || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-right {
        content: "${opts.footer?.right || ''}";
        font-size: 10pt;
        color: #666;
      }
    }
    
    @page:first {
      ${opts.firstPage?.header ? '@top-left { content: none; } @top-center { content: none; } @top-right { content: none; }' : ''}
      ${!opts.firstPage?.footer ? '@bottom-left { content: none; } @bottom-center { content: none; } @bottom-right { content: none; }' : ''}
    }
  `;
}

/**
 * React component for running headers (DOM version)
 */
export function RunningHeadersDOM({
  page,
  pageCount,
  config = {},
}: {
  page: number;
  pageCount: number;
  config?: RunningHeaderConfig;
}): JSX.Element {
  const headers = generateRunningHeaders(page, pageCount, config);
  
  return (
    <>
      <header className="mm-running-header">
        <span className="mm-running-header-left">{headers.header.left}</span>
        <span className="mm-running-header-center">{headers.header.center}</span>
        <span className="mm-running-header-right">{headers.header.right}</span>
      </header>
      <footer className="mm-running-footer">
        <span className="mm-running-footer-left">{headers.footer.left}</span>
        <span className="mm-running-footer-center">{headers.footer.center}</span>
        <span className="mm-running-footer-right">{headers.footer.right}</span>
      </footer>
    </>
  );
}

/**
 * Generate HTML for running headers
 */
export function generateRunningHeaderHTML(
  page: number,
  pageCount: number,
  config: RunningHeaderConfig = {}
): string {
  const headers = generateRunningHeaders(page, pageCount, config);
  
  return `
    <header class="mm-running-header">
      <span class="mm-running-header-left">${headers.header.left}</span>
      <span class="mm-running-header-center">${headers.header.center}</span>
      <span class="mm-running-header-right">${headers.header.right}</span>
    </header>
    <footer class="mm-running-footer">
      <span class="mm-running-footer-left">${headers.footer.left}</span>
      <span class="mm-running-footer-center">${headers.footer.center}</span>
      <span class="mm-running-footer-right">${headers.footer.right}</span>
    </footer>
  `;
}

export default {
  generateRunningHeaders,
  generateRunningHeaderCSS,
  generateRunningHeaderHTML,
  RunningHeadersDOM,
};

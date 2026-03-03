/**
 * MagMark 2.0 - Paged.js Engine
 * Print-first pagination using Paged.js
 */

export interface PagedJsOptions {
  /** Page size (A4, Letter, etc.) */
  pageSize?: string;
  /** Page margins */
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Enable running headers */
  runningHeaders?: boolean;
  /** Header content */
  header?: {
    left?: string;
    center?: string;
    right?: string;
  };
  /** Footer content */
  footer?: {
    left?: string;
    center?: string;
    right?: string;
  };
  /** Base URL for resources */
  baseUrl?: string;
}

const defaultOptions: PagedJsOptions = {
  pageSize: 'A4',
  margins: {
    top: '48px',
    right: '48px',
    bottom: '48px',
    left: '48px',
  },
  runningHeaders: true,
  header: {
    left: '',
    center: '',
    right: '',
  },
  footer: {
    left: '',
    center: '',
    right: '',
  },
  baseUrl: typeof window !== 'undefined' ? window.location.href : '',
};

/**
 * Generate CSS for Paged.js
 */
function generatePagedCss(options: PagedJsOptions): string {
  const { pageSize, margins, runningHeaders, header, footer } = options;
  
  return `
    @page {
      size: ${pageSize};
      margin: ${margins?.top} ${margins?.right} ${margins?.bottom} ${margins?.left};
      
      ${runningHeaders ? `
      @top-left {
        content: "${header?.left || ''}";
        font-size: 10pt;
        color: #666;
      }
      @top-center {
        content: "${header?.center || ''}";
        font-size: 10pt;
        color: #666;
      }
      @top-right {
        content: "${header?.right || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-left {
        content: "${footer?.left || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-center {
        content: "${footer?.center || ''}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-right {
        content: "${footer?.right || ''}";
        font-size: 10pt;
        color: #666;
      }
      ` : ''}
    }
    
    /* Page break handling */
    .mm-page-break {
      break-after: page;
      page-break-after: always;
    }
    
    /* Avoid breaking inside elements */
    .mm-no-break,
    pre, blockquote, figure, table {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Widows and orphans */
    p, li {
      orphans: 2;
      widows: 2;
    }
    
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid;
      page-break-after: avoid;
      orphans: 2;
      widows: 2;
    }
    
    /* Keep headings with following content */
    h1 + *, h2 + *, h3 + * {
      break-before: avoid;
    }
  `;
}

/**
 * Create a complete HTML document for Paged.js rendering
 */
export function createPagedDocument(
  content: string,
  options: PagedJsOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const css = generatePagedCss(opts);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MagMark Document</title>
  <style>
    /* Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Base styles */
    body {
      font-family: 'Source Han Serif SC', 'Noto Serif SC', 'SimSun', serif;
      font-size: 11pt;
      line-height: 1.75;
      color: #1a1a1a;
    }
    
    ${css}
    
    /* Typography */
    h1 {
      font-size: 24pt;
      font-weight: 700;
      line-height: 1.2;
      margin: 1.5em 0 0.75em;
    }
    
    h2 {
      font-size: 18pt;
      font-weight: 600;
      line-height: 1.3;
      margin: 1.5em 0 0.75em;
    }
    
    h3 {
      font-size: 14pt;
      font-weight: 600;
      line-height: 1.4;
      margin: 1.25em 0 0.5em;
    }
    
    p {
      margin: 0 0 1.5em;
      text-align: justify;
      hyphens: auto;
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }
    
    .mm-image--full-bleed {
      width: 100vw;
      margin-left: calc(-${opts.margins?.left});
      margin-right: calc(-${opts.margins?.right});
    }
    
    /* Pull quotes */
    .mm-pull-quote {
      margin: 1.5em 0;
      padding: 1em 1.5em;
      border-left: 3pt solid #d32f2f;
      background: #fafafa;
      font-style: italic;
    }
    
    /* Code blocks */
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 9pt;
    }
    
    code {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 9pt;
      background: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    
    /* Lists */
    ul, ol {
      margin: 0 0 1.5em 2em;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    
    th, td {
      padding: 0.5em;
      border: 1px solid #e0e0e0;
      text-align: left;
    }
    
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="pagedjs_pages">
    ${content}
  </div>
  
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  <script>
    if (window.PagedPolyfill) {
      window.PagedPolyfill.preview();
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Render content using Paged.js
 */
export async function renderWithPagedJs(
  content: string,
  options: PagedJsOptions = {}
): Promise<{
  html: string;
  pageCount: number;
  pages: string[];
}> {
  const html = createPagedDocument(content, options);
  
  // In a browser environment with Paged.js loaded,
  // this would trigger the pagination
  // For server-side, we'd need Puppeteer/Playwright
  
  return {
    html,
    pageCount: 0, // Would be calculated by Paged.js
    pages: [], // Would contain individual page HTML
  };
}

/**
 * Generate print-ready CSS
 */
export function generatePrintStyles(): string {
  return `
    @media print {
      @page {
        margin: 48px;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .mm-page-break {
        break-after: page;
        page-break-after: always;
      }
      
      .mm-no-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Hide UI elements */
      .mm-toolbar,
      .mm-mode-switcher,
      .mm-status-bar {
        display: none !important;
      }
    }
  `;
}

export default {
  createPagedDocument,
  renderWithPagedJs,
  generatePrintStyles,
};

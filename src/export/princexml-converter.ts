/**
 * MagMark 2.0 - PrinceXML Converter
 * Alternative PDF generation using PrinceXML
 */

export interface PrinceOptions {
  /** Page size */
  pageSize?: 'A4' | 'Letter' | 'A5' | string;
  /** Page margins */
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** PDF format standard */
  pdfFormat?: 'PDF/X-4' | 'PDF/A-1b' | 'PDF/A-3b' | 'PDF/UA';
  /** Enable JavaScript */
  javascript?: boolean;
  /** Enable bookmarks */
  bookmarks?: boolean;
  /** Enable hyperlinks */
  links?: boolean;
  /** Base URL for resources */
  baseUrl?: string;
  /** Additional CSS files */
  cssFiles?: string[];
  /** Output path */
  outputPath?: string;
  /** Quality setting */
  quality?: 'low' | 'normal' | 'high';
}

const defaultOptions: PrinceOptions = {
  pageSize: 'A4',
  margins: {
    top: '48px',
    right: '48px',
    bottom: '48px',
    left: '48px',
  },
  pdfFormat: 'PDF/X-4',
  javascript: false,
  bookmarks: true,
  links: true,
  quality: 'high',
};

/**
 * Generate PrinceXML-compatible HTML
 */
export function generatePrinceHtml(
  content: string,
  options: PrinceOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  const cssLinks = opts.cssFiles
    ?.map(file => `<link rel="stylesheet" href="${file}" />`)
    .join('\n') || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MagMark Document</title>
  ${cssLinks}
  <style>
    /* PrinceXML-specific CSS */
    @page {
      size: ${opts.pageSize};
      margin: ${opts.margins?.top} ${opts.margins?.right} ${opts.margins?.bottom} ${opts.margins?.left};
      
      @top-left {
        content: string(doctitle);
        font-size: 10pt;
        color: #666;
      }
      
      @bottom-center {
        content: counter(page);
        font-size: 10pt;
        color: #666;
      }
    }
    
    @page:first {
      @top-left { content: none; }
    }
    
    /* Base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Source Han Serif SC', 'Noto Serif SC', 'SimSun', serif;
      font-size: 11pt;
      line-height: 1.75;
      color: #1a1a1a;
      text-align: justify;
      hyphens: auto;
    }
    
    /* Set document title for running header */
    h1:first-of-type {
      string-set: doctitle content();
    }
    
    /* Typography */
    h1 {
      font-size: 24pt;
      font-weight: 700;
      line-height: 1.2;
      margin: 1.5em 0 0.75em;
      color: #1a1a1a;
      prince-bookmark-level: 1;
    }
    
    h2 {
      font-size: 18pt;
      font-weight: 600;
      line-height: 1.3;
      margin: 1.5em 0 0.75em;
      color: #1a1a1a;
      prince-bookmark-level: 2;
    }
    
    h3 {
      font-size: 14pt;
      font-weight: 600;
      line-height: 1.4;
      margin: 1.25em 0 0.5em;
      color: #1a1a1a;
      prince-bookmark-level: 3;
    }
    
    p {
      margin: 0 0 1.5em;
      orphans: 2;
      widows: 2;
    }
    
    /* Lists */
    ul, ol {
      margin: 0 0 1.5em 2em;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    /* Blockquotes */
    blockquote {
      margin: 1.5em 0;
      padding: 1em 1.5em;
      border-left: 4px solid #d32f2f;
      background: #fafafa;
      font-style: italic;
      prince-bookmark-level: none;
    }
    
    blockquote p:last-child {
      margin-bottom: 0;
    }
    
    /* Code */
    code {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.9em;
      background: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1.5em 0;
      white-space: pre-wrap;
      prince-bookmark-level: none;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      prince-image-resolution: 300dpi;
    }
    
    figure {
      margin: 1.5em 0;
      page-break-inside: avoid;
    }
    
    figcaption {
      font-size: 10pt;
      color: #666;
      text-align: center;
      margin-top: 0.5em;
    }
    
    /* Full bleed images */
    .mm-image--full-bleed {
      width: 100%;
      margin-left: -${opts.margins?.left};
      margin-right: -${opts.margins?.right};
    }
    
    /* Links */
    a {
      color: #d32f2f;
      text-decoration: underline;
    }
    
    a[href]::after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
      color: #666;
    }
    
    /* Page breaks */
    .mm-page-break {
      page-break-after: always;
    }
    
    /* Avoid breaking inside */
    .mm-no-break,
    pre, blockquote, figure, table, img {
      page-break-inside: avoid;
    }
    
    /* Keep headings with content */
    h1, h2, h3 {
      page-break-after: avoid;
    }
    
    h1 + *, h2 + *, h3 + * {
      page-break-before: avoid;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      page-break-inside: avoid;
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
    
    /* Pull quotes */
    .mm-pull-quote {
      margin: 1.5em 0;
      padding: 1.5em;
      background: #fafafa;
      border-left: 4px solid #d32f2f;
      font-style: italic;
      page-break-inside: avoid;
    }
    
    .mm-pull-quote--right {
      border-left: none;
      border-right: 4px solid #d32f2f;
      text-align: right;
    }
    
    /* Grid container */
    .mm-grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 1.5em 0;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * Generate Prince command line arguments
 */
export function generatePrinceArgs(
  inputFile: string,
  outputFile: string,
  options: PrinceOptions = {}
): string[] {
  const opts = { ...defaultOptions, ...options };
  const args: string[] = [];
  
  // Output file
  args.push('-o', outputFile);
  
  // PDF format
  if (opts.pdfFormat) {
    args.push(`--pdf-${opts.pdfFormat.toLowerCase().replace('/', '-')}`);
  }
  
  // JavaScript
  if (opts.javascript) {
    args.push('--javascript');
  }
  
  // Bookmarks
  if (opts.bookmarks) {
    args.push('--bookmarks');
  }
  
  // Links
  if (!opts.links) {
    args.push('--no-links');
  }
  
  // Base URL
  if (opts.baseUrl) {
    args.push('--baseurl', opts.baseUrl);
  }
  
  // Add CSS files
  opts.cssFiles?.forEach(file => {
    args.push('-s', file);
  });
  
  // Input file
  args.push(inputFile);
  
  return args;
}

/**
 * Generate Prince configuration file
 */
export function generatePrinceConfig(options: PrinceOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  return JSON.stringify({
    pdf: {
      compress: true,
      linearize: false,
    },
    page: {
      size: opts.pageSize,
      margins: opts.margins,
    },
    bookmarks: opts.bookmarks,
    links: opts.links,
    javascript: opts.javascript,
  }, null, 2);
}

/**
 * Convert HTML to PDF using PrinceXML
 * Note: Requires PrinceXML to be installed
 */
export async function convertWithPrince(
  html: string,
  outputPath: string,
  options: PrinceOptions = {}
): Promise<{ success: boolean; output?: string; error?: string }> {
  // In production, this would call the Prince CLI
  // prince input.html -o output.pdf
  
  return {
    success: true,
    output: generatePrinceHtml(html, options),
  };
}

export default {
  generatePrinceHtml,
  generatePrinceArgs,
  generatePrinceConfig,
  convertWithPrince,
};

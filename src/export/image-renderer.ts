/**
 * MagMark 2.0 - Image Renderer
 * Multi-format image export using Playwright/HTML-to-Image
 */

export interface ImageRenderOptions {
  /** Output format */
  format?: 'png' | 'jpeg' | 'webp';
  /** Image quality (0-100) */
  quality?: number;
  /** Scale factor */
  scale?: number;
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Full page or viewport only */
  fullPage?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Dark mode */
  darkMode?: boolean;
  /** Wait for selector before capture */
  waitForSelector?: string;
  /** Wait time in ms */
  waitTime?: number;
}

export interface ExportFormat {
  /** Platform target */
  platform: 'xiaohongshu' | 'wechat' | 'pdf' | 'web' | 'cover';
  /** Specific format variant */
  variant?: 'carousel' | 'long' | 'single' | 'bookmarks';
}

// Platform dimensions
const PLATFORM_DIMENSIONS = {
  xiaohongshu: {
    primary: { width: 1080, height: 1440 },
    alternative: { width: 1242, height: 1660 },
  },
  wechat: {
    width: 1080,
    height: 1920, // Long image
  },
  cover: {
    width: 1080,
    height: 383,
  },
  pdf: {
    a4: { width: 794, height: 1123 }, // 96 DPI
    letter: { width: 816, height: 1056 },
  },
  web: {
    width: 1200,
    height: 800,
  },
};

// Resolution modes
const RESOLUTION_MODES = {
  quick: { scale: 2 },
  standard: { scale: 3 }, // 300 DPI equivalent
  print: { scale: 6 }, // 600 DPI equivalent
};

/**
 * Get dimensions for a platform
 */
export function getPlatformDimensions(
  platform: ExportFormat['platform'],
  variant?: string
): { width: number; height: number } {
  switch (platform) {
    case 'xiaohongshu':
      return variant === 'alternative'
        ? PLATFORM_DIMENSIONS.xiaohongshu.alternative
        : PLATFORM_DIMENSIONS.xiaohongshu.primary;

    case 'wechat':
      return PLATFORM_DIMENSIONS.wechat;

    case 'cover':
      return PLATFORM_DIMENSIONS.cover;

    case 'pdf':
      return variant === 'letter'
        ? PLATFORM_DIMENSIONS.pdf.letter
        : PLATFORM_DIMENSIONS.pdf.a4;

    case 'web':
    default:
      return PLATFORM_DIMENSIONS.web;
  }
}

/**
 * Generate HTML wrapper for image rendering
 */
export function generateRenderHtml(
  content: string,
  options: {
    platform?: ExportFormat['platform'];
    darkMode?: boolean;
    backgroundColor?: string;
  } = {}
): string {
  const { platform = 'web', darkMode = false, backgroundColor = '#ffffff' } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MagMark Render</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Source Han Serif SC', 'Noto Serif SC', 'SimSun', serif;
      font-size: 14px;
      line-height: 1.75;
      color: ${darkMode ? '#ffffff' : '#1a1a1a'};
      background-color: ${backgroundColor};
      padding: 48px;
    }
    
    /* Typography */
    h1 {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
      margin: 1.5em 0 0.75em;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      line-height: 1.3;
      margin: 1.5em 0 0.75em;
    }
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      margin: 1.25em 0 0.5em;
    }
    
    p {
      margin: 0 0 1.5em;
    }
    
    /* Platform-specific adjustments */
    ${platform === 'xiaohongshu' ? `
    body {
      padding: 32px;
      font-size: 16px;
    }
    h1 { font-size: 28px; }
    h2 { font-size: 22px; }
    h3 { font-size: 18px; }
    ` : ''}
    
    ${platform === 'wechat' ? `
    body {
      padding: 24px;
      font-size: 17px;
      max-width: 100%;
    }
    ` : ''}
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }
    
    .mm-image--full-bleed {
      width: calc(100% + 96px);
      margin-left: -48px;
      margin-right: -48px;
    }
    
    /* Blockquotes */
    blockquote {
      margin: 1.5em 0;
      padding: 1em 1.5em;
      border-left: 4px solid #d32f2f;
      background: ${darkMode ? '#2a2a2a' : '#fafafa'};
      font-style: italic;
    }
    
    /* Code */
    code {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
      background: ${darkMode ? '#2a2a2a' : '#f5f5f5'};
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    pre {
      background: ${darkMode ? '#2a2a2a' : '#f5f5f5'};
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1.5em 0;
    }
    
    /* Lists */
    ul, ol {
      margin: 0 0 1.5em 2em;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    /* Page breaks */
    .mm-page-break {
      page-break-after: always;
      break-after: page;
      border-top: 2px dashed ${darkMode ? '#444' : '#e0e0e0'};
      margin: 2em 0;
      padding-top: 2em;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    
    th, td {
      padding: 0.5em;
      border: 1px solid ${darkMode ? '#444' : '#e0e0e0'};
    }
    
    th {
      background: ${darkMode ? '#333' : '#f5f5f5'};
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * Export single image
 */
export async function exportImage(
  html: string,
  options: ImageRenderOptions = {}
): Promise<Buffer> {
  const {
    format = 'png',
    quality = 90,
    scale = 2,
    width = 1200,
    height = 800,
    fullPage = false,
    waitTime = 1000,
  } = options;

  // In production, this would use Playwright or Puppeteer
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // await page.setViewportSize({ width, height });
  // await page.setContent(html);
  // await page.waitForTimeout(waitTime);
  // const buffer = await page.screenshot({
  //   type: format,
  //   quality: format === 'jpeg' || format === 'webp' ? quality : undefined,
  //   fullPage,
  // });
  // await browser.close();

  // Return placeholder
  return Buffer.from('Image data would be generated here');
}

/**
 * Export multiple images (for carousels)
 */
export async function exportImages(
  pages: string[],
  options: ImageRenderOptions & { exportFormat?: ExportFormat } = {}
): Promise<Buffer[]> {
  const { platform = 'web', variant = 'single' } = options.exportFormat || {};
  const dimensions = getPlatformDimensions(platform, variant);

  const buffers: Buffer[] = [];

  for (const page of pages) {
    const html = generateRenderHtml(page, { platform });
    const buffer = await exportImage(html, {
      ...options,
      width: dimensions.width,
      height: dimensions.height,
    });
    buffers.push(buffer);
  }

  return buffers;
}

/**
 * Combine multiple pages into a long image (WeChat style)
 */
export async function combineToLongImage(
  pages: string[],
  options: ImageRenderOptions = {}
): Promise<Buffer> {
  const { width = 1080, scale = 2 } = options;

  // Combine all pages into one HTML document
  const combinedHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${width}px; }
    .page { 
      min-height: 100vh; 
      padding: 48px;
      border-bottom: 2px dashed #e0e0e0;
    }
    .page:last-child { border-bottom: none; }
  </style>
</head>
<body>
  ${pages.map((page, i) => `<div class="page" data-page="${i + 1}">${page}</div>`).join('')}
</body>
</html>`;

  return exportImage(combinedHtml, {
    ...options,
    width,
    fullPage: true,
  });
}

/**
 * Export for Xiaohongshu carousel
 */
export async function exportXiaohongshuCarousel(
  pages: string[],
  options: { resolution?: 'quick' | 'standard' | 'print' } = {}
): Promise<{ images: Buffer[]; dimensions: { width: number; height: number } }> {
  const { resolution = 'standard' } = options;
  const { scale } = RESOLUTION_MODES[resolution];
  const { width, height } = PLATFORM_DIMENSIONS.xiaohongshu.primary;

  const images = await exportImages(pages, {
    exportFormat: { platform: 'xiaohongshu', variant: 'carousel' },
    width: width * scale,
    height: height * scale,
    scale,
    format: 'png',
  });

  return {
    images,
    dimensions: { width: width * scale, height: height * scale },
  };
}

/**
 * Export for WeChat long image
 */
export async function exportWechatLongImage(
  pages: string[],
  options: { resolution?: 'quick' | 'standard' | 'print' } = {}
): Promise<{ image: Buffer; dimensions: { width: number; height: number } }> {
  const { resolution = 'standard' } = options;
  const { scale } = RESOLUTION_MODES[resolution];
  const { width } = PLATFORM_DIMENSIONS.wechat;

  const image = await combineToLongImage(pages, {
    width: width * scale,
    scale,
    format: 'png',
  });

  return {
    image,
    dimensions: { width: width * scale, height: 0 }, // Height determined by content
  };
}

/**
 * Export as ZIP file
 */
export async function exportAsZip(
  pages: string[],
  options: ExportFormat & { resolution?: 'quick' | 'standard' | 'print' }
): Promise<Buffer> {
  // In production, use archiver or similar
  // const archiver = require('archiver');
  // const zip = archiver('zip');
  // ...add images to zip

  return Buffer.from('ZIP data would be generated here');
}

/**
 * Generate PDF with bookmarks
 */
export async function generateBookmarkedPdf(
  pages: string[],
  headings: { level: number; text: string }[]
): Promise<Buffer> {
  // In production, use PDF-lib or similar to add bookmarks
  return Buffer.from('PDF with bookmarks would be generated here');
}

export default {
  getPlatformDimensions,
  generateRenderHtml,
  exportImage,
  exportImages,
  combineToLongImage,
  exportXiaohongshuCarousel,
  exportWechatLongImage,
  exportAsZip,
  generateBookmarkedPdf,
};

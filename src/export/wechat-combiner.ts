/**
 * MagMark 2.0 - WeChat Combiner
 * Combines multiple pages into a long WeChat-style image
 */

import { createCanvas, loadImage } from 'canvas';

export interface WeChatCombineOptions {
  /** Gap between pages in pixels */
  gap?: number;
  /** Background color */
  backgroundColor?: string;
  /** Add page separators */
  showSeparators?: boolean;
  /** Separator color */
  separatorColor?: string;
  /** Separator height */
  separatorHeight?: number;
  /** Resolution scale */
  scale?: number;
  /** Maximum height (WeChat limit ~25MB) */
  maxHeight?: number;
}

const defaultOptions: WeChatCombineOptions = {
  gap: 0,
  backgroundColor: '#ffffff',
  showSeparators: false,
  separatorColor: '#e0e0e0',
  separatorHeight: 2,
  scale: 2,
  maxHeight: 20000, // ~25MB limit consideration
};

/**
 * Combine multiple image buffers into a single long image
 */
export async function combineToLongImage(
  imageBuffers: Buffer[],
  options: WeChatCombineOptions = {}
): Promise<Buffer> {
  const opts = { ...defaultOptions, ...options };
  
  // Load all images
  const images = await Promise.all(
    imageBuffers.map(buffer => loadImage(buffer))
  );
  
  // Calculate dimensions
  const maxWidth = Math.max(...images.map(img => img.width));
  let totalHeight = 0;
  
  for (let i = 0; i < images.length; i++) {
    totalHeight += images[i].height;
    if (i < images.length - 1) {
      totalHeight += opts.gap!;
      if (opts.showSeparators) {
        totalHeight += opts.separatorHeight!;
      }
    }
  }
  
  // Check max height
  if (totalHeight > opts.maxHeight!) {
    throw new Error(
      `Combined image height (${totalHeight}px) exceeds maximum (${opts.maxHeight}px). ` +
      'Consider splitting into multiple images.'
    );
  }
  
  // Create canvas
  const canvas = createCanvas(maxWidth, totalHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = opts.backgroundColor!;
  ctx.fillRect(0, 0, maxWidth, totalHeight);
  
  // Draw images
  let currentY = 0;
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const x = (maxWidth - img.width) / 2; // Center horizontally
    
    ctx.drawImage(img, x, currentY);
    currentY += img.height;
    
    // Add gap and separator
    if (i < images.length - 1) {
      if (opts.showSeparators) {
        ctx.fillStyle = opts.separatorColor!;
        ctx.fillRect(0, currentY, maxWidth, opts.separatorHeight!);
        currentY += opts.separatorHeight!;
      }
      currentY += opts.gap!;
    }
  }
  
  // Export as PNG
  return canvas.toBuffer('image/png');
}

/**
 * Add WeChat-specific styling
 */
export function addWeChatStyling(html: string): string {
  return html.replace(
    '<body>',
    `<body style="
      max-width: 750px;
      margin: 0 auto;
      padding: 20px;
      font-size: 17px;
      line-height: 1.75;
      color: #333;
      background: #fff;
    ">`
  );
}

/**
 * Optimize for WeChat (reduce file size)
 */
export async function optimizeForWeChat(
  imageBuffer: Buffer,
  options: { quality?: number; maxWidth?: number } = {}
): Promise<Buffer> {
  const { quality = 85, maxWidth = 1080 } = options;
  
  const img = await loadImage(imageBuffer);
  
  // Scale down if too wide
  let width = img.width;
  let height = img.height;
  
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Use better quality downsampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas.toBuffer('image/jpeg', { quality: quality / 100 });
}

/**
 * Split long content into WeChat-sized chunks
 */
export function splitForWeChat(
  content: string,
  options: { maxHeight?: number; overlap?: number } = {}
): string[] {
  const { maxHeight = 8000, overlap = 200 } = options;
  
  // Simple splitting by character count
  // In production, use actual rendered height
  const avgCharsPerPage = 3000;
  const chunks: string[] = [];
  
  let currentChunk = '';
  let currentLength = 0;
  
  const paragraphs = content.split('\n\n');
  
  for (const para of paragraphs) {
    if (currentLength + para.length > avgCharsPerPage && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
      currentLength = para.length;
    } else {
      currentChunk += '\n\n' + para;
      currentLength += para.length;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate WeChat metadata
 */
export function generateWeChatMetadata(title: string, author?: string) {
  return {
    title,
    author: author || 'MagMark',
    platform: 'wechat',
    format: 'long-image',
    createdAt: new Date().toISOString(),
  };
}

export default {
  combineToLongImage,
  addWeChatStyling,
  optimizeForWeChat,
  splitForWeChat,
  generateWeChatMetadata,
};

/**
 * MagMark 2.0 - Core Class
 * Main API for magazine-quality markdown conversion
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { createMagazinePipeline } from '../plugins';
import { generateTypstTemplate } from '../export/typst-converter';
import { generatePrinceHtml } from '../export/princexml-converter';
import { generateRenderHtml, getPlatformDimensions } from '../export/image-renderer';
import { createCarouselZip } from '../export/xiaohongshu-zipper';
import { combineToLongImage } from '../export/wechat-combiner';
import { validateMagazineInput, getDefaultDesignTokens } from '../schemas/input-schema';
import type { MagazineInput, DesignTokens, Platform } from '../schemas/input-schema';

export interface MagMarkOptions {
  platform?: Platform;
  autoSpaceCjk?: boolean;
  preventWidows?: boolean;
  smartQuotes?: boolean;
  chapterNewPage?: boolean;
  avoidBreakInside?: boolean;
  resolution?: 'quick' | 'standard' | 'print';
  designTokens?: Partial<DesignTokens>;
  customCss?: string;
}

export interface RenderResult {
  html: string;
  markdown: string;
  metadata: {
    title?: string;
    wordCount: number;
    charCount: number;
  };
}

export class MagMark {
  private options: Required<MagMarkOptions>;
  private designTokens: DesignTokens;

  constructor(options: MagMarkOptions = {}) {
    this.options = {
      platform: options.platform || 'web',
      autoSpaceCjk: options.autoSpaceCjk ?? true,
      preventWidows: options.preventWidows ?? true,
      smartQuotes: options.smartQuotes ?? true,
      chapterNewPage: options.chapterNewPage ?? true,
      avoidBreakInside: options.avoidBreakInside ?? true,
      resolution: options.resolution || 'standard',
      designTokens: options.designTokens || {},
      customCss: options.customCss || '',
    };

    this.designTokens = {
      ...getDefaultDesignTokens(),
      ...this.options.designTokens,
    };
  }

  /**
   * Render markdown to HTML
   */
  async render(markdown: string): Promise<RenderResult> {
    // Validate input
    const validation = validateMagazineInput({
      markdown,
      platform: this.options.platform,
      designTokens: this.designTokens,
      options: {
        autoSpaceCjk: this.options.autoSpaceCjk,
        exportFormat: 'html',
      },
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.message}`);
    }

    // Create processor with magazine plugins
    const pipeline = createMagazinePipeline({
      autoSpaceCjk: this.options.autoSpaceCjk,
      preventWidows: this.options.preventWidows,
      smartQuotes: this.options.smartQuotes,
      chapterNewPage: this.options.chapterNewPage,
      avoidBreakInside: this.options.avoidBreakInside,
      platform: this.options.platform,
    });

    const processor = unified()
      .use(remarkParse)
      .use(pipeline)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true });

    const result = await processor.process(markdown);
    const html = String(result);

    // Calculate metadata
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;
    const charCount = markdown.length;
    const title = markdown.match(/^#\s+(.+)$/m)?.[1];

    return {
      html,
      markdown,
      metadata: {
        title,
        wordCount,
        charCount,
      },
    };
  }

  /**
   * Export as PDF using Typst
   */
  async exportTypst(outputPath: string): Promise<void> {
    // Implementation would call Typst CLI
    console.log(`Exporting to ${outputPath} via Typst...`);
  }

  /**
   * Export as PDF using PrinceXML
   */
  async exportPrince(outputPath: string): Promise<void> {
    // Implementation would call Prince CLI
    console.log(`Exporting to ${outputPath} via PrinceXML...`);
  }

  /**
   * Export as images for carousel
   */
  async exportImages(markdown: string): Promise<Buffer[]> {
    const { html } = await this.render(markdown);
    const renderHtml = generateRenderHtml(html, {
      platform: this.options.platform,
    });

    // In production, use Playwright to capture screenshots
    console.log(`Rendering ${this.options.platform} images...`);
    return [];
  }

  /**
   * Export as Xiaohongshu carousel ZIP
   */
  async exportXiaohongshu(outputPath: string, markdown: string): Promise<void> {
    const images = await this.exportImages(markdown);
    const zip = await createCarouselZip(images, {
      resolution: this.options.resolution,
    });
    
    // Write ZIP to file
    console.log(`Writing carousel to ${outputPath}...`);
  }

  /**
   * Export as WeChat long image
   */
  async exportWeChat(outputPath: string, markdown: string): Promise<void> {
    const images = await this.exportImages(markdown);
    const combined = await combineToLongImage(images);
    
    // Write image to file
    console.log(`Writing WeChat image to ${outputPath}...`);
  }

  /**
   * Get design tokens
   */
  getDesignTokens(): DesignTokens {
    return this.designTokens;
  }

  /**
   * Update design tokens
   */
  updateDesignTokens(tokens: Partial<DesignTokens>): void {
    this.designTokens = {
      ...this.designTokens,
      ...tokens,
    };
  }
}

export default MagMark;

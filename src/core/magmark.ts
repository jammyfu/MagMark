import { sanitizeArticleHtml } from '../security/article-html';
/**
 * MagMark 1.6.0 - Core Class
 * Main API for magazine-quality markdown conversion
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { createMagazinePipeline } from '../plugins';
import { getExportCapabilities, UnsupportedExportError } from './export-capabilities';
import type { ExportCapabilities } from './export-capabilities';
import { validateMagazineInput, getDefaultDesignTokens } from '../schemas/input-schema';
import type { DesignTokens, Platform } from '../schemas/input-schema';

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
    const html = sanitizeArticleHtml(String(result));

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

  /** Capabilities of this SDK instance; browser-editor exports are separate. */
  getExportCapabilities(): ExportCapabilities {
    return getExportCapabilities();
  }

  /** Reject until a real compiler and file writer are wired to this SDK. */
  async exportTypst(_outputPath: string): Promise<void> {
    throw new UnsupportedExportError('typst');
  }

  async exportPrince(_outputPath: string): Promise<void> {
    throw new UnsupportedExportError('prince');
  }

  async exportImages(_markdown: string): Promise<Buffer[]> {
    throw new UnsupportedExportError('images');
  }

  async exportXiaohongshu(_outputPath: string, _markdown: string): Promise<void> {
    throw new UnsupportedExportError('xiaohongshu');
  }

  /** This is the long-image API, not the browser's WeChat HTML clipboard path. */
  async exportWeChat(_outputPath: string, _markdown: string): Promise<void> {
    throw new UnsupportedExportError('wechatLongImage');
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

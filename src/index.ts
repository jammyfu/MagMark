/**
 * MagMark 1.6.0 - Professional Refactored Entry Point
 * World-class magazine-quality markdown converter
 */

// Core exports
export { MagMark } from './core/magmark';
export type { MagMarkOptions, RenderResult } from './core/magmark';

// Plugin exports
export {
  markdownToMagazine,
  cjkSpacer,
  paginationNodes,
  typographyEnhancers,
  createMagazinePipeline,
} from './plugins';

export type {
  MagazineTransformOptions,
  PaginationOptions,
  TypographyOptions,
} from './plugins';

// Editor exports
export { Editor } from './editor/components/Editor';
export type { EditorProps } from './editor/components/Editor';

export {
  MagazineNodes,
  FullBleedImage,
  PullQuote,
  GridContainer,
  PageBreak,
} from './editor/extensions/magazine-nodes';

export { CJKSpacers } from './editor/extensions/cjk-spacers';
export { PageBreakControls } from './editor/extensions/page-break-controls';

export { useBaselineGrid } from './editor/hooks/use-baseline-grid';

// Renderer exports
export {
  renderWithPagedJs,
  createPagedDocument,
  generatePrintStyles,
} from './renderer/pagedjs-engine';

export {
  calculatePageHeights,
  measureElementHeight,
  adjustPageBreak,
  insertManualPageBreak,
} from './renderer/js-pagination';

export { BaseGridOverlay } from './renderer/base-grid-overlay';

export {
  generateRunningHeaders,
  generateRunningHeaderCSS,
} from './renderer/running-headers';

// Export engines
export {
  generateTypstTemplate,
  compileTypst,
} from './export/typst-converter';

export {
  generatePrinceHtml,
  convertWithPrince,
} from './export/princexml-converter';

export {
  exportImage,
  exportImages,
  combineToLongImage,
  exportXiaohongshuCarousel,
  exportWechatLongImage,
} from './export/image-renderer';

export { combineToLongImage as combineWeChatImages } from './export/wechat-combiner';
export { createCarouselZip } from './export/xiaohongshu-zipper';

// Schema exports
export {
  MagazineInputSchema,
  DesignTokensSchema,
  ExportFormatSchema,
  PlatformSchema,
  validateMagazineInput,
  validateDesignTokens,
  getDefaultDesignTokens,
} from './schemas/input-schema';

export type {
  MagazineInput,
  DesignTokens,
  ExportFormat,
  Platform,
} from './schemas/input-schema';

// Design tokens
export { default as designTokens } from '../design-tokens/v2.0.json';

// Version
import { version } from '../package.json';
export const VERSION = version;

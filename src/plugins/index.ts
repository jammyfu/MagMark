/**
 * MagMark 1.5.0 - Plugins Package
 * Export all remark/rehype plugins for markdown transformation
 */

// Core transformer
import markdownToMagazine, {
  createFullBleedImage,
  createPullQuote,
  createPageBreak,
  createGridContainer
} from './markdown-to-magazine';

// CJK spacing
import cjkSpacer, {
  addCJKSpacing,
  containsCJK,
  normalizeCJKSpacing
} from './cjk-spacer';

// Pagination
import paginationNodes, {
  createPageBreakNode,
  createPageNumberNode,
  calculatePagination,
  insertPageBreak,
  insertChapterBreak,
  PageBreakType,
  DEFAULT_PAGE_BREAK_MARKERS
} from './pagination-nodes';

// Typography enhancers
import typographyEnhancers, {
  smartenQuotes,
  noWidows,
  cjkBreaks
} from './typography-enhancers';

export {
  markdownToMagazine, createFullBleedImage, createPullQuote, createPageBreak, createGridContainer,
  cjkSpacer, addCJKSpacing, containsCJK, normalizeCJKSpacing,
  paginationNodes, createPageBreakNode, createPageNumberNode, calculatePagination, insertPageBreak, insertChapterBreak, PageBreakType, DEFAULT_PAGE_BREAK_MARKERS,
  typographyEnhancers, smartenQuotes, noWidows, cjkBreaks
};

export interface MagazineTransformOptions {
  autoSpaceCjk?: boolean;
  preventWidows?: boolean;
  fullBleedImages?: boolean;
  platform?: string;
  classPrefix?: string;
}

export interface PaginationOptions {
  markers?: string[];
  chapterNewPage?: boolean;
  avoidBreakInside?: boolean;
}

export interface TypographyOptions {
  preventWidows?: boolean;
  preventOrphans?: boolean;
  smartQuotes?: boolean;
  hangingPunctuation?: boolean;
}

export interface PipelineOptions extends MagazineTransformOptions, PaginationOptions, TypographyOptions {
  pageBreakMarkers?: string[];
}

// Plugin composition for easy use
export function createMagazinePipeline(options: PipelineOptions = {}) {
  return [
    cjkSpacer({ enabled: options.autoSpaceCjk !== false }),
    paginationNodes({
      markers: options.pageBreakMarkers,
      chapterNewPage: options.chapterNewPage !== false,
      avoidBreakInside: options.avoidBreakInside !== false
    }),
    typographyEnhancers({
      preventWidows: options.preventWidows !== false,
      preventOrphans: options.preventOrphans !== false,
      smartQuotes: options.smartQuotes !== false,
      hangingPunctuation: options.hangingPunctuation !== false
    }),
    markdownToMagazine({
      autoSpaceCjk: options.autoSpaceCjk !== false,
      preventWidows: options.preventWidows !== false,
      fullBleedImages: options.fullBleedImages !== false,
      platform: options.platform || 'web',
      classPrefix: options.classPrefix || 'mm-'
    })
  ];
}

export default {
  markdownToMagazine,
  cjkSpacer,
  paginationNodes,
  typographyEnhancers,
  createMagazinePipeline
};

/**
 * MagMark 2.0 - Plugins Package
 * Export all remark/rehype plugins for markdown transformation
 */

// Core transformer
export {
  default as markdownToMagazine,
  createFullBleedImage,
  createPullQuote,
  createPageBreak,
  createGridContainer
} from './markdown-to-magazine';

// CJK spacing
export {
  default as cjkSpacer,
  addCJKSpacing,
  containsCJK,
  normalizeCJKSpacing
} from './cjk-spacer';

// Pagination
export {
  default as paginationNodes,
  createPageBreakNode,
  createPageNumberNode,
  calculatePagination,
  insertPageBreak,
  insertChapterBreak,
  PageBreakType,
  DEFAULT_PAGE_BREAK_MARKERS
} from './pagination-nodes';

// Typography enhancers
export {
  default as typographyEnhancers,
  smartenQuotes,
  noWidows,
  cjkBreaks
} from './typography-enhancers';

// Plugin composition for easy use
export function createMagazinePipeline(options = {}) {
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

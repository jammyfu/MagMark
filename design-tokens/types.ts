/**
 * MagMark 2.0 Design Tokens TypeScript Definitions
 * Auto-generated from v2.0.json
 */

export interface Grid {
  columns: number;
  baselineStep: number;
  baselineUnit: 'px' | 'rem' | 'em';
  gutter: number;
}

export interface Margins {
  mobile: string;
  desktop: string;
  print: string;
}

export interface Typography {
  lineHeight: number;
  lineHeightRange: [number, number];
  paragraphSpacing: number;
  maxCharsPerLine: number;
  minCharsPerLine: number;
  widowsOrphans: number;
  autoSpaceCjk: boolean;
  hangPunctuationPx: number;
}

export interface WhiteSpace {
  paddingPercentage: string;
  ratioGolden: number;
  ratio3to4: number;
  ratio16to9: number;
}

export interface PlatformSize {
  width?: number;
  height?: number;
  ratio?: string;
  aspectRatio?: string;
}

export interface Platforms {
  xiaohongshu: {
    primary: PlatformSize;
    alternative: PlatformSize;
  };
  wechat: PlatformSize;
  cover: PlatformSize;
  pdf: string[];
  web: 'responsive' | string;
}

export interface Pagination {
  manualMarkers: string[];
  avoidBreakInside: boolean;
  chapterNewPage: boolean;
  dragPointSupport: boolean;
}

export interface Images {
  fullBleed: boolean;
  captionAlign: 'left' | 'center' | 'right';
  separatorColor: string;
  preferredRatios: string[];
}

export interface TypographyLevel {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small' | string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
}

export interface TypographySystem {
  primaryFont: string;
  fallbackFonts: string[];
  levels: TypographyLevel[];
}

export interface Colors {
  textPrimary: string;
  textSecondary: string;
  background: string;
  accent: string;
  border: string;
}

export interface DesignTokens {
  version: string;
  lastUpdated: string;
  grid: Grid;
  margins: Margins;
  typography: Typography;
  whiteSpace: WhiteSpace;
  platforms: Platforms;
  pagination: Pagination;
  images: Images;
  typographySystem: TypographySystem;
  colors: Colors;
}

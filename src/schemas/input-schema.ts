/**
 * MagMark 2.0 - Input Schema Validation
 * Zod schemas for input validation
 */
import { z } from 'zod';

// Design token partial schema
const TypographyLevelSchema = z.object({
  tag: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small', 'span']),
  fontSize: z.number().positive(),
  fontWeight: z.number().min(100).max(900),
  lineHeight: z.number().positive(),
});

const GridSchema = z.object({
  columns: z.number().int().min(1).max(24).default(12),
  baselineStep: z.number().int().positive().default(8),
  baselineUnit: z.enum(['px', 'rem', 'em']).default('px'),
  gutter: z.number().int().positive().default(24),
});

const MarginsSchema = z.object({
  mobile: z.string().default('8%'),
  desktop: z.string().default('10%'),
  print: z.string().default('48px'),
});

const TypographySchema = z.object({
  lineHeight: z.number().min(1).max(3).default(1.75),
  lineHeightRange: z.tuple([z.number(), z.number()]).default([1.6, 1.8]),
  paragraphSpacing: z.number().default(1.5),
  maxCharsPerLine: z.number().int().positive().default(40),
  minCharsPerLine: z.number().int().positive().default(15),
  widowsOrphans: z.number().int().min(1).max(5).default(2),
  autoSpaceCjk: z.boolean().default(true),
  hangPunctuationPx: z.number().int().default(2),
});

const PlatformSizeSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  ratio: z.string().optional(),
  aspectRatio: z.string().optional(),
});

const PlatformsSchema = z.object({
  xiaohongshu: z.object({
    primary: PlatformSizeSchema,
    alternative: PlatformSizeSchema,
  }),
  wechat: PlatformSizeSchema,
  cover: PlatformSizeSchema,
  pdf: z.array(z.string()).default(['A4', 'Letter']),
  web: z.union([z.literal('responsive'), z.string()]).default('responsive'),
});

const ColorsSchema = z.object({
  textPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1a1a1a'),
  textSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#666666'),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#d32f2f'),
  border: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#e0e0e0'),
});

// Main design tokens schema
export const DesignTokensSchema = z.object({
  version: z.string().default('2.0'),
  lastUpdated: z.string().datetime().default(() => new Date().toISOString()),
  grid: GridSchema,
  margins: MarginsSchema,
  typography: TypographySchema,
  platforms: PlatformsSchema,
  colors: ColorsSchema,
});

// Export format schema
export const ExportFormatSchema = z.enum(['png', 'pdf', 'zip', 'html', 'typ']);

// Platform schema
export const PlatformSchema = z.enum(['xiaohongshu', 'wechat', 'pdf', 'web']);

// Main input schema
export const MagazineInputSchema = z.object({
  markdown: z.string().min(1, 'Markdown content is required'),
  designTokens: DesignTokensSchema.optional(),
  platform: PlatformSchema.default('web'),
  options: z.object({
    autoSpaceCjk: z.boolean().default(true),
    pageSize: z.string().optional(),
    exportFormat: ExportFormatSchema.default('png'),
    resolution: z.enum(['quick', 'standard', 'print']).default('standard'),
    darkMode: z.boolean().default(false),
    customCss: z.string().optional(),
  }).default({}),
});

// Pagination options schema
export const PaginationOptionsSchema = z.object({
  manualMarkers: z.array(z.string()).default(['---', '<!-- page-break -->']),
  avoidBreakInside: z.boolean().default(true),
  chapterNewPage: z.boolean().default(true),
  dragPointSupport: z.boolean().default(true),
});

// Image render options schema
export const ImageRenderOptionsSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  quality: z.number().min(1).max(100).default(90),
  scale: z.number().positive().default(2),
  width: z.number().int().positive().default(1200),
  height: z.number().int().positive().default(800),
  fullPage: z.boolean().default(false),
  backgroundColor: z.string().default('#ffffff'),
  darkMode: z.boolean().default(false),
});

// Typst options schema
export const TypstOptionsSchema = z.object({
  pageSize: z.enum(['A4', 'Letter', 'A5', 'custom']).default('A4'),
  dimensions: z.object({
    width: z.string(),
    height: z.string(),
  }).optional(),
  margins: z.object({
    top: z.string().default('2.5cm'),
    right: z.string().default('2.5cm'),
    bottom: z.string().default('2.5cm'),
    left: z.string().default('2.5cm'),
  }).default({}),
  fontFamily: z.string().default('Noto Serif SC'),
  fontSize: z.string().default('11pt'),
  lineSpacing: z.string().default('1.75em'),
  outputPath: z.string().optional(),
});

// PrinceXML options schema
export const PrinceOptionsSchema = z.object({
  pageSize: z.union([z.enum(['A4', 'Letter', 'A5']), z.string()]).default('A4'),
  margins: z.object({
    top: z.string().default('48px'),
    right: z.string().default('48px'),
    bottom: z.string().default('48px'),
    left: z.string().default('48px'),
  }).default({}),
  pdfFormat: z.enum(['PDF/X-4', 'PDF/A-1b', 'PDF/A-3b', 'PDF/UA']).default('PDF/X-4'),
  javascript: z.boolean().default(false),
  bookmarks: z.boolean().default(true),
  links: z.boolean().default(true),
  baseUrl: z.string().optional(),
  cssFiles: z.array(z.string()).optional(),
  quality: z.enum(['low', 'normal', 'high']).default('high'),
});

// Type exports
export type MagazineInput = z.infer<typeof MagazineInputSchema>;
export type DesignTokens = z.infer<typeof DesignTokensSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type PaginationOptions = z.infer<typeof PaginationOptionsSchema>;
export type ImageRenderOptions = z.infer<typeof ImageRenderOptionsSchema>;
export type TypstOptions = z.infer<typeof TypstOptionsSchema>;
export type PrinceOptions = z.infer<typeof PrinceOptionsSchema>;

/**
 * Validate magazine input
 */
export function validateMagazineInput(data: unknown): { 
  valid: boolean; 
  data?: MagazineInput; 
  errors?: z.ZodError;
} {
  const result = MagazineInputSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, data: result.data };
  } else {
    return { valid: false, errors: result.error };
  }
}

/**
 * Validate design tokens
 */
export function validateDesignTokens(data: unknown): {
  valid: boolean;
  data?: DesignTokens;
  errors?: z.ZodError;
} {
  const result = DesignTokensSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, data: result.data };
  } else {
    return { valid: false, errors: result.error };
  }
}

/**
 * Get default design tokens
 */
export function getDefaultDesignTokens(): DesignTokens {
  return DesignTokensSchema.parse({});
}

export default {
  MagazineInputSchema,
  DesignTokensSchema,
  ExportFormatSchema,
  PlatformSchema,
  validateMagazineInput,
  validateDesignTokens,
  getDefaultDesignTokens,
};

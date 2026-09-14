"""One-time, hash-guarded integration of already tested baseline repairs.

No network requests, credentials, repository settings or branch operations.
The workflow may commit only after source hashes and all checks pass.
"""
import hashlib
import json
from pathlib import Path
hashes = json.loads(Path('tools/quiet-baseline-hashes.json').read_text())
for name, (before, after) in hashes.items():
    p = Path(name)
    if p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest() != before:
        raise RuntimeError(f'Baseline changed: {name}')
p=Path('src/editor/extensions/magazine-nodes.ts');s=p.read_text()
s=s.replace("import { Decoration, DecorationSet } from 'prosemirror-view';", """import { Decoration, DecorationSet } from 'prosemirror-view';
import type { DOMOutputSpec } from 'prosemirror-model';

export interface FullBleedImageAttrs { src: string; alt?: string; caption?: string; credit?: string }
export interface PullQuoteAttrs { attribution?: string; position?: string }
export interface GridContainerAttrs { columns?: number }
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    magazineNodes: {
      insertPageBreak: () => ReturnType;
      insertChapterBreak: () => ReturnType;
      insertFullBleedImage: (attrs: FullBleedImageAttrs) => ReturnType;
      insertPullQuote: (attrs: PullQuoteAttrs) => ReturnType;
      insertGridContainer: (attrs: GridContainerAttrs) => ReturnType;
    };
  }
}""")
a=s.index('    return [\n      \'figure\'',s.index('renderHTML'))
b=s.index('    ].filter(Boolean);',a)+len('    ].filter(Boolean);')
s=s[:a]+'''    const children: DOMOutputSpec[] = [['img', { src, alt, class: 'mm-image mm-image--full-bleed' }]];
    if (caption) children.push(['figcaption', { class: 'mm-caption' }, String(caption)]);
    if (credit) children.push(['cite', { class: 'mm-credit' }, String(credit)]);
    return ['figure', { 'data-full-bleed': 'true', class: 'mm-figure mm-figure--full-bleed' }, ...children];'''+s[b:]
a=s.index('    return [\n      \'blockquote\'',s.index('renderHTML'))
b=s.index('    ].filter(Boolean);',a)+len('    ].filter(Boolean);')
s=s[:a]+'''    const children: DOMOutputSpec[] = [['div', { class: 'mm-pull-quote__content' }, 0]];
    if (attribution) children.push(['cite', { class: 'mm-pull-quote__attribution' }, String(attribution)]);
    return ['blockquote', { 'data-pull-quote': 'true', class: `mm-pull-quote mm-pull-quote--${position}` }, ...children];'''+s[b:]
s=s.replace('const decorations = [];','const decorations: Decoration[] = [];')
p.write_text(s)
p=Path('src/editor/hooks/use-baseline-grid.ts');s=p.read_text().replace('useState, useEffect,','useState,');p.write_text(s)
p=Path('src/export/image-renderer.ts');s=p.read_text(); s="import { UnsupportedExportError } from '../core/export-capabilities';\n"+s
start=s.index('export async function exportImage(');end=s.index('\n/**',start)
s=s[:start]+'''export async function exportImage(
  _html: string,
  _options: ImageRenderOptions = {}
): Promise<Buffer> {
  throw new UnsupportedExportError('images');
}
'''+s[end:]
s=s.replace('const { width = 1080, scale = 2 } = options;', 'const { width = 1080 } = options;')
start=s.index('export async function exportAsZip(');end=s.index('\n/**',start)
s=s[:start]+'''export async function exportAsZip(
  _pages: string[],
  _options: ExportFormat & { resolution?: 'quick' | 'standard' | 'print' }
): Promise<Buffer> {
  throw new UnsupportedExportError('xiaohongshu');
}
'''+s[end:]
start=s.index('export async function generateBookmarkedPdf(');end=s.index('\nexport default',start)
s=s[:start]+'''export async function generateBookmarkedPdf(
  _pages: string[],
  _headings: { level: number; text: string }[]
): Promise<Buffer> {
  throw new UnsupportedExportError('prince');
}
'''+s[end:];p.write_text(s)
for fn,name,argtyp in [('src/export/typst-converter.ts','compileTypst','TypstOptions'),('src/export/princexml-converter.ts','convertWithPrince','PrinceOptions')]:
 p=Path(fn);s=p.read_text();start=s.index('export async function '+name+'(');end=s.index('\n}',start)+2
 s=s[:start]+f'''export async function {name}(
  _input: string,
  _outputPath: string,
  _options: {argtyp} = {{}}
): Promise<{{ success: boolean; output?: string; error?: string }}> {{
  return {{ success: false, error: 'No compiler backend is configured. Use the template/HTML generator separately or the web editor print preview.' }};
}}'''+s[end:];p.write_text(s)
p=Path('src/export/wechat-combiner.ts');s=p.read_text().replace("ctx.imageSmoothingQuality = 'high';", "ctx.quality = 'best';")
s=s.replace('  options: { maxHeight?: number; overlap?: number } = {}','  _options: { maxHeight?: number; overlap?: number } = {}').replace('  const { maxHeight = 8000, overlap = 200 } = options;','  // Legacy character-based helper; it does not measure physical page height.')
p.write_text(s)
p=Path('src/export/xiaohongshu-zipper.ts');s=p.read_text().replace("import { Readable } from 'stream';\n",'').replace('    addPageNumbers = false,\n','');p.write_text(s)
p=Path('src/renderer/js-pagination.ts');s=p.read_text().replace('minContentHeight, widowOrphanLines, lineHeight','minContentHeight, lineHeight').replace('  availableHeight: number,\n  lineHeight: number','  _availableHeight: number,\n  lineHeight: number');p.write_text(s)
p=Path('src/renderer/running-headers.tsx');s=p.read_text().replace('  const isEven = page % 2 === 0;\n','');p.write_text(s)
p=Path('src/seo/meta-tags.ts');s=p.read_text();a=s.index('const defaultMetaTags:');b=s.index('\n};',a)+3;s=s[:a]+s[b:]
s=s.replace("...(article.modifiedTime && {\n      property:", "...(article.modifiedTime ? [{\n      property:")
s=s.replace("content: article.modifiedTime,\n    }),", "content: article.modifiedTime,\n    }] : []),")
s=s.replace("...(article.tags.length > 0 && {", "...(article.tags.length > 0 ? [{").replace("content: article.tags.join(','),\n    }),", "content: article.tags.join(','),\n    }] : []),")
s=s.replace("...(article.images[0] && {", "...(article.images[0] ? [{").replace("content: `${baseUrl}${article.images[0]}`,\n    }),", "content: `${baseUrl}${article.images[0]}`,\n    }] : []),")
s=s.replace("...(article.images[1] && {", "...(article.images[1] ? [{").replace("content: 'Document cover image',\n    }),", "content: 'Document cover image',\n    }] : []),")
# The second headline in the same object was redundant.
s=s.replace("    headline: article.headline,\n    image:", "    image:")
s=s.replace("    lang = 'zh-CN',\n",'')
p.write_text(s)
p=Path('src/seo/sitemap-generator.ts');s=p.read_text().replace('const defaultOptions: SitemapOptions =', 'const defaultOptions: Required<SitemapOptions> =')
s=s.replace('  const opts = { ...defaultOptions, ...options };', '''  const opts: Required<SitemapOptions> = {
    baseUrl: options.baseUrl ?? defaultOptions.baseUrl,
    excludePaths: options.excludePaths ?? defaultOptions.excludePaths,
    includeImages: options.includeImages ?? defaultOptions.includeImages,
    maxURLsPerFile: options.maxURLsPerFile ?? defaultOptions.maxURLsPerFile,
  };
  if (!Number.isInteger(opts.maxURLsPerFile) || opts.maxURLsPerFile < 1) throw new RangeError('maxURLsPerFile must be a positive integer.');''',1)
s=s.replace('      const xml = generateSingleSitemap(chunk, opts);\n','').replace('chunks.forEach((chunk, idx) => {','chunks.forEach((_chunk, idx) => {');p.write_text(s)
p=Path('src/seo/structured-data.ts');s=p.read_text().replace('export interface ArticleSchema {', 'export type AuthorData = PersonData;\nexport type PublisherData = OrganizationData;\n\nexport interface ArticleSchema {')
s=s.replace('    headline: metadata.title,','    headline: metadata.title,\n    image: [],');p.write_text(s)

p=Path('editor.ts'); s=p.read_text()
s=s.replace('function buildItems(minIndent: number, ordered: boolean)', 'function buildItems(minIndent: number, _ordered: boolean)')
s=s.replace('                let isTask = false;\n','').replace('                    isTask = true;\n','')
s=s.replace('    const bodyStyle = getComputedStyle(document.body);\n','')
s=s.replace('    allPages.forEach((p, i) => {', '    allPages.forEach(p => {')
p.write_text(s)
for name, (before, after) in hashes.items():
    if hashlib.sha256(Path(name).read_bytes()).hexdigest() != after:
        raise RuntimeError(f'Repaired content differs from tested source: {name}')
print(f'Verified {len(hashes)} repaired production files against tested hashes.')

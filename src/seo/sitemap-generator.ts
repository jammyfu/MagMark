/**
 * MagMark 2.0 - Sitemap Generator
 * Dynamic sitemap.xml, robots.txt, and structured data generation
 */

export interface SitemapEntry {
  loc: string;                    // Required: URL location
  lastmod?: string;               // Optional: Last modification date (ISO format)
  changefreq?: 
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
  images?: Array<{ url: string; caption?: string }>;
}

export interface SitemapOptions {
  baseUrl: string;
  excludePaths?: string[];        // Paths to exclude from sitemap
  includeImages?: boolean;
  maxURLsPerFile?: number;       // Split into multiple sitemaps if needed
}

const defaultOptions: SitemapOptions = {
  baseUrl: 'https://example.com',
  excludePaths: [],
  includeImages: false,
  maxURLsPerFile: 50000,       // Max URLs per sitemap file
};

/**
 * Generate sitemap.xml with support for multiple files
 */
export function generateSitemap(
  entries: SitemapEntry[],
  options: Partial<SitemapOptions> = {}
): { xml: string; index?: string; files: string[] } {
  const opts = { ...defaultOptions, ...options };
  
  // Filter excluded paths
  const filteredEntries = entries.filter(entry => 
    !opts.excludePaths.some(path => entry.loc.includes(path))
  );
  
  let index: string | undefined;
  const files: string[] = [];
  
  // Split into multiple sitemaps if needed
  if (filteredEntries.length > opts.maxURLsPerFile) {
    const chunks = chunkArray(filteredEntries, opts.maxURLsPerFile);
    
    chunks.forEach((chunk, idx) => {
      const fileName = `sitemap-${idx + 1}.xml`;
      const xml = generateSingleSitemap(chunk, opts);
      
      files.push(fileName);
      index = generateSitemapIndex(files, opts.baseUrl);
    });
    
    return {
      xml: index!,
      index,
      files,
    };
  } else {
    return {
      xml: generateSingleSitemap(filteredEntries, opts),
      files: ['sitemap.xml'],
    };
  }
}

/**
 * Generate single sitemap file
 */
function generateSingleSitemap(entries: SitemapEntry[], options: SitemapOptions): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        ${options.includeImages ? 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}>
${entries.map(entry => generateUrlEntry(entry, options)).join('\n')}
</urlset>`;
  
  return xml.trim();
}

/**
 * Generate single URL entry in sitemap
 */
function generateUrlEntry(entry: SitemapEntry, options: SitemapOptions): string {
  let xml = `<url>\n    <loc>${entry.loc}</loc>`;
  
  if (entry.lastmod) {
    xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
  }
  
  if (entry.changefreq) {
    xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
  }
  
  if (entry.priority) {
    xml += `\n    <priority>${entry.priority.toFixed(1)}</priority>`;
  }
  
  // Add image entries if enabled
  if (options.includeImages && entry.images) {
    entry.images.forEach(img => {
      xml += `\n    <image:image>
        <image:loc>${img.url}</image:loc>`;
      if (img.caption) {
        xml += `\n        <image:caption>${escapeXml(img.caption)}</image:caption>`;
      }
      xml += `\n    </image:image>`;
    });
  }
  
  xml += '\n</url>';
  return xml;
}

/**
 * Generate sitemap index for multi-file sitemaps
 */
function generateSitemapIndex(files: string[], baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map(file => `  <sitemap>
    <loc>${baseUrl}/${file}</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapURLs: string[]): string {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Search engine crawlers',
    'Googlebot:',
    '  Disallow: /api/',
    '  Disallow: /admin/',
    '',
    'Bingbot:',
    '  Disallow: /api/',
    '  Disallow: /admin/',
    '',
  ];
  
  if (sitemapURLs.length > 0) {
    lines.push('# Sitemap locations');
    sitemapURLs.forEach(url => {
      lines.push(`Sitemap: ${url}`);
    });
  }
  
  lines.push('');
  lines.push('# Crawl-delay for polite crawling');
  lines.push('Crawl-delay: 1');
  
  return lines.join('\n').trim();
}

/**
 * Extract all URLs from HTML content (for automatic sitemap generation)
 */
export function extractURLsFromHTML(html: string): string[] {
  const urls: string[] = [];
  
  // Match <a href> tags
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    
    // Only add absolute or root-relative URLs
    if (href.startsWith('http') || href.startsWith('/')) {
      urls.push(href);
    }
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Auto-generate sitemap based on content structure
 */
export async function autoGenerateSitemap(
  articles: Array<{
    title: string;
    slug: string;
    publishedAt: Date;
    category: string;
    keywords: string[];
  }>,
  baseUrl: string
): Promise<{ sitemapXML: string; robotsTxt: string }> {
  const entries: SitemapEntry[] = articles.map(article => ({
    loc: `${baseUrl}/article/${article.slug}`,
    lastmod: article.publishedAt.toISOString(),
    changefreq: 'monthly',
    priority: 0.8,
    images: [
      {
        url: `${baseUrl}/images/articles/${article.slug}-cover.jpg`,
        caption: article.title,
      },
    ],
  }));
  
  // Add category pages
  const categories = new Set(articles.map(a => a.category));
  categories.forEach(category => {
    entries.push({
      loc: `${baseUrl}/category/${encodeURIComponent(category.toLowerCase())}`,
      changefreq: 'weekly',
      priority: 0.6,
    });
  });
  
  // Add home page
  entries.unshift({
    loc: baseUrl,
    changefreq: 'daily',
    priority: 1.0,
  });
  
  const { xml: sitemapXML } = generateSitemap(entries, { baseUrl });
  const robotsTxt = generateRobotsTxt([`${baseUrl}/sitemap.xml`]);
  
  return { sitemapXML, robotsTxt };
}

/**
 * Generate JSON-LD for organization website
 */
export function generateOrganizationSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MagMark Document',
    url: window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate JSON-LD for breadcrumb navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]): string {
  const itemsList = breadcrumbs.map((crumb, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: crumb.name,
    item: crumb.url,
  }));
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemsList,
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate XML escape helpers
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * Validate sitemap entries before generation
 */
export function validateSitemapEntries(entries: SitemapEntry[]): string[] {
  const errors: string[] = [];
  
  entries.forEach((entry, idx) => {
    if (!entry.loc) {
      errors.push(`Entry ${idx}: Missing required 'loc' field`);
    }
    
    if (entry.loc && !/^https?:\/\//i.test(entry.loc)) {
      errors.push(`Entry ${idx}: Invalid URL format: ${entry.loc}`);
    }
    
    if (entry.priority && (entry.priority < 0 || entry.priority > 1)) {
      errors.push(`Entry ${idx}: Priority must be between 0 and 1: ${entry.priority}`);
    }
    
    if (entry.lastmod && isNaN(Date.parse(entry.lastmod))) {
      errors.push(`Entry ${idx}: Invalid date format for lastmod: ${entry.lastmod}`);
    }
  });
  
  return errors;
}

/**
 * Calculate optimal crawl schedule based on content update frequency
 */
export function calculateCrawlSchedule(contentUpdates: Array<{
  path: string;
  lastModified: Date;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}>): Record<string, string> {
  const schedule: Record<string, string> = {};
  
  contentUpdates.forEach(update => {
    switch (update.updateFrequency) {
      case 'realtime':
        schedule[update.path] = 'Every 1 hour';
        break;
      case 'hourly':
        schedule[update.path] = 'Every 4 hours';
        break;
      case 'daily':
        schedule[update.path] = 'Once daily at midnight UTC';
        break;
      case 'weekly':
        schedule[update.path] = 'Every Monday at 00:00 UTC';
        break;
      case 'monthly':
        schedule[update.path] = 'First of each month at 00:00 UTC';
        break;
    }
  });
  
  return schedule;
}

export default {
  generateSitemap,
  generateRobotsTxt,
  extractURLsFromHTML,
  autoGenerateSitemap,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  validateSitemapEntries,
  calculateCrawlSchedule,
};

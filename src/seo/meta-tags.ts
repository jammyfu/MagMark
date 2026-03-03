/**
 * MagMark 2.0 - SEO Meta Tags Generator
 * Open Graph, Twitter Cards, Canonical URLs, Structured Data
 */

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  charset?: string;
}

export interface ArticleData {
  headline: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  images: string[];
  tags: string[];
  category: string;
}

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  quality?: number;
}

const defaultMetaTags: Record<string, string> = {
  'og:type': 'article',
  'og:site_name': 'MagMark Document',
};

/**
 * Generate Open Graph meta tags for social sharing
 */
export function generateOpenGraphTags(
  article: ArticleData,
  baseUrl: string = window.location.origin
): string[] {
  const tags: MetaTag[] = [
    // Basic OG tags
    { property: 'og:title', content: article.headline },
    { property: 'og:description', content: article.description },
    { property: 'og:url', content: baseUrl },
    { property: 'og:type', content: 'article' },
    
    // Site name (can be customized)
    { property: 'og:site_name', content: 'MagMark Document' },
    
    // Images (prefer first image or generate screenshot)
    ...article.images.map((img, idx) => ({
      property: `og:image${idx === 0 ? '' : `:${idx + 1}`}`,
      content: `${baseUrl}${img}`,
    })),
    
    // Image metadata
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    
    // Article specific
    { property: 'article:published_time', content: article.publishedTime },
    ...(article.modifiedTime && {
      property: 'article:modified_time',
      content: article.modifiedTime,
    }),
    { property: 'article:author', content: article.author },
    ...(article.tags.length > 0 && {
      property: 'article:tag',
      content: article.tags.join(','),
    }),
    { property: 'article:section', content: article.category },
  ];

  return tags.map(generateMetaTagHTML);
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterTags(
  article: ArticleData,
  baseUrl: string = window.location.origin
): string[] {
  const tags: MetaTag[] = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: article.headline },
    { name: 'twitter:description', content: article.description },
    { name: 'twitter:creator', content: article.author },
    { name: 'twitter:site', content: '@magmark' },
    ...(article.images[0] && {
      name: 'twitter:image',
      content: `${baseUrl}${article.images[0]}`,
    }),
    ...(article.images[1] && {
      name: 'twitter:image:alt',
      content: 'Document cover image',
    }),
  ];

  return tags.map(generateMetaTagHTML);
}

/**
 * Generate JSON-LD structured data for rich snippets
 */
export function generateStructuredData(article: ArticleData): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    alternateName: article.headline.replace(/-/g, ' '),
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
      url: null,
    },
    datePublished: article.publishedTime,
    ...(article.modifiedTime && {
      dateModified: article.modifiedTime,
    }),
    publisher: {
      '@type': 'Organization',
      name: 'MagMark',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': window.location.href,
    },
    headline: article.headline,
    image: article.images.map((url) => ({
      '@type': 'ImageObject',
      url: `${window.location.origin}${url}`,
    })),
    articleSection: article.category,
    keywords: article.tags.join(', '),
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate canonical URL tag
 */
export function generateCanonicalTag(url: string): string {
  return `<link rel="canonical" href="${url}" />`;
}

/**
 * Generate alternate language links for i18n
 */
export function generateAlternateLinks(langs: Record<string, string>): string {
  return Object.entries(langs)
    .map(([lang, url]) => `<link rel="alternate" hreflang="${lang}" href="${url}" />`)
    .join('\n');
}

/**
 * Generate robots meta directives
 */
export function generateRobotsDirective(index: boolean = true, follow: boolean = true): string {
  const directives = [];
  if (index) directives.push('index');
  else directives.push('noindex');
  
  if (follow) directives.push('follow');
  else directives.push('nofollow');
  
  return `<meta name="robots" content="${directives.join(', ')}" />`;
}

/**
 * Add favicon meta tags
 */
export function generateFaviconTags(favicons: { size: string; src: string }[]): string {
  return favicons
    .map(({ size, src }) => `<link rel="icon" sizes="${size}" href="${src}" />`)
    .join('\n');
}

/**
 * Generate preconnect links for performance
 */
export function generatePreconnectLinks(urls: string[]): string {
  return urls.map((url) => `<link rel="preconnect" href="${url}" crossorigin />`).join('\n');
}

/**
 * Generate critical CSS inline
 */
export function generateCriticalCSS(css: string): string {
  return `<style>${css}</style>`;
}

/**
 * Complete HTML head generator
 */
export function generateCompleteHead(
  article: ArticleData,
  options: {
    baseUrl?: string;
    title?: string;
    description?: string;
    canonicalUrl?: string;
    index?: boolean;
    follow?: boolean;
    lang?: string;
  } = {}
): string {
  const {
    baseUrl = window.location.origin,
    title = article.headline,
    description = article.description,
    canonicalUrl = window.location.href,
    index = true,
    follow = true,
    lang = 'zh-CN',
  } = options;

  // Update article data with provided values
  const updatedArticle = { ...article, headline: title, description };

  const tags = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${title}</title>`,
    generateCanonicalTag(canonicalUrl),
    generateRobotsDirective(index, follow),
    ...generateOpenGraphTags(updatedArticle, baseUrl),
    ...generateTwitterTags(updatedArticle, baseUrl),
    generateStructuredData(updatedArticle),
  ].join('\n');

  return tags;
}

/**
 * Helper: Convert meta tag object to HTML
 */
function generateMetaTagHTML(tag: MetaTag): string {
  if (tag.property) {
    return `<meta property="${tag.property}" content="${tag.content}" />`;
  }
  if (tag.name) {
    return `<meta name="${tag.name}" content="${tag.content}" />`;
  }
  return '';
}

/**
 * Extract semantic structure from HTML
 * Enhances AI crawling by adding proper semantic tags
 */
export function enhanceSemanticStructure(html: string): string {
  let result = html;
  
  // Wrap main content in <article> if it looks like an article
  result = result.replace(
    /<h1[^>]*>(.*?)<\/h1>/s,
    '<article itemscope itemtype="https://schema.org/Article"><h1 itemprop="headline">$1</h1>'
  );
  
  // Close article at end
  result = result.replace(/(<\/body>|$)/, '</article>$1');
  
  // Add section tags around logical groups
  result = result.replace(/<h2[^>]*>(.*?)<\/h2>/g, '<section><h2>$1</h2>');
  result = result.replace(/<\/p>(?=<h2|<aside|<footer|$)/g, '</section></p>');
  
  return result;
}

/**
 * Generate Table of Contents with anchor links
 */
export function generateTableOfContents(headings: { level: number; text: string; id: string }[]): string {
  if (headings.length === 0) return '';
  
  return `
<nav aria-label="Table of Contents" class="mm-toc">
  <h4 style="font-size: 14pt; margin-bottom: 1em;">目录</h4>
  <ul style="list-style: none; padding-left: 0;">
    ${headings.map(h => `
    <li style="margin: 0.5em 0;">
      ${h.level === 2 
        ? `<a href="#${h.id}" style="text-decoration: none; color: inherit;">${h.text}</a>`
        : `<a href="#${h.id}" style="text-decoration: none; color: #666; margin-left: 1em;">• ${h.text}</a>`
      }
    </li>`).join('')}
  </ul>
</nav>
`.trim();
}

/**
 * Generate breadcrumbs navigation
 */
export function generateBreadcrumbs(path: string[], currentTitle: string): string {
  return `
<nav aria-label="Breadcrumb" class="mm-breadcrumbs" style="margin: 2em 0; font-size: 12pt; color: #666;">
  ${path.map((item, idx) => `
    ${idx < path.length - 1
      ? `<a href="#" style="text-decoration: none; color: #d32f2f;">${item}</a> / `
      : `<span>${currentTitle}</span>`
    }
  `).join('')}
</nav>
`.trim();
}

/**
 * Suggest alt text for images based on context
 */
export function suggestImageAltText(imageSrc: string, context: string = ''): string {
  const filename = imageSrc.split('/').pop() || 'image';
  const name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  
  return context.trim() 
    ? `${name}, ${context}`
    : `Document illustration: ${name}`;
}

/**
 * Generate internal link suggestions
 */
export function suggestInternalLinks(content: string, existingIds: Set<string>): string[] {
  const links: string[] = [];
  
  // Find potential headings for links
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const [, hashLevel, text] = match;
    if (hashLevel.length <= 2) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!existingIds.has(id)) {
        links.push(`#/${id}`);
      }
    }
  }
  
  return links.slice(0, 10); // Limit to 10 suggestions
}

/**
 * Generate sitemap.xml for document site
 */
export function generateSitemapURLs(urls: Array<{ loc: string; lastmod: string; priority: number }>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(sitemapURL: string): string {
  return `User-agent: *
Allow: /

# Search engine crawlers
Googlebot:
  Disallow: /api/
  Disallow: /admin/

Bingbot:
  Disallow: /api/
  Disallow: /admin/

# Sitemap
Sitemap: ${sitemapURL}

# Crawl-delay for polite crawling
Crawl-delay: 1
`.trim();
}

export default {
  generateOpenGraphTags,
  generateTwitterTags,
  generateStructuredData,
  generateCanonicalTag,
  generateAlternateLinks,
  generateRobotsDirective,
  generateFaviconTags,
  generatePreconnectLinks,
  generateCriticalCSS,
  generateCompleteHead,
  enhanceSemanticStructure,
  generateTableOfContents,
  generateBreadcrumbs,
  suggestImageAltText,
  suggestInternalLinks,
  generateSitemapURLs,
  generateRobotsTxt,
};

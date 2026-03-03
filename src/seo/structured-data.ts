/**
 * MagMark 2.0 - Structured Data Generator
 * Schema.org JSON-LD markup for rich search results
 */

export interface ArticleSchema {
  headline: string;
  alternateName?: string[];
  description: string;
  image: string | string[];
  author: AuthorData | AuthorData[];
  publisher: PublisherData;
  datePublished: string;
  dateModified?: string;
  articleBody?: string;
  keywords?: string[];
  mainEntityOfPage?: {
    '@type': string;
    '@id': string;
  };
}

export interface FAQQuestion {
  questionName: string;
  acceptedAnswerText: string;
}

export interface HowToStep {
  name: string;
  url?: string;
  itemListElement?: Array<{
    '@type': 'HowToTip' | 'HowToDirection';
    text: string;
    url?: string;
  }>;
}

export interface HowToItem {
  totaltime: string;      // e.g., "PT1H30M"
  estimateDuration?: string;
  steps: HowToStep[];
}

export interface PersonData {
  '@type': 'Person';
  name: string;
  url?: string;
  jobTitle?: string;
  sameAs?: string[];
}

export interface OrganizationData {
  '@type': 'Organization';
  name: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  sameAs?: string[];
}

/**
 * Generate Article Schema (for blog posts, news articles)
 */
export function generateArticleSchema(data: ArticleSchema): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    ...(data.alternateName && { alternateName: data.alternateName }),
    description: data.description,
    image: Array.isArray(data.image) ? data.image.map(url => ({
      '@type': 'ImageObject',
      url: url.startsWith('http') ? url : `${window.location.origin}${url}`,
    })) : [{
      '@type': 'ImageObject',
      url: data.image.startsWith('http') ? data.image : `${window.location.origin}${data.image}`,
    }],
    author: Array.isArray(data.author) 
      ? data.author.map(author => transformAuthor(author))
      : transformAuthor(data.author),
    publisher: transformPublisher(data.publisher),
    datePublished: data.datePublished,
    ...(data.dateModified && { dateModified: data.dateModified }),
    ...(data.articleBody && { articleBody: truncateForSchema(data.articleBody, 5000) }),
    ...(data.keywords && { keywords: data.keywords.join(', ') }),
    ...(data.mainEntityOfPage && { mainEntityOfPage: data.mainEntityOfPage }),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate FAQ Page Schema
 */
export function generateFAQSchema(questions: FAQQuestion[]): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.questionName,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.acceptedAnswerText,
      },
    })),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate How-to Schema
 */
export function generateHowToSchema(item: HowToItem): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: item.steps[0]?.name || 'How-to Guide',
    totalTime: item.totaltime,
    ...(item.estimateDuration && {
      estimateDuration: item.estimateDuration,
    }),
    knownAction: {
      '@type': 'HowToAction',
      targetUrl: window.location.href,
    },
    step: item.steps.map(step => ({
      '@type': 'HowToStep',
      name: step.name,
      ...(step.url && { url: step.url }),
      ...(step.itemListElement && {
        itemListElement: step.itemListElement.map((el, idx) => ({
          '@type': el['@type'],
          text: el.text,
          ...(el.url && { url: el.url }),
          position: idx + 1,
        })),
      }),
    })),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate WebPage Schema
 */
export function generateWebPageSchema(options: {
  headline: string;
  description: string;
  isPartOf?: {
    '@type': string;
    name: string;
    id: string;
  };
}): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.headline,
    ...(options.description && { description: options.description }),
    ...(options.isPartOf && { isPartOf: options.isPartOf }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 1,
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        item: window.location.href,
      }],
    },
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(items: Array<{
  name: string;
  item: string;
  position: number;
}>): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      name: item.name,
      item: item.item,
      position: item.position,
    })),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate Organization Schema
 */
export function generateOrganizationSchema(data: OrganizationData): string {
  const schema: object = {
    '@context': 'https://schema.org',
    ...data,
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate Person Schema
 */
export function generatePersonSchema(data: PersonData): string {
  const schema: object = {
    '@context': 'https://schema.org',
    ...data,
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate VideoObject Schema (for embedded videos)
 */
export function generateVideoSchema(data: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl?: string;
  embedUrl?: string;
}): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: data.name,
    description: data.description,
    thumbnailUrl: [data.thumbnailUrl],
    uploadDate: data.uploadDate,
    duration: data.duration,
    ...(data.contentUrl && { contentUrl: data.contentUrl }),
    ...(data.embedUrl && {
      embedUrl: data.embedUrl,
    }),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate ImageObject Schema
 */
export function generateImageSchema(data: {
  name: string;
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: data.name,
    contentUrl: data.url,
    ...(data.caption && { caption: data.caption }),
    ...(data.width && { width: data.width }),
    ...(data.height && { height: data.height }),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate SitelinksSearchBox Schema (for Google site search)
 */
export function generateSitelinksSearchBoxSchema(): string {
  const schema: object = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${window.location.origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Transform author data to standardized format
 */
function transformAuthor(author: AuthorData | string): object {
  if (typeof author === 'string') {
    return {
      '@type': 'Person',
      name: author,
    };
  }
  
  return {
    '@type': 'Person',
    name: author.name,
    ...(author.url && { url: author.url }),
    ...(author.jobTitle && { jobTitle: author.jobTitle }),
    ...(author.sameAs && { sameAs: author.sameAs }),
  };
}

/**
 * Transform publisher data to standardized format
 */
function transformPublisher(publisher: PublisherData): object {
  return {
    '@type': 'Organization',
    name: publisher.name,
    ...(publisher.logo?.url && {
      logo: {
        '@type': 'ImageObject',
        url: publisher.logo.url,
        ...(publisher.logo.width && { width: publisher.logo.width }),
        ...(publisher.logo.height && { height: publisher.logo.height }),
      },
    }),
    ...(publisher.sameAs && { sameAs: publisher.sameAs }),
  };
}

/**
 * Truncate text for schema (to avoid JSON size limits)
 */
function truncateForSchema(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate all structured data at once
 */
export function generateAllStructuredData(config: {
  article?: ArticleSchema;
  faq?: FAQQuestion[];
  howTo?: HowToItem;
  breadcrumbs?: Array<{ name: string; item: string; position: number }>;
  organization?: OrganizationData;
  video?: Parameters<typeof generateVideoSchema>[0];
}): string {
  const scripts: string[] = [];
  
  if (config.article) {
    scripts.push(generateArticleSchema(config.article));
  }
  
  if (config.faq) {
    scripts.push(generateFAQSchema(config.faq));
  }
  
  if (config.howTo) {
    scripts.push(generateHowToSchema(config.howTo));
  }
  
  if (config.breadcrumbs) {
    scripts.push(generateBreadcrumbSchema(config.breadcrumbs));
  }
  
  if (config.organization) {
    scripts.push(generateOrganizationSchema(config.organization));
  }
  
  if (config.video) {
    scripts.push(generateVideoSchema(config.video));
  }
  
  return scripts.join('\n');
}

/**
 * Validate structured data for common errors
 */
export function validateStructuredData(jsonString: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const data = JSON.parse(jsonString);
    
    // Check required fields based on @type
    const requiredFields: Record<string, string[]> = {
      'Article': ['headline', 'datePublished', 'author'],
      'FAQPage': ['mainEntity'],
      'HowTo': ['step', 'name'],
      'WebPage': ['name'],
      'BreadcrumbList': ['itemListElement'],
      'Organization': ['name', '@type'],
      'Person': ['name', '@type'],
    };
    
    const type = data['@type'];
    if (type && requiredFields[type]) {
      requiredFields[type].forEach(field => {
        if (!hasField(data, field)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }
    
    // Check for URL formats
    if (data.image && typeof data.image === 'object') {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      images.forEach((img: any, idx: number) => {
        if (img.url && !/^https?:\/\//i.test(img.url)) {
          warnings.push(`Image ${idx}: Relative URL detected. Consider using absolute URLs.`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (e) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${(e as Error).message}`],
      warnings: [],
    };
  }
}

/**
 * Helper: Check if nested field exists
 */
function hasField(obj: any, path: string): boolean {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return false;
    current = current[part];
  }
  
  return current !== undefined;
}

/**
 * Enrich content with automatic structured data suggestions
 */
export function enrichWithStructuredData(html: string, metadata: {
  title: string;
  description: string;
  author: string;
  publishedDate: Date;
  keywords: string[];
  category?: string;
}): string {
  const articleSchema = generateArticleSchema({
    headline: metadata.title,
    description: metadata.description,
    author: {
      '@type': 'Person',
      name: metadata.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MagMark Document',
    },
    datePublished: metadata.publishedDate.toISOString(),
    keywords: metadata.keywords,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': window.location.href,
    },
  });
  
  // Find the <head> tag and inject before </head>
  return html.replace(
    /<\/head>/i,
    `    ${articleSchema}\n</head>`
  );
}

export default {
  generateArticleSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateVideoSchema,
  generateImageSchema,
  generateSitelinksSearchBoxSchema,
  generateAllStructuredData,
  validateStructuredData,
  enrichWithStructuredData,
};

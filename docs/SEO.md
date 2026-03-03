# 🚀 MagMark 2.0 - SEO & AI 抓取优化指南

本指南介绍如何使用 MagMark 2.0 的 SEO 模块生成搜索引擎友好的文档。

---

## 📋 目录

1. [快速开始](#快速开始)
2. [Open Graph / Twitter Cards](#open-graph--twitter-cards)
3. [结构化数据 (Structured Data)](#结构化数据-structured-data)
4. [Sitemap 生成器](#sitemap-生成器)
5. [Semantic HTML 增强](#semantic-html-增强)
6. [最佳实践](#最佳实践)

---

## 🎯 快速开始

```typescript
import { 
  generateCompleteHead,
  enhanceSemanticStructure,
  generateTableOfContents,
} from 'magmark-2.0/seo';

// 定义文章元数据
const article = {
  headline: 'MagMark 2.0 SEO Guide',
  description: '完整的中英文混合排版与 SEO 优化解决方案',
  author: 'Jammy Fu',
  publishedTime: '2026-03-03T08:00:00Z',
  images: ['/images/cover.jpg'],
  tags: ['markdown', 'typography', 'seo'],
  category: 'Documentation'
};

// 生成完整的 HTML head 标签
const metaTags = generateCompleteHead(article, {
  baseUrl: 'https://your-site.com',
  title: 'MagMark 2.0 - 杂志级 Markdown 转换工具',
  canonicalUrl: 'https://your-site.com/guide/seo',
  index: true,
  follow: true,
});

// 注入到 HTML
console.log(`<!DOCTYPE html>\n<head>\n${metaTags}\n</head>`);
```

---

## 🌐 Open Graph / Twitter Cards

### 配置社交媒体卡片

```typescript
import { generateOpenGraphTags, generateTwitterTags } from 'magmark-2.0/seo';

// Open Graph (Facebook, LinkedIn, Slack 等)
const ogTags = generateOpenGraphTags(article, 'https://your-site.com');
ogTags.forEach(tag => console.log(tag));

// Twitter Cards
const twitterTags = generateTwitterTags(article, 'https://your-site.com');
twitterTags.forEach(tag => console.log(tag));
```

**输出示例**:

```html
<!-- Open Graph -->
<meta property="og:title" content="MagMark 2.0 SEO Guide" />
<meta property="og:description" content="完整的中英文混合排版..." />
<meta property="og:image" content="https://your-site.com/images/cover.jpg" />
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2026-03-03T08:00:00Z" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="MagMark 2.0 SEO Guide" />
<meta name="twitter:description" content="完整的中英文混合排版..." />
<meta name="twitter:image" content="https://your-site.com/images/cover.jpg" />
```

### 多图片支持

```typescript
const multipleImages = [
  '/images/cover.jpg',
  '/images/screenshot-1.png',
  '/images/screenshot-2.png',
];

multipleImages.forEach((img, idx) => ({
  property: `og:image${idx === 0 ? '' : `:${idx + 1}`}`,
  content: `https://your-site.com${img}`,
}));
```

---

## 🏗️ 结构化数据 (Structured Data)

### 文章类型 (Article Schema)

```typescript
import { generateArticleSchema } from 'magmark-2.0/seo';

const schema = generateArticleSchema({
  headline: '如何使用 MagMark 2.0',
  alternateName: ['How to Use MagMark', 'MagMark User Guide'],
  description: '从零开始掌握 MagMark 2.0 的所有功能',
  image: [
    'https://example.com/images/cover.jpg',
    'https://example.com/images/tutorial.png'
  ],
  author: {
    '@type': 'Person',
    name: 'Author Name',
    url: 'https://example.com/author',
    sameAs: ['https://twitter.com/author']
  },
  publisher: {
    '@type': 'Organization',
    name: 'Your Company',
    logo: {
      '@type': 'ImageObject',
      url: 'https://example.com/logo.png',
      width: 600,
      height: 60
    }
  },
  datePublished: '2026-03-03T08:00:00Z',
  dateModified: '2026-03-03T10:00:00Z',
  keywords: ['tutorial', 'magmark', 'guide'],
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://example.com/guide/how-to-use-magmark'
  }
});

console.log(schema);
```

**生成的 JSON-LD**:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "如何使用 MagMark 2.0",
  "alternateName": ["How to Use MagMark", "MagMark User Guide"],
  "description": "从零开始掌握...",
  "image": [...],
  "author": {...},
  "publisher": {...},
  "datePublished": "2026-03-03T08:00:00Z",
  ...
}
```

### FAQ Page Schema

适用于常见问题页面：

```typescript
import { generateFAQSchema } from 'magmark-2.0/seo';

const questions = [
  {
    questionName: 'MagMark 2.0 是什么？',
    acceptedAnswerText: 'MagMark 2.0 是一款将 Markdown 转换为杂志级排版的工具...'
  },
  {
    questionName: '如何导出为小红书格式？',
    acceptedAnswerText: '使用 exportXiaohongshu() 方法，指定尺寸和分辨率即可...'
  }
];

const faqSchema = generateFAQSchema(questions);
```

### HowTo Schema

教程类内容必备：

```typescript
import { generateHowToSchema } from 'magmark-2.0/seo';

const howTo = {
  totaltime: 'PT30M',  // 30 分钟
  steps: [
    {
      name: '安装 MagMark',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: '运行 npm install magmark-2.0'
        },
        {
          '@type': 'HowToTip',
          text: '建议使用 Node.js 18+ 版本'
        }
      ]
    },
    {
      name: '创建第一个文档',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: '编写 markdown 文件并使用 render() 方法转换'
        }
      ]
    }
  ]
};

const howToSchema = generateHowToSchema(howTo);
```

### Breadcrumb Schema

导航路径结构化：

```typescript
import { generateBreadcrumbSchema } from 'magmark-2.0/seo';

const breadcrumbs = [
  { name: '首页', item: 'https://example.com/', position: 1 },
  { name: '指南', item: 'https://example.com/guides/', position: 2 },
  { name: 'SEO 优化', item: 'https://example.com/guides/seo/', position: 3 },
];

const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
```

---

## 🗺️ Sitemap 生成器

### 自动生成 sitemap.xml

```typescript
import { generateSitemap, generateRobotsTxt } from 'magmark-2.0/seo';

const entries = [
  {
    loc: 'https://example.com/',
    lastmod: '2026-03-03',
    changefreq: 'daily',
    priority: 1.0
  },
  {
    loc: 'https://example.com/guides/seo',
    lastmod: '2026-03-03',
    changefreq: 'weekly',
    priority: 0.8
  },
  {
    loc: 'https://example.com/articles/magmark-intro',
    lastmod: '2026-03-01',
    changefreq: 'monthly',
    priority: 0.6
  }
];

const { xml: sitemapXML, files } = generateSitemap(entries, {
  baseUrl: 'https://example.com',
  includeImages: false
});

const robotsTxt = generateRobotsTxt(['https://example.com/sitemap.xml']);

console.log('Sitemap:\n', sitemapXML);
console.log('\nRobots.txt:\n', robotsTxt);
```

**Sitemap.xml 示例**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- more URLs... -->
</urlset>
```

**Robots.txt 示例**:

```txt
User-agent: *
Allow: /

# Search engine crawlers
Googlebot:
  Disallow: /api/
  Disallow: /admin/

Bingbot:
  Disallow: /api/
  Disallow: /admin/

# Sitemap locations
Sitemap: https://example.com/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
```

### 多文件 Sitemap 支持

当 URL 超过 50,000 条时自动分片：

```typescript
const largeSitemap = generateSitemap(hugeURLList, {
  baseUrl: 'https://example.com',
  maxURLsPerFile: 50000
});

// 返回多个文件
console.log(largeSitemap.files); // ['sitemap-1.xml', 'sitemap-2.xml', ...]
console.log(largeSitemap.index); // sitemap index XML
```

---

## 🔧 Semantic HTML 增强

### 自动添加语义标签

```typescript
import { enhanceSemanticStructure } from 'magmark-2.0/seo';

const rawHTML = `
<h1>文章标题</h1>
<p>正文内容...</p>
<h2>子章节</h2>
<p>更多文本...</p>
`;

const enhanced = enhanceSemanticStructure(rawHTML);

console.log(enhanced);
// 输出：
// <article itemscope itemtype="https://schema.org/Article">
//   <h1 itemprop="headline">文章标题</h1>
//   <p>正文内容...</p>
// </article>
// <section>
//   <h2>子章节</h2>
//   <p>更多文本...</p>
// </section>
```

### 生成 Table of Contents

根据 heading 自动生成目录：

```typescript
import { generateTableOfContents } from 'magmark-2.0/seo';

const headings = [
  { level: 2, text: '快速开始', id: 'quick-start' },
  { level: 2, text: '基本用法', id: 'basic-usage' },
  { level: 3, text: '安装依赖', id: 'install-dependencies' },
  { level: 3, text: '配置选项', id: 'configuration-options' },
  { level: 2, text: '高级功能', id: 'advanced-features' },
];

const toc = generateTableOfContents(headings);
console.log(toc);
```

### 建议图片 Alt 文本

```typescript
import { suggestImageAltText } from 'magmark-2.0/seo';

const altText = suggestImageAltText('/images/chart.png', '销售数据分析图表');
console.log(altText); // "chart 销售数据分析图表"
```

---

## ✅ 最佳实践

### 1. 完整的 Meta 标签组合

```typescript
const seoConfig = {
  // Open Graph
  ogTitle: '文章标题 - 副标题',
  ogDescription: '简明扼要的描述（120-160 字符）',
  ogImage: '/images/social-share.jpg',  // 1200x630px
  
  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterCreator: '@yourhandle',
  
  // Canonical
  canonicalUrl: 'https://yoursite.com/article/slug',
  
  // Robots
  robots: 'index, follow',
  
  // Structured Data
  schemaType: 'Article',  // or FAQPage, HowTo, etc.
};
```

### 2. 图片优化

- **封面图尺寸**: 1200×630px (社交分享)
- **缩略图尺寸**: 400×250px
- **Alt 文本**: 包含关键词描述
- **格式**: WebP (优先), JPEG/PNG (兼容)

### 3. 内容结构

```markdown
# H1 - 主标题 (仅一个)
## H2 - 主要章节
### H3 - 细分章节
#### H4 - 细节说明
```

### 4. Internal Links

在长文章中至少包含 3-5 个内部链接：

```markdown
- [相关指南 1](/guides/guide-1)
- [相关指南 2](/guides/guide-2)
- [API 文档](/api-reference)
```

### 5. Update Frequency

定期更新内容并保持 `dateModified` 字段：

```typescript
// 更新文章时
const updatedSchema = generateArticleSchema({
  ...originalData,
  dateModified: new Date().toISOString(),
});
```

---

## 🛠️ API Reference

### 核心函数

| 函数 | 用途 | 参数 | 返回 |
|------|------|------|------|
| `generateOpenGraphTags` | OG 标签 | `article`, `baseUrl` | `string[]` |
| `generateTwitterTags` | Twitter 卡片 | `article`, `baseUrl` | `string[]` |
| `generateCompleteHead` | 完整 head | `article`, `options` | `string` |
| `generateArticleSchema` | 文章 Schema | `data: ArticleSchema` | `string` |
| `generateFAQSchema` | FAQ Schema | `questions[]` | `string` |
| `generateHowToSchema` | 教程 Schema | `item: HowToItem` | `string` |
| `generateSitemap` | Sitemap XML | `entries[]`, `options` | `{xml, files, index?}` |
| `generateRobotsTxt` | Robots.txt | `sitemapURLs[]` | `string` |
| `enhanceSemanticStructure` | 增强 HTML | `html` | `string` |
| `generateTableOfContents` | 目录 | `headings[]` | `string` |
| `suggestImageAltText` | Alt 建议 | `src`, `context` | `string` |

### 完整示例

```typescript
import {
  generateCompleteHead,
  generateArticleSchema,
  generateSitemap,
  generateRobotsTxt,
  enhanceSemanticStructure,
} from 'magmark-2.0/seo';

// 1. 准备文章数据
const article = {
  headline: 'MagMark 2.0 完整指南',
  description: '一站式 Markdown 转换解决方案',
  author: 'Jammy Fu',
  publishedTime: '2026-03-03T08:00:00Z',
  images: ['/images/cover.jpg'],
  tags: ['seo', 'marketing', 'document'],
  category: 'Guide'
};

// 2. 生成 Head 标签
const headTags = generateCompleteHead(article, {
  baseUrl: 'https://example.com',
  canonicalUrl: 'https://example.com/guide/magmark-complete',
});

// 3. 生成 Schema
const schema = generateArticleSchema(article);

// 4. 组合 HTML
const fullHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  ${headTags}
  ${schema}
</head>
<body>
  <article itemscope itemtype="https://schema.org/Article">
    <h1 itemprop="headline">${article.headline}</h1>
    <div itemprop="articleBody">
      <!-- 文章内容 -->
    </div>
  </article>
</body>
</html>`;

// 5. 可选：生成 Sitemap
const { xml: sitemap } = generateSitemap([{
  loc: 'https://example.com/guide/magmark-complete',
  lastmod: '2026-03-03',
  changefreq: 'weekly',
  priority: 0.8
}], { baseUrl: 'https://example.com' });

console.log(fullHTML);
console.log(sitemap);
```

---

## 📚 延伸阅读

- [Google Search Central - SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org - Article Type](https://schema.org/Article)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

*最后更新：2026-03-03*

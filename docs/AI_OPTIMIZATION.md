# 🤖 MagMark 2.0 - AI 抓取与语义优化指南

本指南介绍如何让文档内容更易于 AI 爬虫理解，提升在 Google AI Overviews、ChatGPT、Perplexity 等 AI 搜索工具中的可见性。

---

## 📋 目录

1. [AI 搜索的工作原理](#ai 搜索的工作原理)
2. [Semantic HTML 最佳实践](#semantic-html-最佳实践)
3. [Entity-Based Markup](#entity-based-markup)
4. [Content Structure for AI](#content-structure-for-ai)
5. [Natural Language Optimization](#natural-language-optimization)
6. [FAQ Schema for Featured Snippets](#faq-schema-for-featured-snippets)

---

## 🤖 AI 搜索的工作原理

### 传统 SEO vs AI SEO

| 维度 | 传统 SEO | AI SEO (NLP) |
|------|----------|--------------|
| **关键词** | 密度匹配 | 语义理解 |
| **排名因素** | 反向链接 + 关键词 | 权威性 + 结构完整度 |
| **内容偏好** | 信息密集 | 回答式结构 |
| **用户意图** | 查询匹配 | 问题解决 |
| **排序依据** | PageRank | Trust + Relevance |

### AI 爬虫的关键指标

1. **结构化数据**: JSON-LD Schema.org 标记
2. **清晰层级**: H1→H6 标题树
3. **实体识别**: 人名、组织、地点、概念
4. **答案位置**: FAQ / HowTo schema 优先展示
5. **可信度**: 引用来源 + 作者信息

---

## 🏗️ Semantic HTML 最佳实践

### ✅ 正确：使用语义标签

```html
<!-- 推荐结构 -->
<article itemscope itemtype="https://schema.org/Article">
  <header>
    <h1 itemprop="headline">如何使用 MagMark 2.0</h1>
    <div itemprop="author" itemscope itemtype="https://schema.org/Person">
      <span itemprop="name">作者名</span>
      <time itemprop="datePublished" datetime="2026-03-03">2026-03-03</time>
    </div>
  </header>
  
  <aside class="toc">
    <!-- Table of Contents -->
  </aside>
  
  <section itemprop="articleBody">
    <h2>安装步骤</h2>
    <p>...</p>
    
    <h3>前提条件</h3>
    <ul>
      <li>Node.js 18+</li>
      <li>NPM 或 Yarn</li>
    </ul>
    
    <figure>
      <img src="/images/demo.png" alt="MagMark 操作界面">
      <figcaption>Fig 1: 界面概览</figcaption>
    </figure>
  </section>
  
  <footer>
    <nav aria-label="Related Articles">
      <a href="/guides/guide-2">相关教程</a>
    </nav>
  </footer>
</article>
```

### ❌ 错误：纯 div 布局

```html
<!-- 不推荐 - 缺乏语义 -->
<div class="article">
  <div class="title">如何使用 MagMark 2.0</div>
  <div class="meta">作者名 • 2026-03-03</div>
  <div class="content">
    <div class="heading">安装步骤</div>
    <p>...</p>
  </div>
</div>
```

### 核心语义元素

| 元素 | 用途 | Schema 映射 |
|------|------|------------|
| `<article>` | 独立内容块 | `Article` |
| `<section>` | 逻辑分组 | 无（辅助） |
| `<nav>` | 导航链接 | `BreadcrumbList` |
| `<aside>` | 侧边栏/补充信息 | `SupplementalArticle` |
| `<figure>` + `<figcaption>` | 图片说明 | `ImageObject` |
| `<time>` | 时间戳 | `datePublished`, `dateModified` |
| `<cite>` | 引用来源 | `citation` |

---

## 🎯 Entity-Based Markup

### 识别并标记关键实体

```typescript
import { suggestInternalLinks, enhanceSemanticStructure } from 'magmark-2.0/seo';

const content = `
本文介绍了 MagMark 2.0 的功能，由 Jammy Fu 编写，发布于 2026 年 3 月。
`;

// 自动识别实体
const enhanced = enhanceSemanticStructure(content);

// 输出将包含：
// - 产品名：MagMark 2.0 → Organization/Product type
// - 人名：Jammy Fu → Person type  
// - 时间：2026 年 3 月 → DateTime format
```

### 定义常见实体类型

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "name": "MagMark 2.0",
      "description": "杂志级 Markdown 转换工具",
      "brand": {
        "@type": "Brand",
        "name": "MagMark Team"
      }
    },
    {
      "@type": "Person",
      "name": "Jammy Fu",
      "jobTitle": "Founder",
      "sameAs": ["https://twitter.com/jammyfu"]
    },
    {
      "@type": "Organization",
      "name": "MagMark Team",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    }
  ]
}
```

---

## 📐 Content Structure for AI

### 理想的 AI 友好结构

```markdown
# H1 - 明确的问题/主题

## 简短摘要 (100-200 字)
直接回答核心问题，让 AI 快速提取关键信息。

---

## H2 - 主要章节

### H3 - 子主题
详细阐述，包含具体操作步骤或案例分析。

**关键要点**:
- 要点对 1
- 要点对 2
- 要点对 3

#### H4 - 深度细节
技术实现、代码示例、数据来源等。

##### H5 - 特殊场景
边缘情况处理、注意事项等。
```

### 答案优先原则

AI 搜索倾向于直接从文章开头提取答案。确保：

1. **第一段即答案**：不要铺垫，直接回应标题问题
2. **分段清晰**：每个段落一个核心观点
3. **列表优先**：用 bullet points 列举关键点
4. **加粗强调**：`**重要术语**`帮助 AI 识别关键概念

### 示例对比

#### ❌ 低效结构

```markdown
# 如何使用 MagMark

最近很多开发者问我如何高效排版，今天我们就来聊聊 MagMark 这个工具...
（长篇铺垫，500 字后才讲正题）
```

#### ✅ AI 友好结构

```markdown
# 如何使用 MagMark

**MagMark 是一款通过 Markdown 生成杂志级排版的工具，三步即可完成：**

1. 安装依赖：`npm install magmark-2.0`
2. 编写 markdown 文件
3. 运行转换命令

## 安装步骤

首先安装 Node.js 18+...
```

---

## 💬 Natural Language Optimization

### 问答式写法

AI 模型擅长捕捉问答对。采用以下格式：

```markdown
## 常见问题

### Q: MagMark 支持哪些导出格式？
A: MagMark 支持 PDF、PNG 长图、小红书轮播等多种格式，可通过配置选择不同分辨率和尺寸。

### Q: 如何设置中英文自动空格？
A: 在初始化时设置 `autoSpaceCjk: true` 即可启用 CJK 空格功能。
```

### 结构化数据配合

同时添加 FAQ Schema：

```typescript
import { generateFAQSchema } from 'magmark-2.0/seo';

const questions = [
  {
    questionName: 'MagMark 支持哪些导出格式？',
    acceptedAnswerText: 'MagMark 支持 PDF、PNG 长图、小红书轮播等多种格式...'
  },
  {
    questionName: '如何设置中英文自动空格？',
    acceptedAnswerText: '在初始化时设置 autoSpaceCjk: true...'
  }
];

console.log(generateFAQSchema(questions));
```

### 定义清晰的概念

避免模糊描述，使用**定义格式**：

```markdown
## 什么是基线网格 (Baseline Grid)?

**基线网格**是一种垂直对齐参考线系统，用于确保文本行在视觉上严格对齐。步长通常为 8px 或 4pt。

在 MagMark 中，您可以通过以下方式启用：

```tsx
<Editor showBaselineGrid={true} baselineStep={8} />
```
```

---

## ❓ FAQ Schema for Featured Snippets

### 完整 FAQ 页面模板

```typescript
import { 
  generateFAQSchema, 
  generateCompleteHead,
  generateArticleSchema
} from 'magmark-2.0/seo';

const articleData = {
  headline: 'MagMark 2.0 常见问题解答',
  description: '全面解答关于 MagMark 的所有问题',
  author: 'Jammy Fu',
  publishedTime: '2026-03-03T08:00:00Z',
  images: ['/images/faq-cover.jpg'],
  tags: ['faq', 'support', 'guide'],
  category: 'Documentation'
};

const faqs = [
  {
    questionName: 'MagMark 2.0 是什么？',
    acceptedAnswerText: 'MagMark 2.0 是一款将普通 Markdown 转换为杂志级排版的专业工具，支持中日韩文字体优化、多平台导出、实时预览等功能。'
  },
  {
    questionName: '如何开始使用？',
    acceptedAnswerText: '第一步：npm install magmark-2.0；第二步：编写 markdown；第三步：调用 exportPDF() 或 exportImages() 方法。'
  },
  {
    questionName: '是否支持中文排版？',
    acceptedAnswerText: '是的，MagMark 内置完整的 CJK 排版引擎，包括中英文自动空格、标点悬挂、换页控制等专业功能。'
  },
  // ... more FAQs
];

// 生成完整页面
const head = generateCompleteHead(articleData);
const articleSchema = generateArticleSchema(articleData);
const faqSchema = generateFAQSchema(faqs);

console.log(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  ${head}
  ${articleSchema}
  ${faqSchema}
</head>
<body>
  <article itemprop="articleBody">
    ${generateFAQPageContent(faqs)}
  </article>
</body>
</html>
`);
```

### FAQ 最佳实践

1. **问题简洁**：≤ 60 字符
2. **答案完整**：3-5 句详细说明
3. **避免嵌套**：一个问题一个答案
4. **更新频率**：定期添加新问题

---

## 🚀 进阶技巧

### 1. Internal Link Suggestions

```typescript
import { suggestInternalLinks } from 'magmark-2.0/seo';

const existingIds = new Set(['quick-start', 'installation']);
const links = suggestInternalLinks(content, existingIds);

console.log(links);
// 输出：['#/basic-usage', '#/configuration', '#/export']
```

### 2. Breadcrumb Navigation

```typescript
import { generateBreadcrumbSchema } from 'magmark-2.0/seo';

const breadcrumbs = [
  { name: '首页', item: 'https://example.com/', position: 1 },
  { name: '文档', item: 'https://example.com/docs/', position: 2 },
  { name: 'API 参考', item: 'https://example.com/docs/api/', position: 3 },
  { name: 'SEO 指南', item: 'https://example.com/docs/api/seo/', position: 4 },
];

console.log(generateBreadcrumbSchema(breadcrumbs));
```

### 3. Auto-generate TOC

```typescript
import { generateTableOfContents } from 'magmark-2.0/seo';

const headings = extractHeadings(markdown); // Your own parser
const toc = generateTableOfContents(headings);

// Insert at top of article
const fullHTML = `
<article>
  ${toc}
  <div>${renderMarkdown(markdown)}</div>
</article>
`;
```

---

## 📊 Performance Metrics

### AI 抓取质量检查清单

| 检查项 | 工具 | 目标值 |
|--------|------|--------|
| **Schema.org 完整性** | Google Rich Results Test | 100% pass |
| **标题层次** | Semrush / Ahrefs | H1-H6 顺序正确 |
| **内部链接数** | Screaming Frog | ≥ 5 per page |
| **FAQ 结构化数据** | Google Search Console | ≥ 3 Q&A pairs |
| **Alt 文本覆盖率** | Lighthouse | 100% images |
| **加载时间** | PageSpeed Insights | < 2s First Contentful Paint |

---

## 🔧 API Reference

### 核心函数

| 函数 | 参数 | 返回值 | 用途 |
|------|------|--------|------|
| `enhanceSemanticStructure` | `html: string` | `string` | 添加语义标签 |
| `suggestImageAltText` | `src, context` | `string` | 图片 alt 建议 |
| `suggestInternalLinks` | `content, ids` | `string[]` | 内部链接推荐 |
| `generateTableOfContents` | `headings[]` | `string` | 自动生成目录 |
| `generateBreadcrumbSchema` | `items[]` | `string` | 面包屑 Schema |
| `generateFAQSchema` | `questions[]` | `string` | FAQ 结构化数据 |
| `generateArticleSchema` | `data: ArticleSchema` | `string` | 文章 Schema |

### 完整工作流

```typescript
import * as seo from 'magmark-2.0/seo';

async function optimizeDocument(content: string): Promise<{
  html: string;
  schema: string;
  metaTags: string[];
}> {
  // 1. 解析元数据
  const metadata = extractMetadata(content);
  
  // 2. 增强语义 HTML
  const semanticHTML = seo.enhanceSemanticStructure(content);
  
  // 3. 生成目录
  const headings = extractHeadings(content);
  const toc = seo.generateTableOfContents(headings);
  
  // 4. 生成所有 Schema
  const articleSchema = seo.generateArticleSchema(metadata);
  const faqSchema = seo.generateFAQSchema(extractFAQs(content));
  
  // 5. 组合最终 HTML
  const optimizedHTML = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      ${seo.generateCompleteHead(metadata).join('\n')}
      ${articleSchema}
      ${faqSchema}
    </head>
    <body>
      <article itemscope itemtype="https://schema.org/Article">
        ${toc}
        ${semanticHTML}
      </article>
    </body>
    </html>
  `;
  
  return {
    html: optimizedHTML,
    schema: `${articleSchema}\n${faqSchema}`,
    metaTags: seo.generateCompleteHead(metadata),
  };
}
```

---

## 📚 资源

- [Google's Structured Data Guide](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Schema.org Type Hierarchy](https://schema.org/docs/types.html)
- [Natural Language Processing for SEO](https://moz.com/learn/seo/natural-language-search)
- [Featured Snippets Optimization](https://backlinko.com/featured-snippets)

---

*最后更新：2026-03-03*

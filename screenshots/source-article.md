# MagMark 2.0 - 专业杂志级 Markdown 转换器

**MagMark 2.0** 是一款革命性的文档转换工具，将普通 Markdown 转换为具有顶级杂志排版质量的出版级内容。

## 🚀 核心特性

### 1. 顶尖 Typography（字体排版）

- **精准行高控制**: 1.6-1.8 倍字高，默认 1.75
- **段落间距**: 字号的 1.5 倍
- **中英自动空格**: CJK 字符与英文间智能插入空格
- **标点悬挂**: 句号、逗号自动右悬挂 2px
- **孤行/寡行控制**: orphans/widows ≥ 2

### 2. 基线网格系统

```markdown
<!-- 启用基线网格 -->
<Editor showBaselineGrid={true} baselineStep={8} />
```

所有文本严格对齐 8px 基准线，确保垂直视觉一致性。

### 3. 多平台导出支持

| 平台 | 尺寸 | 用途 |
|------|------|------|
| **小红书** | 1080×1440px (3:4) | 信息流卡片 |
| **微信公众号** | 1080px 宽 | 长图推送 |
| **PDF** | A4/Letter + 出血 3mm | 打印出版 |
| **Web** | 响应式 | 博客展示 |

---

## 📖 使用说明

### 基本用法

```typescript
import { MagMark } from 'magmark-2.0';

const magmark = new MagMark({ platform: 'web' });

// 转换 Markdown
const html = await magmark.render(`
# Hello World

This is **magazine-quality** content.
`);
```

### 高级功能

#### 引用块样式

```markdown
> “设计不是看起来像什么，而是它如何工作。”  
> — Steve Jobs
```

#### 全宽图像

```markdown
![Cover Image](/images/cover.jpg)
<!-- full-bleed-image -->
```

#### 手动分页

```markdown
# Chapter 1

First chapter content...

---

# Chapter 2

Second chapter begins on new page...

<!-- page-break -->

# Appendix

Extra materials here...
```

---

## 🎨 Design Tokens

MagMark 使用统一的设计令牌系统：

```json
{
  "typography": {
    "lineHeight": 1.75,
    "maxCharsPerLine": 40,
    "minCharsPerLine": 15,
    "widowsOrphans": 2,
    "autoSpaceCjk": true
  },
  "platforms": {
    "xiaohongshu": {
      "primary": {"width": 1080, "height": 1440}
    }
  }
}
```

---

## 🔧 技术架构

### 解析层
- **Remark + Rehype AST**: 模块化插件系统
- **自定义节点**: `fullBleedImage`, `pullQuote`, `sidebar`, `pageBreak`

### 编辑层
- **Tiptap 2.x**: WYSIWYG + 源码双栏编辑器
- **ProseMirror**: 实时预览渲染

### 渲染层
- **Paged.js**: 印刷优先的分页引擎
- **JS Height Calculation**: 交互式拖拽调整

### 导出层
- **Typst**: <200ms PDF 生成速度
- **Playwright**: 300/600dpi 图像渲染

---

## ✅ 质量保证

- **50+ 视觉回归测试用例**覆盖各种场景
- **W3C 无障碍标准**符合性检查
- **SEO 友好**: Schema.org 结构化数据自动生成
- **AI 抓取优化**: Semantic HTML 增强

---

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing`)
5. 发起 Pull Request

---

**Made with ❤️ for beautiful publishing**

*版本 v2.0 | © 2026 MagMark Team | MIT License*

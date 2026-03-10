# 🚀 MagMark 1.5.0 - 5 分钟快速开始指南

本指南帮助你快速体验 MagMark 1.5.0 的精美排版效果。

---

## ⚡️ One-Click Visual Test (最快方式)

### macOS / Linux

**只需一条命令**:

```bash
open /Users/jammyfu/works/AI/Project/Magmark/screenshots/reference-render.html
```

或双击该 HTML 文件在浏览器中打开！

---

## 🎯 完整测试流程（推荐）

### Step 1: 查看可视化测试页面

打开预渲染的测试文档：

```bash
# 方法 A: 直接打开文件
open screenshots/reference-render.html

# 方法 B: 使用 HTTP server
cd scripts
python3 -m http.server 8080
# 访问：http://localhost:8080/visual-test.html
```

**你会看到什么？**
- 杂志级排版效果的 HTML 文档
- 精美的标题层级和段落间距
- CJK 自动空格处理示例
- 表格、引用块、代码高亮等组件展示
- Print styles（打印样式）预览

---

### Step 2: Chrome DevTools 调试

按 **F12** 打开开发者工具：

#### Elements 标签
检查 DOM 结构是否正确生成

#### Computed 标签
验证 CSS 计算值：
```css
/* 关键属性应该匹配 */
line-height: 24px          /* 14pt × 1.75 */
margin-bottom: 21px        /* 14pt × 1.5 */
font-size: 14pt            /* 正文字号 */
color: #1a1a1a             /* 主文本色 */
```

#### Console 标签
运行性能测试：
```javascript
// 测量渲染时间
console.time('render');
const html = await magmark.render(mdContent);
console.timeEnd('render'); // Should be < 100ms

// 检查所有段落的行高
document.querySelectorAll('p').forEach(p => {
  const lh = getComputedStyle(p).lineHeight;
  console.log(`Line height: ${lh}`);
});
```

---

### Step 3: 自动化截图捕获

运行预设的截图脚本：

```bash
cd /Users/jammyfu/works/AI/Project/Magmark
node scripts/capture-screenshot.js
```

**输出**:
```bash
screenshots/
├── reference-render.html  ← 参考 HTML
├── source-article.md      ← Markdown 源文件
└── visual-test-report.md  ← 测试报告
```

#### 手动截图步骤（可选）

如果需要特定视角：

1. **桌面视图** → DevTools → Screenshots → Full page screenshot
   - 文件名：`desktop-full-view.png`

2. **移动端视图** → Toggle device toolbar (Cmd+Shift+M)
   - 选择 iPhone 14 Pro (393×852)
   - 文件名：`mobile-iphone.png`

3. **打印预览** → Ctrl/Cmd + P
   - Enable "Background graphics"
   - Save as PDF
   - 文件名：`print-preview.pdf`

---

## 🧪 单元测试（进阶）

### 运行测试套件

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# SEO module tests (if exists)
node scripts/test-seo.js
```

---

## 🔧 本地开发设置

### 前置条件

```bash
# Node.js >= 18 (推荐 20 LTS)
node --version

# TypeScript compiler
npm install -g typescript tsx

# Typst CLI (用于 PDF 导出)
brew install typst
```

### 初始化项目

```bash
cd /Users/jammyfu/works/AI/Project/Magmark

# Install dependencies
npm install
```

### 启动开发服务器

```bash
# 使用 Vite 启动开发服务器
npm run dev

# 访问: http://localhost:5173 (默认端口)
```

---

## 📖 阅读详细文档

| 文档 | 内容 | 适合人群 |
|------|------|---------|
| **[TESTING_GUIDE.md](TESTING_GUIDE.md)** | 完整测试手册 | 测试人员 |
| **[docs/SEO.md](docs/SEO.md)** | SEO 优化指南 | 前端开发者 |
| **[docs/AI_OPTIMIZATION.md](docs/AI_OPTIMIZATION.md)** | AI 抓取优化 | SEO 专家 |
| **[README.md](README.md)** | 完整项目说明 | 所有用户 |

---

## ✅ 快速检查清单

测试完成后，确认以下项目：

- [ ] HTML 页面正常加载无错误
- [ ] 字体清晰可辨（衬线字体）
- [ ] 行高均匀舒适（约 1.75x 字号）
- [ ] 中英文间有空格（CJK spacing）
- [ ] 表格不溢出容器
- [ ] Code block 有语法高亮
- [ ] Blockquote 有特殊样式
- [ ] Print preview 格式正确
- [ ] Mobile view 响应流畅
- [ ] Lighthouse score ≥ 90

---

## 🐛 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| CSS 未加载 | 检查 `<link>` 标签中的路径是否正确 |
| 图片无法显示 | 使用绝对 URL 或 base64 编码 |
| 打印样式缺失 | 打印对话框中勾选 "Background graphics" |
| CJK 空格不正确 | 确保选项 `autoSpaceCjk: true` 已启用 |
| 行高不一致 | 检查内联元素是否有不同 font-size |
| 编译报错 | 确认 Node.js >= 18 且依赖完整安装 |

---

## 📊 性能基准

期望的渲染性能指标：

- **HTML Generation**: < 50ms per document
- **Page Render**: < 100ms per viewport
- **Image Export**: 200ms per image (Typst)
- **PDF Export**: < 200ms per page
- **Accessibility**: WCAG AA compliant

---

## 🚀 下一步

完成基本测试后，你可以：

1. **深入自定义**: 修改 `design-tokens/` 下的配置调整样式
2. **扩展功能**: 添加新的 Remark/Rehype plugins
3. **集成项目**: 将 MagMark 1.5.0 嵌入你的应用中
4. **贡献代码**: Fork 仓库并提交 PR

对于高级定制和 API 用法，请阅读 **[README.md](README.md)** 的 API Reference 部分。

---

**Happy Testing! 🎨✨**

*Last Updated: 2026-03-10*

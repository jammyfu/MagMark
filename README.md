# MagMark 1.5.0 🎨✨

**世界级杂志级 Markdown 排版引擎 — CJK 高精度排印版**

将您的 Markdown 转换为具备专业字体排版、智能分页和高精度导出的出版级文档。MagMark 1.5 引入 Han.css + Paged.js + Vivliostyle CSS 三层排版增强，带来媲美《VOGUE》等高端纸媒的中文视觉体验。

[![版本](https://img.shields.io/badge/version-1.5.0-gold.svg)](https://github.com/jammyfu/MagMark)
[![许可](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🏷️ 为什么叫 MagMark？

**MagMark** 是由两个核心概念组合而成的：

- **Mag** (取自 **Magazine**)：打破 Markdown 预览"简陋"的印象，赋予文字具有现代杂志感的排版美学。
- **Mark** (取自 **Markdown**)：坚持轻量级、纯文本的创作体验，让您专注于内容。

**MagMark = 像写 Markdown 一样简单，像做杂志一样精美。**

---

## 🆕 1.5.0 核心升级：三层 CJK 排版增强

### 1. 🈶 Han.css — 汉字高精度排印

集成 [Han.css v3](https://hanzi.pro/) 开源排版框架，对预览内容进行深度 CJK 处理：

- **汉字↔拉丁字间距**：自动在中文与英文/数字之间插入 1/4 em 间距，告别"中英文混排拥挤感"。
- **标点宽度压缩**：句号、逗号、顿号等全角标点不再占据完整字宽，版面更紧凑匀称。
- **引号悬挂**：「」『』等 CJK 引号正确向行首/行末悬挂，实现光学对齐。
- **OpenType 字距**：启用 `kern`、`liga`、`calt`、`locl` 特性，在支持的字体（如思源宋体）上实现亚像素级字距微调。

### 2. 🖨 Paged.js — CSS Paged Media 打印预览

新增"🖨 打印预览"按钮，在独立弹出窗口中加载 [Paged.js](https://pagedjs.org/) polyfill：

- **`@page` 规则完整支持**：A4 页面边距 22mm/18mm/28mm，首页特殊处理，左右页面交替内侧边距（适合装订）。
- **CSS 页脚页码**：`@bottom-center` 自动注入 `PAGE n / total` 样式页码。
- **全主题继承**：自动读取编辑器当前主题色变量，打印预览与编辑器视觉完全一致。
- **打印预览同时启用 Han.css**：Paged.js 分页完成后触发 Han.js 排印处理，中文输出质量达到印刷标准。

### 3. 📐 Vivliostyle CSS — 孤行寡行 & 分页规则

采用 [Vivliostyle](https://vivliostyle.org/) 排版标准中的 CSS 分页规则：

- **孤行/寡行控制**：`orphans: 3; widows: 3` 防止段落首行或末行孤立在页底/页顶。
- **标题防分页**：`break-after: avoid` 确保标题后至少跟随一段正文，不出现"标题挂在页尾"的情况。
- **代码块/表格完整性**：`break-inside: avoid` 防止代码块和表格在中间被分页打断。
- **`@media print`**：浏览器原生打印时自动隐藏编辑器 UI，仅输出页面内容，`print-color-adjust: exact` 保证主题背景色正确打印。

### 4. 🔧 word-break 关键修复

修复了原版中错误的 `word-break: break-all` 设置（该值会将英文单词在任意字符处强制折断）：

| | 修改前 | 修改后 |
|---|---|---|
| `word-break` | `break-all` ❌ | `normal` ✅ |
| 溢出处理 | — | `overflow-wrap: break-word` ✅ |
| CJK 禁则 | — | `line-break: strict` ✅ |
| 行末标点悬挂 | `first last` | `first last` ✅ |

---

## 🚀 1.4 核心功能（继承）

### 🎞️ 高精度 Canvas 导出
直接采用 **3× 超采样**，输出 600DPI 级别超清 PNG，字体嵌入完美，所见即所得。

### 🖱️ 块级点击浮动微调
点击任何段落，立即激活浮动工具栏，支持 Shift 点击与拖拽框选多块同步调整字号、行高、字间距。

### 🎨 11 套专业主题
覆盖从东方金石到北欧极简的全系列风格，主题色自动传递至打印预览和导出。

### 📄 智能分页控制
手动/自动分页、单页独立样式、50%～150% 自由缩放预览。

---

## ✨ 完整特性列表

| 特性 | 说明 |
|---|---|
| Han.css CJK 排印 | 字间距、标点压缩、引号悬挂 |
| Paged.js 打印预览 | @page 规则、页码、装订边距 |
| Vivliostyle CSS 分页 | 孤行/寡行控制、标题防分页 |
| word-break 修正 | 正确处理中英文混排换行 |
| 3× PNG 导出 | 全页/当页高精度导出 |
| 11 套主题 | 一键切换，打印预览同步 |
| 块级浮动微调 | 点击/框选块，独立调整排版 |
| 手动分页 | `---` 作为精确分页符 |
| 小红书格式 | 1080×1440 竖版原尺寸 |
| A4 / 移动 / 桌面 | 多格式自适应排版 |

---

## 🚀 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:5173/` 开启排版之旅。

### 使用打印预览

1. 在编辑器中输入 Markdown 内容
2. 点击右上角 **🖨 打印预览** 按钮
3. 新窗口中 Paged.js 自动分页，Han.css 完成 CJK 排印
4. 使用浏览器 `Ctrl+P` / `Cmd+P` 打印或另存为 PDF

---

## 📁 项目结构

```bash
magmark/
├── editor.ts          # 核心逻辑：分页引擎、Han.js 初始化、打印预览生成
├── editor.css         # 样式系统：Han.css 集成、@page 规则、@media print
├── index.html         # UI 框架：引入 Han.css CDN、打印预览按钮
├── src/
│   ├── core/          # 状态管理
│   └── engine/        # 分页引擎
└── README.md
```

---

## 🔗 技术栈

- [Han.css](https://hanzi.pro/) — CJK 汉字排版框架
- [Paged.js](https://pagedjs.org/) — CSS Paged Media polyfill
- [Vivliostyle](https://vivliostyle.org/) — CSS 分页排版标准
- [html-to-image](https://github.com/bubkoo/html-to-image) — 高精度 PNG 导出
- [Vite](https://vitejs.dev/) + TypeScript

---

## 📄 许可证

基于 MIT 协议发布。详见 [LICENSE](LICENSE)。

---

**为追求极致排版美学的创作者而生 ❤️**

*最近更新：2026-03-10 · v1.5.0*

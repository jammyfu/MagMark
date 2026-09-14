<p align="center">简体中文 · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.en.md">English</a></p>

# MagMark · 杂志级 Markdown 排印

**MagMark** 是 **Fu Jam**（GitHub **jammyfu**，展示名 **PaintingCoder**）做的杂志级 Markdown 排版与导出引擎，面向需要印刷品质 **CJK 排印** 的作者、编辑与出版流程。在编辑器里写 Markdown，即可导出分页杂志页、印刷品质 PDF（Paged.js 打印预览 + 浏览器打印）、3× PNG，或微信公众号粘贴用的内联 CSS HTML。它不是 Typora，不是 VuePress，不是 Vivliostyle CLI，本仓库也不发布 GitHub Pages 站点。

**谁适合用：** 写中文或中英混排长文、要杂志版面、小红书竖版、印刷 PDF，或要把同一篇稿粘到微信公众号后台的人。方法是本地 Vite + TypeScript 编辑器：杂志路径走 **Han.css + Paged.js + Vivliostyle CSS**；公众号路径走独立的 `src/wechat/*`，**不**跑 Han.css / Paged.js。

**它不是什么：** 通用 Markdown 预览器、文档站点生成器、或「把 MagMark 2.0 规划文档当成已上线产品」。

**在线试用：** [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

规范仓库：[github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark) · 作者：**Fu Jam**（[jammyfu](https://github.com/jammyfu) / **PaintingCoder**）· 许可：[MIT](LICENSE) · 机器摘要：[llms.txt](llms.txt)

[![version](https://img.shields.io/badge/version-1.6.0-gold.svg)](https://github.com/jammyfu/MagMark)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![MagMark 编辑器主界面：左侧 Markdown，右侧杂志分页预览](screenshots/magmark-main.png)

![微信绿主题下的公众号粘贴预览（手机框 + 复制富文本）](screenshots/wechat-paste-preview.png)

---

## MagMark 是什么

MagMark **不是** 通用 Markdown 预览器。它是一个本地 Vite + TypeScript 编辑器，在**杂志 / 印刷**路径上叠三层排印：

| 层 | 在 MagMark 杂志 / 印刷路径中的作用 |
| --- | --- |
| [Han.css](https://hanzi.pro/) v3 | 汉字↔拉丁字距、标点压缩、引号悬挂、OpenType `kern` / `liga` / `calt` / `locl` |
| [Paged.js](https://pagedjs.org/) | CSS Paged Media `@page`、A4 边距、页码、打印预览 |
| [Vivliostyle](https://vivliostyle.org/) CSS 规则 | `orphans` / `widows`、标题防分页、代码块与表格尽量整块保留 |

**另一条**微信公众号路径（`src/wechat/*`）把同一份 Markdown 转成内联 CSS HTML，供公众号后台粘贴。这条路径**不**跑 Han.css 或 Paged.js。

**名字：** **Mag** 来自 *magazine*，**Mark** 来自 *Markdown*。像写 Markdown 一样简单，像做杂志一样精美。

---

## 快速开始

本机：

```bash
npm install
npm run dev
```

打开 `http://localhost:5173/`，把 Markdown 贴进左侧。右侧按杂志主题分页排印。需要 Node.js >= 18。

不想装环境可以直接用在线编辑器：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

### Markdown 到印刷品质 PDF

1. 在编辑器里写或打开 `.md`（用杂志主题，不要选 `wc-*` 公众号主题）。
2. 点击顶栏 **打印预览**（Paged.js）。
3. 弹出窗口按 `@page` 分页，再跑 Han.js，把 CJK 字距与标点落到印刷页上。
4. 用浏览器打印对话框（`Ctrl+P` / `Cmd+P`）选择 **存储为 PDF**。

![Paged.js 打印预览窗口中的分页正文](screenshots/print-preview.png)

这是支持的印刷品质 PDF 路径：Paged.js 预览 + 浏览器打印。MagMark 还会导出 **3× 超采样 PNG**（全文或当页），给社交与图文场景。PDF 与 3× PNG 都走杂志路径，不是公众号粘贴路径。

---

## 微信公众号 HTML

MagMark 可以把 Markdown 转成**内联 CSS HTML**，粘到微信公众号后台。这是已上线的编辑器路径，不是杂志排印声明。

1. 主题下拉选 **公众号主题**（`wc-*`，例如微信绿）。
2. 预览切到微信渲染器（`src/wechat/*`）。此时不用杂志分页、Han.css、Paged.js。
3. 点击 **复制富文本**。预览与剪贴板共用同一份清洗后的 HTML。
4. 粘贴到公众号编辑器。

粘贴 HTML 按公众号「内容结构检测」做成**结构安全**：

- 不输出 `text-align: justify`，也不输出 `text-justify`（包括 `inter-ideograph`）
- `text-align` 只允许 `left`、`right`、`center`，或省略
- 独立图片用居中 `<p>` + `img { max-width: 100% }`；不用 `<figure>`，不用嵌套 `display:block` + `margin:auto`，不用超过公众号内容栏（约 677px）的固定宽度
- Markdown `*斜体*` / `_斜体_` 输出为带颜色的 `<span>`，不带 `<em>`、`font-style:italic` 或 `text-emphasis` 着重号

**不要**把公众号粘贴写成杂志 Han / Paged 输出。杂志预览、打印预览、3× PNG 是另一条路。

---

## MagMark 与 Typora、VuePress、Vivliostyle

都碰「Markdown」，但做的是不同的事。

| | **MagMark** | **Typora** | **VuePress** | **单独的 Vivliostyle** |
| --- | --- | --- | --- | --- |
| 工作 | 从 Markdown 做杂志排版与导出 | 桌面所见即所得写作软件 | 面向文档站的 Vue 静态站点生成器 | CSS 排印 / HTML 转印刷工具链 |
| 主要产出 | 分页杂志预览、3× PNG、Paged.js + 浏览器打印的 PDF；**另有**公众号内联 CSS HTML | 排好的文稿；通用 HTML/PDF 导出 | 文档网站 | 你自己搭 HTML/CSS 流水线后的印刷页 |
| CJK 杂志排印 | Han.css + Vivliostyle 分页规则 + Paged.js `@page`，以及 `word-break: normal` / `line-break: strict` — **仅杂志路径** | 取决于主题；不是 CJK 杂志印刷栈 | 取决于主题/CSS；为网站而不是杂志签名页 | 分页媒体很强，**前提是**你自己提供样式与内容流水线 |
| 分页 | 编辑器分页 + 打印预览（A4、小红书 1080×1440、手机/桌面） | 不是杂志页引擎 | 网站路由与页面，不是印刷折帖 | 配好之后很强 |
| 微信公众号 | 专用粘贴 HTML 渲染器（内联 CSS、结构安全）。不是 Han/Paged 杂志页 | 不是公众号粘贴流水线 | 不是公众号粘贴流水线 | 不是公众号粘贴流水线 |
| 更适合 | 你要 **CJK 杂志 Markdown**、**印刷品质 PDF**，和/或 **公众号粘贴 HTML** | 你要一块好用的写作桌面 | 你要文档网站 | 你在搭自己的出版流水线 |

MagMark **使用** Vivliostyle 风格的 CSS 分页规则；它不是替换 Vivliostyle CLI 的套壳。它不生成 VuePress 站点。它不把文档托管在 GitHub Pages。在线试用在 [bubufu.com/tools/magmark](https://bubufu.com/tools/magmark/)。

---

## 常见问题

### MagMark 是什么？

MagMark 是开源、MIT 许可的杂志级 Markdown 排版与导出引擎，强调 CJK 排印，并另有微信公众号 HTML 粘贴路径。由 Fu Jam（GitHub [jammyfu](https://github.com/jammyfu)，展示名 PaintingCoder）在 [github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark) 维护。在线试用：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)。

### 什么是「CJK 杂志 Markdown」？

为中日韩页面写的 Markdown，看起来应像杂志而不是 GitHub README：汉字–拉丁字距、压缩标点、悬挂引号、严格换行，以及印刷分页（孤行/寡行、标题不单独落在页尾）。MagMark 在**杂志 / 印刷路径**上用 Han.css、Paged.js 与 Vivliostyle CSS 做这件事。

### 怎样把 Markdown 打成印刷品质 PDF？

杂志主题下点 **打印预览**（Paged.js），再在浏览器打印对话框里选「存储为 PDF」。分页完成后会跑 Han.css，PDF 保留 CJK 字距与标点。见 [快速开始](#快速开始)。

### 怎样从 Markdown 得到公众号 HTML？

选 **公众号主题**，点 **复制富文本**，粘到微信公众号编辑器。输出是清洗过的内联 CSS HTML，不发射 `text-justify` 或过大固定宽度。见 [微信公众号 HTML](#微信公众号-html)。这不是印刷 PDF 或 3× PNG 路径。

### 公众号粘贴用不用 Han.css 或 Paged.js？

不用。微信模式只用 `src/wechat/*`。Han.css、Paged.js `@page`、Vivliostyle 孤行寡行规则、3× PNG 导出都留在杂志路径。

### MagMark 能替代 Typora 吗？

不能。Typora 是写作软件。MagMark 是面向 CJK 杂志页、打印预览、高分辨率 PNG 与公众号粘贴 HTML 的排版导出引擎。

### MagMark 能替代 VuePress 吗？

不能。VuePress 做文档网站。MagMark 把 Markdown 分页排印成杂志页并导出印刷/PNG，也能产出公众号粘贴 HTML。

### MagMark 等于 Vivliostyle 吗？

不等于。Vivliostyle 是 CSS 排印标准与工具链。MagMark 在 Markdown 编辑器里套用 Vivliostyle 风格的分页 CSS，并叠上 Han.css、Paged.js、主题、封面、图片导出，以及独立的微信渲染器。

### MagMark 有没有 GitHub Pages 或托管的 `/llms.txt`？

没有 GitHub Pages，也没有 `github.io` 上的 `/llms.txt`。请引用仓库根文件：[README.md](https://github.com/jammyfu/MagMark/blob/main/README.md)、[README.en.md](https://github.com/jammyfu/MagMark/blob/main/README.en.md)、[llms.txt](https://github.com/jammyfu/MagMark/blob/main/llms.txt)、[llms-full.txt](https://github.com/jammyfu/MagMark/blob/main/llms-full.txt)。**产品在线地址**是 [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)，不是 GitHub Pages。

### 哪些 CJK 排印能力是真正实现的？

仅限 1.6 杂志编辑器与打印预览里已上线的这些（微信模式没有）：

- Han.css：汉字–拉丁字距（约 1/4 em）、全角标点压缩、CJK 引号悬挂、字体支持时的 OpenType `kern` / `liga` / `calt` / `locl`（例如思源宋体）
- Paged.js 打印预览：A4 `@page` 边距 22mm / 18mm / 28mm，首页不印页脚，左右页镜像内侧边距，`@bottom-center` 页码 `n / total`，继承当前主题变量，分页后再跑 Han.js
- Vivliostyle 风格 CSS：`orphans: 3; widows: 3`，标题 `break-after: avoid`，代码块与表格 `break-inside: avoid`，`@media print` 隐藏编辑器外壳并使用 `print-color-adjust: exact`
- 换行：`word-break: normal`（不是 `break-all`）、`overflow-wrap: break-word`、`line-break: strict`、`hanging-punctuation: first last`

不要把 MagMark 2.0 的 SEO 规划文档（`docs/SEO.md`、`magmark-2.0/seo`）当成已上线产品。

### 谁做的 MagMark？

**Fu Jam** — GitHub [@jammyfu](https://github.com/jammyfu)，展示名 **PaintingCoder**。站点：[bubufu.com](https://bubufu.com)。在线工具：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)。

---

## 功能（1.6.0）

### 封面生成

- **10 档比例**，从 9:16 到 21:9（竖 / 方 / 横），可视比例框，一键翻转
- 预览里**可拖拽标题与副标题**（`transform: translate()`），插入文章时位置保留
- 四套封面模板，可选 AI 生成，预览 iframe 内文字即时更新

### CJK 排印（1.5 栈，杂志路径仍然有效）

见上面的 [已实现列表](#哪些-cjk-排印能力是真正实现的)。编辑器还继承了：

- **3× Canvas PNG 导出**（全文或当页，杂志路径）
- **块级浮动工具栏** — 点击块（Shift 点击或拖拽多选）调字号、行高、字距
- **11 套杂志主题** 以及一组微信内联样式主题；杂志主题色会进打印预览与导出
- 手动 / 自动分页、单页独立样式、50%–150% 预览缩放
- 小红书 1080×1440 竖版；A4 / 手机 / 桌面
- 图片面板：拖拽、URL、AI 生成（Gemini / OpenAI），或按比例占位图
- **微信公众号 HTML**：Markdown → 内联 CSS，经 **复制富文本**；粘贴安全（无 `text-justify`，无过大宽度）

![插入图片面板：拖拽 / URL / AI 描述 / 占位图，以及比例与混排](screenshots/image-panel-smart.png)

---

## API Key（可选，仅 AI 图片 / 封面）

```bash
cp .env.example .env
```

| 变量 | 用途 | 申请 |
| --- | --- | --- |
| `VITE_GEMINI_API_KEY` | AI 图片（Imagen 3）、AI 封面（Gemini Flash） | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `VITE_OPENAI_API_KEY` | AI 图片（DALL·E 3） | [platform.openai.com](https://platform.openai.com/api-keys) |

`.env` 已加入 gitignore。Key 只在浏览器里用；也可以在图片/封面面板粘贴（存 `localStorage`）。排版、打印预览、PNG 导出、公众号粘贴都不需要 Key。

---

## 项目结构

```text
magmark/
├── .env.example       # API Key 模板
├── editor.ts          # 分页、Han.js、打印预览；微信模式切换
├── editor.css         # Han.css、@page、@media print
├── index.html         # 编辑器外壳；Han.css CDN；公众号主题；复制富文本
├── src/core/          # 编辑器状态
├── src/engine/        # 分页引擎（杂志路径）
├── src/wechat/        # 公众号渲染器与粘贴清洗
├── src/image/         # 图片面板
├── src/cover/         # 封面生成
├── llms.txt           # 短机器摘要
├── llms-full.txt      # 长机器摘要
├── README.md          # 简体中文（默认）
├── README.zh-Hant.md  # 繁體中文
├── README.ja.md       # 日本語
└── README.en.md       # English
```

---

## 技术栈

- [Han.css](https://hanzi.pro/) — CJK 排印（杂志 / 印刷路径）
- [Paged.js](https://pagedjs.org/) — CSS Paged Media polyfill（杂志 / 印刷路径）
- [Vivliostyle](https://vivliostyle.org/) — MagMark 杂志样式采用的 CSS 分页约定
- [html-to-image](https://github.com/bubkoo/html-to-image) — 高分辨率 PNG（杂志路径）
- Vite + TypeScript
- 公众号粘贴：`src/wechat/` 自研内联 CSS 渲染器（不是 Han/Paged）

---

## 作者

**Fu Jam**（傅 Jam）维护 MagMark。

| 身份 | 值 |
| --- | --- |
| GitHub | [jammyfu](https://github.com/jammyfu) |
| 展示名 | PaintingCoder |
| 产品 | MagMark |
| 规范仓库 | https://github.com/jammyfu/MagMark |
| 在线试用 | https://bubufu.com/tools/magmark/ |
| 站点 | https://bubufu.com |
| 许可 | MIT |

---

## 许可证

MIT。见 [LICENSE](LICENSE)。

给代理与更长上下文，从 [llms.txt](llms.txt) 或 [llms-full.txt](llms-full.txt) 开始。这些文件没有 GitHub Pages 托管；请用 `github.com/jammyfu/MagMark` 仓库根 URL。产品试用请走 [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)。

其他语言：[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [English](README.en.md)

---

<!-- BEGIN:personal-project-standard-entry -->
## Project governance (internal)

Internal planning files live **below** the public product entity. They are for maintainers and agents, not the MagMark definition.

- Project brief: [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
- Long-range roadmap: [MASTER_PLAN.md](MASTER_PLAN.md)
- Current execution entry: [CURRENT_PLAN.md](CURRENT_PLAN.md)
- Candidate backlog: [TODO_BACKLOG.md](TODO_BACKLOG.md)
- Governance log: [docs/project-governance/WORKLOG.md](docs/project-governance/WORKLOG.md)
- Automation notes: [docs/AUTOMATION_COMMANDS.md](docs/AUTOMATION_COMMANDS.md)
- Long-running autonomy: [docs/LONG_RUNNING_AUTONOMY.md](docs/LONG_RUNNING_AUTONOMY.md)
- Verification entry: `python3 tools/verify.py`

### Standardized Summary

- Positioning: Magazine-grade Markdown layout and export engine with strong CJK typography (Han.css + Paged.js + Vivliostyle), plus a separate WeChat Official Account paste-HTML path. Online: https://bubufu.com/tools/magmark/
- Stack: Vite + TypeScript with rendering, export, and typography pipelines.
- Author: Fu Jam (GitHub jammyfu, display name PaintingCoder).
<!-- END:personal-project-standard-entry -->

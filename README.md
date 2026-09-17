<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/magmark-folio-white.svg">
    <img src="public/brand/magmark-folio.svg" width="80" height="80" alt="MagMark · Folio 折页标志">
  </picture>
</p>

<h1 align="center">MagMark</h1>
<p align="center">写 Markdown，让版面像杂志。</p>
<p align="center">简体中文 · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a></p>

MagMark 是面向中文与中英混排的 Markdown 编辑、排版与导出工具。你在左侧写原文，在右侧调整版面，再把同一篇内容带到杂志页、PDF、长图或微信公众号。

它关注的不是再做一个 Markdown 预览框，而是**从写完一篇文章，到得到一份可交付的版面**：字距、标点、分页、图片位置和输出方式，都应该有明确的控制与反馈。

> **当前分支：2.0.0-beta.1**  
> 这是 `codex/2.0.0-beta` 测试分支，不是已发布的稳定版。`main` 保持 1.6.0；[在线编辑器](https://bubufu.com/tools/magmark/)不代表本分支已经部署。重要稿件请另外保存 Markdown 原文件。

[开始使用](#开始使用) · [功能与工作流](#功能与工作流) · [导出说明](#导出说明) · [已知边界](#已知边界) · [开发与贡献](#开发与贡献)

## 适合用来做什么

把中文长文排成更易读的文章；把图文稿组织成分页杂志或打印版；把同一份 Markdown 转成公众号可粘贴的富文本；为不同媒体制作封面与图片版本。

MagMark 不提供文档托管、多人实时协作或自动发布。它也不把“导出了一段 HTML”等同于“内容已在目标平台发布成功”。

## 开始使用

### 直接体验

打开[在线编辑器](https://bubufu.com/tools/magmark/)可以体验已部署版本。要检查 **2.0 beta 的新界面和行为**，请在本地运行本分支：

```bash
git clone --branch codex/2.0.0-beta --single-branch https://github.com/jammyfu/MagMark.git
cd MagMark
npm ci
npm run dev
```

打开终端提示的本地地址。默认端口为 `5173`；端口被占用时，以 Vite 实际输出为准。建议使用与仓库 CI 一致的 **Node.js 22**。

### 第一篇文章

1. 粘贴 Markdown，或从 **文件 → 打开 Markdown** 载入 `.md` 文件。文章附带本地图片时，可导入文章目录或关联图片目录。
2. 在 **写作 / 对照 / 预览** 之间切换。打开 **排版**，选择文章风格、页面格式、字号与行距；工作区明暗外观与文章主题分别控制。
3. 检查分页、图片和正文后，打开 **导出**。选择 PNG、打印 / PDF 预览，或复制适合目标编辑器的富文本。

**保存 Markdown 与导出版面是两件事。** 保存原文便于继续编辑；PNG、PDF 和复制出的富文本是面向阅读或发布的输出。

## 功能与工作流

| 工作环节 | Beta 已接入的能力 | 使用时需要知道 |
| --- | --- | --- |
| 写原文 | CodeMirror 编辑、撤销 / 重做、Markdown 文件导入与保存 | 不自动重写整篇原文；增强编辑器异常时保留基础文本编辑 |
| 看版面 | 写作、对照、预览三种视图；可拖动分栏；预览缩放 | 窄屏使用单栏；缩放预览不等于修改文章字号 |
| 调排印 | 中文与中英混排、文章主题、字号 / 行高 / 字距、分页与长文 | 具体呈现仍受字体、内容结构与输出路径影响 |
| 改内容 | 支持部分预览文本双击回到对应原文进行编辑 | 无法可靠定位或原文已变化时拒绝修改，不猜测目标段落 |
| 管图片 | 本地图片目录、图片插入与替换、说明文字、对齐与宽度 | 外部图片能否导出，取决于加载与跨域条件 |
| 做封面 | 模板、文字位置、媒体比例、多个输出版本、当前版本 PNG | 封面面板中的版本状态尚未纳入草稿历史 |
| 防丢稿 | 浏览器本地自动保存、有界历史快照与恢复 | 不是云备份；清理浏览器数据或存储不可用时仍可能丢失 |
| 输出 | 当前页 / 全部页 PNG、打印预览、PDF、公众号与通用富文本 | 预览处理中或检测到页面溢出时，相关输出会被阻止并提示 |

### 排版与输出，不混为一条路

**杂志 / 打印路径**使用 Han.css、Paged.js 与 CSS 分页规则，处理汉字与拉丁字符间距、部分标点行为、页边距、页码和分页约束。孤行、寡行以及整块内容的保留属于排版策略，不代表所有复杂稿件都能自动达到印刷验收标准。

**公众号路径**使用独立的渲染与 HTML 清洗逻辑，生成内联样式富文本。它不运行杂志路径的 Han.css / Paged.js，也不承诺与 PDF 逐像素相同。

### 统一但克制的界面

品牌采用 **Folio 折页标志**；功能图标采用固定版本的 **Lucide SVG 子集**。写作、对照、图片、排版、复制、下载与打印使用各自对应的图标，关键操作保留中文标签。图标随工作区明暗外观变化，不改变文章颜色，也不进入导出正文。

图标在仓库内随应用打包，不从运行时 CDN 加载，不依赖整套图标字体。来源、许可与功能映射见 [品牌与图标说明](docs/brand/README.md)。

## 导出说明

### PNG：用于图文分发

在杂志视图选择 **当前页 PNG** 或 **全部页 PNG**。当前实现使用 3× 超采样输出；最终尺寸随页面格式与内容而变化。先检查页面是否溢出，再确认浏览器实际保存的文件。

### PDF：用于打印与阅读

选择杂志主题，打开 **打印 / PDF 预览**。等预览中的分页和字体加载完成后，在浏览器打印对话框中选择“存储为 PDF”。这是当前可用的 PDF 路径，不是独立的服务端 PDF 接口。

### 微信公众号：复制后仍需验收

选择公众号主题，预览样式后使用 **复制公众号富文本**，再粘贴到公众号编辑器。已成功读取的本地图片可以随复制内容处理，但**目标平台是否接收图片、保存后是否保留，必须在公众号中复核**。MagMark 不会登录公众号或替你发布。

也可以使用“复制到 Word 等编辑器”带走当前排版；不同编辑器对 HTML 与样式的支持不完全相同。

## 数据、网络与隐私

编辑与草稿历史主要在浏览器中完成，导入图片目录不会由目录导入功能自动上传。但“本地优先”**不等于完全离线**：当前入口会加载外部字体与 Han.css 资源，文章中的远程图片也会产生网络请求。

图片与封面面板保留可选的 AI 生成入口。只有使用这些入口时才需要配置相应服务；请求可能包含描述文字或其他生成所需内容。API Key 偏好可能存储在当前浏览器中，不要在不可信共享设备上保存密钥。

请定期下载 Markdown 原文。浏览器存储不是唯一副本，也不是跨设备同步服务。

## 已知边界

- **仍是 beta。** 跨浏览器、真实系统中文输入法、移动 WebView、慢字体 / 慢图片及真实公众号粘贴后保存，仍需要持续验收。
- **复杂分页需要检查。** 超高图片、长表格、代码块和复杂混排可能需要手动调整；提示无法输出时，不要把缺失内容当成成功导出。
- **编辑映射有范围。** 双击修改只适用于能可靠对应原文的结构；复杂 HTML、歧义匹配与并发原文变化会保守拒绝。
- **封面与草稿不是完整项目文件。** 不是所有排版参数、封面版本与会话状态都包含在 Markdown 或历史快照中。
- **实验导出器不是发布承诺。** 仓库中的 Typst、PrinceXML、SDK 等模块不等于当前编辑器提供了可用的完整后端服务。以实际入口及[能力说明](docs/project-governance/SDK_EXPORT_CAPABILITIES.md)为准。

后续工作以 [CURRENT_PLAN.md](CURRENT_PLAN.md) 为当前执行入口，[MASTER_PLAN.md](MASTER_PLAN.md) 为长期路线。计划不代表已经实现。

## 开发与贡献

Web 编辑器基于 **Vite + TypeScript**，原文编辑使用 **CodeMirror**。内容转换与安全边界使用 unified / remark / rehype；杂志分页与公众号渲染分别维护。

```text
app.ts                  浏览器应用入口
editor.ts               编辑与预览 / 导出集成
src/workspace/          工作区、原文编辑、历史与图标映射
src/engine/             分页、块拆分与文本边界
src/renderer/           渲染与打印预览
src/wechat/             公众号渲染、主题与 HTML 清洗
src/security/           文章 HTML 信任边界
src/image/              图片编辑与本地目录关联
src/cover/              封面与媒体比例
public/brand/           Folio 标志与图标许可
```

常用检查：

```bash
npm run typecheck
npm test
npm run build
python3 tools/verify.py
```

浏览器回归另见 `npm run test:pagination`、`npm run test:workspace` 与 [TESTING_GUIDE.md](TESTING_GUIDE.md)。它们需要对应的浏览器依赖；构建成功并不代表真实平台粘贴已经验收。

提交问题时，请附上可复现的最小 Markdown、浏览器版本、页面格式、主题、操作步骤与预期结果。修改功能时，请同时补充相关回归测试，避免只修演示稿。

## 作者与许可

由 **[jammyfu](https://github.com/jammyfu)** 创建和维护。

MagMark 代码采用 [MIT License](LICENSE)。Lucide 图标及其 Feather 衍生部分保留各自的 ISC / MIT 许可与版权声明，见 [LUCIDE-LICENSE.txt](public/brand/LUCIDE-LICENSE.txt)。

[GitHub 仓库](https://github.com/jammyfu/MagMark) · [提交问题](https://github.com/jammyfu/MagMark/issues)

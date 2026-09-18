# CHANGELOG

- 统一顶部语言、明暗与配色选择器的圆角、内嵌图标和箭头，改善长标签空间并适配窄窗口。

- 语言、界面明暗、配色与文章风格选择器增加统一线性图标。

- 新增简中、繁中、日语、英语界面切换与对应 README 示例，保存语言偏好；主要视图和工具栏使用图标及本地化提示，文件菜单可载入当前语言 README。

- 图片编辑配色区紧凑化：仅 SVG 显示改色选项，普通图片只显示底色设置，预览使用文章背景。

- 修复 picture 明暗版本导致图片无法定位原文、无法打开编辑的问题。

- 图片编辑新增按文章背景配色、自定义单色和底色、配色预览；应用时保存 PNG。首次启动默认加载带本地品牌素材的 README。

- 旋转表格改为分组分页：每组最多三列、重复首列及表头，以可读字号按纸张拆分，长单元格保留格式续排，取消整表缩小。

- 表格自动换行限制纸张宽度；排版高级设置新增纵向记录展开和顺时针 90° 旋转，旋转后预留实际占位。

- README 品牌字标适配 GitHub 深浅主题：深色主题自动使用白色版本，浅色主题保持黑色版本。

- 预览双击编辑改为可视化富文本：直接显示列表、加粗、链接和行内代码；保存自动转换回原文，未修改时保留原文不变。

## 2026-09-18

- 修复选中代码块后浅色代码文字落在白底而看不清的问题；代码、表格和图片保留自身背景，正文使用内外双层选中高亮。代码块现在可双击编辑，并只显示、替换围栏内部内容。

- 应用页头改用提供的 MagMark 单色横向字标；README 顶部改用同一字标与新的品牌头图，暗色工作区自动反相以保持可读性。

- 修复写作／预览分隔条聚焦后出现双线：改为单条实心高亮，保留拖动热区及键盘操作。

- 修复圈选移出窗口、窗口缩放后残留选框及下次拖动状态混乱；中断时清理框与监听器，支持 Escape 取消。

- 封面文字新增画布直接编辑、拖动移动、角点字号缩放、侧点换行宽度调整、数值微调及当前画布撤销／重做。主副标题使用高对比衬底，修复主题变量读取，长标题初始适配画布；导出移除编辑控件。

- 默认长文预览；选中文字的行高与字距新增微调箭头。工具栏增加拖动手柄，位置独立于文字重排，修复多选调参时跳动及重复偏移。

- 写作新增普通文本模式（关闭语法高亮、不改写原文），粘贴可选自动识别、保留 Markdown、仅纯文本。Word/网页富文本结构转换为 Markdown；表格保留安全 HTML，不可用图片提示重新插入。转换沿用撤销及自动保存，不包含 .doc/.docx 文件解析。

- 选中文字的字号工具增加上下箭头，每次微调 1px，保留滑杆及批量应用；到达 10–64px 边界时禁用对应按钮。

- 根据同文截图反馈，将正文调整为两端对齐、末行左对齐；混排英文／数字使用轻微视觉字号校准，保持单词完整，长裸网址单独断行。新增同文前后对比测量样张。

- 中英文混排统一为分页前处理：移除入口 Han CSS/JS 的分页后改写，使用原生自动间距及旧浏览器跨行内标签兼容处理；复制路径提供可移植间距，原文不变。
- 正文／列表／引用改为阅读优先的左对齐，修复英文词距拉伸、中文标题 keep-all 和主题缺少中文字体回退的问题；打印同步断行规则。

- 准备独立分支版本 2.0.0-beta.1，main 保持 1.6.0；README 更新当前工作区截图。
- 双击编辑优先使用预览渲染时记录的原文位置，支持重复段落、列表标题及跨页块；校验原文版本，避免旧预览覆盖新内容。

- 封面面板新增 9 个媒体 / 展示位预设、统一与独立编辑、各版本缩略预览和当前版本 PNG 下载；新增比例参考文档，区分官方建议与第三方实践。版本当前仅会话内保留。

- 新增撤销／重做及历史记录图标；正文和已关联图片每约 1.5 秒检查并自动保存至浏览器 IndexedDB，保留最近 30 个版本，启动恢复最新草稿。历史不包含排版参数。存储失败或多标签页冲突时明确提示，未保存离开时提示。

## 2026-09-17

- 修复悬浮工具栏字号、行高、间距数值随文章深色主题变暗的问题；使用独立高对比配色、稍大字号和数值底色。

- 选中内容工具栏新增删除图标，支持文字块和图片源引用删除；通过原文编辑事务保留撤销，无法唯一定位时阻止删除。

- 修复对照视图分隔线无法拖动；扩大命中区域，保留键盘调整，并在松开、取消或窗口失焦时结束拖动。

- 补齐公众号复制时列表项的原生文字分组；用 HTML 树处理嵌套列表，保留加粗等格式，不再遗漏列表中的混合文字。

- 预览标题、正文和列表文字支持双击就地打开编辑框，保留 Markdown 标记，保存同步原文并支持撤销；重复、跨页或 HTML 等无法可靠定位的片段提示回到原文编辑。

- 新增独立的工作区亮色／暗色设置，记住外观选择；统一下拉框及选项的背景、文字和原生色系，不影响文章主题或导出。

- 修复批量关联目录后复制到公众号时，本地图片被错误替换成文字占位符的问题；可读取的本地图片随富文本内嵌复制。

## 2026-09-18

- 修复暗色及低饱和工作区中图片比例文字过暗的问题：方向按钮、全部比例刻度、当前比例及重置操作使用主题配色；刻度由 7.5px 提升到 10px，非选中项不再呈现为禁用状态。
- 修复预览中双击列表时编辑框只显示第一项的问题；现在选中整块列表会载入全部 Markdown 列表项、标记及行内格式。


## 2026-09-03 · 主站工具部署

新增子路径网页构建、安全过滤、同站排版资源、移动端布局与主站返回入口。已部署到 https://bubufu.com/tools/ ，保持免费可直接使用。完整验收、限制和回滚见 /Users/jammyfu/works/AI/Global/bubufu-server/deployment-reviews/20260903-tools-v1/README.md。
# Adaptive cover layers — 2026-09-18

- Recompose portrait, square and landscape covers with separate safe areas for images and text; normalize geometry and adapt synchronized media drafts and thumbnails independently.
- Add multiple editable text/image layers, local PNG/JPEG/WebP import, stacking, duplication, visibility, deletion and undo/redo. Keep imported layers when changing templates.
- Add image contain/cover fitting, text color/backing/alignment and one-click automatic layout. Cover layers remain session-only, explicitly indicated in the panel.
# Cover alignment controls — 2026-09-18

- Add left/center/right, justified and last-line-distributed alignment for cover text layers. Preserve alignment through undo, media adaptation and export.
- Unify cover alignment, layer actions, resizing and history buttons with the workspace's accessible thin-line icon system.
# Workspace appearance — 2026-09-18

- Add live system-following appearance and three low-saturation workspace palettes (sand, sage, slate), with independent persisted mode/palette preferences.
- Match article-style dropdown surfaces and selected items to workspace colors; improve native text selection, CodeMirror selection and block/marquee selection visibility.

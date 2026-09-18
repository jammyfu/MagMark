# MagMark 单色品牌与功能图标

本次选择由用户确认：采用提供的「MagMark Monochrome」横向字标。作者展示名统一为 `jammyfu`。

## 品牌源文件

- `public/brand/magmark-monochrome.svg`：应用页头与 README 浅色界面使用的横向单色字标。
- `public/brand/magmark-monochrome-dark.svg`：README 深色界面使用的白色横向单色字标；README 通过 `picture` 的颜色偏好条件选择对应文件。
- `screenshots/magmark-brand-hero.png`：README 顶部品牌头图。
- `public/favicon.svg`：浏览器图标，依据系统明暗偏好选择前景色。
- `index.html`：页头引用单色字标，不内联或重新描摹路径。

字标原样随应用打包，不重新描摹、不改比例；仅在暗色工作区进行视觉反相。不使用通用书本图标代替品牌。

## 功能图标来源

图形来自 https://github.com/lucide-icons/lucide/tree/1.47.0/icons ，本地固化 36 个已使用的 SVG，来源版本固定为 1.47.0。完整许可复制自该版本的 LICENSE，见 `public/brand/LUCIDE-LICENSE.txt`，包含 Lucide ISC 与 Feather 衍生部分 MIT 的版权及许可声明。

- `src/workspace/lucide-icons.ts` 保存上游图形几何。
- `src/workspace/icons.ts` 保存 47 条明确的功能选择器映射；一条映射可以覆盖同功能的多个按钮。
- `brand.css` 仅描述工作区图标和品牌样式。
- `app.ts` 挂载装饰层，不替换业务事件与控制器。

默认图标为 16px、1.8 线宽、圆端点、`currentColor`。窄屏隐藏工作区视图按钮前的装饰图标，保留视图文字；插入操作的图标减为 14px。无需图标字体、图标 CDN 或新 npm 依赖。

## 功能匹配

| 功能 | Lucide 图标 |
| --- | --- |
| 写作 / 对照 / 预览 | pencil-line / columns-2 / eye |
| 文件菜单 / 打开 Markdown | folder-open / file-up |
| 导入文章目录 / 关联图片目录 | folder-input / folder-search |
| 保存 Markdown | file-down |
| 撤销 / 重做 / 历史 | undo-2 / redo-2 / clock |
| 插入图片 / 文章封面 | image-plus / panels-top-left |
| 排版设置 | sliders-horizontal |
| 分页 / 长文 | files / scroll-text |
| 导出入口 / 复制排版 | download / clipboard-copy |
| 当前 PNG / 全部 PNG / 打印 PDF | image-down / images / printer |
| 上一页 / 下一页 | chevron-left / chevron-right |
| 缩小 / 放大 / 适合窗口 | minus / plus / maximize |
| 恢复默认 / 完成 / 关闭 | rotate-ccw / check / x |
| 删除选中内容 | trash |
| 图片左对齐 / 居中 / 右对齐 | align-horizontal-justify-start / center / end |
| 图片全宽 | move-horizontal |
| 上方 / 下方插入图片 | arrow-up-to-line / 同图形旋转 180° |
| 可选 AI 生成 | sparkles |

品牌标志不包含在 Lucide 子集中，也不与功能图标互换。

## 边界与维护

保留按钮本身、既有事件、disabled 状态、中文说明和快捷键。纯图标按钮保留或补齐 aria-label；SVG 仅为装饰，使用 `aria-hidden` 和 `focusable=false`，不拦截鼠标事件。

只观察工作区外壳及直接追加到 body 的已知原生弹窗；不观察整个 body 子树，不扫描或改写文章 / CodeMirror / contenteditable 内容。异步控制器替换按钮文字后补回图标，但不改写状态文字。返回的清理函数断开观察器。

新功能应先补充明确的 selector → icon 映射与测试，不通过用户文章文本或任意 data 属性猜测图标。不要在图标层加入点击业务逻辑。

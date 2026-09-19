# 一稿多比例 · MVP

## 使用

在 2.0 beta 中打开「封面」，点击「一稿多比例」。第一次进入时读取当前标题、副标题和首张已嵌入的 PNG/JPEG/WebP；原有自由排版稿保留，点击「返回自由排版」即可返回。其他原稿图层、外链图片和整张海报中的文字不会被假装识别或迁移。

选择「主设计 · 联动所有比例」后，标题、副标题、主图、纸色、字色、字体、对齐和 Logo 开关联动。切换到「仅当前比例」可做字段级覆盖；主设计后续修改不会覆盖这些例外。位置、宽度、字号倍率与显隐微调始终只影响当前比例。当前比例可恢复跟随，操作可撤销／重做。

六个画幅复用现有媒体预设尺寸，补充 4:5。主图按指定焦点裁切，不拉伸。开启 1:1 安全区会把关键元素重新布局到居中方形内；这是约束布局，不是把六份独立重排图误称为同一张图的裁片。参考线和选择框不会导出。

## 输出与恢复

- 当前 PNG 和全部六比例 ZIP 使用同一渲染器。任何可见文字溢出会阻止该次输出，请先缩短文字、调框或关闭不需要的副标题。
- 「插入当前 PNG」插入的是已拍平图片；可编辑设计仍在本面板中。
- 保存 JSON 可携带主图、主设计与局部覆盖；打开 JSON 会校验版本、字段、图片格式和大小。数据默认仅保留在当前页面，不能替代下载备份。
- 上传仅支持 10MB 内 PNG/JPEG/WebP；解码上限 2400 万像素；设计文件上限 20MB；ZIP 上限 80MB。

## 实现与验收

`responsive/model.ts` 管理不可变主设计／变体，`layout.ts` 计算画幅、裁切与文字框，`render.ts` 共享画布和输出，`panel.ts` 提供原生对话框。`cover-panel.ts` 维持现有 API，`cover-panel-legacy.ts` 保留原实现。

运行：

```sh
npm ci
npm run typecheck
npx vitest run tests/responsive-cover.test.ts tests/cover-media-panel.test.ts tests/cover-layers.test.ts
npx playwright install chromium
node scripts/check-responsive-covers.cjs
npm run build
python3 tools/verify.py --deep
```

本轮本地通过 25 个模型／布局用例和 21 个新增面板的浏览器／文件检查。完整应用入口回归和完整项目检查以本次新提交的 CI 结果为准，不沿用以前提交的通过记录。

## 尚未交付

AI 模型接入、mono-color 风格规则、自动人物检测、复杂遮挡／蒙版、任意多图层无损迁移、跨机器字体一致性、真实手机和 WebKit 验收。当前为确定性响应式封面 MVP，不是通用 AI 海报拆层器。

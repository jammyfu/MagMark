<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/magmark-folio-white.svg"><img src="public/brand/magmark-folio.svg" width="80" height="80" alt="MagMark Folio 折頁標誌"></picture></p>
<h1 align="center">MagMark</h1>
<p align="center">寫 Markdown，讓版面像雜誌。</p>
<p align="center"><a href="README.md">简体中文</a> · 繁體中文 · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a></p>

MagMark 是面向中文與中英混排的 Markdown 編輯、排版與匯出工具。保留可編輯的原文，預覽並調整版面，再將同一篇文章帶到分頁雜誌、PNG、瀏覽器列印 PDF 或微信公眾號。

> **2.0.0-beta.1 / `codex/2.0.0-beta` 是測試分支。** `main` 維持 1.6.0；[線上編輯器](https://bubufu.com/tools/magmark/)不代表本分支已部署。重要稿件請另外保存 Markdown 原檔。

## 開始使用

建議使用與倉庫 CI 一致的 Node.js 22：

```bash
git clone --branch codex/2.0.0-beta --single-branch https://github.com/jammyfu/MagMark.git
cd MagMark
npm ci
npm run dev
```

開啟 Vite 顯示的地址，預設連接埠為 5173。貼上或開啟 Markdown，在「寫作 / 對照 / 預覽」之間切換，透過排版面板調整文章，再開啟匯出面板。

## 已有能力

CodeMirror 原文編輯、復原與重做；可拖動分欄；獨立的明暗工作區；文章主題、字級、行距、字距與分頁 / 長文；本地圖片目錄關聯、圖片說明與對齊；本地自動保存及有界歷史快照；多媒體比例的封面範本與 PNG 輸出。

部分預覽文字可雙擊編輯，修改會對應到原文。無法可靠定位或原文已變更時，系統會拒絕修改而非猜測段落。品牌使用 Folio 折頁標誌，功能圖示使用本地打包的 Lucide SVG；關鍵操作保留文字，不混入文章輸出。

## 匯出與驗收

**雜誌 / 列印**路徑使用 Han.css、Paged.js 與 CSS 分頁規則。PDF 請經由列印預覽及瀏覽器「儲存為 PDF」完成。PNG 支援當前頁或全部頁的 3× 超採樣輸出；預覽處理中或偵測到頁面溢出時，相關操作會被阻止。

**微信公眾號**使用獨立渲染與 HTML 清洗，不執行雜誌的 Han.css / Paged.js 流程。複製後須在公眾號編輯器中檢查圖片、排版與保存結果。MagMark 不會登入帳號或自動發布。其他編輯器的富文本還原度也取決於目的端。

## 限制與隱私

這不是雲端備份、多人協作或文件託管服務。本地歷史不包含所有排版與封面工作階段設定；清除瀏覽器資料可能導致稿件遺失。複雜分頁、慢速字型 / 圖片、真實系統輸入法、其他瀏覽器及公眾號保存後的結果仍需持續驗收。

本地優先不等於完全離線：入口會載入外部字型與 Han.css，遠端圖片亦會產生網路請求。選用 AI 生成功能時會呼叫設定的服務，API Key 偏好可能留在瀏覽器儲存空間；請勿在不可信的共用裝置保存金鑰。

倉庫內的 SDK、Typst、PrinceXML 實驗模組不等於已提供完整生產匯出服務。詳見[能力說明](docs/project-governance/SDK_EXPORT_CAPABILITIES.md)、[當前計畫](CURRENT_PLAN.md)與[完整使用說明](README.md)。

## 開發與作者

技術基礎為 Vite + TypeScript、CodeMirror、unified / remark / rehype；雜誌與公眾號維持獨立輸出路徑。常用檢查為 `npm run typecheck`、`npm test`、`npm run build`、`python3 tools/verify.py`；瀏覽器回歸請見 [TESTING_GUIDE.md](TESTING_GUIDE.md)。

由 **[jammyfu](https://github.com/jammyfu)** 建立與維護。程式碼採用 [MIT License](LICENSE)。Lucide / Feather 圖示的 ISC / MIT 聲明保留於 [LUCIDE-LICENSE.txt](public/brand/LUCIDE-LICENSE.txt)。

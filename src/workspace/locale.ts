export type Locale = 'zh-Hans' | 'zh-Hant' | 'ja' | 'en';
export const LOCALES: Locale[] = ['zh-Hans', 'zh-Hant', 'ja', 'en'];
export function savedLocale(): Locale {
  try { const value = localStorage.getItem('magmark-ui-language') as Locale; return LOCALES.includes(value) ? value : 'zh-Hans'; }
  catch { return 'zh-Hans'; }
}

// Stable application strings only. Article/source text is never translated.
const rows = `写作|寫作|執筆|Write
对照|對照|並べて表示|Compare
预览|預覽|プレビュー|Preview
文件|檔案|ファイル|File
导出|匯出|書き出し|Export
图片|圖片|画像|Images
封面|封面|表紙|Cover
排版|排版|組版|Layout
分页|分頁|ページ表示|Pages
长文|長文|連続表示|Continuous
撤销|復原|元に戻す|Undo
重做|重做|やり直す|Redo
历史记录|歷史記錄|履歴|History
关闭|關閉|閉じる|Close
取消|取消|キャンセル|Cancel
保存|儲存|保存|Save
模式|模式|モード|Mode
粘贴|貼上|貼り付け|Paste
普通文本|純文字|プレーンテキスト|Plain text
自动识别（含 Word）|自動辨識（含 Word）|自動判別（Word 対応）|Auto detect (including Word)
保留 Markdown 原文|保留 Markdown 原文|Markdown を保持|Keep Markdown
仅纯文本（去除格式）|僅純文字（移除格式）|書式なしテキスト|Plain text only
Word 标题、加粗、列表自动转换 · 可撤销|Word 標題、粗體、清單自動轉換 · 可復原|Word の見出し・太字・リストを自動変換 · 取り消し可能|Convert Word headings, bold and lists · Undo available
专注于表达|專注於表達|書くことに集中|Focus on your words
工作区视图|工作區檢視|ワークスペース表示|Workspace view
工作区外观|工作區外觀|外観|Appearance
工作区外观（不影响文章）|工作區外觀（不影響文章）|外観（記事には影響しません）|Appearance (does not affect article)
工作区配色|工作區配色|配色|Palette
工作区配色（不影响文章）|工作區配色（不影響文章）|配色（記事には影響しません）|Palette (does not affect article)
自动 · 跟随系统|自動 · 跟隨系統|システムに合わせる|System
亮色|淺色|ライト|Light
暗色|深色|ダーク|Dark
经典灰|經典灰|ニュートラル|Neutral
暖砂|暖砂|サンド|Sand
雾松|霧松|セージ|Sage
岩蓝|岩藍|スレート|Slate
打开文本|開啟文字|テキストを開く|Open text
导入文章目录|匯入文章目錄|記事フォルダーを読み込む|Import article folder
关联图片目录|關聯圖片目錄|画像フォルダーを関連付ける|Link image folder
含图片|含圖片|画像を含む|With images
补全缺图|補全缺圖|不足画像を補完|Find missing images
保存 Markdown|儲存 Markdown|Markdown を保存|Save Markdown
下载 Markdown 原文|下載 Markdown 原文|Markdown をダウンロード|Download Markdown source
文章目录用于本地预览，不会上传图片。|文章目錄用於本機預覽，不會上傳圖片。|フォルダーはローカルで表示され、画像はアップロードされません。|Folders are previewed locally; images are not uploaded.
载入 README|載入 README|README を開く|Open README
载入当前语言的 README？当前内容可通过撤销恢复。|載入目前語言的 README？目前內容可透過復原恢復。|この言語の README を開きますか？現在の内容は元に戻せます。|Open the README in this language? You can undo to restore the current content.
文章预览|文章預覽|記事プレビュー|Article preview
文章视图|文章檢視|記事表示|Article view
页面格式|頁面格式|用紙形式|Page format
A4 打印|A4 列印|A4 印刷|A4 print
手机 (393px)|手機 (393px)|スマートフォン (393px)|Mobile (393px)
桌面 (800px)|桌面 (800px)|デスクトップ (800px)|Desktop (800px)
文章风格|文章風格|記事スタイル|Article style
字体|字型|フォント|Font
字号|字級|文字サイズ|Font size
行高|行高|行の高さ|Line height
字间距|字元間距|字間|Letter spacing
字距|字距|字間|Tracking
高级设置|進階設定|詳細設定|Advanced
表格排列|表格排列|表の配置|Table layout
横向 · 自动换行适应纸张|橫向 · 自動換行配合紙張|横方向・用紙に合わせて折り返す|Horizontal · Wrap to paper
纵向 · 按记录展开|縱向 · 按記錄展開|縦方向・レコードごとに展開|Vertical · Expand records
横向分组分页 · 旋转 90°|橫向分組分頁 · 旋轉 90°|列を分割して改ページ・90° 回転|Column groups · Rotate 90°
仅调整当前页|僅調整目前頁面|現在のページのみ|Current page only
手动分页|手動分頁|手動改ページ|Manual page breaks
段落分割线|段落分隔線|段落区切り線|Paragraph dividers
恢复默认排版|恢復預設排版|組版をリセット|Reset layout
带走你的作品|帶走你的作品|作品を書き出す|Take your work with you
导出与复制|匯出與複製|書き出しとコピー|Export and copy
复制到公众号|複製到公眾號|WeChat にコピー|Copy to WeChat
复制公众号富文本|複製公眾號富文字|WeChat リッチテキストをコピー|Copy WeChat rich text
复制到 Word 等编辑器|複製到 Word 等編輯器|Word などにコピー|Copy to Word and other editors
当前页 PNG|目前頁面 PNG|現在のページを PNG に|Current page PNG
全部页 PNG|全部頁面 PNG|全ページを PNG に|All pages PNG
打印 / PDF 预览|列印 / PDF 預覽|印刷 / PDF プレビュー|Print / PDF preview
保留文章风格，适配公众号。|保留文章風格，配合公眾號。|記事スタイルを保ち、WeChat に合わせます。|Keep article styling, adapted for WeChat.
将当前公众号风格复制到剪贴板。|將目前公眾號風格複製到剪貼簿。|現在の WeChat スタイルをコピーします。|Copy the current WeChat style to the clipboard.
复制当前排版，不发布文章。|複製目前排版，不發佈文章。|現在の組版をコピーします。記事は公開されません。|Copy the current layout without publishing.
选取|選取|選択|Select
批量选取…|批次選取…|まとめて選択…|Select group…
全部正文（不含标题）|全部內文（不含標題）|本文すべて（見出しを除く）|All body text (no headings)
全部主标题 H1|全部主標題 H1|すべての H1|All H1 headings
全部副标题 H2|全部副標題 H2|すべての H2|All H2 headings
全部小标题 H3|全部小標題 H3|すべての H3|All H3 headings
全部次级标题 H4–H6|全部次級標題 H4–H6|すべての H4–H6|All H4–H6 headings
全部标题 H1–H6|全部標題 H1–H6|すべての見出し H1–H6|All headings H1–H6
对齐|對齊|配置|Alignment
左对齐|靠左對齊|左揃え|Align left
居中|置中|中央揃え|Center
右对齐|靠右對齊|右揃え|Align right
全宽|全寬|幅いっぱい|Full width
编辑图片|編輯圖片|画像を編集|Edit image
插入或编辑图片|插入或編輯圖片|画像を挿入・編集|Insert or edit image
关闭图片面板|關閉圖片面板|画像パネルを閉じる|Close image panel
已选择图片|已選擇圖片|画像を選択済み|Image selected
或 选择文件|或 選擇檔案|またはファイルを選択|Or choose a file
说明文字（可选）|說明文字（選填）|キャプション（任意）|Caption (optional)
图片说明…|圖片說明…|キャプション…|Image caption…
SVG 配色|SVG 配色|SVG の色|SVG colors
保留原色|保留原色|元の色を保持|Original colors
按当前文章背景配色|依目前文章背景配色|現在の記事背景に合わせる|Match current article background
自定义颜色|自訂顏色|カスタムカラー|Custom color
单色着色会统一 SVG 中的颜色。|單色著色會統一 SVG 中的顏色。|単色にすると SVG 全体が同じ色になります。|Tint applies one color throughout the SVG.
图片底色|圖片底色|画像の背景色|Image background
预览配色|預覽配色|色をプレビュー|Preview colors
修改后保存为 PNG · 预览采用文章背景|修改後儲存為 PNG · 預覽採用文章背景|変更後は PNG で保存・記事背景でプレビュー|Save changes as PNG · Preview on article background
图文混排|圖文混排|画像の配置|Image layout
靠左|靠左|左寄せ|Left
靠右|靠右|右寄せ|Right
宽度|寬度|幅|Width
复制|複製|コピー|Copy
应用修改|套用修改|変更を適用|Apply changes
插入|插入|挿入|Insert
清除图片|清除圖片|画像をクリア|Clear image
拖拽或粘贴图片，也可以输入图片地址。|拖曳或貼上圖片，也可以輸入圖片網址。|画像をドラッグ、貼り付け、または URL を入力できます。|Drop or paste an image, or enter an image URL.
图片地址或生成描述|圖片網址或生成描述|画像 URL または生成指示|Image URL or generation prompt
粘贴图片 URL / 输入 AI 生成描述…|貼上圖片 URL / 輸入 AI 生成描述…|画像 URL / AI 生成指示…|Image URL / AI generation prompt…
设置文章封面|設定文章封面|記事の表紙を設定|Set article cover
关闭面板|關閉面板|パネルを閉じる|Close panel
关闭导出面板|關閉匯出面板|書き出しパネルを閉じる|Close export panel
上一页|上一頁|前のページ|Previous page
下一页|下一頁|次のページ|Next page
适合窗口|符合視窗|ウィンドウに合わせる|Fit to window
预览缩放|預覽縮放|プレビュー倍率|Preview zoom
未命名文章|未命名文章|無題の記事|Untitled article
自动保存准备中|自動儲存準備中|自動保存を準備中|Preparing autosave
正在保存…|正在儲存…|保存中…|Saving…
等待保存…|等待儲存…|保存待ち…|Waiting to save…
已恢复本地草稿|已還原本機草稿|ローカル下書きを復元しました|Local draft restored
Markdown 原文|Markdown 原文|Markdown ソース|Markdown source
完成|完成|完了|Done
跳到编辑器|跳至編輯器|エディターへ移動|Skip to editor
公众号预览|公眾號預覽|WeChat プレビュー|WeChat preview
小红书 3:4|小紅書 3:4|RED 3:4|RED 3:4
旗舰金石 (Elite)|旗艦金石 (Elite)|エリート (Elite)|Elite
深海 (Ocean)|深海 (Ocean)|海 (Ocean)|Ocean
日落大道 (Sunset)|日落大道 (Sunset)|夕日 (Sunset)|Sunset
森之冠 (Forest)|森之冠 (Forest)|森 (Forest)|Forest
现代极简 (Modern)|現代極簡 (Modern)|モダン (Modern)|Modern
黄金时刻 (Golden)|黃金時刻 (Golden)|ゴールデン (Golden)|Golden
北极霜晨 (Arctic)|北極霜晨 (Arctic)|北極 (Arctic)|Arctic
沙漠玫瑰 (Rose)|沙漠玫瑰 (Rose)|ローズ (Rose)|Rose
科技创新 (Tech)|科技創新 (Tech)|テック (Tech)|Tech
植物园 (Garden)|植物園 (Garden)|庭園 (Garden)|Garden
午夜星系 (Galaxy)|午夜星系 (Galaxy)|銀河 (Galaxy)|Galaxy
极简主义|極簡主義|ミニマル|Minimal
优雅青绿|優雅青綠|エレガントグリーン|Elegant green
活力橙红|活力橙紅|鮮やかなオレンジ|Vibrant orange
商务深蓝|商務深藍|ビジネスブルー|Business blue
复古纸张|復古紙張|レトロペーパー|Vintage paper
少女粉色|少女粉色|ソフトピンク|Soft pink
极简暗黑|極簡暗黑|ミニマルダーク|Minimal dark
森林呼吸|森林呼吸|森の息吹|Forest air
深海之蓝|深海之藍|ディープブルー|Deep blue
薰衣草紫|薰衣草紫|ラベンダー|Lavender
咖啡时光|咖啡時光|コーヒータイム|Coffee time
赛博朋克|賽博龐克|サイバーパンク|Cyberpunk
尊享金典|尊享金典|プレミアムゴールド|Premium gold
技术蓝图|技術藍圖|ブループリント|Blueprint
落日余晖|落日餘暉|夕映え|Afterglow
薄荷清爽|薄荷清爽|ミント|Mint
手写文艺|手寫文藝|手書き|Handwritten
微信绿 (官方)|微信綠 (官方)|WeChat グリーン|WeChat green
思源宋体 (杂志)|思源宋體 (雜誌)|Source Han Serif（雑誌）|Source Han Serif (magazine)
思源黑体|思源黑體|Noto Sans CJK|Noto Sans CJK
苹方 / 微软雅黑|蘋方 / 微軟雅黑|PingFang / Microsoft YaHei|PingFang / Microsoft YaHei
楷体 (文艺)|楷體 (文藝)|楷書体|Kai calligraphy
Georgia (英文)|Georgia (英文)|Georgia（欧文）|Georgia (Latin)
等宽字体|等寬字型|等幅フォント|Monospace
风格只改变文章，工作区保持安静。|風格只改變文章，工作區保持安靜。|スタイルは記事だけに適用されます。|Styles affect the article only.
阅读节奏|閱讀節奏|読みやすさ|Reading rhythm
字号倍率|字級倍率|文字サイズ倍率|Font scale
预览设备|預覽裝置|プレビュー端末|Preview device
手机 (375px)|手機 (375px)|スマートフォン (375px)|Mobile (375px)
安卓 (412px)|安卓 (412px)|Android (412px)|Android (412px)
平板 (768px)|平板 (768px)|タブレット (768px)|Tablet (768px)
宽屏 (800px)|寬螢幕 (800px)|ワイド (800px)|Wide (800px)
分组时每组最多三列，重复首列和表头；保持字号，长内容续排到下一张。|每組最多三欄，重複首欄和表頭；保持字級，長內容續排至下一張。|最大3列ずつに分け、先頭列と見出しを繰り返します。文字サイズを保ち、長い内容は次ページへ続きます。|Up to three columns per group; repeat the key column and header, keeping text size across pages.
当前预览内容|目前預覽內容|現在のプレビュー|Current preview
复制排版|複製排版|組版をコピー|Copy layout
保存文件|儲存檔案|ファイルを保存|Save files
已加载的本地图片随排版复制；粘贴后请确认目标平台已接收图片。导出不会自动发布。|已載入的本機圖片隨排版複製；貼上後請確認目標平台已接收圖片。匯出不會自動發佈。|読み込んだローカル画像もコピーされます。貼り付け後に画像を確認してください。自動公開はしません。|Loaded local images are copied with the layout. Check images after pasting; exporting does not publish.
自动保存失败，请导出备份|自動儲存失敗，請匯出備份|自動保存に失敗しました。バックアップを書き出してください|Autosave failed; export a backup
自动保存不可用，请导出备份|自動儲存無法使用，請匯出備份|自動保存を利用できません。バックアップを書き出してください|Autosave unavailable; export a backup
暂无已保存版本|尚無已儲存版本|保存済みの履歴はありません|No saved versions
恢复此版本|還原此版本|この版を復元|Restore this version
自动保存历史|自動儲存歷史|自動保存履歴|Autosave history
最近 30 个本地版本（正文及已关联图片）。不包含排版参数；清除浏览器数据会清除历史，请定期导出备份。|最近 30 個本機版本（內文及已關聯圖片）。不含排版參數；清除瀏覽器資料會清除歷史，請定期匯出備份。|本文と関連画像の直近30版をローカル保存します。組版設定は含みません。ブラウザーデータの削除で履歴も消えるため、定期的にバックアップしてください。|Last 30 local versions with text and linked images, excluding layout settings. Clearing browser data removes history; export backups regularly.
插入图片|插入圖片|画像を挿入|Insert image
拖拽或粘贴图片|拖曳或貼上圖片|画像をドラッグまたは貼り付け|Drop or paste an image
，也可以输入图片地址。|，也可以輸入圖片網址。|、または画像 URL を入力。|, or enter an image URL.
占位图模式|預留圖模式|プレースホルダー|Placeholder
占位图 / 生成比例|預留圖 / 生成比例|プレースホルダー / 生成比率|Placeholder / generation ratio
竖向|直向|縦向き|Portrait
方形|正方形|正方形|Square
横向|橫向|横向き|Landscape
重置比例|重設比例|比率をリセット|Reset ratio
重置|重設|リセット|Reset
生成|生成|生成|Generate
文字|文字|テキスト|Text
自适应排版|自適應排版|自動レイアウト|Auto layout
关闭封面面板|關閉封面面板|表紙パネルを閉じる|Close cover panel
媒体 / 展示位置|媒體 / 顯示位置|メディア / 掲載位置|Media / placement
统一编辑所有版本|統一編輯所有版本|すべての版を編集|Edit all versions
仅编辑当前版本|僅編輯目前版本|現在の版のみ編集|Edit current version
封面编辑范围|封面編輯範圍|表紙の編集範囲|Cover editing scope
图层 / LAYERS|圖層 / LAYERS|レイヤー|Layers
文字内容|文字內容|テキスト内容|Text content
输入封面标题|輸入封面標題|表紙のタイトル|Cover title
副标题 / 简介|副標題 / 簡介|サブタイトル / 説明|Subtitle / description
文字设计|文字設計|文字デザイン|Typography
主标题|主標題|タイトル|Title
副标题|副標題|サブタイトル|Subtitle
字号 px|字級 px|文字サイズ px|Font size px
文本框宽度 %|文字框寬度 %|テキスト枠の幅 %|Text box width %
文字颜色|文字顏色|文字色|Text color
衬底|襯底|背景|Backing
完整显示图片|完整顯示圖片|画像全体を表示|Fit entire image
填满图框（裁切）|填滿圖框（裁切）|枠を埋める（切り抜き）|Fill frame (crop)
编辑文字|編輯文字|テキストを編集|Edit text
复位位置|重設位置|位置をリセット|Reset position
选择模板|選擇範本|テンプレートを選択|Choose template
AI 生成（可选）|AI 生成（選填）|AI 生成（任意）|AI generation (optional)
自定义出图比例|自訂輸出比例|出力比率を設定|Custom aspect ratio
下载当前版本 PNG|下載目前版本 PNG|現在の版を PNG で保存|Download current version PNG
插入当前封面|插入目前封面|現在の表紙を挿入|Insert current cover
编辑文字图层|編輯文字圖層|テキストレイヤーを編集|Edit text layer
图片适配方式|圖片適配方式|画像のフィット|Image fitting
图层上移|圖層上移|レイヤーを前へ|Move layer up
图层下移|圖層下移|レイヤーを後ろへ|Move layer down
复制图层|複製圖層|レイヤーを複製|Duplicate layer
显示或隐藏图层|顯示或隱藏圖層|レイヤーの表示切替|Toggle layer visibility
删除选中图层|刪除選取圖層|選択レイヤーを削除|Delete selected layer
左对齐|靠左對齊|左揃え|Align left
居中对齐|置中對齊|中央揃え|Align center
两端对齐|左右對齊|両端揃え|Justify
分散对齐（末行也齐行）|分散對齊（末行也齊行）|均等割り付け（最終行を含む）|Distribute including last line
外观|外觀|外観|Appearance
或|或|または|Or
封面生成|封面生成|表紙作成|Cover designer
统一编辑同步内容和图层，各比例重新适配布局。独立微调请选“仅编辑当前版本”。封面暂存在本次会话，刷新会丢失，请及时下载。|統一編輯同步內容與圖層，各比例重新適配版面。獨立微調請選「僅編輯目前版本」。封面僅存於本次工作階段，重新整理會遺失，請及時下載。|一括編集は内容とレイヤーを同期し、各比率に配置します。個別調整は現在の版を選択してください。表紙はセッション内のみ保持されるため、更新前にダウンロードしてください。|Shared edits sync content and layers, adapting each ratio. Select the current version for individual changes. Covers last only for this session; download before refreshing.
点击图层选择；列表从上到下对应前景到背景。|點擊圖層選取；清單由上至下對應前景至背景。|レイヤーをクリックして選択。上から前面、下へ背面の順です。|Select a layer; the list runs from front to back.
显示 / 隐藏|顯示 / 隱藏|表示 / 非表示|Show / hide
删除|刪除|削除|Delete
角点缩放文字 · 侧点调整换行|角點縮放文字 · 側點調整換行|角で文字サイズ・辺で折り返しを調整|Corners resize text · Sides adjust wrapping
双击编辑 · Esc 取消 · ⌘/Ctrl Enter 完成|按兩下編輯 · Esc 取消 · ⌘/Ctrl Enter 完成|ダブルクリックで編集・Esc で取消・⌘/Ctrl Enter で完了|Double-click to edit · Esc to cancel · ⌘/Ctrl Enter to finish
撤销记录仅限当前画布，切换媒体或模板后重置。|復原記錄僅限目前畫布，切換媒體或範本後重設。|履歴は現在のキャンバスのみ。メディアやテンプレートの変更でリセットされます。|Undo applies to the current canvas and resets when switching media or templates.
AI 生成|AI 生成|AI 生成|AI generation
拖动移动 · 双击编辑 · 控制点缩放|拖曳移動 · 按兩下編輯 · 控制點縮放|ドラッグで移動・ダブルクリックで編集・ハンドルで拡大縮小|Drag to move · Double-click to edit · Handles to resize
查看自动保存历史|查看自動儲存歷史|自動保存履歴を表示|View autosave history
撤销（⌘/Ctrl Z）|復原（⌘/Ctrl Z）|元に戻す（⌘/Ctrl Z）|Undo (⌘/Ctrl Z)
重做（⌘/Ctrl Shift Z）|重做（⌘/Ctrl Shift Z）|やり直す（⌘/Ctrl Shift Z）|Redo (⌘/Ctrl Shift Z)
缩小预览|縮小預覽|縮小|Zoom out
放大预览|放大預覽|拡大|Zoom in
移动工具栏|移動工具列|ツールバーを移動|Move toolbar
按文字层级批量选取|依文字層級批次選取|文字階層で選択|Select by text level
删除选中内容|刪除選取內容|選択内容を削除|Delete selection
在此块上方插入图片|在此區塊上方插入圖片|このブロックの前に画像を挿入|Insert image above this block
在此块下方插入图片|在此區塊下方插入圖片|このブロックの後に画像を挿入|Insert image below this block`;
const dictionary = new Map(rows.split('\n').map(row => { const cells = row.split('|'); return [cells[0], cells]; }));
const reverse = new Map<string, string>();
for (const [source, cells] of dictionary) for (const cell of cells) reverse.set(cell, source);
export function translate(text: string, locale: Locale): string {
  const trimmed = text.trim();
  const count = trimmed.match(/^([\d,]+) (?:字符|字元|文字|characters)$/);
  if (count) return `${count[1]} ${['字符', '字元', '文字', 'characters'][LOCALES.indexOf(locale)]}`;
  const saved = trimmed.match(/^(?:已自动保存|已自動儲存|保存済み|Autosaved) (.+)$/);
  if (saved) return `${['已自动保存', '已自動儲存', '保存済み', 'Autosaved'][LOCALES.indexOf(locale)]} ${saved[1]}`;
  const source = reverse.get(trimmed) || trimmed;
  const result = dictionary.get(source)?.[LOCALES.indexOf(locale)];
  return result ? text.replace(trimmed, result) : text;
}

const roots = '#app-header, .workspace-panel-header, .writing-options, .editor-footer, .preview-toolbar, .preview-footer, #layout-inspector, #export-dialog, #block-toolbar, dialog, #mm-image-context-menu';
const excluded = '#preview-area, #source-editor, #markdown-input, .magmark, [contenteditable], textarea, #document-title, .mm-cp-preview, .mm-cp-canvas, .history-dialog pre, #mm-cp-layer-list';
export function mountLocale(onChange: (locale: Locale) => void): () => void {
  const select = document.getElementById('workspace-language') as HTMLSelectElement;
  let locale = savedLocale(); select.value = locale;
  const observer = new MutationObserver(apply);
  function apply() {
    observer.disconnect();
    document.documentElement.lang = locale;
    document.querySelectorAll<HTMLElement>(roots).forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (!node.parentElement?.closest(`${excluded}, #workspace-language, script, style, svg`)) {
          const next = translate(node.data, locale); if (next !== node.data) node.data = next;
        }
      }
      [root, ...root.querySelectorAll<HTMLElement>('[title], [aria-label], [placeholder]')].forEach(element => {
        if (element.closest(excluded)) return;
        for (const attribute of ['title', 'aria-label', 'placeholder']) {
          const value = element.getAttribute(attribute);
          if (value) { const next = translate(value, locale); if (next !== value) element.setAttribute(attribute, next); }
        }
      });
    });
    observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder']});
  }
  const change = () => {
    if (!LOCALES.includes(select.value as Locale)) return;
    locale = select.value as Locale;
    try { localStorage.setItem('magmark-ui-language', locale); } catch { /* session preference */ }
    onChange(locale); apply();
  };
  select.addEventListener('change', change);
  apply();
  return () => { observer.disconnect(); select.removeEventListener('change', change); };
}

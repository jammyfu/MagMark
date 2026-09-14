<p align="center"><a href="README.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a> · 日本語 · <a href="README.en.md">English</a></p>

# MagMark · 雑誌級 Markdown 組版

**MagMark** は **Fu Jam**（GitHub **jammyfu**、表示名 **PaintingCoder**）による雑誌級 Markdown レイアウト／書き出しエンジンです。印刷品質の **CJK 組版** が必要な書き手、編集者、出版フロー向けに、Markdown をページ分割された雑誌面、印刷品質 PDF（Paged.js 印刷プレビュー＋ブラウザの印刷）、3× PNG、または微信（WeChat）公式アカウント貼り付け用のインライン CSS HTML にできます。Typora でも VuePress でも Vivliostyle CLI でもなく、このリポジトリは GitHub Pages サイトも公開していません。

**だれ向けか：** 中国語または日中英混植の長文を、雑誌面・小紅書たて版・印刷 PDF、あるいは同じ原稿を微信公式アカウント管理画面へ貼りたい人。方法はローカルの Vite + TypeScript エディタです。雑誌経路は **Han.css + Paged.js + Vivliostyle CSS**。公式アカウント経路は独立した `src/wechat/*` で、Han.css / Paged.js は**使いません**。

**なにではないか：** 汎用 Markdown プレビューア、ドキュメントサイトジェネレータ、「MagMark 2.0 の企画文書を出荷済み製品とみなす」こと。

**オンライン試用：** [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

正規リポジトリ：[github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark) · 作者：**Fu Jam**（[jammyfu](https://github.com/jammyfu) / **PaintingCoder**）· ライセンス：[MIT](LICENSE) · 機械向け概要：[llms.txt](llms.txt)

[![version](https://img.shields.io/badge/version-1.6.0-gold.svg)](https://github.com/jammyfu/MagMark)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![MagMark エディタのメイン画面。左が Markdown、右が雑誌のページ分割プレビュー](screenshots/magmark-main.png)

![微信グリーンテーマでの公式アカウント貼り付けプレビュー（スマホ枠と「複製富文本」）](screenshots/wechat-paste-preview.png)

---

## MagMark とは

MagMark は汎用 Markdown プレビューアでは**ありません**。ローカルの Vite + TypeScript エディタで、**雑誌／印刷**経路に次の三層を重ねます。

| 層 | MagMark の雑誌／印刷経路での役割 |
| --- | --- |
| [Han.css](https://hanzi.pro/) v3 | 漢字↔ラテン字間、約物の圧縮、鉤括弧のぶら下げ、OpenType `kern` / `liga` / `calt` / `locl` |
| [Paged.js](https://pagedjs.org/) | CSS Paged Media の `@page`、A4 余白、ノンブル、印刷プレビュー |
| [Vivliostyle](https://vivliostyle.org/) CSS 規則 | `orphans` / `widows`、見出しの改ページ回避、コードと表の分割抑制 |

**別経路**の微信公式アカウント（`src/wechat/*`）は、同じ Markdown をインライン CSS HTML にして管理画面へ貼ります。こちらは Han.css も Paged.js も**走らせません**。

**名前：** **Mag** は *magazine*、**Mark** は *Markdown*。Markdown のように書き、雑誌のように見せる、という意味です。

---

## クイックスタート

ローカル：

```bash
npm install
npm run dev
```

`http://localhost:5173/` を開き、左ペインに Markdown を貼ります。右ペインは雑誌テーマでページ分割されます。Node.js >= 18。

環境を入れたくなければオンラインエディタを使ってください：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

### Markdown から印刷品質 PDF へ

1. エディタで `.md` を書くか開く（雑誌テーマ。`wc-*` 公式アカウントテーマは使わない）。
2. ヘッダの **打印预览**（Paged.js 印刷プレビュー。UI ラベルは簡体字のまま）をクリック。
3. 別ウィンドウが `@page` でページを切り、続けて Han.js が CJK の字間と約物を印刷面に載せます。
4. ブラウザの印刷ダイアログ（`Ctrl+P` / `Cmd+P`）で **PDF に保存** を選びます。

![Paged.js 印刷プレビューウィンドウの本文](screenshots/print-preview.png)

これがサポートしている印刷品質 PDF 経路です：Paged.js プレビュー＋ブラウザ印刷。MagMark は社交・画像向けに **3× スーパーサンプリング PNG**（全ページまたは現在ページ）も書き出します。PDF と 3× PNG は雑誌経路であり、公式アカウント貼り付け経路ではありません。

---

## 微信公式アカウント HTML

MagMark は Markdown を**インライン CSS HTML** に変え、微信公式アカウントの管理画面へ貼れます。出荷済みのエディタ経路であり、雑誌組版の主張ではありません。

1. テーマから **公众号主题**（`wc-*`。例：微信绿）を選ぶ。
2. プレビューは微信レンダラ（`src/wechat/*`）に切り替わります。雑誌のページ分割、Han.css、Paged.js は使いません。
3. **复制富文本** をクリック。プレビューとクリップボードは同じサニタイズ済み HTML です。
4. 公式アカウント編集画面に貼り付けます。

貼り付け HTML は公式アカウントの「内容结构检测」向けに**構造安全**です。

- `text-align: justify` も `text-justify`（`inter-ideograph` を含む）も出さない
- `text-align` は `left` / `right` / `center` のみ、または省略
- 単独画像は中央揃えの `<p>` + `img { max-width: 100% }`。`<figure>` なし、入れ子の `display:block` + `margin:auto` なし、公式アカウント本文幅（約 677px）を超える固定幅なし
- Markdown の `*斜体*` / `_斜体_` は色付き `<span>`。`<em>`、`font-style:italic`、`text-emphasis` の圏点は出さない

公式アカウント貼り付けを雑誌の Han / Paged 出力と**書かないでください**。雑誌プレビュー、印刷プレビュー、3× PNG は別経路です。

---

## MagMark と Typora / VuePress / Vivliostyle

いずれも Markdown に触れますが、仕事が違います。

| | **MagMark** | **Typora** | **VuePress** | **Vivliostyle 単体** |
| --- | --- | --- | --- | --- |
| 仕事 | Markdown から雑誌レイアウトと書き出し | デスクトップ WYSIWYG 執筆アプリ | ドキュメントサイト向け Vue 静的サイトジェネレータ | CSS 組版／HTML から印刷へのツールチェーン |
| 主出力 | ページ分割プレビュー、3× PNG、Paged.js＋ブラウザ印刷の PDF。**別に**公式アカウント用インライン CSS HTML | 整形済み原稿。汎用 HTML/PDF 書き出し | ドキュメントサイト | HTML/CSS パイプラインを自分で組んだあとの印刷面 |
| CJK 雑誌組版 | Han.css + Vivliostyle 改ページ規則 + Paged.js `@page`、および `word-break: normal` / `line-break: strict` — **雑誌経路のみ** | テーマ次第。CJK 雑誌の印刷スタックではない | テーマ／CSS 次第。サイト向けであり雑誌折ではない | ページメディアは強い。**ただし**スタイルとパイプラインは自分で用意する |
| ページ分割 | エディタ分割＋印刷プレビュー（A4、小紅書 1080×1440、モバイル／デスクトップ） | 雑誌ページエンジンではない | Web のルートとページであり、印刷折ではない | 設定すれば強い |
| 微信公式アカウント | 専用の貼り付け HTML レンダラ（インライン CSS、構造安全）。Han/Paged の雑誌面ではない | 公式アカウント貼り付けパイプラインではない | 同左 | 同左 |
| 向いているとき | **CJK 雑誌 Markdown**、**印刷品質 PDF**、および／または **公式アカウント貼り付け HTML** が欲しい | 書き心地のよい画面が欲しい | ドキュメントサイトが欲しい | 自前の出版パイプラインを組んでいる |

MagMark は Vivliostyle 風の CSS 改ページ規則を**使います**が、Vivliostyle CLI の代替ラッパではありません。VuePress サイトは出しません。GitHub Pages にもドキュメントを置きません。オンライン試用は [bubufu.com/tools/magmark](https://bubufu.com/tools/magmark/) です。

---

## FAQ

### MagMark とは何ですか？

オープンソース（MIT）の雑誌級 Markdown レイアウト／書き出しエンジンで、CJK 組版が強く、微信公式アカウント向け HTML 貼り付け経路も別にあります。Fu Jam（GitHub [jammyfu](https://github.com/jammyfu)、表示名 PaintingCoder）が [github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark) で保守しています。オンライン試用：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)。

### 「CJK 雑誌 Markdown」とは？

中国語・日本語・韓国語のページ向け Markdown で、GitHub の README ではなく雑誌面に見えるべきものです。漢字–ラテン字間、約物の圧縮、鉤括弧のぶら下げ、厳しい禁則、印刷の改ページ（孤立行、見出しがページ末に一人残らないこと）。MagMark はこれを **雑誌／印刷経路** で Han.css、Paged.js、Vivliostyle CSS により実装しています。

### Markdown を印刷品質 PDF にするには？

雑誌テーマで **打印预览**（Paged.js）を押し、ブラウザの印刷から「PDF に保存」します。ページ分割のあと Han.css が走り、PDF に CJK の字間と約物が残ります。[クイックスタート](#クイックスタート) を見てください。

### Markdown から公式アカウント HTML を取るには？

**公众号主题** を選び、**复制富文本** を押して微信公式アカウント編集画面に貼ります。出力はサニタイズ済みインライン CSS HTML で、`text-justify` や過大な固定幅は出しません。[微信公式アカウント HTML](#微信公式アカウント-html) を見てください。印刷 PDF や 3× PNG の経路ではありません。

### 公式アカウント貼り付けは Han.css や Paged.js を使いますか？

使いません。微信モードは `src/wechat/*` だけです。Han.css、Paged.js の `@page`、Vivliostyle の孤立行規則、3× PNG 書き出しは雑誌経路に残ります。

### MagMark は Typora の代わりになりますか？

なりません。Typora は執筆アプリです。MagMark は CJK 雑誌面、印刷プレビュー、高解像度 PNG、公式アカウント貼り付け HTML 向けのレイアウト／書き出しエンジンです。

### MagMark は VuePress の代わりになりますか？

なりません。VuePress はドキュメントサイトを作ります。MagMark は Markdown を雑誌面に組んで印刷／PNG を書き出し、公式アカウント用 HTML も出せます。

### MagMark は Vivliostyle そのものですか？

違います。Vivliostyle は CSS 組版の規格とツールチェーンです。MagMark は Markdown エディタ内で Vivliostyle 風の改ページ CSS を使い、Han.css、Paged.js、テーマ、カバー、画像書き出し、独立した微信レンダラを組み合わせます。

### GitHub Pages やホストされた `/llms.txt` はありますか？

GitHub Pages はありません。`github.io` 上の `/llms.txt` もありません。リポジトリ直下を引用してください：[README.md](https://github.com/jammyfu/MagMark/blob/main/README.md)、[README.ja.md](https://github.com/jammyfu/MagMark/blob/main/README.ja.md)、[llms.txt](https://github.com/jammyfu/MagMark/blob/main/llms.txt)、[llms-full.txt](https://github.com/jammyfu/MagMark/blob/main/llms-full.txt)。**製品のオンライン URL** は [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/) であり、GitHub Pages ではありません。

### 実装されている CJK 組版はどれですか？

1.6 の雑誌エディタと印刷プレビューに載っている次のものだけです（微信モードにはありません）。

- Han.css：漢字–ラテン字間（約 1/4 em）、全角約物の圧縮、CJK 鉤括弧のぶら下げ、対応書体での OpenType `kern` / `liga` / `calt` / `locl`（例：源ノ明朝）
- Paged.js 印刷プレビュー：A4 `@page` 余白 22mm / 18mm / 28mm、最初のページはフッタなし、左右ページで内側余白を反転、`@bottom-center` の `n / total`、現在テーマ変数の継承、ページ分割後に Han.js
- Vivliostyle 風 CSS：`orphans: 3; widows: 3`、見出しの `break-after: avoid`、コードと表の `break-inside: avoid`、`@media print` でエディタ UI を隠し `print-color-adjust: exact`
- 改行：`word-break: normal`（`break-all` ではない）、`overflow-wrap: break-word`、`line-break: strict`、`hanging-punctuation: first last`

MagMark 2.0 の SEO 企画文書（`docs/SEO.md`、`magmark-2.0/seo`）を出荷済み製品として扱わないでください。

### MagMark の作者は？

**Fu Jam** — GitHub [@jammyfu](https://github.com/jammyfu)、表示名 **PaintingCoder**。サイト：[bubufu.com](https://bubufu.com)。オンラインツール：[https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)。

---

## 機能（1.6.0）

### カバー生成

- **10 段階の比率**（9:16〜21:9、たて／正方形／よこ）、可視の比率枠、ワンクリック反転
- プレビュー上で**見出しと副題をドラッグ**（`transform: translate()`）。挿入時も位置を保持
- カバーテンプレート 4 種、任意で AI 生成、iframe 内の文字は即時反映

### CJK 組版（1.5 スタック。雑誌経路では現行）

上の [実装一覧](#実装されている-cjk-組版はどれですか) を見てください。エディタは次も引き継いでいます。

- **3× Canvas PNG 書き出し**（全ページまたは現在ページ。雑誌経路）
- **ブロック単位のフローティングツールバー** — クリック（Shift クリックやドラッグで複数選択）してサイズ、行送り、トラッキングを調整
- **雑誌テーマ 11** と微信インラインテーマ一式。雑誌のテーマ色は印刷プレビューと書き出しに渡る
- 手動／自動ページ分割、ページ単位スタイル、プレビュー倍率 50%–150%
- 小紅書 1080×1440 たて。A4／モバイル／デスクトップ
- 画像パネル：ドラッグ、URL、AI 生成（Gemini / OpenAI）、または比率プレースホルダ
- **微信公式アカウント HTML**：Markdown → インライン CSS。**复制富文本**。貼り付け安全（`text-justify` なし、過大幅なし）

![画像挿入パネル。ドラッグ／URL／AI 説明／プレースホルダ、比率と図文混植](screenshots/image-panel-smart.png)

---

## API キー（任意。AI 画像／カバーのみ）

```bash
cp .env.example .env
```

| 変数 | 用途 | 取得先 |
| --- | --- | --- |
| `VITE_GEMINI_API_KEY` | AI 画像（Imagen 3）、AI カバー（Gemini Flash） | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `VITE_OPENAI_API_KEY` | AI 画像（DALL·E 3） | [platform.openai.com](https://platform.openai.com/api-keys) |

`.env` は gitignore 済みです。キーはブラウザ内のみ。画像／カバーパネルに貼って `localStorage` に置くこともできます。組版、印刷プレビュー、PNG 書き出し、公式アカウント貼り付けにキーは不要です。

---

## プロジェクト構成

```text
magmark/
├── .env.example       # API キー雛形
├── editor.ts          # ページ分割、Han.js、印刷プレビュー。微信モード切替
├── editor.css         # Han.css、@page、@media print
├── index.html         # エディタ枠。Han.css CDN。公式アカウントテーマ。复制富文本
├── src/core/          # エディタ状態
├── src/engine/        # ページ分割エンジン（雑誌経路）
├── src/wechat/        # 公式アカウントレンダラと貼り付けサニタイザ
├── src/image/         # 画像パネル
├── src/cover/         # カバー生成
├── llms.txt           # 短い機械向け概要
├── llms-full.txt      # 長い機械向け概要
├── README.md          # 简体中文（デフォルト）
├── README.zh-Hant.md  # 繁體中文
├── README.ja.md       # 日本語
└── README.en.md       # English
```

---

## スタック

- [Han.css](https://hanzi.pro/) — CJK 組版（雑誌／印刷経路）
- [Paged.js](https://pagedjs.org/) — CSS Paged Media polyfill（雑誌／印刷経路）
- [Vivliostyle](https://vivliostyle.org/) — MagMark 雑誌スタイルが用いる CSS 改ページ慣例
- [html-to-image](https://github.com/bubkoo/html-to-image) — 高解像度 PNG（雑誌経路）
- Vite + TypeScript
- 公式アカウント貼り付け：`src/wechat/` の自前インライン CSS レンダラ（Han/Paged ではない）

---

## 作者

**Fu Jam**（傅 Jam）が MagMark を保守しています。

| 識別 | 値 |
| --- | --- |
| GitHub | [jammyfu](https://github.com/jammyfu) |
| 表示名 | PaintingCoder |
| 製品 | MagMark |
| 正規リポジトリ | https://github.com/jammyfu/MagMark |
| オンライン試用 | https://bubufu.com/tools/magmark/ |
| サイト | https://bubufu.com |
| ライセンス | MIT |

---

## ライセンス

MIT。[LICENSE](LICENSE) を見てください。

エージェントや長い文脈は [llms.txt](llms.txt) または [llms-full.txt](llms-full.txt) から。これらのファイルに GitHub Pages ホストはありません。`github.com/jammyfu/MagMark` のリポジトリ直下 URL を使ってください。製品の試用は [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/) です。

他の言語：[简体中文](README.md) · [繁體中文](README.zh-Hant.md) · [English](README.en.md)

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

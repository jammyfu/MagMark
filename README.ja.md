<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/magmark-folio-white.svg"><img src="public/brand/magmark-folio.svg" width="80" height="80" alt="MagMark Folio ロゴ"></picture></p>
<h1 align="center">MagMark</h1>
<p align="center">Markdown で書き、雑誌のように整える。</p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.en.md">English</a> · 日本語</p>

MagMark は、中国語と中国語・英語混在文書を主な対象とした Markdown 編集・組版・書き出しツールです。原文を編集可能なまま保持し、レイアウトを確認して、ページ分割された記事、PNG、ブラウザー印刷による PDF、WeChat 向けリッチテキストに出力します。

> **2.0.0-beta.1 / `codex/2.0.0-beta` はテスト用ブランチです。** `main` は 1.6.0 のままです。[オンライン版](https://bubufu.com/tools/magmark/)に、この beta がデプロイされているとは限りません。重要な原稿は Markdown ファイルとして別途保存してください。

## ローカルで起動

リポジトリの CI に合わせて Node.js 22 を推奨します。

```bash
git clone --branch codex/2.0.0-beta --single-branch https://github.com/jammyfu/MagMark.git
cd MagMark
npm ci
npm run dev
```

Vite が表示する URL を開きます。通常のポートは 5173 です。Markdown を貼り付けるか開き、執筆・比較・プレビューを切り替え、組版パネルで調整してから書き出します。現在の UI の主要ラベルは中国語です。

## 利用できる機能

CodeMirror による原文編集と取り消し / やり直し、ドラッグ可能な分割表示、記事テーマとは独立した明暗ワークスペース、文字サイズ・行間・字間、ページ分割 / 連続表示、ローカル画像フォルダーの関連付け、画像説明と配置、ブラウザー内の自動保存と件数制限付き履歴、複数メディア比率の表紙テンプレートと PNG 出力。

対応するプレビュー文字はダブルクリックで原文に対応付けて編集できます。対応が曖昧、または原文が変更済みの場合は編集を拒否します。Folio ロゴとローカルに同梱した Lucide SVG アイコンを使用し、重要操作の文字ラベルは残します。UI アイコンは記事に挿入しません。

## 出力経路

**雑誌 / 印刷:** Han.css、Paged.js、CSS の改ページ規則を使用します。PDF は印刷プレビューを開き、ブラウザーの「PDF に保存」で作成します。PNG は現在のページまたは全ページを 3× サンプリングで出力します。プレビュー処理中やページあふれ検出時には、関連する出力を停止します。

**WeChat:** 別のレンダラーで、清掃済みのインライン CSS 付き HTML を生成します。雑誌用 Han.css / Paged.js は使いません。貼り付け先で画像と書式を確認し、保存後も再確認してください。MagMark はアカウントへのログインや自動公開を行いません。

## 制約とプライバシー

クラウドバックアップ、共同編集、文書ホスティングではありません。ローカル履歴はすべての組版設定や表紙セッションを保存するものではなく、ブラウザーデータの削除で原稿が失われる可能性があります。

ローカル優先でも完全オフラインではありません。外部フォント、Han.css、リモート画像にネットワーク通信が発生します。任意の AI 生成機能は設定したプロバイダーにリクエストを送信し、API Key の設定がブラウザーに残る場合があります。信頼できない共用端末ではキーを保存しないでください。

複雑な改ページ、遅い画像やフォント、実 OS の IME、他のブラウザー、実際の WeChat 保存結果は引き続き検証が必要です。日本語固有の組版規則を網羅する保証もありません。実験的な SDK / Typst / PrinceXML モジュールを、提供済みの本番出力サービスと解釈しないでください。[出力能力](docs/project-governance/SDK_EXPORT_CAPABILITIES.md)と[現在の計画](CURRENT_PLAN.md)を参照してください。

## 開発・作者・ライセンス

Vite + TypeScript、CodeMirror、unified / remark / rehype を使用しています。`npm run typecheck`、`npm test`、`npm run build`、`python3 tools/verify.py` が基本チェックです。ブラウザー回帰の準備は [TESTING_GUIDE.md](TESTING_GUIDE.md)、詳しい手順は[中国語ガイド](README.md)をご覧ください。

作成・保守：**[jammyfu](https://github.com/jammyfu)**。コードは [MIT License](LICENSE)。Lucide / Feather の ISC / MIT 表記は [LUCIDE-LICENSE.txt](public/brand/LUCIDE-LICENSE.txt) に保持しています。

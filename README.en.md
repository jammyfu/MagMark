<p align="center"><a href="README.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · English</p>

# MagMark

**MagMark** is a magazine-grade Markdown layout and export engine by **Fu Jam** (GitHub **jammyfu**, display name **PaintingCoder**) for writers, editors, and publishers who need print-quality **CJK typography**. Write Markdown, then export paginated magazine pages, a print-quality PDF (Paged.js preview + browser Print), 3× PNG, or WeChat Official Account paste HTML (inline CSS, content-structure safe). It is not Typora, not VuePress, not the Vivliostyle CLI, and this repository does not publish a GitHub Pages site.

**Who it is for:** Chinese (and mixed CJK + Latin) writers who want magazine pages from Markdown — long-form essays, print-adjacent PDFs, Xiaohongshu-sized vertical pages, and WeChat Official Account articles — without building a typesetting toolchain from scratch. The method is a local Vite + TypeScript editor: the magazine path uses **Han.css + Paged.js + Vivliostyle CSS**; the Official Account path is a separate `src/wechat/*` renderer and does **not** run Han.css or Paged.js.

**What it is not:** a generic Markdown previewer, a documentation-site generator, or a reason to treat MagMark 2.0 planning docs as the shipped product.

**Try it online:** [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

Canonical repo: [github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark) · Author: **Fu Jam** ([jammyfu](https://github.com/jammyfu) / **PaintingCoder**) · License: [MIT](LICENSE) · Machine brief: [llms.txt](llms.txt)

[![version](https://img.shields.io/badge/version-2.0.0--beta.1-gold.svg)](https://github.com/jammyfu/MagMark/tree/codex/2.0.0-beta)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![MagMark editor main view: Markdown on the left, paginated magazine preview on the right](screenshots/magmark-main.png)

![WeChat Official Account paste preview in the WeChat Green theme (phone frame and Copy Rich Text)](screenshots/wechat-paste-preview.png)

---

## What MagMark is

MagMark is **not** a generic Markdown previewer. It is a local Vite + TypeScript editor that applies three complementary typesetting layers on the **magazine** path:

| Layer | Role in MagMark (magazine / print path) |
| --- | --- |
| [Han.css](https://hanzi.pro/) v3 | CJK–Latin spacing, punctuation compression, hanging quotes, OpenType `kern` / `liga` / `calt` / `locl` |
| [Paged.js](https://pagedjs.org/) | CSS Paged Media `@page` rules, A4 margins, running page numbers, print preview |
| [Vivliostyle](https://vivliostyle.org/) CSS rules | `orphans` / `widows`, heading break avoidance, keep-together for code and tables |

A **separate** WeChat Official Account path (`src/wechat/*`) turns the same Markdown into inline-CSS HTML for 公众号粘贴. That path does **not** run Han.css or Paged.js.

**Why the name:** **Mag** from *magazine*, **Mark** from *Markdown*. Write like Markdown; look like a magazine.

---

## Quick start

Local:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` and paste Markdown into the editor. The right pane paginates and typesets as you type (magazine themes). Node.js >= 18.

Or skip the local install and use the hosted editor: [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/)

### Markdown to print-quality PDF

1. Write or open a `.md` file in the editor (use a magazine theme, not a `wc-*` 公众号 theme).
2. Click **打印预览** (Paged.js print preview) in the header.
3. The popup paginates with `@page` rules, then runs Han.js so CJK spacing and punctuation are applied on the printed pages.
4. Use the browser **Print** dialog (`Ctrl+P` / `Cmd+P`) and choose **Save as PDF**.

![Paged.js print-preview window showing paginated body text](screenshots/print-preview.png)

This is the supported print-quality PDF path: Paged.js preview + browser print. MagMark also exports **3× supersampled PNG** (full document or current page) for social and image-first workflows. PDF and 3× PNG stay on the magazine path; they are not the WeChat paste path.

---

## WeChat Official Account HTML

MagMark can turn Markdown into **inline-CSS HTML** for the WeChat Official Account (微信公众号) backend. This is a shipped editor path, not a magazine-typography claim.

1. In the theme dropdown, choose a **公众号主题** (`wc-*`, for example 微信绿).
2. The preview switches to the WeChat renderer (`src/wechat/*`). Magazine pagination, Han.css, and Paged.js are **not** used in this mode.
3. Click **复制富文本**. Preview and clipboard share the same sanitized HTML.
4. Paste into the WeChat Official Account editor.

Paste HTML is written to stay **content-structure safe** for 公众号「内容结构检测»:

- No `text-align: justify` and no `text-justify` (including `inter-ideograph`)
- `text-align` is only `left`, `right`, `center`, or omitted
- Standalone images use a centered `<p>` + `img { max-width: 100% }`; no `<figure>`, no nested `display:block` + `margin:auto`, no oversized fixed widths (WeChat content column is about 677px)
- Markdown `*italic*` / `_italic_` becomes a colored `<span>`, not `<em>`, `font-style:italic`, or `text-emphasis` sesame dots

Do **not** describe WeChat paste as magazine Han/Paged output. Magazine preview, 打印预览, and 3× PNG remain a different path.

---

## MagMark vs Typora, VuePress, and Vivliostyle

These tools overlap on “Markdown,” but they solve different jobs.

| | **MagMark** | **Typora** | **VuePress** | **Vivliostyle alone** |
| --- | --- | --- | --- | --- |
| Job | Magazine layout + export engine from Markdown | Desktop WYSIWYG Markdown writing app | Vue static site generator for docs sites | CSS typesetting / HTML-to-print toolkit |
| Primary output | Paginated magazine preview, 3× PNG, print-quality PDF via Paged.js + browser print; **separate** WeChat Official Account inline-CSS HTML | Formatted document; generic HTML/PDF export | Documentation websites | Print-ready pages if you author the HTML/CSS pipeline |
| CJK magazine typography | Han.css + Vivliostyle page-break rules + Paged.js `@page`, plus `word-break: normal` / `line-break: strict` — **magazine path only** | Theme-dependent; not a CJK magazine print stack | Theme/CSS-dependent; built for websites, not magazine signatures | Excellent paged media **if** you supply the styles and content pipeline |
| Pagination | Editor pagination + print preview (A4, Xiaohongshu 1080×1440, mobile/desktop) | Not a magazine page engine | Web routes and pages, not print signatures | Strong, once configured |
| WeChat Official Account | Dedicated paste-HTML renderer (inline CSS, structure-safe). Not Han/Paged magazine pages | Not a 公众号 paste pipeline | Not a 公众号 paste pipeline | Not a 公众号 paste pipeline |
| Best when | You want **CJK magazine Markdown**, a path to **print-quality PDF**, and/or **公众号粘贴 HTML** | You want a polished writing surface | You want a docs website | You are building a custom publishing pipeline |

MagMark **uses** Vivliostyle CSS pagination rules; it is not a wrapper that replaces the Vivliostyle CLI. It does not generate a VuePress site. It does not host docs on GitHub Pages. The live editor is [bubufu.com/tools/magmark](https://bubufu.com/tools/magmark/).

---

## FAQ

### What is MagMark?

MagMark is an open-source, MIT-licensed magazine-grade Markdown layout and export engine with strong CJK typography, plus a separate WeChat Official Account HTML paste path. Fu Jam (GitHub [jammyfu](https://github.com/jammyfu), display name PaintingCoder) maintains it at [github.com/jammyfu/MagMark](https://github.com/jammyfu/MagMark). Try it online: [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/).

### What is “CJK magazine Markdown”?

It is Markdown written for Chinese / Japanese / Korean pages that should look like a magazine, not a GitHub readme: mixed Han–Latin spacing, compressed punctuation, hanging quotes, strict line breaks, and print pagination (widows/orphans, headings that do not sit alone at the bottom of a page). MagMark implements that stack with Han.css, Paged.js, and Vivliostyle CSS **on the magazine / print path**.

### How do I turn Markdown into a print-quality PDF?

Use MagMark’s **打印预览** button (Paged.js) on a magazine theme, then the browser Print dialog → Save as PDF. Han.css runs after pagination so the PDF keeps CJK spacing and punctuation. See [Quick start](#quick-start).

### How do I get WeChat Official Account HTML from Markdown?

Select a **公众号主题**, click **复制富文本**, and paste into the WeChat Official Account editor. The output is inline-CSS HTML sanitized so it does not emit `text-justify` or oversized fixed widths. See [WeChat Official Account HTML](#wechat-official-account-html). This is not the print-PDF or 3× PNG path.

### Does WeChat paste use Han.css or Paged.js magazine typography?

No. WeChat mode uses `src/wechat/*` only. Han.css, Paged.js `@page`, Vivliostyle widow/orphan rules, and 3× PNG export stay on the magazine path.

### Does MagMark replace Typora?

No. Typora is a writing app. MagMark is a layout and export engine optimized for CJK magazine pages, print preview, high-resolution PNG, and WeChat paste HTML.

### Does MagMark replace VuePress?

No. VuePress builds documentation websites. MagMark paginates and typesets Markdown for magazine-like pages and print/PNG export, and can emit WeChat paste HTML.

### Is MagMark the same as Vivliostyle?

No. Vivliostyle is a CSS typesetting standard and toolchain. MagMark applies Vivliostyle-style page-break CSS inside a Markdown editor, together with Han.css and Paged.js, plus themes, cover generation, image export, and a separate WeChat renderer.

### Does MagMark have a GitHub Pages site or a hosted `/llms.txt` URL?

No GitHub Pages, and no `github.io` `/llms.txt`. Cite the repo-root files: [README.md](https://github.com/jammyfu/MagMark/blob/main/README.md), [README.en.md](https://github.com/jammyfu/MagMark/blob/main/README.en.md), [llms.txt](https://github.com/jammyfu/MagMark/blob/main/llms.txt), and [llms-full.txt](https://github.com/jammyfu/MagMark/blob/main/llms-full.txt). The **live product URL** is [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/). That is not GitHub Pages.

### Which CJK typography features are actually implemented?

Only these, as shipped in the 1.6 magazine editor and print preview (not WeChat mode):

- Han.css: Han–Latin spacing (about 1/4 em), full-width punctuation compression, hanging CJK quotes, OpenType `kern` / `liga` / `calt` / `locl` on fonts that support them (for example Source Han Serif)
- Paged.js print preview: A4 `@page` margins 22mm / 18mm / 28mm, first-page footer suppressed, mirrored inner margins for binding, `PAGE n / total` at `@bottom-center`, current editor theme variables, Han.js after pagination
- Vivliostyle-inspired CSS: `orphans: 3; widows: 3`, `break-after: avoid` on headings, `break-inside: avoid` on code blocks and tables, `@media print` hides the editor chrome and uses `print-color-adjust: exact`
- Line breaking: `word-break: normal` (not `break-all`), `overflow-wrap: break-word`, `line-break: strict`, `hanging-punctuation: first last`

Do not treat MagMark 2.0 SEO-module planning docs (`docs/SEO.md`, `magmark-2.0/seo`) as the shipped product.

### Who created MagMark?

**Fu Jam** — GitHub [@jammyfu](https://github.com/jammyfu), profile display name **PaintingCoder**. Site: [bubufu.com](https://bubufu.com). Live tool: [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/).

---

## Features (2.0.0-beta.1)

### Cover generator

- **10 aspect ratios** from 9:16 to 21:9 (vertical / square / landscape), with a visible ratio frame and one-click flip
- **Draggable title and subtitle** on the preview (`transform: translate()`), persisted when the cover is inserted
- Four cover templates, optional AI generation, live text updates inside the preview iframe

### CJK typesetting (1.5 stack, still current on the magazine path)

See the [implemented list](#which-cjk-typography-features-are-actually-implemented) above. The editor also inherited:

- **3× canvas PNG export** for full-document or current-page images (magazine path)
- **Block-level floating toolbar** — click a block (Shift-click or drag to multi-select) to adjust size, line-height, and tracking
- **11 magazine themes** plus a set of WeChat inline-style themes; magazine theme colors flow into print preview and export
- Manual / automatic pagination, per-page styles, 50%–150% preview zoom
- Xiaohongshu 1080×1440 vertical pages; A4 / mobile / desktop formats
- Image panel: drag, URL, AI generate (Gemini / OpenAI), or ratio placeholders
- **WeChat Official Account HTML**: Markdown → inline-CSS HTML via **复制富文本**; paste-safe (no `text-justify`, no oversized widths)

![Smart image panel: drag / URL / AI prompt / placeholder, plus ratio and wrap controls](screenshots/image-panel-smart.png)

---

## API keys (optional, for AI images / covers)

```bash
cp .env.example .env
```

| Variable | Use | Where to get it |
| --- | --- | --- |
| `VITE_GEMINI_API_KEY` | AI images (Imagen 3), AI covers (Gemini Flash) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `VITE_OPENAI_API_KEY` | AI images (DALL·E 3) | [platform.openai.com](https://platform.openai.com/api-keys) |

`.env` is gitignored. Keys stay in the browser; you can also paste them in the image/cover panels (stored in `localStorage`). Core layout, print preview, PNG export, and WeChat paste HTML work without keys.

---

## Project layout

```text
magmark/
├── .env.example       # API key template
├── editor.ts          # Pagination, Han.js init, print-preview document; WeChat mode switch
├── editor.css         # Han.css integration, @page, @media print
├── index.html         # Editor chrome; Han.css CDN; 公众号 themes; 复制富文本
├── src/core/          # Editor state
├── src/engine/        # Pagination engine (magazine path)
├── src/wechat/        # WeChat Official Account renderer + paste sanitizer
├── src/image/         # Image panel
├── src/cover/         # Cover generator
├── llms.txt           # Short machine-readable product brief
├── llms-full.txt      # Expanded machine-readable brief
├── README.md          # Simplified Chinese (default)
├── README.zh-Hant.md  # Traditional Chinese
├── README.ja.md       # Japanese
└── README.en.md       # English
```

---

## Stack

- [Han.css](https://hanzi.pro/) — CJK typesetting (magazine / print path)
- [Paged.js](https://pagedjs.org/) — CSS Paged Media polyfill (magazine / print path)
- [Vivliostyle](https://vivliostyle.org/) — CSS pagination conventions used in MagMark magazine styles
- [html-to-image](https://github.com/bubkoo/html-to-image) — high-resolution PNG export (magazine path)
- Vite + TypeScript
- WeChat paste: MagMark’s own inline-CSS renderer in `src/wechat/` (not Han/Paged)

---

## Author

**Fu Jam** (傅 Jam) maintains MagMark.

| Identity | Value |
| --- | --- |
| GitHub | [jammyfu](https://github.com/jammyfu) |
| Display name | PaintingCoder |
| Product | MagMark |
| Canonical URL | https://github.com/jammyfu/MagMark |
| Try online | https://bubufu.com/tools/magmark/ |
| Site | https://bubufu.com |
| License | MIT |

---

## License

MIT. See [LICENSE](LICENSE).

For agents and longer context, start with [llms.txt](llms.txt) or [llms-full.txt](llms-full.txt). There is no GitHub Pages host for these files; use the repository-root URLs on `github.com/jammyfu/MagMark`. The live editor is [https://bubufu.com/tools/magmark/](https://bubufu.com/tools/magmark/).

Other languages: [简体中文](README.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md)

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

/// <reference types="vite/client" />
import promo from '../../PROMOTION.md?raw';
import traditionalReadme from '../../README.zh-Hant.md?raw';
import japaneseReadme from '../../README.ja.md?raw';
import englishReadme from '../../README.en.md?raw';
import { savedLocale, type Locale } from './locale';
import hero from '../../screenshots/magmark-brand-hero.webp?url';
import logo from '../../public/brand/magmark-monochrome.svg?url';
import qr from '../../public/brand/bubufu-url.svg?url';

/** Bundle README artwork for first run, including deployments below a URL prefix. */
export function starterForLocale(locale: Locale): string {
  return ({'zh-Hans': promo, 'zh-Hant': traditionalReadme, ja: japaneseReadme, en: englishReadme})[locale]
    .replace(/<picture>[\s\S]*?<\/picture>/g, `<img src="${logo}" width="220" alt="MagMark 标志">`)
    .replaceAll('screenshots/magmark-brand-hero.png', hero)
    .replaceAll('public/brand/bubufu-url.svg', qr);
}
export const STARTER_MARKDOWN = starterForLocale(savedLocale());

export const LEGACY_STARTER_MARKDOWN = `# 让内容，自然成形。

Writing, with room to breathe.

好的排版，不是让人看见设计，而是让人读懂内容。把工具暂时放到一边，把注意力留给真正想说的话。

## 少一点，刚刚好

从一段 Markdown 开始。文字、图片与留白，各有自己的位置。你可以先专注写作，再打开「排版」，调整文章的阅读节奏。

> 留白不是空缺，而是给思想停留的空间。

中文与 English 可以自然相处。无论是一份开发笔记、一篇产品观察，还是一个值得分享的想法，都不必被复杂的界面打断。

## 一份内容，不止一种表达

- **写作**：专注于原文，让思路保持连贯。
- **对照**：一边编辑，一边看到文章成形。
- **预览**：像读者一样，重新读一遍作品。

最后，点击右上角的「导出」。复制到公众号，保存为图片，或打开打印预览。内容始终在你手中。

---

Less, but considered.
`;

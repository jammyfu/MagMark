/**
 * Capture real MagMark UI screenshots for the multilingual READMEs.
 * Requires a running `npm run dev` (default http://127.0.0.1:5173/).
 *
 * Usage: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'screenshots');
const BASE_URL = process.env.MAGMARK_URL || 'http://127.0.0.1:5173/';

const DEMO_MD = `# 春日长卷

像写 Markdown 一样简单，像做杂志一样精美。

**MagMark** 把中文与 Latin 混排交给 Han.css、Paged.js 与 Vivliostyle CSS：字距、标点、分页各司其职。它不是通用预览器，而是一条从正文到印刷页的排印路径。

> 「设计不是看起来像什么，而是它如何工作。」
> — Steve Jobs

## 写给编辑的一页

汉字与英文之间自动留出约四分之一 em；全角逗号、句号不再撑满一个字宽；标题不会独自挂在页尾。打开打印预览，再用浏览器另存为 PDF。

- 杂志主题：分页预览、3× PNG、印刷 PDF
- 公众号主题：内联 CSS，粘贴到微信后台

### 从草稿到纸面

在左侧写下正文，右侧即时分页。需要纸稿时走 Paged.js 打印预览；需要公众号时切换 \`wc-*\` 主题，复制富文本。两条路径不要混为一谈。

| 路径 | 引擎 | 产出 |
| --- | --- | --- |
| 杂志 / 印刷 | Han.css + Paged.js | 分页页、PDF、3× PNG |
| 微信公众号 | \`src/wechat/*\` | 内联 CSS HTML |
`;

fs.mkdirSync(OUT, { recursive: true });

async function setMarkdown(page, md) {
  await page.fill('#markdown-input', md);
  await page.evaluate(() => {
    const el = document.querySelector('#markdown-input');
    el?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const CJK_FALLBACK_CSS = `
:root { --font-ui: Inter, "WenQuanYi Micro Hei", "Droid Sans Fallback", system-ui, sans-serif !important; }
header, .controls-bar, .editor-panel, .panel-header, button, select, label, input, .logo-text {
  font-family: Inter, "WenQuanYi Micro Hei", "Droid Sans Fallback", system-ui, sans-serif !important;
}
#markdown-input, textarea {
  font-family: "WenQuanYi Micro Hei Mono", "WenQuanYi Micro Hei", "Droid Sans Fallback", monospace !important;
}
#mm-image-panel, #mm-image-panel * {
  font-family: Inter, "WenQuanYi Micro Hei", "Droid Sans Fallback", sans-serif !important;
}
`;

async function applyCjkFallback(page) {
  await page.addStyleTag({ content: CJK_FALLBACK_CSS });
  await page.evaluate(() => document.fonts && document.fonts.ready);
}

async function waitMagazineReady(page) {
  await page.waitForFunction(() => {
    const pages = document.querySelectorAll('.page-content, .page');
    const text = document.querySelector('.page-content')?.textContent || '';
    return pages.length > 0 && text.includes('春日长卷') && !text.includes('在左侧输入 Markdown');
  }, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || 'chrome',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#markdown-input');
  await applyCjkFallback(page);
  await setMarkdown(page, DEMO_MD);
  await waitMagazineReady(page);

  const mainPath = path.join(OUT, 'magmark-main.png');
  await page.screenshot({ path: mainPath, type: 'png' });
  console.log('wrote', mainPath);

  await page.click('#btn-image');
  await page.waitForSelector('#mm-image-panel');
  await page.waitForTimeout(400);
  const imagePath = path.join(OUT, 'image-panel-smart.png');
  await page.locator('#mm-image-panel').screenshot({ path: imagePath, type: 'png' });
  console.log('wrote', imagePath);
  await page.click('#mm-ip-close');
  await page.waitForTimeout(200);

  let printOk = false;
  try {
    const popupPromise = page.waitForEvent('popup', { timeout: 8000 });
    await page.click('#btn-print-preview');
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.addStyleTag({
      content: `body, h1, h2, h3, p, li, td { font-family: "WenQuanYi Micro Hei", "Droid Sans Fallback", serif !important; }`,
    }).catch(() => {});
    try {
      await popup.waitForSelector('.pagedjs_page', { timeout: 20000 });
    } catch {
      await popup.waitForSelector('.mm-page-section, body', { timeout: 8000 });
    }
    await popup.waitForTimeout(2000);
    const printPath = path.join(OUT, 'print-preview.png');
    await popup.screenshot({ path: printPath, type: 'png' });
    console.log('wrote', printPath);
    printOk = true;
    await popup.close();
  } catch (err) {
    console.warn('print-preview capture skipped:', err.message);
  }

  await page.selectOption('#ctrl-theme', 'wc-wechat_green');
  await page.waitForFunction(() => {
    const copy = document.getElementById('wc-copy-group');
    const preview = document.querySelector('.preview-area')?.textContent || '';
    return copy && getComputedStyle(copy).display !== 'none' && preview.includes('春日长卷');
  }, { timeout: 15000 });
  await page.waitForTimeout(600);
  const wechatPath = path.join(OUT, 'wechat-paste-preview.png');
  await page.screenshot({ path: wechatPath, type: 'png' });
  console.log('wrote', wechatPath);

  await browser.close();

  const required = ['magmark-main.png', 'image-panel-smart.png', 'wechat-paste-preview.png'];
  if (printOk) required.push('print-preview.png');
  for (const name of required) {
    const file = path.join(OUT, name);
    const stat = fs.statSync(file);
    if (stat.size < 8000) {
      throw new Error(`${name} looks too small (${stat.size} bytes)`);
    }
    console.log(name, stat.size, 'bytes');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

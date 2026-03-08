const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, '..', 'tmp', 'pagination-test');
const SAMPLES_DIR = path.join(__dirname, '..', 'tests', 'samples');

const FORMATS = ['a4', 'mobile', 'desktop', 'xiaohongshu'];
const SAMPLE_FILES = [
  'test-article.md',
  '05_lists.md',
  '07_tables.md',
  '09_widows_orphans.md',
  '15_mixed_content.md',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForPages(page) {
  await page.waitForFunction(() => {
    const pages = document.querySelectorAll('#preview-area .page');
    return pages.length > 0 && [...pages].some((p) => getComputedStyle(p).display !== 'none');
  });
}

async function loadMarkdown(page, markdown) {
  await page.locator('#markdown-input').fill(markdown);
  await page.locator('#markdown-input').dispatchEvent('input');
  await page.waitForTimeout(1400);
  await waitForPages(page);
}

async function selectFormat(page, format) {
  await page.selectOption('#ctrl-format', format);
  await page.waitForTimeout(1400);
  await waitForPages(page);
}

async function pageCount(page) {
  return await page.locator('#preview-area .page').count();
}

async function goToPage(page, pageNum, total) {
  await page.evaluate((target) => {
    const pages = Array.from(document.querySelectorAll('#preview-area .page'));
    pages.forEach((node, idx) => {
      node.style.display = idx + 1 === target ? 'block' : 'none';
    });
    const info = document.querySelector('#page-info');
    if (info) info.textContent = `第 ${target} / ${pages.length} 页`;
  }, pageNum);
  await page.waitForTimeout(60);
}

async function measureVisiblePage(page, pageNum, totalPages) {
  return await page.evaluate(({ pageNum, totalPages }) => {
    const visible = Array.from(document.querySelectorAll('#preview-area .page')).find(
      (node) => getComputedStyle(node).display !== 'none'
    );
    if (!visible) return null;

    const pageContent = visible.querySelector('.page-content');
    const children = pageContent ? Array.from(pageContent.children) : [];
    const pageRect = visible.getBoundingClientRect();
    const pageStyle = getComputedStyle(visible);
    const paddingTop = parseFloat(pageStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0;
    const footer = visible.querySelector('.page-footer');
    const footerRect = footer ? footer.getBoundingClientRect() : null;
    const topLimit = pageRect.top + paddingTop;
    const bottomLimit = footerRect ? footerRect.top - 8 : pageRect.bottom - paddingBottom;

    let maxBottom = topLimit;
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    }

    const usedHeight = Math.max(0, maxBottom - topLimit);
    const availableHeight = Math.max(0, bottomLimit - topLimit);
    const gap = Math.max(0, bottomLimit - maxBottom);
    const overflow = Math.max(0, maxBottom - bottomLimit);
    const usageRatio = availableHeight > 0 ? usedHeight / availableHeight : 0;
    const isLastPage = pageNum === totalPages;

    return {
      pageNum,
      totalPages,
      isLastPage,
      childCount: children.length,
      availableHeight: Math.round(availableHeight),
      usedHeight: Math.round(usedHeight),
      gap: Math.round(gap),
      overflow: Math.round(overflow),
      usageRatio: Number(usageRatio.toFixed(3)),
      suspiciousGap: !isLastPage && gap > Math.min(240, availableHeight * 0.22),
      suspiciousOverflow: overflow > 4,
    };
  }, { pageNum, totalPages });
}

async function run() {
  ensureDir(OUTPUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });

  const results = [];
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  for (const file of SAMPLE_FILES) {
    const markdown = fs.readFileSync(path.join(SAMPLES_DIR, file), 'utf8');

    for (const format of FORMATS) {
      await selectFormat(page, format);
      await loadMarkdown(page, markdown);

      const total = await pageCount(page);
      for (let i = 1; i <= total; i++) {
        await goToPage(page, i, total);
        const metrics = await measureVisiblePage(page, i, total);
        if (!metrics) continue;

        const result = { sample: file, format, ...metrics };
        results.push(result);

        if (metrics.suspiciousGap || metrics.suspiciousOverflow) {
          const shotName = `${path.basename(file, '.md')}-${format}-p${i}.png`;
          await page.screenshot({ path: path.join(OUTPUT_DIR, shotName), fullPage: true });
        }
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    testedSamples: SAMPLE_FILES,
    testedFormats: FORMATS,
    results,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

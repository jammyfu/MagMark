const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const baseUrl = process.argv[2] || 'http://127.0.0.1:5174';
const scenarioName = process.argv[3];
const article = fs.readFileSync(path.resolve(__dirname, 'openclaw-article.md'), 'utf8');

const SCENARIOS = {
  'a4-default': { format: 'a4', scale: 1 },
  'mobile-default': { format: 'mobile', scale: 1 },
  'desktop-default': { format: 'desktop', scale: 1 },
  'xiaohongshu-default': { format: 'xiaohongshu', scale: 0.75 },
  'a4-large': { format: 'a4', scale: 1, fontSize: 18, lineHeight: 2 },
  'mobile-large': { format: 'mobile', scale: 1, fontSize: 18, lineHeight: 2 },
  'xiaohongshu-adjusted': { format: 'xiaohongshu', scale: 0.75, fontSize: 24, lineHeight: 2.6 },
};

if (!SCENARIOS[scenarioName]) {
  console.error(`Unknown scenario: ${scenarioName}`);
  process.exit(2);
}

async function setCheckbox(page, selector, checked) {
  await page.locator(selector).evaluate((el, value) => {
    el.checked = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, checked);
}

async function setRangeValue(page, selector, value) {
  await page.locator(selector).evaluate((el, nextValue) => {
    el.value = String(nextValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function collectMetrics(page) {
  return await page.evaluate(() => {
    const pageNodes = Array.from(document.querySelectorAll('.preview-area .page'));
    const originalDisplays = pageNodes.map((node) => node.style.display);
    pageNodes.forEach((node) => {
      node.style.display = 'block';
    });

    const metrics = pageNodes.map((pageNode, index) => {
      const pageRect = pageNode.getBoundingClientRect();
      const content = pageNode.querySelector('.page-content, .scroll-container');
      const contentRect = content ? content.getBoundingClientRect() : pageRect;
      const footer = pageNode.querySelector('.page-footer');
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const limitBottom = footerRect ? footerRect.top : contentRect.bottom;
      const blocks = Array.from(pageNode.querySelectorAll('.magmark > *'));

      let furthestBottom = contentRect.top;
      const overflowingBlocks = [];

      blocks.forEach((el, blockIndex) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const effectiveBottom = rect.bottom + marginBottom;
        furthestBottom = Math.max(furthestBottom, effectiveBottom);

        if (effectiveBottom > limitBottom + 0.5 || effectiveBottom > pageRect.bottom + 0.5) {
          overflowingBlocks.push({
            blockIndex,
            tag: el.tagName,
            text: (el.textContent || '').trim().slice(0, 60),
            effectiveBottom: Math.round(effectiveBottom),
            limitBottom: Math.round(limitBottom),
          });
        }
      });

      const usableHeight = Math.max(1, limitBottom - contentRect.top);
      const usedHeight = Math.max(0, furthestBottom - contentRect.top);

      return {
        page: index + 1,
        blockCount: blocks.length,
        fillRatio: Number((usedHeight / usableHeight).toFixed(3)),
        overflowingBlocks,
      };
    });

    pageNodes.forEach((node, index) => {
      node.style.display = originalDisplays[index];
    });

    return metrics;
  });
}

async function inspectTypography(page) {
  return await page.evaluate(() => {
    const heading = document.querySelector('.page-content h3, .page-content h2');
    const paragraph = document.querySelector('.page-content p');
    return {
      headingFontSize: heading ? getComputedStyle(heading).fontSize : null,
      paragraphFontSize: paragraph ? getComputedStyle(paragraph).fontSize : null,
      paragraphLineHeight: paragraph ? getComputedStyle(paragraph).lineHeight : null,
    };
  });
}

async function main() {
  const scenario = SCENARIOS[scenarioName];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#markdown-input');
  await page.locator('#markdown-input').fill(article);
  await page.locator('#ctrl-format').selectOption(scenario.format);
  await page.locator('#btn-multi').click();
  await page.locator('#ctrl-scale').selectOption(String(scenario.scale));
  await setCheckbox(page, '#chk-manual-pagination', false);
  await setCheckbox(page, '#chk-show-paragraph-dividers', true);

  if (scenario.fontSize !== undefined) {
    await setRangeValue(page, '#ctrl-fontsize', scenario.fontSize);
  }
  if (scenario.lineHeight !== undefined) {
    await setRangeValue(page, '#ctrl-lineheight', scenario.lineHeight);
  }

  await page.waitForTimeout(1600);

  const result = {
    name: scenarioName,
    format: scenario.format,
    pageInfo: await page.evaluate(() => document.querySelector('#page-info')?.textContent || null),
    typography: await inspectTypography(page),
    metrics: await collectMetrics(page),
  };

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

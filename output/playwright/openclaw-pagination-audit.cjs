const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const baseUrl = process.argv[2] || 'http://127.0.0.1:5174';
const articlePath = path.resolve(__dirname, 'openclaw-article.md');
const article = fs.readFileSync(articlePath, 'utf8');

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
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const effectiveTop = rect.top - marginTop;
        const effectiveBottom = rect.bottom + marginBottom;
        furthestBottom = Math.max(furthestBottom, effectiveBottom);

        const exceedsFooter = effectiveBottom > limitBottom + 0.5;
        const exceedsPage = effectiveBottom > pageRect.bottom + 0.5;
        const exceedsWidth = rect.right > contentRect.right + 0.5;

        if (exceedsFooter || exceedsPage || exceedsWidth) {
          overflowingBlocks.push({
            blockIndex,
            tag: el.tagName,
            text: (el.textContent || '').trim().slice(0, 100),
            effectiveBottom: Math.round(effectiveBottom),
            limitBottom: Math.round(limitBottom),
            pageBottom: Math.round(pageRect.bottom),
            exceedsFooter,
            exceedsPage,
            exceedsWidth,
          });
        }
      });

      const usableHeight = Math.max(1, limitBottom - contentRect.top);
      const usedHeight = Math.max(0, furthestBottom - contentRect.top);
      const fillRatio = Number((usedHeight / usableHeight).toFixed(3));
      const blankRatio = Number((1 - Math.min(1, fillRatio)).toFixed(3));

      const hrVisibleCount = Array.from(pageNode.querySelectorAll('hr')).filter((hr) => {
        const style = window.getComputedStyle(hr);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length;

      return {
        page: index + 1,
        className: pageNode.className,
        width: Math.round(pageRect.width),
        height: Math.round(pageRect.height),
        blockCount: blocks.length,
        fillRatio,
        blankRatio,
        hrVisibleCount,
        overflowingBlocks,
      };
    });

    pageNodes.forEach((node, index) => {
      node.style.display = originalDisplays[index];
    });

    return metrics;
  });
}

async function prepareScenario(page, scenario) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#markdown-input');
  await page.locator('#markdown-input').fill(article);

  await page.locator('#ctrl-format').selectOption(scenario.format);
  await page.locator(scenario.viewMode === 'scroll' ? '#btn-scroll' : '#btn-multi').click();

  if (scenario.scale) {
    await page.locator('#ctrl-scale').selectOption(String(scenario.scale));
  }
  if (typeof scenario.manualPagination === 'boolean') {
    await setCheckbox(page, '#chk-manual-pagination', scenario.manualPagination);
  }
  if (typeof scenario.showParagraphDividers === 'boolean') {
    await setCheckbox(page, '#chk-show-paragraph-dividers', scenario.showParagraphDividers);
  }
  if (scenario.fontSize !== undefined) {
    await setRangeValue(page, '#ctrl-fontsize', scenario.fontSize);
  }
  if (scenario.lineHeight !== undefined) {
    await setRangeValue(page, '#ctrl-lineheight', scenario.lineHeight);
  }
  if (scenario.letterSpacing !== undefined) {
    await setRangeValue(page, '#ctrl-letterspacing', scenario.letterSpacing);
  }

  await page.waitForTimeout(1400);
}

async function inspectTypography(page) {
  return await page.evaluate(() => {
    const heading = document.querySelector('.page-content h3, .scroll-container h3');
    const paragraph = document.querySelector('.page-content p, .scroll-container p');
    const headingStyle = heading ? window.getComputedStyle(heading) : null;
    const paragraphStyle = paragraph ? window.getComputedStyle(paragraph) : null;
    return {
      headingFontSize: headingStyle?.fontSize || null,
      headingLineHeight: headingStyle?.lineHeight || null,
      paragraphFontSize: paragraphStyle?.fontSize || null,
      paragraphLineHeight: paragraphStyle?.lineHeight || null,
    };
  });
}

async function runScenario(page, scenario) {
  await prepareScenario(page, scenario);

  const pageInfo = await page.locator('#page-info').textContent().catch(() => null);
  const metrics = await collectMetrics(page);
  const typography = await inspectTypography(page);
  const screenshotPath = path.resolve(__dirname, `${scenario.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    name: scenario.name,
    format: scenario.format,
    pageInfo,
    typography,
    metrics,
    screenshotPath,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1720, height: 1600 } });

  const scenarios = [
    { name: 'openclaw-a4-default', format: 'a4', viewMode: 'multi', scale: 1, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-mobile-default', format: 'mobile', viewMode: 'multi', scale: 1, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-desktop-default', format: 'desktop', viewMode: 'multi', scale: 1, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-xiaohongshu-default', format: 'xiaohongshu', viewMode: 'multi', scale: 0.75, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-a4-large-text', format: 'a4', viewMode: 'multi', scale: 1, fontSize: 18, lineHeight: 2, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-mobile-large-text', format: 'mobile', viewMode: 'multi', scale: 1, fontSize: 18, lineHeight: 2, manualPagination: false, showParagraphDividers: true },
    { name: 'openclaw-xiaohongshu-adjusted', format: 'xiaohongshu', viewMode: 'multi', scale: 0.75, fontSize: 24, lineHeight: 2.6, manualPagination: false, showParagraphDividers: true },
  ];

  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(page, scenario));
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

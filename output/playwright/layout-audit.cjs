const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const baseUrl = process.argv[2] || 'http://127.0.0.1:5174';
const samplePath = path.resolve(__dirname, '../../tests/samples/15_mixed_content.md');
const hrSamplePath = path.resolve(__dirname, '../../tests/samples/13_horizontal_rules.md');
const mixedContent = fs.readFileSync(samplePath, 'utf8');
const hrContent = fs.readFileSync(hrSamplePath, 'utf8');

async function collectPageMetrics(page) {
  return await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.preview-area .page'));
    return pages.map((pageEl, index) => {
      const pageRect = pageEl.getBoundingClientRect();
      const content = pageEl.querySelector('.page-content, .scroll-container');
      const footer = pageEl.querySelector('.page-footer');
      const blocks = Array.from(pageEl.querySelectorAll('.magmark > *'));
      const overflowingBlocks = blocks
        .map((el, blockIndex) => {
          const r = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const marginBottom = parseFloat(style.marginBottom) || 0;
          const marginTop = parseFloat(style.marginTop) || 0;
          const footerTop = footer ? footer.getBoundingClientRect().top : pageRect.bottom;
          const exceedsFooter = r.bottom + marginBottom > footerTop + 0.5;
          const exceedsPage = r.bottom + marginBottom > pageRect.bottom + 0.5;
          const exceedsWidth = r.right > pageRect.right + 0.5;
          return exceedsFooter || exceedsPage || exceedsWidth
            ? {
                blockIndex,
                tag: el.tagName,
                text: (el.textContent || '').trim().slice(0, 80),
                bottom: Math.round(r.bottom),
                pageBottom: Math.round(pageRect.bottom),
                footerTop: Math.round(footerTop),
                marginTop,
                marginBottom,
                exceedsFooter,
                exceedsPage,
                exceedsWidth,
              }
            : null;
        })
        .filter(Boolean);

      const hrVisibleCount = Array.from(pageEl.querySelectorAll('hr')).filter((hr) => {
        const style = window.getComputedStyle(hr);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length;

      return {
        page: index + 1,
        className: pageEl.className,
        width: Math.round(pageRect.width),
        height: Math.round(pageRect.height),
        blockCount: blocks.length,
        overflowingBlocks,
        hrVisibleCount,
        contentScrollHeight: content ? content.scrollHeight : null,
        contentClientHeight: content ? content.clientHeight : null,
      };
    });
  });
}

async function setCheckbox(page, selector, checked) {
  await page.locator(selector).evaluate((el, value) => {
    el.checked = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, checked);
}

async function runScenario(page, scenario) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#markdown-input');
  await page.locator('#markdown-input').fill(scenario.content);

  if (scenario.format) {
    await page.locator('#ctrl-format').selectOption(scenario.format);
  }
  if (scenario.viewMode === 'scroll') {
    await page.locator('#btn-scroll').click();
  } else {
    await page.locator('#btn-multi').click();
  }
  if (scenario.scale) {
    await page.locator('#ctrl-scale').selectOption(String(scenario.scale));
  }
  if (typeof scenario.manualPagination === 'boolean') {
    await setCheckbox(page, '#chk-manual-pagination', scenario.manualPagination);
  }
  if (typeof scenario.showParagraphDividers === 'boolean') {
    await setCheckbox(page, '#chk-show-paragraph-dividers', scenario.showParagraphDividers);
  }
  if (scenario.fontSize) {
    await page.locator('#ctrl-fontsize').fill(String(scenario.fontSize));
    await page.locator('#ctrl-fontsize').dispatchEvent('input');
  }
  if (scenario.lineHeight) {
    await page.locator('#ctrl-lineheight').fill(String(scenario.lineHeight));
    await page.locator('#ctrl-lineheight').dispatchEvent('input');
  }
  if (scenario.letterSpacing !== undefined) {
    await page.locator('#ctrl-letterspacing').fill(String(scenario.letterSpacing));
    await page.locator('#ctrl-letterspacing').dispatchEvent('input');
  }

  await page.waitForTimeout(1200);

  const pageInfo = await page.locator('#page-info').textContent().catch(() => null);
  const metrics = await collectPageMetrics(page);
  const screenshotPath = path.resolve(__dirname, `${scenario.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    name: scenario.name,
    pageInfo,
    metrics,
    screenshotPath,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });

  const scenarios = [
    {
      name: 'a4-multi-default',
      content: mixedContent,
      format: 'a4',
      viewMode: 'multi',
      scale: 1,
      manualPagination: false,
      showParagraphDividers: true,
    },
    {
      name: 'mobile-multi-tight',
      content: mixedContent,
      format: 'mobile',
      viewMode: 'multi',
      scale: 1,
      fontSize: 18,
      lineHeight: 2.1,
      manualPagination: false,
      showParagraphDividers: true,
    },
    {
      name: 'desktop-multi-loose',
      content: mixedContent,
      format: 'desktop',
      viewMode: 'multi',
      scale: 1,
      fontSize: 20,
      lineHeight: 2.3,
      letterSpacing: 0.08,
      manualPagination: false,
      showParagraphDividers: true,
    },
    {
      name: 'xiaohongshu-multi-default',
      content: mixedContent,
      format: 'xiaohongshu',
      viewMode: 'multi',
      scale: 0.75,
      manualPagination: false,
      showParagraphDividers: true,
    },
    {
      name: 'hr-hidden-manual-off',
      content: hrContent,
      format: 'a4',
      viewMode: 'multi',
      scale: 1,
      manualPagination: false,
      showParagraphDividers: false,
    },
    {
      name: 'hr-visible-manual-on',
      content: hrContent,
      format: 'a4',
      viewMode: 'multi',
      scale: 1,
      manualPagination: true,
      showParagraphDividers: true,
    },
    {
      name: 'scroll-mobile-hidden-divider',
      content: hrContent,
      format: 'mobile',
      viewMode: 'scroll',
      scale: 1,
      manualPagination: false,
      showParagraphDividers: false,
    },
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

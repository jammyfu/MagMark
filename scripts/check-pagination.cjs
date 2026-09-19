'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { buildPaginationBundle } = require('./bundle-pagination.cjs');
const root = path.resolve(__dirname, '..');
const fixture = fs.readFileSync(path.join(root, 'tests/pagination-browser-cases.js'), 'utf8');
const withDeadline = async promise => {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Pagination exceeded the 15-second progress watchdog')), 15000);
    })]);
  } finally { clearTimeout(timer); }
};
async function main() {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  let passed = 0, failed = 0;
  try {
    const bundle = buildPaginationBundle();
    const catalog = await browser.newPage();
    await catalog.addScriptTag({ content: fixture });
    const names = await catalog.evaluate(() => Object.keys(window.paginationCases));
    await catalog.close();
    if (!names.length) throw new Error('No pagination fixtures found');
    for (const name of names) {
      const page = await browser.newPage();
      try {
        await page.setContent('<!doctype html><html lang="zh-Hans"><head></head><body></body></html>');
        await page.addScriptTag({ content: bundle });
        await page.addScriptTag({ content: fixture });
        await page.addStyleTag({ content: await page.evaluate(() => window.paginationFixtureCSS) });
        await withDeadline(page.evaluate(name => window.paginationCases[name](), name));
        passed++; console.log(`PASS ${name}`);
      } catch (error) {
        failed++; console.error(`FAIL ${name}: ${error.message}`);
      } finally { await page.close(); }
    }
    console.log(JSON.stringify({ browser: browser.version(), passed, failed, scope: 'controlled DOM pagination fixtures' }));
  } finally { await browser.close(); }
  if (failed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });

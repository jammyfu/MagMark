/* Real Chromium checks through the production CoverPanel entry; no paid/network API calls. */
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crc32 } = require('node:zlib');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'magmark-responsive-'));
  const bundle = buildSync({ entryPoints: ['tests/responsive-cover-entry.ts'], bundle: true, platform: 'browser', format: 'iife', write: false }).outputFiles[0].text;
  const browser = await chromium.launch({ headless: true });
  let count = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url() === 'http://magmark.test/brand/magmark-monochrome.svg'
      ? route.fulfill({ contentType: 'image/svg+xml', body: fs.readFileSync('public/brand/magmark-monochrome.svg') }) : route.abort());
    await page.setContent('<!doctype html><meta charset="utf-8"><base href="http://magmark.test/"><button id="open">封面</button>');
    await page.addStyleTag({ content: fs.readFileSync('editor.css', 'utf8') + fs.readFileSync('workspace.css', 'utf8') });
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => { window.inserted = ''; window.freeform = new coverFixture.CoverPanel(html => window.inserted = html); freeform.open('一套设计，多种画幅', '同一篇稿，只换版面'); });
    await page.locator('#mm-cp-responsive').click();
    await page.waitForFunction(() => document.querySelector('#rc-canvas')?.width === 940);
    async function check(name, fn) { assert.ok(await page.evaluate(fn), name); console.log(`PASS ${++count}: ${name}`); }
    await check('public entry opens responsive editor with current title', () => document.querySelector('#rc-title').value === '一套设计，多种画幅');
    await check('six variants rendered', () => document.querySelectorAll('.rc-variant').length === 6);
    await page.locator('[data-variant="wx-square"]').click();
    await page.locator('#rc-scope').selectOption('one');
    await page.locator('#rc-subtitle').fill('方图专用副标题');
    await page.locator('#rc-y').fill('20'); await page.locator('#rc-y').dispatchEvent('change');
    await page.locator('[data-variant="wx-wide"]').click();
    await page.locator('#rc-scope').selectOption('all');
    await page.locator('#rc-title').fill('共享文案更新');
    await page.locator('[data-variant="wx-square"]').click();
    await page.locator('#rc-scope').selectOption('one');
    await check('shared text updates but local content survives', () => document.querySelector('#rc-title').value === '共享文案更新' && document.querySelector('#rc-subtitle').value === '方图专用副标题');
    await check('local position survives media switching', () => Number(document.querySelector('#rc-y').value) === 20);
    await page.locator('#rc-title').fill('单独标题'); await page.locator('#rc-undo').click();
    await check('undo preserves source of title', () => document.querySelector('#rc-title').value === '共享文案更新');
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#rc-reset').click();
    await check('reset follows master again', () => document.querySelector('#rc-subtitle').value === '同一篇稿，只换版面');
    await page.locator('#rc-guides').check();
    const zipPromise = page.waitForEvent('download'); await page.locator('#rc-zip').click();
    const zip = await zipPromise, zipPath = path.join(temp, 'covers.zip'); await zip.saveAs(zipPath);
    const data = fs.readFileSync(zipPath); let offset = 0; const dimensions = [];
    while (data.readUInt32LE(offset) === 0x04034b50) {
      const size = data.readUInt32LE(offset + 18), length = data.readUInt16LE(offset + 26), extra = data.readUInt16LE(offset + 28);
      const start = offset + 30 + length + extra, png = data.subarray(start, start + size);
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      if (crc32) assert.equal(crc32(png), data.readUInt32LE(offset + 14));
      dimensions.push([png.readUInt32BE(16), png.readUInt32BE(20)]); offset = start + size;
    }
    assert.deepEqual(dimensions, [[940,400],[1080,1080],[1080,1440],[1600,900],[1080,1920],[1080,1350]]); console.log(`PASS ${++count}: six real PNGs with exact dimensions and valid ZIP CRCs`);
    await page.locator('#rc-insert').click(); await page.waitForFunction(() => window.inserted.length > 100);
    await check('insert contains actual PNG and no editor controls', () => inserted.includes('data:image/png;base64,') && !/contenteditable|rc-guides/.test(inserted));
    await page.evaluate(() => freeform.open()); await page.locator('#mm-cp-responsive').click();
    await check('reopening preserves responsive draft', () => document.querySelector('#rc-title').value === '共享文案更新');
    await page.setViewportSize({ width: 390, height: 844 });
    await check('mobile dialog fits viewport', () => document.querySelector('#mm-responsive-cover').getBoundingClientRect().width <= 390);
    await page.locator('#rc-back').click();
    await check('original freeform draft is unchanged', () => document.querySelector('#mm-cp-title-input').value === '一套设计，多种画幅');
    await page.evaluate(() => freeform.destroy());
    await check('destroy cleans up both dialogs', () => !document.querySelector('.mm-cp-overlay') && !document.querySelector('#mm-responsive-cover'));
    assert.deepEqual(errors, []); console.log(`PASS ${++count}: no unhandled browser errors`);
    console.log(`${count} responsive cover browser checks passed.`);
  } finally { await browser.close(); fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });

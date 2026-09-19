'use strict';
// Real Chromium UI interactions with the actual entry bundled offline. This does
// also supports local HTTP navigation for built assets; never claims deployment or OS IME coverage.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const http = require('node:http');
const { build } = require('esbuild');
const { chromium } = require('playwright');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'magmark-workspace-'));
  let browser, server;
  const failures = [];
  let passed = 0;
  try {
    const production = process.env.WORKSPACE_BUILD === '1';
    const network = production && process.env.WORKSPACE_NETWORK === '1';
    const bundle = path.join(temp, 'app.js');
    if (!production) await build({ entryPoints: ['app.ts'], bundle: true, platform: 'browser', format: 'iife', outfile: bundle });
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(7000);
    page.on('dialog', dialog => dialog.accept());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let origin = '';
    const loadedAssets = [];
    if (network) {
      const root = path.resolve('dist');
      server = http.createServer((request, response) => {
        try {
          const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
          const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
          if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
          const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
          response.writeHead(200, {'Content-Type':mime,'Cache-Control':'no-store'}); fs.createReadStream(file).pipe(response);
        } catch { response.writeHead(404); response.end(); }
      });
      await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
      origin = `http://127.0.0.1:${server.address().port}`;
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      page.on('response', response => { if (response.url().startsWith(origin + '/assets/') && response.status() === 200) loadedAssets.push(response.url()); });
      await page.goto(origin, {waitUntil:'load'});
    } else {
      await page.route('**/*', route => route.abort());
      const entry = fs.readFileSync(production ? 'dist/index.html' : 'index.html', 'utf8');
      const html = entry.replace(/<link\b[^>]*>/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
      await page.setContent(html);
      if (production) {
        const css = [...entry.matchAll(/href="(\.\/assets\/[^" ]+\.css)"/g)].map(match => fs.readFileSync(path.join('dist', match[1]), 'utf8')).join('\n');
        const script = entry.match(/src="(\.\/assets\/[^" ]+\.js)"/);
        assert(css && script, 'Production assets must exist; run npm run build first.');
        await page.addStyleTag({content: css});
        await page.addScriptTag({type:'module', content: fs.readFileSync(path.join('dist', script[1]), 'utf8')});
      } else {
        await page.addStyleTag({ content: fs.readFileSync('editor.css', 'utf8') + '\n' + fs.readFileSync('workspace.css', 'utf8') });
        await page.addScriptTag({ content: fs.readFileSync(bundle, 'utf8') });
      }
    }
    await page.waitForTimeout(900);
    const source = () => page.locator('#markdown-input').inputValue();
    const setSource = async value => {
      await page.evaluate(value => { const input = document.getElementById('markdown-input'); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); }, value);
      await page.waitForTimeout(700);
    };
    const test = async (name, fn) => { try { await fn(); passed++; console.log(`PASS ${name}`); } catch (error) { failures.push({name, message:error.message}); console.error(`FAIL ${name}: ${error.message}`); await page.evaluate(() => document.querySelector('dialog[open]')?.close()); } };
    if (network) await test('production HTML loads real JavaScript and CSS over local HTTP', async () => {
      assert.equal(await page.evaluate(() => location.origin),origin);
      assert(loadedAssets.some(url=>url.endsWith('.js'))); assert(loadedAssets.some(url=>url.endsWith('.css')));
    });
    await test('desktop starts with source and preview, not an expanded control wall', async () => {
      assert.equal(await page.locator('body').getAttribute('data-workspace'), 'compare');
      assert(await page.locator('.cm-content').isVisible()); assert(await page.locator('#preview-panel').isVisible());
      assert(!(await page.locator('#layout-inspector').isVisible()));
      const expectedHeading = fs.readFileSync('PROMOTION.md', 'utf8').match(/^# .+$/m)?.[0];
      assert(expectedHeading, 'The current zh-Hans starter must have a heading');
      assert.equal((await source()).match(/^# .+$/m)?.[0], expectedHeading);
      assert(!(await page.locator('#char-count').innerText()).startsWith('0 '));
    });
    await test('view switches preserve literal source and editor state', async () => {
      const before = await source();
      await page.locator('[data-workspace-view="write"]').click(); assert(!(await page.locator('#preview-panel').isVisible()));
      await page.locator('[data-workspace-view="preview"]').click(); assert(!(await page.locator('#editor-panel').isVisible()));
      await page.locator('[data-workspace-view="compare"]').click(); assert.equal(await source(), before);
    });
    await test('Chinese and emoji input stay literal and undoable', async () => {
      await page.locator('.cm-content').click(); await page.keyboard.press('Control+Home');
      const before = await source(); await page.keyboard.insertText('中文API👩🏽‍💻𠀀\n');
      assert((await source()).startsWith('中文API👩🏽‍💻𠀀\n'));
      await page.keyboard.press('Control+z'); assert.equal(await source(), before);
    });
    await test('cursor arrows do not navigate magazine pages', async () => {
      const before = await page.locator('#page-info').innerText();
      await page.locator('.cm-content').click(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#page-info').innerText(), before);
    });
    await test('inspector is optional, advanced settings are collapsed, Escape restores focus', async () => {
      await page.locator('#btn-layout').click(); assert(await page.locator('#layout-inspector').isVisible());
      assert(!(await page.locator('#ctrl-letterspacing').isVisible()));
      await page.locator('.inspector-advanced summary').click(); assert(await page.locator('#ctrl-letterspacing').isVisible());
      await page.keyboard.press('Escape'); assert(!(await page.locator('#layout-inspector').isVisible()));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-layout');
    });
    await test('article themes do not recolor the workspace or modify source', async () => {
      const before = await source(); const color = await page.locator('#app-header').evaluate(el => getComputedStyle(el).backgroundColor);
      await page.locator('#btn-layout').click(); await page.locator('#ctrl-theme').selectOption('botanical-garden');
      assert.equal(await page.locator('#app-header').evaluate(el => getComputedStyle(el).backgroundColor), color);
      assert.equal(await source(), before); await page.locator('#btn-layout-close').click();
    });
    await test('publication dialog has a native focus boundary and restores the invoker', async () => {
      await page.locator('#btn-publish').click(); assert(await page.locator('#export-dialog').isVisible());
      assert.equal(await page.locator('#copy-page-status').innerText(), '');
      for(let i=0;i<10;i++) await page.keyboard.press('Tab');
      assert(await page.evaluate(() => document.getElementById('export-dialog').contains(document.activeElement)));
      await page.keyboard.press('Escape'); assert(!(await page.locator('#export-dialog').isVisible()));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-publish');
    });
    await test('WeChat zoom and reset keep the correct output path', async () => {
      await page.locator('#btn-layout').click(); await page.locator('#ctrl-theme').selectOption('wc-minimalist');
      await page.locator('#btn-layout-close').click(); await page.waitForTimeout(200);
      await page.locator('#zoom-in').click(); await page.waitForTimeout(150);
      assert(await page.locator('.wc-content').isVisible()); assert.equal(await page.locator('body').getAttribute('data-output'),'wechat');
      await page.locator('#btn-layout').click(); await page.locator('#btn-reset').click(); await page.locator('#btn-layout-close').click();
      await page.waitForTimeout(600); assert.equal(await page.locator('body').getAttribute('data-output'),'magazine'); assert(await page.locator('.magmark').first().isVisible());
    });
    await test('file disclosure closes by Escape without losing content', async () => {
      const before = await source(); await page.locator('#file-menu summary').click(); assert(await page.locator('#file-upload-label').isVisible());
      await page.keyboard.press('Escape'); assert(!(await page.locator('#file-upload-label').isVisible())); assert.equal(await source(),before);
    });
    await test('mobile and tablet use one pane without document-level overflow', async () => {
      for(const width of [375, 768]) {
        await page.setViewportSize({width, height: 812}); await page.waitForTimeout(200);
        await page.locator('[data-workspace-view="write"]').click(); assert(await page.locator('.cm-content').isVisible()); assert(!(await page.locator('#preview-panel').isVisible()));
        await page.locator('[data-workspace-view="preview"]').click(); await page.waitForTimeout(350);
        assert(await page.locator('#preview-panel').isVisible());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator('#btn-layout').click(); assert(await page.locator('#layout-inspector').isVisible()); assert(!(await page.locator('#preview-panel').isVisible()));
        await page.locator('#btn-layout-close').click(); assert(await page.locator('#preview-panel').isVisible());
      }
    });
    await test('repeated images remain individually editable and source edits undo once', async () => {
      await page.setViewportSize({width:1440,height:960});
      await page.locator('[data-workspace-view="compare"]').click();
      await page.locator('#btn-scroll').click();
      const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="gray"/></svg>');
      const original = '# 图片定位\n\n![同图]('+svg+'){.center width=40%}\n\n![同图]('+svg+'){.center width=40%}';
      await setSource(original);
      const images = page.locator('#preview-area .magmark img');
      assert.equal(await images.count(),2);
      await images.nth(1).dispatchEvent('contextmenu', {bubbles:true,cancelable:true,clientX:900,clientY:350});
      await page.getByRole('menuitem', {name:'宽度 50%',exact:true}).click();
      await page.waitForTimeout(400);
      const edited = await source(); assert(edited.includes('width=40%')); assert.equal((edited.match(/width=50%/g)||[]).length,1);
      await page.locator('.cm-content').click(); await page.keyboard.press('Control+z');
      assert.equal(await source(),original);
      await page.locator('#btn-multi').click();
    });
    await test('zoom changes only the view transform, not article nodes or source', async () => {
      await page.waitForTimeout(500);
      const before = await source();
      await page.evaluate(() => { window.__retainedPreviewNode = document.querySelector('#preview-area .page-content'); });
      await page.locator('#zoom-in').click(); await page.waitForTimeout(200);
      assert(await page.evaluate(() => window.__retainedPreviewNode === document.querySelector('#preview-area .page-content')));
      assert.equal(await source(), before);
    });
    await test('empty source disables export instead of exporting old content', async () => {
      await setSource(''); assert(await page.locator('#btn-publish').isDisabled()); assert.equal(await source(),'');
      assert((await page.locator('#char-count').innerText()).startsWith('0 '));
    });
    await test('oversized content exposes a warning and blocks clipped PNG export', async () => {
      await page.setViewportSize({width:1440,height:960}); await setSource('> '+ '中文长引用内容，不能静默裁掉。'.repeat(450));
      await page.locator('#btn-publish').click(); await page.waitForTimeout(300);
      assert(await page.locator('#export-warning').isVisible()); assert(await page.locator('#btn-export').isDisabled());
      await page.locator('#btn-export-close').click();
    });
    await test('hostile source never executes through preview or image-reference helpers', async () => {
      await page.setViewportSize({width:1440,height:960});
      await page.locator('[data-workspace-view="compare"]').click();
      await page.locator('#btn-scroll').click();
      await page.evaluate(() => { window.__magmarkInjection = 0; });
      const malicious = '# 安全文章\n\n<img src="broken-image.png" onerror="window.__magmarkInjection++" alt="真实图片">\n\n<script>window.__magmarkInjection++</script>\n\n<a href="javascript:window.__magmarkInjection++">正文链接</a>\n\n<!-- <img src="comment.png" onerror="window.__magmarkInjection++"> -->';
      await setSource(malicious);
      assert.equal(await source(), malicious);
      assert.equal(await page.evaluate(() => window.__magmarkInjection), 0);
      assert.equal(await page.locator('#preview-area script, #preview-area [onerror], #preview-area a[href^="javascript:"]').count(), 0);
      await page.locator('#btn-layout').click(); await page.locator('#ctrl-theme').selectOption('wc-minimalist'); await page.locator('#btn-layout-close').click();
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => window.__magmarkInjection), 0);
      assert.equal(await page.locator('#preview-area script, #preview-area [onerror], #preview-area a[href^="javascript:"]').count(), 0);
      await page.locator('#btn-layout').click(); await page.locator('#ctrl-theme').selectOption('modern-minimalist'); await page.locator('#btn-layout-close').click();
    });
    await test('a queued magazine paint cannot overwrite a newly selected WeChat view', async () => {
      await setSource('# 最新版本\n\n中文与English正文。');
      const result = await page.evaluate(async () => {
        const original = window.requestAnimationFrame;
        const pending = [];
        window.requestAnimationFrame = callback => { pending.push(callback); return pending.length; };
        try {
          document.getElementById('btn-multi').click();
          await Promise.resolve(); await Promise.resolve();
          const theme = document.getElementById('ctrl-theme');
          theme.value = 'wc-minimalist'; theme.dispatchEvent(new Event('change',{bubbles:true}));
          const before = !!document.querySelector('.wc-content');
          const callbacks = pending.splice(0);
          callbacks.forEach(callback => callback(performance.now()));
          return {before, after:!!document.querySelector('.wc-content')};
        } finally {
          window.requestAnimationFrame = original;
          pending.forEach(callback => original(callback));
        }
      });
      assert.equal(result.before,true); assert.equal(result.after,true);
    });
    await test('clearing source during queued pagination leaves a visible empty preview', async () => {
      await page.locator('#btn-layout').click(); await page.locator('#ctrl-theme').selectOption('modern-minimalist'); await page.locator('#btn-layout-close').click();
      await setSource('# 不得残留\n\n旧内容。');
      const result = await page.evaluate(async () => {
        const original = window.requestAnimationFrame, pending = [];
        window.requestAnimationFrame = callback => {pending.push(callback);return pending.length;};
        try {
          document.getElementById('btn-multi').click(); await Promise.resolve(); await Promise.resolve();
          const input = document.getElementById('markdown-input'); input.value=''; input.dispatchEvent(new Event('input',{bubbles:true}));
          const callbacks=pending.splice(0); callbacks.forEach(callback => callback(performance.now()));
          return document.getElementById('preview-area').textContent;
        } finally {window.requestAnimationFrame=original;pending.forEach(callback => original(callback));}
      });
      assert(!result.includes('不得残留'));
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#preview-area').evaluate(el=>getComputedStyle(el).opacity),'1');
      assert(await page.locator('#btn-publish').isDisabled());
    });
    await test('pending edits disable copy and file output until the matching preview is ready', async () => {
      await setSource('# 原文章\n\n旧版');
      const pending = await page.evaluate(() => {
        const input = document.getElementById('markdown-input');
        input.value = '# 新文章\n\n新版'; input.dispatchEvent(new Event('input', {bubbles:true}));
        document.getElementById('btn-publish').click();
        return ['btn-copy-page-rich','btn-copy-page-wechat','btn-export','btn-print-preview'].every(id => document.getElementById(id).disabled);
      });
      assert(pending);
      await page.waitForFunction(() => document.getElementById('preview-area').getAttribute('aria-busy') === 'false');
      assert(!(await page.locator('#btn-copy-page-rich').isDisabled()));
      assert((await page.locator('#preview-area').innerText()).includes('新文章'));
      await page.locator('#btn-export-close').click();
    });
    await test('image dialog is quiet, labelled, focus-contained and composition-safe', async () => {
      await page.locator('#btn-image').click();
      const dialog=page.locator('#mm-image-panel-overlay');
      assert.equal(await dialog.evaluate(el=>el.tagName),'DIALOG');
      assert(await dialog.evaluate(el=>el.open && !!document.getElementById(el.getAttribute('aria-labelledby'))), 'image dialog is open and labelled');
      assert.equal(await page.locator('#mm-image-panel').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
      assert(!(await page.locator('#mm-ip-ar-slider').isVisible()), 'ratio controls must begin collapsed');
      await page.locator('#mm-ip-ratio-section summary').click();
      assert(await page.locator('#mm-ip-ar-slider').isVisible(), 'ratio controls must expand');
      await page.locator('#mm-ip-ratio-section summary').click();
      const composing=await page.locator('#mm-ip-smart-input').evaluate(el=> {
        const event=new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});
        el.dispatchEvent(event); return event.defaultPrevented;
      });
      assert.equal(composing,false);
      for(let i=0;i<22;i++) await page.keyboard.press('Tab');
      assert(await dialog.evaluate(el=>el.contains(document.activeElement)), 'Tab focus remains inside image dialog');
      await page.keyboard.press('Escape'); assert(!(await dialog.isVisible()));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'btn-image');
      await page.setViewportSize({width:375,height:812}); await page.locator('#btn-image').click();
      assert(await dialog.evaluate(el=>el.scrollWidth<=innerWidth), 'image dialog must fit the mobile viewport');
      await page.locator('#mm-ip-close').click(); await page.setViewportSize({width:1440,height:960});
    });
    await test('cover dialog returns focus and does not invoke global save while editing', async () => {
      await page.locator('#btn-cover').click();
      const dialog=page.locator('.mm-cp-overlay');
      assert.equal(await dialog.evaluate(el=>el.tagName),'DIALOG');
      assert(await dialog.evaluate(el=>el.open));
      await page.locator('#mm-cp-title-input').fill('中文标题');
      const before=await page.locator('#document-status').innerText();
      await page.keyboard.press('Control+s'); assert.equal(await page.locator('#document-status').innerText(), before);
      await page.keyboard.press('Escape'); assert(!(await dialog.isVisible()));
      // Native dialog close events restore focus asynchronously.
      await page.waitForFunction(() => document.activeElement?.id === 'btn-cover');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'btn-cover');
    });
    await test('no uncaught errors during workspace interactions', async () => { assert.deepEqual(errors, []); });
    if (process.env.WORKSPACE_SCREENSHOTS) {
      const dir = process.env.WORKSPACE_SCREENSHOTS; fs.mkdirSync(dir, {recursive:true});
      await setSource(fs.readFileSync('src/workspace/starter.ts','utf8').split('`')[1]);
      await page.locator('[data-workspace-view="compare"]').click(); await page.locator('#btn-layout').click();
      await page.locator('#ctrl-theme').selectOption('modern-minimalist'); await page.locator('#btn-layout-close').click(); await page.waitForTimeout(400);
      await page.waitForFunction(() => document.getElementById('workspace-status').hidden);
      await page.screenshot({path:path.join(dir,'workspace-desktop.png')});
      await page.locator('#btn-layout').click(); await page.waitForTimeout(400); await page.screenshot({path:path.join(dir,'workspace-inspector.png')}); await page.locator('#btn-layout-close').click();
      await page.locator('#btn-publish').click(); await page.waitForTimeout(200); await page.screenshot({path:path.join(dir,'workspace-export.png')}); await page.locator('#btn-export-close').click();
      await page.locator('#btn-image').click(); await page.waitForTimeout(200); await page.screenshot({path:path.join(dir,'workspace-image-dialog.png')}); await page.locator('#mm-ip-close').click();
      await page.locator('#btn-cover').click(); await page.waitForTimeout(250); await page.screenshot({path:path.join(dir,'workspace-cover-dialog.png')}); await page.locator('.mm-cp-close').click();
      await page.setViewportSize({width:390,height:844}); await page.locator('[data-workspace-view="write"]').click(); await page.waitForTimeout(300); await page.screenshot({path:path.join(dir,'workspace-mobile.png')});
      await page.locator('#btn-image').click(); await page.waitForTimeout(200); await page.screenshot({path:path.join(dir,'workspace-mobile-image.png')}); await page.locator('#mm-ip-close').click();

    }
    console.log(JSON.stringify({browser:browser.version(), passed, failed:failures.length, failures, scope:network ? 'production Vite assets, local HTTP Chromium UI fixtures; external CDN blocked' : production ? 'production Vite assets, offline Chromium UI fixtures' : 'actual entry, offline Chromium UI fixtures'}, null, 2));
    if(failures.length) process.exitCode=1;
  } finally { await browser?.close(); if (server) await new Promise(resolve=>server.close(resolve)); fs.rmSync(temp, {recursive:true,force:true}); }
})().catch(error => { console.error(error); process.exitCode=1; });

const { chromium, webkit } = require('@playwright/test');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const base = 'https://bubufu.com/tools/magmark2/';
  const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
  const browser = await engine.launch({headless:true, channel:process.env.CHROME_CHANNEL || undefined});
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({viewport:{width,height:844},hasTouch:width<800});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      if (!process.env.LIVE_SITE) await page.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if (!url.href.startsWith(base)) return route.abort();
        const relative=decodeURIComponent(url.pathname.slice('/tools/magmark2/'.length));
        const file=path.resolve('dist-web',relative+(relative.endsWith('/')||!relative?'index.html':''));
        if(!file.startsWith(path.resolve('dist-web')+path.sep)||!existsSync(file)) return route.fulfill({status:404,body:'Not found'});
        const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
        return route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
      });
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('.cm-editor');
      await page.waitForSelector('.workspace-loading',{state:'detached'});
      assert.equal(await page.locator('.workspace-actions .mm-select-icon > svg').count(),3);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(width<800) {
        assert.equal(await page.evaluate(()=>getComputedStyle(document.body).position),'fixed');
        const before=await page.locator('#app-header').boundingBox();
        if(engine===chromium) {
          const session=await page.context().newCDPSession(page);
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:28}]});
          for(const y of [55,85,120,170])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y}]});
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await page.locator('.cm-content').fill(Array.from({length:120},(_,i)=>`Line ${i+1}: mobile scrolling regression`).join('\n'));
          await page.locator('.cm-content').blur();
          await page.locator('.cm-scroller').evaluate(el=>{el.scrollTop=0;});
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:520}]});
          for(const y of [480,430,380,330,280]) {
            await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});
            await page.waitForTimeout(30);
          }
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await page.waitForFunction(()=>document.querySelector('.cm-scroller').scrollTop>20);
          assert.equal(await page.evaluate(()=>scrollY),0,'Internal scrolling must not move the page');
          await session.detach();
        }
        assert.equal(await page.evaluate(()=>scrollY),0);
        assert.equal((await page.locator('#app-header').boundingBox()).y,before.y);
        await page.setViewportSize({width,height:460});
        await page.waitForFunction(()=>Math.abs(document.body.getBoundingClientRect().height-visualViewport.height)<2);
        const tabs=await page.locator('#workspace-tabs').boundingBox();
        assert.ok(tabs.y+tabs.height<=461,'Navigation stays inside reduced viewport');
        await page.setViewportSize({width,height:844});
        await page.waitForFunction(()=>Math.abs(document.body.getBoundingClientRect().height-visualViewport.height)<2);
      }
      await page.locator('[data-workspace-view="preview"]').click();
      await page.locator('#btn-layout').click();
      await page.locator('#layout-inspector').waitFor({state:'visible'});
      if(width<800) assert.equal(await page.locator('#preview-panel').isVisible(),false);
      await page.locator('#btn-layout-close').click();
      await page.locator('[data-workspace-view="write"]').click();
      await page.locator('#btn-cover').click();
      await page.locator('#mm-cp-responsive').click();
      await page.waitForSelector('#rc-canvas');
      assert.equal(await page.locator('.rc-variant').count(),6);
      assert.equal(await page.locator('#rc-layer-list [role="row"]').count(),4);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.goto(base+'guide/');
      await page.locator('h1').waitFor();
      await page.emulateMedia({colorScheme:'dark'});
      assert.equal(await page.locator('table tbody tr').count(),6);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:`/private/tmp/magmark2-guide-${process.env.LIVE_SITE?'live':'local'}-${width}.png`,fullPage:true});
      await page.locator('nav a[lang="en"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),base+'guide/en/');
      assert.deepEqual(errors,[]);
      await page.close();
      console.log(`PASS ${width}px: editor, icons, panels, new covers, static guides and language links`);
    }
    const context=await browser.newContext({javaScriptEnabled:false});
    // Production crawlability without JS is verified directly over HTTP in LIVE_SITE mode.
    if(process.env.LIVE_SITE){const p=await context.newPage();await p.goto(base+'guide/');assert.ok((await p.locator('main').innerText()).includes('一稿生成六种比例封面'));console.log('PASS guide content available without JavaScript');}
    await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});

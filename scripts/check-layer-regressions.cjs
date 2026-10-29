/* Adversarial real-browser layer regressions; no model calls or external services. */
const {buildSync}=require('esbuild');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const bundle=buildSync({entryPoints:['tests/layer-fixture.ts'],bundle:true,format:'iife',globalName:'layerFixture',platform:'browser',write:false}).outputFiles[0].text;
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 page.setDefaultTimeout(5000);const errors=[],results=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
 await page.route('**/*',route=>{
  if(route.request().url()==='http://magmark.test/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><button id="open">封面</button>'});
  if(route.request().url()==='http://magmark.test/brand/magmark-monochrome.svg')return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('public/brand/magmark-monochrome.svg')});
  return route.abort();
 });
 try{
  await page.goto('http://magmark.test/');await page.addScriptTag({content:bundle});
  const reset=async()=>{
   await page.evaluate(()=>{window.panel?.destroy();window.inserted='';window.panel=new layerFixture.ResponsiveCoverPanel(html=>window.inserted=html,()=>{});document.querySelector('#open').onclick=()=>panel.open({title:'同一篇稿，值得好版面',subtitle:'多比例保持同一套设计'});});
   await page.click('#open');await page.waitForFunction(()=>panel.composition?.title.lines.join('').includes('同一篇稿'));
  };
  const row=layer=>page.locator(`[data-layer="${layer}"] .rc-layer-name`);
  const test=async(name,run)=>{await reset();const before=errors.length;try{await run();assert.equal(errors.length,before,'No browser errors');results.push({name,passed:true});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.message});console.error('FAIL '+name+': '+error.message);}};
  await test('Ctrl deselect keeps active properties on a remaining selected layer',async()=>{
   await row('title').click();await row('image').click({modifiers:['ControlOrMeta']});await row('image').click({modifiers:['ControlOrMeta']});
   assert.equal(await page.locator('[data-layer="title"]').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#rc-layer').inputValue(),'title');assert(await page.locator('#rc-title').isVisible());
   await page.fill('#rc-y','25');await page.dispatchEvent('#rc-y','change');
   assert.equal(await page.evaluate(()=>panel.design.variants['wx-wide'].frames.title?.y),.25);
   assert.equal(await page.evaluate(()=>panel.design.variants['wx-wide'].frames.image),undefined);
  });
  await test('text tool recovers a real selection after deselecting the last row',async()=>{
   await row('title').click({modifiers:['ControlOrMeta']});assert.equal(await page.locator('[role=row][aria-selected=true]').count(),0);
   await page.click('#rc-tool-text');assert(await page.locator('#rc-title').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'rc-title');
  });
  await test('context menu is cleared across close and reopen',async()=>{
   await row('title').click({button:'right'});assert(await page.getByRole('menu').isVisible());
   await page.evaluate(()=>panel.close());await page.click('#open');
   assert.equal(await page.getByRole('menu').isVisible(),false);
  });
  await test('context menu supports arrow navigation without moving the layer',async()=>{
   await row('title').click({button:'right'});const before=await page.locator('#rc-layer-list').innerText();
   await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'切换可见');
   await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'恢复当前图层局部修改');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#rc-layer-list').innerText(),before);assert(await page.locator('#mm-responsive-cover').isVisible());
  });
  await test('dragging a multi-selection against the margin preserves relative spacing',async()=>{
   await page.evaluate(()=>{panel.design=layerFixture.editDesign(panel.design,'wx-wide','one',{}, {title:{x:.08,w:.25},subtitle:{x:.35,w:.25}});panel.fields();return panel.render();});
   await row('title').click();await row('subtitle').click({modifiers:['ControlOrMeta']});
   const before=await page.evaluate(()=>({gap:panel.composition.subtitle.x-panel.composition.title.x,x:panel.composition.title.x,y:panel.composition.title.y,w:panel.composition.title.w,h:panel.composition.title.h,W:panel.composition.width,H:panel.composition.height}));
   const box=await page.locator('#rc-canvas').boundingBox();const x=box.x+(before.x+before.w/2)/before.W*box.width,y=box.y+(before.y+before.h/2)/before.H*box.height;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-200,y,{steps:8});await page.mouse.up();
   await page.waitForTimeout(60);const after=await page.evaluate(()=>panel.composition.subtitle.x-panel.composition.title.x);
   assert(Math.abs(after-before.gap)<.1,`Group spacing changed from ${before.gap} to ${after}`);
  });
  await test('reset selected title also restores its local text without touching other layers',async()=>{
   await page.selectOption('#rc-scope','one');await page.fill('#rc-title','独立标题');
   await row('subtitle').click();await page.fill('#rc-subtitle','保留副标题');await row('title').click();await page.click('#rc-layer-reset');
   assert.equal(await page.locator('#rc-title').inputValue(),'同一篇稿，值得好版面');await row('subtitle').click();assert.equal(await page.locator('#rc-subtitle').inputValue(),'保留副标题');
  });
  await test('identical geometry edits do not consume a second undo step',async()=>{
   await page.fill('#rc-x','10');await page.dispatchEvent('#rc-x','change');const count=await page.evaluate(()=>panel.undo.length);
   await page.dispatchEvent('#rc-x','change');assert.equal(await page.evaluate(()=>panel.undo.length),count);
  });
  await test('Escape cancels a list drag without closing the editor or reordering',async()=>{
   const before=await page.locator('#rc-layer-list').innerText();const start=await row('image').boundingBox(),end=await row('logo').boundingBox();
   await page.mouse.move(start.x+10,start.y+10);await page.mouse.down();await page.mouse.move(end.x+10,end.y+2,{steps:6});await page.keyboard.press('Escape');await page.mouse.up();
   assert(await page.locator('#mm-responsive-cover').isVisible());assert.equal(await page.locator('#rc-layer-list').innerText(),before);assert.equal(await page.locator('[data-drop]').count(),0);
  });
  await test('empty space on canvas clears selection without creating an edit',async()=>{
   const count=await page.evaluate(()=>panel.undo.length);const b=await page.locator('#rc-canvas').boundingBox();await page.mouse.click(b.x+2,b.y+2);
   assert.equal(await page.locator('[role=row][aria-selected=true]').count(),0);assert(await page.locator('#rc-x').isDisabled());assert.equal(await page.evaluate(()=>panel.undo.length),count);
  });
  await test('mobile 320px layout and real text input remain usable',async()=>{
   await page.setViewportSize({width:320,height:740});assert(await page.evaluate(()=>document.querySelector('#mm-responsive-cover').scrollWidth<=320));
   await row('subtitle').click();await page.fill('#rc-subtitle','手机编辑');assert.equal(await page.locator('#rc-subtitle').inputValue(),'手机编辑');await page.setViewportSize({width:1440,height:1000});
  });
  await test('failed image in another ratio cannot leave an editable stale canvas',async()=>{
   await page.evaluate(()=>{panel.design=layerFixture.editDesign(panel.design,'wx-square','one',{image:'data:image/png;base64,AAAA'});});
   await page.click('[data-variant="wx-square"]');await page.waitForFunction(()=>document.querySelector('#rc-status').textContent.includes('图片无法读取'));
   assert(await page.locator('#rc-x').isDisabled());const before=await page.evaluate(()=>JSON.stringify(panel.design));
   await page.locator('#rc-canvas').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>JSON.stringify(panel.design)),before);
  });
  await test('save refuses designs that exceed the import size limit',async()=>{
   await page.evaluate(()=>{const src='data:image/png;base64,'+'A'.repeat(3500000);panel.design.master.image=src;for(const v of Object.values(panel.design.variants))v.content.image=src;});
   const downloads=[];const capture=download=>downloads.push(download);page.on('download',capture);
   await page.click('#rc-save');await page.waitForTimeout(120);page.off('download',capture);
   assert.equal(downloads.length,0,'An oversized write-only file must not be offered');assert((await page.locator('#rc-status').innerText()).includes('20MB'));
  });
  await test('locking one selected layer excludes it from shared canvas movement',async()=>{
   await row('title').click();await page.click('[data-layer="title"] [data-action="lock"]');
   await row('subtitle').click({modifiers:['ControlOrMeta']});const before=await page.evaluate(()=>panel.composition.title.x);
   await page.locator('#rc-canvas').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(50);
   assert.equal(await page.evaluate(()=>panel.composition.title.x),before);assert.equal(await page.evaluate(()=>panel.design.variants['wx-wide'].frames.title),undefined);
  });
  await test('corrupt imported JSON cannot replace the current design',async()=>{
   const before=await page.evaluate(()=>JSON.stringify(panel.design));
   await page.locator('#rc-load').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});
   await page.waitForFunction(()=>document.querySelector('#rc-status').textContent.includes('不支持的设计文件版本'));
   assert.equal(await page.evaluate(()=>JSON.stringify(panel.design)),before);
  });
  await test('overflow stops PNG export instead of clipping the title',async()=>{
   await page.fill('#rc-title','不应该被悄悄裁切的中文标题'.repeat(150));
   await page.waitForFunction(()=>document.querySelector('#rc-warning').textContent.includes('超出'));
   const downloads=[];const capture=download=>downloads.push(download);page.on('download',capture);await page.click('#rc-png');
   await page.waitForFunction(()=>document.querySelector('#rc-status').textContent.includes('超出'));page.off('download',capture);assert.equal(downloads.length,0);
  });
  await test('all six ratios download real PNGs with intact ZIP data',async()=>{
   const pending=page.waitForEvent('download');await page.click('#rc-zip');const download=await pending;
   const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const zip=Buffer.concat(chunks);
   const sizes=[];let offset=0;
   while(zip.readUInt32LE(offset)===0x04034b50){const size=zip.readUInt32LE(offset+18),nameLength=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),start=offset+30+nameLength+extra;const png=zip.subarray(start,start+size);
    assert.equal(png.subarray(1,4).toString(),'PNG');sizes.push([png.readUInt32BE(16),png.readUInt32BE(20)]);let crc=0xffffffff;
    for(const byte of png){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}assert.equal((crc^0xffffffff)>>>0,zip.readUInt32LE(offset+14));offset=start+size;
   }
   assert.deepEqual(sizes,[[940,400],[1080,1080],[1080,1440],[1600,900],[1080,1920],[1080,1350]]);
  });
  console.log(JSON.stringify({results,errors,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length},null,2));
  if(results.some(x=>!x.passed)||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

/* Real pointer, keyboard, raster and saved-state checks; no image-generation API calls. */
const {buildSync}=require('esbuild');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'magmark-layers-'));
 const bundle=buildSync({entryPoints:['tests/layer-fixture.ts'],bundle:true,format:'iife',globalName:'layerFixture',platform:'browser',write:false}).outputFiles[0].text;
 const browser=await chromium.launch({headless:true});let count=0;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/*',route=>{
   if(route.request().url()==='http://magmark.test/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><button id="open">封面</button>'});
   if(route.request().url()==='http://magmark.test/brand/magmark-monochrome.svg')return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('public/brand/magmark-monochrome.svg')});
   return route.abort();
  });
  await page.goto('http://magmark.test/');await page.addScriptTag({content:bundle});
  await page.evaluate(()=>{window.panel=new layerFixture.ResponsiveCoverPanel(html=>window.inserted=html,()=>{});document.querySelector('#open').onclick=()=>panel.open({title:'好稿子，值得好版面。',subtitle:'同一设计，多种画幅。'});});
  await page.click('#open');await page.waitForFunction(()=>document.querySelector('#rc-canvas').width===940);
  const check=(name,value)=>{assert.ok(value,name);console.log(`PASS ${++count}: ${name}`);};
  const row=key=>page.locator(`#rc-layer-list [data-layer="${key}"]`);
  check('four content layers and pinned paper',await page.locator('#rc-layer-list [role=row]').count()===4&&await page.locator('.rc-pinned').count()===1);
  check('properties dock is right of stage',(await page.locator('.rc-dock').boundingBox()).x>(await page.locator('.rc-stage').boundingBox()).x);
  await row('title').locator('.rc-layer-name').dblclick();await page.locator('.rc-rename').fill('封面主标题');await page.locator('.rc-rename').press('Enter');
  check('rename leaves title content intact',await row('title').locator('.rc-layer-name').innerText()==='封面主标题'&&(await page.locator('#rc-title').inputValue()).includes('好稿子'));
  await row('title').locator('.rc-layer-name').dblclick();await page.locator('.rc-rename').fill('取消');await page.locator('.rc-rename').press('Escape');
  check('Escape cancels rename without closing the editor',await row('title').locator('.rc-layer-name').innerText()==='封面主标题'&&await page.locator('#mm-responsive-cover').isVisible());
  await row('title').locator('[data-action=lock]').click();check('lock disables editable properties',await page.locator('#rc-x').isDisabled()&&await page.locator('#rc-title').isDisabled());
  const x=await page.locator('#rc-x').inputValue();await page.locator('#rc-canvas').focus();await page.keyboard.press('ArrowRight');check('lock prevents keyboard transform',await page.locator('#rc-x').inputValue()===x);
  await row('title').locator('[data-action=lock]').click();await page.fill('#rc-opacity','50');await page.dispatchEvent('#rc-opacity','change');await page.click('#rc-undo');
  await page.waitForFunction(()=>document.querySelector('#rc-opacity').value==='100');check('one undo reverses opacity',true);
  await page.click('#rc-redo');await page.waitForFunction(()=>document.querySelector('#rc-opacity').value==='50');check('redo restores opacity',true);
  await row('logo').locator('.rc-layer-name').click();await row('title').locator('.rc-layer-name').click({modifiers:['Shift']});check('Shift range selection',await page.locator('#rc-layer-list [aria-selected=true]').count()===3);
  await page.click('#rc-layer-lock');check('batch lock affects all selected rows',await page.locator('#rc-layer-list [data-action=lock][aria-pressed=true]').count()===3);await page.click('#rc-layer-lock');
  await row('title').locator('.rc-layer-name').click();await row('image').locator('.rc-layer-name').click({modifiers:['ControlOrMeta']});check('Control toggles noncontiguous selection',await page.locator('#rc-layer-list [aria-selected=true]').count()===2);
  await row('image').locator('.rc-layer-name').click();await page.click('#rc-layer-up');check('up arrow changes order',(await page.locator('#rc-layer-list [role=row]').evaluateAll(rows=>rows.map(r=>r.dataset.layer))).join(',')==='logo,subtitle,image,title');
  const a=await row('title').boundingBox();await page.mouse.move(a.x+60,a.y+20);await page.mouse.down();const b=await row('logo').boundingBox();await page.mouse.move(b.x+60,b.y+8,{steps:10});await page.mouse.up();
  check('captured pointer drag changes order',await page.locator('#rc-layer-list [role=row]').first().getAttribute('data-layer')==='title');
  await row('title').locator('.rc-layer-name').click();await page.selectOption('#rc-scope','one');await page.fill('#rc-opacity','30');await page.dispatchEvent('#rc-opacity','change');
  await page.click('[data-variant="wx-square"]');await page.selectOption('#rc-scope','all');await page.fill('#rc-opacity','80');await page.dispatchEvent('#rc-opacity','change');await page.click('[data-variant="wx-wide"]');
  await page.waitForFunction(()=>document.querySelector('#rc-opacity').value==='30');check('local opacity survives shared changes',true);
  await row('title').locator('[data-action=visible]').click();check('eye toggles visibility',await row('title').locator('[data-action=visible]').getAttribute('aria-pressed')==='false');await row('title').locator('[data-action=visible]').click();
  await row('title').click({button:'right'});check('context menu opens',await page.getByRole('menu').isVisible());await page.keyboard.press('Escape');check('menu Escape does not close editor',!await page.getByRole('menu').isVisible()&&await page.locator('#mm-responsive-cover').isVisible());
  const saved=page.waitForEvent('download');await page.click('#rc-save');const jsonPath=path.join(temp,'design.json');await (await saved).saveAs(jsonPath);const design=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
  check('design download preserves metadata',design.stack.layers.title.name==='封面主标题'&&design.variants['wx-wide'].stack.layers.title.opacity===.3);
  const download=page.waitForEvent('download');await page.click('#rc-png');const pngPath=path.join(temp,'cover.png');await (await download).saveAs(pngPath);const png=fs.readFileSync(pngPath);check('PNG has real requested dimensions',png.readUInt32BE(16)===940&&png.readUInt32BE(20)===400);
  const pixels=await page.evaluate(async()=>{
   const f=layerFixture;let d=f.createDesign('MMMM');d.master.showLogo=false;d.master.paper='#ffffff';d.master.ink='#000000';
   const source=document.createElement('canvas');source.width=100;source.height=100;const q=source.getContext('2d');q.fillStyle='#ff0000';q.fillRect(0,0,100,100);d.master.image=source.toDataURL();
   d=f.editDesign(d,'wx-wide','one',{}, {image:{x:.07,y:.065,w:.5}});const image=await f.decodeImage(d.master.image),canvas=document.createElement('canvas');const layout=f.paint(canvas,d,'wx-wide',{image}),before=canvas.toDataURL();
   d=f.reorderLayers(d,'wx-wide','all',['image'],'logo','before');f.paint(canvas,d,'wx-wide',{image});const after=canvas.toDataURL();d=f.changeLayers(d,'wx-wide','all',['image'],{opacity:.5});f.paint(canvas,d,'wx-wide',{image});const b=layout.image;
   return {changed:before!==after,pixel:[...canvas.getContext('2d').getImageData(Math.ceil(b.x+5),Math.ceil(b.y+5),1,1).data]};
  });check('real canvas compositing uses layer order',pixels.changed);check('real canvas compositing uses opacity',pixels.pixel[0]===255&&pixels.pixel[1]>=120&&pixels.pixel[1]<=135);
  for(const width of [390,768]){await page.setViewportSize({width,height:844});check(`dialog fits ${width}px`,await page.evaluate(()=>document.querySelector('#mm-responsive-cover').scrollWidth<=innerWidth));}
  await page.click('#rc-close');await page.waitForFunction(()=>document.activeElement.id==='open');check('close restores focus',true);
  check('no uncaught browser errors',errors.length===0);console.log(`${count} Photoshop-inspired layer checks passed.`);
 }finally{await browser.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

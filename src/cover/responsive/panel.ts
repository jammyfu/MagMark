import { createPanelDialog } from '../../workspace/panel-dialog';
import { createDesign, editDesign, resolveRecipe, resetVariant, overrideCount, parseDesign, targets, targetFor, isRasterData, type CoverDesign, type Layer, type Scope, type Recipe, type FrameOverride } from './model';
import { paint, pngBlob, decodeImage, readRaster, makeZip, saveBlob, type Assets } from './render';
import { type Composition } from './layout';
export interface CoverSeed {title:string;subtitle:string;image?:string}

/** Additive structured editor: no mutations to article DOM or the legacy cover draft. */
export class ResponsiveCoverPanel {
  private modal=createPanelDialog('mm-responsive-title');
  readonly element=this.modal.element;
  private design=createDesign();
  private initialized=false;
  private id='wx-wide';
  private layer:Layer='title';
  private undo:CoverDesign[]=[];
  private redo:CoverDesign[]=[];
  private revision=0;
  private job=0;
  private busy=false;
  private inputJob=0;
  private composition?:Composition;
  private imageCache=new Map<string,Promise<HTMLImageElement>>();
  private logo?:Promise<HTMLImageElement>;
  private abort=new AbortController();
  private gesture?:{before:CoverDesign;pointer:number;px:number;py:number;x:number;y:number};
  constructor(private insert:(html:string)=>void,private back:()=>void,private logoSource=new URL('brand/magmark-monochrome.svg',document.baseURI).href) {
    this.element.id='mm-responsive-cover';
    this.element.innerHTML=`<style>
#mm-responsive-cover{--rc-line:#e1e3e7;box-sizing:border-box;inset:0;margin:auto;width:min(1180px,96vw);max-width:96vw;height:min(880px,94dvh);max-height:94dvh;padding:0;border:1px solid var(--rc-line);border-radius:16px;background:#fafafa;color:#202124;font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;box-shadow:0 24px 80px #0003;overflow:auto}
#mm-responsive-cover[open]{display:flex;flex-direction:column}#mm-responsive-cover::backdrop{background:#1118}
#mm-responsive-cover *{box-sizing:border-box}
#mm-responsive-cover button,#mm-responsive-cover select,#mm-responsive-cover input,#mm-responsive-cover textarea{font:inherit;color:inherit;border:1px solid var(--rc-line);border-radius:7px;background:#fff;padding:8px;min-height:36px}
#mm-responsive-cover button{cursor:pointer}#mm-responsive-cover button:disabled{opacity:.45;cursor:wait}#mm-responsive-cover :focus-visible{outline:2px solid #1769d2;outline-offset:2px}
#mm-responsive-cover header,#mm-responsive-cover footer{padding:16px 22px;background:white;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--rc-line);flex-shrink:0}
#mm-responsive-cover header h2{margin:0;font-size:18px;font-weight:650}#mm-responsive-cover header span{color:#6b6d72;margin-left:6px}#mm-responsive-cover header button:first-of-type{margin-left:auto}
#mm-responsive-cover .rc-body{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:0;flex:1;overflow:hidden}
#mm-responsive-cover .rc-controls{padding:18px;border-right:1px solid var(--rc-line);display:grid;gap:12px;align-content:start;background:white;overflow:auto}
#mm-responsive-cover label{display:grid;gap:5px;color:#42464c}#mm-responsive-cover textarea{width:100%;resize:vertical;min-height:68px}#mm-responsive-cover select{width:100%}
#mm-responsive-cover .rc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#mm-responsive-cover .rc-row label{flex:1}#mm-responsive-cover input[type=number]{width:100%}#mm-responsive-cover input[type=color]{width:100%;padding:3px}
#mm-responsive-cover .rc-check{display:flex;align-items:center;gap:8px}#mm-responsive-cover input[type=checkbox]{min-height:0}
#mm-responsive-cover details{border-top:1px solid var(--rc-line);padding-top:10px}#mm-responsive-cover details>div{display:grid;gap:10px;padding-top:10px}#mm-responsive-cover summary{cursor:pointer;font-weight:600}
#mm-responsive-cover .rc-stage{padding:18px;min-width:0;overflow:auto}#mm-responsive-cover .rc-canvas-wrap{height:390px;max-height:47vh;display:flex;align-items:center;justify-content:center;background:#e9e9eb;border-radius:10px;overflow:hidden;padding:18px}
#mm-responsive-cover #rc-canvas{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;touch-action:none;box-shadow:0 8px 24px #0002;cursor:move}
#mm-responsive-cover .rc-variants{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:14px}#mm-responsive-cover .rc-variant{min-width:0;padding:7px;font-size:11px}#mm-responsive-cover .rc-variant[aria-pressed=true]{border:2px solid #1769d2;padding:6px}#mm-responsive-cover .rc-variant canvas{width:100%;max-height:82px;object-fit:contain;display:block;margin-bottom:7px}#mm-responsive-cover .rc-variant small{display:block;color:#62676f}
#mm-responsive-cover .rc-hint{font-size:11px;color:#68707c;margin:0}#mm-responsive-cover .rc-status{min-height:25px;margin-top:12px;color:#596273}#mm-responsive-cover #rc-warning{color:#a4421c;white-space:pre-wrap}#mm-responsive-cover footer{border-top:1px solid var(--rc-line);border-bottom:0;flex-wrap:wrap}#mm-responsive-cover footer label{max-width:230px}#mm-responsive-cover footer input{max-width:100%;min-width:0}#mm-responsive-cover footer .rc-primary{background:#202124;color:white;border-color:#202124}
@media(max-width:760px){#mm-responsive-cover{width:98vw;max-width:98vw;height:96dvh;max-height:96dvh}#mm-responsive-cover .rc-body{grid-template-columns:1fr;overflow:auto;display:flex;flex-direction:column}#mm-responsive-cover .rc-stage{overflow:visible;order:-1;flex-shrink:0}#mm-responsive-cover .rc-controls{overflow:visible;border-right:0;border-top:1px solid var(--rc-line);grid-template-columns:1fr 1fr}#mm-responsive-cover .rc-controls>details,#mm-responsive-cover .rc-controls>p{grid-column:1/-1}#mm-responsive-cover .rc-variants{grid-template-columns:repeat(3,minmax(0,1fr))}#mm-responsive-cover header{padding:12px}#mm-responsive-cover header span{display:none}#mm-responsive-cover .rc-canvas-wrap{height:280px}}
</style>
<header><h2 id="mm-responsive-title">一稿 · 多比例</h2><span>同一设计，按画幅重排</span><button type="button" id="rc-back">返回自由排版</button><button type="button" id="rc-close" aria-label="关闭多比例封面">关闭</button></header>
<div class="rc-body"><section class="rc-controls" aria-label="主设计与局部调整">
<label>修改范围<select id="rc-scope"><option value="all">主设计 · 联动所有比例</option><option value="one">仅当前比例 · 局部覆盖</option></select></label>
<p class="rc-hint">局部覆盖不会被主设计覆盖。拖动与图层位置调整只影响当前比例。</p>
<label>标题<textarea id="rc-title" maxlength="4000"></textarea></label><label>副标题<textarea id="rc-subtitle" maxlength="4000"></textarea></label>
<div class="rc-row"><label>字体<select id="rc-font"><option value="serif">编辑宋体</option><option value="sans">现代黑体</option></select></label><label>对齐<select id="rc-align"><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></label></div>
<div class="rc-row"><label>纸色<input type="color" id="rc-paper"></label><label>字色<input type="color" id="rc-ink"></label></div>
<label class="rc-check"><input type="checkbox" id="rc-logo">使用已定稿的 MagMark Logo</label>
<label class="rc-check"><input type="checkbox" id="rc-safe">关键内容收进居中 1:1 安全区</label>
<label class="rc-check"><input type="checkbox" id="rc-guides">显示 1:1 裁切参考线（不导出）</label>
<details><summary>主图与裁切焦点</summary><div><label>上传主图<input type="file" id="rc-image" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="rc-clear-image">移除主图</button><label>焦点横向 %<input id="rc-focal-x" type="range" min="0" max="100"></label><label>焦点纵向 %<input id="rc-focal-y" type="range" min="0" max="100"></label><p class="rc-hint">根据指定焦点裁切，不拉伸；本版没有自动人脸检测。</p></div></details>
<details open><summary>当前比例 · 图层微调</summary><div><label>图层<select id="rc-layer"><option value="title">标题</option><option value="subtitle">副标题</option><option value="logo">Logo</option></select></label><div class="rc-row"><label>X %<input id="rc-x" type="number" min="0" max="100" step="1"></label><label>Y %<input id="rc-y" type="number" min="0" max="100" step="1"></label><label>宽 %<input id="rc-w" type="number" min="8" max="100" step="1"></label></div><label>字号倍率<input id="rc-scale" type="range" min="40" max="200" value="100"></label><label class="rc-check"><input type="checkbox" id="rc-hidden">隐藏此图层</label><button type="button" id="rc-reset">当前比例恢复跟随主设计</button></div></details>
</section><section class="rc-stage" aria-label="多比例实时预览"><div class="rc-row" style="margin-bottom:12px"><strong id="rc-current"></strong><span id="rc-overrides"></span><button id="rc-undo" type="button">撤销</button><button id="rc-redo" type="button">重做</button></div><div class="rc-canvas-wrap"><canvas id="rc-canvas" tabindex="0" role="img" aria-label="封面预览，可拖动文字，使用方向键微调"></canvas></div><div class="rc-variants" id="rc-variants"></div><p class="rc-status" id="rc-warning" role="status" aria-live="polite"></p><p class="rc-status" id="rc-status" role="status" aria-live="polite">设计只保留在当前页面；关闭页面前请保存设计文件。</p></section></div>
<footer><button id="rc-png" class="rc-primary" type="button">当前 PNG</button><button id="rc-zip" type="button">全部 6 比例 ZIP</button><button id="rc-insert" type="button">插入当前 PNG</button><button id="rc-save" type="button">保存可编辑设计</button><label>打开设计<input id="rc-load" type="file" accept="application/json,.json"></label></footer>`;
    // Correct fixed preview height separately from the target canvas dimensions.
    this.element.querySelector('style')!.textContent += '\n#mm-responsive-cover .rc-variant canvas{height:82px}\n';
    document.body.append(this.element);
    const signal=this.abort.signal;
    const on=(id:string,event:string,fn:(event:Event)=>void)=>this.q(id).addEventListener(event,fn,{signal});
    on('rc-close','click',()=>this.close());on('rc-back','click',()=>{this.close();this.back();});
    this.element.addEventListener('close',()=>{this.revision++;this.job++;this.busy=false;this.cancelGesture();},{signal});
    this.element.addEventListener('cancel',event=>{event.preventDefault();this.close();},{signal});
    this.element.addEventListener('keydown',event=>{if(event.isComposing)return;if(event.key==='Escape'&&this.gesture){event.preventDefault();this.cancelGesture();}},{signal});
    on('rc-scope','change',()=>this.fields());
    for(const key of ['title','subtitle','font','align','paper','ink'] as const) on(`rc-${key}`,key==='title'||key==='subtitle'?'input':'change',()=>this.update({[key]:this.input(`rc-${key}`).value}));
    on('rc-logo','change',()=>this.update({showLogo:this.input('rc-logo').checked}));on('rc-safe','change',()=>this.update({squareSafe:this.input('rc-safe').checked}));on('rc-guides','change',()=>void this.render());
    for(const axis of ['x','y'] as const)on(`rc-focal-${axis}`,'input',()=>this.update({[axis==='x'?'focalX':'focalY']:this.input(`rc-focal-${axis}`).valueAsNumber/100}));
    on('rc-layer','change',()=>{this.layer=this.input('rc-layer').value as Layer;void this.render();});
    for(const key of ['x','y','w','scale'] as const)on(`rc-${key}`,'change',()=>{const n=this.input(`rc-${key}`).valueAsNumber;if(Number.isFinite(n))this.adjust({[key]:Math.max(key==='scale'?.4:0,Math.min(key==='scale'?2:1,n/100))});});
    on('rc-hidden','change',()=>this.adjust({hidden:this.input('rc-hidden').checked}));
    on('rc-reset','click',()=>{if(overrideCount(this.design,this.id)&&confirm('清除当前比例的局部覆盖，恢复跟随主设计？'))this.commit(resetVariant(this.design,this.id));});
    on('rc-undo','click',()=>this.history(false));on('rc-redo','click',()=>this.history(true));
    on('rc-clear-image','click',()=>this.update({image:''}));
    on('rc-image','change',()=>{const file=this.input('rc-image').files?.[0];if(file)void this.upload(file);});
    on('rc-save','click',()=>{saveBlob(new Blob([JSON.stringify(this.design,null,2)],{type:'application/json'}),'MagMark-cover-design.json');this.status('已发起设计文件下载，含主设计、图片和全部局部覆盖。');});
    on('rc-load','change',()=>{const file=this.input('rc-load').files?.[0];if(file)void this.load(file);});
    on('rc-png','click',()=>void this.output('png'));on('rc-zip','click',()=>void this.output('zip'));on('rc-insert','click',()=>void this.output('insert'));
    const host=this.q('rc-variants');
    for(const t of targets){const b=document.createElement('button');b.type='button';b.className='rc-variant';b.dataset.variant=t.id;b.setAttribute('aria-label',`${t.name} ${t.ratio}`);const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');const name=document.createElement('span');name.textContent=t.ratio;const note=document.createElement('small');b.append(c,name,note);b.addEventListener('click',()=>{this.cancelGesture();this.id=t.id;this.fields();void this.render();},{signal});host.append(b);}
    const canvas=this.q('rc-canvas') as HTMLCanvasElement;
    canvas.addEventListener('pointerdown',event=>this.pointerDown(event),{signal});canvas.addEventListener('pointermove',event=>this.pointerMove(event),{signal});canvas.addEventListener('pointerup',()=>this.endGesture(),{signal});canvas.addEventListener('pointercancel',()=>this.cancelGesture(),{signal});canvas.addEventListener('lostpointercapture',()=>this.endGesture(),{signal});
    window.addEventListener('blur',()=>this.cancelGesture(),{signal});
    canvas.addEventListener('keydown',event=>{if(event.isComposing||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!this.composition)return;event.preventDefault();const b=this.composition[this.layer],s=event.shiftKey?10:1;this.adjust({x:(b.x+(event.key==='ArrowLeft'?-s:event.key==='ArrowRight'?s:0))/this.composition.width,y:(b.y+(event.key==='ArrowUp'?-s:event.key==='ArrowDown'?s:0))/this.composition.height});},{signal});
  }
  private q(id:string):HTMLElement{return this.element.querySelector<HTMLElement>(`#${id}`)!;}
  private input(id:string):HTMLInputElement{return this.q(id) as HTMLInputElement;}
  private scope():Scope{return this.input('rc-scope').value as Scope;}
  private status(message:string){this.q('rc-status').textContent=message;}
  open(seed:CoverSeed){if(!this.initialized){this.design=createDesign(seed.title,seed.subtitle);if(isRasterData(seed.image))this.design.master.image=seed.image;this.initialized=true;}this.modal.open();this.fields();void this.render();}
  close(){this.cancelGesture();this.revision++;this.job++;this.busy=false;this.modal.close();}
  destroy(){this.close();this.abort.abort();this.imageCache.clear();this.modal.destroy();}
  private commit(next:CoverDesign){if(next===this.design)return;this.undo.push(this.design);if(this.undo.length>30)this.undo.shift();this.redo=[];this.design=next;this.fields();void this.render();}
  private update(patch:Partial<Recipe>){this.commit(editDesign(this.design,this.id,this.scope(),patch));}
  private adjust(patch:FrameOverride){this.commit(editDesign(this.design,this.id,'one',{}, {[this.layer]:patch}));}
  private history(forward:boolean){this.cancelGesture();const source=forward?this.redo:this.undo,target=forward?this.undo:this.redo;const next=source.pop();if(next){target.push(this.design);this.design=next;this.fields();void this.render();}}
  private fields(){const r=this.scope()==='all'?this.design.master:resolveRecipe(this.design,this.id);for(const k of ['title','subtitle','font','align','paper','ink'] as const)this.input(`rc-${k}`).value=r[k];this.input('rc-logo').checked=r.showLogo;this.input('rc-safe').checked=r.squareSafe;this.input('rc-focal-x').value=String(r.focalX*100);this.input('rc-focal-y').value=String(r.focalY*100);this.controls();}
  private controls(){this.input('rc-undo').disabled=!this.undo.length;this.input('rc-redo').disabled=!this.redo.length;for(const id of ['rc-png','rc-zip','rc-insert'])this.input(id).disabled=this.busy;}
  private async assets(design:CoverDesign,id:string):Promise<Assets>{const r=resolveRecipe(design,id);let image:HTMLImageElement|undefined;if(r.image){if(!isRasterData(r.image))throw new Error('请使用本地图片');if(!this.imageCache.has(r.image)){if(this.imageCache.size>7)this.imageCache.clear();this.imageCache.set(r.image,decodeImage(r.image));}image=await this.imageCache.get(r.image)!;}let logo:HTMLImageElement|undefined;if(r.showLogo){if(!this.logo)this.logo=decodeImage(this.logoSource).catch(error=>{this.logo=undefined;throw error;});logo=await this.logo;}return {image,logo};}
  private async render(){const revision=++this.revision,design=this.design,id=this.id;this.controls();const t=targetFor(id);this.q('rc-current').textContent=`${t.ratio} · ${t.width} × ${t.height}`;this.q('rc-overrides').textContent=overrideCount(design,id)?`已局部覆盖 ${overrideCount(design,id)} 项`:'跟随主设计';
    try{const assets=await this.assets(design,id);if(revision!==this.revision||!this.element.open)return;this.composition=paint(this.q('rc-canvas') as HTMLCanvasElement,design,id,assets,{maxWidth:1100,guides:this.input('rc-guides').checked,selected:this.layer});this.q('rc-warning').textContent=this.composition.warnings.join('；');const b=this.composition[this.layer];for(const [key,value] of [['x',b.x/this.composition.width],['y',b.y/this.composition.height],['w',b.w/this.composition.width]] as const)this.input(`rc-${key}`).value=String(Math.round(value*100));const o=design.variants[id].frames[this.layer];this.input('rc-scale').value=String((o?.scale??1)*100);this.input('rc-hidden').checked=o?.hidden===true;this.input('rc-layer').value=this.layer;
      for(const target of targets){const a=await this.assets(design,target.id);if(revision!==this.revision)return;const card=this.element.querySelector<HTMLButtonElement>(`[data-variant="${target.id}"]`)!;card.setAttribute('aria-pressed',String(target.id===id));const l=paint(card.querySelector('canvas')!,design,target.id,a,{maxWidth:180});card.querySelector('small')!.textContent=l.warnings.length?'需调整':overrideCount(design,target.id)?'局部覆盖':'联动';}
    }catch(error){if(revision===this.revision)this.status(error instanceof Error?error.message:'预览失败');}}
  private async upload(file:File){const inputJob=++this.inputJob,job=this.job,id=this.id,scope=this.scope();try{const src=await readRaster(file);if(inputJob!==this.inputJob||job!==this.job||!this.element.open)return;this.commit(editDesign(this.design,id,scope,{image:src}));this.status('主图已读取；使用焦点滑杆调整裁切。');}catch(e){this.status(e instanceof Error?e.message:'图片读取失败');}finally{this.input('rc-image').value='';}}
  private async load(file:File){const inputJob=++this.inputJob,job=this.job;try{if(file.size>20_000_000)throw new Error('设计文件超过 20MB');const d=parseDesign(await file.text());if(inputJob!==this.inputJob||job!==this.job||!this.element.open)return;this.commit(d);this.status('已载入可编辑设计。');}catch(e){this.status(e instanceof Error?e.message:'设计无法载入');}finally{this.input('rc-load').value='';}}
  private pointerDown(e:PointerEvent){if(e.button!==0||!this.composition)return;const canvas=this.q('rc-canvas'),r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*this.composition.width,py=(e.clientY-r.top)/r.height*this.composition.height;const hit=(['logo','subtitle','title'] as const).find(k=>{const b=this.composition![k];return !b.hidden&&px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h;});if(!hit)return;e.preventDefault();this.layer=hit;const b=this.composition[hit];this.gesture={before:this.design,pointer:e.pointerId,px:e.clientX,py:e.clientY,x:b.x/this.composition.width,y:b.y/this.composition.height};canvas.setPointerCapture(e.pointerId);canvas.focus();void this.render();}
  private pointerMove(e:PointerEvent){const g=this.gesture;if(!g||g.pointer!==e.pointerId)return;const r=this.q('rc-canvas').getBoundingClientRect();this.design=editDesign(g.before,this.id,'one',{}, {[this.layer]:{x:Math.max(0,Math.min(1,g.x+(e.clientX-g.px)/r.width)),y:Math.max(0,Math.min(1,g.y+(e.clientY-g.py)/r.height))}});void this.render();}
  private endGesture(){const g=this.gesture;if(!g)return;this.gesture=undefined;if(this.design!==g.before){this.undo.push(g.before);if(this.undo.length>30)this.undo.shift();this.redo=[];}this.controls();}
  private cancelGesture(){const g=this.gesture;if(!g)return;this.gesture=undefined;this.design=g.before;const canvas=this.q('rc-canvas');if(canvas.hasPointerCapture?.(g.pointer))canvas.releasePointerCapture(g.pointer);void this.render();}
  private async output(mode:'png'|'zip'|'insert'){if(this.busy)return;this.endGesture();const job=++this.job,design=this.design,id=this.id;this.busy=true;this.controls();this.status('正在按当前设计快照导出…');
    try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('字体尚未就绪，请稍后重试')),8000);document.fonts.ready.then(()=>{clearTimeout(timer);resolve();},()=>{clearTimeout(timer);reject(new Error('字体加载失败'));});});
      const selected=mode==='zip'?targets:[targetFor(id)],files:Array<{name:string;data:Uint8Array}>=[];let result:Blob|undefined;
      for(const t of selected){if(job!==this.job||!this.element.open)return;this.status(`导出 ${t.ratio}…`);const assets=await this.assets(design,t.id);result=await pngBlob(design,t.id,assets);files.push({name:`MagMark-${t.id}-${t.width}x${t.height}.png`,data:new Uint8Array(await result.arrayBuffer())});}
      if(job!==this.job||!this.element.open)return;
      if(mode==='insert'){const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(result!);});if(job!==this.job||!this.element.open)return;const root=document.createElement('div');root.className='mm-cover';const img=document.createElement('img');img.src=data;img.alt=resolveRecipe(design,id).title;img.style.cssText='display:block;width:100%;height:auto';root.append(img);this.insert(root.outerHTML);this.close();}
      else {saveBlob(mode==='zip'?makeZip(files):result!,mode==='zip'?'MagMark-six-ratios.zip':files[0].name);this.status('文件已生成并发起下载，请在浏览器下载记录中确认。');}
    }catch(e){if(job===this.job)this.status(e instanceof Error?e.message:'导出失败');}finally{if(job===this.job){this.busy=false;this.controls();}}}
}

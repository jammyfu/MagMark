import { createPanelDialog } from '../../workspace/panel-dialog';
import { createDesign, editDesign, resolveRecipe, resetVariant, overrideCount, parseDesign, serializeDesign, MAX_DESIGN_BYTES, targets, targetFor, isRasterData, type CoverDesign, type Layer, type Scope, type Recipe, type FrameOverride } from './model';
import { paint, pngBlob, decodeImage, readRaster, makeZip, saveBlob, type Assets } from './render';
import { translatedFrames, type Composition } from './layout';
import { layerStack, changeLayers, reorderLayers, resetLayer, selectLayers } from './layer-stack';
import { LayerPanel } from './layer-panel';
import { workspaceHTML } from './workspace-ui';
export interface CoverSeed {title:string;subtitle:string;image?:string}

/** Structured editor. The document, freeform draft and rendered export never contain its chrome. */
export class ResponsiveCoverPanel {
  private modal=createPanelDialog('mm-responsive-title');
  readonly element=this.modal.element;
  private design=createDesign();
  private initialized=false;
  private id='wx-wide';
  private layer:Layer='title';
  private selected:Layer[]=['title'];
  private layers:LayerPanel;
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
  private gesture?:{before:CoverDesign;pointer:number;px:number;py:number;layout:Composition;layers:Layer[]};
  constructor(private insert:(html:string)=>void,private back:()=>void,private logoSource=new URL('brand/magmark-monochrome.svg',document.baseURI).href) {
    this.element.id='mm-responsive-cover';this.element.innerHTML=workspaceHTML;document.body.append(this.element);
    this.layers=new LayerPanel(this.q('rc-layer-panel'),{
      read:()=>({design:this.design,id:this.id,active:this.layer,selected:this.selected,composition:this.composition}),
      select:(selected,active)=>this.select(selected,active),
      change:(selected,patch)=>{try{this.commit(changeLayers(this.design,this.id,this.scope(),selected,patch));}catch(e){this.status(e instanceof Error?e.message:'图层修改失败');}},
      reorder:(selected,target,side)=>this.commit(reorderLayers(this.design,this.id,this.scope(),selected,target,side)),
      reset:layer=>this.commit(resetLayer(this.design,this.id,layer)),
    },this.logoSource);
    const signal=this.abort.signal;
    const on=(id:string,event:string,fn:(event:Event)=>void)=>this.q(id).addEventListener(event,fn,{signal});
    on('rc-close','click',()=>this.close());on('rc-back','click',()=>{this.close();this.back();});
    this.element.addEventListener('close',()=>{if(this.element.open)return;this.layers.cancelInteractions();this.revision++;this.job++;this.inputJob++;this.busy=false;this.cancelGesture();},{signal});
    this.element.addEventListener('cancel',event=>{event.preventDefault();this.close();},{signal});
    this.element.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      if(event.key==='Escape'&&this.gesture){event.preventDefault();this.cancelGesture();return;}
      if((event.target as Element).closest('input,textarea,select,[contenteditable]'))return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();this.history(event.shiftKey);}
      else if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key.toLowerCase()==='v'){event.preventDefault();this.q('rc-canvas').focus();}
      else if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key.toLowerCase()==='t'){event.preventDefault();this.editText();}
    },{signal});
    on('rc-tool-move','click',()=>this.q('rc-canvas').focus());on('rc-tool-text','click',()=>this.editText());
    on('rc-tool-image','click',()=>{if(this.isLocked('image'))return;(this.q('rc-image-settings') as HTMLDetailsElement).open=true;this.input('rc-image').click();});
    on('rc-tool-guides','click',()=>{this.input('rc-guides').checked=!this.input('rc-guides').checked;void this.render();});
    on('rc-scope','change',()=>{this.layers.cancelInteractions();this.fields();});
    for(const key of ['title','subtitle','font','align','paper','ink'] as const)on(`rc-${key}`,key==='title'||key==='subtitle'?'input':'change',()=>this.update({[key]:this.input(`rc-${key}`).value}));
    on('rc-logo','change',()=>this.update({showLogo:this.input('rc-logo').checked}));
    on('rc-safe','change',()=>this.update({squareSafe:this.input('rc-safe').checked}));on('rc-guides','change',()=>void this.render());
    for(const axis of ['x','y'] as const)on(`rc-focal-${axis}`,'input',()=>this.update({[axis==='x'?'focalX':'focalY']:this.input(`rc-focal-${axis}`).valueAsNumber/100}));
    on('rc-layer','change',()=>{this.layer=this.input('rc-layer').value as Layer;this.selected=[this.layer];this.fields();void this.render();});
    for(const key of ['x','y','w','scale'] as const)on(`rc-${key}`,'change',()=>{const n=this.input(`rc-${key}`).valueAsNumber;if(Number.isFinite(n))this.adjust({[key]:Math.max(key==='scale'?.4:0,Math.min(key==='scale'?2:1,n/100))});});
    on('rc-hidden','change',()=>this.commit(changeLayers(this.design,this.id,'one',[this.layer],{hidden:this.input('rc-hidden').checked})));
    on('rc-reset','click',()=>{if(overrideCount(this.design,this.id)&&confirm('清除当前比例的局部覆盖，恢复跟随主设计？'))this.commit(resetVariant(this.design,this.id));});
    on('rc-undo','click',()=>this.history(false));on('rc-redo','click',()=>this.history(true));
    on('rc-clear-image','click',()=>this.update({image:''}));
    on('rc-image','change',()=>{const file=this.input('rc-image').files?.[0];if(file&&!this.isLocked('image'))void this.upload(file);});
    on('rc-save','click',()=>{try{saveBlob(new Blob([serializeDesign(this.design)],{type:'application/json'}),'MagMark-cover-design.json');this.status('已发起设计下载，含图层顺序、锁定、不透明度及各比例覆盖。');}catch(error){this.status(error instanceof Error?error.message:'无法保存设计');}});
    on('rc-load','change',()=>{const file=this.input('rc-load').files?.[0];if(file)void this.load(file);});
    on('rc-png','click',()=>void this.output('png'));on('rc-zip','click',()=>void this.output('zip'));on('rc-insert','click',()=>void this.output('insert'));
    const host=this.q('rc-variants');
    for(const t of targets){const b=document.createElement('button');b.type='button';b.className='rc-variant';b.dataset.variant=t.id;b.setAttribute('aria-label',`${t.name} ${t.ratio}`);const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');const name=document.createElement('span');name.textContent=t.ratio;const note=document.createElement('small');b.append(c,name,note);b.addEventListener('click',()=>{this.cancelGesture();this.layers.cancelInteractions();this.id=t.id;this.fields();void this.render();},{signal});host.append(b);}
    const canvas=this.q('rc-canvas') as HTMLCanvasElement;
    canvas.addEventListener('pointerdown',event=>this.pointerDown(event),{signal});canvas.addEventListener('pointermove',event=>this.pointerMove(event),{signal});canvas.addEventListener('pointerup',()=>this.endGesture(),{signal});canvas.addEventListener('pointercancel',()=>this.cancelGesture(),{signal});canvas.addEventListener('lostpointercapture',()=>this.endGesture(),{signal});
    canvas.addEventListener('dblclick',()=>this.editText(),{signal});
    window.addEventListener('blur',()=>this.cancelGesture(),{signal});
    canvas.addEventListener('keydown',event=>{if(event.isComposing||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!this.composition)return;event.preventDefault();const s=event.shiftKey?10:1;this.moveSelection(event.key==='ArrowLeft'?-s:event.key==='ArrowRight'?s:0,event.key==='ArrowUp'?-s:event.key==='ArrowDown'?s:0);},{signal});
  }
  private q(id:string):HTMLElement{return this.element.querySelector<HTMLElement>(`#${id}`)!;}
  private input(id:string):HTMLInputElement{return this.q(id) as HTMLInputElement;}
  private scope():Scope{return this.input('rc-scope').value as Scope;}
  private status(message:string){this.q('rc-status').textContent=message;}
  private isLocked(layer:Layer){return layerStack(this.design,this.id).layers[layer].locked;}
  open(seed:CoverSeed){if(!this.initialized){this.design=createDesign(seed.title,seed.subtitle);if(isRasterData(seed.image))this.design.master.image=seed.image;this.initialized=true;}this.modal.open();this.fields();void this.render();}
  close(){this.layers.cancelInteractions();this.cancelGesture();this.revision++;this.job++;this.busy=false;this.modal.close();}
  destroy(){this.close();this.abort.abort();this.layers.destroy();this.imageCache.clear();this.modal.destroy();}
  private commit(next:CoverDesign){if(next===this.design)return;this.undo.push(this.design);if(this.undo.length>30)this.undo.shift();this.redo=[];this.design=next;this.fields();void this.render();}
  private update(patch:Partial<Recipe>){
    if((('title' in patch)&&this.isLocked('title'))||(('subtitle' in patch)&&this.isLocked('subtitle'))||(('image' in patch||'focalX' in patch||'focalY' in patch)&&this.isLocked('image'))||(('showLogo' in patch)&&this.isLocked('logo'))||(('font' in patch||'align' in patch||'ink' in patch)&&(this.isLocked('title')||this.isLocked('subtitle')||this.isLocked('logo')))) {this.status('请先解锁相关图层。');this.fields();return;}
    this.commit(editDesign(this.design,this.id,this.scope(),patch));
  }
  private adjust(patch:FrameOverride){if(this.selected.length!==1||this.isLocked(this.layer)||!this.composition)return;this.commit(editDesign(this.design,this.id,'one',{}, {[this.layer]:patch}));}
  private history(forward:boolean){this.layers.cancelInteractions();this.cancelGesture();const source=forward?this.redo:this.undo,target=forward?this.undo:this.redo;const next=source.pop();if(next){target.push(this.design);this.design=next;this.fields();void this.render();}}
  private select(selected:Layer[],active:Layer){
    this.cancelGesture();this.selected=selected;
    this.layer=selected.includes(active)?active:selected.at(-1)??active;
    this.fields();void this.render();
  }
  private editText(){
    const layer=this.layer==='subtitle'?'subtitle':'title';
    this.select([layer],layer);
    if(!this.isLocked(layer))this.q(`rc-${layer}`).focus();
  }
  private fields(){const r=this.scope()==='all'?this.design.master:resolveRecipe(this.design,this.id);for(const k of ['title','subtitle','font','align','paper','ink'] as const)this.input(`rc-${k}`).value=r[k];this.input('rc-logo').checked=r.showLogo;this.input('rc-safe').checked=r.squareSafe;this.input('rc-focal-x').value=String(r.focalX*100);this.input('rc-focal-y').value=String(r.focalY*100);this.properties();this.controls();this.layers.refresh();}
  private properties(){
    const single=this.selected.length===1,stack=layerStack(this.design,this.id),locked=this.isLocked(this.layer);
    this.q('rc-property-name').textContent=single?` · ${stack.layers[this.layer].name}${locked?'（已锁定）':''}`:this.selected.length?` · ${this.selected.length} 个图层`:' · 未选择';
    this.q('rc-title-field').hidden=!(single&&this.layer==='title');this.q('rc-subtitle-field').hidden=!(single&&this.layer==='subtitle');
    this.q('rc-text-options').hidden=!(single&&(this.layer==='title'||this.layer==='subtitle'));
    this.q('rc-scale-field').hidden=this.layer==='image'||this.layer==='logo';
    for(const key of ['x','y','w','scale'])this.input(`rc-${key}`).disabled=!single||locked||!this.composition;
    this.input('rc-title').disabled=this.isLocked('title');this.input('rc-subtitle').disabled=this.isLocked('subtitle');
    const typeLocked=this.isLocked('title')||this.isLocked('subtitle')||this.isLocked('logo');
    for(const key of ['font','align','ink'])this.input(`rc-${key}`).disabled=typeLocked;
    for(const id of ['rc-image','rc-clear-image','rc-focal-x','rc-focal-y','rc-tool-image'])this.input(id).disabled=this.isLocked('image');
    this.input('rc-logo').disabled=this.isLocked('logo');this.input('rc-layer').value=this.layer;
  }
  private controls(){this.input('rc-undo').disabled=!this.undo.length;this.input('rc-redo').disabled=!this.redo.length;for(const id of ['rc-png','rc-zip','rc-insert'])this.input(id).disabled=this.busy;}
  private async assets(design:CoverDesign,id:string):Promise<Assets>{const r=resolveRecipe(design,id),stack=layerStack(design,id);let image:HTMLImageElement|undefined;if(r.image&&!stack.layers.image.hidden&&stack.layers.image.opacity>0){if(!isRasterData(r.image))throw new Error('请使用本地图片');if(!this.imageCache.has(r.image)){if(this.imageCache.size>7)this.imageCache.clear();const src=r.image;this.imageCache.set(src,decodeImage(src).catch(error=>{this.imageCache.delete(src);throw error;}));}image=await this.imageCache.get(r.image)!;}let logo:HTMLImageElement|undefined;if(r.showLogo&&!stack.layers.logo.hidden&&stack.layers.logo.opacity>0){if(!this.logo)this.logo=decodeImage(this.logoSource).catch(error=>{this.logo=undefined;throw error;});logo=await this.logo;}return {image,logo};}
  private async render(){const revision=++this.revision,design=this.design,id=this.id;let mainReady=false;const canvas=this.q('rc-canvas') as HTMLCanvasElement;this.composition=undefined;canvas.setAttribute('aria-busy','true');this.properties();this.controls();const t=targetFor(id);this.q('rc-current').textContent=`${t.ratio} · ${t.width} × ${t.height}`;this.q('rc-overrides').textContent=overrideCount(design,id)?`局部覆盖 ${overrideCount(design,id)} 项`:'跟随主设计';this.q('rc-tool-guides').setAttribute('aria-pressed',String(this.input('rc-guides').checked));
    try{const assets=await this.assets(design,id);if(revision!==this.revision||!this.element.open)return;this.composition=paint(this.q('rc-canvas') as HTMLCanvasElement,design,id,assets,{maxWidth:1100,guides:this.input('rc-guides').checked,selected:this.selected});mainReady=true;canvas.setAttribute('aria-busy','false');this.q('rc-warning').textContent=this.composition.warnings.join('；');const b=this.composition[this.layer];for(const [key,value] of [['x',b.x/this.composition.width],['y',b.y/this.composition.height],['w',b.w/this.composition.width]] as const)this.input(`rc-${key}`).value=String(Math.round(value*100));const o=design.variants[id].frames[this.layer];this.input('rc-scale').value=String((o?.scale??1)*100);this.input('rc-hidden').checked=layerStack(design,id).layers[this.layer].hidden;this.properties();this.layers.refresh();
      for(const target of targets){const a=await this.assets(design,target.id);if(revision!==this.revision)return;const card=this.element.querySelector<HTMLButtonElement>(`[data-variant="${target.id}"]`)!;card.setAttribute('aria-pressed',String(target.id===id));const l=paint(card.querySelector('canvas')!,design,target.id,a,{maxWidth:180});card.querySelector('small')!.textContent=l.warnings.length?'需调整':overrideCount(design,target.id)?'局部覆盖':'联动';}
    }catch(error){if(revision===this.revision){if(!mainReady){this.composition=undefined;canvas.width=1;canvas.height=1;canvas.setAttribute('aria-busy','false');this.properties();}this.status(error instanceof Error?error.message:'预览失败');}}}
  private async upload(file:File){const inputJob=++this.inputJob,job=this.job,id=this.id,scope=this.scope();try{const src=await readRaster(file);if(inputJob!==this.inputJob||job!==this.job||!this.element.open||layerStack(this.design,id).layers.image.locked)return;this.commit(editDesign(this.design,id,scope,{image:src}));this.status('主图已读取；可在图层列表中选择、排序及调整。');}catch(e){if(inputJob===this.inputJob&&job===this.job&&this.element.open)this.status(e instanceof Error?e.message:'图片读取失败');}finally{this.input('rc-image').value='';}}
  private async load(file:File){const inputJob=++this.inputJob,job=this.job;try{if(file.size>MAX_DESIGN_BYTES)throw new Error('设计文件超过 20MB');const d=parseDesign(await file.text());if(inputJob!==this.inputJob||job!==this.job||!this.element.open)return;this.layers.cancelInteractions();this.cancelGesture();this.commit(d);this.status('已载入可编辑设计与图层设置。');}catch(e){if(inputJob===this.inputJob&&job===this.job&&this.element.open)this.status(e instanceof Error?e.message:'设计无法载入');}finally{this.input('rc-load').value='';}}
  private movable(){return this.selected.filter(layer=>!this.isLocked(layer)&&!this.composition?.[layer].hidden);}
  private moved(before:CoverDesign,layout:Composition,layers:Layer[],dx:number,dy:number){
    const frames=translatedFrames(layout,layers,dx,dy);
    return Object.keys(frames).length?editDesign(before,this.id,'one',{},frames):before;
  }
  private moveSelection(dx:number,dy:number){if(this.composition)this.commit(this.moved(this.design,this.composition,this.movable(),dx,dy));}
  private pointerDown(e:PointerEvent){
    if(e.button!==0||!this.composition)return;
    const canvas=this.q('rc-canvas'),r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*this.composition.width,py=(e.clientY-r.top)/r.height*this.composition.height;
    const order=layerStack(this.design,this.id).order;
    const hit=order.find(k=>{const b=this.composition![k];return !b.hidden&&!this.isLocked(k)&&px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h;});
    if(!hit){if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey){this.select([],this.layer);canvas.focus();}return;}
    e.preventDefault();
    if(e.shiftKey||e.ctrlKey||e.metaKey){this.select(selectLayers(order,this.selected,this.layer,hit,{toggle:true}),hit);return;}
    if(!this.selected.includes(hit))this.selected=[hit];this.layer=hit;
    this.gesture={before:this.design,pointer:e.pointerId,px:e.clientX,py:e.clientY,layout:this.composition,layers:this.movable()};
    canvas.setPointerCapture(e.pointerId);canvas.focus();this.fields();void this.render();
  }
  private pointerMove(e:PointerEvent){
    const g=this.gesture;if(!g||g.pointer!==e.pointerId)return;
    const r=this.q('rc-canvas').getBoundingClientRect();
    this.design=this.moved(g.before,g.layout,g.layers,(e.clientX-g.px)/r.width*g.layout.width,(e.clientY-g.py)/r.height*g.layout.height);void this.render();
  }
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

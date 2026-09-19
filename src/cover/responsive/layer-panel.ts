import type { CoverDesign, Layer } from './model';
import type { Composition } from './layout';
import { DEFAULT_ORDER, layerStack, selectLayers, type LayerMeta } from './layer-stack';
import { icon } from './workspace-ui';

export interface LayerPanelState { design: CoverDesign; id: string; selected: Layer[]; active: Layer; composition?: Composition }
export interface LayerPanelActions {
  read(): LayerPanelState;
  select(layers: Layer[], active: Layer): void;
  change(layers: Layer[], patch: Partial<LayerMeta>): void;
  reorder(layers: Layer[], target: Layer, side: 'before'|'after'): void;
  reset(layer: Layer): void;
}
/** View only. All mutations go through the owner's shared undo/redo and variant model. */
export class LayerPanel {
  private rows = new Map<Layer, HTMLElement>();
  private anchor: Layer = 'title';
  private drag?: {pointer:number;capture:HTMLElement;x:number;y:number;layers:Layer[];moved:boolean;target?:Layer;side?:'before'|'after'};
  private cancelRename?:()=>void;
  private suppressClick=false;
  private menu: HTMLElement;
  private abort = new AbortController();
  constructor(private host: HTMLElement, private actions: LayerPanelActions, private logoSource: string) {
    host.innerHTML = `<h3>图层</h3><div class="rc-layer-tools"><button class="rc-icon" id="rc-layer-visible" title="切换选中图层显隐" aria-label="切换选中图层显隐">${icon('eye')}</button><button class="rc-icon" id="rc-layer-lock" title="锁定 / 解锁选中图层" aria-label="锁定 / 解锁选中图层">${icon('lock')}</button><label>不透明度<input id="rc-opacity" type="number" min="0" max="100" step="1" aria-label="选中图层不透明度">%</label></div><div id="rc-layer-list" role="grid" aria-label="图层列表" aria-multiselectable="true"></div><div class="rc-layer-row rc-pinned" aria-label="纸底，固定在底部"><span>${icon('eye')}</span><span class="rc-thumb" id="rc-paper-thumb"></span><span class="rc-layer-label">纸底<small> · 固定底层</small></span><span>${icon('lock')}</span></div><div class="rc-layer-footer"><span id="rc-selection-count"></span><button id="rc-layer-up" class="rc-icon" aria-label="上移图层" title="上移图层（Ctrl / ⌘ [ ]）">${icon('up')}</button><button id="rc-layer-down" class="rc-icon" aria-label="下移图层" title="下移图层">${icon('down')}</button><button id="rc-layer-reset" class="rc-icon" aria-label="恢复当前图层的局部修改" title="恢复当前图层的局部修改">${icon('reset')}</button></div><p class="rc-hint" style="padding:0 12px 10px">Shift 连选 · Ctrl / ⌘ 多选 · 双击名称重命名<br>拖动排序；触屏可使用上下箭头。</p>`;
    const signal = this.abort.signal, list = host.querySelector<HTMLElement>('#rc-layer-list')!;
    for (const layer of DEFAULT_ORDER) {
      const row=document.createElement('div');row.className='rc-layer-row';row.dataset.layer=layer;row.setAttribute('role','row');row.tabIndex=-1;row.draggable=false;
      row.innerHTML=`<div role="gridcell"><button class="rc-icon" data-action="visible" aria-label="切换显隐">${icon('eye')}</button></div><div role="gridcell" class="rc-thumb"></div><div role="gridcell" class="rc-layer-label"><button class="rc-layer-name" data-action="name"></button><small class="rc-layer-detail"></small></div><div role="gridcell"><button class="rc-icon" data-action="lock" aria-label="切换锁定">${icon('unlock')}</button></div>`;
      row.addEventListener('click',event=>{
        if(this.suppressClick){this.suppressClick=false;return;}
        if ((event.target as Element).closest('input')) return;
        const action=(event.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action;
        if(action==='visible'||action==='lock') {
          const meta=layerStack(this.actions.read().design,this.actions.read().id).layers[layer];
          this.actions.change([layer],action==='visible'?{hidden:!meta.hidden}:{locked:!meta.locked});return;
        }
        this.choose(layer,event.shiftKey,event.ctrlKey||event.metaKey);
      },{signal});
      row.querySelector('[data-action=name]')!.addEventListener('dblclick',event=>{event.preventDefault();this.rename(layer);},{signal});
      row.addEventListener('keydown',event=>this.keydown(event,layer),{signal});
      // Pointer capture avoids native browser/OS drag ghosts and works with touch as well.
      row.addEventListener('pointerdown',event=>{
        if(event.button!==0||event.shiftKey||event.ctrlKey||event.metaKey||(event.target as Element).closest('input,[data-action=visible],[data-action=lock]'))return;
        const state=this.actions.read();
        const layers=state.selected.includes(layer)?[...state.selected]:[layer];
        if(!state.selected.includes(layer)){this.actions.select(layers,layer);this.anchor=layer;}
        const capture=(event.target as Element).closest<HTMLElement>('.rc-layer-name')??row;
        this.drag={pointer:event.pointerId,capture,x:event.clientX,y:event.clientY,layers,moved:false};
        capture.setPointerCapture(event.pointerId);row.focus();
      },{signal});
      row.addEventListener('pointermove',event=>{
        const drag=this.drag;if(!drag||drag.pointer!==event.pointerId)return;
        if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5&&!drag.moved)return;
        drag.moved=true;event.preventDefault();this.clearDrop();drag.target=undefined;
        for(const [key,candidate] of this.rows){const r=candidate.getBoundingClientRect();
          if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom&&!drag.layers.includes(key)){
            drag.target=key;drag.side=event.clientY<r.top+r.height/2?'before':'after';candidate.dataset.drop=drag.side;break;
          }
        }
      },{signal});
      row.addEventListener('pointerup',event=>{
        const drag=this.drag;if(!drag||drag.pointer!==event.pointerId)return;this.cancelDrag();
        if(drag.moved){this.suppressClick=true;setTimeout(()=>{this.suppressClick=false;},0);if(drag.target&&drag.side)this.actions.reorder(drag.layers,drag.target,drag.side);}
      },{signal});
      for(const event of ['pointercancel','lostpointercapture'])row.addEventListener(event,()=>this.cancelDrag(),{signal});
      row.addEventListener('contextmenu',event=>{event.preventDefault();if(!this.actions.read().selected.includes(layer))this.actions.select([layer],layer);this.openMenu(event.clientX,event.clientY,layer);},{signal});
      list.append(row);this.rows.set(layer,row);
    }
    const on=(id:string,fn:()=>void)=>host.querySelector(`#${id}`)!.addEventListener('click',fn,{signal});
    on('rc-layer-visible',()=>this.batch('hidden'));on('rc-layer-lock',()=>this.batch('locked'));
    on('rc-layer-up',()=>this.arrange(-1));on('rc-layer-down',()=>this.arrange(1));
    on('rc-layer-reset',()=>{const s=this.actions.read();if(s.selected.length===1&&!layerStack(s.design,s.id).layers[s.active].locked)this.actions.reset(s.active);});
    host.querySelector<HTMLInputElement>('#rc-opacity')!.addEventListener('change',event=>{
      const input=event.target as HTMLInputElement,n=input.valueAsNumber,s=this.actions.read();
      if(Number.isFinite(n)&&s.selected.length&&!s.selected.some(layer=>layerStack(s.design,s.id).layers[layer].locked))this.actions.change(s.selected,{opacity:Math.min(100,Math.max(0,n))/100});
      this.refresh();
    },{signal});
    this.menu=document.createElement('div');this.menu.className='rc-menu';this.menu.setAttribute('role','menu');this.menu.hidden=true;this.host.append(this.menu);
    this.menu.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.closeMenu();return;}
      if(event.key==='Tab'){this.closeMenu(false);return;}
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const items=[...this.menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const at=items.indexOf(document.activeElement as HTMLButtonElement);
      const next=event.key==='Home'?0:event.key==='End'?items.length-1:(at+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items[next]?.focus();
    },{signal});
    window.addEventListener('blur',()=>this.cancelInteractions(),{signal});
    window.addEventListener('resize',()=>{this.cancelDrag();this.closeMenu(false);},{signal});
    host.closest('dialog')!.addEventListener('pointerdown',event=>{if(!this.menu.contains(event.target as Node))this.closeMenu(false);},{signal});
  }
  private choose(layer:Layer,shift=false,toggle=false) {
    const s=this.actions.read();this.actions.select(selectLayers(layerStack(s.design,s.id).order,s.selected,this.anchor,layer,{shift,toggle}),layer);
    if(!shift)this.anchor=layer;
  }
  private batch(property:'hidden'|'locked') {
    const s=this.actions.read(),stack=layerStack(s.design,s.id);if(!s.selected.length)return;
    this.actions.change(s.selected,{[property]:!s.selected.every(layer=>stack.layers[layer][property])});
  }
  private arrange(direction:-1|1) {
    const s=this.actions.read(),order=layerStack(s.design,s.id).order;
    const indices=s.selected.map(layer=>order.indexOf(layer));if(!indices.length)return;
    const at=direction===-1?Math.min(...indices)-1:Math.max(...indices)+1;
    if(at>=0&&at<order.length)this.actions.reorder(s.selected,order[at],direction===-1?'before':'after');
  }
  private keydown(event:KeyboardEvent,layer:Layer) {
    if(event.isComposing||(event.target as Element).closest('input'))return;
    if(event.key==='Escape'&&this.drag){event.preventDefault();event.stopPropagation();this.cancelDrag();return;}
    if(event.key==='F2'){event.preventDefault();this.rename(layer);return;}
    if((event.ctrlKey||event.metaKey)&&event.key==='/'){event.preventDefault();this.batch('locked');return;}
    if((event.ctrlKey||event.metaKey)&&['[',']'].includes(event.key)){event.preventDefault();this.arrange(event.key===']'?-1:1);return;}
    if(event.key===' '||event.key==='Enter'){event.preventDefault();this.choose(layer,event.shiftKey,event.ctrlKey||event.metaKey);return;}
    if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      event.preventDefault();const s=this.actions.read(),order=layerStack(s.design,s.id).order;
      const at=event.key==='Home'?0:event.key==='End'?order.length-1:Math.max(0,Math.min(order.length-1,order.indexOf(layer)+(event.key==='ArrowUp'?-1:1)));
      this.choose(order[at],event.shiftKey,false);this.rows.get(order[at])!.focus();
    }
  }
  private rename(layer:Layer) {
    const s=this.actions.read(),meta=layerStack(s.design,s.id).layers[layer];if(meta.locked)return;
    const row=this.rows.get(layer)!,name=row.querySelector<HTMLButtonElement>('.rc-layer-name')!;
    if(row.querySelector('input'))return;
    const input=document.createElement('input');input.className='rc-rename';input.maxLength=80;input.value=meta.name;input.setAttribute('aria-label','图层名称');name.hidden=true;name.after(input);row.draggable=false;
    let done=false;
    const finish=(save:boolean,focus=true)=>{if(done)return;done=true;this.cancelRename=undefined;const value=input.value.trim();input.remove();name.hidden=false;row.draggable=false;if(save&&value&&value!==meta.name)this.actions.change([layer],{name:value});if(focus)row.focus();};
    this.cancelRename=()=>finish(false,false);
    input.addEventListener('keydown',event=>{event.stopPropagation();if(event.isComposing)return;if(event.key==='Enter'){event.preventDefault();finish(true);}else if(event.key==='Escape'){event.preventDefault();finish(false);}});
    input.addEventListener('blur',()=>finish(true));input.focus();input.select();
  }
  private cancelDrag(){const drag=this.drag;this.drag=undefined;this.clearDrop();if(drag?.capture.hasPointerCapture(drag.pointer))drag.capture.releasePointerCapture(drag.pointer);}
  cancelInteractions(){this.cancelDrag();this.closeMenu(false);this.cancelRename?.();}
  private clearDrop(){for(const row of this.rows.values())delete row.dataset.drop;}
  private closeMenu(restore=true){const visible=!this.menu.hidden;this.menu.hidden=true;if(visible&&restore)this.rows.get(this.actions.read().active)?.focus();}
  private openMenu(x:number,y:number,layer:Layer) {
    this.menu.replaceChildren();const s=this.actions.read(),meta=layerStack(s.design,s.id).layers[layer];
    const entries:Array<[string,()=>void,boolean?]>=[['重命名',()=>this.rename(layer),meta.locked],['切换可见',()=>this.batch('hidden')],['锁定 / 解锁',()=>this.batch('locked')],['上移',()=>this.arrange(-1)],['下移',()=>this.arrange(1)],['恢复当前图层局部修改',()=>this.actions.reset(layer),meta.locked]];
    for(const [label,run,disabled] of entries){const b=document.createElement('button');b.textContent=label;b.setAttribute('role','menuitem');b.disabled=!!disabled;b.addEventListener('click',()=>{this.closeMenu(false);run();});this.menu.append(b);}
    this.menu.hidden=false;const bounds=this.host.closest('dialog')!.getBoundingClientRect();
    // Fixed descendants of the dialog use the viewport in supported browsers.
    this.menu.style.left=`${Math.min(Math.max(bounds.left+8,x),bounds.right-200)}px`;this.menu.style.top=`${Math.min(Math.max(bounds.top+8,y),bounds.bottom-240)}px`;
    this.menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }
  refresh() {
    const s=this.actions.read(),stack=layerStack(s.design,s.id),list=this.host.querySelector('#rc-layer-list')!;
    const current=[...list.children].map(row=>(row as HTMLElement).dataset.layer).join(',');
    if(current!==stack.order.join(','))for(const layer of stack.order)list.append(this.rows.get(layer)!);
    for(const layer of stack.order) {
      const row=this.rows.get(layer)!,meta=stack.layers[layer],selected=s.selected.includes(layer);
      row.setAttribute('aria-selected',String(selected));row.tabIndex=layer===s.active?0:-1;
      row.dataset.muted=String(s.composition?.[layer].hidden??meta.hidden);
      const name=row.querySelector<HTMLElement>('.rc-layer-name')!;name.textContent=meta.name;name.title=meta.name;
      row.querySelector<HTMLElement>('.rc-layer-detail')!.textContent=(layer==='image'?'图片':layer==='logo'?'品牌标识':'文字')+(meta.locked?' · 已锁定':'')+(meta.opacity<1?` · ${Math.round(meta.opacity*100)}%`:'');
      for(const [action,active,svg] of [['visible',!meta.hidden,icon(meta.hidden?'hidden':'eye')],['lock',meta.locked,icon(meta.locked?'lock':'unlock')]] as const){const b=row.querySelector<HTMLButtonElement>(`[data-action=${action}]`)!;b.innerHTML=svg;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',`${action==='visible'?(meta.hidden?'显示':'隐藏'):(meta.locked?'解锁':'锁定')}${meta.name}`);}
      const thumb=row.querySelector<HTMLElement>('.rc-thumb')!;
      const r={...s.design.master,...s.design.variants[s.id].content};
      if(layer==='title'||layer==='subtitle'){thumb.textContent='T';}
      else {const src=layer==='logo'?this.logoSource:r.image;const old=thumb.querySelector('img');if(src){if(!old||old.getAttribute('src')!==src){const image=document.createElement('img');image.src=src;image.alt='';thumb.replaceChildren(image);}}else thumb.innerHTML=icon('image');}
    }
    this.host.querySelector<HTMLElement>('#rc-paper-thumb')!.style.backgroundColor=s.composition?.recipe.paper??s.design.master.paper;
    const selected=s.selected.map(layer=>stack.layers[layer]),locked=selected.some(meta=>meta.locked);
    const opacity=this.host.querySelector<HTMLInputElement>('#rc-opacity')!;
    opacity.disabled=!selected.length||locked;const mixed=selected.some(meta=>meta.opacity!==selected[0].opacity);
    if(document.activeElement!==opacity){opacity.value=!selected.length||mixed?'':String(Math.round(selected[0].opacity*100));opacity.placeholder=mixed?'—':'';}
    for(const id of ['rc-layer-visible','rc-layer-lock'])this.host.querySelector<HTMLButtonElement>(`#${id}`)!.disabled=!selected.length;
    this.host.querySelector('#rc-layer-lock')!.setAttribute('aria-pressed',String(selected.length>0&&selected.every(meta=>meta.locked)));
    this.host.querySelector<HTMLButtonElement>('#rc-layer-up')!.disabled=!selected.length||s.selected.includes(stack.order[0]);
    this.host.querySelector<HTMLButtonElement>('#rc-layer-down')!.disabled=!selected.length||s.selected.includes(stack.order.at(-1)!);
    this.host.querySelector<HTMLButtonElement>('#rc-layer-reset')!.disabled=selected.length!==1||locked;
    this.host.querySelector('#rc-selection-count')!.textContent=`${selected.length} 个选中 · 4 个内容图层`;
  }
  destroy(){this.cancelInteractions();this.abort.abort();this.menu.remove();this.host.replaceChildren();}
}

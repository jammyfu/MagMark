import { type CoverDesign, type Layer, type FrameOverride, type Recipe, resolveRecipe, targetFor } from './model';
import { layerStack } from './layer-stack';
export interface Box {x:number;y:number;w:number;h:number}
export interface TextBox extends Box {lines:string[];size:number;lineHeight:number;hidden:boolean}
export interface Composition {width:number;height:number;recipe:Recipe;title:TextBox;subtitle:TextBox;logo:TextBox;image:TextBox;square:Box;warnings:string[]}
export type Measure = (text:string,px:number,font:Recipe['font'],bold:boolean)=>number;
export const fontFamily = (kind:Recipe['font']) => kind==='serif' ? '"Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif' : '"Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif';
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const approximate:Measure=(text,px)=>Array.from(text).reduce((n,c)=>n+(/[^\u0000-\u00ff]/.test(c)?1:.57)*px,0);
export function wrapText(text:string,width:number,measure:(text:string)=>number):string[] {
  const result:string[]=[];
  for(const paragraph of text.split('\n')) {
    let line='';
    for(const char of Array.from(paragraph)) {
      if(line && measure(line+char)>width) {result.push(line);line=char;} else line+=char;
    }
    result.push(line);
  }
  return result;
}
/** Crop a source rectangle to the destination aspect; pixels are never stretched. */
export function focalCrop(sw:number,sh:number,dw:number,dh:number,fx:number,fy:number):Box {
  if(![sw,sh,dw,dh].every(v=>Number.isFinite(v)&&v>0))throw new Error('无效图片尺寸');
  const scale=Math.max(dw/sw,dh/sh),w=dw/scale,h=dh/scale;
  return {x:clamp(clamp(fx,0,1)*sw-w/2,0,sw-w),y:clamp(clamp(fy,0,1)*sh-h/2,0,sh-h),w,h};
}
export function compose(design:CoverDesign,id:string,measure:Measure=approximate):Composition {
  const target=targetFor(id),W=target.width,H=target.height,r=resolveRecipe(design,id),wide=W/H>1.2,min=Math.min(W,H);
  const stack=layerStack(design,id);
  const square={x:(W-min)/2,y:(H-min)/2,w:min,h:min};
  const safe=r.squareSafe? square:{x:0,y:0,w:W,h:H};
  const margin=min*.065, left=safe.x+margin, top=safe.y+margin, width=safe.w-margin*2;
  const withImage=!!r.image;
  const availableH=safe.h-margin*2;
  let image:Box={x:left,y:top,w:width,h:availableH*.47};
  let title:Box,subtitle:Box,logo:Box;
  if(wide && !r.squareSafe) {
    title={x:left,y:top+availableH*.18,w:withImage?width*.51:width*.84,h:availableH*.45};
    image={x:left+width*.58,y:top,w:width*.42,h:availableH};
    subtitle={x:left,y:top+availableH*.68,w:title.w,h:availableH*.17};
  } else {
    title={x:left,y:top+availableH*(withImage?.57:.23),w:width,h:availableH*(withImage?.25:.39)};
    subtitle={x:left,y:top+availableH*(withImage?.85:.66),w:width,h:availableH*(withImage?.12:.19)};
  }
  logo={x:left,y:top,w:Math.min(width*.28,min*.32),h:min*.075};
  if(withImage && (!wide||r.squareSafe)) {image.y=top+availableH*.13;image.h=availableH*.39;}
  const warnings:string[]=[];
  const make=(kind:'title'|'subtitle'|'logo',box:Box,text:string,base:number):TextBox=>{
    const override=design.variants[id].frames[kind]||{};
    if(override.w!==undefined)box.w=clamp(override.w*W,min*.08,width);
    if(override.x!==undefined)box.x=override.x*W;
    if(override.y!==undefined)box.y=override.y*H;
    box.x=clamp(box.x,left,left+width-box.w);box.y=clamp(box.y,top,top+availableH-box.h);
    let size=Math.round(base*(override.scale??1)),lines:string[]=[];
    const floor=Math.max(12,Math.round(min*.019));
    for(;size>floor;size--) {lines=wrapText(text,box.w,s=>measure(s,size,r.font,kind==='title'));if(lines.length*size*1.24<=box.h)break;}
    lines=wrapText(text,box.w,s=>measure(s,size,r.font,kind==='title'));
    const meta=stack.layers[kind];
    const hidden=meta.hidden||meta.opacity===0||(kind==='logo'&&!r.showLogo)||!text;
    if(!hidden && kind!=='logo' && (lines.length*size*1.24>box.h+.1 || lines.some(s=>measure(s,size,r.font,kind==='title')>box.w+.1))) warnings.push(`${kind==='title'?'标题':'副标题'}超出文字框，请缩短文案或调整布局`);
    return {...box,lines,size,lineHeight:size*1.24,hidden};
  };
  // Image frames use the same normalized local coordinates, retaining the source aspect via focalCrop.
  const imageOverride=design.variants[id].frames.image;
  if(imageOverride?.w!==undefined) image.w=clamp(imageOverride.w*W,min*.08,width);
  image.x=clamp((imageOverride?.x??image.x/W)*W,left,left+width-image.w);
  image.y=clamp((imageOverride?.y??image.y/H)*H,top,top+availableH-image.h);
  const imageBox:TextBox={...image,lines:[],size:0,lineHeight:0,hidden:!r.image||stack.layers.image.hidden||stack.layers.image.opacity===0};
  const result:Composition={width:W,height:H,recipe:r,title:make('title',title,r.title,min*.105),subtitle:make('subtitle',subtitle,r.subtitle,min*.034),logo:make('logo',logo,'MagMark',min*.043),image:imageBox,square,warnings};
  const a=result.title,b=result.subtitle;
  if(!a.hidden&&!b.hidden&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y) warnings.push('标题与副标题文字框重叠，请调整位置');
  return result;
}

/** Clamp one translation for the entire selection, never each layer independently. */
export function translatedFrames(layout: Composition, layers: readonly Layer[], dx: number, dy: number): Partial<Record<Layer, FrameOverride>> {
  const result: Partial<Record<Layer, FrameOverride>> = {};
  if (!layers.length || !Number.isFinite(dx) || !Number.isFinite(dy)) return result;
  const { width: W, height: H } = layout, margin = Math.min(W, H) * .065;
  const safe = layout.recipe.squareSafe ? layout.square : {x: 0, y: 0, w: W, h: H};
  let minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity;
  for (const layer of layers) {
    const b = layout[layer];
    minX = Math.max(minX, safe.x + margin - b.x);
    maxX = Math.min(maxX, safe.x + safe.w - margin - b.x - b.w);
    minY = Math.max(minY, safe.y + margin - b.y);
    maxY = Math.min(maxY, safe.y + safe.h - margin - b.y - b.h);
  }
  dx = clamp(dx, minX, maxX); dy = clamp(dy, minY, maxY);
  if (Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7) return result;
  for (const layer of layers) result[layer] = {x: (layout[layer].x + dx) / W, y: (layout[layer].y + dy) / H};
  return result;
}

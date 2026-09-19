import { type CoverDesign, type Layer, type Recipe, resolveRecipe, targetFor } from './model';
export interface Box {x:number;y:number;w:number;h:number}
export interface TextBox extends Box {lines:string[];size:number;lineHeight:number;hidden:boolean}
export interface Composition {width:number;height:number;recipe:Recipe;title:TextBox;subtitle:TextBox;logo:TextBox;image:Box;square:Box;warnings:string[]}
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
  const make=(kind:Layer,box:Box,text:string,base:number):TextBox=>{
    const override=design.variants[id].frames[kind]||{};
    if(override.w!==undefined)box.w=clamp(override.w*W,min*.08,width);
    if(override.x!==undefined)box.x=override.x*W;
    if(override.y!==undefined)box.y=override.y*H;
    box.x=clamp(box.x,left,left+width-box.w);box.y=clamp(box.y,top,top+availableH-box.h);
    let size=Math.round(base*(override.scale??1)),lines:string[]=[];
    const floor=Math.max(12,Math.round(min*.019));
    for(;size>floor;size--) {lines=wrapText(text,box.w,s=>measure(s,size,r.font,kind==='title'));if(lines.length*size*1.24<=box.h)break;}
    lines=wrapText(text,box.w,s=>measure(s,size,r.font,kind==='title'));
    const hidden=override.hidden===true||(kind==='logo'&&!r.showLogo)||!text;
    if(!hidden && (lines.length*size*1.24>box.h+.1 || lines.some(s=>measure(s,size,r.font,kind==='title')>box.w+.1))) warnings.push(`${kind==='title'?'标题':'副标题'}超出文字框，请缩短文案或调整布局`);
    return {...box,lines,size,lineHeight:size*1.24,hidden};
  };
  const result:Composition={width:W,height:H,recipe:r,title:make('title',title,r.title,min*.105),subtitle:make('subtitle',subtitle,r.subtitle,min*.034),logo:make('logo',logo,'MagMark',min*.043),image,square,warnings};
  const a=result.title,b=result.subtitle;
  if(!a.hidden&&!b.hidden&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y) warnings.push('标题与副标题文字框重叠，请调整位置');
  return result;
}

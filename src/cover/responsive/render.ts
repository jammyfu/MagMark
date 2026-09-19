import { type CoverDesign, type Layer, isRasterData } from './model';
import { compose, focalCrop, fontFamily, type Composition, type Measure } from './layout';
export interface Assets {image?:HTMLImageElement;logo?:HTMLImageElement}
export async function decodeImage(src:string):Promise<HTMLImageElement> {
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>{image.src='';reject(new Error('图片加载超时'));},8000);
    image.onload=()=>{clearTimeout(timer);resolve();};
    image.onerror=()=>{clearTimeout(timer);reject(new Error('图片无法读取'));};
    image.src=src;
  });
  if(image.naturalWidth*image.naturalHeight>24_000_000) throw new Error('图片尺寸过大，请缩小到 2400 万像素以内');
  return image;
}
export async function readRaster(file:File):Promise<string> {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024) throw new Error('请选择 10MB 以内的 PNG、JPEG 或 WebP');
  const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('文件无法读取'));reader.readAsDataURL(file);});
  if(!isRasterData(src))throw new Error('图片格式无效');
  await decodeImage(src);return src;
}
export function paint(canvas:HTMLCanvasElement,design:CoverDesign,id:string,assets:Assets={},options:{maxWidth?:number;guides?:boolean;selected?:Layer}={}):Composition {
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器不支持画布');
  const measure:Measure=(text,px,font,bold)=>{ctx.font=`${bold?700:400} ${px}px ${fontFamily(font)}`;return ctx.measureText(text).width;};
  const layout=compose(design,id,measure),r=layout.recipe,scale=Math.min(1,(options.maxWidth||layout.width)/layout.width);
  canvas.width=Math.round(layout.width*scale);canvas.height=Math.round(layout.height*scale);
  ctx.scale(canvas.width/layout.width,canvas.height/layout.height);
  ctx.fillStyle=r.paper;ctx.fillRect(0,0,layout.width,layout.height);
  if(r.image && assets.image) {
    const b=layout.image,c=focalCrop(assets.image.naturalWidth,assets.image.naturalHeight,b.w,b.h,r.focalX,r.focalY);
    ctx.drawImage(assets.image,c.x,c.y,c.w,c.h,b.x,b.y,b.w,b.h);
  }
  ctx.textBaseline='top';ctx.fillStyle=r.ink;
  for(const kind of ['title','subtitle','logo'] as const) {
    const b=layout[kind];if(b.hidden)continue;
    if(kind==='logo'&&assets.logo) {
      const s=Math.min(b.w/assets.logo.naturalWidth,b.h/assets.logo.naturalHeight),w=assets.logo.naturalWidth*s,h=assets.logo.naturalHeight*s;
      // Recolor only the known bundled monochrome logo, keeping its exact silhouette.
      const stamp=document.createElement('canvas');stamp.width=Math.ceil(w*2);stamp.height=Math.ceil(h*2);
      const ink=stamp.getContext('2d')!;ink.drawImage(assets.logo,0,0,stamp.width,stamp.height);ink.globalCompositeOperation='source-in';ink.fillStyle=r.ink;ink.fillRect(0,0,stamp.width,stamp.height);
      ctx.drawImage(stamp,b.x,b.y,w,h);stamp.width=1;continue;
    }
    ctx.font=`${kind==='title'?700:400} ${b.size}px ${fontFamily(r.font)}`;ctx.fillStyle=r.ink;
    ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();
    b.lines.forEach((line,i)=>{const w=ctx.measureText(line).width,x=b.x+(r.align==='center'?(b.w-w)/2:r.align==='right'?b.w-w:0);ctx.fillText(line,x,b.y+i*b.lineHeight);});ctx.restore();
  }
  if(options.guides) {
    const b=layout.square;ctx.save();ctx.strokeStyle='#1677ff';ctx.lineWidth=1.5/scale;ctx.setLineDash([7/scale,5/scale]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore();
  }
  if(options.selected) {const b=layout[options.selected];if(!b.hidden){ctx.save();ctx.strokeStyle='#1677ff';ctx.lineWidth=1.5/scale;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore();}}
  return layout;
}
export async function pngBlob(design:CoverDesign,id:string,assets:Assets):Promise<Blob> {
  const canvas=document.createElement('canvas');
  try {
    const layout=paint(canvas,design,id,assets);
    if(layout.recipe.image&&!assets.image)throw new Error('主图尚未加载，不能导出');
    if(layout.warnings.length)throw new Error(layout.warnings.join('；'));
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 编码失败')),'image/png'));
  }finally{canvas.width=1;canvas.height=1;}
}
/** Stored ZIP records: no dependency, compression, executable entries or path traversal. */
export function makeZip(files:Array<{name:string;data:Uint8Array}>):Blob {
  if(files.length>10)throw new Error('批量输出过多');
  const parts:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0,total=0;
  const crc=(data:Uint8Array)=>{let c=0xffffffff;for(const byte of data){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  for(const file of files) {
    if(!/^[a-z0-9][a-z0-9_.-]*\.png$/i.test(file.name))throw new Error('无效导出文件名');
    total+=file.data.byteLength;if(total>80_000_000)throw new Error('导出包超过 80MB，请分别导出');
    const name=new TextEncoder().encode(file.name),checksum=crc(file.data),header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
    view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(12,33,true);view.setUint32(14,checksum,true);view.setUint32(18,file.data.length,true);view.setUint32(22,file.data.length,true);view.setUint16(26,name.length,true);header.set(name,30);
    const index=new Uint8Array(46+name.length),iv=new DataView(index.buffer);
    iv.setUint32(0,0x02014b50,true);iv.setUint16(4,20,true);iv.setUint16(6,20,true);iv.setUint16(14,33,true);iv.setUint32(16,checksum,true);iv.setUint32(20,file.data.length,true);iv.setUint32(24,file.data.length,true);iv.setUint16(28,name.length,true);iv.setUint32(42,offset,true);index.set(name,46);
    parts.push(header,file.data);central.push(index);offset+=header.length+file.data.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
  return new Blob([...parts,...central,end].map(p=>new Uint8Array(p).buffer),{type:'application/zip'});
}
export function saveBlob(blob:Blob,name:string):void {
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);
}

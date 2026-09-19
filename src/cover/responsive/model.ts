import { MEDIA_PRESETS } from '../media-presets';

import { DEFAULT_ORDER, parseStack, type Layer, type StackPatch } from './layer-stack';
export type { Layer } from './layer-stack';
export type Scope = 'all' | 'one';
export interface Recipe {
  title: string; subtitle: string; image: string;
  paper: string; ink: string; accent: string;
  font: 'serif' | 'sans'; align: 'left' | 'center' | 'right';
  showLogo: boolean; squareSafe: boolean; focalX: number; focalY: number;
}
export interface FrameOverride { x?: number; y?: number; w?: number; scale?: number; hidden?: boolean }
export interface Variant { content: Partial<Recipe>; frames: Partial<Record<Layer, FrameOverride>>; stack?: StackPatch }
export interface CoverDesign { version: 1; master: Recipe; variants: Record<string, Variant>; stack?: StackPatch }
export interface Target { id: string; name: string; ratio: string; width: number; height: number }
const ids = ['wx-wide','wx-square','xhs-note','article-hero','vertical-video'];
export const targets: Target[] = [
  ...ids.map(id => { const p = MEDIA_PRESETS.find(t => t.id === id)!; return {id:p.id,name:p.name,ratio:p.ratio,width:p.width,height:p.height}; }),
  {id:'portrait-4-5',name:'通用竖版',ratio:'4:5',width:1080,height:1350},
];
export function targetFor(id: string): Target {
  const target = targets.find(t => t.id === id);
  if (!target) throw new Error('未知封面比例');
  return target;
}
export function createDesign(title = '', subtitle = ''): CoverDesign {
  return {version:1,master:{title,subtitle,image:'',paper:'#f5f3ee',ink:'#202124',accent:'#a85b3d',font:'serif',align:'left',showLogo:true,squareSafe:false,focalX:.5,focalY:.5},
    variants:Object.fromEntries(targets.map(t => [t.id,{content:{},frames:{}}]))};
}
export function resolveRecipe(design: CoverDesign, id: string): Recipe {
  targetFor(id);
  return {...design.master,...design.variants[id].content};
}
/** Shared edits never overwrite per-field overrides, including explicit '' and false. */
export function editDesign(design: CoverDesign, id: string, scope: Scope, patch: Partial<Recipe>, frames: Partial<Record<Layer, FrameOverride>> = {}): CoverDesign {
  targetFor(id);
  const owner = scope === 'all' ? design.master : design.variants[id].content;
  const contentChanged = Object.entries(patch).some(([key, value]) => owner[key as keyof Recipe] !== value);
  const frameChanged = DEFAULT_ORDER.some(layer => Object.entries(frames[layer] ?? {}).some(
    ([key, value]) => design.variants[id].frames[layer]?.[key as keyof FrameOverride] !== value));
  if (!contentChanged && !frameChanged) return design;
  const next: CoverDesign = {...design,master:{...design.master},variants:{...design.variants}};
  const previous = design.variants[id];
  next.variants[id] = {...previous,content:{...previous.content},frames:{...previous.frames}};
  if (scope === 'all') Object.assign(next.master,patch);
  else Object.assign(next.variants[id].content,patch);
  for (const layer of DEFAULT_ORDER) if (frames[layer]) next.variants[id].frames[layer] = {...previous.frames[layer],...frames[layer]};
  return next;
}
export function resetVariant(design: CoverDesign, id: string): CoverDesign {
  targetFor(id);
  return {...design,variants:{...design.variants,[id]:{content:{},frames:{}}}};
}
export function overrideCount(design: CoverDesign, id: string): number {
  const v = design.variants[id];
  return Object.keys(v.content).length + Object.keys(v.frames).length + Object.keys(v.stack?.layers ?? {}).length + (v.stack?.order ? 1 : 0);
}
export function isRasterData(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value) && value.length <= 15_000_000;
}
const plain = (v: unknown): v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const bounded = (v: unknown, min:number, max:number): v is number => typeof v==='number' && Number.isFinite(v) && v>=min && v<=max;
/** Treat saved designs as untrusted input; rebuild allowlisted fields, never merge prototypes. */
export const MAX_DESIGN_BYTES = 20_000_000;
export function parseDesign(json: string): CoverDesign {
  if (json.length > MAX_DESIGN_BYTES || new TextEncoder().encode(json).byteLength > MAX_DESIGN_BYTES) throw new Error('设计文件过大（上限 20MB）');
  const raw: unknown = JSON.parse(json);
  if (!plain(raw) || raw.version!==1 || !plain(raw.master) || !plain(raw.variants)) throw new Error('不支持的设计文件版本');
  const result=createDesign();
  function content(value: unknown, complete=false): Partial<Recipe> {
    if (!plain(value)) throw new Error('设计字段无效');
    const out: Partial<Recipe>={};
    for (const key of Object.keys(result.master) as Array<keyof Recipe>) {
      if (!(key in value)) { if(complete) throw new Error('设计缺少字段'); else continue; }
      const v=value[key]; let valid=false;
      if (key==='title'||key==='subtitle') valid=typeof v==='string' && v.length<=4000;
      else if(key==='image') valid=v===''||isRasterData(v);
      else if(key==='paper'||key==='ink'||key==='accent') valid=typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
      else if(key==='font') valid=v==='serif'||v==='sans';
      else if(key==='align') valid=v==='left'||v==='center'||v==='right';
      else if(key==='showLogo'||key==='squareSafe') valid=typeof v==='boolean';
      else valid=bounded(v,0,1);
      if(!valid) throw new Error(`设计字段无效：${key}`);
      Object.assign(out,{[key]:v});
    }
    return out;
  }
  result.master={...result.master,...content(raw.master,true)};
  if (Object.hasOwn(raw,'stack')) result.stack=parseStack(raw.stack);
  for(const target of targets) {
    const v=raw.variants[target.id];
    if(!plain(v)||!plain(v.frames)) throw new Error('比例版本无效');
    const frames: Variant['frames']={};
    for(const layer of DEFAULT_ORDER) {
      if(!(layer in v.frames)) continue;
      const source=v.frames[layer];if(!plain(source))throw new Error('图层参数无效');
      const frame: FrameOverride={};
      for(const key of ['x','y','w','scale','hidden'] as const) {
        if(!(key in source))continue;
        const value=source[key];
        if(key==='hidden') {if(typeof value!=='boolean')throw new Error('显隐参数无效');frame.hidden=value;}
        else {if(!bounded(value,key==='scale'?.4:0,key==='scale'?2:1))throw new Error('图层几何参数无效'); frame[key]=value;}
      }
      frames[layer]=frame;
    }
    result.variants[target.id]={content:content(v.content),frames};
    if (Object.hasOwn(v,'stack')) result.variants[target.id].stack=parseStack(v.stack);
  }
  return result;
}

/** A downloaded design must pass exactly the same contract as a later import. */
export function serializeDesign(design: CoverDesign): string {
  const json = JSON.stringify(design, null, 2);
  parseDesign(json);
  return json;
}

import { createDesign, editDesign, resetVariant, resolveRecipe, targets, parseDesign } from '../src/cover/responsive/model';
import { compose, focalCrop, wrapText } from '../src/cover/responsive/layout';

type Assert = (value: unknown, message?: string) => void;
export const cases: Array<{name: string; run: (assert: Assert) => void}> = [
  {name:'six distinct ratios derived from one design', run(a) { const d = createDesign('同一篇稿', '只换版面'); a(Object.keys(d.variants).length === 6); a(new Set(targets.map(t => t.ratio)).size === 6); }},
  {name:'shared title propagates to every unlocked variant', run(a) { const d = editDesign(createDesign(), 'wx-wide', 'all', {title:'共同修改'}); for (const t of targets) a(resolveRecipe(d,t.id).title === '共同修改'); }},
  {name:'local title remains local', run(a) { const d = editDesign(createDesign('主标题'), 'wx-square', 'one', {title:'方图标题'}); a(resolveRecipe(d,'wx-square').title === '方图标题'); a(resolveRecipe(d,'wx-wide').title === '主标题'); }},
  {name:'shared title does not overwrite a local title', run(a) { let d = editDesign(createDesign('原始'), 'wx-square','one',{title:'特例'}); d=editDesign(d,'wx-wide','all',{title:'新版'}); a(resolveRecipe(d,'wx-square').title==='特例'); a(resolveRecipe(d,'xhs-note').title==='新版'); }},
  {name:'local position still receives shared text', run(a) { let d=editDesign(createDesign(),'wx-square','one',{}, {title:{x:.1,y:.15}}); d=editDesign(d,'wx-wide','all',{title:'共同文案'}); a(resolveRecipe(d,'wx-square').title==='共同文案'); a(d.variants['wx-square'].frames.title?.y===.15); }},
  {name:'reset removes only the selected variant overrides', run(a) { let d=editDesign(createDesign('主'),'wx-square','one',{title:'独立'}); d=editDesign(d,'xhs-note','one',{subtitle:'另一个'}); d=resetVariant(d,'wx-square'); a(resolveRecipe(d,'wx-square').title==='主'); a(resolveRecipe(d,'xhs-note').subtitle==='另一个'); }},
  {name:'edits do not mutate earlier history snapshots', run(a) { const d=createDesign('旧'); const before=JSON.stringify(d); editDesign(d,'wx-wide','one',{title:'新'},{title:{y:.2}}); a(JSON.stringify(d)===before); }},
  {name:'empty local strings override rather than falling back', run(a) { const d=editDesign(createDesign('标题','副标题'),'wx-square','one',{subtitle:''}); a(resolveRecipe(d,'wx-square').subtitle===''); }},
  {name:'local false preserves hidden logo through global updates', run(a) { let d=editDesign(createDesign(),'wx-square','one',{showLogo:false}); d=editDesign(d,'wx-wide','all',{showLogo:true}); a(resolveRecipe(d,'wx-square').showLogo===false); }},
  {name:'versioned designs survive JSON round-trip', run(a) { const d=editDesign(createDesign('往返'),'wx-square','one',{subtitle:'单独'}); a(JSON.stringify(parseDesign(JSON.stringify(d)))===JSON.stringify(d)); }},
  {name:'unknown document versions rejected', run(a) { let threw=false; try {parseDesign('{"version":999}');} catch {threw=true;} a(threw); }},
  {name:'executable asset schemes rejected', run(a) { const d=createDesign(); (d.master as any).image='javascript:alert(1)'; let threw=false; try{parseDesign(JSON.stringify(d));}catch{threw=true;} a(threw); }},
  {name:'invalid override geometry rejected on import', run(a) { const d=createDesign(); d.variants['wx-square'].frames.title={x:2}; let threw=false; try{parseDesign(JSON.stringify(d));}catch{threw=true;} a(threw); }},
  {name:'focal crop stays inside source at both edges', run(a) { for(const x of [0,.5,1]) {const c=focalCrop(1600,900,900,1600,x,.5); a(c.x>=0 && c.y>=0 && c.x+c.w<=1600.001 && c.y+c.h<=900.001); a(Math.abs(c.w/c.h-900/1600)<1e-8);}}},
  {name:'wide subject fitting never changes aspect ratio', run(a) {const c=focalCrop(900,1600,2350,1000,.5,0); a(Math.abs(c.w/c.h-2.35)<1e-8); a(c.y===0);}},
  {name:'invalid image dimensions fail closed', run(a) {let threw=false;try{focalCrop(0,900,100,100,.5,.5);}catch{threw=true;}a(threw);}},
  {name:'explicit line breaks are retained', run(a) {const r=wrapText('第一行\n第二行',200, s=>Array.from(s).length*10); a(r.join('|')==='第一行|第二行');}},
  {name:'CJK text is wrapped without losing characters', run(a) {const text='一套设计自动适配多种比例';const r=wrapText(text,40,s=>Array.from(s).length*10);a(r.join('')===text);a(r.every(x=>x.length<=4));}},
  {name:'long Latin tokens wrap without horizontal clipping', run(a) {const r=wrapText('VeryLongIdentifierWithoutSpaces',40,s=>s.length*10);a(r.join('')==='VeryLongIdentifierWithoutSpaces');a(r.every(s=>s.length<=4));}},
  {name:'layouts differ for wide and portrait', run(a) {const d=createDesign('一套设计，多比例适配');const w=compose(d,'wx-wide'),p=compose(d,'vertical-video');a(w.title.y/w.height!==p.title.y/p.height);}},
  {name:'all text frames fit within output bounds', run(a) {const d=createDesign('多比例封面测试','副标题与主要内容'); for(const t of targets) {const l=compose(d,t.id);for(const b of [l.title,l.subtitle,l.logo]){a(b.x>=0&&b.y>=0&&b.x+b.w<=l.width+.01&&b.y+b.h<=l.height+.01);}}}},
  {name:'square-safe mode fits critical layers in centered square', run(a) {const d=editDesign(createDesign('安全裁切'),'wx-wide','all',{squareSafe:true});const l=compose(d,'wx-wide');for(const b of [l.title,l.subtitle,l.logo]){a(b.x>=l.square.x-.01&&b.x+b.w<=l.square.x+l.square.w+.01);}}},
  {name:'layout is deterministic for identical input', run(a) {const d=createDesign('确定性');a(JSON.stringify(compose(d,'wx-square'))===JSON.stringify(compose(d,'wx-square')));}},
  {name:'overflow is reported instead of dropping the copy', run(a) {const d=createDesign('很长的标题'.repeat(200));const l=compose(d,'wx-wide');a(l.warnings.length>0);a(l.title.lines.join('')===d.master.title);}},
  {name:'known targets cannot be overwritten by imported dimensions', run(a) {const d=createDesign();(d.variants['wx-wide'] as any).width=1;const loaded=parseDesign(JSON.stringify(d));a(compose(loaded,'wx-wide').width===940);}},
];

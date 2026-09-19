import { compose, translatedFrames } from '../src/cover/responsive/layout';
import { createDesign, editDesign, parseDesign, resetVariant, serializeDesign, targets } from '../src/cover/responsive/model';
import { layerStack, changeLayers, reorderLayers, selectLayers, parseStack, resetLayer } from '../src/cover/responsive/layer-stack';
const ok = (value: unknown) => { if (!value) throw new Error('Assertion failed'); };
const eq = (a: unknown, b: unknown) => ok(JSON.stringify(a) === JSON.stringify(b));
const rejects = (fn: () => unknown) => { let threw = false; try { fn(); } catch { threw = true; } ok(threw); };
export const layerCases: Array<[string, () => void]> = [
 ['same metadata does not add an undo transaction', () => {const d=changeLayers(createDesign(),'wx-wide','all',['title'],{opacity:.5});ok(changeLayers(d,'wx-wide','all',['title'],{opacity:.5})===d);}],
 ['default stack is top-first and does not mutate the design', () => {const d=createDesign(); const before=JSON.stringify(d);eq(layerStack(d,'wx-wide').order,['logo','subtitle','title','image']); eq(JSON.stringify(d),before);} ],
 ['rename is metadata only', () => {const d=changeLayers(createDesign('Original'),'wx-wide','all',['title'],{name:'主视觉标题'});eq(d.master.title,'Original');eq(layerStack(d,'wx-square').layers.title.name,'主视觉标题');}],
 ['local opacity survives a shared change', () => {let d=changeLayers(createDesign(),'wx-square','one',['title'],{opacity:.25});d=changeLayers(d,'wx-wide','all',['title'],{opacity:.8});eq(layerStack(d,'wx-square').layers.title.opacity,.25);eq(layerStack(d,'wx-wide').layers.title.opacity,.8);}],
 ['batch visibility and lock are immutable and independent', () => {const d=createDesign();const next=changeLayers(d,'wx-wide','one',['title','subtitle'],{hidden:true,locked:true});ok(layerStack(next,'wx-wide').layers.title.locked);ok(layerStack(next,'wx-wide').layers.subtitle.hidden);ok(!layerStack(d,'wx-wide').layers.title.locked);ok(!layerStack(next,'wx-square').layers.title.hidden);}],
 ['stack order follows scope and preserves selection order', () => {let d=reorderLayers(createDesign(),'wx-wide','all',['title','subtitle'],'logo','before');eq(layerStack(d,'wx-square').order,['subtitle','title','logo','image']);d=reorderLayers(d,'wx-square','one',['image'],'subtitle','before');eq(layerStack(d,'wx-square').order,['image','subtitle','title','logo']);eq(layerStack(d,'wx-wide').order,['subtitle','title','logo','image']);}],
 ['dropping onto selected row is a no-op', () => {const d=createDesign();eq(reorderLayers(d,'wx-wide','all',['title'],'title','before'),d);}],
 ['range selection uses visible stacking order', () => eq(selectLayers(['logo','subtitle','title','image'],['logo'],'logo','title',{shift:true}),['logo','subtitle','title'])],
 ['modifier toggles noncontiguous layers', () => eq(selectLayers(['logo','subtitle','title','image'],['logo'],'logo','title',{toggle:true}),['logo','title'])],
 ['last selection can be deselected', () => eq(selectLayers(['logo','subtitle','title','image'],['logo'],'logo','logo',{toggle:true}),[])],
 ['reset clears metadata and geometry but preserves master', () => {let d=changeLayers(createDesign(),'wx-wide','all',['title'],{name:'Master'});d=changeLayers(d,'wx-wide','one',['title'],{opacity:.2});d=editDesign(d,'wx-wide','one',{}, {title:{x:.2}});d=resetVariant(d,'wx-wide');eq(layerStack(d,'wx-wide').layers.title.name,'Master');eq(layerStack(d,'wx-wide').layers.title.opacity,1);eq(d.variants['wx-wide'].frames,{});}],
 ['old v1 JSON retains exact round trip', () => {const d=createDesign('旧稿','不改变');eq(parseDesign(JSON.stringify(d)),d);} ],
 ['new stack and per-variant overrides round trip', () => {let d=changeLayers(createDesign(),'wx-wide','all',['logo'],{locked:true});d=reorderLayers(d,'wx-square','one',['image'],'title','before');eq(parseDesign(JSON.stringify(d)),d);} ],
 ['stack rejects duplicate and unknown identities', () => {rejects(()=>parseStack({order:['title','title','logo','image']}));rejects(()=>parseStack({order:['title','subtitle','logo','evil']}));}],
 ['stack rejects nonfinite opacity and wrong types', () => {for(const opacity of [NaN,Infinity,-1,2,'0.5'])rejects(()=>parseStack({layers:{title:{opacity}}}));rejects(()=>parseStack({layers:{title:{locked:'false'}}}));}],
 ['stack rejects invalid names and ignores executable fields', () => {rejects(()=>parseStack({layers:{title:{name:''}}}));rejects(()=>parseStack({layers:{title:{name:'x'.repeat(81)}}}));eq(parseStack({layers:{title:{name:'标题',onclick:'evil'}}}),{layers:{title:{name:'标题'}}});}],
 ['unknown input properties and prototype keys never survive', () => {const d=createDesign();const raw=JSON.parse(JSON.stringify(d));raw.stack=JSON.parse('{"__proto__":{"polluted":true},"layers":{"__proto__":{"name":"bad"},"title":{"name":"Safe"}}}');const out=parseDesign(JSON.stringify(raw));ok(!Object.prototype.hasOwnProperty.call(out.stack!,'__proto__'));eq(({} as {polluted?:boolean}).polluted,undefined);}],
 ['image frame overrides are preserved', () => {const d=editDesign(createDesign(),'wx-wide','one',{}, {image:{x:.4,y:.1,w:.4}});eq(parseDesign(JSON.stringify(d)).variants['wx-wide'].frames.image,{x:.4,y:.1,w:.4});}],
 ['legacy hidden frame remains effective', () => {let d=editDesign(createDesign(),'wx-wide','one',{}, {title:{hidden:true}});ok(layerStack(d,'wx-wide').layers.title.hidden);d=changeLayers(d,'wx-wide','one',['title'],{hidden:false});ok(!layerStack(d,'wx-wide').layers.title.hidden);}],
];

layerCases.push(
 ['identical content and transform edits preserve history identity', () => {
   let d=createDesign('原文');ok(editDesign(d,'wx-wide','all',{title:'原文'})===d);
   d=editDesign(d,'wx-wide','one',{}, {title:{x:.1}});ok(editDesign(d,'wx-wide','one',{}, {title:{x:.1}})===d);
 }],
 ['layer reset restores local text but leaves other content intact', () => {
   const d=editDesign(createDesign('主','副'),'wx-wide','one',{title:'独立',subtitle:'保留'});
   const next=resetLayer(d,'wx-wide','title');eq(next.variants['wx-wide'].content,{subtitle:'保留'});eq(d.variants['wx-wide'].content.title,'独立');
 }],
 ['image reset clears only its own source focal point and geometry', () => {
   const d=editDesign(createDesign(),'wx-wide','one',{image:'',focalX:.1,focalY:.8,ink:'#ffffff'},{image:{x:.3},title:{y:.2}});
   const next=resetLayer(d,'wx-wide','image');eq(next.variants['wx-wide'].content,{ink:'#ffffff'});eq(next.variants['wx-wide'].frames,{title:{y:.2}});
 }],
 ['group translation preserves spacing and safe bounds in six ratios', () => {
   for(const target of targets)for(const squareSafe of [false,true]){
     const d=createDesign('标题','副标题');d.master.squareSafe=squareSafe;
     const a=compose(d,target.id);const frames=translatedFrames(a,['title','subtitle'],-5000,-5000);
     const b=compose(editDesign(d,target.id,'one',{},frames),target.id);
     ok(Math.abs((a.subtitle.x-a.title.x)-(b.subtitle.x-b.title.x))<1e-6);
     ok(Math.abs((a.subtitle.y-a.title.y)-(b.subtitle.y-b.title.y))<1e-6);
     for(const box of [b.title,b.subtitle]){ok(box.x>=0&&box.y>=0);ok(box.x+box.w<=b.width+.001&&box.y+box.h<=b.height+.001);}
   }
 }],
 ['empty and nonfinite movement create no transform overrides', () => {
   const layout=compose(createDesign(),'wx-wide');eq(translatedFrames(layout,[],100,100),{});eq(translatedFrames(layout,['title'],NaN,2),{});
 }],
 ['zero translation is an actual no-op', () => eq(translatedFrames(compose(createDesign(),'wx-wide'),['title','subtitle'],0,0),{})],
 ['save and load use the same validated design contract', () => {
   const d=changeLayers(createDesign('保存'),'wx-square','one',['title'],{opacity:.3});eq(parseDesign(serializeDesign(d)),d);
 }],
 ['save rejects an oversized design that could never be reopened', () => {
   const d=createDesign();const src='data:image/png;base64,'+'A'.repeat(3500000);d.master.image=src;for(const v of Object.values(d.variants))v.content.image=src;
   rejects(()=>serializeDesign(d));
 }],
 ['save rejects out of range metadata instead of producing an invalid file', () => {
   const d=createDesign();d.stack={layers:{title:{opacity:2}}};rejects(()=>serializeDesign(d));
 }],
 ['reset rejects an unknown target without mutating the design', () => {const d=createDesign();const before=JSON.stringify(d);rejects(()=>resetLayer(d,'not-a-ratio','title'));eq(JSON.stringify(d),before);}]
);

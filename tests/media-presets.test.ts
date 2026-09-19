import { expect, it } from 'vitest';
import { MEDIA_PRESETS, updateMediaDrafts } from '../src/cover/media-presets';
it('defines exact pixel ratios including WeChat 2.35:1', () => {
  for (const preset of MEDIA_PRESETS) {
    const [w,h] = preset.ratio.split(':').map(Number);
    expect(preset.width / preset.height).toBeCloseTo(w/h, 3);
    expect(preset.source.startsWith('https://')).toBe(true);
  }
});
it('keeps independent edits isolated and shared edits retain each ratio', () => {
  const initial = { a: { title:'共同',subtitle:'',html:'A',ratio:2 }, b: {title:'共同',subtitle:'',html:'B',ratio:4} };
  const edit = {...initial.a,title:'单独',html:'C'};
  const local = updateMediaDrafts(initial,'a',edit,false);
  expect(local.b).toEqual(initial.b); expect(initial.a.title).toBe('共同');
  const shared = updateMediaDrafts(local,'a',{...edit,title:'统一'},true);
  expect(shared.b.title).toBe('统一'); expect(shared.b.html).toBe('C'); expect(shared.b.ratio).toBe(4);
});

// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { adaptiveLayout, prepareCover, coverLayers, layerId } from '../src/cover/layer-layout';
import { mountCoverTextEditor } from '../src/cover/layer-editor';
import { sanitizeArticleHtml } from '../src/security/article-html';
import { MEDIA_PRESETS } from '../src/cover/media-presets';
afterEach(() => document.body.replaceChildren());
function fixture() {
  const root = document.createElement('div');
  root.className = 'mm-cover';
  root.style.fontSize = '40px';
  root.innerHTML =
    '<h1 class="mm-cover-title">中文标题与 English mixed text '.repeat(1) +
    '</h1><p class="mm-cover-subtitle">副标题与第二段文案</p><img class="mm-cover-image" src="data:image/png;base64,AAAA" alt="配图">';
  document.body.append(root);
  prepareCover(document, root);
  return root;
}
it.each(MEDIA_PRESETS)(
  'recomposes $id into bounded nonoverlapping image and text areas',
  (preset) => {
    const root = fixture();
    adaptiveLayout(root, preset.width, preset.height, true);
    const rect = (el: HTMLElement) => ({
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top),
      w: parseFloat(el.style.width),
      h: parseFloat(el.style.height),
    });
    const layers = coverLayers(root).map(rect);
    for (const a of layers) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w).toBeLessThanOrEqual(100);
      expect(a.y + a.h).toBeLessThanOrEqual(100);
    }
    for (let i = 0; i < layers.length; i++)
      for (let j = i + 1; j < layers.length; j++) {
        const a = layers[i],
          b = layers[j];
        expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(
          true
        );
      }
    const title = root.querySelector<HTMLElement>('h1')!;
    expect(title.style.fontSize).toContain('em');
    const saved = title.style.cssText;
    adaptiveLayout(root, preset.width, preset.height);
    expect(title.style.cssText).toBe(saved);
  }
);
it('adds, duplicates, hides, reorders, deletes and restores layers without duplicate identities', () => {
  const root = fixture();
  adaptiveLayout(root, 1080, 1440);
  let state: any;
  const editor = mountCoverTextEditor(document, {
    scale: () => 1,
    changed: vi.fn(),
    selected: (s) => (state = s),
    dimensions: () => ({ width: 1080, height: 1440 }),
  });
  editor.addText();
  editor.action('duplicate');
  expect(coverLayers(root)).toHaveLength(5);
  expect(new Set(coverLayers(root).map(layerId)).size).toBe(5);
  editor.action('hide');
  expect(state.layers.find((l: any) => l.selected).hidden).toBe(true);
  editor.undo();
  expect(state.layers.find((l: any) => l.selected).hidden).toBe(false);
  editor.action('up');
  editor.action('down');
  editor.action('delete');
  expect(coverLayers(root)).toHaveLength(4);
  editor.undo();
  expect(coverLayers(root)).toHaveLength(5);
  editor.redo();
  expect(coverLayers(root)).toHaveLength(4);
  editor.addImage('data:image/png;base64,AAAA', '第二张图片');
  expect(root.querySelectorAll('img')).toHaveLength(2);
  editor.style('objectFit', 'cover');
  expect(root.querySelectorAll('img')[1].style.objectFit).toBe('cover');
  const clean = sanitizeArticleHtml(root.outerHTML, 'cover');
  expect(clean).toContain('object-fit:cover');
  expect(clean).not.toContain('contenteditable');
  editor.destroy();
});

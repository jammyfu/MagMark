// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImagePanel } from '../src/image/image-panel';
let panel: ImagePanel | undefined;
afterEach(() => { panel?.destroy(); document.body.innerHTML = ''; });
describe('image panel keeps assets authoritative', () => {
  it('never replaces an existing image with a placeholder when a ratio changes', () => {
    const insert = vi.fn(); panel = new ImagePanel(insert);
    panel.openWithSrc('https://example.test/original.png', {alt:'原图',caption:'',layout:'center',width:50});
    const slider = document.querySelector<HTMLInputElement>('#mm-ip-ar-slider')!;
    slider.value = '8'; slider.dispatchEvent(new Event('input'));
    document.querySelector<HTMLButtonElement>('#mm-ip-insert-btn')!.click();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({src:'https://example.test/original.png', alt:'原图'}));
  });
  it('can insert a placeholder after clearing an existing image without a second ratio gesture', () => {
    const insert = vi.fn(); panel = new ImagePanel(insert);
    panel.openWithSrc('https://example.test/original.png', {alt:'原图',caption:'',layout:'center',width:50});
    document.querySelector<HTMLButtonElement>('#mm-ip-preview-clear')!.click();
    document.querySelector<HTMLButtonElement>('#mm-ip-insert-btn')!.click();
    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.calls[0][0].src).toMatch(/^data:image\/svg\+xml/);
  });
});

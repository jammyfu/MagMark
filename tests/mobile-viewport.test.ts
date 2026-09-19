// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { mountMobileViewport } from '../src/workspace/mobile-viewport';
let dispose: () => void;
let media: EventTarget & {matches: boolean};
let viewport: EventTarget & {height: number; offsetTop: number; scale: number};
beforeEach(() => {
  media = Object.assign(new EventTarget(), {matches: true});
  viewport = Object.assign(new EventTarget(), {height: 700, offsetTop: 0, scale: 1});
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('visualViewport', viewport);
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {fn(0); return 1;});
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  document.body.innerHTML = '<header>Chrome</header><div id="scroll" style="overflow-y:auto"><p>Text</p><input type="range"><select><option>Value</option></select><canvas style="touch-action:none"></canvas></div>';
  const scroll = document.getElementById('scroll')!;
  Object.defineProperties(scroll, {scrollHeight:{value:800},clientHeight:{value:200}});
  dispose = mountMobileViewport();
});
afterEach(() => {dispose(); vi.unstubAllGlobals();});
function gesture(selector: string, from: number, to: number, count = 1) {
  const node = document.querySelector(selector)!;
  const event = (type: string, y: number) => {
    const e = new Event(type, {bubbles:true,cancelable:true});
    Object.defineProperty(e,'touches',{value:Array.from({length:count},(_,id)=>({clientX:40,clientY:y,identifier:id}))});
    node.dispatchEvent(e); return e;
  };
  event('touchstart',from);
  return event('touchmove',to).defaultPrevented;
}
it('blocks drags on fixed chrome and outward drags at either scroll boundary', () => {
  expect(gesture('header',20,70)).toBe(true);
  expect(gesture('p',20,70)).toBe(true);
  document.getElementById('scroll')!.scrollTop = 600;
  expect(gesture('p',70,20)).toBe(true);
});
it('allows native scrolling into the document and within its middle', () => {
  expect(gesture('p',70,20)).toBe(false);
  document.getElementById('scroll')!.scrollTop = 200;
  expect(gesture('p',70,20)).toBe(false);
  expect(gesture('p',20,70)).toBe(false);
});
it('preserves native selectors, sliders and two-finger gestures', () => {
  expect(gesture('select',20,70)).toBe(false);
  expect(gesture('input',20,70)).toBe(false);
  expect(gesture('header',20,70,2)).toBe(false);
});
it('never scrolls the editor behind a dialog', () => {
  const dialog=document.createElement('dialog'); dialog.open=true;
  document.getElementById('scroll')!.append(dialog);
  document.getElementById('scroll')!.scrollTop=200;
  expect(gesture('dialog',70,20)).toBe(true);
});
it('tracks keyboard viewport changes and leaves pinch zoom alone', () => {
  viewport.height=380; viewport.offsetTop=30; viewport.dispatchEvent(new Event('resize'));
  expect(document.documentElement.style.getPropertyValue('--mm-visible-height')).toBe('380px');
  expect(document.documentElement.style.getPropertyValue('--mm-visible-top')).toBe('30px');
  viewport.scale=2; viewport.height=190; viewport.dispatchEvent(new Event('resize'));
  expect(document.documentElement.style.getPropertyValue('--mm-visible-height')).toBe('380px');
  expect(gesture('header',20,70)).toBe(false);
});
it('releases viewport sizing and touch blocking on desktop', () => {
  media.matches=false; media.dispatchEvent(new Event('change'));
  expect(document.documentElement.classList.contains('mm-mobile-workspace')).toBe(false);
  expect(document.documentElement.style.getPropertyValue('--mm-visible-height')).toBe('');
  expect(gesture('header',20,70)).toBe(false);
});
it('removes gesture handlers when disposed', () => {
  dispose(); expect(gesture('header',20,70)).toBe(false);
});

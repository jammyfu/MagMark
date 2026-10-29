// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { mountSplitter } from '../src/workspace/splitter';

it('resizes by pointer, clamps bounds, and stops after release', () => {
  document.body.innerHTML = '<main><section></section><div></div></main>';
  const container = document.querySelector('main')!, panel = document.querySelector('section')!, handle = document.querySelector('main > div') as HTMLElement;
  container.getBoundingClientRect = () => ({ left: 0, width: 1000 } as DOMRect);
  panel.getBoundingClientRect = () => ({ right: 420 } as DOMRect);
  const resize = vi.fn(), dispose = mountSplitter(handle, panel, resize);
  const pointer = (target: EventTarget, type: string, x: number) => {
    const event = new MouseEvent(type, { clientX: x, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: 1 }); target.dispatchEvent(event);
  };
  pointer(handle, 'pointerdown', 423);
  pointer(window, 'pointermove', 553);
  expect(parseFloat(panel.style.width)).toBeCloseTo(55);
  expect(handle.getAttribute('aria-valuenow')).toBe('55');
  pointer(window, 'pointermove', 1003); expect(panel.style.width).toBe('70%');
  pointer(window, 'pointermove', 3); expect(panel.style.width).toBe('25%');
  pointer(window, 'pointerup', 3);
  pointer(window, 'pointermove', 600); expect(panel.style.width).toBe('25%');
  expect(document.body.classList.contains('workspace-resizing')).toBe(false);
  dispose();
});

it('supports keyboard and cleans up active drag state on disposal', () => {
  document.body.innerHTML = '<main><section></section><div aria-valuenow="42"></div></main>';
  const panel = document.querySelector('section')!, handle = document.querySelector('main > div') as HTMLElement;
  const dispose = mountSplitter(handle, panel, () => {});
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  expect(panel.style.width).toBe('44%');
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
  expect(panel.style.width).toBe('25%');
  dispose();
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
  expect(panel.style.width).toBe('25%');
});

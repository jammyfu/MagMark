// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountToolbarPosition } from '../src/workspace/toolbar-position';
import { bindRangeStepper } from '../src/workspace/range-stepper';

describe('stable selection toolbar', () => {
  it('does not chase reflowing selections and retains keyboard-adjusted position', () => {
    const toolbar = document.createElement('div');
    const handle = document.createElement('button'); toolbar.append(handle);
    Object.defineProperties(toolbar, { offsetWidth: {value: 400}, offsetHeight: {value: 60} });
    const position = mountToolbarPosition(toolbar, handle);
    position.place({left: 100, top: 300, bottom: 340} as DOMRect);
    expect(toolbar.style.top).toBe('228px');
    position.place({left: 500, top: -1000, bottom: -900} as DOMRect);
    expect(toolbar.style.left).toBe('100px');
    expect(toolbar.style.top).toBe('228px');
    handle.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight'}));
    position.place({left: 0, top: 10, bottom: 20} as DOMRect);
    expect(toolbar.style.left).toBe('105px');
  });
  it('clamps offscreen anchors into the viewport', () => {
    const toolbar = document.createElement('div');
    const position = mountToolbarPosition(toolbar, document.createElement('button'));
    position.place({left: -100, top: -100, bottom: -50} as DOMRect);
    expect(toolbar.style.left).toBe('8px'); expect(toolbar.style.top).toBe('8px');
  });
  it('supports fractional line-height and negative letter-spacing steps', () => {
    for (const [min, max, step, value, expected] of [['1','3','.05','1.75','1.8'], ['-.1','.5','.01','-.02','-0.01']]) {
      const range = document.createElement('input');
      range.type = 'range'; range.min = min; range.max = max; range.step = step; range.value = value;
      const up = document.createElement('button'), down = document.createElement('button');
      bindRangeStepper(range, up, down); up.click(); expect(range.value).toBe(expected);
      down.click(); expect(Number(range.value)).toBe(Number(value));
    }
  });
});

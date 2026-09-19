// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { bindRangeStepper } from '../src/workspace/range-stepper';

function setup(value = '14') {
  document.body.innerHTML = `<input type="range" min="10" max="64" step="1" value="${value}"><button id="up"></button><button id="down"></button>`;
  const range = document.querySelector('input')!;
  const up = document.querySelector<HTMLButtonElement>('#up')!;
  const down = document.querySelector<HTMLButtonElement>('#down')!;
  const control = bindRangeStepper(range, up, down);
  const events: string[] = [];
  range.addEventListener('input', () => events.push(`input:${range.value}`));
  range.addEventListener('change', () => events.push(`change:${range.value}`));
  return { range, up, down, control, events };
}

describe('font size arrow controls', () => {
  it('increments and decrements by 1px through the existing update and pagination events', () => {
    const { range, up, down, events } = setup();
    up.click(); up.click(); down.click();
    expect(range.value).toBe('15');
    expect(events).toEqual(['input:15', 'change:15', 'input:16', 'change:16', 'input:15', 'change:15']);
  });
  it('disables the down button at the lower bound and re-enables it after increasing', () => {
    const { range, up, down, events } = setup('10');
    expect(down.disabled).toBe(true);
    down.click();
    expect(events).toEqual([]);
    up.click();
    expect(range.value).toBe('11');
    expect(down.disabled).toBe(false);
  });
  it('never exceeds the upper bound', () => {
    const { range, up, down, events } = setup('63');
    up.click(); up.click();
    expect(range.value).toBe('64');
    expect(up.disabled).toBe(true);
    expect(events).toHaveLength(2);
    down.click();
    expect(up.disabled).toBe(false);
  });
  it('syncs button availability after slider input and selection changes', () => {
    const { range, up, down, control } = setup();
    range.value = '64'; range.dispatchEvent(new Event('input'));
    expect(up.disabled).toBe(true);
    range.value = '10'; control.sync();
    expect(up.disabled).toBe(false);
    expect(down.disabled).toBe(true);
  });
});

/** Reuse the range's existing input/change pipeline for precise button adjustments. */
export function bindRangeStepper(range: HTMLInputElement, up: HTMLButtonElement, down: HTMLButtonElement) {
  const sync = () => {
    up.disabled = Number(range.value) >= Number(range.max);
    down.disabled = Number(range.value) <= Number(range.min);
  };
  const step = (direction: number) => {
    const before = range.value;
    if (direction > 0) range.stepUp();
    else range.stepDown();
    sync();
    if (range.value === before) return;
    range.dispatchEvent(new Event('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
  };
  up.addEventListener('click', () => step(1));
  down.addEventListener('click', () => step(-1));
  range.addEventListener('input', sync);
  sync();
  return { sync };
}

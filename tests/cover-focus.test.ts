// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { preserveLazyCoverInvoker } from '../src/cover/lazy-cover-focus';
afterEach(() => document.body.replaceChildren());
function fixture() {
  document.body.innerHTML = '<button id="btn-cover" aria-busy="true" disabled>Cover</button><dialog><input id="draft"></dialog>';
  const button = document.querySelector<HTMLButtonElement>('button')!;
  const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
  const dispose = preserveLazyCoverInvoker(dialog);
  button.disabled = false; button.removeAttribute('aria-busy');
  document.querySelector<HTMLInputElement>('input')!.focus();
  return { button, dialog, dispose };
}
it('restores the lazy-load invoker after its disabled state has cleared', () => {
  const {button, dialog} = fixture();
  dialog.dispatchEvent(new Event('close'));
  expect(document.activeElement).toBe(button);
});
it('does not steal focus from another open cover dialog', () => {
  const {button, dialog} = fixture();
  const other = document.createElement('dialog'); other.open = true;
  const input = document.createElement('input'); other.append(input); document.body.append(other); input.focus();
  dialog.dispatchEvent(new Event('close'));
  expect(document.activeElement).toBe(input);
  expect(document.activeElement).not.toBe(button);
});
it('cleanup removes the supplemental focus restoration', () => {
  const {button, dialog, dispose} = fixture();
  dispose(); dialog.dispatchEvent(new Event('close'));
  expect(document.activeElement).not.toBe(button);
});

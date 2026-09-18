// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountLinkNavigationGuard } from '../src/workspace/link-navigation';

afterEach(() => { document.body.innerHTML = ''; });
describe('link navigation guard', () => {
  it('requires a dialog before a non-anchor link leaves the editor', () => {
    const report = vi.fn();
    const dispose = mountLinkNavigationGuard(report);
    const preview = document.createElement('main');
    preview.innerHTML = '<a href="https://example.com/article">Read</a><a href="#local">Local</a><a href="https://example.net" target="_blank">New window</a>';
    document.body.append(preview);
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    preview.querySelector<HTMLAnchorElement>('a')!.dispatchEvent(event);
    const dialog = document.querySelector<HTMLDialogElement>('.link-navigation-dialog')!;
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('code')!.textContent).toContain('example.com/article');
    const local = new MouseEvent('click', {bubbles: true, cancelable: true});
    preview.querySelectorAll<HTMLAnchorElement>('a')[1].dispatchEvent(local);
    expect(local.defaultPrevented).toBe(false);
    dialog.removeAttribute('open');
    const blank = new MouseEvent('click', {bubbles: true, cancelable: true});
    preview.querySelectorAll<HTMLAnchorElement>('a')[2].dispatchEvent(blank);
    expect(blank.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    dispose();
  });
  it('keeps rich-text editing links inert and explains why', () => {
    const report = vi.fn();
    const dispose = mountLinkNavigationGuard(report);
    const field = document.createElement('div'); field.className = 'preview-rich-input';
    field.innerHTML = '<a href="https://example.com">Read</a>'; document.body.append(field);
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    field.querySelector('a')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(report).toHaveBeenCalledWith('编辑文字时不会打开链接。保存或取消后，可在预览中确认打开。');
    expect(document.querySelector<HTMLDialogElement>('.link-navigation-dialog')!.open).toBe(false);
    dispose();
  });
});

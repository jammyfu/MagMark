function isLeavingLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return false;
  try {
    const destination = new URL(href, document.baseURI);
    return destination.href !== location.href;
  } catch { return false; }
}

/** Keep article links readable while requiring an explicit decision before leaving the editor. */
export function mountLinkNavigationGuard(report: (message: string) => void) {
  const dialog = document.createElement('dialog');
  dialog.className = 'link-navigation-dialog';
  dialog.setAttribute('aria-labelledby', 'link-navigation-title');
  dialog.innerHTML = `<section><h2 id="link-navigation-title">打开链接？</h2><p>你将离开当前编辑器并打开：</p><code></code><footer><button type="button" value="cancel">留在编辑器</button><button type="button" value="confirm" class="link-navigation-confirm">继续打开</button></footer></section>`;
  document.body.append(dialog);
  const address = dialog.querySelector('code')!;
  let target = '';
  // JSDOM lacks the dialog API; the attribute fallback also keeps reduced browser shells usable.
  const close = () => { target = ''; typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open'); };
  const open = () => { if (dialog.open) return; typeof dialog.showModal === 'function' ? dialog.showModal() : dialog.setAttribute('open', ''); };
  dialog.querySelector<HTMLButtonElement>('[value="cancel"]')!.addEventListener('click', close);
  dialog.querySelector<HTMLButtonElement>('[value="confirm"]')!.addEventListener('click', () => {
    const destination = target; close();
    if (destination) location.assign(destination);
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  const intercept = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || !isLeavingLink(anchor)) return;
    event.preventDefault();
    event.stopPropagation();
    if (anchor.closest('.preview-rich-input')) {
      report('编辑文字时不会打开链接。保存或取消后，可在预览中确认打开。');
      return;
    }
    target = anchor.href;
    address.textContent = target;
    open();
  };
  document.addEventListener('click', intercept, true);
  return () => { document.removeEventListener('click', intercept, true); dialog.remove(); };
}

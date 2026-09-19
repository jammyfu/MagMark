/** Native modal containment for auxiliary panels; the document itself stays untouched. */
export function createPanelDialog(labelId: string) {
  const element = document.createElement('dialog');
  element.className = 'mm-panel-dialog';
  element.setAttribute('aria-labelledby', labelId);
  let invoker: HTMLElement | null = null;
  const restoreFocus = () => {
    if (invoker?.isConnected) invoker.focus({ preventScroll: true });
    invoker = null;
  };
  element.addEventListener('close', () => { if (!element.open) restoreFocus(); });
  const close = () => {
    if (!element.open) return;
    if (typeof element.close === 'function') element.close();
    else { element.removeAttribute('open'); restoreFocus(); }
  };
  element.addEventListener('keydown', event => {
    // Input and Tab must still reach their native handlers inside the dialog.
    event.stopPropagation();
    if (event.key === 'Tab' && !event.isComposing) {
      const candidates = [...element.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, iframe, [tabindex]'
      )].filter(node => node.tabIndex >= 0 && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden');
      const first = candidates[0], last = candidates[candidates.length - 1];
      if (first && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') event.preventDefault();
    if (event.key === 'Escape' && !event.isComposing && typeof element.showModal !== 'function') close();
  });
  return {
    element,
    open() {
      if (element.open) return;
      invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof element.showModal === 'function') element.showModal();
      else element.setAttribute('open', ''); // Non-modal fallback for DOM-only/legacy hosts.
    },
    close,
    destroy() { close(); restoreFocus(); element.remove(); },
  };
}

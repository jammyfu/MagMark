/** The lazy cover loader disables its button before awaiting import, which blurs it. */
export function preserveLazyCoverInvoker(panel: HTMLDialogElement): () => void {
  const doc = panel.ownerDocument;
  const invoker = doc.querySelector<HTMLButtonElement>('#btn-cover[aria-busy="true"]');
  const restore = () => {
    // Switching to the responsive modal must not return focus behind that modal.
    if (panel.open || !invoker?.isConnected || invoker.disabled || doc.querySelector('dialog[open]')) return;
    invoker.focus({ preventScroll: true });
  };
  panel.addEventListener('close', restore);
  return () => panel.removeEventListener('close', restore);
}

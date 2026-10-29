/** Pointer and keyboard resizing share the same percentage bounds. */
export function mountSplitter(handle: HTMLElement, panel: HTMLElement, onResize: () => void) {
  const container = handle.parentElement!;
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let pointer: number | null = null;
  let offset = 0;
  function setWidth(percent: number) {
    const next = Math.max(25, Math.min(70, percent));
    panel.style.width = `${next}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(next)));
    onResize();
  }
  function finish() {
    const id = pointer;
    pointer = null;
    document.body.classList.remove('workspace-resizing');
    if (id !== null && handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id);
  }
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer !== null) return;
    event.preventDefault();
    pointer = event.pointerId;
    offset = event.clientX - panel.getBoundingClientRect().right;
    handle.setPointerCapture?.(pointer);
    handle.focus({ preventScroll: true });
    document.body.classList.add('workspace-resizing');
  }, options);
  window.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    const bounds = container.getBoundingClientRect();
    if (bounds.width > 0) setWidth((event.clientX - bounds.left - offset) / bounds.width * 100);
  }, options);
  for (const name of ['pointerup', 'pointercancel'] as const) window.addEventListener(name, event => {
    if (event.pointerId === pointer) finish();
  }, options);
  handle.addEventListener('lostpointercapture', finish, options);
  window.addEventListener('blur', finish, options);
  handle.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const now = Number(handle.getAttribute('aria-valuenow') || 42);
    setWidth(event.key === 'Home' ? 25 : event.key === 'End' ? 70 : now + (event.key === 'ArrowLeft' ? -2 : 2));
  }, options);
  return () => { finish(); abort.abort(); };
}

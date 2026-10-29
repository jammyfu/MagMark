/** Viewport coordinates belong to the toolbar, never to reflowing selected blocks. */
export function mountToolbarPosition(toolbar: HTMLElement, handle: HTMLElement) {
  let positioned = false;
  let drag: { id: number; x: number; y: number; left: number; top: number } | null = null;
  const move = (left: number, top: number) => {
    const width = toolbar.offsetWidth, height = toolbar.offsetHeight;
    toolbar.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
    toolbar.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
    positioned = true;
  };
  const clamp = () => { if (positioned) move(parseFloat(toolbar.style.left) || 8, parseFloat(toolbar.style.top) || 8); };
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    const rect = toolbar.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    move(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  });
  const stop = () => { drag = null; };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  handle.addEventListener('lostpointercapture', stop);
  window.addEventListener('blur', stop);
  handle.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta) return;
    event.preventDefault(); event.stopPropagation();
    const amount = event.shiftKey ? 20 : 5;
    move((parseFloat(toolbar.style.left) || 8) + delta[0] * amount, (parseFloat(toolbar.style.top) || 8) + delta[1] * amount);
  });
  window.addEventListener('resize', clamp);
  return {
    place(anchor: DOMRect) {
      if (positioned) { clamp(); return; }
      const above = anchor.top - toolbar.offsetHeight - 12;
      move(anchor.left, above >= 8 ? above : anchor.bottom + 12);
    },
  };
}

/** Contain editor gestures without disabling native text controls or pinch zoom. */
export function mountMobileViewport() {
  const media = matchMedia('(max-width: 800px)');
  const root = document.documentElement;
  const viewport = window.visualViewport;
  let frame = 0;
  let previous: { x: number; y: number; id: number } | undefined;
  const update = () => {
    root.classList.toggle('mm-mobile-workspace', media.matches);
    if (!media.matches) {
      root.style.removeProperty('--mm-visible-height');
      root.style.removeProperty('--mm-visible-top');
      previous = undefined;
      return;
    }
    // Keep the document's scale intact when the reader pinch-zooms.
    if (viewport && Math.abs(viewport.scale - 1) > .01) return;
    root.style.setProperty('--mm-visible-height', `${Math.round(viewport?.height || innerHeight)}px`);
    root.style.setProperty('--mm-visible-top', `${Math.max(0, viewport?.offsetTop || 0)}px`);
  };
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
  const start = (event: TouchEvent) => {
    const touch = event.touches[0];
    previous = event.touches.length === 1 ? {x: touch.clientX, y: touch.clientY, id: touch.identifier} : undefined;
  };
  const move = (event: TouchEvent) => {
    if (!media.matches || !previous || event.touches.length !== 1 || (viewport && viewport.scale > 1.01)) return;
    const touch = event.touches[0];
    if (touch.identifier !== previous.id) return;
    const dx = touch.clientX - previous.x, dy = touch.clientY - previous.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 2) return;
    previous = {x: touch.clientX, y: touch.clientY, id: touch.identifier};
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('select, input[type="range"]')) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && target.closest('[contenteditable]')) return;
    const vertical = Math.abs(dy) >= Math.abs(dx);
    const delta = vertical ? dy : dx;
    for (let node: Element | null = target; node && node !== document.body && node !== root; node = node.parentElement) {
      const style = getComputedStyle(node);
      // Canvas cropping/dragging manages its own pointer gestures.
      if (style.touchAction === 'none') return;
      const overflow = vertical ? style.overflowY : style.overflowX;
      const max = vertical ? node.scrollHeight - node.clientHeight : node.scrollWidth - node.clientWidth;
      if (/(auto|scroll)/.test(overflow) && max > 1) {
        const position = vertical ? node.scrollTop : node.scrollLeft;
        if (delta > 0 ? position > 1 : position < max - 1) return;
        const behavior = vertical ? style.overscrollBehaviorY : style.overscrollBehaviorX;
        if (behavior === 'contain' || behavior === 'none') break;
      }
      // Do not propagate a modal gesture into the editor behind it.
      if (node instanceof HTMLDialogElement && node.open) break;
    }
    if (event.cancelable) event.preventDefault();
  };
  const end = () => { previous = undefined; };
  update();
  media.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  document.addEventListener('touchstart', start, {passive: true});
  document.addEventListener('touchmove', move, {passive: false});
  document.addEventListener('touchend', end, {passive: true});
  document.addEventListener('touchcancel', end, {passive: true});
  return () => {
    cancelAnimationFrame(frame);
    media.removeEventListener('change', schedule);
    window.removeEventListener('resize', schedule);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    document.removeEventListener('touchstart', start);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    document.removeEventListener('touchcancel', end);
    root.classList.remove('mm-mobile-workspace');
    root.style.removeProperty('--mm-visible-height');
    root.style.removeProperty('--mm-visible-top');
  };
}

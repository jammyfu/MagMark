/** A mouse gesture must terminate even when mouseup is lost outside the window. */
export function trackMouseGesture(move: (event: MouseEvent) => void, end: (event?: MouseEvent) => void) {
    let active = true;
    const finish = (event?: MouseEvent) => {
        if (!active) return;
        active = false;
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onUp, true);
        window.removeEventListener('mousedown', cancel, true);
        window.removeEventListener('blur', cancel);
        window.removeEventListener('resize', cancel);
        document.removeEventListener('mouseleave', cancel);
        document.removeEventListener('visibilitychange', cancel);
        window.removeEventListener('keydown', onKey, true);
        end(event);
    };
    const cancel = () => finish();
    const onMove = (event: MouseEvent) => {
        if (!(event.buttons & 1)) { cancel(); return; }
        move(event);
    };
    const onUp = (event: MouseEvent) => { if (event.button === 0) finish(event); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('mousedown', cancel, true);
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    document.addEventListener('mouseleave', cancel);
    document.addEventListener('visibilitychange', cancel);
    window.addEventListener('keydown', onKey, true);
    return cancel;
}

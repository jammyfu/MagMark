// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { trackMouseGesture } from '../src/workspace/mouse-gesture';

describe('marquee gesture termination', () => {
    it.each(['blur', 'resize', 'mousedown'])('cancels on window %s and removes old listeners', type => {
        const move = vi.fn(), end = vi.fn();
        trackMouseGesture(move, end);
        window.dispatchEvent(new Event(type));
        window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1 }));
        window.dispatchEvent(new MouseEvent('mouseup'));
        expect(end.mock.calls).toEqual([[undefined]]);
        expect(move).not.toHaveBeenCalled();
    });
    it.each(['mouseleave', 'visibilitychange'])('cancels on document %s', type => {
        const end = vi.fn();
        trackMouseGesture(vi.fn(), end);
        document.dispatchEvent(new Event(type));
        expect(end.mock.calls).toEqual([[undefined]]);
    });
    it('recovers from a missed outside release and allows the next gesture', () => {
        const first = vi.fn(), next = vi.fn();
        trackMouseGesture(vi.fn(), first);
        window.dispatchEvent(new MouseEvent('mousemove', { buttons: 0 }));
        expect(first.mock.calls).toEqual([[undefined]]);
        const move = vi.fn();
        trackMouseGesture(move, next);
        const drag = new MouseEvent('mousemove', { buttons: 1, clientX: 80, clientY: 40 });
        window.dispatchEvent(drag);
        const up = new MouseEvent('mouseup', { button: 0 });
        window.dispatchEvent(up);
        expect(move).toHaveBeenCalledWith(drag);
        expect(next.mock.calls).toEqual([[up]]);
    });
    it('Escape and explicit cancellation terminate only once', () => {
        const end = vi.fn();
        const cancel = trackMouseGesture(vi.fn(), end);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        cancel();
        expect(end).toHaveBeenCalledTimes(1);
    });
});

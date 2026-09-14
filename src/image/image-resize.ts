export function resizePercent(startWidth: number, delta: number, containerWidth: number, scale: number, centered: boolean): number {
    const width = startWidth + delta / Math.max(0.01, scale) * (centered ? 2 : 1);
    return Math.max(5, Math.min(100, Math.round(width / Math.max(1, containerWidth) * 100)));
}

/** Body-level controls fit the image, not the figure caption, and work for raw HTML too. */
export function installImageResize(preview: HTMLElement, prepare: (image: HTMLImageElement) => ((width: number) => void) | null) {
    const frame = document.createElement('div');
    frame.id = 'mm-image-resize-frame';
    frame.hidden = true;
    frame.style.cssText = 'position:fixed;z-index:9990;border:2px solid #b89d55;box-sizing:border-box;pointer-events:none';
    document.body.append(frame);
    let image: HTMLImageElement | null = null;
    let dragging = false;
    const position = () => {
        if (!image?.isConnected) { frame.hidden = true; return; }
        const r = image.getBoundingClientRect();
        const area = preview.getBoundingClientRect();
        frame.hidden = r.bottom < area.top || r.top > area.bottom;
        Object.assign(frame.style, {left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
    };
    for (const [dir, left, top] of [['nw','0','0'],['ne','100%','0'],['sw','0','100%'],['se','100%','100%']]) {
        const handle = document.createElement('button');
        handle.type = 'button';
        handle.dataset.resizeCorner = dir;
        handle.setAttribute('aria-label', `缩放图片 ${dir}`);
        handle.title = '拖动缩放图片；方向键微调';
        handle.style.cssText = `position:absolute;left:${left};top:${top};width:14px;height:14px;padding:0;transform:translate(-50%,-50%);border:2px solid #6c5724;background:#fff;pointer-events:auto;touch-action:none;cursor:${dir}-resize`;
        frame.append(handle);
        handle.addEventListener('pointerdown', event => {
            if (!image || event.button !== 0) return;
            const target = image;
            const commit = prepare(target);
            if (!commit) return;
            event.preventDefault(); event.stopPropagation();
            const container = target.closest<HTMLElement>('.scroll-container')!;
            const figure = target.closest<HTMLElement>('figure.mm-figure');
            const sized = figure || target;
            const original = sized.getAttribute('style');
            const imageStyle = target.getAttribute('style');
            const start = target.getBoundingClientRect();
            const scale = start.width / Math.max(1,target.offsetWidth);
            const centered = figure ? figure.classList.contains('mm-center') :
                (target.style.marginLeft === 'auto' && target.style.marginRight === 'auto') || getComputedStyle(target.parentElement!).textAlign === 'center';
            const startX = event.clientX, startY = event.clientY;
            let width = Math.round(target.offsetWidth / Math.max(1,container.clientWidth) * 100);
            let moved = false;
            dragging = true;
            handle.setPointerCapture(event.pointerId);
            const move = (e: PointerEvent) => {
                const dx = (e.clientX-startX) * (dir.includes('w') ? -1 : 1);
                const dy = (e.clientY-startY) * (dir.includes('n') ? -1 : 1) * start.width / Math.max(1,start.height);
                const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
                if (Math.abs(delta) < 2) return;
                moved = true;
                width = resizePercent(start.width/scale,delta,container.clientWidth,scale,centered);
                sized.style.width = `${width}%`;
                target.style.width = figure ? '100%' : `${width}%`;
                target.style.height = 'auto';
                target.style.maxWidth = '100%';
                position();
            };
            const finish = (e: PointerEvent) => {
                dragging = false;
                handle.removeEventListener('pointermove',move);
                handle.removeEventListener('pointerup',finish);
                handle.removeEventListener('pointercancel',finish);
                if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
                // Source is the authority; canceled/stale edits must not leave live-only sizing.
                if (original === null) sized.removeAttribute('style'); else sized.setAttribute('style',original);
                if (imageStyle === null) target.removeAttribute('style'); else target.setAttribute('style',imageStyle);
                frame.hidden = true;
                if (e.type === 'pointerup' && moved) commit(width);
            };
            handle.addEventListener('pointermove',move);
            handle.addEventListener('pointerup',finish);
            handle.addEventListener('pointercancel',finish);
        });
        handle.addEventListener('keydown', event => {
            if (!image || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const container = image.closest<HTMLElement>('.scroll-container')!;
            const percent = image.offsetWidth / Math.max(1,container.clientWidth) * 100;
            prepare(image)?.(Math.max(5,Math.min(100,Math.round(percent + (['ArrowRight','ArrowUp'].includes(event.key) ? 2 : -2)))));
            frame.hidden = true;
        });
    }
    preview.addEventListener('click', event => {
        if (dragging) return;
        const target = (event.target as HTMLElement).closest('img');
        if (!target?.closest('.scroll-container') || target.dataset.mmMissing) { frame.hidden = true; image = null; return; }
        image = target; frame.hidden = false; position();
    }, true);
    document.addEventListener('pointerdown',event => {
        if (!dragging && !frame.contains(event.target as Node) && !preview.contains(event.target as Node)) { frame.hidden = true; image = null; }
    });
    window.addEventListener('scroll',position,true);
    window.addEventListener('resize',position);
    new MutationObserver(() => { if (!dragging) position(); }).observe(preview,{childList:true,subtree:true});
}

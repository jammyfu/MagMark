import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { ImagePanel, buildImageMarkdown, type ImageInsertOptions } from './image-panel';
import { imageSourceForEditing } from './missing-images';
import { installImageResize } from './image-resize';

export interface ImageReference {
    start: number;
    end: number;
    src: string;
    alt: string;
    title?: string;
    raw: string;
    kind: 'markdown' | 'html';
}

interface MarkdownNode {
    type: string;
    url?: string;
    alt?: string;
    title?: string;
    value?: string;
    position?: { start: { offset?: number }; end: { offset?: number } };
    children?: MarkdownNode[];
}

/** Source ranges, not alt-text matching: repeated images must edit independently. */
export function findImageReferences(markdown: string): ImageReference[] {
    const refs: ImageReference[] = [];
    const visit = (node: MarkdownNode) => {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start !== undefined && end !== undefined && node.type === 'image') {
            const attrs = markdown.slice(end).match(/^\{[^}\n]*\}/)?.[0] || '';
            refs.push({start, end: end + attrs.length, src: node.url || '', alt: node.alt || '', title: node.title || '',
                raw: markdown.slice(start, end + attrs.length), kind: 'markdown'});
        } else if (start !== undefined && node.type === 'html') {
            for (const match of (node.value || '').matchAll(/<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
                const holder = document.createElement('div');
                holder.innerHTML = match[0];
                const img = holder.querySelector('img');
                if (!img) continue;
                const from = start + match.index!;
                refs.push({start: from, end: from + match[0].length, src: img.getAttribute('src') || '',
                    alt: img.alt, raw: match[0], kind: 'html'});
            }
        }
        node.children?.forEach(visit);
    };
    visit(unified().use(remarkParse).parse(markdown) as MarkdownNode);
    return refs.sort((a, b) => a.start - b.start);
}

export function replaceImageReference(markdown: string, ref: ImageReference, replacement: string): string {
    if (markdown.slice(ref.start, ref.end) !== ref.raw) throw new Error('文章已变化，请重新右键选择图片。');
    return markdown.slice(0, ref.start) + replacement + markdown.slice(ref.end);
}

export function formatEditedImage(ref: ImageReference, opts: ImageInsertOptions): string {
    if (ref.kind === 'markdown') return buildImageMarkdown(opts).trim();
    const holder = document.createElement('div');
    holder.innerHTML = ref.raw;
    const img = holder.querySelector('img')!;
    img.setAttribute('src', opts.src);
    img.alt = opts.alt;
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.style.width = `${opts.width ?? 100}%`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.float = 'none';
    img.style.display = opts.layout === 'inline' ? 'inline' : 'block';
    img.style.marginLeft = opts.layout === 'float-left' ? '0' : 'auto';
    img.style.marginRight = opts.layout === 'float-right' ? '0' : 'auto';
    if (opts.layout === 'full') img.style.width = '100%';
    if (opts.caption) img.title = opts.caption;
    else img.removeAttribute('title');
    return img.outerHTML;
}

interface ContextOptions {
    preview: HTMLElement;
    input: HTMLTextAreaElement;
    resolve: (src: string) => string;
    storeImage: (src: string) => string;
    onChange: () => void;
    report: (message: string) => void;
}

export function installImageContextMenu(options: ContextOptions) {
    const {preview, input, resolve, onChange, report} = options;
    const menu = document.createElement('div');
    menu.id = 'mm-image-context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', '图片操作');
    menu.hidden = true;
    menu.style.cssText = 'position:fixed;z-index:10000;min-width:180px;max-height:90vh;overflow:auto;padding:6px;background:#242429;color:#eee;border:1px solid #555;border-radius:8px;box-shadow:0 8px 24px #0005';
    document.body.append(menu);
    let selected: {ref: ImageReference; snapshot: string; image: HTMLImageElement} | null = null;
    const close = () => { menu.hidden = true; };
    const absolute = (src: string) => { try { return new URL(resolve(src), document.baseURI).href; } catch { return src; } };
    const select = (image: HTMLImageElement) => {
        const snapshot = input.value;
        const url = imageSourceForEditing(image);
        const candidates = findImageReferences(snapshot).filter(ref => absolute(ref.src) === url);
        const rendered = [...preview.querySelectorAll<HTMLImageElement>('img')].filter(img => imageSourceForEditing(img) === url);
        const ref = candidates.length === rendered.length ? candidates[rendered.indexOf(image)] : undefined;
        if (!ref) { report('无法唯一定位这张图片的源码，请在 Markdown 中编辑。'); return false; }
        selected = {ref, snapshot, image};
        return true;
    };
    const preset = () => {
        const {ref, image} = selected!;
        const figure = image.closest('figure');
        const layout = (['float-left', 'float-right', 'full', 'center'] as const).find(value =>
            figure?.classList.contains(`mm-${value}`)) ||
            (image.style.marginRight === '0px' ? 'float-right' : image.style.marginLeft === '0px' ? 'float-left' :
                ref.kind === 'html' && getComputedStyle(image.parentElement!).textAlign !== 'center' ? 'float-left' : 'center');
        const widthStyle = (figure as HTMLElement | null)?.style.width || image.style.width;
        const width = widthStyle?.endsWith('%') ? parseFloat(widthStyle) :
            image.offsetWidth / Math.max(1, (figure?.parentElement || image.parentElement)!.clientWidth) * 100;
        return {layout, width: Math.max(1, Math.min(100, Math.round(width || 100))), alt: ref.alt,
            caption: figure?.querySelector('figcaption')?.textContent || (image.dataset.mmMissing ? '' : image.title) || ''};
    };
    const commit = (replacement: string) => {
        if (!selected || input.value !== selected.snapshot) { report('文章已变化，请重新右键选择图片。'); return; }
        input.value = replaceImageReference(input.value, selected.ref, replacement);
        input.dispatchEvent(new Event('input', {bubbles: true}));
        selected = null;
        onChange();
        report('图片已原地更新。');
    };
    const panel = new ImagePanel(opts => {
        if (!selected) return;
        let src = opts.src;
        if (src === selected.image.src || src === resolve(selected.ref.src) || src === imageSourceForEditing(selected.image)) src = selected.ref.src;
        else if (src.startsWith('data:')) src = options.storeImage(src);
        commit(formatEditedImage(selected.ref, {...opts, src}));
    });
    const edit = (image: HTMLImageElement) => {
        close();
        if (select(image)) panel.openWithSrc(imageSourceForEditing(image), preset());
    };
    const update = (changes: Partial<ImageInsertOptions>) => {
        if (selected) commit(formatEditedImage(selected.ref, {...preset(), src: selected.ref.src, ...changes}));
    };
    installImageResize(preview, image => {
        if (!select(image)) return null;
        const initial = preset();
        return width => {
            if (selected) commit(formatEditedImage(selected.ref, {...initial, layout: initial.layout === 'full' ? 'center' : initial.layout, src:selected.ref.src, width}));
        };
    });
    const actions: Array<[string, () => void]> = [
        ['批量关联图片目录', () => document.getElementById('asset-directory-input')?.click()],
        ['编辑 / 替换图片', () => { if (selected) panel.openWithSrc(imageSourceForEditing(selected.image), preset()); }],
        ['左对齐', () => update({layout: 'float-left'})],
        ['居中', () => update({layout: 'center'})],
        ['右对齐', () => update({layout: 'float-right'})],
        ['宽度 50%', () => update({width: 50})],
        ['宽度 100%', () => update({width: 100})],
        ['定位 Markdown 源码', () => { if (selected) { input.focus(); input.setSelectionRange(selected.ref.start, selected.ref.end); } }],
        ['删除这张图片', () => commit('')],
    ];
    for (const [label, action] of actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.textContent = label;
        button.style.cssText = 'display:block;width:100%;text-align:left;padding:9px 12px;color:inherit;background:transparent;border:0;border-radius:4px;cursor:pointer';
        button.addEventListener('click', () => { close(); action(); });
        menu.append(button);
    }
    preview.addEventListener('contextmenu', event => {
        const image = (event.target as HTMLElement).closest('img');
        if (!image || !select(image)) return;
        event.preventDefault();
        event.stopPropagation();
        menu.hidden = false;
        menu.style.left = `${Math.max(8, Math.min(event.clientX, innerWidth - menu.offsetWidth - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(event.clientY, innerHeight - menu.offsetHeight - 8))}px`;
        menu.querySelector('button')?.focus({preventScroll: true});
    });
    preview.addEventListener('click', event => {
        const image = (event.target as HTMLElement).closest('img');
        preview.querySelectorAll('.mm-image-active').forEach(el => el.classList.remove('mm-image-active'));
        if (!image) return;
        image.classList.add('mm-image-active');
        if (image.dataset.mmMissing === 'true') {
            event.preventDefault();
            event.stopImmediatePropagation();
            image.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true,cancelable:true,clientX:event.clientX,clientY:event.clientY}));
        }
    }, true);
    preview.addEventListener('dblclick', event => {
        const image = (event.target as HTMLElement).closest('img');
        if (image) { event.preventDefault(); event.stopPropagation(); edit(image); }
    });
    preview.addEventListener('keydown', event => {
        if (event.key === 'Enter' && event.target instanceof HTMLImageElement) {
            event.preventDefault(); edit(event.target);
        }
    });
    document.addEventListener('pointerdown', event => { if (!menu.contains(event.target as Node)) close(); });
    window.addEventListener('resize', close);
    window.addEventListener('wheel', event => { if (!menu.contains(event.target as Node)) close(); }, {passive: true});
    menu.addEventListener('keydown', event => {
        if (event.key === 'Escape') { close(); input.focus(); }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const buttons = [...menu.querySelectorAll('button')];
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
            (i + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus({preventScroll: true});
    });
    return {edit};
}

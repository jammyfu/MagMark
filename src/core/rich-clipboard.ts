import { sanitizeArticleHtml } from '../security/article-html';
import { sanitizeWechatPasteHtml } from '../wechat/wechat-sanitize';

export type ClipboardTarget = 'document' | 'wechat';
export interface RichClipboardPayload { html: string; text: string; localImages: number }

const STYLE_PROPERTIES = [
    'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-indent', 'text-decoration',
    'white-space', 'word-break', 'overflow-wrap', 'vertical-align',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius',
    'border-collapse', 'list-style-type',
];
const UI_SELECTOR = '.mm-fig-actions,.mm-fig-handles,.page-setting-indicator,.page-footer,script,style,button,input,textarea,select';

export function buildRichClipboardPayload(source: HTMLElement, target: ClipboardTarget): RichClipboardPayload {
    const clone = source.cloneNode(true) as HTMLElement;
    const originals = [source, ...source.querySelectorAll<HTMLElement>('*')];
    const copies = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
    let localImages = 0;

    originals.forEach((original, index) => {
        const copy = copies[index];
        const css = getComputedStyle(original);
        if (original.matches(UI_SELECTOR) || css.display === 'none') {
            copy.remove();
            return;
        }
        copy.removeAttribute('style');
        for (const prop of STYLE_PROPERTIES) copy.style.setProperty(prop, css.getPropertyValue(prop));
        if (target === 'wechat') copy.style.overflowWrap = 'anywhere';
        for (const attr of [...copy.attributes]) {
            if (!['style', 'src', 'alt', 'title', 'href', 'colspan', 'rowspan', 'start'].includes(attr.name)) copy.removeAttribute(attr.name);
        }
        if (original instanceof HTMLImageElement) {
            const src = original.currentSrc || original.src;
            const local = !/^https?:/i.test(src) || /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(src, document.baseURI).hostname);
            if (target === 'wechat' && (local || !original.naturalWidth)) {
                localImages++;
                const placeholder = document.createElement('span');
                placeholder.textContent = `【图片 ${localImages}：${original.alt || '请在公众号后台上传'}】`;
                placeholder.style.cssText = `color:${css.color};font-size:14px;line-height:28px;overflow-wrap:anywhere;`;
                copy.replaceWith(placeholder);
            } else {
                copy.setAttribute('src', src);
                copy.style.width = `${Math.min(100, original.offsetWidth / Math.max(1, source.clientWidth) * 100)}%`;
                copy.style.maxWidth = '100%';
                copy.style.height = 'auto';
            }
        }
        if (original instanceof HTMLAnchorElement) {
            if (/^https?:/i.test(original.href) && !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(original.href).hostname)) copy.setAttribute('href', original.href);
            else copy.removeAttribute('href');
        }
    });
    clone.querySelectorAll(UI_SELECTOR).forEach(el => el.remove());
    // Han's punctuation/spacing wrappers rely on the editor's stylesheet.
    clone.querySelectorAll('*').forEach(el => {
        if (el.tagName.includes('-')) el.replaceWith(...el.childNodes);
    });
    clone.style.margin = '0';
    // Keep paper insets without carrying A4-sized margins into a mobile article.
    clone.style.padding = target === 'wechat' ? '24px 20px' : clone.style.padding;
    clone.style.maxWidth = '100%';
    clone.style.boxSizing = 'border-box';
    let background: HTMLElement | null = source;
    while (background) {
        const color = getComputedStyle(background).backgroundColor;
        if (color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
            clone.style.backgroundColor = color;
            break;
        }
        background = background.parentElement;
    }

    if (target === 'wechat') {
        clone.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
            [heading, ...heading.querySelectorAll<HTMLElement>('*')].forEach(node => {
                const el = node as HTMLElement;
                el.style.whiteSpace = 'normal';
                el.style.wordBreak = 'normal';
                el.style.overflowWrap = 'break-word';
                el.style.lineBreak = 'strict';
            });
        });
    }
    const section = document.createElement('section');
    section.style.cssText = clone.style.cssText;
    section.append(...clone.childNodes);
    const html = target === 'wechat' ? sanitizeWechatPasteHtml(section.outerHTML) : sanitizeArticleHtml(section.outerHTML);
    // Use block boundaries in the plain-text flavour as well.
    const plain = document.createElement('div');
    plain.innerHTML = html.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(p|div|section|h[1-6]|li|tr|blockquote|pre)>/gi, '\n</$1>');
    return { html, text: (plain.textContent || '').replace(/\n{3,}/g, '\n\n').trim(), localImages };
}

export async function writeRichClipboard(payload: Pick<RichClipboardPayload, 'html' | 'text'>): Promise<boolean> {
    payload = { ...payload, html: sanitizeArticleHtml(payload.html) };
    try {
        if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([new ClipboardItem({
                'text/html': new Blob([payload.html], { type: 'text/html' }),
                'text/plain': new Blob([payload.text], { type: 'text/plain' }),
            })]);
            return true;
        }
    } catch { /* Older browsers and embedded editors may require selection-based copy. */ }

    const active = document.activeElement as HTMLElement | null;
    const selection = window.getSelection();
    const ranges = selection ? Array.from({length: selection.rangeCount}, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
    const holder = document.createElement('div');
    holder.contentEditable = 'true';
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap;user-select:text';
    holder.innerHTML = payload.html;
    let handled = false;
    const onCopy = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        event.clipboardData.setData('text/html', payload.html);
        event.clipboardData.setData('text/plain', payload.text);
        event.preventDefault();
        handled = true;
    };
    try {
        document.body.append(holder);
        holder.focus();
        const range = document.createRange();
        range.selectNodeContents(holder);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.addEventListener('copy', onCopy);
        return document.execCommand('copy') && handled;
    } catch {
        return false;
    } finally {
        document.removeEventListener('copy', onCopy);
        holder.remove();
        active?.focus({preventScroll:true});
        selection?.removeAllRanges();
        ranges.forEach(range => selection?.addRange(range));
    }
}

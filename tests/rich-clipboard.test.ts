/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRichClipboardPayload, writeRichClipboard } from '../src/core/rich-clipboard';
import { sanitizeWechatPasteHtml } from '../src/wechat/wechat-sanitize';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});

describe('rich clipboard', () => {
    it('keeps table cells and normalizes mobile heading descendants without changing the preview', () => {
        document.body.innerHTML = '<article><h2 style="word-break:keep-all"><span style="white-space:nowrap;word-break:keep-all">3. 手机端也要能玩，不只是电脑上能跑</span></h2><table><thead><tr><th>模型</th><th>Token</th></tr></thead><tbody><tr><td>GPT-6 Astra</td><td>2.54 亿</td></tr></tbody></table></article>';
        const source = document.querySelector('article')!;
        const original = source.outerHTML;
        const result = document.createElement('div');
        result.innerHTML = buildRichClipboardPayload(source, 'wechat').html;
        expect(result.querySelectorAll('th')).toHaveLength(2);
        expect(result.querySelectorAll('td')).toHaveLength(2);
        expect(result.querySelector('table')!.style.tableLayout).toBe('fixed');
        expect(result.querySelector('td > span[leaf]')).not.toBeNull();
        expect(result.querySelector('h2')!.style.wordBreak).toBe('normal');
        expect(result.querySelector('h2')!.style.lineBreak).toBe('strict');
        expect(result.querySelector('h2')!.outerHTML).not.toMatch(/keep-all|nowrap|anywhere/);
        expect(source.outerHTML).toBe(original);
    });
    it('keeps paper insets after WeChat sanitizing without importing print margins or changing Word spacing', () => {
        document.body.innerHTML = '<article style="background-color:#f5f3ed;padding:80px 70px;margin:50px;width:794px"><p>正文</p><img src="https://example.com/image.png" alt="插图"></article>';
        const source = document.querySelector('article')!;
        const img = source.querySelector('img')!;
        Object.defineProperty(source, 'clientWidth', {value:794});
        Object.defineProperties(img, {naturalWidth:{value:1200},offsetWidth:{value:397}});
        const original = source.outerHTML;
        const result = buildRichClipboardPayload(source, 'wechat');
        const parsed = document.createElement('div');
        parsed.innerHTML = sanitizeWechatPasteHtml(result.html);
        const paper = parsed.firstElementChild as HTMLElement;
        expect(paper.style.paddingTop).toBe('24px');
        expect(paper.style.paddingBottom).toBe('24px');
        expect(paper.style.paddingLeft).toBe('20px');
        expect(paper.style.paddingRight).toBe('20px');
        expect(paper.style.boxSizing).toBe('border-box');
        expect(paper.style.maxWidth).toBe('100%');
        expect(paper.style.width).toBe('');
        expect(paper.style.margin).toBe('0px');
        expect(paper.style.backgroundColor).toBe('rgb(245, 243, 237)');
        expect(paper.querySelector('img')!.style.width).toBe('50%');
        expect(result.localImages).toBe(0);
        expect(source.outerHTML).toBe(original);
        parsed.innerHTML = buildRichClipboardPayload(source, 'document').html;
        expect((parsed.firstElementChild as HTMLElement).style.padding).toBe('80px 70px');
    });

    it('keeps theme colors, strips editor controls, and warns about local images without mutating the preview', () => {
        document.body.innerHTML = '<div style="background-color:#f6f5ef"><article style="color:#4a7c59;font-size:14px"><p>正文<h-char>，</h-char><strong>加粗</strong></p><p><img src="assets/a_b.png" alt="插图"></p><button>删除</button></article></div>';
        const source = document.querySelector('article')!;
        const original = source.outerHTML;
        const result = buildRichClipboardPayload(source, 'wechat');
        expect(source.outerHTML).toBe(original);
        expect(result.localImages).toBe(1);
        expect(result.html).toContain('rgb(74, 124, 89)');
        expect(result.html).toContain('rgb(246, 245, 239)');
        expect(result.html).not.toMatch(/<h-char|<button|assets\/|position:|[;\"]height:/);
        expect(result.html).toContain('leaf=""');
        expect(result.text).toContain('正文，加粗\n');
        expect(result.text).toContain('【图片 1：插图】');
        expect(result.text).not.toContain('删除');
    });

    it('does not overwrite a successful modern clipboard write with execCommand', async () => {
        const write = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', {clipboard:{write}});
        vi.stubGlobal('ClipboardItem', class {});
        const exec = vi.fn();
        Object.defineProperty(document, 'execCommand', {value:exec,configurable:true});
        expect(await writeRichClipboard({html:'<p>正文</p>',text:'正文'})).toBe(true);
        expect(write).toHaveBeenCalledTimes(1);
        expect(exec).not.toHaveBeenCalled();
    });

    it('cleans up and reports failure when both clipboard paths are unavailable', async () => {
        vi.stubGlobal('navigator', {});
        Object.defineProperty(document, 'execCommand', {value:()=>false,configurable:true});
        document.body.innerHTML = '<button id="focus">复制</button>';
        const button = document.querySelector<HTMLButtonElement>('#focus')!;
        button.focus();
        expect(await writeRichClipboard({html:'<p>正文</p>',text:'正文'})).toBe(false);
        expect(document.activeElement).toBe(button);
        expect(document.querySelector('[contenteditable]')).toBeNull();
    });
});

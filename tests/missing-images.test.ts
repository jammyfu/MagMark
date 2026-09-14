/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {markMissingImage, imageSourceForEditing} from '../src/image/missing-images';
import {buildRichClipboardPayload} from '../src/core/rich-clipboard';

describe('missing image editing', () => {
    it('shows an editable placeholder without losing its original URL or alt', () => {
        const img = document.createElement('img');
        img.src = 'assets/missing.png';
        img.alt = '原图说明';
        const original = img.src;
        markMissingImage(img);
        expect(img.src).toMatch(/^data:image\/svg\+xml/);
        expect(imageSourceForEditing(img)).toBe(original);
        expect(img.alt).toBe('原图说明');
        markMissingImage(img);
        expect(imageSourceForEditing(img)).toBe(original);
    });
    it('does not alter loaded image dimensions and does not export fallback art as uploaded media', () => {
        const article = document.createElement('article');
        const img = document.createElement('img');
        img.src = 'assets/missing.png';
        img.alt = '待替换';
        article.append(img);
        document.body.append(article);
        markMissingImage(img);
        const payload = buildRichClipboardPayload(article, 'wechat');
        expect(payload.localImages).toBe(1);
        expect(payload.html).not.toContain('data:image/svg');
        const loaded = document.createElement('img');
        loaded.style.width = '40%';
        Object.defineProperty(loaded, 'naturalWidth', {value: 200});
        markMissingImage(loaded);
        expect(loaded.style.width).toBe('40%');
        article.remove();
    });
});

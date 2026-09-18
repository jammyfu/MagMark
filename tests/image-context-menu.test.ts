/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {findImageReferences, replaceImageReference, formatEditedImage, installImageContextMenu} from '../src/image/image-context-menu';

describe('in-place image editing', () => {
    it('opens picture editing using fallback identity when the browser displays a different theme source', () => {
        const preview = document.createElement('div');
        preview.innerHTML = '<picture><source srcset="white.svg"><img src="black.svg" alt="Logo"></picture>';
        const input = document.createElement('textarea');
        input.value = preview.innerHTML;
        const image = preview.querySelector('img')!;
        Object.defineProperty(image, 'currentSrc', {value: 'http://localhost:3000/white.svg'});
        const reports: string[] = [];
        installImageContextMenu({preview, input, resolve: s => s, storeImage: s => s, onChange: () => {}, report: s => reports.push(s)});
        image.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true}));
        expect(reports).toEqual([]);
        expect(document.getElementById('mm-image-context-menu')?.hidden).toBe(false);
        document.getElementById('mm-image-context-menu')?.remove();
    });
    it('round-trips spaces, parentheses and bracketed alt text after editing', () => {
        const ref = findImageReferences('![old](<assets/a (1).png>)')[0];
        const result = formatEditedImage(ref, {src:ref.src,alt:'说明[一]',layout:'center',width:50});
        const parsed = findImageReferences(result)[0];
        expect(decodeURIComponent(parsed.src)).toBe('assets/a (1).png');
        expect(parsed.alt).toBe('说明[一]');
    });
    it('finds real images, including linked HTML, but not code examples', () => {
        const md = '![a](assets/a_b.png){width=50%}\n<a href="large.png"><img src="assets/b_c.png" alt="B"></a>\n\n`![ignore](x)`\n\n```html\n<img src="skip.png">\n```';
        const refs = findImageReferences(md);
        expect(refs.map(r => r.src)).toEqual(['assets/a_b.png', 'assets/b_c.png']);
        expect(refs[0].raw).toContain('{width=50%}');
    });
    it('replaces only the selected repeated occurrence and preserves adjacent text and links', () => {
        const md = 'before ![a](same.png) between ![a](same.png) after';
        const refs = findImageReferences(md);
        expect(replaceImageReference(md, refs[1], 'NEW')).toBe('before ![a](same.png) between NEW after');
        expect(() => replaceImageReference('changed'+md, refs[1], 'NEW')).toThrow();
    });
    it('keeps linked HTML image wrappers and safely applies percent width and alignment', () => {
        const md = '<a href="large.png"><img src="local.png" width="400" height="200" alt="old"></a>';
        const ref = findImageReferences(md)[0];
        const image = formatEditedImage(ref, {src:'local.png', alt:'a "quote"', layout:'float-right',width:50});
        const next = replaceImageReference(md,ref,image);
        expect(next).toContain('<a href="large.png">');
        expect(next).toContain('width: 50%');
        expect(next).toContain('height: auto');
        expect(next).toContain('margin-right: 0px');
        expect(next).not.toContain('width="400"');
        expect(next).toContain('&quot;quote&quot;');
    });
});

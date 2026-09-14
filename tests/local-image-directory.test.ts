import {describe, expect, it} from 'vitest';
import {resolveDirectoryImage} from '../src/image/local-image-directory';

describe('directory image mapping', () => {
    const images = new Map([['root/one/assets/a.png','blob:one'],['root/two/assets/a.png','blob:two'],['root/shared/中 文.png','blob:shared']]);
    it('prefers the article-relative path for duplicate filenames', () => {
        expect(resolveDirectoryImage('assets/a.png','root/two/post.md',images)).toBe('blob:two');
        expect(resolveDirectoryImage('assets/a.png','',images)).toBe('assets/a.png');
    });
    it('resolves parent directories and encoded filenames but not external URLs', () => {
        expect(resolveDirectoryImage('../shared/%E4%B8%AD%20%E6%96%87.png','root/two/post.md',images)).toBe('blob:shared');
        expect(resolveDirectoryImage('https://site/assets/a.png','root/one/post.md',images)).toBe('https://site/assets/a.png');
    });
    it('maps a separately selected image folder and local file URLs by a unique suffix', () => {
        const selected = new Map([['images/nested/a (1).png', 'blob:a']]);
        expect(resolveDirectoryImage('assets/images/nested/a%20(1).png', '', selected)).toBe('blob:a');
        expect(resolveDirectoryImage('file:///Users/me/assets/images/nested/a%20(1).png', '', selected)).toBe('blob:a');
        expect(resolveDirectoryImage('missing.png', '', selected)).toBe('missing.png');
    });
});

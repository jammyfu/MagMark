// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { contrastingInk, colorizeImage } from '../src/image/image-colors';
import { findImageReferences, replaceImageReference } from '../src/image/image-context-menu';

describe('image appearance', () => {
    it('chooses readable ink for paper instead of system appearance', () => {
        expect(contrastingInk('rgb(250, 248, 244)')).toBe('#24352d');
        expect(contrastingInk('rgb(20, 25, 30)')).toBe('#f6f8fa');
    });
    it('keeps original bytes when no color edit is requested', async () => {
        expect(await colorizeImage('original.svg', '', '')).toBe('original.svg');
    });
    it('removes competing picture sources only around the edited image', () => {
        const source = 'before <picture><source srcset="white.svg"><img src="black.svg"></picture> after';
        expect(replaceImageReference(source, findImageReferences(source)[0], '<img src="edited.png">'))
            .toBe('before <img src="edited.png"> after');
    });
});

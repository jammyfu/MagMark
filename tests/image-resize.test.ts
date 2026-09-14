import {describe,expect,it} from 'vitest';
import {resizePercent} from '../src/image/image-resize';
describe('long-view image resizing',()=>{
    it('uses the real container width and compensates for preview zoom',()=>{
        expect(resizePercent(400,50,800,0.5,false)).toBe(63);
        expect(resizePercent(400,50,800,1,false)).toBe(56);
    });
    it('resizes around the center and clamps the result',()=>{
        expect(resizePercent(400,50,800,1,true)).toBe(63);
        expect(resizePercent(400,900,800,1,true)).toBe(100);
        expect(resizePercent(400,-900,800,1,false)).toBe(5);
    });
});

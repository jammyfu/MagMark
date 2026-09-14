import { describe, expect, it } from 'vitest';
import { exportImage, exportAsZip, generateBookmarkedPdf } from '../src/export/image-renderer';
import { compileTypst } from '../src/export/typst-converter';
import { convertWithPrince } from '../src/export/princexml-converter';

describe('lower-level export capability boundaries', () => {
  it('does not return fake PNG bytes', async () => { await expect(exportImage('<p>中文</p>')).rejects.toThrow(); });
  it('does not return fake ZIP bytes', async () => { await expect(exportAsZip([], {platform:'web'})).rejects.toThrow(); });
  it('does not return fake PDF bytes', async () => { await expect(generateBookmarkedPdf([], [])).rejects.toThrow(); });
  it('does not advertise a generated Typst template as a compiled PDF', async () => { expect((await compileTypst('中文','unused.pdf')).success).toBe(false); });
  it('does not advertise Prince input HTML as a converted PDF', async () => { expect((await convertWithPrince('<p>中文</p>','unused.pdf')).success).toBe(false); });
});

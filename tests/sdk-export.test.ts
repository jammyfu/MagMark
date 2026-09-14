import { describe, expect, it, vi } from 'vitest';
import { MagMark } from '../src/core/magmark';
import { getExportCapabilities, UnsupportedExportError } from '../src/core/export-capabilities';

describe('SDK export capabilities', () => {
  it('does not advertise the browser editor as an SDK export backend', () => {
    const sdk = new MagMark();
    expect(sdk.getExportCapabilities()).toBe(getExportCapabilities());
    expect(getExportCapabilities().scope).toBe('sdk');
    for (const capability of Object.values(getExportCapabilities().operations)) {
      expect(capability.available).toBe(false);
      expect(capability.reason).not.toBe('');
      expect(Object.isFrozen(capability)).toBe(true);
    }
    expect(Object.isFrozen(getExportCapabilities().operations)).toBe(true);
  });

  it.each(['typst', 'prince', 'images', 'xiaohongshu', 'wechatLongImage'] as const)(
    'rejects %s before rendering or logging a false success', async operation => {
      const sdk = new MagMark();
      const render = vi.spyOn(sdk, 'render').mockRejectedValue(new Error('Rendering must not start'));
      const log = vi.spyOn(console, 'log');
      try {
        const calls = {
          typst: () => sdk.exportTypst('private-path.typ'),
          prince: () => sdk.exportPrince('private-path.pdf'),
          images: () => sdk.exportImages('# article'),
          xiaohongshu: () => sdk.exportXiaohongshu('private-path.zip', '# article'),
          wechatLongImage: () => sdk.exportWeChat('private-path.png', '# article'),
        };
        const failure = await calls[operation]().then(() => undefined, error => error);
        expect(failure).toBeInstanceOf(UnsupportedExportError);
        expect(failure).toMatchObject({ code: 'MAGMARK_EXPORT_UNAVAILABLE', operation });
        expect(failure.message).not.toContain('private-path');
        expect(render).not.toHaveBeenCalled();
        expect(log).not.toHaveBeenCalled();
      } finally {
        render.mockRestore();
        log.mockRestore();
      }
    },
  );
});

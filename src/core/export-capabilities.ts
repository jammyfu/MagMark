/** Capabilities of the MagMark class, not the browser editor or low-level adapters. */
export type ExportOperation = 'typst' | 'prince' | 'images' | 'xiaohongshu' | 'wechatLongImage';

export interface ExportCapability {
  readonly available: boolean;
  readonly reason: string;
}

export interface ExportCapabilities {
  readonly scope: 'sdk';
  readonly operations: Readonly<Record<ExportOperation, ExportCapability>>;
}

const unavailable = (reason: string): ExportCapability => Object.freeze({ available: false, reason });

const capabilities: ExportCapabilities = Object.freeze({
  scope: 'sdk',
  operations: Object.freeze({
    typst: unavailable('The SDK has no configured Typst compiler or file writer.'),
    prince: unavailable('The SDK has no configured Prince compiler or file writer.'),
    images: unavailable('The SDK has no configured screenshot renderer. Browser-editor PNG export is separate.'),
    xiaohongshu: unavailable('The SDK has no configured carousel renderer and archive writer.'),
    wechatLongImage: unavailable('The SDK has no configured long-image renderer and file writer. WeChat HTML copying is separate.'),
  }),
});

export function getExportCapabilities(): ExportCapabilities {
  return capabilities;
}

/** A rejected export is never a successful empty image/archive or a log-only write. */
export class UnsupportedExportError extends Error {
  readonly code = 'MAGMARK_EXPORT_UNAVAILABLE';

  constructor(readonly operation: ExportOperation) {
    super(`MagMark SDK export '${operation}' is unavailable. ${capabilities.operations[operation].reason}`);
    this.name = 'UnsupportedExportError';
  }
}

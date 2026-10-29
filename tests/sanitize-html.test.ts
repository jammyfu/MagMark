import { describe, expect, it } from 'vitest';
import { sanitizeDocumentHtml } from '../src/core/sanitize-html';

describe('published document HTML', () => {
  it('removes executable document markup and unsafe links', () => {
    const result = sanitizeDocumentHtml('<img src=x onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">link</a><iframe srcdoc="x"></iframe><form><input name="location"></form>');
    expect(result).not.toMatch(/onerror|<script|javascript:|iframe|<form|<input/);
  });
  it('preserves magazine typography and uploaded image URLs', () => {
    const result = sanitizeDocumentHtml('<h1>步步福</h1><figure style="width:50%"><img src="blob:https://bubufu.com/photo"><figcaption>作品</figcaption></figure>');
    expect(result).toContain('<h1>步步福</h1>');
    expect(result).toContain('style="width:50%"');
    expect(result).toContain('blob:https://bubufu.com/photo');
    expect(result).toContain('<figcaption>作品</figcaption>');
  });
});

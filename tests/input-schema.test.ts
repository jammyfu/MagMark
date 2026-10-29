import { describe, expect, it } from 'vitest';
import { MagMark } from '../src/core/magmark';
import { DesignTokensSchema, getDefaultDesignTokens, validateDesignTokens } from '../src/schemas/input-schema';

describe('design token defaults', () => {
  it('constructs the SDK with a complete default configuration', () => {
    const tokens = new MagMark().getDesignTokens();
    expect(tokens.grid.columns).toBe(12);
    expect(tokens.typography.lineHeight).toBe(1.75);
    expect(tokens.platforms.xiaohongshu.primary).toEqual({ width: 1080, height: 1440, ratio: '3:4' });
    expect(tokens.platforms.wechat.width).toBe(1080);
    expect(validateDesignTokens(tokens).valid).toBe(true);
  });

  it('fills omitted parent objects while retaining explicit nested values', () => {
    const tokens = DesignTokensSchema.parse({ grid: { columns: 8 }, colors: { accent: '#ff8800' } });
    expect(tokens.grid).toMatchObject({ columns: 8, baselineStep: 8, gutter: 24 });
    expect(tokens.colors.accent).toBe('#ff8800');
    expect(tokens.platforms.cover).toEqual({ width: 1080, height: 383 });
  });

  it('does not share mutable arrays or objects between defaults', () => {
    const first = getDefaultDesignTokens();
    const second = getDefaultDesignTokens();
    first.platforms.pdf.push('A0');
    first.grid.columns = 3;
    first.typography.lineHeightRange[0] = 2;
    expect(second.platforms.pdf).toEqual(['A4', 'Letter']);
    expect(second.grid.columns).toBe(12);
    expect(second.typography.lineHeightRange).toEqual([1.6, 1.8]);
  });

  it('rejects invalid explicit values instead of replacing them with defaults', () => {
    expect(validateDesignTokens({ grid: { columns: 0 } }).valid).toBe(false);
    expect(validateDesignTokens({ colors: { accent: 'not-a-color' } }).valid).toBe(false);
    expect(validateDesignTokens({ platforms: { wechat: { width: -1 } } }).valid).toBe(false);
    expect(validateDesignTokens({ grid: null }).valid).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('preview selection contrast', () => {
  it('does not erase rich block backgrounds while selecting them', () => {
    const css = readFileSync('workspace.css', 'utf8');
    expect(css).toContain(':not(pre):not(table):not(figure)');
    expect(css).toContain(':is(pre, table, figure):is(.block-editing, .block-selected)');
    expect(css).toContain('inset 0 0 0 2px');
    expect(css).toContain('.block-editing { outline-width:3px');
  });
});

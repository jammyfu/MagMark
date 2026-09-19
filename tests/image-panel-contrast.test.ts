import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../workspace.css', import.meta.url), 'utf8');

describe('image ratio panel contrast', () => {
  it('uses workspace colors for inactive and active direction choices', () => {
    expect(css).toMatch(/\.mm-ip-ar-cat\s*\{[^}]*color:\s*var\(--ws-muted\)[^}]*font-size:\s*11px[^}]*opacity:\s*1/s);
    expect(css).toMatch(/\.mm-ip-ar-cat\.active\s*\{[^}]*color:\s*var\(--ws-ink\)[^}]*var\(--ws-accent\)/s);
  });

  it('keeps every ratio tick readable instead of styling it as disabled', () => {
    expect(css).toMatch(/\.mm-ip-ar-tick-label\s*\{[^}]*color:\s*var\(--ws-muted\)[^}]*font-size:\s*10px[^}]*opacity:\s*1/s);
    expect(css).toMatch(/\.mm-ip-ar-tick\.active \.mm-ip-ar-tick-label\s*\{[^}]*color:\s*var\(--ws-accent\)/s);
  });

  it('removes the fixed light selected surface from the themed panel', () => {
    expect(css).toMatch(/\.mm-ip-ar-active\s*\{[^}]*color-mix\([^}]*var\(--ws-accent\)[^}]*var\(--ws-surface\)/s);
    expect(css).toMatch(/#mm-ip-ar-active-label\s*\{[^}]*color:\s*var\(--ws-surface\)[^}]*background:\s*var\(--ws-accent\)/s);
  });
});

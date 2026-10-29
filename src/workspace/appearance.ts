/** Workspace preference only: never mutate article theme, source or preview DOM. */
export function mountAppearance(select: HTMLSelectElement, body: HTMLElement = document.body) {
  const key = 'magmark.workspace.appearance';
  const paletteKey = 'magmark.workspace.palette';
  const palette = body.querySelector<HTMLSelectElement>('#workspace-palette');
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  let preference = 'auto';
  let saved: string | null = null;
  try { saved = window.localStorage.getItem(key); } catch { /* Storage may be disabled. */ }
  function apply(value: string) {
    preference = ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
    const theme = preference === 'auto' ? (system?.matches ? 'dark' : 'light') : preference;
    body.dataset.workspaceTheme = theme;
    select.value = preference;
  }
  apply(saved || 'auto');
  const applyPalette = (value: string | null) => {
    const name = ['neutral', 'sand', 'sage', 'slate'].includes(value || '') ? value! : 'neutral';
    body.dataset.workspacePalette = name;
    if (palette) palette.value = name;
  };
  try { applyPalette(window.localStorage.getItem(paletteKey)); } catch { applyPalette(null); }
  const paletteChange = () => {
    applyPalette(palette?.value || 'neutral');
    try { window.localStorage.setItem(paletteKey, body.dataset.workspacePalette!); } catch { /* In-memory preference still works. */ }
  };
  const systemChange = () => { if (preference === 'auto') apply('auto'); };
  const change = () => {
    apply(select.value);
    try { window.localStorage.setItem(key, select.value); } catch { /* Still usable in memory. */ }
  };
  select.addEventListener('change', change);
  palette?.addEventListener('change', paletteChange);
  system?.addEventListener('change', systemChange);
  return () => { select.removeEventListener('change', change); palette?.removeEventListener('change', paletteChange); system?.removeEventListener('change', systemChange); };
}

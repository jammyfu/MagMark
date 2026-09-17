/** Workspace preference only: never mutate article theme, source or preview DOM. */
export function mountAppearance(select: HTMLSelectElement, body: HTMLElement = document.body) {
  const key = 'magmark.workspace.appearance';
  let saved: string | null = null;
  try { saved = window.localStorage.getItem(key); } catch { /* Storage may be disabled. */ }
  function apply(value: string) {
    const theme = value === 'dark' ? 'dark' : 'light';
    body.dataset.workspaceTheme = theme;
    select.value = theme;
  }
  apply(saved || 'light');
  const change = () => {
    apply(select.value);
    try { window.localStorage.setItem(key, select.value); } catch { /* Still usable in memory. */ }
  };
  select.addEventListener('change', change);
  return () => select.removeEventListener('change', change);
}

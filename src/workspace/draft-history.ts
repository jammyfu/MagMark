import type { SavedImages } from '../../editor';

export interface DraftVersion { id: string; time: number; text: string; images: SavedImages }
export const retainVersions = (versions: DraftVersion[], next: DraftVersion) => [...versions, next].slice(-30);

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('magmark-local-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database blocked'));
  });
}
export function mountDraftHistory(input: HTMLTextAreaElement, assets: {
  key: () => string; capture: () => Promise<SavedImages>; restore: (images: SavedImages) => void;
}, report: (message: string) => void) {
  const status = document.getElementById('autosave-status')!;
  const button = document.getElementById('btn-history')!;
  const initial = input.value;
  let versions: DraftVersion[] = [], savedKey = '', ready = false, busy = false;
  let db: IDBDatabase;
  const key = () => input.value + '\u0000' + assets.key();
  const dialog = document.createElement('dialog');
  dialog.className = 'export-dialog history-dialog'; dialog.setAttribute('aria-label', '自动保存历史');
  const title = document.createElement('h2'); title.textContent = '历史记录';
  const note = document.createElement('p'); note.textContent = '最近 30 个本地版本（正文及已关联图片）。不包含排版参数；清除浏览器数据会清除历史，请定期导出备份。';
  const list = document.createElement('div');
  const close = document.createElement('button'); close.textContent = '关闭'; close.type = 'button';
  close.addEventListener('click', () => dialog.close());
  dialog.append(title, note, list, close); document.body.append(dialog);
  async function save() {
    if (!ready || busy || savedKey === key()) return;
    busy = true; status.textContent = '正在保存…';
    const pendingKey = key(), text = input.value;
    try {
      const images = await assets.capture();
      if (key() !== pendingKey) { status.textContent = '等待保存…'; return; }
      const next = retainVersions(versions, { id: crypto.randomUUID(), time: Date.now(), text, images });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts');
        const read = store.get('current');
        read.onsuccess = () => {
          const remote = (read.result || []) as DraftVersion[];
          if (remote.at(-1)?.id !== versions.at(-1)?.id) { tx.abort(); return; }
          store.put(next, 'current');
        };
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(tx.error || new Error('Draft changed in another tab'));
      });
      versions = next; savedKey = pendingKey;
      status.textContent = `已自动保存 ${new Date().toLocaleTimeString('zh-CN')}`;
    } catch {
      status.textContent = '自动保存失败，请导出备份';
      report('本地保存未成功：可能是存储空间不足、权限受限或另一页面已修改草稿。请先导出 Markdown 备份。');
      ready = false;
    } finally { busy = false; }
  }
  function show() {
    list.replaceChildren();
    if (!versions.length) { const empty = document.createElement('p'); empty.textContent = '暂无已保存版本'; list.append(empty); }
    for (const version of [...versions].reverse()) {
      const row = document.createElement('div'); row.className = 'history-version';
      const label = document.createElement('p');
      label.textContent = `${new Date(version.time).toLocaleString('zh-CN')} · ${version.text.length} 字符`;
      const preview = document.createElement('pre'); preview.textContent = version.text.slice(0, 180) || '（空白文章）';
      const restore = document.createElement('button'); restore.type = 'button'; restore.textContent = '恢复此版本';
      restore.addEventListener('click', async () => {
        if (busy || !ready) { report('请等待保存完成；保存不可用时请先导出备份。'); return; }
        const before = key();
        await save();
        if (!ready || busy || key() !== before || savedKey !== before) { report('当前内容尚未安全保存，请稍后重试。'); return; }
        try { input.value = version.text; } catch { report('请先完成中文输入再恢复。'); return; }
        assets.restore(version.images);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        dialog.close(); await save();
      });
      row.append(label, preview, restore); list.append(row);
    }
    dialog.showModal();
  }
  button.addEventListener('click', show);
  const timer = setInterval(() => { void save(); }, 1500);
  const visibility = () => { if (document.visibilityState === 'hidden') void save(); };
  document.addEventListener('visibilitychange', visibility);
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (savedKey !== key()) { event.preventDefault(); event.returnValue = ''; }
  };
  window.addEventListener('beforeunload', beforeUnload);
  void (async () => {
    try {
      db = await database();
      versions = await new Promise<DraftVersion[]>((resolve, reject) => {
        const request = db.transaction('drafts').objectStore('drafts').get('current');
        request.onsuccess = () => resolve(request.result || []); request.onerror = () => reject(request.error);
      });
      const latest = versions.at(-1);
      if (latest && input.value === initial) {
        input.value = latest.text; assets.restore(latest.images);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        savedKey = key(); status.textContent = '已恢复本地草稿';
      }
      ready = true; await save();
    } catch { status.textContent = '自动保存不可用，请导出备份'; }
  })();
  return () => { clearInterval(timer); window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('visibilitychange', visibility); button.removeEventListener('click', show); dialog.remove(); db?.close(); };
}

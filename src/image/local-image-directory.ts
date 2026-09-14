export function normalizeRelativePath(path: string): string {
    const parts: string[] = [];
    for (const part of path.replace(/\\/g, '/').split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    return parts.join('/');
}

export function resolveDirectoryImage(src: string, articlePath: string, images: Map<string, string>): string {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src) && !/^file:/i.test(src)) return src;
    let path = src;
    if (/^file:/i.test(src)) {
        try { path = new URL(src).pathname; } catch { return src; }
    }
    try { path = decodeURIComponent(path); } catch { /* A literal percent can be part of a filename. */ }
    const directory = articlePath.slice(0, articlePath.lastIndexOf('/') + 1);
    const exact = images.get(normalizeRelativePath(directory + path));
    if (exact) return exact;
    const parts = normalizeRelativePath(path).split('/');
    while (parts.length) {
        const relative = parts.join('/');
        const matches = [...images].filter(([key]) => key === relative || key.endsWith('/' + relative));
        if (matches.length) return matches.length === 1 ? matches[0][1] : src;
        parts.shift();
    }
    return src;
}

export async function chooseDirectoryArticle(files: File[]): Promise<File | null> {
    const articles = files.filter(file => /\.(md|markdown)$/i.test(file.name));
    if (articles.length <= 1) return articles[0] || null;
    return new Promise(resolve => {
        const dialog = document.createElement('dialog');
        dialog.style.cssText = 'max-width:90vw;padding:24px;background:#242429;color:#eee;border:1px solid #555;border-radius:12px';
        const title = document.createElement('h3');
        title.textContent = '选择要打开的文章';
        const select = document.createElement('select');
        select.setAttribute('aria-label', '目录中的 Markdown 文章');
        select.style.cssText = 'display:block;max-width:80vw;margin:16px 0;padding:8px';
        articles.forEach((file,index) => select.add(new Option(file.webkitRelativePath || file.name, String(index))));
        const finish = (file: File | null) => { dialog.close(); dialog.remove(); resolve(file); };
        const open = document.createElement('button');
        open.textContent = '打开文章';
        open.onclick = () => finish(articles[Number(select.value)]);
        const cancel = document.createElement('button');
        cancel.textContent = '取消';
        cancel.onclick = () => finish(null);
        dialog.addEventListener('cancel', event => {event.preventDefault();finish(null);});
        dialog.append(title, select, open, cancel);
        document.body.append(dialog);
        dialog.showModal();
        select.focus();
    });
}

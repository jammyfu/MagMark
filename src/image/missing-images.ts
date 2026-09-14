const placeholder = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180"><rect x="2" y="2" width="476" height="176" rx="12" fill="#f5f3ed" stroke="#9d9276" stroke-width="2" stroke-dasharray="8 6"/><text x="240" y="76" text-anchor="middle" font-family="sans-serif" font-size="21" fill="#534d40">图片未找到或加载失败</text><text x="240" y="113" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#746b59">点击批量关联图片目录 · 无需逐张导入</text></svg>',
);

export function imageSourceForEditing(image: HTMLImageElement): string {
    return image.dataset.mmOriginalSrc || image.currentSrc || image.src;
}

export function markMissingImage(image: HTMLImageElement): void {
    if (image.dataset.mmMissing === 'true' || image.naturalWidth > 0) return;
    image.dataset.mmOriginalSrc = image.src;
    image.dataset.mmMissing = 'true';
    image.title = `图片加载失败：${image.getAttribute('src') || ''}。点击或右键替换。`;
    image.style.width = '100%';
    image.style.maxWidth = '480px';
    image.style.height = 'auto';
    image.style.minHeight = '100px';
    image.style.cursor = 'pointer';
    image.src = placeholder;
}

/** Error handling is shared by paginated, long-article and WeChat previews. */
export function installMissingImagePlaceholders(preview: HTMLElement): void {
    const inspect = () => preview.querySelectorAll<HTMLImageElement>('img').forEach(image => {
        image.tabIndex = 0;
        if (image.complete && !image.naturalWidth) markMissingImage(image);
    });
    preview.addEventListener('error', event => {
        if (event.target instanceof HTMLImageElement) markMissingImage(event.target);
    }, true);
    new MutationObserver(inspect).observe(preview, {childList: true, subtree: true});
    inspect();
}

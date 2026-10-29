export const LAYER_SELECTOR = '.mm-cover-title,.mm-cover-subtitle,.mm-cover-text,.mm-cover-image';
export const layerId = (el: Element) =>
  [...el.classList].find((c) => c.startsWith('mm-layer-id-')) || '';
export function coverLayers(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>(LAYER_SELECTOR)];
}
export function prepareCover(doc: Document, root: HTMLElement) {
  const layers = coverLayers(root);
  if (!root.classList.contains('mm-layer-canvas')) {
    root.replaceChildren(...layers);
    root.classList.add('mm-layer-canvas');
    root.style.display = 'block';
    root.style.padding = '0';
    const badge = doc.createElement('div');
    badge.className = 'mm-cover-brand';
    badge.textContent = 'FOLIO / EDITORIAL';
    badge.style.cssText =
      'position:absolute;left:6%;top:4%;font-size:.38em;letter-spacing:.18em;color:var(--th-primary,#867043)';
    root.prepend(badge);
    const dark = root.classList.contains('mm-cover-dark');
    layers
      .filter((el) => el.tagName !== 'IMG')
      .forEach((el) =>
        Object.assign(el.style, {
          color: dark ? '#ffffff' : '#172033',
          backgroundColor: dark ? '#172033' : '#ffffff',
          opacity: '1',
        })
      );
  }
  root.style.position = 'relative';
  root.style.overflow = 'hidden';
  let id = 0;
  layers.forEach((el) => {
    if (!layerId(el)) {
      while (layers.some((node) => layerId(node) === `mm-layer-id-${id}`)) id++;
      el.classList.add(`mm-layer-id-${id++}`);
    }
    if (!el.style.zIndex)
      el.style.zIndex = String(
        Math.max(1, ...layers.map((node) => Number(node.style.zIndex) || 1)) + 1
      );
    Object.assign(el.style, {
      boxSizing: 'border-box',
      position: 'absolute',
      margin: '0',
      maxWidth: 'none',
    });
    if (el.tagName !== 'IMG')
      Object.assign(el.style, {
        whiteSpace: 'pre-wrap',
        wordBreak: 'normal',
        overflowWrap: 'anywhere',
      });
  });
}

/** Real font metrics finish the conservative detached-layout estimate. */
export function fitRenderedText(root: HTMLElement) {
  const win = root.ownerDocument.defaultView;
  if (!win) return;
  coverLayers(root)
    .filter((el) => el.tagName !== 'IMG' && el.clientHeight > 0 && el.style.display !== 'none')
    .forEach((el) => {
      for (
        let i = 0;
        i < 80 && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        i++
      ) {
        const size = parseFloat(win.getComputedStyle(el).fontSize),
          base = parseFloat(win.getComputedStyle(root).fontSize);
        if (!(size > 2 && base > 0)) break;
        el.style.fontSize = `${(size * 0.96) / base}em`;
      }
    });
}

/** Percentage safe areas recompose images beside wide titles, above portrait titles. */
export function adaptiveLayout(root: HTMLElement, width: number, height: number, force = false) {
  const token = `mm-ratio-${Math.round((width / height) * 1000)}`;
  if (!force && root.classList.contains(token)) return;
  [...root.classList]
    .filter((c) => c.startsWith('mm-ratio-'))
    .forEach((c) => root.classList.remove(c));
  root.classList.add(token);
  const visible = coverLayers(root).filter((el) => el.style.display !== 'none');
  const images = visible.filter((el) => el.tagName === 'IMG'),
    texts = visible.filter((el) => el.tagName !== 'IMG' && el.textContent?.trim());
  const wide = width / height >= 1.35;
  const region = images.length
    ? wide
      ? { x: 6, y: 15, w: 48, h: 77 }
      : { x: 6, y: 51, w: 88, h: 41 }
    : { x: 6, y: 15, w: 88, h: 77 };
  const weight = (el: HTMLElement) => (el.classList.contains('mm-cover-title') ? 3 : 1);
  const total = texts.reduce((sum, el) => sum + weight(el), 0) || 1,
    gap = texts.length > 1 ? Math.min(3, 10 / texts.length) : 0;
  let y = region.y;
  texts.forEach((el) => {
    const h = ((region.h - gap * (texts.length - 1)) * weight(el)) / total;
    Object.assign(el.style, {
      left: `${region.x}%`,
      top: `${y}%`,
      width: `${region.w}%`,
      height: `${h}%`,
      transform: '',
      lineHeight: '1.2',
      padding: '.08em .14em',
      overflow: 'hidden',
    });
    const text = el.textContent || '',
      units = (s: string) =>
        [...s].reduce((n, c) => n + (/[^\u0000-\u00ff]/.test(c) ? 1 : 0.58), 0);
    const boxW = (width * region.w) / 100,
      boxH = (height * h) / 100;
    let px = Math.min(
      Math.min(width, height) * (weight(el) === 3 ? 0.12 : 0.045),
      Math.sqrt((boxW * boxH) / Math.max(1, units(text)) / 1.5)
    );
    const lines = () =>
      text
        .split('\n')
        .reduce(
          (n, line) =>
            n + Math.max(1, Math.ceil((units(line) * px) / Math.max(1, boxW - px * 0.28))),
          0
        );
    while (px > 2 && lines() * px * 1.2 + px * 0.16 > boxH) px *= 0.95;
    el.style.fontSize = `${px / (Math.min(width, height) / 22)}em`;
    y += h + gap;
  });
  const area = wide ? { x: 59, y: 15, w: 35, h: 77 } : { x: 6, y: 11, w: 88, h: 35 };
  const cols = Math.ceil(Math.sqrt(images.length)),
    rows = Math.ceil(images.length / Math.max(1, cols));
  images.forEach((el, i) =>
    Object.assign(el.style, {
      left: `${area.x + ((i % cols) * area.w) / cols}%`,
      top: `${area.y + (Math.floor(i / cols) * area.h) / rows}%`,
      width: `${area.w / cols - 1}%`,
      height: `${area.h / rows - 1}%`,
      transform: '',
      objectFit: el.style.objectFit || 'contain',
      borderRadius: '1%',
    })
  );
  visible
    .filter((el) => el.tagName !== 'IMG' && !el.textContent?.trim())
    .forEach((el) =>
      Object.assign(el.style, {
        left: '6%',
        top: '92%',
        width: '88%',
        height: '0%',
        padding: '0',
        fontSize: '.4em',
        transform: '',
      })
    );
}

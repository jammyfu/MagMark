import {
  adaptiveLayout,
  coverLayers,
  layerId,
  LAYER_SELECTOR,
  prepareCover,
  fitRenderedText,
} from './layer-layout';
type Selection = {
  kind: string;
  size: number;
  width: number;
  canUndo: boolean;
  canRedo: boolean;
  image: boolean;
  alignment: string;
  layers: { id: string; name: string; hidden: boolean; selected: boolean }[];
};
export function mountCoverTextEditor(
  doc: Document,
  options: {
    scale: () => number;
    changed: () => void;
    selected: (s: Selection) => void;
    dimensions: () => { width: number; height: number };
  }
) {
  const win = doc.defaultView!,
    root = doc.querySelector<HTMLElement>('.mm-cover')!;
  const abort = new win.AbortController(),
    undo: string[] = [],
    redo: string[] = [];
  let selected = coverLayers(root)[0] as HTMLElement | undefined,
    editing: HTMLElement | undefined,
    beforeEdit = '',
    composing = false;
  let gesture:
    | {
        id: number;
        x: number;
        y: number;
        left: number;
        top: number;
        width: number;
        height: number;
        font: number;
        kind: string;
        before: string;
      }
    | undefined;
  const chrome = doc.createElement('div');
  chrome.dataset.mmCoverEditor = 'true';
  chrome.style.cssText =
    'position:fixed;border:2px solid #1677ff;box-shadow:0 0 0 1px white;pointer-events:none;z-index:2147483640;box-sizing:border-box';
  for (const [kind, pos, label] of [
    ['scale', 'right:-6px;bottom:-6px', '缩放图层'],
    ['width', 'right:-6px;top:50%', '调整图层宽度'],
  ]) {
    const h = doc.createElement('button');
    h.dataset.action = kind;
    h.setAttribute('aria-label', label);
    h.style.cssText = `position:absolute;${pos};width:12px;height:12px;padding:0;background:white;border:2px solid #1677ff;pointer-events:auto;touch-action:none;cursor:${kind === 'scale' ? 'nwse' : 'ew'}-resize`;
    chrome.append(h);
  }
  doc.body.append(chrome);
  const snapshot = () => root.innerHTML;
  const bind = () =>
    coverLayers(root).forEach((el) => {
      el.tabIndex = 0;
      el.draggable = false;
      el.style.cursor = 'move';
      el.style.userSelect = 'none';
      el.style.touchAction = 'none';
      el.setAttribute('aria-label', el.tagName === 'IMG' ? '图片图层' : '封面文字，双击编辑');
    });
  const restore = (html: string) => {
    const id = selected && layerId(selected);
    root.innerHTML = html;
    bind();
    selected = coverLayers(root).find((el) => layerId(el) === id) || coverLayers(root)[0];
  };
  function refresh() {
    const r = selected?.getBoundingClientRect(),
      scale = Math.max(0.01, options.scale());
    Object.assign(chrome.style, {
      display: !r || editing || selected?.style.display === 'none' ? 'none' : 'block',
      left: `${r?.left || 0}px`,
      top: `${r?.top || 0}px`,
      width: `${r?.width || 0}px`,
      height: `${r?.height || 0}px`,
      borderWidth: `${1.5 / scale}px`,
    });
    chrome
      .querySelectorAll<HTMLElement>('button')
      .forEach((h) => (h.style.transform = `scale(${1 / scale})`));
    options.selected({
      kind: selected ? layerId(selected) : '',
      image: selected?.tagName === 'IMG',
      alignment: selected?.style.textAlign === 'justify' && selected.style.textAlignLast === 'justify' ? 'distributed' : selected ? (win.getComputedStyle(selected).textAlign || 'left').replace('start', 'left').replace('end', 'right') : 'left',
      size: selected ? Math.round(parseFloat(win.getComputedStyle(selected).fontSize) || 16) : 0,
      width: parseFloat(selected?.style.width || '0'),
      canUndo: !!undo.length,
      canRedo: !!redo.length,
      layers: coverLayers(root)
        .sort((a, b) => +b.style.zIndex - +a.style.zIndex)
        .map((el) => ({
          id: layerId(el),
          name:
            el.tagName === 'IMG'
              ? el.getAttribute('alt') || '图片'
              : el.textContent?.slice(0, 24) || '空文字',
          hidden: el.style.display === 'none',
          selected: el === selected,
        })),
    });
  }
  const commit = (before: string) => {
    if (before !== snapshot()) {
      undo.push(before);
      if (undo.length > 50) undo.shift();
      redo.length = 0;
      options.changed();
    }
    refresh();
  };
  const change = (fn: () => void) => {
    finishEdit();
    const before = snapshot();
    fn();
    bind();
    commit(before);
  };
  const fit = () => {
    const s = options.dimensions();
    adaptiveLayout(root, s.width, s.height, true);
    fitRenderedText(root);
  };
  function finishEdit(cancel = false) {
    if (!editing || composing) return;
    const emptyBox = parseFloat(editing.style.height) === 0;
    editing.textContent = editing.innerText ?? editing.textContent;
    editing.removeAttribute('contenteditable');
    editing = undefined;
    bind();
    if (cancel) restore(beforeEdit);
    else {
      if (emptyBox) fit();
      else fitRenderedText(root);
      commit(beforeEdit);
    }
    refresh();
  }
  function beginEdit() {
    if (!selected || selected.tagName === 'IMG' || editing) return;
    beforeEdit = snapshot();
    editing = selected;
    editing.contentEditable = 'plaintext-only';
    editing.style.userSelect = 'text';
    editing.style.cursor = 'text';
    editing.focus();
    refresh();
  }
  const font = (px: number) => {
    if (selected && selected.tagName !== 'IMG')
      selected.style.fontSize = `${Math.max(2, Math.min(600, px)) / (parseFloat(win.getComputedStyle(root).fontSize) || 16)}em`;
  };
  doc.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target as HTMLElement,
        handle = target.closest<HTMLElement>('[data-action]'),
        el = target.closest<HTMLElement>(LAYER_SELECTOR);
      if (e.button !== 0 || editing || (!el && !handle)) return;
      if (el) selected = el;
      if (!selected) return;
      e.preventDefault();
      gesture = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        left: parseFloat(selected.style.left) || 0,
        top: parseFloat(selected.style.top) || 0,
        width: parseFloat(selected.style.width) || 50,
        height: parseFloat(selected.style.height) || 20,
        font: parseFloat(win.getComputedStyle(selected).fontSize),
        kind: handle?.dataset.action || 'move',
        before: snapshot(),
      };
      target.setPointerCapture(e.pointerId);
      refresh();
    },
    { signal: abort.signal }
  );
  doc.addEventListener(
    'pointermove',
    (e) => {
      if (!gesture || !selected || gesture.id !== e.pointerId) return;
      const g = gesture,
        s = options.dimensions(),
        dx = ((e.clientX - g.x) / s.width) * 100,
        dy = ((e.clientY - g.y) / s.height) * 100;
      if (g.kind === 'move') {
        selected.style.left = `${Math.max(0, Math.min(100 - g.width, g.left + dx))}%`;
        selected.style.top = `${Math.max(0, Math.min(100 - g.height, g.top + dy))}%`;
      } else {
        const width = Math.max(2, Math.min(100 - g.left, g.width + dx));
        selected.style.width = `${width}%`;
        if (g.kind === 'scale') {
          const ratio = Math.min(width / g.width, (100 - g.top) / g.height);
          selected.style.width = `${g.width * ratio}%`;
          selected.style.height = `${g.height * ratio}%`;
          font(g.font * ratio);
        }
      }
      refresh();
    },
    { signal: abort.signal }
  );
  const end = (cancel = false) => {
    if (!gesture) return;
    const g = gesture;
    gesture = undefined;
    if (cancel) restore(g.before);
    else commit(g.before);
    refresh();
  };
  doc.addEventListener('pointerup', () => end(), { signal: abort.signal });
  doc.addEventListener('pointercancel', () => end(true), { signal: abort.signal });
  doc.addEventListener('lostpointercapture', () => end(), { signal: abort.signal });
  win.addEventListener('blur', () => end(), { signal: abort.signal });
  doc.addEventListener(
    'dblclick',
    (e) => {
      const el = (e.target as Element).closest<HTMLElement>(LAYER_SELECTOR);
      if (el) {
        selected = el;
        beginEdit();
      }
    },
    { signal: abort.signal }
  );
  doc.addEventListener(
    'focusin',
    (e) => {
      const el = (e.target as Element).closest<HTMLElement>(LAYER_SELECTOR);
      if (el) {
        selected = el;
        refresh();
      }
    },
    { signal: abort.signal }
  );
  doc.addEventListener('focusout', () => finishEdit(), { signal: abort.signal });
  doc.addEventListener('compositionstart', () => (composing = true), { signal: abort.signal });
  doc.addEventListener('compositionend', () => (composing = false), { signal: abort.signal });
  doc.addEventListener(
    'keydown',
    (e) => {
      if (e.isComposing) return;
      if (editing) {
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
          e.preventDefault();
          finishEdit(e.key === 'Escape');
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        beginEdit();
      }
      const arrows: Record<string, number[]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const direction = arrows[e.key];
      if (direction && selected) {
        e.preventDefault();
        change(() => {
          const s = options.dimensions(),
            step = e.shiftKey ? 10 : 1;
          selected!.style.left = `${Math.max(0, Math.min(100 - parseFloat(selected!.style.width), parseFloat(selected!.style.left) + ((direction[0] * step) / s.width) * 100))}%`;
          selected!.style.top = `${Math.max(0, Math.min(100 - parseFloat(selected!.style.height), parseFloat(selected!.style.top) + ((direction[1] * step) / s.height) * 100))}%`;
        });
      }
    },
    { signal: abort.signal }
  );
  bind();
  refresh();
  return {
    refresh,
    edit: beginEdit,
    select(kind: string) {
      finishEdit();
      selected =
        coverLayers(root).find(
          (el) => layerId(el) === kind || el.classList.contains(`mm-cover-${kind}`)
        ) || selected;
      refresh();
    },
    text(kind: string, value: string) {
      change(() => {
        let el = coverLayers(root).find((el) => el.classList.contains(`mm-cover-${kind}`));
        if (!el) {
          el = doc.createElement('p');
          el.className = `mm-cover-${kind}`;
          el.style.cssText = 'color:#172033;background-color:white';
          root.append(el);
          prepareCover(doc, root);
        }
        el.textContent = value;
        fit();
      });
    },
    size(px: number) {
      if (Number.isFinite(px)) change(() => font(px));
    },
    width(value: number) {
      if (Number.isFinite(value))
        change(() => {
          if (selected)
            selected.style.width = `${Math.max(2, Math.min(100 - parseFloat(selected.style.left), value))}%`;
        });
    },
    resetPosition() {
      change(fit);
    },
    layout() {
      change(fit);
    },
    addText() {
      change(() => {
        const el = doc.createElement('p');
        el.className = 'mm-cover-text';
        el.textContent = '双击编辑文字';
        el.style.cssText = 'color:#172033;background-color:white;font-weight:700;line-height:1.2';
        root.append(el);
        prepareCover(doc, root);
        selected = el;
        fit();
      });
    },
    addImage(src: string, name: string) {
      change(() => {
        const el = doc.createElement('img');
        el.className = 'mm-cover-image';
        el.src = src;
        el.alt = name;
        root.append(el);
        prepareCover(doc, root);
        selected = el;
        fit();
      });
    },
    action(action: string) {
      change(() => {
        if (!selected) return;
        if (action === 'delete') {
          selected.remove();
          selected = coverLayers(root)[0];
          return;
        }
        if (action === 'hide')
          selected.style.display = selected.style.display === 'none' ? 'block' : 'none';
        if (action === 'duplicate') {
          const copy = selected.cloneNode(true) as HTMLElement;
          copy.classList.remove(layerId(copy), 'mm-cover-title', 'mm-cover-subtitle');
          copy.style.zIndex = '';
          if (copy.tagName !== 'IMG') copy.classList.add('mm-cover-text');
          root.append(copy);
          prepareCover(doc, root);
          selected = copy;
          fit();
        }
        if (action === 'up' || action === 'down') {
          const layers = coverLayers(root).sort((a, b) => +a.style.zIndex - +b.style.zIndex),
            i = layers.indexOf(selected),
            j = i + (action === 'up' ? 1 : -1);
          if (layers[j]) [layers[i], layers[j]] = [layers[j], layers[i]];
          layers.forEach((el, n) => (el.style.zIndex = String(n + 2)));
        }
      });
    },
    align(value: string) {
      if (!['left', 'center', 'right', 'justify', 'distributed'].includes(value)) return;
      change(() => {
        if (!selected || selected.tagName === 'IMG') return;
        selected.style.textAlign = value === 'distributed' ? 'justify' : value;
        selected.style.textAlignLast = value === 'distributed' ? 'justify' : 'auto';
        selected.style.setProperty('text-justify', 'inter-character');
        fitRenderedText(root);
      });
    },
    style(
      property: 'color' | 'backgroundColor' | 'textAlign' | 'fontWeight' | 'objectFit',
      value: string
    ) {
      change(() => {
        if (selected) selected.style[property] = value;
      });
    },
    undo() {
      finishEdit();
      const state = undo.pop();
      if (state !== undefined) {
        redo.push(snapshot());
        restore(state);
        options.changed();
        refresh();
      }
    },
    redo() {
      finishEdit();
      const state = redo.pop();
      if (state !== undefined) {
        undo.push(snapshot());
        restore(state);
        options.changed();
        refresh();
      }
    },
    destroy() {
      abort.abort();
      chrome.remove();
    },
  };
}

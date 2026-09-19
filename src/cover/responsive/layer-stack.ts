import type { CoverDesign, Scope, Recipe } from './model';

/** Top-first, matching the Layers panel. The paper is a pinned substrate, not a movable layer. */
export const DEFAULT_ORDER = ['logo', 'subtitle', 'title', 'image'] as const;
export type Layer = typeof DEFAULT_ORDER[number];
export interface LayerMeta { name: string; hidden: boolean; locked: boolean; opacity: number }
export interface StackPatch { order?: Layer[]; layers?: Partial<Record<Layer, Partial<LayerMeta>>> }
export interface LayerStack { order: Layer[]; layers: Record<Layer, LayerMeta> }
const names: Record<Layer, string> = { title: '主标题', subtitle: '副标题', logo: 'MagMark Logo', image: '主图' };
export const isLayer = (value: unknown): value is Layer => DEFAULT_ORDER.includes(value as Layer);

export function layerStack(design: CoverDesign, id: string): LayerStack {
  const variant = design.variants[id];
  if (!variant) throw new Error('未知封面比例');
  const local = variant.stack;
  const layers = {} as Record<Layer, LayerMeta>;
  for (const layer of DEFAULT_ORDER) {
    layers[layer] = { name: names[layer], hidden: false, locked: false, opacity: 1,
      ...design.stack?.layers?.[layer],
      ...(variant.frames[layer]?.hidden !== undefined ? {hidden: variant.frames[layer]!.hidden} : {}),
      ...local?.layers?.[layer] };
  }
  return { order: [...(local?.order ?? design.stack?.order ?? DEFAULT_ORDER)], layers };
}

/** Store only changed fields so unrelated shared changes keep flowing into local variants. */
export function changeLayers(design: CoverDesign, id: string, scope: Scope, selected: Layer[], patch: Partial<LayerMeta>): CoverDesign {
  const previous = scope === 'all' ? design.stack : design.variants[id].stack;
  const checked = parseStack({layers: Object.fromEntries(selected.map(layer => [layer, patch]))});
  const layers = {...previous?.layers};
  const changed = selected.some(layer => Object.entries(checked.layers?.[layer] ?? {}).some(([key, value]) => layers[layer]?.[key as keyof LayerMeta] !== value));
  if (!changed) return design;
  for (const layer of selected) layers[layer] = {...layers[layer], ...checked.layers?.[layer]};
  return writeStack(design, id, scope, {...previous, layers});
}
function writeStack(design: CoverDesign, id: string, scope: Scope, stack: StackPatch): CoverDesign {
  if (!design.variants[id]) throw new Error('未知封面比例');
  return scope === 'all' ? {...design, stack} : {...design, variants: {...design.variants, [id]: {...design.variants[id], stack}}};
}

export function reorderLayers(design: CoverDesign, id: string, scope: Scope, selected: Layer[], target: Layer, side: 'before' | 'after'): CoverDesign {
  if (selected.includes(target) || !selected.length) return design;
  // A global order is based on the master, never silently promoted from a local override.
  const order = scope === 'all' ? [...(design.stack?.order ?? DEFAULT_ORDER)] : layerStack(design, id).order;
  const moving = order.filter(layer => selected.includes(layer));
  const rest = order.filter(layer => !selected.includes(layer));
  const at = rest.indexOf(target);
  if (at < 0) return design;
  rest.splice(at + (side === 'after' ? 1 : 0), 0, ...moving);
  if (rest.every((value, index) => value === order[index])) return design;
  const previous = scope === 'all' ? design.stack : design.variants[id].stack;
  return writeStack(design, id, scope, {...previous, order: rest});
}

/** Ctrl/Command toggles; Shift selects the inclusive range in current visual order. */
export function selectLayers(order: readonly Layer[], selected: readonly Layer[], anchor: Layer, hit: Layer, modifiers: {shift?: boolean; toggle?: boolean}): Layer[] {
  if (modifiers.shift) {
    const first = order.indexOf(anchor), last = order.indexOf(hit);
    return order.slice(Math.min(first, last), Math.max(first, last) + 1);
  }
  if (modifiers.toggle) return order.filter(layer => layer === hit ? !selected.includes(hit) : selected.includes(layer));
  return [hit];
}
export function resetLayer(design: CoverDesign, id: string, layer: Layer): CoverDesign {
  const variant = design.variants[id];
  if (!variant) throw new Error('未知封面比例');
  const frames = {...variant.frames}, content = {...variant.content};
  const owned: Record<Layer, Array<keyof Recipe>> = {
    title: ['title'], subtitle: ['subtitle'], logo: ['showLogo'], image: ['image', 'focalX', 'focalY'],
  };
  for (const key of owned[layer]) delete content[key];
  delete frames[layer];
  const layers = {...variant.stack?.layers}; delete layers[layer];
  return {...design, variants: {...design.variants, [id]: {...variant, content, frames,
    ...(variant.stack ? {stack: {...variant.stack, layers}} : {})}}};
}

const plain = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
/** Imported metadata is allowlisted; no dynamic HTML, URL, CSS or prototype merge. */
export function parseStack(value: unknown): StackPatch {
  if (!plain(value)) throw new Error('图层面板数据无效');
  const result: StackPatch = {};
  if (Object.hasOwn(value, 'order')) {
    const order = value.order;
    if (!Array.isArray(order) || order.length !== DEFAULT_ORDER.length || new Set(order).size !== DEFAULT_ORDER.length || !order.every(isLayer)) throw new Error('图层顺序无效');
    result.order = [...order];
  }
  if (Object.hasOwn(value, 'layers')) {
    if (!plain(value.layers)) throw new Error('图层属性无效');
    result.layers = {};
    for (const layer of DEFAULT_ORDER) {
      if (!Object.hasOwn(value.layers, layer)) continue;
      const source = value.layers[layer];
      if (!plain(source)) throw new Error('图层属性无效');
      const out: Partial<LayerMeta> = {};
      if (Object.hasOwn(source, 'name')) {
        if (typeof source.name !== 'string' || !source.name.trim() || source.name.length > 80 || /[\r\n\x00-\x1f]/.test(source.name)) throw new Error('图层名称应为 1–80 个字符');
        out.name = source.name.trim();
      }
      for (const key of ['hidden', 'locked'] as const) if (Object.hasOwn(source, key)) {
        if (typeof source[key] !== 'boolean') throw new Error('图层开关无效');
        out[key] = source[key];
      }
      if (Object.hasOwn(source, 'opacity')) {
        if (typeof source.opacity !== 'number' || !Number.isFinite(source.opacity) || source.opacity < 0 || source.opacity > 1) throw new Error('不透明度应在 0–100% 之间');
        out.opacity = source.opacity;
      }
      result.layers[layer] = out;
    }
  }
  return result;
}

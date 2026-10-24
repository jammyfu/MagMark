/** Transaction-backed page-break indicators and position-safe commands. */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

export interface PageBreakControlOptions {
  showVisualIndicators: boolean;
  /** Reserved for a future real drag implementation; indicators do not simulate dragging. */
  allowDragAdjust: boolean;
  previewMode: boolean;
}
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreakControls: {
      togglePageBreakIndicators: () => ReturnType;
      enablePreviewMode: () => ReturnType;
      disablePreviewMode: () => ReturnType;
      removeAllPageBreaks: () => ReturnType;
      insertPageBreakAt: (pos: number, type?: 'manual' | 'chapter' | 'section' | 'auto') => ReturnType;
    };
  }
}
interface ControlState { show: boolean; preview: boolean; decorations: DecorationSet }
const key = new PluginKey<ControlState>('pageBreakVisuals');
function build(doc: ProseMirrorNode, show: boolean, preview: boolean): ControlState {
  const decorations: Decoration[] = [];
  if (show && !preview) doc.descendants((node, pos) => {
    if (node.type.name !== 'pageBreak') return;
    decorations.push(Decoration.widget(pos, () => {
      const widget = document.createElement('div');
      widget.className = 'mm-page-break-widget';
      widget.setAttribute('aria-hidden', 'true');
      const line = () => { const el = document.createElement('div'); el.className = 'mm-page-break-line'; return el; };
      const label = document.createElement('span'); label.className = 'mm-page-break-text';
      label.textContent = node.attrs.type === 'chapter' ? 'Chapter Break' : 'Page Break';
      widget.append(line(), label, line());
      return widget;
    }, { side: -1, key: `pagebreak-${pos}-${node.attrs.type}` }));
  });
  return { show, preview, decorations: DecorationSet.create(doc, decorations) };
}

export const PageBreakControls = Extension.create<PageBreakControlOptions>({
  name: 'pageBreakControls',
  addOptions() { return { showVisualIndicators: true, allowDragAdjust: false, previewMode: false }; },
  addProseMirrorPlugins() {
    const options = this.options;
    return [new Plugin<ControlState>({
      key,
      state: {
        init: (_config, state) => build(state.doc, options.showVisualIndicators, options.previewMode),
        apply(tr, previous) {
          const change = tr.getMeta(key) as Partial<Pick<ControlState, 'show' | 'preview'>> | undefined;
          if (!tr.docChanged && !change) return previous;
          return build(tr.doc, change?.show ?? previous.show, change?.preview ?? previous.preview);
        },
      },
      props: { decorations: state => key.getState(state)?.decorations },
    })];
  },
  addCommands() {
    return {
      togglePageBreakIndicators: () => ({ state, tr, dispatch }) => {
        if (dispatch) tr.setMeta(key, { show: !key.getState(state)?.show });
        return true;
      },
      enablePreviewMode: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(key, { preview: true });
        return true;
      },
      disablePreviewMode: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(key, { preview: false });
        return true;
      },
      removeAllPageBreaks: () => ({ tr, dispatch }) => {
        const ranges: { from: number; to: number }[] = [];
        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'pageBreak') ranges.push({ from: pos, to: pos + node.nodeSize });
        });
        if (!ranges.length) return false;
        if (dispatch) for (const range of ranges.reverse()) tr.delete(range.from, range.to);
        return true;
      },
      insertPageBreakAt: (pos, type = 'manual') => ({ tr, dispatch, state }) => {
        if (!Number.isInteger(pos) || pos < 0 || pos > tr.doc.content.size) return false;
        if (!['manual', 'chapter', 'section', 'auto'].includes(type)) return false;
        const nodeType = state.schema.nodes.pageBreak;
        if (!nodeType) return false;
        const point = tr.doc.resolve(pos);
        if (!point.parent.canReplaceWith(point.index(), point.index(), nodeType)) return false;
        if (dispatch) tr.insert(pos, nodeType.create({ type }));
        return true;
      },
    };
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-P': () => this.editor.commands.togglePageBreakIndicators() };
  },
});
export default PageBreakControls;

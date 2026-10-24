/** Visual spacing by default; source normalization is an explicit undoable command. */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { closeHistory } from 'prosemirror-history';
import { addCJKSpacing as spaceProse } from '../../plugins/cjk-spacer';

export interface CJKSpacerOptions { enabled: boolean; showSpacingIndicator: boolean }
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cjkSpacers: {
      toggleCJKSpacing: () => ReturnType;
      addCJKSpacing: () => ReturnType;
    };
  }
}
const opaque = new Set(['codeBlock', 'code', 'inlineCode', 'math', 'inlineMath', 'mathInline']);

/** Join adjacent prose marks, retaining the PM coordinate of each UTF-16 unit. */
function spacingPositions(doc: ProseMirrorNode): number[] {
  const result: number[] = [];
  doc.descendants((block, blockPos) => {
    if (opaque.has(block.type.name)) return false;
    if (!block.isTextblock) return true;
    let text = ''; let positions: number[] = [];
    const flush = () => {
      const spaced = spaceProse(text);
      let sourceIndex = 0;
      for (let outputIndex = 0; outputIndex < spaced.length; outputIndex++) {
        if (spaced[outputIndex] === text[sourceIndex]) sourceIndex++;
        else if (spaced[outputIndex] === ' ' && positions[sourceIndex] !== undefined) result.push(positions[sourceIndex]);
      }
      text = ''; positions = [];
    };
    block.forEach((child, offset) => {
      if (!child.isText || child.marks.some(mark => opaque.has(mark.type.name) || mark.type.name === 'link')) {
        flush(); return;
      }
      const value = child.text ?? '';
      text += value;
      for (let i = 0; i < value.length; i++) positions.push(blockPos + 1 + offset + i);
    });
    flush(); return false;
  });
  return result;
}
interface SpacingState { enabled: boolean; decorations: DecorationSet }
const key = new PluginKey<SpacingState>('cjkSpacing');

export const CJKSpacers = Extension.create<CJKSpacerOptions>({
  name: 'cjkSpacers',
  addOptions() { return { enabled: true, showSpacingIndicator: false }; },
  addProseMirrorPlugins() {
    const options = this.options;
    const build = (doc: ProseMirrorNode, enabled: boolean): SpacingState => ({
      enabled,
      decorations: enabled && options.showSpacingIndicator
        ? DecorationSet.create(doc, spacingPositions(doc).map(pos => Decoration.widget(pos, () => {
          const span = document.createElement('span');
          span.className = 'mm-cjk-space-indicator';
          span.setAttribute('aria-hidden', 'true');
          span.style.cssText = 'display:inline-block;width:0;border-left:1px dotted currentColor;';
          return span;
        }, { key: `cjk-${pos}`, side: -1 }))) : DecorationSet.empty,
    });
    return [new Plugin<SpacingState>({
      key,
      state: {
        init: (_config, state) => build(state.doc, options.enabled),
        apply(tr, previous) {
          const change = tr.getMeta(key) as { enabled?: boolean } | undefined;
          if (!tr.docChanged && change?.enabled === undefined) return previous;
          return build(tr.doc, change?.enabled ?? previous.enabled);
        },
      },
      props: {
        decorations: state => key.getState(state)?.decorations,
        attributes: state => ({
          class: key.getState(state)?.enabled ? 'mm-cjk-spacing' : '',
          style: `text-autospace:${key.getState(state)?.enabled ? 'normal' : 'no-autospace'}`,
        }),
      },
    })];
  },
  addCommands() {
    return {
      toggleCJKSpacing: () => ({ state, tr, dispatch }) => {
        if (dispatch) tr.setMeta(key, { enabled: !key.getState(state)?.enabled });
        return true;
      },
      addCJKSpacing: () => ({ editor, tr, dispatch }) => {
        if (editor.view.composing) return false;
        const positions = spacingPositions(tr.doc);
        if (!positions.length) return false;
        if (dispatch) {
          closeHistory(tr);
          for (const pos of positions.reverse()) tr.insertText(' ', pos, pos);
        }
        return true;
      },
    };
  },
});
export default CJKSpacers;

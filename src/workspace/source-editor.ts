import { EditorState, Transaction } from '@codemirror/state';
import { EditorView, drawSelection, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, isolateHistory, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';

/** Small, source-preserving replacement for legacy whole-value assignments. */
export function changedRange(before: string, after: string) {
  let from = 0;
  while (from < before.length && from < after.length && before[from] === after[from]) from++;
  let to = before.length, end = after.length;
  while (to > from && end > from && before[to - 1] === after[end - 1]) { to--; end--; }
  return { from, to, insert: after.slice(from, end) };
}

export interface SourceEditorOptions { onFocus?: () => void; onSave?: () => void; report?: (message: string) => void; onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void }

/**
 * Per-element migration adapter. The existing renderer and image tools keep their
 * textarea contract; the visible editor owns transactions, selection and history.
 * No HTMLTextAreaElement prototype is changed. The native value stays synchronized
 * for file/clipboard handlers, and ordinary typing never rewrites the Markdown.
 */
export function mountSourceEditor(textarea: HTMLTextAreaElement, host: HTMLElement, options: SourceEditorOptions = {}) {
  const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!;
  const ownDescriptors = Object.getOwnPropertyDescriptors(textarea);
  const nativeSelection = textarea.setSelectionRange.bind(textarea);
  const wasHidden = textarea.hidden;
  let externalWrite = false;
  let view: EditorView;
  const syncNative = () => {
    valueDescriptor.set!.call(textarea, view.state.doc.toString());
    const selection = view.state.selection.main;
    nativeSelection(selection.from, selection.to, selection.anchor > selection.head ? 'backward' : 'forward');
  };
  view = new EditorView({
    parent: host,
    state: EditorState.create({ doc: textarea.value, extensions: [
      history(), drawSelection(), EditorView.lineWrapping,
      markdown(), syntaxHighlighting(defaultHighlightStyle),
      placeholder('从一个想法开始。'),
      EditorView.contentAttributes.of({ 'aria-label': 'Markdown 原文', spellcheck: 'false', autocapitalize: 'off' }),
      keymap.of([{ key: 'Mod-s', run: () => { options.onSave?.(); return true; } }, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of(update => {
        options.onHistoryChange?.(undoDepth(update.state) > 0, redoDepth(update.state) > 0);
        if (!update.docChanged && !update.selectionSet) return;
        syncNative();
        if (update.docChanged && !externalWrite) textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }),
      EditorView.domEventHandlers({ focus: () => { options.onFocus?.(); } }),
    ] }),
  });
  textarea.hidden = true;
  const replaceSource = (value: string) => {
    if (value === view.state.doc.toString()) return;
    if (view.composing) {
      options.report?.('请先完成当前输入，再修改图片或导入文章。');
      throw new Error('Source edits are not allowed during IME composition.');
    }
    externalWrite = true;
    try {
      view.dispatch({ changes: changedRange(view.state.doc.toString(), value),
        annotations: [Transaction.userEvent.of('input.external'), isolateHistory.of('full')] });
    } finally { externalWrite = false; }
  };
  Object.defineProperties(textarea, {
    value: { configurable: true, get: () => view.state.doc.toString(), set: (value: string) => replaceSource(String(value)) },
    focus: { configurable: true, value: () => { options.onFocus?.(); view.focus(); } },
    setSelectionRange: { configurable: true, value: (start: number, end: number, direction?: string) => {
      const length = view.state.doc.length;
      const to = Math.max(0, Math.min(length, end));
      const from = Math.max(0, Math.min(to, start));
      view.dispatch({ selection: direction === 'backward' ? { anchor: to, head: from } : { anchor: from, head: to }, scrollIntoView: true });
    } },
  });
  // Legacy page-navigation shortcuts must never consume CodeMirror cursor keys.
  const stopLegacyKeys = (event: KeyboardEvent) => event.stopPropagation();
  host.addEventListener('keydown', stopLegacyKeys);
  return {
    view,
    undo: () => { if (!view.composing) undo(view); },
    redo: () => { if (!view.composing) redo(view); },
    destroy() {
      syncNative(); view.destroy(); host.removeEventListener('keydown', stopLegacyKeys);
      for (const key of ['value', 'focus', 'setSelectionRange']) {
        if (ownDescriptors[key]) Object.defineProperty(textarea, key, ownDescriptors[key]);
        else Reflect.deleteProperty(textarea, key);
      }
      textarea.hidden = wasHidden;
    },
  };
}

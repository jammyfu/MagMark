/** Actual web entry: preserve renderer callbacks, upgrade the workspace around them. */
import './editor';
import { captureSavedImages, restoreSavedImages, imageSaveKey } from './editor';
import { mountDraftHistory } from './src/workspace/draft-history';
import { mountWorkspace } from './src/workspace/workspace';
import { mountSourceEditor } from './src/workspace/source-editor';
import { STARTER_MARKDOWN } from './src/workspace/starter';
import { mountPreviewEdit } from './src/workspace/preview-edit';
import { mountWorkspaceIcons } from './src/workspace/icons';

// Decoration only: retain existing controls, handlers and article markup.
mountWorkspaceIcons();
const input = document.getElementById('markdown-input') as HTMLTextAreaElement;
// Replace only the exact legacy first-run demo, never an imported/user document.
if (input.value.startsWith('# MagMark 1.6.0 🎨✨\n')) {
  input.value = STARTER_MARKDOWN;
  const theme = document.getElementById('ctrl-theme') as HTMLSelectElement;
  theme.value = 'modern-minimalist';
  theme.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
const workspace = mountWorkspace();
try {
  const undoButton = document.getElementById('btn-undo') as HTMLButtonElement;
  const redoButton = document.getElementById('btn-redo') as HTMLButtonElement;
  const sourceEditor = mountSourceEditor(input, document.getElementById('source-editor')!, {
    onFocus: workspace.showSource,
    onSave: () => document.getElementById('btn-save')!.click(),
    report: workspace.report,
    pasteMode: () => (document.getElementById('writing-paste-mode') as HTMLSelectElement).value as 'auto' | 'markdown' | 'plain',
    onHistoryChange: (canUndo, canRedo) => { undoButton.disabled = !canUndo; redoButton.disabled = !canRedo; },
  });
  undoButton.addEventListener('click', sourceEditor.undo);
  redoButton.addEventListener('click', sourceEditor.redo);
  const writingMode = document.getElementById('writing-mode') as HTMLSelectElement;
  let activeWritingMode: 'plain' | 'markdown' = 'markdown';
  writingMode.addEventListener('change', () => {
    const mode = writingMode.value as 'plain' | 'markdown';
    if (!sourceEditor.setWritingMode(mode)) { writingMode.value = activeWritingMode; return; }
    activeWritingMode = mode;
    document.getElementById('writing-hint')!.textContent = mode === 'plain'
      ? '直接输入段落即可；转换后的 Markdown 标记保留，可继续修改'
      : 'Word 标题、加粗、列表自动转换 · 可撤销';
  });
} catch (error) {
  // A usable textarea is preferable to a blank editor on unsupported runtimes.
  input.hidden = false;
  document.getElementById('source-editor')!.replaceChildren();
  workspace.report('增强编辑器未能加载，已保留基础 Markdown 编辑。');
  console.error('Source editor initialization failed', error);
}
workspace.refreshDocument();
mountPreviewEdit(document.getElementById('preview-area')!, input, workspace.report);
mountDraftHistory(input, { key: imageSaveKey, capture: captureSavedImages, restore: restoreSavedImages }, workspace.report);

/** Actual web entry: preserve renderer callbacks, upgrade the workspace around them. */
import './editor';
import { mountWorkspace } from './src/workspace/workspace';
import { mountSourceEditor } from './src/workspace/source-editor';
import { STARTER_MARKDOWN } from './src/workspace/starter';

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
  mountSourceEditor(input, document.getElementById('source-editor')!, {
    onFocus: workspace.showSource,
    onSave: () => document.getElementById('btn-save')!.click(),
    report: workspace.report,
  });
} catch (error) {
  // A usable textarea is preferable to a blank editor on unsupported runtimes.
  input.hidden = false;
  document.getElementById('source-editor')!.replaceChildren();
  workspace.report('增强编辑器未能加载，已保留基础 Markdown 编辑。');
  console.error('Source editor initialization failed', error);
}
workspace.refreshDocument();

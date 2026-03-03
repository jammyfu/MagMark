/**
 * MagMark 2.0 - CJK Spacer Extension for Tiptap
 * Automatic spacing between CJK and Latin characters in the editor
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// CJK Unicode ranges
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff]/u;
const LATIN_REGEX = /[a-zA-Z0-9]/;

/**
 * Check if character is CJK
 */
function isCJK(char: string): boolean {
  return CJK_REGEX.test(char);
}

/**
 * Check if character is Latin or number
 */
function isLatinOrNumber(char: string): boolean {
  return LATIN_REGEX.test(char);
}

/**
 * Check if spacing is needed between two characters
 */
function needsSpacing(left: string, right: string): boolean {
  if (!left || !right) return false;
  
  const leftIsCJK = isCJK(left);
  const rightIsCJK = isCJK(right);
  const leftIsLatin = isLatinOrNumber(left);
  const rightIsLatin = isLatinOrNumber(right);
  
  // CJK <-> Latin/Number: add space
  return (leftIsCJK && rightIsLatin) || (leftIsLatin && rightIsCJK);
}

/**
 * Add spacing to text
 */
function addSpacing(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const current = text[i];
    const next = text[i + 1];
    
    result += current;
    
    if (next && needsSpacing(current, next)) {
      if (current !== ' ' && next !== ' ') {
        result += ' ';
      }
    }
  }
  
  return result;
}

export interface CJKSpacerOptions {
  enabled: boolean;
  showSpacingIndicator: boolean;
}

export const CJKSpacers = Extension.create<CJKSpacerOptions>({
  name: 'cjkSpacers',
  
  addOptions() {
    return {
      enabled: true,
      showSpacingIndicator: false,
    };
  },
  
  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];
    
    if (!this.options.enabled) return plugins;
    
    // Plugin to add spacing indicators
    const spacingIndicatorPlugin = new Plugin({
      key: new PluginKey('cjkSpacingIndicator'),
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, set) {
          set = set.map(tr.mapping, tr.doc);
          
          if (!this.getMeta(tr)?.showIndicators) return set;
          
          const decorations: Decoration[] = [];
          
          tr.doc.descendants((node, pos) => {
            if (node.isText) {
              const text = node.text || '';
              for (let i = 0; i < text.length - 1; i++) {
                if (needsSpacing(text[i], text[i + 1])) {
                  decorations.push(
                    Decoration.inline(pos + i + 1, pos + i + 1, {
                      class: 'mm-cjk-space-indicator',
                    })
                  );
                }
              }
            }
          });
          
          return DecorationSet.create(tr.doc, decorations);
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });
    
    plugins.push(spacingIndicatorPlugin);
    
    // Input rule plugin for auto-spacing on type
    const autoSpacingPlugin = new Plugin({
      key: new PluginKey('cjkAutoSpacing'),
      appendTransaction(transactions, oldState, newState) {
        if (!transactions.some(tr => tr.docChanged)) return null;
        
        const tr = newState.tr;
        let modified = false;
        
        newState.doc.descendants((node, pos) => {
          if (node.isText) {
            const text = node.text || '';
            const spacedText = addSpacing(text);
            
            if (spacedText !== text) {
              tr.replaceWith(pos, pos + node.nodeSize, newState.schema.text(spacedText, node.marks));
              modified = true;
            }
          }
        });
        
        return modified ? tr : null;
      },
    });
    
    plugins.push(autoSpacingPlugin);
    
    return plugins;
  },
  
  addCommands() {
    return {
      toggleCJKSpacing: () => ({ editor }) => {
        this.options.enabled = !this.options.enabled;
        return true;
      },
      
      addCJKSpacing: () => ({ tr, dispatch, state }) => {
        if (!dispatch) return true;
        
        let modified = false;
        
        state.doc.descendants((node, pos) => {
          if (node.isText) {
            const text = node.text || '';
            const spacedText = addSpacing(text);
            
            if (spacedText !== text) {
              tr.replaceWith(pos, pos + node.nodeSize, state.schema.text(spacedText, node.marks));
              modified = true;
            }
          }
        });
        
        return modified;
      },
    };
  },
});

export default CJKSpacers;

/**
 * MagMark 2.0 - Page Break Controls Extension
 * Visual controls for managing page breaks in the editor
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface PageBreakControlOptions {
  showVisualIndicators: boolean;
  allowDragAdjust: boolean;
  previewMode: boolean;
}

export const PageBreakControls = Extension.create<PageBreakControlOptions>({
  name: 'pageBreakControls',
  
  addOptions() {
    return {
      showVisualIndicators: true,
      allowDragAdjust: true,
      previewMode: false,
    };
  },
  
  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];
    
    // Visual indicator plugin
    if (this.options.showVisualIndicators) {
      const visualPlugin = new Plugin({
        key: new PluginKey('pageBreakVisuals'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc);
            
            const decorations: Decoration[] = [];
            
            tr.doc.descendants((node, pos) => {
              if (node.type.name === 'pageBreak') {
                const widget = document.createElement('div');
                widget.className = 'mm-page-break-widget';
                widget.innerHTML = `
                  <div class="mm-page-break-line"></div>
                  <span class="mm-page-break-icon">↧</span>
                  <span class="mm-page-break-text">
                    ${node.attrs.type === 'chapter' ? 'Chapter Break' : 'Page Break'}
                  </span>
                  <div class="mm-page-break-line"></div>
                `;
                
                decorations.push(
                  Decoration.widget(pos, () => widget, {
                    side: -1,
                    key: `pagebreak-${pos}`,
                  })
                );
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
      
      plugins.push(visualPlugin);
    }
    
    // Drag handle plugin for adjusting page breaks
    if (this.options.allowDragAdjust) {
      const dragPlugin = new Plugin({
        key: new PluginKey('pageBreakDrag'),
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              const target = event.target as HTMLElement;
              if (target.closest('.mm-page-break-widget')) {
                // Handle drag start
                target.classList.add('mm-dragging');
                return true;
              }
              return false;
            },
            mouseup(view, event) {
              const target = event.target as HTMLElement;
              if (target.closest('.mm-page-break-widget')) {
                target.classList.remove('mm-dragging');
                return true;
              }
              return false;
            },
          },
        },
      });
      
      plugins.push(dragPlugin);
    }
    
    return plugins;
  },
  
  addCommands() {
    return {
      togglePageBreakIndicators: () => ({ editor }) => {
        this.options.showVisualIndicators = !this.options.showVisualIndicators;
        return true;
      },
      
      enablePreviewMode: () => ({ editor }) => {
        this.options.previewMode = true;
        this.options.showVisualIndicators = false;
        return true;
      },
      
      disablePreviewMode: () => ({ editor }) => {
        this.options.previewMode = false;
        this.options.showVisualIndicators = true;
        return true;
      },
      
      removeAllPageBreaks: () => ({ state, tr, dispatch }) => {
        if (!dispatch) return true;
        
        let deleted = false;
        
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'pageBreak') {
            tr.delete(pos, pos + node.nodeSize);
            deleted = true;
          }
        });
        
        return deleted;
      },
      
      insertPageBreakAt: (pos: number, type = 'manual') => ({ tr, dispatch, state }) => {
        if (!dispatch) return true;
        
        const pageBreakNode = state.schema.nodes.pageBreak?.create({ type });
        if (pageBreakNode) {
          tr.insert(pos, pageBreakNode);
          return true;
        }
        return false;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-P': () => this.editor.commands.togglePageBreakIndicators(),
    };
  },
});

export default PageBreakControls;

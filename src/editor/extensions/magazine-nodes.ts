/**
 * MagMark 2.0 - Magazine Nodes Extension for Tiptap/ProseMirror
 * Custom nodes for magazine-quality editing
 */
import { Extension, Node } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/**
 * Full Bleed Image Node
 * Image that spans the entire page width
 */
export const FullBleedImage = Node.create({
  name: 'fullBleedImage',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      credit: {
        default: null,
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'figure[data-full-bleed]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, credit } = HTMLAttributes;
    
    return [
      'figure',
      { 
        'data-full-bleed': 'true',
        class: 'mm-figure mm-figure--full-bleed'
      },
      ['img', { src, alt, class: 'mm-image mm-image--full-bleed' }],
      caption && ['figcaption', { class: 'mm-caption' }, caption],
      credit && ['cite', { class: 'mm-credit' }, credit],
    ].filter(Boolean);
  },
  
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('figure');
      dom.className = 'mm-figure mm-figure--full-bleed';
      dom.setAttribute('data-full-bleed', 'true');
      
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.className = 'mm-image mm-image--full-bleed';
      
      dom.appendChild(img);
      
      if (node.attrs.caption) {
        const figcaption = document.createElement('figcaption');
        figcaption.className = 'mm-caption';
        figcaption.textContent = node.attrs.caption;
        dom.appendChild(figcaption);
      }
      
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          return true;
        }
      };
    };
  }
});

/**
 * Pull Quote Node
 * Sidebar-style blockquote with attribution
 */
export const PullQuote = Node.create({
  name: 'pullQuote',
  
  group: 'block',
  
  content: 'text*',
  
  addAttributes() {
    return {
      attribution: {
        default: null,
      },
      position: {
        default: 'left', // left, right, full
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'blockquote[data-pull-quote]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { attribution, position } = HTMLAttributes;
    
    return [
      'blockquote',
      {
        'data-pull-quote': 'true',
        class: `mm-pull-quote mm-pull-quote--${position}`,
      },
      ['div', { class: 'mm-pull-quote__content' }, 0],
      attribution && ['cite', { class: 'mm-pull-quote__attribution' }, attribution],
    ].filter(Boolean);
  }
});

/**
 * Grid Container Node
 * Multi-column layout wrapper
 */
export const GridContainer = Node.create({
  name: 'gridContainer',
  
  group: 'block',
  
  content: 'block+',
  
  addAttributes() {
    return {
      columns: {
        default: 2,
      },
      gap: {
        default: '24px',
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-grid-container]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { columns, gap } = HTMLAttributes;
    
    return [
      'div',
      {
        'data-grid-container': 'true',
        class: 'mm-grid-container',
        style: `grid-template-columns: repeat(${columns}, 1fr); gap: ${gap};`,
      },
      0,
    ];
  }
});

/**
 * Page Break Node
 * Forced page break in document
 */
export const PageBreak = Node.create({
  name: 'pageBreak',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      type: {
        default: 'manual', // manual, chapter, section
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-page-break]',
      },
      {
        tag: 'hr',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { type } = HTMLAttributes;
    
    return [
      'span',
      {
        'data-page-break': 'true',
        'data-break-type': type,
        class: `mm-page-break mm-page-break--${type}`,
      },
    ];
  },
  
  addNodeView() {
    return () => {
      const dom = document.createElement('div');
      dom.className = 'mm-page-break-visual';
      dom.innerHTML = `
        <span class="mm-page-break-line"></span>
        <span class="mm-page-break-label">Page Break</span>
        <span class="mm-page-break-line"></span>
      `;
      
      return {
        dom,
      };
    };
  }
});

/**
 * Caption Node
 * Figure/image caption
 */
export const Caption = Node.create({
  name: 'caption',
  
  group: 'block',
  
  content: 'inline*',
  
  addAttributes() {
    return {
      align: {
        default: 'left', // left, center, right
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'figcaption',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { align } = HTMLAttributes;
    
    return [
      'figcaption',
      {
        class: `mm-caption mm-caption--${align}`,
      },
      0,
    ];
  }
});

/**
 * Magazine Nodes Extension Collection
 */
export const MagazineNodes = Extension.create({
  name: 'magazineNodes',
  
  addExtensions() {
    return [
      FullBleedImage,
      PullQuote,
      GridContainer,
      PageBreak,
      Caption,
    ];
  },
  
  addProseMirrorPlugins() {
    const plugins = [];
    
    // Plugin to detect "---" and convert to page-break node
    const pageBreakPlugin = new Plugin({
      key: new PluginKey('autoPageBreak'),
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, set) {
          set = set.map(tr.mapping, tr.doc);
          
          // Find horizontal rule decorations
          const decorations = [];
          tr.doc.descendants((node, pos) => {
            if (node.type.name === 'horizontalRule') {
              decorations.push(
                Decoration.widget(pos, () => {
                  const span = document.createElement('span');
                  span.className = 'mm-page-break-indicator';
                  span.textContent = 'Page Break';
                  return span;
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
    
    plugins.push(pageBreakPlugin);
    
    // Plugin to apply baseline grid snapping
    const baselineGridPlugin = new Plugin({
      key: new PluginKey('baselineGrid'),
      props: {
        attributes: {
          class: 'mm-baseline-grid',
        },
      },
    });
    
    plugins.push(baselineGridPlugin);
    
    return plugins;
  },
  
  addCommands() {
    return {
      insertPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: 'pageBreak',
          attrs: { type: 'manual' }
        });
      },
      
      insertChapterBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: 'pageBreak',
          attrs: { type: 'chapter' }
        });
      },
      
      insertFullBleedImage: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: 'fullBleedImage',
          attrs,
        });
      },
      
      insertPullQuote: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: 'pullQuote',
          attrs: { position: 'left', ...attrs },
        });
      },
      
      insertGridContainer: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: 'gridContainer',
          attrs: { columns: 2, ...attrs },
          content: [
            { type: 'paragraph' },
            { type: 'paragraph' },
          ],
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertPageBreak(),
      'Mod-Shift-Enter': () => this.editor.commands.insertChapterBreak(),
    };
  }
});

export default MagazineNodes;

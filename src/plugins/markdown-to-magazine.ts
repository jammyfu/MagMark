/**
 * MagMark 2.0 - Markdown to Magazine Transformer
 * Core Remark plugin for AST transformation
 */
import { visit } from 'unist-util-visit';
import { u } from 'unist-builder';

/**
 * Configuration options for markdown-to-magazine transformation
 */
export interface MagazineTransformOptions {
  /** Enable automatic CJK spacing */
  autoSpaceCjk?: boolean;
  /** Enable widows/orphans prevention */
  preventWidows?: boolean;
  /** Enable full-bleed images */
  fullBleedImages?: boolean;
  /** Custom class prefix */
  classPrefix?: string;
  /** Platform target for optimization */
  platform?: 'xiaohongshu' | 'wechat' | 'pdf' | 'web';
}

const defaultOptions: MagazineTransformOptions = {
  autoSpaceCjk: true,
  preventWidows: true,
  fullBleedImages: true,
  classPrefix: 'mm-',
  platform: 'web',
};

/**
 * Main transformer plugin for Remark
 * Converts standard markdown AST to magazine-ready AST
 */
export function markdownToMagazine(options: MagazineTransformOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const { classPrefix } = opts;

  return async (tree, file) => {
    // Transform 1: Add magazine classes to paragraphs
    visit(tree, 'paragraph', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = `${classPrefix}paragraph`;
    });

    // Transform 2: Style headings with hierarchy and widows control
    visit(tree, ['heading'], (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      const tag = `h${node.depth}`;
      node.data.hProperties.class = `${classPrefix}heading ${classPrefix}${tag}`;
      
      // Add widows/orphans prevention attributes
      if (opts.preventWidows) {
        node.data.hProperties.style = node.data.hProperties.style || '';
        node.data.hProperties.style += ' orphans: 2; widows: 2;';
      }
    });

    // Transform 3: Transform images with full-bleed support
    visit(tree, 'image', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      
      // Check for full-bleed marker in alt text
      const isFullBleed = node.alt?.includes('!full') || opts.fullBleedImages;
      const altText = node.alt?.replace('!full', '').trim() || '';
      
      node.data.hProperties.class = isFullBleed 
        ? `${classPrefix}image ${classPrefix}image--full-bleed`
        : `${classPrefix}image`;
      node.data.hProperties.alt = altText;
      
      // Wrap in figure if caption exists
      if (altText) {
        const figure = u('element', {
          tagName: 'figure',
          properties: { class: `${classPrefix}figure` }
        }, [
          u('element', {
            tagName: 'img',
            properties: {
              src: node.url,
              alt: altText,
              class: isFullBleed 
                ? `${classPrefix}image ${classPrefix}image--full-bleed`
                : `${classPrefix}image`,
              loading: 'lazy'
            }
          }),
          u('element', {
            tagName: 'figcaption',
            properties: { class: `${classPrefix}caption` }
          }, [u('text', altText)])
        ]);
        
        // Replace the image node with figure
        Object.assign(node, figure);
      }
    });

    // Transform 4: Style blockquotes as pull quotes
    visit(tree, 'blockquote', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = `${classPrefix}pull-quote`;
    });

    // Transform 5: Handle code blocks with syntax highlighting
    visit(tree, 'code', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = `${classPrefix}code-block`;
      if (node.lang) {
        node.data.hProperties['data-language'] = node.lang;
      }
    });

    // Transform 6: Style lists with proper indentation
    visit(tree, ['list', 'listItem'], (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      const type = node.type === 'list' 
        ? (node.ordered ? 'ol' : 'ul')
        : 'li';
      node.data.hProperties.class = `${classPrefix}list ${classPrefix}list--${type}`;
    });

    // Transform 7: Detect and mark page breaks
    visit(tree, 'thematicBreak', (node, index, parent) => {
      // Convert horizontal rules to page breaks
      const pageBreak = u('element', {
        tagName: 'span',
        properties: { class: `${classPrefix}page-break` }
      });
      
      parent.children[index] = pageBreak;
    });

    // Transform 8: Handle inline code
    visit(tree, 'inlineCode', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = `${classPrefix}code-inline`;
    });

    // Transform 9: Style emphasis and strong
    visit(tree, ['emphasis', 'strong'], (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      const type = node.type === 'emphasis' ? 'em' : 'strong';
      node.data.hProperties.class = `${classPrefix}${type}`;
    });

    // Transform 10: Handle links
    visit(tree, 'link', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = `${classPrefix}link`;
    });

    return tree;
  };
}

/**
 * Create a custom node for full-bleed images
 */
export function createFullBleedImage(src, alt, caption) {
  return u('element', {
    tagName: 'figure',
    properties: { class: 'mm-figure mm-figure--full-bleed' }
  }, [
    u('element', {
      tagName: 'img',
      properties: {
        src,
        alt,
        class: 'mm-image mm-image--full-bleed',
        loading: 'eager'
      }
    }),
    caption && u('element', {
      tagName: 'figcaption',
      properties: { class: 'mm-caption' }
    }, [u('text', caption)])
  ].filter(Boolean));
}

/**
 * Create a custom node for pull quotes
 */
export function createPullQuote(text, attribution) {
  const children = [u('element', {
    tagName: 'p',
    properties: { class: 'mm-pull-quote__text' }
  }, [u('text', text)])];
  
  if (attribution) {
    children.push(u('element', {
      tagName: 'cite',
      properties: { class: 'mm-pull-quote__attribution' }
    }, [u('text', attribution)]));
  }
  
  return u('element', {
    tagName: 'blockquote',
    properties: { class: 'mm-pull-quote' }
  }, children);
}

/**
 * Create a custom node for page breaks
 */
export function createPageBreak() {
  return u('element', {
    tagName: 'span',
    properties: { 
      class: 'mm-page-break',
      'data-page-break': 'true'
    }
  });
}

/**
 * Create a grid container for multi-column layouts
 */
export function createGridContainer(children, columns = 2) {
  return u('element', {
    tagName: 'div',
    properties: { 
      class: 'mm-grid-container',
      'data-columns': String(columns),
      style: `grid-template-columns: repeat(${columns}, 1fr);`
    }
  }, children);
}

export default markdownToMagazine;

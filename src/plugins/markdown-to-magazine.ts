/** Decorate mdast through remark-rehype metadata, never splice hast into mdast. */
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Element, ElementContent } from 'hast';
import { addClasses, addStyle, element, htmlData, properties } from './node-properties';

export interface MagazineTransformOptions {
  autoSpaceCjk?: boolean;
  preventWidows?: boolean;
  fullBleedImages?: boolean;
  classPrefix?: string;
  platform?: 'xiaohongshu' | 'wechat' | 'pdf' | 'web';
}

export function markdownToMagazine(options: MagazineTransformOptions = {}) {
  const prefix = options.classPrefix ?? 'mm-';
  return (tree: Root): Root => {
    visit(tree, 'paragraph', node => {
      addClasses(node, `${prefix}paragraph`);
      const image = node.children.length === 1 ? node.children[0] : undefined;
      if (image?.type !== 'image') return;
      const caption = (image.alt ?? '').replace('!full', '').trim();
      if (!caption) return;
      const full = options.fullBleedImages !== false || (image.alt ?? '').includes('!full');
      const data = htmlData(node);
      data.hName = 'figure';
      addClasses(node, `${prefix}figure`);
      data.hChildren = [
        element('img', { src: image.url, alt: caption,
          ...(image.title ? { title: image.title } : {}),
          className: [`${prefix}image`, ...(full ? [`${prefix}image--full-bleed`] : [])], loading: 'lazy' }),
        element('figcaption', { className: [`${prefix}caption`] }, [{ type: 'text', value: caption }]),
      ];
    });
    visit(tree, 'heading', node => {
      addClasses(node, `${prefix}heading`, `${prefix}h${node.depth}`);
      if (options.preventWidows !== false) addStyle(node, 'orphans: 2; widows: 2;');
    });
    visit(tree, 'image', node => {
      const full = options.fullBleedImages !== false || (node.alt ?? '').includes('!full');
      addClasses(node, `${prefix}image`, ...(full ? [`${prefix}image--full-bleed`] : []));
      properties(node).alt = (node.alt ?? '').replace('!full', '').trim();
    });
    visit(tree, 'blockquote', node => addClasses(node, `${prefix}pull-quote`));
    visit(tree, 'code', node => {
      addClasses(node, `${prefix}code-block`);
      if (node.lang) properties(node)['data-language'] = node.lang;
    });
    visit(tree, 'list', node => addClasses(node, `${prefix}list`, `${prefix}list--${node.ordered ? 'ol' : 'ul'}`));
    visit(tree, 'listItem', node => addClasses(node, `${prefix}list`, `${prefix}list--li`));
    visit(tree, 'inlineCode', node => addClasses(node, `${prefix}code-inline`));
    visit(tree, 'emphasis', node => addClasses(node, `${prefix}em`));
    visit(tree, 'strong', node => addClasses(node, `${prefix}strong`));
    visit(tree, 'link', node => addClasses(node, `${prefix}link`));
    return tree;
  };
}

/** Standalone helpers return hast for HTML consumers, not Markdown AST children. */
export function createFullBleedImage(src: string, alt: string, caption = ''): Element {
  return element('figure', { className: ['mm-figure', 'mm-figure--full-bleed'] }, [
    element('img', { src, alt, className: ['mm-image', 'mm-image--full-bleed'], loading: 'eager' }),
    ...(caption ? [element('figcaption', { className: ['mm-caption'] }, [{ type: 'text', value: caption }])] : []),
  ]);
}
export function createPullQuote(text: string, attribution = ''): Element {
  return element('blockquote', { className: ['mm-pull-quote'] }, [
    element('p', { className: ['mm-pull-quote__text'] }, [{ type: 'text', value: text }]),
    ...(attribution ? [element('cite', { className: ['mm-pull-quote__attribution'] }, [{ type: 'text', value: attribution }])] : []),
  ]);
}
export function createPageBreak(): Element {
  return element('span', { className: ['mm-page-break'], 'data-page-break': 'true' });
}
export function createGridContainer(children: ElementContent[], columns = 2): Element {
  if (!Number.isInteger(columns) || columns < 1 || columns > 24) throw new RangeError('Grid columns must be an integer from 1 to 24');
  return element('div', { className: ['mm-grid-container'], 'data-columns': String(columns),
    style: `grid-template-columns: repeat(${columns}, 1fr);` }, children);
}
export default markdownToMagazine;

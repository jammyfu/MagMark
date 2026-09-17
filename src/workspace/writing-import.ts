import type { RootContent, Element } from 'hast';
import { parseInertHtml, serializeInertHtml } from '../security/inert-html';
import { sanitizeArticleHtml } from '../security/article-html';

export type PasteMode = 'auto' | 'markdown' | 'plain';
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/([`*_[\]<>#])/g, '\\$1');
const textOf = (node: RootContent): string => node.type === 'text' ? node.value : node.type === 'element' ? node.children.map(textOf).join('') : '';

/** Parse clipboard HTML inertly: never mount Word markup or load its resources. */
export function richTextToMarkdown(html: string): { text: string; warnings: string[] } {
  const warnings = new Set<string>();
  const wordTree = parseInertHtml(html);
  const retainWordStructure = (node: RootContent) => {
    if (node.type !== 'element') return;
    const classes = String(node.properties.className || '').toLowerCase();
    const style = String(node.properties.style || '');
    if (node.tagName === 'p' && /mso(?:title|heading)/.test(classes)) {
      node.tagName = 'h' + (Number(classes.match(/heading\s*([1-6])/)?.[1]) || 1);
    } else if (node.tagName === 'p' && (/msolistparagraph/.test(classes) || /mso-list\s*:/i.test(style))) {
      node.properties.className = ['mm-import-word-list'];
    }
    node.children.forEach(retainWordStructure);
  };
  wordTree.children.forEach(retainWordStructure);
  const tree = parseInertHtml(sanitizeArticleHtml(serializeInertHtml(wordTree)));
  function render(node: RootContent, depth = 0): string {
    if (node.type === 'text') return escapeText(node.value.replace(/\s+/g, ' '));
    if (node.type !== 'element') return '';
    const tag = node.tagName;
    const content = () => node.children.map(child => render(child, depth)).join('');
    const classes = String(node.properties.className || '').toLowerCase();
    const style = String(node.properties.style || '');
    if (tag === 'table') {
      warnings.add('表格保留为安全 HTML，以兼容合并单元格。');
      return '\n\n' + serializeInertHtml(node) + '\n\n';
    }
    if (tag === 'img') {
      const src = String(node.properties.src || '');
      const alt = escapeText(String(node.properties.alt || '图片'));
      if (!/^(https?:|data:image\/(?:png|jpeg|gif|webp);|mm-img:)/i.test(src)) {
        warnings.add('部分图片没有可用地址，请通过图片工具重新插入或关联目录。');
        return `[${alt}：请重新插入图片]`;
      }
      return `![${alt}](<${src.replace(/[<>\s]/g, c => encodeURIComponent(c))}>)`;
    }
    if (tag === 'pre') {
      const value = textOf(node).replace(/\n$/, '');
      const fence = '`'.repeat(Math.max(3, ...[...value.matchAll(/`+/g)].map(m => m[0].length + 1)));
      return `\n\n${fence}\n${value}\n${fence}\n\n`;
    }
    if (tag === 'code') {
      const value = textOf(node);
      const fence = '`'.repeat(Math.max(1, ...[...value.matchAll(/`+/g)].map(m => m[0].length + 1)));
      return `${fence} ${value} ${fence}`;
    }
    if (tag === 'ul' || tag === 'ol') {
      let index = Number(node.properties.start) || 1;
      return '\n' + node.children.filter((child): child is Element => child.type === 'element' && child.tagName === 'li').map(li => {
        const value = li.children.map(child => render(child, depth + 1)).join('').trim();
        const marker = tag === 'ol' ? `${index++}. ` : '- ';
        return marker + value.replace(/\n/g, '\n' + ' '.repeat(marker.length));
      }).join('\n') + '\n\n';
    }
    if (tag === 'br') return '  \n';
    if (tag === 'hr') return '\n\n---\n\n';
    if (tag === 'a') {
      const href = String(node.properties.href || '');
      return href ? `[${content().trim()}](<${href.replace(/[<>\s]/g, c => encodeURIComponent(c))}>)` : content();
    }
    if (tag === 'blockquote') return '\n\n' + content().trim().split('\n').map(line => '> ' + line).join('\n') + '\n\n';
    let value = content();
    if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag[1]))} ${value.trim()}\n\n`;
    if (tag === 'p' && /mm-import-word-list/.test(classes)) {
      const number = textOf(node).trim().match(/^(\d+)[.)、]\s*/)?.[1];
      value = value.trim().replace(/^(?:[•·●○▪\uf0b7]|\d+[.)、])\s*/, '');
      return `\n${number ? number + '.' : '-'} ${value}\n`;
    }
    const wrap = (marker: string) => value.trim() ? value.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, before, body, after) => `${before}${marker}${body}${marker}${after}`) : value;
    if (tag === 'strong' || tag === 'b' || /font-weight\s*:\s*(?:bold|[6-9]00)/i.test(style)) value = wrap('**');
    if (tag === 'em' || tag === 'i' || /font-style\s*:\s*italic/i.test(style)) value = wrap('*');
    if (['p', 'div', 'section', 'article', 'figure', 'figcaption'].includes(tag)) return `\n\n${value.trim()}\n\n`;
    return value;
  }
  return { text: tree.children.map(node => render(node)).join('').replace(/\n[ \t]+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim(), warnings: [...warnings] };
}

export function importClipboard(text: string, html: string, mode: PasteMode) {
  if (mode === 'plain') return { text, kind: '纯文本', warnings: [] as string[] };
  const markdown = /^(?:#{1,6}\s|```|~~~|>\s|[-*+]\s|\d+\.\s)|\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*/m.test(text);
  const word = /(?:class=["']?Mso|mso-|urn:schemas-microsoft-com:office)/i.test(html);
  if (mode === 'markdown' || !html || (markdown && !word)) return { text, kind: 'Markdown / 文本', warnings: [] as string[] };
  const converted = richTextToMarkdown(html);
  return { text: converted.text || text, kind: word ? 'Word → Markdown' : '富文本 → Markdown', warnings: converted.warnings };
}

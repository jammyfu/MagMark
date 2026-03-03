/**
 * MagMark 2.0 - Typography Enhancers Plugin
 * Advanced typography features: widows/orphans, hanging punctuation, 
 * smart quotes, and optical alignment
 */
import { visit } from 'unist-util-visit';
import { u } from 'unist-builder';

/**
 * Typography enhancement options
 */
export interface TypographyOptions {
  /** Prevent single words on last line (widows) */
  preventWidows?: boolean;
  /** Prevent single words on first line (orphans) */
  preventOrphans?: boolean;
  /** Minimum words to keep together at end of paragraph */
  widowMinWords?: number;
  /** Enable hanging punctuation */
  hangingPunctuation?: boolean;
  /** Enable smart quotes conversion */
  smartQuotes?: boolean;
  /** Enable optical margin alignment */
  opticalAlignment?: boolean;
  /** Font size for small caps calculation */
  baseFontSize?: number;
}

const defaultOptions = {
  preventWidows: true,
  preventOrphans: true,
  widowMinWords: 2,
  hangingPunctuation: true,
  smartQuotes: true,
  opticalAlignment: true,
  baseFontSize: 16
};

// Smart quote mappings
const SMART_QUOTES = {
  '"': { opening: '"', closing: '"' },
  "'": { opening: "‘", closing: "’" },
  '<<': '«',
  '>>': '»',
  '<': '‹',
  '>': '›'
};

// Hanging punctuation characters
const HANGING_PUNCTUATION = ['"', '"', "‘", "’", '(', '[', '{', '«', '‹'];
const END_PUNCTUATION = ['.', ',', '!', '?', ':', ';', '"', '"', "‘", "’", ')', ']', '}', '»', '›'];

/**
 * Detect if quote is opening or closing
 */
function isOpeningQuote(text, position) {
  const prevChar = text[position - 1];
  return !prevChar || /\s/.test(prevChar);
}

/**
 * Convert straight quotes to smart quotes
 */
function convertToSmartQuotes(text) {
  if (!text || typeof text !== 'string') return text;

  let result = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = text[i - 1];
    const nextChar = text[i + 1];

    if (char === '"') {
      // Check context for double quote
      const isOpening = !prevChar || /\s/.test(prevChar) || /[\(\[\{]/.test(prevChar);
      result += isOpening ? '"' : '"';
      inDoubleQuote = isOpening;
    } else if (char === "'") {
      // Check context for single quote/apostrophe
      if (prevChar && /[a-zA-Z]/.test(prevChar) && nextChar && /[a-zA-Z]/.test(nextChar)) {
        // Apostrophe in contraction
        result += "’";
      } else {
        const isOpening = !prevChar || /\s/.test(prevChar) || /[\(\[\{]/.test(prevChar);
        result += isOpening ? "‘" : "’";
      }
    } else if (char === '---') {
      result += '—'; // Em dash
    } else if (char === '--') {
      result += '–'; // En dash
    } else if (char === '...') {
      result += '…'; // Ellipsis
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Add non-breaking spaces to prevent widows
 * Adds &nbsp; between the last N words of a paragraph
 */
function preventWidows(text, minWords = 2) {
  if (!text || typeof text !== 'string') return text;

  const words = text.split(' ');
  if (words.length <= minWords) return text;

  // Join the last N words with non-breaking spaces
  const beforeWidow = words.slice(0, -minWords).join(' ');
  const widowWords = words.slice(-minWords).join('\u00A0'); // &nbsp;

  return `${beforeWidow} ${widowWords}`;
}

/**
 * Add zero-width spaces for better line breaking in CJK
 */
function addCJKBreakOpportunities(text) {
  if (!text || typeof text !== 'string') return text;

  // Insert zero-width space after CJK punctuation for better breaks
  return text.replace(/([，。！？、；：])((?![\n\r]))/g, '$1\u200B');
}

/**
 * Wrap punctuation for hanging punctuation effect
 */
function wrapHangingPunctuation(text) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Wrap opening punctuation
  HANGING_PUNCTUATION.forEach(char => {
    const regex = new RegExp(`(^|\\s)(${escapeRegex(char)})`, 'g');
    result = result.replace(regex, `$1<span class="mm-hanging-punctuation" data-punctuation="${char}">$2</span>`);
  });

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate optimal line breaks using Knuth-Plass algorithm (simplified)
 */
function optimizeLineBreaks(text, maxLineLength = 65) {
  if (!text || typeof text !== 'string') return text;

  // Simple implementation: prefer breaking at spaces near the target length
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxLineLength && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

/**
 * Main typography enhancers plugin
 */
export function typographyEnhancers(options = {}) {
  const opts = { ...defaultOptions, ...options };

  return async (tree, file) => {
    // Process paragraphs
    visit(tree, 'paragraph', (node) => {
      if (!node.children) return;

      // Process each text child
      node.children.forEach((child) => {
        if (child.type === 'text' && child.value) {
          let text = child.value;

          // Smart quotes
          if (opts.smartQuotes) {
            text = convertToSmartQuotes(text);
          }

          // CJK break opportunities
          text = addCJKBreakOpportunities(text);

          child.value = text;
        }
      });

      // Add typography classes
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      const classes = ['mm-paragraph'];

      if (opts.preventWidows) {
        classes.push('mm-no-widows');
      }
      if (opts.preventOrphans) {
        classes.push('mm-no-orphans');
      }
      if (opts.hangingPunctuation) {
        classes.push('mm-hanging-punctuation');
      }

      node.data.hProperties.class = classes.join(' ');

      // Add CSS custom properties
      node.data.hProperties.style = node.data.hProperties.style || '';
      if (opts.widowMinWords) {
        node.data.hProperties.style += ` --widow-min-words: ${opts.widowMinWords};`;
      }
    });

    // Process headings
    visit(tree, 'heading', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};

      const classes = [`mm-heading`, `mm-h${node.depth}`];

      if (opts.preventWidows) {
        classes.push('mm-no-widows');
      }

      node.data.hProperties.class = classes.join(' ');

      // Process heading text
      if (node.children) {
        node.children.forEach((child) => {
          if (child.type === 'text' && child.value) {
            if (opts.smartQuotes) {
              child.value = convertToSmartQuotes(child.value);
            }
            if (opts.preventWidows) {
              child.value = preventWidows(child.value, opts.widowMinWords);
            }
          }
        });
      }
    });

    // Process blockquotes
    visit(tree, 'blockquote', (node) => {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.class = 'mm-pull-quote mm-no-break';
    });

    // Process inline elements
    visit(tree, ['emphasis', 'strong', 'inlineCode'], (node) => {
      if (node.children) {
        node.children.forEach((child) => {
          if (child.type === 'text' && child.value && opts.smartQuotes) {
            child.value = convertToSmartQuotes(child.value);
          }
        });
      }
    });

    return tree;
  };
}

/**
 * Standalone utility: Convert quotes in text
 */
export function smartenQuotes(text) {
  return convertToSmartQuotes(text);
}

/**
 * Standalone utility: Prevent widows in text
 */
export function noWidows(text, minWords = 2) {
  return preventWidows(text, minWords);
}

/**
 * Standalone utility: Add CJK break opportunities
 */
export function cjkBreaks(text) {
  return addCJKBreakOpportunities(text);
}

export default typographyEnhancers;

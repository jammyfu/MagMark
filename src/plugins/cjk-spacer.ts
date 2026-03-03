/**
 * MagMark 2.0 - CJK Spacer Plugin
 * Automatically inserts spaces between CJK characters and Latin/numbers
 * 
 * Based on the CJK spacing best practices:
 * - Insert space between CJK and Latin characters
 * - Insert space between CJK and numbers
 * - Preserve existing spaces
 * - Handle punctuation edge cases
 */
import { visit } from 'unist-util-visit';
import { u } from 'unist-builder';

// Unicode ranges
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff]/u;
const LATIN_REGEX = /[a-zA-Z]/;
const NUMBER_REGEX = /[0-9]/;
const PUNCTUATION_REGEX = /[，。！？、；：""''（）【】《》]/;

/**
 * Check if a character is CJK
 */
function isCJK(char) {
  return CJK_REGEX.test(char);
}

/**
 * Check if a character is Latin (English alphabet)
 */
function isLatin(char) {
  return LATIN_REGEX.test(char);
}

/**
 * Check if a character is a number
 */
function isNumber(char) {
  return NUMBER_REGEX.test(char);
}

/**
 * Check if a character is CJK punctuation
 */
function isCJKPunctuation(char) {
  return PUNCTUATION_REGEX.test(char);
}

/**
 * Check if spacing is needed between two characters
 * Returns true if space should be inserted
 */
function needsSpacing(left, right) {
  if (!left || !right) return false;
  
  const leftIsCJK = isCJK(left);
  const rightIsCJK = isCJK(right);
  const leftIsLatin = isLatin(left);
  const rightIsLatin = isLatin(right);
  const leftIsNumber = isNumber(left);
  const rightIsNumber = isNumber(right);
  
  // CJK <-> Latin: add space
  if ((leftIsCJK && rightIsLatin) || (leftIsLatin && rightIsCJK)) {
    return true;
  }
  
  // CJK <-> Number: add space
  if ((leftIsCJK && rightIsNumber) || (leftIsNumber && rightIsCJK)) {
    return true;
  }
  
  return false;
}

/**
 * Add spacing to text content
 */
function addSpacing(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const current = text[i];
    const next = text[i + 1];
    
    result += current;
    
    // Check if we need to add space
    if (next && needsSpacing(current, next)) {
      // Don't add space if there's already a space
      if (current !== ' ' && next !== ' ') {
        result += ' ';
      }
    }
  }
  
  return result;
}

/**
 * Process text node and add CJK spacing
 */
function processTextNode(node) {
  if (node.type === 'text' && node.value) {
    node.value = addSpacing(node.value);
  }
}

/**
 * CJK Spacer plugin for unified/remark
 * Options:
 * - enabled: boolean (default: true)
 * - space: string (default: ' ')
 */
export function cjkSpacer(options = {}) {
  const { enabled = true, space = ' ' } = options;
  
  if (!enabled) {
    return async (tree) => tree;
  }

  return async (tree, file) => {
    // Process all text nodes
    visit(tree, 'text', (node) => {
      processTextNode(node);
    });

    // Also process inline code
    visit(tree, 'inlineCode', (node) => {
      if (node.value) {
        node.value = addSpacing(node.value);
      }
    });

    // Process link text
    visit(tree, 'link', (node) => {
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'text') {
            processTextNode(child);
          }
        });
      }
    });

    // Process emphasis and strong
    visit(tree, ['emphasis', 'strong'], (node) => {
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'text') {
            processTextNode(child);
          }
        });
      }
    });

    return tree;
  };
}

/**
 * Standalone function to add CJK spacing to any string
 * Useful for non-AST transformations
 */
export function addCJKSpacing(text) {
  return addSpacing(text);
}

/**
 * Check if text contains CJK characters
 */
export function containsCJK(text) {
  if (!text || typeof text !== 'string') return false;
  return CJK_REGEX.test(text);
}

/**
 * Remove extra spaces between CJK characters
 * Useful for cleanup/normalization
 */
export function normalizeCJKSpacing(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Remove spaces between CJK characters
  let result = text;
  const chars = text.split('');
  
  for (let i = chars.length - 2; i >= 0; i--) {
    const current = chars[i];
    const next = chars[i + 1];
    
    if (current === ' ' && isCJK(chars[i - 1]) && isCJK(next)) {
      // Remove the space between two CJK characters
      chars.splice(i, 1);
    }
  }
  
  return chars.join('');
}

export default cjkSpacer;

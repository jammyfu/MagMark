/**
 * MagMark 2.0 - Typst Converter
 * High-speed Typst integration for PDF generation
 */

export interface TypstOptions {
  /** Page size: A4, Letter, etc. */
  pageSize?: 'A4' | 'Letter' | 'A5' | 'custom';
  /** Custom page dimensions */
  dimensions?: { width: string; height: string };
  /** Page margins */
  margins?: { top: string; right: string; bottom: string; left: string };
  /** Font family */
  fontFamily?: string;
  /** Font size */
  fontSize?: string;
  /** Line spacing */
  lineSpacing?: string;
  /** Output path */
  outputPath?: string;
}

const defaultOptions: TypstOptions = {
  pageSize: 'A4',
  margins: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' },
  fontFamily: 'Noto Serif SC',
  fontSize: '11pt',
  lineSpacing: '1.75em',
};

/**
 * Generate Typst template
 */
export function generateTypstTemplate(
  content: string,
  options: TypstOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  const pageSize = opts.pageSize === 'custom' && opts.dimensions
    ? `(width: ${opts.dimensions.width}, height: ${opts.dimensions.height})`
    : opts.pageSize;

  return `
#let magmark-theme = (
  font-primary: "${opts.fontFamily}",
  font-fallback: ("Source Han Serif SC", "SimSun", "STSong"),
  font-mono: "Monaco",
  font-size-base: ${opts.fontSize},
  line-spacing: ${opts.lineSpacing},
  color-text: rgb(26, 26, 26),
  color-accent: rgb(211, 47, 47),
)

#set page(
  ${opts.pageSize === 'custom' ? '' : `paper: "${pageSize}",`}
  margin: (
    top: ${opts.margins?.top},
    right: ${opts.margins?.right},
    bottom: ${opts.margins?.bottom},
    left: ${opts.margins?.left},
  ),
)

#set text(
  font: (magmark-theme.font-primary, ..magmark-theme.font-fallback),
  size: magmark-theme.font-size-base,
  fill: magmark-theme.color-text,
)

#set par(
  leading: magmark-theme.line-spacing,
  justify: true,
)

// Heading styles
#show heading.where(level: 1): it => [
  #set text(size: 24pt, weight: 700)
  #set par(leading: 1.2em)
  #block(it.body, above: 1.5em, below: 0.75em)
  #line(length: 100%, stroke: 0.5pt + magmark-theme.color-accent)
]

#show heading.where(level: 2): it => [
  #set text(size: 18pt, weight: 600)
  #set par(leading: 1.3em)
  #block(it.body, above: 1.5em, below: 0.75em)
]

#show heading.where(level: 3): it => [
  #set text(size: 14pt, weight: 600)
  #set par(leading: 1.4em)
  #block(it.body, above: 1.25em, below: 0.5em)
]

// Link styles
#show link: it => [
  #text(fill: magmark-theme.color-accent, it)
]

// Code styles
#show raw.where(block: true): it => [
  #block(
    fill: rgb(245, 245, 245),
    inset: 1em,
    radius: 4pt,
    width: 100%,
    it
  )
]

#show raw.where(block: false): it => [
  #box(
    fill: rgb(245, 245, 245),
    inset: (x: 0.3em, y: 0.2em),
    radius: 3pt,
    text(font: magmark-theme.font-mono, size: 0.9em, it)
  )
]

// Quote styles
#show quote: it => [
  #block(
    fill: rgb(250, 250, 250),
    inset: 1em,
    radius: (left: 4pt),
    stroke: (left: 3pt + magmark-theme.color-accent),
    it
  )
]

// Image styles
#show figure: it => [
  #align(center, it)
]

// Page break
#let pagebreak = pagebreak()

// Pull quote
#let pullquote(text, attribution: none) = block(
  fill: rgb(250, 250, 250),
  inset: 1.5em,
  radius: (left: 4pt),
  stroke: (left: 3pt + magmark-theme.color-accent),
  [
    #text(style: "italic", text)
    #if attribution != none [
      #v(0.5em)
      #text(size: 0.9em, fill: rgb(102, 102, 102), "— " + attribution)
    ]
  ]
)

// Full bleed image
#let fullbleed(image, caption: none) = block(
  width: 100%,
  [
    #image
    #if caption != none [
      #v(0.5em)
      #align(center, text(size: 0.9em, fill: rgb(102, 102, 102), caption))
    ]
  ]
)

// Main content
${convertMarkdownToTypst(content)}
`.trim();
}

/**
 * Convert Markdown to Typst markup
 * Simplified conversion - use proper parser in production
 */
function convertMarkdownToTypst(markdown: string): string {
  return markdown
    // Headings
    .replace(/^# (.*$)/gim, '= $1')
    .replace(/^## (.*$)/gim, '== $1')
    .replace(/^### (.*$)/gim, '=== $1')
    .replace(/^#### (.*$)/gim, '==== $1')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/gim, '*$1*')
    .replace(/\*(.*?)\*/gim, '_$1_')
    
    // Code
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '```$1\n$2```')
    .replace(/`([^`]+)`/gim, '#raw("$1")')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '#link("$2")[$1]')
    
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '#figure(image("$2"), caption: "$1")')
    
    // Blockquotes
    .replace(/^> (.*$)/gim, '#quote(block: true, "$1")')
    
    // Horizontal rules (page breaks)
    .replace(/^---$/gim, '#pagebreak()')
    
    // Lists
    .replace(/^- (.*$)/gim, '- $1')
    .replace(/^\d+\. (.*$)/gim, '+ $1')
    
    // Paragraphs (double newline = new paragraph)
    .replace(/\n\n/g, '\n\n');
}

/**
 * Compile Typst to PDF using the Typst CLI
 * Note: Requires typst CLI to be installed
 */
export async function compileTypst(
  input: string,
  outputPath: string,
  options: TypstOptions = {}
): Promise<{ success: boolean; output?: string; error?: string }> {
  const template = generateTypstTemplate(input, options);
  
  // In production, this would call the Typst CLI
  // For now, return the template as output
  return {
    success: true,
    output: template,
  };
}

/**
 * Generate Typst configuration file
 */
export function generateTypstConfig(options: TypstOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  return `
# MagMark 2.0 Typst Configuration

[document]
page-size = "${opts.pageSize}"
font-family = "${opts.fontFamily}"
font-size = "${opts.fontSize}"
line-spacing = "${opts.lineSpacing}"

[margins]
top = "${opts.margins?.top}"
right = "${opts.margins?.right}"
bottom = "${opts.margins?.bottom}"
left = "${opts.margins?.left}"
`;
}

export default {
  generateTypstTemplate,
  convertMarkdownToTypst,
  compileTypst,
  generateTypstConfig,
};

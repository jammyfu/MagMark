/** @type {import('tailwindcss').Config} */
const designTokens = require('./design-tokens/v2.0.json');

function generateBaselineGrid(step) {
  const spacing = {};
  const maxSteps = 32;
  
  for (let i = 1; i <= maxSteps; i++) {
    spacing[`${i * step}`] = `${i * step}px`;
    spacing[`b-${i}`] = `${i * step}px`;
  }
  
  return spacing;
}

function generateTypographyScale(levels) {
  const fontSize = {};
  const lineHeight = {};
  const fontWeight = {};
  
  levels.forEach(level => {
    fontSize[level.tag] = `${level.fontSize}px`;
    lineHeight[level.tag] = level.lineHeight;
    fontWeight[level.tag] = level.fontWeight;
  });
  
  return { fontSize, lineHeight, fontWeight };
}

const typographyScale = generateTypographyScale(designTokens.typographySystem.levels);

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,vue}',
    './index.html',
  ],
  theme: {
    extend: {
      spacing: {
        'column-gap': `${designTokens.grid.gutter}px`,
        'gutter': `${designTokens.grid.gutter}px`,
        'baseline': `${designTokens.grid.baselineStep}px`,
        ...generateBaselineGrid(designTokens.grid.baselineStep)
      },
      lineHeight: {
        'magazine': designTokens.typography.lineHeight,
        'prose': designTokens.typography.lineHeight,
        ...typographyScale.lineHeight
      },
      maxWidth: {
        'prose-line': `${designTokens.typography.maxCharsPerLine}ch`,
        'magazine': `${designTokens.typography.maxCharsPerLine}ch`,
      },
      minWidth: {
        'prose-line': `${designTokens.typography.minCharsPerLine}ch`,
      },
      fontSize: {
        ...typographyScale.fontSize
      },
      fontWeight: {
        ...typographyScale.fontWeight
      },
      fontFamily: {
        'serif': [
          'Source Han Serif SC',
          'Noto Serif SC',
          'SimSun',
          'STSong',
          'Times New Roman',
          'serif'
        ],
        'magazine': [
          'Source Han Serif SC',
          'Noto Serif SC',
          'SimSun',
          'STSong',
          'serif'
        ]
      },
      colors: {
        'magazine': {
          'text': designTokens.colors.textPrimary,
          'text-secondary': designTokens.colors.textSecondary,
          'background': designTokens.colors.background,
          'accent': designTokens.colors.accent,
          'border': designTokens.colors.border,
        },
        'text-primary': designTokens.colors.textPrimary,
        'text-secondary': designTokens.colors.textSecondary,
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.orphans-2': {
          'orphans': '2',
        },
        '.widows-2': {
          'widows': '2',
        },
        '.page-break-inside-avoid': {
          'page-break-inside': 'avoid',
          'break-inside': 'avoid',
        },
        '.page-break-before': {
          'page-break-before': 'always',
          'break-before': 'page',
        },
        '.page-break-after': {
          'page-break-after': 'always',
          'break-after': 'page',
        },
        '.hanging-punctuation': {
          'hanging-punctuation': 'first last',
        },
        '.baseline-grid': {
          'background-image': `linear-gradient(transparent ${100 - (1/designTokens.typography.lineHeight * 100)}%, #e0e0e0 ${100 - (1/designTokens.typography.lineHeight * 100)}%)`,
          'background-size': `100% ${designTokens.grid.baselineStep * designTokens.typography.lineHeight}px`,
        },
      });
    },
  ],
};

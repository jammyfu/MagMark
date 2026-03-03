# Code Blocks Test

This document tests syntax highlighting and code block formatting.

## Inline Code

Use the `npm install` command to install dependencies.

The `flex` property is a shorthand for `flex-grow`, `flex-shrink`, and `flex-basis`.

## JavaScript Code Block

```javascript
function calculateTypography(baseSize, ratio) {
  const sizes = {
    h1: baseSize * Math.pow(ratio, 3),
    h2: baseSize * Math.pow(ratio, 2),
    h3: baseSize * Math.pow(ratio, 1),
    body: baseSize,
    small: baseSize / ratio,
  };
  
  return sizes;
}

const modularScale = calculateTypography(16, 1.25);
console.log(modularScale);
```

## TypeScript Code Block

```typescript
interface MagazineOptions {
  platform: 'xiaohongshu' | 'wechat' | 'pdf';
  resolution: 'quick' | 'standard' | 'print';
  autoSpaceCjk: boolean;
}

class MagMarkRenderer {
  private options: MagazineOptions;
  
  constructor(options: MagazineOptions) {
    this.options = options;
  }
  
  async render(markdown: string): Promise<Buffer> {
    // Rendering logic here
    return Buffer.from('rendered');
  }
}
```

## CSS Code Block

```css
.magazine-page {
  max-width: 65ch;
  margin: 0 auto;
  line-height: 1.75;
  font-family: 'Source Han Serif SC', serif;
}

.magazine-page p {
  margin-bottom: 1.5em;
  text-align: justify;
}
```

## Python Code Block

```python
def generate_typography_scale(base_size, ratio=1.25, levels=5):
    """Generate a modular typography scale."""
    scale = {}
    for i in range(levels):
        key = f'h{levels - i}'
        scale[key] = base_size * (ratio ** i)
    scale['body'] = base_size
    scale['small'] = base_size / ratio
    return scale

# Generate scale
typography = generate_typography_scale(16)
for key, value in typography.items():
    print(f'{key}: {value:.2f}px')
```

## Shell Commands

```bash
# Install dependencies
npm install magmark

# Render markdown to PDF
magmark render input.md --format pdf --output output.pdf

# Render for Xiaohongshu
magmark render input.md --platform xiaohongshu --output carousel.zip
```

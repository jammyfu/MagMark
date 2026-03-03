# Tables Test

This document tests table rendering and formatting.

## Simple Table

| Feature | Status | Priority |
|---------|--------|----------|
| Typography | ✅ Complete | High |
| Pagination | ✅ Complete | High |
| Export PNG | ✅ Complete | Medium |
| Export PDF | 🚧 In Progress | High |

## Wide Table

| Component | Type | Props | Default | Description |
|-----------|------|-------|---------|-------------|
| Editor | React Component | content, onChange, mode | - | Main editor component |
| Preview | React Component | html, platform | 'web' | Live preview panel |
| Toolbar | React Component | editor | - | Formatting toolbar |
| StatusBar | React Component | stats | - | Document statistics |

## Data Table

| Month | Revenue | Expenses | Profit | Growth |
|-------|---------|----------|--------|--------|
| January | $45,000 | $32,000 | $13,000 | +5% |
| February | $52,000 | $35,000 | $17,000 | +15% |
| March | $48,000 | $33,000 | $15,000 | -8% |
| April | $61,000 | $38,000 | $23,000 | +27% |

## Alignment Test

| Left | Center | Right |
|:-----|:------:|------:|
| Text | Text | $100 |
| Longer text | Text | $1,000 |
| Text | Longer text | $10,000 |

## Complex Content

| Feature | Description | Example |
|---------|-------------|---------|
| **Bold** | Supports *italic* and `code` | `**bold**` |
| Links | [Click here](https://example.com) | `[text](url)` |
| Lists | - Item 1<br>- Item 2 | `- Item` |

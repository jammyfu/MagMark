/**
 * MagMark 2.0 独立演示入口
 * 直接使用 unified 进行 Markdown 渲染，不依赖复杂的模块链
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const sampleMarkdown = `# 欢迎体验 MagMark 2.0

MagMark 2.0 是一个**杂志级排版品质**的 Markdown 转换器。

## 功能特点

- 📖 精美的标题和段落排版
- 🈳 CJK 智能空格处理
- 🖨️ 打印样式优化
- 📱 响应式移动端支持

## 代码高亮示例

\`\`\`typescript
const mm = new MagMark({ autoSpaceCjk: true });
const result = await mm.render(markdown);
\`\`\`

## 引用块

> MagMark 2.0 让每篇文档都拥有杂志级的排版品质。
> —— MagMark 团队

## 表格

| 功能 | 状态 |
|------|------|
| HTML 导出 | ✅ 已完成 |
| PDF 导出 | ✅ 已完成 |
| 图片导出 | ✅ 已完成 |
| 小红书轮播 | ✅ 已完成 |

---

*MagMark 2.0 — 让文字更有温度*
`;

async function renderDemo() {
    const outputEl = document.getElementById('output');
    if (!outputEl) return;

    try {
        const processor = unified()
            .use(remarkParse)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeStringify, { allowDangerousHtml: true });

        const result = await processor.process(sampleMarkdown);
        outputEl.innerHTML = String(result);
        outputEl.classList.add('rendered');
    } catch (err: any) {
        outputEl.innerHTML = '<div style="color: #e53e3e; padding: 16px; background: #fff5f5; border-radius: 8px;"><strong>渲染失败：</strong>' + err.message + '</div>';
        console.error('MagMark render error:', err);
    }
}

renderDemo();

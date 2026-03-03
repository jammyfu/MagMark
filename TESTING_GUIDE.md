# 🧪 MagMark 2.0 - Manual Testing Guide

这份文档指导真人测试员如何对 MagMark 2.0 进行全面的视觉和功能测试。

---

## 📋 测试概述

**测试目的**: 验证 MagMark 2.0 的杂志级排版质量和多平台导出能力  
**测试版本**: v2.0  
**测试日期**: 2026-03-03  
**测试环境**: Chrome / Safari / Firefox (最新版)

---

## 🎯 测试场景

### 场景 1: 桌面浏览器渲染测试

**步骤**:
1. 打开 `screenshots/reference-render.html`
2. 使用 DevTools (F12) → Elements 标签检查 DOM 结构
3. 确认以下元素正确渲染：
   - ✅ H1 标题：32pt，粗体，红色 (#d32f2f)
   - ✅ H2/H3 标题层级正确
   - ✅ 行高统一为 1.75x
   - ✅ 中英文混合空格自动插入
   - ✅ 引用块左侧红色边框
   - ✅ Code 块深色背景
   - ✅ 表格完整显示无溢出

**截图要求**:
- 文件命名：`desktop-full-view.png`
- 尺寸：Full page screenshot（滚动捕获）
- 格式：PNG，无损压缩

---

### 场景 2: 移动端响应式测试

**步骤**:
1. DevTools → Toggle device toolbar (Cmd+Shift+M)
2. 选择预定义设备：
   - iPhone 14 Pro (393×852)
   - iPad Pro (1024×1366)
   - Pixel 6 (412×915)
3. 滚动查看整个页面
4. 检查以下内容：
   - ✅ 文本大小可读性好
   - ✅ 表格不会横向溢出
   - ✅ 图片自适应宽度
   - ✅ 导航元素清晰可见
   - ✅ 没有文字截断问题

**截图要求**:
- 文件命名：
  - `mobile-iphone.png`
  - `mobile-ipad.png`
  - `mobile-android.png`
- 尺寸：Full height capture
- 格式：PNG

---

### 场景 3: 打印样式测试

**步骤**:
1. Ctrl/Cmd + P (打开打印对话框)
2. 设置参数：
   - Paper size: A4
   - Margins: Default
   - Options → Enable "Background graphics"
   - Scale: 100%
3. 预览检查：
   - ✅ 字体保持衬线风格
   - ✅ 颜色不褪色
   - ✅ 分页标记合理
   - ✅ 页眉页脚位置正确
   - ✅ 图片高质量渲染
4. 输出为 PDF

**截图/PDF 要求**:
- 文件命名：`print-preview-a4.pdf`
- 对比数字版和 PDF 版的差异
- 记录任何不一致的地方

---

### 场景 4: Typography 细节测试

**重点关注**:
- [ ] **行高**: 文本行之间间距均匀，目测约 1.75x 字号高度
- [ ] **段落间距**: 段落间距离大于行高
- [ ] **单词间距**: 英文单词间单个空格，中文间无额外空格
- [ ] **标点悬挂**: 句号逗号是否靠近边缘
- [ ] **孤行控制**: 段首/段尾不会出现单行孤悬
- [ ] **字体层次**: h1-h6 有明显的大小和粗细区分

**工具辅助**:
```
DevTools → Computed tab
→ font-size: 检查字号
→ line-height: 应约为 font-size × 1.75
→ margin-bottom: 应为 font-size × 1.5
```

---

### 场景 5: Content Structure 测试

**逐项检查**:

| 元素 | 预期效果 | 实际结果 | 备注 |
|------|---------|---------|------|
| **Blockquote** | 左红框 + 灰色背景 | ⬜ | |
| **Code Block** | Monaco 字体 + 深色背景 | ⬜ | |
| **Table** | 交替行颜色 + 边框清晰 | ⬜ | |
| **Lists** | 有序/无序列表缩进正确 | ⬜ | |
| **Tags** | 圆角胶囊样式 | ⬜ | |
| **Metadata** | 作者名 + 日期水平排列 | ⬜ | |

---

### 场景 6: Cross-Browser 兼容性测试

**浏览器矩阵**:

| 浏览器 | 版本 | 通过 | 问题 |
|--------|------|------|------|
| Chrome | Latest | ⬜ | |
| Safari | Latest | ⬜ | |
| Firefox | Latest | ⬜ | |
| Edge | Chromium | ⬜ | |

**检查项**:
1. 所有字体正常加载
2. CSS 变量工作正常
3. Flexbox/Grid 布局一致
4. @media print 规则生效

---

### 场景 7: Accessibility 可访问性测试

**测试工具**:
- Chrome DevTools → Lighthouse
- axe DevTools Extension

**通过标准**:
- [ ] Color Contrast Ratio ≥ 4.5:1 (text)
- [ ] All images have alt text
- [ ] Heading hierarchy logical (h1→h6)
- [ ] No keyboard traps
- [ ] Focus indicators visible
- [ ] Screen reader compatible

---

## 📸 Screenshot Guidelines

### 拍摄技巧

1. **禁用缩放**: 按 Cmd/Ctrl + 0 (100% zoom)
2. **全页捕获**: 使用 DevTools → More tools → Screenshots
3. **避免滚动条**: Canvas → Full page screenshot
4. **清晰度高**: Retina 显示屏上测试，1x scale

### 文件格式规范

```
screenshots/
├── desktop-full-view.png          # Desktop full page
├── mobile-iphone.png              # Mobile viewport
├── mobile-ipad.png                # Tablet viewport
├── print-preview-a4.pdf           # Print output
└── lighthouse-report.png          # Accessibility scores
```

---

## ✅ Checklists

### 基本功能 Checklist

- [ ] Markdown 转 HTML 正常
- [ ] CJK 自动空格正确
- [ ] Headings 层级分明
- [ ] Tables 不溢出容器
- [ ] Images 自适应宽度
- [ ] Code blocks 语法高亮
- [ ] Blockquotes 样式特殊
- [ ] Footer 居中显示
- [ ] Links 有 hover 效果
- [ ] Print styles 正确应用

### 高级功能 Checklist

- [ ] Design tokens JSON 正确
- [ ] SEO meta tags 注入成功
- [ ] Schema.org structured data 有效
- [ ] Table of Contents 生成正确
- [ ] Breadcrumbs 导航可用
- [ ] Mobile view 响应流畅
- [ ] Print output 符合出版标准
- [ ] Performance < 100ms render
- [ ] Lighthouse score ≥ 90
- [ ] WCAG AA compliant

---

## 🐛 Bug Reporting Template

如果发现任何问题，请按此模板报告：

```markdown
## Bug Report

**Title**: [简短描述问题]

**Environment**:
- Browser: e.g., Chrome 120
- OS: macOS 14.3
- Viewport: 1920×1080

**Steps to Reproduce**:
1. Open reference-render.html
2. Scroll to section X
3. Observe Y

**Expected Behavior**:
Describe what should happen

**Actual Behavior**:
Describe what actually happens

**Screenshots/Recordings**:
[Attach evidence]

**Console Errors**:
Paste any error messages from DevTools Console
```

---

## 📊 Scoring Rubric

| Category | Weight | Score (0-5) | Notes |
|----------|--------|-------------|-------|
| Typography Quality | 25% | ⬜ | Font rendering, spacing |
| Layout Consistency | 20% | ⬜ | Grid alignment, margins |
| Cross-Browser Compat | 15% | ⬜ | Works on all browsers |
| Mobile Responsiveness | 15% | ⬜ | Responsive breakpoints |
| Print Quality | 10% | ⬜ | PDF export quality |
| Accessibility | 10% | ⬜ | WCAG compliance |
| Performance | 5% | ⬜ | Load/render time |

**Total Score**: ___ / 100  
**Pass/Fail**: ⬜ Pass  ⬜ Fail

---

## 📝 Summary Template

测试完成后填写总结：

```markdown
## Test Summary

**Date**: YYYY-MM-DD  
**Tester**: [Name]  
**Version**: 2.0

### Overall Assessment
[Brief overview of quality]

### Major Issues Found
1. [Issue description]
2. [Issue description]

### Minor Issues Found
- [Issue]
- [Issue]

### Highlights/Praise Points
- [Positive observation 1]
- [Positive observation 2]

### Recommendations
1. [Suggestion]
2. [Suggestion]

### Final Verdict
✅ Ready for Production  
⚠️ Needs Minor Fixes  
❌ Needs Major Rework
```

---

**Good luck with your testing! 🚀**

*Document version: 1.0 | Last updated: 2026-03-03*

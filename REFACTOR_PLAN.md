# MagMark 1.5.0: 工程化与设计重构计划 (Google Engineer & Designer Perspective)

## 一、 工程师视角的架构重构 (Engineered Logic)

目前的 `editor.ts` 已经超过 700 行，属于典型的“上帝对象”模型，维护成本随功能增加呈指数级上升。我们将按照 **单一职责原则 (SRP)** 进行拆分：

### 1. 核心状态管理 (`src/core/state.ts`)
- **Reactive Storage**: 引入简单的发布订阅模式，确保状态变动能精准触发局部更新，而非全量重绘。
- **Immutable State**: 保证历史记录（Undo/Redo）的可追溯性。

### 2. 高级排版引擎 (`src/engine/layout.ts`)
- **Height Caching**: 为每个 Markdown 块建立 ID 映射及其高度缓存，仅在内容或块级样式变动时重新测量。
- **Micro-Pagination**: 将分页算法从循环推入式改为流式处理，支持更复杂的跨页元素。

### 3. UI 控制中心 (`src/ui/controller.ts` & `src/ui/components/`)
- **Event Delegation**: 优化全局事件监听，减少预览区域频繁生成 DOM 导致的内存开销。
- **Floating Logic**: 将浮动工具栏独立化，支持更复杂的碰撞检测（防止工具栏遮挡编辑区）。

## 二、 设计师视角的视觉调试 (Aesthetic Debugging)

### 1. 配色体系 (Color Palette - "Editorial Elite")
- **Background**: 从纯黑改为 `#0f0f13`（深石板色），减少视觉疲劳。
- **Primary**: 使用 `#C5A059`（拉丝香槟金），代表杂志出版的尊贵感。
- **Surface**: 玻璃拟态从单纯的透明改为 0.1 模糊 + 0.05 白色杂质纹理，模拟纸张触感。

### 2. 版式细节 (Typographic Refinement)
- **Golden Ratio Margins**: 调整页边距至黄金比例 (1:1.618)，让视觉焦点更自然。
- **Punctuation Compression**: 针对 CJK 排版，增加标点挤压逻辑，避免行末出现巨大的“白洞”。
- **Code Block Aura**: 为代码块增加极其细微的阴影层级（Box-shadow: 0 4px 20px rgba(0,0,0,0.2)），增强层叠感。

---

## 三、 代码重构路线图

### 第一步：目录结构规范化 (Directory Scaffolding)
建立 `src/` 结构，将主逻辑迁入。

### 第二步：提取 CSS 变量与设计系统 (Design System)
在 `editor.css` 中定义深度变量。

### 第三步：模块化 editor.ts (Modularization)
使用 ES Modules 进行物理拆分。

### 第四步：极致 UX 加持 (UX Excellence)
实现顺滑平移分页切换动画、平滑阻尼滚动。

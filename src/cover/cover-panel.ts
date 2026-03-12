/**
 * CoverPanel — 封面生成面板 v2.0
 *
 * 改进：
 *   • 比例选择器与图片插入面板完全对齐（滑杆 + 可视框 + 竖/方/横分类）
 *   • 标题 / 副标题可鼠标拖拽调整位置（CSS transform，不影响模板布局）
 *   • 输入文字时直接更新 iframe DOM，拖拽位置不会丢失
 *   • 切换模板 / AI 生成 → 完全重建 iframe
 */

export type CoverData = {
    html: string;
    label: string;
};

type OnInsert = (coverHtml: string) => void;

// ─── Aspect Ratios（与 image-panel 完全一致）────────────────────────────────

const ASPECT_RATIOS = [
    { label: '9:16',  value: '9:16',  category: 'Portrait',  vw: 70,  vh: 124, rw: 9,  rh: 16 },
    { label: '2:3',   value: '2:3',   category: 'Portrait',  vw: 82,  vh: 123, rw: 2,  rh: 3  },
    { label: '3:4',   value: '3:4',   category: 'Portrait',  vw: 93,  vh: 124, rw: 3,  rh: 4  },
    { label: '4:5',   value: '4:5',   category: 'Portrait',  vw: 99,  vh: 123, rw: 4,  rh: 5  },
    { label: '1:1',   value: '1:1',   category: 'Square',    vw: 124, vh: 124, rw: 1,  rh: 1  },
    { label: '5:4',   value: '5:4',   category: 'Landscape', vw: 124, vh: 99,  rw: 5,  rh: 4  },
    { label: '4:3',   value: '4:3',   category: 'Landscape', vw: 124, vh: 93,  rw: 4,  rh: 3  },
    { label: '3:2',   value: '3:2',   category: 'Landscape', vw: 124, vh: 82,  rw: 3,  rh: 2  },
    { label: '16:9',  value: '16:9',  category: 'Landscape', vw: 124, vh: 70,  rw: 16, rh: 9  },
    { label: '21:9',  value: '21:9',  category: 'Landscape', vw: 124, vh: 53,  rw: 21, rh: 9  },
];

// ─── Built-in Cover Templates ────────────────────────────────────────────────

const COVER_TEMPLATES: CoverData[] = [
    {
        label: '极简杂志',
        html: `<div class="mm-cover mm-cover-minimal" style="
            width:100%; height:100%; display:flex; flex-direction:column;
            justify-content:flex-end; padding:10% 10% 12%;
            background: linear-gradient(160deg, var(--th-bg-page,#fff) 0%, color-mix(in srgb,var(--th-primary,#d4af37) 12%,var(--th-bg-page,#fff)) 100%);
            font-family: var(--mm-font-family, inherit); box-sizing:border-box; overflow:hidden; position:relative;">
            <div style="position:absolute;top:8%;right:8%;width:38%;height:62%;
                background:var(--th-primary,#d4af37);opacity:0.13;border-radius:2px;"></div>
            <div style="font-size:0.55em;letter-spacing:0.35em;text-transform:uppercase;
                color:var(--th-primary,#d4af37);margin-bottom:1.2em;font-weight:500;">MAGMARK</div>
            <h1 class="mm-cover-title" style="font-size:2.6em;font-weight:700;line-height:1.15;
                color:var(--th-text-page,#1a1a2e);margin:0 0 0.6em;word-break:keep-all;"></h1>
            <p class="mm-cover-subtitle" style="font-size:0.9em;color:var(--th-text-page,#1a1a2e);
                opacity:0.55;line-height:1.6;margin:0;"></p>
            <div style="width:3em;height:2px;background:var(--th-primary,#d4af37);margin-top:2em;"></div>
        </div>`,
    },
    {
        label: '深色大标题',
        html: `<div class="mm-cover mm-cover-dark" style="
            width:100%; height:100%; display:flex; flex-direction:column;
            justify-content:center; align-items:flex-start; padding:0 10%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, color-mix(in srgb,var(--th-primary,#d4af37) 25%,#1a1a2e) 100%);
            font-family: var(--mm-font-family, inherit); box-sizing:border-box; overflow:hidden; position:relative;">
            <div style="position:absolute;top:-5%;right:-5%;width:50%;height:70%;
                border-radius:50%;background:var(--th-primary,#d4af37);opacity:0.06;"></div>
            <div style="font-size:0.5em;letter-spacing:0.4em;color:var(--th-primary,#d4af37);
                margin-bottom:1.4em;font-weight:600;text-transform:uppercase;">EDITORIAL</div>
            <h1 class="mm-cover-title" style="font-size:3em;font-weight:700;line-height:1.1;
                color:#ffffff;margin:0 0 0.5em;word-break:keep-all;"></h1>
            <div style="width:2em;height:3px;background:var(--th-primary,#d4af37);margin:0.8em 0 1.2em;"></div>
            <p class="mm-cover-subtitle" style="font-size:0.85em;color:rgba(255,255,255,0.5);
                line-height:1.7;margin:0;max-width:70%;"></p>
        </div>`,
    },
    {
        label: '小红书竖版',
        html: `<div class="mm-cover mm-cover-xhs" style="
            width:100%; height:100%; display:flex; flex-direction:column;
            justify-content:space-between; padding:10% 8% 8%;
            background: linear-gradient(180deg, #fff5f5 0%, #ffe4e4 50%, #ffcfcf 100%);
            font-family: var(--mm-font-family, inherit); box-sizing:border-box; overflow:hidden; position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.65em;font-weight:700;color:#ff2442;letter-spacing:0.05em;">小红书</span>
                <span style="font-size:0.55em;color:#999;">XIAOHONGSHU</span>
            </div>
            <div>
                <div style="font-size:0.6em;color:#ff2442;margin-bottom:0.8em;font-weight:500;">
                    ✦ 种草好物 / 生活分享 ✦
                </div>
                <h1 class="mm-cover-title" style="font-size:2.2em;font-weight:700;line-height:1.25;
                    color:#222;margin:0 0 0.6em;word-break:keep-all;"></h1>
                <p class="mm-cover-subtitle" style="font-size:0.85em;color:#555;
                    line-height:1.7;margin:0;"></p>
            </div>
            <div style="display:flex;align-items:center;gap:0.5em;">
                <div style="width:2em;height:2em;background:#ff2442;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-size:0.7em;font-weight:700;">♥</span>
                </div>
                <span style="font-size:0.65em;color:#888;">记得点赞收藏～</span>
            </div>
        </div>`,
    },
    {
        label: '学术报告',
        html: `<div class="mm-cover mm-cover-academic" style="
            width:100%; height:100%; display:flex; flex-direction:column;
            justify-content:center; align-items:center; text-align:center; padding:10%;
            background:var(--th-bg-page,#fff);
            font-family: var(--mm-font-family, inherit); box-sizing:border-box; overflow:hidden; position:relative;">
            <div style="width:100%;height:6px;background:var(--th-primary,#d4af37);position:absolute;top:0;left:0;"></div>
            <div style="width:100%;height:2px;background:var(--th-primary,#d4af37);opacity:0.3;position:absolute;top:10px;left:0;"></div>
            <div style="font-size:0.55em;color:var(--th-primary,#d4af37);letter-spacing:0.3em;
                text-transform:uppercase;font-weight:600;margin-bottom:3em;">Research Report</div>
            <h1 class="mm-cover-title" style="font-size:2.2em;font-weight:700;line-height:1.2;
                color:var(--th-text-page,#1a1a2e);margin:0 0 1em;word-break:keep-all;max-width:80%;"></h1>
            <div style="width:4em;height:1px;background:var(--th-text-page,#1a1a2e);opacity:0.2;margin:0 auto 1.5em;"></div>
            <p class="mm-cover-subtitle" style="font-size:0.8em;color:var(--th-text-page,#1a1a2e);
                opacity:0.5;line-height:1.8;margin:0 auto;max-width:70%;"></p>
            <div style="margin-top:3em;font-size:0.6em;color:var(--th-text-page,#1a1a2e);opacity:0.4;letter-spacing:0.1em;">
                <span class="mm-cover-date"></span>
            </div>
            <div style="width:100%;height:4px;background:var(--th-primary,#d4af37);opacity:0.3;position:absolute;bottom:0;left:0;"></div>
        </div>`,
    },
];

// ─── Gemini API Helper ────────────────────────────────────────────────────────

async function callGemini(apiKey: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
        contents: [{
            parts: [{
                text: `你是一个专业的HTML封面设计师。根据以下要求生成一个适合杂志/文章的封面HTML代码。

要求：
${prompt}

规则：
1. 输出纯HTML片段，不包含<!DOCTYPE>或<html>标签
2. 使用内联样式
3. 根元素宽度和高度都设为100%，使用CSS变量 var(--th-bg-page), var(--th-primary), var(--th-text-page) 继承主题颜色
4. 标题元素需要有 class="mm-cover-title"，副标题有 class="mm-cover-subtitle"
5. 封面要美观、专业，适合印刷/屏幕显示
6. 只输出HTML代码，不要有任何说明文字、代码块标记

现在生成封面HTML：`
            }]
        }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000,
        }
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();
}

// ─── Panel Class ──────────────────────────────────────────────────────────────

export class CoverPanel {
    private overlay!: HTMLElement;
    private onInsert: OnInsert;
    private selectedTemplate = 0;
    private currentTitle = '';
    private currentSubtitle = '';
    private previewFrame!: HTMLIFrameElement;
    private currentRatioIdx = 3; // 默认 4:5，适合封面

    constructor(onInsert: OnInsert) {
        this.onInsert = onInsert;
        this.buildDom();
        this.injectStyles();
    }

    // ─── DOM Construction ────────────────────────────────────────────────────

    private buildDom() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'mm-cp-overlay';
        this.overlay.innerHTML = `
<div class="mm-cp-panel">
  <div class="mm-cp-header">
    <span class="mm-cp-title">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style="vertical-align:-2px;margin-right:6px">
        <rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
        <line x1="1" y1="5.5" x2="14" y2="5.5" stroke="currentColor" stroke-width="1"/>
        <line x1="4" y1="8.5" x2="11" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="4" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      封面生成
    </span>
    <button class="mm-cp-close">✕</button>
  </div>

  <div class="mm-cp-body">
    <!-- Left: controls -->
    <div class="mm-cp-controls">
      <div class="mm-cp-section-label">文字内容</div>
      <input class="mm-cp-input" id="mm-cp-title-input" placeholder="标题（留空则自动提取）" type="text">
      <input class="mm-cp-input" id="mm-cp-subtitle-input" placeholder="副标题 / 简介" type="text">

      <div class="mm-cp-section-label" style="margin-top:16px">选择模板</div>
      <div class="mm-cp-template-grid" id="mm-cp-template-grid"></div>

      <div class="mm-cp-section-label" style="margin-top:16px">AI 生成封面</div>
      <div class="mm-cp-ai-row">
        <input class="mm-cp-input" id="mm-cp-apikey" placeholder="Gemini API Key" type="password" autocomplete="off">
      </div>
      <textarea class="mm-cp-textarea" id="mm-cp-prompt"
        placeholder="描述封面风格，如：深色系，金融科技主题，突出数据感，主色调蓝色…"></textarea>
      <button class="mm-cp-ai-btn" id="mm-cp-generate-btn">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="margin-right:5px">
          <path d="M6.5 1L7.8 4.7H11.7L8.5 7L9.8 10.7L6.5 8.4L3.2 10.7L4.5 7L1.3 4.7H5.2Z"
            stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
        AI 生成
      </button>
      <div class="mm-cp-ai-status" id="mm-cp-ai-status"></div>
    </div>

    <!-- Right: preview + ratio selector -->
    <div class="mm-cp-preview-wrap">
      <div class="mm-cp-preview-header">
        <div class="mm-cp-section-label">预览</div>
        <span class="mm-cp-drag-hint">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:3px">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
          拖拽标题/副标题可调整位置
        </span>
      </div>

      <!-- Preview container (centers the box) -->
      <div class="mm-cp-preview-container" id="mm-cp-preview-container">
        <div class="mm-cp-preview-box" id="mm-cp-preview-box">
          <iframe class="mm-cp-iframe" id="mm-cp-iframe" sandbox="allow-same-origin"></iframe>
        </div>
      </div>

      <!-- Ratio Section (mirrors image-panel) -->
      <div class="mm-cp-ratio-section">
        <div class="mm-cp-ratio-header">
          <label class="mm-cp-ratio-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--primary,#d4af37)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            出图比例
          </label>
          <button class="mm-cp-ratio-reset" id="mm-cp-ratio-reset">重置</button>
        </div>
        <div class="mm-cp-ratio-panel">
          <!-- Visual box -->
          <div class="mm-cp-ar-visual-row">
            <div class="mm-cp-ar-visual" id="mm-cp-ar-visual">
              <div class="mm-cp-ar-inverse" id="mm-cp-ar-inverse"></div>
              <div class="mm-cp-ar-active" id="mm-cp-ar-active">
                <span class="mm-cp-ar-active-label" id="mm-cp-ar-active-label">4:5</span>
              </div>
              <span class="mm-cp-ar-swap-hint" id="mm-cp-ar-swap-hint">⇄</span>
            </div>
          </div>
          <!-- Categories -->
          <div class="mm-cp-ar-cats" id="mm-cp-ar-cats">
            <button class="mm-cp-ar-cat active" data-cat="Portrait">竖向</button>
            <button class="mm-cp-ar-cat" data-cat="Square">方形</button>
            <button class="mm-cp-ar-cat" data-cat="Landscape">横向</button>
          </div>
          <!-- Slider -->
          <div class="mm-cp-ar-slider-wrap">
            <input type="range" id="mm-cp-ar-slider" class="mm-cp-ar-slider"
                   min="0" max="${ASPECT_RATIOS.length - 1}" step="1" value="3">
            <div class="mm-cp-ar-ticks" id="mm-cp-ar-ticks">
              ${ASPECT_RATIOS.map((r, i) => `
                <div class="mm-cp-ar-tick${i === 3 ? ' active' : ''}" data-idx="${i}">
                  <div class="mm-cp-ar-tick-bar"></div>
                  <span class="mm-cp-ar-tick-label">${r.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <button class="mm-cp-insert-btn" id="mm-cp-insert-btn">插入封面</button>
    </div>
  </div>
</div>`;

        document.body.appendChild(this.overlay);
        this.previewFrame = this.overlay.querySelector('#mm-cp-iframe') as HTMLIFrameElement;

        this.buildTemplateGrid();
        this.bindEvents();
    }

    // ─── Injected Styles ─────────────────────────────────────────────────────

    private injectStyles() {
        const existing = document.getElementById('mm-cp-v2-styles');
        if (existing) existing.remove();
        const s = document.createElement('style');
        s.id = 'mm-cp-v2-styles';
        s.textContent = `
/* Cover panel v2 extras */
.mm-cp-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.mm-cp-drag-hint {
    font-size: 10px;
    color: var(--primary, #d4af37);
    opacity: 0.75;
    letter-spacing: 0.02em;
}
.mm-cp-preview-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: repeating-conic-gradient(rgba(255,255,255,.03) 0% 25%, transparent 0% 50%) 0 0/16px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color, rgba(255,255,255,0.08));
}
.mm-cp-preview-box {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-color, rgba(255,255,255,0.15));
    background: #fff;
    position: relative;
    flex-shrink: 0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: width 0.25s ease, height 0.25s ease;
}
.mm-cp-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
}

/* Ratio section */
.mm-cp-ratio-section {
    flex-shrink: 0;
}
.mm-cp-ratio-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.mm-cp-ratio-label {
    color: var(--text-secondary, #888);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    display: flex;
    align-items: center;
}
.mm-cp-ratio-reset {
    background: 0;
    border: 0;
    color: var(--text-secondary, #555);
    font-size: 10px;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
}
.mm-cp-ratio-reset:hover { color: var(--text-primary, #e8e8e8); }
.mm-cp-ratio-panel {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 10px;
    padding: 12px 12px 10px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
}
.mm-cp-ar-visual-row { display: flex; justify-content: center; }
.mm-cp-ar-visual {
    width: 120px;
    height: 120px;
    background: rgba(255,255,255,.04);
    border-radius: 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,.07);
    transition: all .2s;
}
.mm-cp-ar-visual.swappable { cursor: pointer; }
.mm-cp-ar-visual.swappable:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); }
.mm-cp-ar-inverse {
    position: absolute;
    border: 2px dashed rgba(255,255,255,.18);
    pointer-events: none;
    transition: all .3s;
    opacity: .4;
}
.mm-cp-ar-active {
    position: relative;
    border: 2px solid var(--primary, #d4af37);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .3s;
    z-index: 10;
    box-shadow: 0 0 8px rgba(212,175,55,.2);
}
.mm-cp-ar-active-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--primary, #d4af37);
    background: rgba(20,20,30,.8);
    padding: 1px 5px;
    border-radius: 3px;
}
.mm-cp-ar-swap-hint {
    position: absolute;
    bottom: 3px;
    right: 5px;
    font-size: 8px;
    color: #555;
    transition: color .2s;
}
.mm-cp-ar-visual.swappable:hover .mm-cp-ar-swap-hint { color: #888; }
.mm-cp-ar-cats { display: flex; gap: 6px; }
.mm-cp-ar-cat {
    flex: 1;
    padding: 4px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.1);
    background: 0;
    color: #555;
    cursor: pointer;
    transition: all .2s;
    letter-spacing: .03em;
    text-align: center;
    font-family: system-ui, sans-serif;
}
.mm-cp-ar-cat:hover { border-color: rgba(255,255,255,.2); color: #bbb; }
.mm-cp-ar-cat.active {
    background: rgba(212,175,55,.15);
    color: var(--primary, #d4af37);
    border-color: rgba(212,175,55,.4);
}
.mm-cp-ar-slider-wrap {
    position: relative;
    width: 100%;
    display: block;
    box-sizing: border-box;
}
.mm-cp-ar-slider {
    display: block;
    width: 100% !important;
    min-width: 100%;
    height: 3px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255,255,255,.1);
    border-radius: 3px;
    outline: 0;
    cursor: pointer;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    accent-color: var(--primary, #d4af37);
}
.mm-cp-ar-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: var(--primary, #d4af37);
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(212,175,55,.4);
    cursor: pointer;
}
.mm-cp-ar-ticks {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    pointer-events: none;
    user-select: none;
}
.mm-cp-ar-tick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 16px;
}
.mm-cp-ar-tick-bar {
    width: 1px;
    height: 4px;
    background: rgba(255,255,255,.12);
    border-radius: 1px;
    transition: background .2s;
}
.mm-cp-ar-tick.active .mm-cp-ar-tick-bar { background: var(--primary, #d4af37); }
.mm-cp-ar-tick-label {
    font-size: 7.5px;
    font-family: monospace;
    color: rgba(255,255,255,.2);
    white-space: nowrap;
    transition: color .2s;
}
.mm-cp-ar-tick.active .mm-cp-ar-tick-label {
    color: var(--primary, #d4af37);
    font-weight: 700;
}
`;
        document.head.appendChild(s);
    }

    // ─── Template Grid ────────────────────────────────────────────────────────

    private buildTemplateGrid() {
        const grid = this.overlay.querySelector('#mm-cp-template-grid')!;
        grid.innerHTML = COVER_TEMPLATES.map((t, i) => `
            <button class="mm-cp-tpl-btn ${i === 0 ? 'active' : ''}" data-idx="${i}">
                <span>${t.label}</span>
            </button>`).join('');
        grid.querySelectorAll('.mm-cp-tpl-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.mm-cp-tpl-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTemplate = parseInt((btn as HTMLElement).dataset.idx || '0');
                this.fullRebuildPreview(COVER_TEMPLATES[this.selectedTemplate].html);
            });
        });
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    private bindEvents() {
        this.overlay.querySelector('.mm-cp-close')!.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Text inputs: update DOM directly (preserve drag positions)
        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        const subtitleInput = this.overlay.querySelector('#mm-cp-subtitle-input') as HTMLInputElement;

        titleInput.addEventListener('input', () => {
            this.currentTitle = titleInput.value;
            this.updateTextInFrame();
        });
        subtitleInput.addEventListener('input', () => {
            this.currentSubtitle = subtitleInput.value;
            this.updateTextInFrame();
        });

        // AI generate
        this.overlay.querySelector('#mm-cp-generate-btn')!.addEventListener('click', () => this.onGenerate());

        // Insert button
        this.overlay.querySelector('#mm-cp-insert-btn')!.addEventListener('click', () => {
            const html = this.previewFrame?.contentDocument?.body?.innerHTML?.trim() ?? '';
            if (!html) {
                // 尚未渲染（极少情况），给用户提示
                const statusEl = this.overlay.querySelector<HTMLElement>('#mm-cp-ai-status');
                if (statusEl) { statusEl.textContent = '⚠ 请先选择模板或生成封面'; statusEl.style.color = '#e55'; }
                return;
            }
            this.onInsert(html);
            this.close();
        });

        // ── Ratio: slider ──
        const arSlider = this.overlay.querySelector<HTMLInputElement>('#mm-cp-ar-slider')!;
        arSlider.addEventListener('input', () => this.selectAspectRatio(parseInt(arSlider.value)));

        // ── Ratio: cats ──
        this.overlay.querySelector('#mm-cp-ar-cats')!.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.mm-cp-ar-cat') as HTMLButtonElement | null;
            if (!btn) return;
            const map: Record<string, number> = { Portrait: 0, Square: 4, Landscape: 8 };
            this.selectAspectRatio(map[btn.dataset.cat!] ?? 3);
        });

        // ── Ratio: reset ──
        this.overlay.querySelector('#mm-cp-ratio-reset')!.addEventListener('click', () => this.selectAspectRatio(3));

        // ── Ratio: visual box swap ──
        this.overlay.querySelector('#mm-cp-ar-visual')!.addEventListener('click', () => {
            const r = ASPECT_RATIOS[this.currentRatioIdx];
            const [a, b] = r.value.split(':');
            const inv = `${b}:${a}`;
            const idx = ASPECT_RATIOS.findIndex(x => x.value === inv);
            if (idx !== -1 && r.value !== '1:1') this.selectAspectRatio(idx);
        });
    }

    // ─── Aspect Ratio ─────────────────────────────────────────────────────────

    private selectAspectRatio(idx: number) {
        this.currentRatioIdx = idx;
        const r = ASPECT_RATIOS[idx];

        // Update visual box
        const active = this.overlay.querySelector<HTMLElement>('#mm-cp-ar-active')!;
        active.style.width = r.vw + 'px';
        active.style.height = r.vh + 'px';
        this.overlay.querySelector<HTMLElement>('#mm-cp-ar-active-label')!.textContent = r.label;

        // Inverse ghost
        const inv = this.overlay.querySelector<HTMLElement>('#mm-cp-ar-inverse')!;
        const [a, b] = r.value.split(':');
        const invVal = `${b}:${a}`;
        const canSwap = ASPECT_RATIOS.some(x => x.value === invVal) && r.value !== '1:1';
        const vis = this.overlay.querySelector<HTMLElement>('#mm-cp-ar-visual')!;
        const hint = this.overlay.querySelector<HTMLElement>('#mm-cp-ar-swap-hint')!;
        if (canSwap) {
            inv.style.width = r.vh + 'px'; inv.style.height = r.vw + 'px'; inv.style.display = '';
            vis.classList.add('swappable'); hint.style.display = '';
        } else {
            inv.style.display = 'none'; vis.classList.remove('swappable'); hint.style.display = 'none';
        }

        // Slider + ticks + cats
        this.overlay.querySelector<HTMLInputElement>('#mm-cp-ar-slider')!.value = String(idx);
        this.overlay.querySelectorAll<HTMLElement>('.mm-cp-ar-tick').forEach((t, i) => t.classList.toggle('active', i === idx));
        this.overlay.querySelectorAll<HTMLButtonElement>('.mm-cp-ar-cat').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.cat === r.category));

        // Resize preview box (no iframe rebuild needed)
        this.updatePreviewBoxSize();
    }

    /** 根据比例计算并更新预览框尺寸（最大 300px 高 / 380px 宽） */
    private updatePreviewBoxSize() {
        const r = ASPECT_RATIOS[this.currentRatioIdx];
        const MAX_H = 300, MAX_W = 380;
        let w: number, h: number;
        if (r.rw >= r.rh) {
            // 横向 or 方形
            w = MAX_W;
            h = Math.round(MAX_W * r.rh / r.rw);
        } else {
            // 竖向
            h = MAX_H;
            w = Math.round(MAX_H * r.rw / r.rh);
        }
        const box = this.overlay.querySelector<HTMLElement>('#mm-cp-preview-box')!;
        const frame = this.previewFrame;
        box.style.width = w + 'px';
        box.style.height = h + 'px';
        frame.style.width = w + 'px';
        frame.style.height = h + 'px';
    }

    // ─── Preview ──────────────────────────────────────────────────────────────

    /** 完全重建 iframe（切换模板 / AI 生成时调用）*/
    private fullRebuildPreview(rawHtml: string) {
        const injected = this.injectTextIntoHtml(rawHtml);

        // 收集宿主页面的 CSS 变量，注入到 iframe :root
        const s = getComputedStyle(document.documentElement);
        const cssVarKeys = ['--th-bg-page','--th-text-page','--th-primary','--th-accent','--mm-font-family','--user-font-family'];
        const rootVarsStr = cssVarKeys
            .map(k => { const v = s.getPropertyValue(k).trim(); return v ? `${k}:${v}` : ''; })
            .filter(Boolean).join(';');

        const googleFontsHref = (document.querySelector('link[href*="fonts.googleapis"]') as HTMLLinkElement | null)?.href || '';

        const docContent = `<!DOCTYPE html>
<html>
<head>
  ${googleFontsHref ? `<link rel="stylesheet" href="${googleFontsHref}">` : ''}
  <style>
    :root { ${rootVarsStr} }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { width: 100%; height: 100%; }
  </style>
</head>
<body>${injected}</body>
</html>`;

        const doc = this.previewFrame.contentDocument!;
        doc.open();
        doc.write(docContent);
        doc.close();

        this.updatePreviewBoxSize();
        // 延迟挂载拖拽，等 iframe 完全渲染
        setTimeout(() => this.makeDraggable(), 150);
    }

    /** 仅更新 iframe 中的文字（输入时调用，不影响拖拽位置）*/
    private updateTextInFrame() {
        const doc = this.previewFrame?.contentDocument;
        if (!doc) return;
        const titleEl = doc.querySelector('.mm-cover-title') as HTMLElement | null;
        const subtitleEl = doc.querySelector('.mm-cover-subtitle') as HTMLElement | null;
        const dateEl = doc.querySelector('.mm-cover-date') as HTMLElement | null;
        if (titleEl) titleEl.textContent = this.currentTitle;
        if (subtitleEl) subtitleEl.textContent = this.currentSubtitle;
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    private injectTextIntoHtml(html: string): string {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const titleEl = tmp.querySelector('.mm-cover-title');
        const subtitleEl = tmp.querySelector('.mm-cover-subtitle');
        const dateEl = tmp.querySelector('.mm-cover-date');
        if (titleEl) titleEl.textContent = this.currentTitle;
        if (subtitleEl) subtitleEl.textContent = this.currentSubtitle;
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        return tmp.innerHTML;
    }

    // ─── Draggable Text ───────────────────────────────────────────────────────

    /** 在 iframe 中为标题、副标题元素挂载拖拽事件 */
    private makeDraggable() {
        const doc = this.previewFrame?.contentDocument;
        if (!doc) return;

        const titleEl   = doc.querySelector<HTMLElement>('.mm-cover-title');
        const subtitleEl = doc.querySelector<HTMLElement>('.mm-cover-subtitle');

        [titleEl, subtitleEl].forEach(el => {
            if (el) this.setupDrag(el, doc);
        });
    }

    /**
     * 使用 CSS transform: translate() 实现拖拽。
     * 不改变元素原始布局（flex/position），只叠加偏移量。
     */
    private setupDrag(el: HTMLElement, doc: Document) {
        // 视觉提示：虚线轮廓
        el.style.cursor = 'move';
        el.style.userSelect = 'none';
        el.style.outline = '1.5px dashed rgba(212,175,55,0.45)';
        el.style.outlineOffset = '3px';
        el.style.transition = 'outline-color 0.15s';
        el.style.borderRadius = '2px';
        el.setAttribute('title', '拖拽可调整位置');

        let isDragging = false;
        let currentX = 0, currentY = 0;
        let startMouseX = 0, startMouseY = 0;

        // 读取已有 transform（重新挂载时恢复）
        const existing = el.style.transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
        if (existing) {
            currentX = parseFloat(existing[1]);
            currentY = parseFloat(existing[2]);
        }

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            startMouseX = e.clientX - currentX;
            startMouseY = e.clientY - currentY;
            el.style.outline = '1.5px dashed rgba(212,175,55,0.9)';
            el.style.zIndex = '9999';
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            currentX = e.clientX - startMouseX;
            currentY = e.clientY - startMouseY;
            el.style.transform = `translate(${currentX}px, ${currentY}px)`;
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            el.style.outline = '1.5px dashed rgba(212,175,55,0.45)';
            el.style.zIndex = '';
        };

        el.addEventListener('mousedown', onMouseDown);
        doc.addEventListener('mousemove', onMouseMove);
        doc.addEventListener('mouseup', onMouseUp);
    }

    // ─── AI Generation ────────────────────────────────────────────────────────

    private async onGenerate() {
        const apiKey = (this.overlay.querySelector('#mm-cp-apikey') as HTMLInputElement).value.trim();
        const prompt = (this.overlay.querySelector('#mm-cp-prompt') as HTMLTextAreaElement).value.trim();
        const statusEl = this.overlay.querySelector('#mm-cp-ai-status') as HTMLElement;
        const btn = this.overlay.querySelector('#mm-cp-generate-btn') as HTMLButtonElement;

        if (!apiKey) { statusEl.textContent = '请先输入 Gemini API Key'; statusEl.style.color = '#e55'; return; }
        if (!prompt) { statusEl.textContent = '请输入封面描述提示词'; statusEl.style.color = '#e55'; return; }

        btn.disabled = true;
        statusEl.textContent = '生成中…';
        statusEl.style.color = 'var(--primary, #d4af37)';

        try {
            const r = ASPECT_RATIOS[this.currentRatioIdx];
            const fullPrompt = `标题：${this.currentTitle || '(未填写)'}\n副标题：${this.currentSubtitle || '(未填写)'}\n比例：${r.value}\n\n${prompt}`;
            const html = await callGemini(apiKey, fullPrompt);
            this.fullRebuildPreview(html);
            // 取消模板高亮
            this.overlay.querySelectorAll('.mm-cp-tpl-btn').forEach(b => b.classList.remove('active'));
            statusEl.textContent = '✓ 生成成功';
            statusEl.style.color = '#4caf50';
        } catch (err: any) {
            statusEl.textContent = '生成失败：' + (err?.message || err);
            statusEl.style.color = '#e55';
        } finally {
            btn.disabled = false;
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    open(title = '', subtitle = '') {
        this.currentTitle = title;
        this.currentSubtitle = subtitle;
        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        const subtitleInput = this.overlay.querySelector('#mm-cp-subtitle-input') as HTMLInputElement;
        titleInput.value = title;
        subtitleInput.value = subtitle;
        this.overlay.style.display = 'flex';
        // 初始比例（4:5）
        this.selectAspectRatio(this.currentRatioIdx);
        this.fullRebuildPreview(COVER_TEMPLATES[this.selectedTemplate].html);
    }

    close() {
        this.overlay.style.display = 'none';
    }
}

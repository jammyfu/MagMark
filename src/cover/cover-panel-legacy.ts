import { createPanelDialog } from '../workspace/panel-dialog';
import { sanitizeArticleHtml } from '../security/article-html';
import { MEDIA_PRESETS, updateMediaDrafts, type MediaDraft } from './media-presets';
import { toPng } from 'html-to-image';
import { mountCoverTextEditor } from './layer-editor';
import { adaptiveLayout, prepareCover, LAYER_SELECTOR, fitRenderedText } from './layer-layout';
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
    { label: '2.35:1', value: '2.35:1', category: 'Landscape', vw: 124, vh: 53, rw: 2.35, rh: 1 },
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
    private overlay!: HTMLDialogElement;
    private dialog = createPanelDialog('mm-cp-dialog-title');
    private onInsert: OnInsert;
    private selectedTemplate = 0;
    private currentTitle = '';
    private currentSubtitle = '';
    private previewFrame!: HTMLIFrameElement;
    private currentRatioIdx = 3; // 默认 4:5，适合封面
    private mediaId: string = MEDIA_PRESETS[0].id;
    private drafts: Record<string, MediaDraft> = {};
    private textEditor?: ReturnType<typeof mountCoverTextEditor>;
    private previewObserver?: ResizeObserver;

    constructor(onInsert: OnInsert) {
        this.onInsert = onInsert;
        this.buildDom();
        this.injectStyles();
        if (typeof ResizeObserver !== 'undefined') {
            this.previewObserver = new ResizeObserver(() => { if (this.overlay.open) this.updatePreviewBoxSize(); });
            this.previewObserver.observe(this.overlay.querySelector('.mm-cp-preview-wrap')!);
        }
    }

    destroy() { this.previewObserver?.disconnect(); this.textEditor?.destroy(); this.dialog.destroy(); }

    // ─── DOM Construction ────────────────────────────────────────────────────

    private buildDom() {
        this.overlay = this.dialog.element;
        this.overlay.classList.add('mm-cp-overlay');
        this.overlay.innerHTML = `
<div class="mm-cp-panel">
  <div class="mm-cp-header">
    <span class="mm-cp-title" id="mm-cp-dialog-title">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style="vertical-align:-2px;margin-right:6px">
        <rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
        <line x1="1" y1="5.5" x2="14" y2="5.5" stroke="currentColor" stroke-width="1"/>
        <line x1="4" y1="8.5" x2="11" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="4" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      封面生成
    </span>
    <button type="button" class="mm-cp-close" aria-label="关闭封面面板">✕</button>
  </div>

  <div class="mm-cp-body">
    <!-- Left: controls -->
    <div class="mm-cp-controls">
      <label class="mm-cp-section-label" for="mm-cp-media">媒体 / 展示位置</label>
      <select class="mm-cp-input" id="mm-cp-media">${MEDIA_PRESETS.map(p => `<option value="${p.id}">${p.name} · ${p.ratio}</option>`).join('')}</select>
      <select class="mm-cp-input" id="mm-cp-scope" aria-label="封面编辑范围"><option value="all">统一编辑所有版本</option><option value="one">仅编辑当前版本</option></select>
      <p class="mm-cp-media-note" id="mm-cp-media-note"></p>
      <p class="mm-cp-media-note">统一编辑同步内容和图层，各比例重新适配布局。独立微调请选“仅编辑当前版本”。封面暂存在本次会话，刷新会丢失，请及时下载。</p>
      <fieldset class="mm-cp-type-tools"><legend>图层 / LAYERS</legend>
        <div class="mm-cp-text-actions"><button type="button" id="mm-cp-add-text">＋ 文字</button><button type="button" id="mm-cp-add-image">＋ 图片</button><button type="button" id="mm-cp-auto-layout">自适应排版</button></div>
        <input id="mm-cp-image-file" type="file" accept="image/png,image/jpeg,image/webp" hidden multiple>
        <p id="mm-cp-layer-status" role="status">点击图层选择；列表从上到下对应前景到背景。</p>
        <div id="mm-cp-layers" aria-label="封面图层"></div>
        <div class="mm-cp-text-actions" id="mm-cp-layer-actions"><button type="button" data-layer-action="up" aria-label="图层上移">↑ 上移</button><button type="button" data-layer-action="down" aria-label="图层下移">↓ 下移</button><button type="button" data-layer-action="duplicate">复制</button><button type="button" data-layer-action="hide">显示 / 隐藏</button><button type="button" data-layer-action="delete" aria-label="删除选中图层">删除</button></div>
      </fieldset>
      <div class="mm-cp-section-label">文字内容</div>
      <label for="mm-cp-title-input">主标题</label>
      <textarea class="mm-cp-input" id="mm-cp-title-input" placeholder="输入封面标题" rows="3"></textarea>
      <label for="mm-cp-subtitle-input">副标题</label>
      <textarea class="mm-cp-input" id="mm-cp-subtitle-input" placeholder="副标题 / 简介" rows="2"></textarea>
      <fieldset class="mm-cp-type-tools"><legend>文字设计</legend>
        <select class="mm-cp-input" id="mm-cp-text-target" aria-label="编辑文字图层"><option value="title">主标题</option><option value="subtitle">副标题</option></select>
        <div class="mm-cp-text-row"><label for="mm-cp-text-size">字号 px</label><input id="mm-cp-text-size" type="number" min="8" max="600" step="1" value="60"><button type="button" id="mm-cp-size-down" aria-label="封面字号减小">−</button><button type="button" id="mm-cp-size-up" aria-label="封面字号增大">＋</button></div>
        <div class="mm-cp-text-row"><label for="mm-cp-text-width">文本框宽度 %</label><input id="mm-cp-text-width" type="number" min="10" max="100" step="1" value="100"></div>
        <div class="mm-cp-text-row"><label for="mm-cp-layer-color">文字颜色</label><input id="mm-cp-layer-color" type="color" value="#172033"><label for="mm-cp-layer-bg">衬底</label><input id="mm-cp-layer-bg" type="color" value="#ffffff"></div>
        <div class="mm-cp-align-tools" id="mm-cp-layer-align" role="group" aria-label="文字对齐">${[['left','左对齐'],['center','居中对齐'],['right','右对齐'],['justify','两端对齐'],['distributed','分散对齐（末行也齐行）']].map(([value,label]) => `<button type="button" data-cover-align="${value}" aria-label="${label}" title="${label}" aria-pressed="false">${label}</button>`).join('')}</div>
        <select class="mm-cp-input" id="mm-cp-image-fit" aria-label="图片适配方式"><option value="contain">完整显示图片</option><option value="cover">填满图框（裁切）</option></select>
        <div class="mm-cp-text-actions"><button type="button" id="mm-cp-edit-text">编辑文字</button><button type="button" id="mm-cp-reset-text">复位位置</button><button type="button" id="mm-cp-text-undo" aria-label="撤销封面文字调整">↶</button><button type="button" id="mm-cp-text-redo" aria-label="重做封面文字调整">↷</button></div>
        <p>角点缩放文字 · 侧点调整换行<br>双击编辑 · Esc 取消 · ⌘/Ctrl Enter 完成<br>撤销记录仅限当前画布，切换媒体或模板后重置。</p>
      </fieldset>

      <div class="mm-cp-section-label" style="margin-top:16px">选择模板</div>
      <div class="mm-cp-template-grid" id="mm-cp-template-grid"></div>

      <details class="mm-cp-ai-options"><summary>AI 生成（可选）</summary>
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
      </details>
    </div>

    <!-- Right: preview + ratio selector -->
    <div class="mm-cp-preview-wrap">
      <div class="mm-cp-preview-header">
        <div class="mm-cp-section-label">预览</div>
        <span class="mm-cp-drag-hint">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:3px">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
          拖动移动 · 双击编辑 · 控制点缩放
        </span>
      </div>

      <!-- Preview container (centers the box) -->
      <div class="mm-cp-preview-container" id="mm-cp-preview-container">
        <div class="mm-cp-preview-box" id="mm-cp-preview-box">
          <iframe class="mm-cp-iframe" id="mm-cp-iframe" sandbox="allow-same-origin"></iframe>
        </div>
      </div>

      <!-- Ratio Section (mirrors image-panel) -->
      <details class="mm-cp-ratio-section"><summary>自定义出图比例</summary>
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
      </details>

      <div id="mm-cp-media-overview" class="mm-cp-media-overview" aria-label="各媒体封面预览"></div>
      <button class="mm-cp-insert-btn" id="mm-cp-download">下载当前版本 PNG</button>
      <button class="mm-cp-insert-btn" id="mm-cp-insert-btn">插入当前封面</button>
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
                const template = document.createElement('div'); template.innerHTML = COVER_TEMPLATES[this.selectedTemplate].html;
                this.previewFrame.contentDocument?.querySelectorAll('.mm-cover-text,.mm-cover-image').forEach(el => template.querySelector('.mm-cover')!.append(el.cloneNode(true)));
                this.fullRebuildPreview(template.innerHTML);
                this.rememberMedia(true);
            });
        });
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    private bindEvents() {
        this.overlay.querySelector('#mm-cp-add-text')!.addEventListener('click', () => this.textEditor?.addText());
        this.overlay.querySelector('#mm-cp-auto-layout')!.addEventListener('click', () => this.textEditor?.layout());
        const file = this.overlay.querySelector<HTMLInputElement>('#mm-cp-image-file')!;
        this.overlay.querySelector('#mm-cp-add-image')!.addEventListener('click', () => file.click());
        file.addEventListener('change', async () => {
            const editor = this.textEditor;
            const status = this.overlay.querySelector('#mm-cp-layer-status')!;
            for (const image of Array.from(file.files || [])) {
                if (!['image/png','image/jpeg','image/webp'].includes(image.type) || image.size > 10 * 1024 * 1024) { status.textContent = '仅支持 10MB 以内的 PNG、JPEG、WebP 图片。'; continue; }
                try {
                    const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(image); });
                    const decoded = new Image(); decoded.src = src; await decoded.decode();
                    if (editor !== this.textEditor || !this.overlay.open) break;
                    editor?.addImage(src, image.name); status.textContent = '图片已添加，可拖动、缩放或选择完整显示 / 裁切。';
                } catch { status.textContent = '图片无法读取，请换一张图片重试。'; }
            }
            file.value = '';
        });
        this.overlay.querySelector('#mm-cp-layer-actions')!.addEventListener('click', e => { const action = (e.target as HTMLElement).closest<HTMLElement>('[data-layer-action]')?.dataset.layerAction; if (action) this.textEditor?.action(action); });
        for (const [id, property] of [['color','color'],['bg','backgroundColor']] as const) this.overlay.querySelector(`#mm-cp-layer-${id}`)!.addEventListener('change', e => this.textEditor?.style(property, (e.target as HTMLInputElement).value));
        this.overlay.querySelector('#mm-cp-layer-align')!.addEventListener('click', e => { const value = (e.target as Element).closest<HTMLElement>('[data-cover-align]')?.dataset.coverAlign; if (value) this.textEditor?.align(value); });
        this.overlay.querySelector('#mm-cp-image-fit')!.addEventListener('change', e => this.textEditor?.style('objectFit', (e.target as HTMLSelectElement).value));
        const size = this.overlay.querySelector<HTMLInputElement>('#mm-cp-text-size')!;
        this.overlay.querySelector('#mm-cp-text-target')!.addEventListener('change', e => this.textEditor?.select((e.target as HTMLSelectElement).value));
        size.addEventListener('change', () => this.textEditor?.size(size.valueAsNumber));
        this.overlay.querySelector('#mm-cp-size-down')!.addEventListener('click', () => this.textEditor?.size(size.valueAsNumber - 1));
        this.overlay.querySelector('#mm-cp-size-up')!.addEventListener('click', () => this.textEditor?.size(size.valueAsNumber + 1));
        this.overlay.querySelector('#mm-cp-text-width')!.addEventListener('change', e => this.textEditor?.width((e.target as HTMLInputElement).valueAsNumber));
        this.overlay.querySelector('#mm-cp-edit-text')!.addEventListener('click', () => this.textEditor?.edit());
        this.overlay.querySelector('#mm-cp-reset-text')!.addEventListener('click', () => this.textEditor?.resetPosition());
        this.overlay.querySelector('#mm-cp-text-undo')!.addEventListener('click', () => this.textEditor?.undo());
        this.overlay.querySelector('#mm-cp-text-redo')!.addEventListener('click', () => this.textEditor?.redo());
        this.overlay.querySelector('#mm-cp-media')!.addEventListener('change', event => this.switchMedia((event.target as HTMLSelectElement).value));
        this.overlay.querySelector('#mm-cp-download')!.addEventListener('click', () => { void this.downloadMedia(); });
        this.overlay.querySelector('.mm-cp-close')!.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Text inputs: update DOM directly (preserve drag positions)
        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        const subtitleInput = this.overlay.querySelector('#mm-cp-subtitle-input') as HTMLInputElement;

        titleInput.addEventListener('input', () => {
            this.currentTitle = titleInput.value;
            this.textEditor?.text('title', titleInput.value);
        });
        subtitleInput.addEventListener('input', () => {
            this.currentSubtitle = subtitleInput.value;
            this.textEditor?.text('subtitle', subtitleInput.value);
        });

        // AI generate
        this.overlay.querySelector('#mm-cp-generate-btn')!.addEventListener('click', () => this.onGenerate());

        // Insert button
        this.overlay.querySelector('#mm-cp-insert-btn')!.addEventListener('click', () => {
            const html = this.cleanCoverHtml();
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
        this.overlay.querySelector('#mm-cp-ratio-reset')!.addEventListener('click', () => {
            const preset = MEDIA_PRESETS.find(p => p.id === this.mediaId)!;
            this.selectAspectRatio(ASPECT_RATIOS.findIndex(r => r.value === preset.ratio));
        });

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
        const cover = this.previewFrame.contentDocument?.querySelector<HTMLElement>('.mm-cover');
        if (cover) { const size = this.mediaSize(); adaptiveLayout(cover, size.width, size.height); this.textEditor?.refresh(); }
        this.rememberMedia(false);
    }

    /** 根据比例计算并更新预览框尺寸（最大 300px 高 / 380px 宽） */
    private updatePreviewBoxSize() {
        const r = ASPECT_RATIOS[this.currentRatioIdx];
        const available = this.overlay.querySelector<HTMLElement>('.mm-cp-preview-wrap')?.clientWidth || 560;
        const MAX_H = Math.max(240, Math.min(440, window.innerHeight * .48)), MAX_W = Math.max(200, available - 48);
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
        const fitScale = Math.min(1, MAX_W / w, MAX_H / h); w *= fitScale; h *= fitScale;
        const box = this.overlay.querySelector<HTMLElement>('#mm-cp-preview-box')!;
        const frame = this.previewFrame;
        box.style.width = w + 'px';
        box.style.height = h + 'px';
        const size = this.mediaSize();
        frame.style.width = size.width + 'px';
        frame.style.height = size.height + 'px';
        frame.style.transformOrigin = 'top left';
        frame.style.transform = `scale(${w / size.width})`;
        if (frame.contentDocument?.body) frame.contentDocument.body.style.fontSize = `${Math.min(size.width, size.height) / 22}px`;
        this.textEditor?.refresh();
    }

    // ─── Preview ──────────────────────────────────────────────────────────────

    /** 完全重建 iframe（切换模板 / AI 生成时调用）*/
    private fullRebuildPreview(rawHtml: string) {
        this.textEditor?.destroy();
        this.textEditor = undefined;
        const injected = this.injectTextIntoHtml(rawHtml);

        // 收集宿主页面的 CSS 变量，注入到 iframe :root
        const s = getComputedStyle(document.body);
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
    .mm-cover-title,.mm-cover-subtitle { color:#172033; background-color:#fff; opacity:1; white-space:pre-wrap; word-break:normal; overflow-wrap:anywhere; }
  </style>
</head>
<body>${injected}</body>
</html>`;

        const doc = this.previewFrame.contentDocument!;
        doc.open();
        doc.write(docContent);
        doc.close();

        this.updatePreviewBoxSize();
        this.makeDraggable();
        void doc.fonts?.ready.then(() => { if (this.previewFrame.contentDocument === doc) { const root = doc.querySelector<HTMLElement>('.mm-cover'); if (root) fitRenderedText(root); this.textEditor?.refresh(); } });
    }

    private injectTextIntoHtml(html: string): string {
        const tmp = document.createElement('div');
        tmp.innerHTML = sanitizeArticleHtml(html, 'cover');
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
        const cover = doc.querySelector<HTMLElement>('.mm-cover');
        if (!cover) return;
        const fresh = !cover.classList.contains('mm-layer-canvas');
        prepareCover(doc, cover);
        const dark = !!cover?.classList.contains('mm-cover-dark');
        const background = dark ? '#172033' : '#ffffff';
        const ink = dark ? '#ffffff' : '#172033';
        doc.querySelectorAll<HTMLElement>('.mm-cover-title,.mm-cover-subtitle').forEach(el => {
            // Opaque paired surfaces keep text readable even over custom gradients/images.
            if (fresh) { el.style.color = ink; el.style.backgroundColor = background; el.style.opacity = '1'; }
            el.style.borderRadius = '.08em';
            el.style.wordBreak = 'normal'; el.style.overflowWrap = 'anywhere';
        });
        const size = this.mediaSize(); adaptiveLayout(cover, size.width, size.height); fitRenderedText(cover);
        this.textEditor = mountCoverTextEditor(doc, {
            dimensions: () => this.mediaSize(),
            scale: () => this.previewFrame.getBoundingClientRect().width / (parseFloat(this.previewFrame.style.width) || 1),
            changed: () => {
                this.currentTitle = doc.querySelector('.mm-cover-title')?.textContent || '';
                this.currentSubtitle = doc.querySelector('.mm-cover-subtitle')?.textContent || '';
                this.overlay.querySelector<HTMLTextAreaElement>('#mm-cp-title-input')!.value = this.currentTitle;
                this.overlay.querySelector<HTMLTextAreaElement>('#mm-cp-subtitle-input')!.value = this.currentSubtitle;
                this.rememberMedia(true);
            },
            selected: state => {
                this.overlay.querySelectorAll<HTMLButtonElement>('[data-cover-align]').forEach(button => { button.disabled = state.image || !state.kind; button.setAttribute('aria-pressed', String(!state.image && button.dataset.coverAlign === state.alignment)); });
                const target = this.overlay.querySelector<HTMLSelectElement>('#mm-cp-text-target')!;
                target.replaceChildren(...state.layers.map(layer => { const option = document.createElement('option'); option.value = layer.id; option.textContent = layer.name; return option; })); target.value = state.kind;
                const list = this.overlay.querySelector('#mm-cp-layers')!;
                list.replaceChildren(...state.layers.map(layer => { const button = document.createElement('button'); button.type = 'button'; button.className = 'mm-cp-layer-item'; button.setAttribute('aria-pressed', String(layer.selected)); button.textContent = `${layer.hidden ? '○' : '●'} ${layer.name}`; button.addEventListener('click', () => this.textEditor?.select(layer.id)); return button; }));
                this.overlay.querySelector<HTMLInputElement>('#mm-cp-text-size')!.disabled = state.image;
                this.overlay.querySelector<HTMLSelectElement>('#mm-cp-image-fit')!.disabled = !state.image;
                this.overlay.querySelector<HTMLInputElement>('#mm-cp-text-size')!.value = String(state.size);
                this.overlay.querySelector<HTMLInputElement>('#mm-cp-text-width')!.value = String(state.width);
                this.overlay.querySelector<HTMLButtonElement>('#mm-cp-text-undo')!.disabled = !state.canUndo;
                this.overlay.querySelector<HTMLButtonElement>('#mm-cp-text-redo')!.disabled = !state.canRedo;
            },
        });
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
            this.rememberMedia(true);
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
        if (Object.keys(this.drafts).length) { this.dialog.open(); this.switchMedia(this.mediaId); return; }
        this.currentTitle = title;
        this.currentSubtitle = subtitle;
        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        const subtitleInput = this.overlay.querySelector('#mm-cp-subtitle-input') as HTMLInputElement;
        titleInput.value = title;
        subtitleInput.value = subtitle;
        this.dialog.open();
        // 初始比例（4:5）
        this.selectAspectRatio(this.currentRatioIdx);
        this.fullRebuildPreview(COVER_TEMPLATES[this.selectedTemplate].html);
        for (const preset of MEDIA_PRESETS) this.drafts[preset.id] = {
            title, subtitle, html: COVER_TEMPLATES[this.selectedTemplate].html,
            ratio: ASPECT_RATIOS.findIndex(r => r.value === preset.ratio),
        };
        this.switchMedia(this.mediaId);
    }

    close() {
        this.rememberMedia(false);
        this.dialog.close();
    }

    private cleanCoverHtml() {
        const body = this.previewFrame.contentDocument?.body.cloneNode(true) as HTMLElement | undefined;
        if (!body) return '';
        body.querySelectorAll('[data-mm-cover-editor]').forEach(el => el.remove());
        body.querySelectorAll<HTMLElement>(LAYER_SELECTOR).forEach(el => {
            for (const prop of ['outline', 'outline-offset', 'cursor', 'user-select', 'transition', 'touch-action']) el.style.removeProperty(prop);
            el.removeAttribute('title');
            el.removeAttribute('contenteditable'); el.removeAttribute('tabindex'); el.removeAttribute('aria-label');
        });
        return sanitizeArticleHtml(body.innerHTML, 'cover');
    }

    private mediaSize(id = this.mediaId, ratio = this.currentRatioIdx) {
        const preset = MEDIA_PRESETS.find(p => p.id === id)!;
        const r = ASPECT_RATIOS[ratio];
        return { width: preset.width, height: r.value === preset.ratio ? preset.height : Math.round(preset.width * r.rh / r.rw) };
    }

    private rememberMedia(propagate: boolean) {
        if (!this.drafts[this.mediaId]) return;
        const next = { title: this.currentTitle, subtitle: this.currentSubtitle, html: this.cleanCoverHtml(), ratio: this.currentRatioIdx };
        const shared = propagate && this.overlay.querySelector<HTMLSelectElement>('#mm-cp-scope')!.value === 'all';
        this.drafts = updateMediaDrafts(this.drafts, this.mediaId, next, shared);
        if (shared) for (const [id, draft] of Object.entries(this.drafts)) {
            if (id !== this.mediaId) draft.html = this.adaptHtml(draft.html, id, draft.ratio);
        }
        this.renderMediaOverview();
    }

    private adaptHtml(html: string, id: string, ratio: number) {
        const holder = document.createElement('div'); holder.innerHTML = sanitizeArticleHtml(html, 'cover');
        const root = holder.querySelector<HTMLElement>('.mm-cover');
        if (root) { prepareCover(document, root); const s = this.mediaSize(id, ratio); adaptiveLayout(root, s.width, s.height, true); }
        return sanitizeArticleHtml(holder.innerHTML, 'cover');
    }

    private switchMedia(id: string) {
        if (!this.drafts[id]) return;
        if (id !== this.mediaId) this.rememberMedia(false);
        this.mediaId = id;
        const draft = this.drafts[id];
        this.currentTitle = draft.title; this.currentSubtitle = draft.subtitle;
        this.currentRatioIdx = draft.ratio;
        this.overlay.querySelector<HTMLSelectElement>('#mm-cp-media')!.value = id;
        this.overlay.querySelector<HTMLInputElement>('#mm-cp-title-input')!.value = draft.title;
        this.overlay.querySelector<HTMLInputElement>('#mm-cp-subtitle-input')!.value = draft.subtitle;
        this.fullRebuildPreview(draft.html);
        this.selectAspectRatio(draft.ratio);
    }

    private renderMediaOverview() {
        const preset = MEDIA_PRESETS.find(p => p.id === this.mediaId)!;
        const size = this.mediaSize();
        const note = this.overlay.querySelector('#mm-cp-media-note')!;
        note.textContent = `${size.width} × ${size.height}px · ${ASPECT_RATIOS[this.currentRatioIdx].value}。${preset.note} `;
        const link = document.createElement('a'); link.href = preset.source; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '比例参考 ↗'; note.append(link);
        const host = this.overlay.querySelector('#mm-cp-media-overview')!; host.replaceChildren();
        const vars = this.previewFrame.contentDocument?.querySelector('style')?.textContent || '';
        for (const p of MEDIA_PRESETS) {
            const draft = this.drafts[p.id]; if (!draft) continue;
            const item = document.createElement('button'); item.type = 'button'; item.className = 'mm-cp-media-card';
            item.setAttribute('aria-pressed', String(p.id === this.mediaId));
            const frame = document.createElement('iframe'); frame.tabIndex = -1; frame.setAttribute('sandbox', ''); frame.title = p.name;
            const s = this.mediaSize(p.id, draft.ratio), scale = Math.min(100 / s.width, 70 / s.height);
            const image = document.createElement('div'); image.style.cssText = `width:${s.width * scale}px;height:${s.height * scale}px;overflow:hidden;margin:auto;pointer-events:none`;
            frame.style.cssText = `width:${s.width}px;height:${s.height}px;border:0;transform:scale(${scale});transform-origin:top left;pointer-events:none`;
            const tmp = document.createElement('div'); tmp.innerHTML = draft.html;
            const title = tmp.querySelector('.mm-cover-title'), subtitle = tmp.querySelector('.mm-cover-subtitle');
            if (title) title.textContent = draft.title; if (subtitle) subtitle.textContent = draft.subtitle;
            const root = tmp.querySelector<HTMLElement>('.mm-cover');
            if (root) { prepareCover(document, root); adaptiveLayout(root, s.width, s.height); }
            frame.srcdoc = `<style>${vars} body{font-size:${Math.min(s.width,s.height)/22}px}</style>${sanitizeArticleHtml(tmp.innerHTML, 'cover')}`;
            const label = document.createElement('span'); label.textContent = `${p.name} · ${ASPECT_RATIOS[draft.ratio].value}`;
            image.append(frame); item.append(image, label); item.addEventListener('click', () => this.switchMedia(p.id)); host.append(item);
        }
    }

    private async downloadMedia() {
        const button = this.overlay.querySelector<HTMLButtonElement>('#mm-cp-download')!;
        button.disabled = true;
        try {
            const doc = this.previewFrame.contentDocument!;
            await doc.fonts.ready;
            const size = this.mediaSize();
            const copy = doc.createElement('div'); copy.style.cssText = `width:${size.width}px;height:${size.height}px;font-size:${Math.min(size.width,size.height)/22}px;overflow:hidden`;
            copy.innerHTML = this.cleanCoverHtml(); doc.body.append(copy);
            try {
                const png = await toPng(copy, { width: size.width, height: size.height, pixelRatio: 1, skipFonts: true });
                const blob = await (await fetch(png)).blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.download = `${this.mediaId}-${size.width}x${size.height}.png`; a.href = url;
                document.body.append(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                this.overlay.querySelector('#mm-cp-media-note')!.textContent = `已生成 ${size.width} × ${size.height}px PNG，并发起下载，请在下载记录中确认。`;
            } finally { copy.remove(); }
        } catch { this.overlay.querySelector('#mm-cp-media-note')!.textContent = '导出失败，请检查图片资源是否可读取后重试。'; }
        finally { button.disabled = false; }
    }
}

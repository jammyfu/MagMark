/**
 * MagMark Image Panel — v1.5.1
 *
 * 图片管理面板（四选项卡）：
 *   • 占位图  — 选择比例，生成 SVG 占位图
 *   • 上传图片 — 拖拽 / 点击选择本地图片文件
 *   • 图片链接 — 直接输入图片 URL（支持网络图片）
 *   • AI 生成  — Gemini Imagen 3 / OpenAI DALL-E 3
 *
 * 图文混排选项：居中 / 浮左 / 浮右 / 全宽 + 宽度滑块
 * 生成后插入扩展 Markdown：![alt](url){.float-left width=45%}
 */

export interface ImageInsertOptions {
    src: string;        // data URL、http URL 或 mm-img://uuid
    alt: string;
    caption?: string;
    layout: 'center' | 'float-left' | 'float-right' | 'full' | 'inline';
    width?: number;     // percentage, e.g. 50
}

export type ImageInsertCallback = (opts: ImageInsertOptions) => void;

export interface EditPreset {
    layout: ImageInsertOptions['layout'];
    width: number;
    alt: string;
    caption: string;
}

// Sorted Portrait → Square → Landscape
const ASPECT_RATIOS = [
    { label: '9:16', value: '9:16', category: 'Portrait', vw: 70, vh: 124, rw: 9, rh: 16 },
    { label: '2:3', value: '2:3', category: 'Portrait', vw: 82, vh: 123, rw: 2, rh: 3 },
    { label: '3:4', value: '3:4', category: 'Portrait', vw: 93, vh: 124, rw: 3, rh: 4 },
    { label: '4:5', value: '4:5', category: 'Portrait', vw: 99, vh: 123, rw: 4, rh: 5 },
    { label: '1:1', value: '1:1', category: 'Square', vw: 124, vh: 124, rw: 1, rh: 1 },
    { label: '5:4', value: '5:4', category: 'Landscape', vw: 124, vh: 99, rw: 5, rh: 4 },
    { label: '4:3', value: '4:3', category: 'Landscape', vw: 124, vh: 93, rw: 4, rh: 3 },
    { label: '3:2', value: '3:2', category: 'Landscape', vw: 124, vh: 82, rw: 3, rh: 2 },
    { label: '16:9', value: '16:9', category: 'Landscape', vw: 124, vh: 70, rw: 16, rh: 9 },
    { label: '21:9', value: '21:9', category: 'Landscape', vw: 124, vh: 53, rw: 21, rh: 9 },
];

const LS_GEMINI_KEY = 'magmark_gemini_apikey';
const LS_OPENAI_KEY = 'magmark_openai_apikey';
const LS_AI_PROVIDER = 'magmark_ai_provider';

export class ImagePanel {
    private overlay: HTMLElement | null = null;
    private onInsert: ImageInsertCallback;
    private currentImageSrc = '';
    private currentTab: 'placeholder' | 'upload' | 'url' | 'ai' = 'placeholder';
    private editPreset: EditPreset | null = null;
    private currentRatioIdx = 4; // default 1:1

    constructor(onInsert: ImageInsertCallback) {
        this.onInsert = onInsert;
    }

    /** 打开面板 */
    open() {
        this.editPreset = null;
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            return;
        }
        this.createPanel();
    }

    /** 以现有图片数据打开（点击预览区图片时调用） */
    openWithSrc(src: string, preset: EditPreset) {
        this.editPreset = preset;
        if (this.overlay) this.destroy();
        this.createPanel();
        // Pre-populate
        this.setPreviewImage(src, preset.alt || '图片');
        // Switch to URL tab if it's a web image, otherwise show preview directly
        if (src.startsWith('http') || src.startsWith('//')) {
            this.switchTab('url');
            const urlInput = this.overlay?.querySelector<HTMLInputElement>('#mm-ip-url-input');
            if (urlInput) urlInput.value = src;
        } else {
            this.switchTab('upload');
        }
        // Apply preset settings
        this.applyPreset(preset);
    }

    /** 关闭面板 */
    close() {
        if (this.overlay) this.overlay.style.display = 'none';
    }

    /** 销毁面板 */
    destroy() {
        this.overlay?.remove();
        this.overlay = null;
        this.currentImageSrc = '';
        this.currentTab = 'placeholder';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOM Creation
    // ─────────────────────────────────────────────────────────────────────────

    private createPanel() {
        const overlay = document.createElement('div');
        overlay.id = 'mm-image-panel-overlay';
        overlay.innerHTML = this.buildHTML();
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.injectStyles();
        this.attachEventListeners();
        this.currentRatioIdx = 4; // 1:1 default
        this.selectAspectRatio(4);
    }

    private injectStyles() {
        if (document.getElementById('mm-ip-styles')) return;
        const style = document.createElement('style');
        style.id = 'mm-ip-styles';
        style.textContent = `
            #mm-image-panel-overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,.55);
                backdrop-filter: blur(6px);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
            }
            #mm-image-panel {
                background: #1a1a22;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 16px;
                width: 540px; max-width: calc(100vw - 32px);
                max-height: calc(100vh - 48px);
                overflow-y: auto;
                color: #e8e8f0;
                font-family: 'Inter', sans-serif;
                font-size: 13px;
                box-shadow: 0 24px 64px rgba(0,0,0,.6);
            }
            .mm-ip-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 20px 24px 0;
            }
            .mm-ip-title { font-size: 16px; font-weight: 700; color: #d4af37; }
            .mm-ip-close {
                background: transparent; border: none; color: #888;
                font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
            }
            .mm-ip-close:hover { background: rgba(255,255,255,.08); color: #fff; }
            .mm-ip-tabs {
                display: flex; gap: 4px;
                padding: 16px 24px 0;
                border-bottom: 1px solid rgba(255,255,255,.07);
            }
            .mm-ip-tab {
                background: transparent; border: none;
                padding: 8px 14px; border-radius: 8px 8px 0 0;
                color: #888; font-size: 12px; font-weight: 600;
                cursor: pointer; transition: all .2s;
            }
            .mm-ip-tab:hover { color: #ccc; background: rgba(255,255,255,.04); }
            .mm-ip-tab.active { color: #d4af37; background: rgba(212,175,55,.08); border-bottom: 2px solid #d4af37; }
            .mm-ip-tabcontent { padding: 20px 24px 0; }
            .mm-ip-hint { color: #666; font-size: 11px; margin-bottom: 12px; }

            /* ── Aspect Ratio Selector ── */
            .mm-ip-ar-header {
                display: flex; align-items: center; justify-content: space-between;
                margin-bottom: 12px;
            }
            .mm-ip-ar-label {
                display: flex; align-items: center; gap: 6px;
                color: #888; font-size: 11px; font-weight: 700;
                text-transform: uppercase; letter-spacing: .08em;
            }
            .mm-ip-ar-reset {
                background: transparent; border: none;
                color: #555; font-size: 11px; cursor: pointer;
                text-decoration: underline; padding: 0;
            }
            .mm-ip-ar-reset:hover { color: #e8e8f0; }
            .mm-ip-ar-panel {
                background: rgba(255,255,255,.03);
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 12px; padding: 20px 16px 16px;
                display: flex; flex-direction: column; align-items: center; gap: 20px;
                margin-bottom: 16px;
            }
            /* Visual preview box */
            .mm-ip-ar-visual {
                width: 160px; height: 160px;
                background: rgba(255,255,255,.04);
                border-radius: 10px;
                position: relative;
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,.08);
                transition: all .2s;
            }
            .mm-ip-ar-visual.swappable { cursor: pointer; }
            .mm-ip-ar-visual.swappable:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.14); }
            .mm-ip-ar-inverse {
                position: absolute;
                border: 2px dashed rgba(255,255,255,.2);
                pointer-events: none;
                transition: all .3s;
                opacity: .45;
            }
            .mm-ip-ar-active {
                position: relative;
                border: 2px solid #d4af37;
                display: flex; align-items: center; justify-content: center;
                transition: all .3s;
                z-index: 10;
                box-shadow: 0 0 12px rgba(212,175,55,.25);
            }
            .mm-ip-ar-active-label {
                font-size: 11px; font-weight: 800;
                color: #d4af37;
                background: rgba(20,20,30,.85);
                padding: 2px 6px; border-radius: 4px;
                letter-spacing: .04em;
            }
            /* Swap hint */
            .mm-ip-ar-swap-hint {
                position: absolute; bottom: 4px; right: 6px;
                font-size: 9px; color: #555;
                transition: color .2s;
            }
            .mm-ip-ar-visual.swappable:hover .mm-ip-ar-swap-hint { color: #888; }
            /* Category buttons */
            .mm-ip-ar-cats {
                display: flex; gap: 8px; width: 100%; max-width: 280px;
            }
            .mm-ip-ar-cat {
                flex: 1; padding: 5px 4px;
                font-size: 10px; font-weight: 700; text-transform: uppercase;
                border-radius: 20px; border: 1px solid rgba(255,255,255,.1);
                background: transparent; color: #555; cursor: pointer;
                transition: all .2s; letter-spacing: .04em;
            }
            .mm-ip-ar-cat:hover:not(:disabled) { border-color: rgba(255,255,255,.25); color: #bbb; }
            .mm-ip-ar-cat.active { background: rgba(212,175,55,.18); color: #d4af37; border-color: rgba(212,175,55,.5); }
            .mm-ip-ar-cat:disabled { opacity: .25; cursor: not-allowed; }
            /* Slider */
            .mm-ip-ar-slider-wrap {
                width: 100%; padding: 0 4px;
                position: relative;
            }
            .mm-ip-ar-slider {
                width: 100%; height: 4px;
                -webkit-appearance: none; appearance: none;
                background: rgba(255,255,255,.12);
                border-radius: 4px; outline: none; cursor: pointer;
                accent-color: #d4af37;
            }
            .mm-ip-ar-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px; height: 16px;
                background: #d4af37; border-radius: 50%;
                box-shadow: 0 0 6px rgba(212,175,55,.5);
                cursor: pointer;
            }
            .mm-ip-ar-ticks {
                display: flex; justify-content: space-between;
                padding: 0 2px;
                margin-top: 8px;
                pointer-events: none;
                user-select: none;
            }
            .mm-ip-ar-tick {
                display: flex; flex-direction: column; align-items: center;
                gap: 3px; width: 20px;
            }
            .mm-ip-ar-tick-bar {
                width: 1.5px; height: 6px;
                background: rgba(255,255,255,.15);
                border-radius: 1px;
                transition: background .2s;
            }
            .mm-ip-ar-tick.active .mm-ip-ar-tick-bar { background: #d4af37; }
            .mm-ip-ar-tick-label {
                font-size: 8.5px; font-family: monospace;
                color: rgba(255,255,255,.25);
                white-space: nowrap;
                transition: color .2s;
            }
            .mm-ip-ar-tick.active .mm-ip-ar-tick-label { color: #d4af37; font-weight: 700; }
            .mm-ip-dropzone {
                border: 2px dashed rgba(255,255,255,.15); border-radius: 10px;
                padding: 32px 20px; text-align: center; cursor: pointer;
                transition: all .2s; margin-bottom: 12px;
            }
            .mm-ip-dropzone:hover, .mm-ip-dropzone.drag-over {
                border-color: #d4af37; background: rgba(212,175,55,.05);
            }
            .mm-ip-drop-icon { font-size: 36px; margin-bottom: 8px; }
            .mm-ip-img-info { display: flex; gap: 16px; margin-bottom: 12px; color: #888; font-size: 11px; }
            .mm-ip-url-row { display: flex; gap: 8px; margin-bottom: 8px; }
            .mm-ip-url-row input { flex: 1; }
            .mm-ip-url-load {
                flex-shrink: 0;
                background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
                color: #ccc; padding: 0 14px; border-radius: 7px; cursor: pointer;
                font-size: 12px; transition: all .2s; white-space: nowrap;
            }
            .mm-ip-url-load:hover { border-color: #d4af37; color: #d4af37; }
            .mm-ip-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
            .mm-ip-row label { flex-shrink: 0; color: #888; font-size: 12px; min-width: 80px; }
            .mm-ip-row select {
                flex: 1; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
                color: #e8e8f0; padding: 6px 10px; border-radius: 7px; font-size: 12px;
            }
            .mm-ip-apikey-group { margin-bottom: 12px; }
            .mm-ip-key-wrap { display: flex; flex: 1; gap: 6px; align-items: center; }
            .mm-ip-key-wrap input { flex: 1; }
            .mm-ip-eye {
                background: transparent; border: none; color: #666; cursor: pointer;
                font-size: 16px; padding: 2px 4px;
            }
            .mm-ip-eye:hover { color: #ccc; }
            .mm-ip-ref-zone {
                display: flex; align-items: center; gap: 12px;
                border: 1px dashed rgba(255,255,255,.15); border-radius: 8px;
                padding: 8px 12px; cursor: pointer; min-height: 44px;
                transition: all .2s; margin-bottom: 4px;
            }
            .mm-ip-ref-zone:hover { border-color: #d4af37; background: rgba(212,175,55,.04); }
            .mm-ip-ref-zone span { font-size: 12px; color: #666; }
            .mm-ip-ref-clear {
                background: rgba(255,0,0,.15); border: none; color: #f88; border-radius: 4px;
                padding: 2px 6px; cursor: pointer; font-size: 11px; margin-left: auto;
            }
            .mm-ip-gen-btn {
                display: block; width: 100%; padding: 11px;
                background: linear-gradient(135deg, #d4af37, #b8942e);
                border: none; border-radius: 9px; color: #000;
                font-size: 14px; font-weight: 700; cursor: pointer;
                margin: 4px 0 12px; transition: all .2s;
            }
            .mm-ip-gen-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
            .mm-ip-gen-btn:disabled { opacity: .6; cursor: wait; transform: none; }
            .mm-ip-error {
                background: rgba(231,76,60,.15); border: 1px solid rgba(231,76,60,.3);
                border-radius: 7px; padding: 8px 12px; color: #e74c3c;
                font-size: 12px; margin-bottom: 12px;
            }
            .mm-ip-field { margin-bottom: 14px; }
            .mm-ip-field label { display: block; color: #888; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
            .mm-ip-field input, .mm-ip-field textarea {
                width: 100%; background: rgba(255,255,255,.05);
                border: 1px solid rgba(255,255,255,.1); border-radius: 8px;
                padding: 9px 12px; color: #e8e8f0; font-size: 13px;
                outline: none; transition: all .2s; resize: none;
            }
            .mm-ip-field input:focus, .mm-ip-field textarea:focus {
                border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,.15);
            }
            .mm-ip-preview-wrap { padding: 0 24px; margin-top: 16px; }
            .mm-ip-preview {
                background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
                border-radius: 10px; min-height: 80px;
                display: flex; align-items: center; justify-content: center;
                overflow: hidden;
            }
            .mm-ip-preview-empty { color: #444; font-size: 12px; }
            .mm-ip-preview img { max-width: 100%; max-height: 220px; object-fit: contain; border-radius: 8px; }
            .mm-ip-layout-section { padding: 16px 24px 0; }
            .mm-ip-layout-section > label { color: #888; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; display: block; margin-bottom: 8px; }
            .mm-ip-layout-btns { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
            .mm-ip-layout-btn {
                padding: 7px 14px;
                background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
                border-radius: 8px; color: #888; font-size: 12px; font-weight: 600;
                cursor: pointer; transition: all .2s;
            }
            .mm-ip-layout-btn:hover { border-color: #d4af37; color: #d4af37; }
            .mm-ip-layout-btn.active { background: #d4af37; color: #000; border-color: #d4af37; }
            #mm-ip-width-row { display: flex; align-items: center; gap: 10px; }
            #mm-ip-width-row label { color: #888; font-size: 12px; white-space: nowrap; }
            #mm-ip-width-row input[type=range] { flex: 1; accent-color: #d4af37; }
            #mm-ip-width-val { color: #d4af37; font-weight: 700; font-size: 12px; min-width: 32px; text-align: right; }
            .mm-ip-footer {
                display: flex; justify-content: flex-end; gap: 10px;
                padding: 20px 24px;
            }
            .mm-ip-md-btn {
                background: transparent; border: 1px solid rgba(255,255,255,.15);
                color: #888; padding: 9px 16px; border-radius: 8px;
                font-size: 13px; cursor: pointer; transition: all .2s;
            }
            .mm-ip-md-btn:not(:disabled):hover { border-color: #d4af37; color: #d4af37; }
            .mm-ip-md-btn:disabled { opacity: .35; cursor: default; }
            .mm-ip-insert-btn {
                background: linear-gradient(135deg, #d4af37, #b8942e);
                border: none; color: #000; padding: 9px 22px;
                border-radius: 8px; font-size: 13px; font-weight: 700;
                cursor: pointer; transition: all .2s;
            }
            .mm-ip-insert-btn:not(:disabled):hover { filter: brightness(1.12); transform: translateY(-1px); }
            .mm-ip-insert-btn:disabled { opacity: .35; cursor: default; transform: none; }
        `;
        document.head.appendChild(style);
    }

    private buildHTML(): string {
        const provider = localStorage.getItem(LS_AI_PROVIDER) || 'gemini';
        const geminiKey = localStorage.getItem(LS_GEMINI_KEY) || '';
        const openaiKey = localStorage.getItem(LS_OPENAI_KEY) || '';

        return `
<div id="mm-image-panel">
  <div class="mm-ip-header">
    <span class="mm-ip-title">🖼 插入图片</span>
    <button class="mm-ip-close" id="mm-ip-close">✕</button>
  </div>

  <!-- Tabs -->
  <div class="mm-ip-tabs">
    <button class="mm-ip-tab active" data-tab="placeholder">占位图</button>
    <button class="mm-ip-tab" data-tab="upload">上传图片</button>
    <button class="mm-ip-tab" data-tab="url">图片链接</button>
    <button class="mm-ip-tab" data-tab="ai">✨ AI 生成</button>
  </div>

  <!-- Tab: Placeholder -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-placeholder">

    <!-- Header -->
    <div class="mm-ip-ar-header">
      <label class="mm-ip-ar-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        占位图比例
      </label>
      <button class="mm-ip-ar-reset" id="mm-ip-ar-reset">重置 1:1</button>
    </div>

    <div class="mm-ip-ar-panel">

      <!-- Visual Preview (click to swap orientation) -->
      <div class="mm-ip-ar-visual" id="mm-ip-ar-visual">
        <div class="mm-ip-ar-inverse" id="mm-ip-ar-inverse"></div>
        <div class="mm-ip-ar-active" id="mm-ip-ar-active">
          <span class="mm-ip-ar-active-label" id="mm-ip-ar-active-label">1:1</span>
        </div>
        <span class="mm-ip-ar-swap-hint" id="mm-ip-ar-swap-hint">⇄ 点击翻转</span>
      </div>

      <!-- Category buttons -->
      <div class="mm-ip-ar-cats" id="mm-ip-ar-cats">
        <button class="mm-ip-ar-cat" data-cat="Portrait">竖向</button>
        <button class="mm-ip-ar-cat active" data-cat="Square">方形</button>
        <button class="mm-ip-ar-cat" data-cat="Landscape">横向</button>
      </div>

      <!-- Slider + ticks -->
      <div class="mm-ip-ar-slider-wrap">
        <input type="range" id="mm-ip-ar-slider" class="mm-ip-ar-slider"
               min="0" max="${ASPECT_RATIOS.length - 1}" step="1" value="4">
        <div class="mm-ip-ar-ticks" id="mm-ip-ar-ticks">
          ${ASPECT_RATIOS.map((r, i) => `
            <div class="mm-ip-ar-tick${i === 4 ? ' active' : ''}" data-idx="${i}">
              <div class="mm-ip-ar-tick-bar"></div>
              <span class="mm-ip-ar-tick-label">${r.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <div class="mm-ip-field">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-ph-caption" placeholder="图片说明文字…">
    </div>
  </div>

  <!-- Tab: Upload -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-upload" style="display:none">
    <div class="mm-ip-dropzone" id="mm-ip-dropzone">
      <div class="mm-ip-drop-icon">📁</div>
      <p>拖拽图片至此，或点击选择文件</p>
      <p class="mm-ip-hint">支持 PNG、JPG、GIF、WebP、SVG · 建议小于 2MB</p>
      <input type="file" id="mm-ip-file" accept="image/*" hidden>
    </div>
    <div class="mm-ip-img-info" id="mm-ip-upload-info" style="display:none">
      <span id="mm-ip-upload-dim">—</span>
      <span id="mm-ip-upload-size">—</span>
    </div>
    <div class="mm-ip-field" id="mm-ip-upload-caption-wrap" style="display:none">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-upload-caption" placeholder="图片说明文字…">
    </div>
  </div>

  <!-- Tab: URL -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-url" style="display:none">
    <div class="mm-ip-field">
      <label>图片地址（URL）</label>
      <div class="mm-ip-url-row">
        <input type="url" id="mm-ip-url-input"
               placeholder="https://example.com/image.jpg">
        <button class="mm-ip-url-load" id="mm-ip-url-load">加载预览</button>
      </div>
      <p class="mm-ip-hint">支持任何公开可访问的图片 URL，包括 CDN、GitHub、Unsplash 等</p>
    </div>
    <div class="mm-ip-field">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-url-caption" placeholder="图片说明文字…">
    </div>
    <div class="mm-ip-error" id="mm-ip-url-error" style="display:none"></div>
  </div>

  <!-- Tab: AI Generate -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-ai" style="display:none">
    <div class="mm-ip-row">
      <label>AI 提供商</label>
      <select id="mm-ip-provider">
        <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Gemini Imagen 3</option>
        <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI DALL-E 3</option>
      </select>
    </div>

    <div class="mm-ip-apikey-group" id="mm-ip-gemini-group"
         style="${provider !== 'gemini' ? 'display:none' : ''}">
      <div class="mm-ip-row">
        <label>Gemini API Key</label>
        <div class="mm-ip-key-wrap">
          <input type="password" id="mm-ip-gemini-key" value="${geminiKey}"
                 placeholder="AIza…" autocomplete="off">
          <button class="mm-ip-eye" data-target="mm-ip-gemini-key">👁</button>
        </div>
      </div>
    </div>

    <div class="mm-ip-apikey-group" id="mm-ip-openai-group"
         style="${provider !== 'openai' ? 'display:none' : ''}">
      <div class="mm-ip-row">
        <label>OpenAI API Key</label>
        <div class="mm-ip-key-wrap">
          <input type="password" id="mm-ip-openai-key" value="${openaiKey}"
                 placeholder="sk-…" autocomplete="off">
          <button class="mm-ip-eye" data-target="mm-ip-openai-key">👁</button>
        </div>
      </div>
    </div>

    <div class="mm-ip-field">
      <label>图片描述 (Prompt)</label>
      <textarea id="mm-ip-prompt" rows="3"
        placeholder="描述你想生成的图片，例如：一只在咖啡馆看书的猫，水彩画风格，温暖午后阳光透窗而入…"></textarea>
    </div>

    <div class="mm-ip-field">
      <label>参考图片（可选，用于风格参考）</label>
      <div class="mm-ip-ref-zone" id="mm-ip-ref-zone">
        <input type="file" id="mm-ip-ref-file" accept="image/*" hidden>
        <span id="mm-ip-ref-label">点击上传参考图片</span>
        <img id="mm-ip-ref-preview"
             style="display:none;max-height:72px;border-radius:4px;flex-shrink:0" alt="参考图">
        <button class="mm-ip-ref-clear" id="mm-ip-ref-clear" style="display:none">✕</button>
      </div>
    </div>

    <div class="mm-ip-field">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-ai-caption" placeholder="图片说明文字…">
    </div>

    <button class="mm-ip-gen-btn" id="mm-ip-gen-btn">
      <span id="mm-ip-gen-label">✨ 生成图片</span>
      <span id="mm-ip-gen-spinner" style="display:none">⏳ 生成中，请稍候…</span>
    </button>
    <div class="mm-ip-error" id="mm-ip-error" style="display:none"></div>
  </div>

  <!-- Shared Preview -->
  <div class="mm-ip-preview-wrap" id="mm-ip-preview-wrap">
    <div class="mm-ip-preview" id="mm-ip-preview">
      <span class="mm-ip-preview-empty">预览将在选图后显示</span>
    </div>
  </div>

  <!-- Layout Options -->
  <div class="mm-ip-layout-section">
    <label>图文混排</label>
    <div class="mm-ip-layout-btns">
      <button class="mm-ip-layout-btn active" data-layout="center"      title="居中">⬛ 居中</button>
      <button class="mm-ip-layout-btn"        data-layout="float-left"  title="浮左图文混排">◧ 浮左</button>
      <button class="mm-ip-layout-btn"        data-layout="float-right" title="浮右图文混排">浮右 ◨</button>
      <button class="mm-ip-layout-btn"        data-layout="full"        title="全宽">↔ 全宽</button>
    </div>
    <div class="mm-ip-row" id="mm-ip-width-row">
      <label>宽度 <span id="mm-ip-width-val">60%</span></label>
      <input type="range" id="mm-ip-width" min="20" max="100" value="60">
    </div>
  </div>

  <!-- Footer -->
  <div class="mm-ip-footer">
    <button class="mm-ip-md-btn" id="mm-ip-md-btn" disabled title="复制 Markdown 代码">📋 复制</button>
    <button class="mm-ip-insert-btn" id="mm-ip-insert-btn" disabled>插入 Markdown →</button>
  </div>
</div>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    private attachEventListeners() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        // Close
        q<HTMLButtonElement>('#mm-ip-close').addEventListener('click', () => this.close());
        this.overlay!.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Tabs
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-tab').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab as typeof this.currentTab));
        });

        // ── Placeholder: slider ────────────────────────────────────────────
        const arSlider = q<HTMLInputElement>('#mm-ip-ar-slider');
        arSlider.addEventListener('input', () => {
            this.selectAspectRatio(parseInt(arSlider.value));
        });

        // ── Placeholder: category buttons ──
        q('#mm-ip-ar-cats').addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.mm-ip-ar-cat') as HTMLButtonElement | null;
            if (!btn || btn.disabled) return;
            const cat = btn.dataset.cat;
            // Default index per category
            const targetMap: Record<string, number> = { Portrait: 0, Square: 4, Landscape: 8 };
            this.selectAspectRatio(targetMap[cat!] ?? 4);
        });

        // ── Placeholder: reset button ──
        q<HTMLButtonElement>('#mm-ip-ar-reset').addEventListener('click', () => {
            this.selectAspectRatio(4); // 1:1
        });

        // ── Placeholder: visual box swap ──────────────────────────────────
        q('#mm-ip-ar-visual').addEventListener('click', () => {
            const r = ASPECT_RATIOS[this.currentRatioIdx];
            // Find inverse label e.g. '16:9' -> '9:16'
            const parts = r.value.split(':');
            const inverse = `${parts[1]}:${parts[0]}`;
            const invIdx = ASPECT_RATIOS.findIndex(x => x.value === inverse);
            if (invIdx !== -1 && r.value !== '1:1') {
                this.selectAspectRatio(invIdx);
            }
        });

        // ── Upload ──────────────────────────────────────────────────────────
        const dropzone = q<HTMLElement>('#mm-ip-dropzone');
        const fileInput = q<HTMLInputElement>('#mm-ip-file');

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const file = e.dataTransfer?.files[0];
            if (file && file.type.startsWith('image/')) this.handleFileUpload(file);
        });
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (file) this.handleFileUpload(file);
        });

        // ── URL ─────────────────────────────────────────────────────────────
        q<HTMLButtonElement>('#mm-ip-url-load').addEventListener('click', () => this.handleUrlLoad());
        q<HTMLInputElement>('#mm-ip-url-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleUrlLoad();
        });

        // ── AI ──────────────────────────────────────────────────────────────
        // Reference image
        const refZone = q<HTMLElement>('#mm-ip-ref-zone');
        const refFile = q<HTMLInputElement>('#mm-ip-ref-file');
        refZone.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).id === 'mm-ip-ref-clear') return;
            refFile.click();
        });
        refFile.addEventListener('change', () => {
            const file = refFile.files?.[0];
            if (file) this.handleRefUpload(file);
        });
        q<HTMLButtonElement>('#mm-ip-ref-clear').addEventListener('click', (e) => {
            e.stopPropagation();
            q<HTMLImageElement>('#mm-ip-ref-preview').style.display = 'none';
            q<HTMLElement>('#mm-ip-ref-label').style.display = '';
            q<HTMLButtonElement>('#mm-ip-ref-clear').style.display = 'none';
            refFile.value = '';
        });

        // Provider switch
        q<HTMLSelectElement>('#mm-ip-provider').addEventListener('change', (e) => {
            const prov = (e.target as HTMLSelectElement).value;
            localStorage.setItem(LS_AI_PROVIDER, prov);
            q<HTMLElement>('#mm-ip-gemini-group').style.display = prov === 'gemini' ? '' : 'none';
            q<HTMLElement>('#mm-ip-openai-group').style.display = prov === 'openai' ? '' : 'none';
        });

        // Eye toggles
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-eye').forEach(btn => {
            btn.addEventListener('click', () => {
                const inp = this.overlay!.querySelector<HTMLInputElement>(`#${btn.dataset.target}`);
                if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
            });
        });

        // Save API keys
        q<HTMLInputElement>('#mm-ip-gemini-key').addEventListener('change', (e) => {
            localStorage.setItem(LS_GEMINI_KEY, (e.target as HTMLInputElement).value.trim());
        });
        q<HTMLInputElement>('#mm-ip-openai-key').addEventListener('change', (e) => {
            localStorage.setItem(LS_OPENAI_KEY, (e.target as HTMLInputElement).value.trim());
        });

        // Generate
        q<HTMLButtonElement>('#mm-ip-gen-btn').addEventListener('click', () => this.handleGenerate());

        // ── Layout ──────────────────────────────────────────────────────────
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlay!.querySelectorAll('.mm-ip-layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const layout = btn.dataset.layout as ImageInsertOptions['layout'];
                q<HTMLElement>('#mm-ip-width-row').style.display = layout === 'full' ? 'none' : '';
            });
        });

        q<HTMLInputElement>('#mm-ip-width').addEventListener('input', (e) => {
            q<HTMLElement>('#mm-ip-width-val').textContent = (e.target as HTMLInputElement).value + '%';
        });

        // ── Footer ──────────────────────────────────────────────────────────
        q<HTMLButtonElement>('#mm-ip-insert-btn').addEventListener('click', () => this.handleInsert());
        q<HTMLButtonElement>('#mm-ip-md-btn').addEventListener('click', () => this.handleCopyMarkdown());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tab switching
    // ─────────────────────────────────────────────────────────────────────────

    private switchTab(tab: typeof this.currentTab) {
        if (!this.overlay) return;
        this.currentTab = tab;
        this.overlay.querySelectorAll<HTMLButtonElement>('.mm-ip-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        this.overlay.querySelectorAll<HTMLElement>('.mm-ip-tabcontent').forEach(tc => {
            tc.style.display = 'none';
        });
        const tc = this.overlay.querySelector<HTMLElement>(`#mm-ip-tab-${tab}`);
        if (tc) tc.style.display = 'block';
    }

    private applyPreset(preset: EditPreset) {
        if (!this.overlay) return;
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        // Set layout
        this.overlay.querySelectorAll('.mm-ip-layout-btn').forEach(b => {
            const el = b as HTMLElement;
            el.classList.toggle('active', el.dataset.layout === preset.layout);
        });
        // Set width
        const widthInput = q<HTMLInputElement>('#mm-ip-width');
        widthInput.value = String(preset.width);
        q<HTMLElement>('#mm-ip-width-val').textContent = preset.width + '%';
        // Width row visibility
        q<HTMLElement>('#mm-ip-width-row').style.display = preset.layout === 'full' ? 'none' : '';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Placeholder
    // ─────────────────────────────────────────────────────────────────────────

    private selectAspectRatio(idx: number) {
        if (!this.overlay) return;
        this.currentRatioIdx = idx;
        const r = ASPECT_RATIOS[idx];
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        // Update SVG placeholder preview
        const svgSrc = this.createPlaceholderSvg(r.rw, r.rh, r.label);
        this.setPreviewImage(svgSrc, `placeholder-${r.label}`);

        // Update active box dimensions in visual
        const activeBox = q<HTMLElement>('#mm-ip-ar-active');
        activeBox.style.width = r.vw + 'px';
        activeBox.style.height = r.vh + 'px';
        q<HTMLElement>('#mm-ip-ar-active-label').textContent = r.label;

        // Inverse box (swapped dimensions)
        const inverseBox = q<HTMLElement>('#mm-ip-ar-inverse');
        const parts = r.value.split(':');
        const inverseVal = `${parts[1]}:${parts[0]}`;
        const inverseExists = ASPECT_RATIOS.some(x => x.value === inverseVal);
        const canSwap = inverseExists && r.value !== '1:1';

        const visual = q<HTMLElement>('#mm-ip-ar-visual');
        const swapHint = q<HTMLElement>('#mm-ip-ar-swap-hint');
        if (canSwap) {
            inverseBox.style.width = r.vh + 'px';
            inverseBox.style.height = r.vw + 'px';
            inverseBox.style.display = '';
            visual.classList.add('swappable');
            swapHint.style.display = '';
        } else {
            inverseBox.style.display = 'none';
            visual.classList.remove('swappable');
            swapHint.style.display = 'none';
        }

        // Update slider
        const slider = q<HTMLInputElement>('#mm-ip-ar-slider');
        slider.value = String(idx);

        // Update tick marks
        this.overlay!.querySelectorAll<HTMLElement>('.mm-ip-ar-tick').forEach((tick, i) => {
            tick.classList.toggle('active', i === idx);
        });

        // Update category buttons
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-ar-cat').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === r.category);
        });

        // Update reset button text
        const resetBtn = q<HTMLButtonElement>('#mm-ip-ar-reset');
        if (resetBtn) resetBtn.textContent = idx === 4 ? '重置 1:1' : '重置 1:1';
    }

    private createPlaceholderSvg(w: number, h: number, label: string): string {
        const W = 400;
        const H = Math.round(W * h / w);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2a3e"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff10" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <line x1="0" y1="0" x2="${W}" y2="${H}" stroke="#ffffff08" stroke-width="1"/>
  <line x1="${W}" y1="0" x2="0" y2="${H}" stroke="#ffffff08" stroke-width="1"/>
  <text x="${W / 2}" y="${H / 2 - 12}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter,sans-serif" font-size="34" fill="#888" opacity="0.6">🖼</text>
  <text x="${W / 2}" y="${H / 2 + 20}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter,sans-serif" font-size="15" font-weight="700"
        fill="#aaa" letter-spacing="2">${label}</text>
  <text x="${W / 2}" y="${H / 2 + 42}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter,sans-serif" font-size="11" fill="#666">${W} × ${H} px</text>
</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Upload
    // ─────────────────────────────────────────────────────────────────────────

    private handleFileUpload(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            this.setPreviewImage(dataUrl, file.name.replace(/\.[^.]+$/, ''));

            // Show file info
            const sizeKb = (file.size / 1024).toFixed(0);
            const infoEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-upload-info');
            const dimEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-upload-dim');
            const sizeEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-upload-size');
            if (infoEl) infoEl.style.display = 'flex';
            if (sizeEl) sizeEl.textContent = `${sizeKb} KB`;

            // Get image dimensions
            const img = new Image();
            img.onload = () => {
                if (dimEl) dimEl.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
            };
            img.src = dataUrl;

            // Show caption field
            const captionWrap = this.overlay?.querySelector<HTMLElement>('#mm-ip-upload-caption-wrap');
            if (captionWrap) captionWrap.style.display = '';
        };
        reader.readAsDataURL(file);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // URL loading
    // ─────────────────────────────────────────────────────────────────────────

    private handleUrlLoad() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const url = q<HTMLInputElement>('#mm-ip-url-input').value.trim();
        const errEl = q<HTMLElement>('#mm-ip-url-error');
        errEl.style.display = 'none';

        if (!url) { errEl.textContent = '请输入图片 URL'; errEl.style.display = ''; return; }
        if (!url.match(/^https?:\/\/.+/i) && !url.startsWith('//')) {
            errEl.textContent = '请输入有效的 http/https URL';
            errEl.style.display = '';
            return;
        }

        // Test load via img element
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';
        const loadBtn = q<HTMLButtonElement>('#mm-ip-url-load');
        loadBtn.textContent = '加载中…';
        loadBtn.disabled = true;

        testImg.onload = () => {
            loadBtn.textContent = '加载预览';
            loadBtn.disabled = false;
            const caption = q<HTMLInputElement>('#mm-ip-url-caption').value;
            this.setPreviewImage(url, caption || url.split('/').pop() || '图片');
        };
        testImg.onerror = () => {
            loadBtn.textContent = '加载预览';
            loadBtn.disabled = false;
            errEl.textContent = '图片加载失败，请检查 URL 是否可访问（注意跨域限制）';
            errEl.style.display = '';
        };
        testImg.src = url;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reference image
    // ─────────────────────────────────────────────────────────────────────────

    private handleRefUpload(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const preview = this.overlay?.querySelector<HTMLImageElement>('#mm-ip-ref-preview');
            const label = this.overlay?.querySelector<HTMLElement>('#mm-ip-ref-label');
            const clear = this.overlay?.querySelector<HTMLElement>('#mm-ip-ref-clear');
            if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
            if (label) label.style.display = 'none';
            if (clear) clear.style.display = '';
        };
        reader.readAsDataURL(file);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI Generation
    // ─────────────────────────────────────────────────────────────────────────

    private async handleGenerate() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const provider = q<HTMLSelectElement>('#mm-ip-provider').value;
        const prompt = q<HTMLTextAreaElement>('#mm-ip-prompt').value.trim();
        const errorEl = q<HTMLElement>('#mm-ip-error');
        const genLabel = q<HTMLElement>('#mm-ip-gen-label');
        const genSpinner = q<HTMLElement>('#mm-ip-gen-spinner');
        const genBtn = q<HTMLButtonElement>('#mm-ip-gen-btn');

        errorEl.style.display = 'none';
        if (!prompt) { errorEl.textContent = '请输入图片描述（Prompt）'; errorEl.style.display = ''; return; }

        genLabel.style.display = 'none';
        genSpinner.style.display = '';
        genBtn.disabled = true;

        try {
            const imageB64 = provider === 'gemini'
                ? await this.generateWithGemini(prompt)
                : await this.generateWithOpenAI(prompt);
            this.setPreviewImage(`data:image/png;base64,${imageB64}`, prompt.slice(0, 40));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            errorEl.textContent = '生成失败：' + msg;
            errorEl.style.display = '';
        } finally {
            genLabel.style.display = '';
            genSpinner.style.display = 'none';
            genBtn.disabled = false;
        }
    }

    private async generateWithGemini(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-gemini-key')?.value || '').trim();
        if (!apiKey) throw new Error('请先填写 Gemini API Key');

        const refImg = this.overlay!.querySelector<HTMLImageElement>('#mm-ip-ref-preview');
        const hasRef = refImg && refImg.style.display !== 'none' && refImg.src.startsWith('data:');
        const instance: Record<string, unknown> = { prompt };

        if (hasRef) {
            const [header, data] = refImg.src.split(',');
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
            instance['referenceImages'] = [{
                referenceType: 'REFERENCE_TYPE_STYLE',
                referenceImage: { bytesBase64Encoded: data, mimeType },
            }];
        }

        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [instance], parameters: { sampleCount: 1 } })
            }
        );
        if (!resp.ok) {
            const d = await resp.json().catch(() => ({})) as { error?: { message?: string } };
            throw new Error(d?.error?.message || `HTTP ${resp.status}`);
        }
        const data = await resp.json() as { predictions?: Array<{ bytesBase64Encoded?: string }> };
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error('API 返回数据格式异常，未找到图像数据');
        return b64;
    }

    private async generateWithOpenAI(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-openai-key')?.value || '').trim();
        if (!apiKey) throw new Error('请先填写 OpenAI API Key');

        const resp = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'dall-e-3', prompt, n: 1,
                size: '1024x1024', response_format: 'b64_json'
            }),
        });
        if (!resp.ok) {
            const d = await resp.json().catch(() => ({})) as { error?: { message?: string } };
            throw new Error(d?.error?.message || `HTTP ${resp.status}`);
        }
        const data = await resp.json() as { data?: Array<{ b64_json?: string }> };
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) throw new Error('API 返回数据格式异常，未找到图像数据');
        return b64;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Preview & Insert
    // ─────────────────────────────────────────────────────────────────────────

    private setPreviewImage(src: string, alt: string) {
        this.currentImageSrc = src;
        const preview = this.overlay?.querySelector<HTMLElement>('#mm-ip-preview');
        if (!preview) return;
        preview.innerHTML =
            `<img src="${src}" alt="${alt}"` +
            ` style="max-width:100%;max-height:200px;border-radius:8px;object-fit:contain">`;

        // Enable footer buttons
        const insertBtn = this.overlay?.querySelector<HTMLButtonElement>('#mm-ip-insert-btn');
        const mdBtn = this.overlay?.querySelector<HTMLButtonElement>('#mm-ip-md-btn');
        if (insertBtn) insertBtn.disabled = false;
        if (mdBtn) mdBtn.disabled = false;
    }

    private getCaption(): string {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        if (this.currentTab === 'placeholder') return q<HTMLInputElement>('#mm-ip-ph-caption').value.trim();
        if (this.currentTab === 'upload') return q<HTMLInputElement>('#mm-ip-upload-caption').value.trim();
        if (this.currentTab === 'url') return q<HTMLInputElement>('#mm-ip-url-caption').value.trim();
        /* ai */                                return q<HTMLInputElement>('#mm-ip-ai-caption').value.trim();
    }

    private buildInsertOptions(): ImageInsertOptions {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const layoutBtn = this.overlay!.querySelector<HTMLButtonElement>('.mm-ip-layout-btn.active');
        const layout = (layoutBtn?.dataset.layout || 'center') as ImageInsertOptions['layout'];
        const width = parseInt(q<HTMLInputElement>('#mm-ip-width').value) || 60;
        const caption = this.getCaption();
        // For URL tab, use the URL input as src directly
        let src = this.currentImageSrc;
        if (this.currentTab === 'url') {
            const urlVal = q<HTMLInputElement>('#mm-ip-url-input').value.trim();
            if (urlVal) src = urlVal;
        }
        return { src, alt: caption || '图片', caption, layout, width };
    }

    private handleInsert() {
        if (!this.currentImageSrc && this.currentTab !== 'url') return;
        this.onInsert(this.buildInsertOptions());
        this.close();
    }

    private handleCopyMarkdown() {
        if (!this.currentImageSrc && this.currentTab !== 'url') return;
        const opts = this.buildInsertOptions();
        const md = buildImageMarkdown(opts);
        navigator.clipboard?.writeText(md).then(() => {
            const mdBtn = this.overlay?.querySelector<HTMLButtonElement>('#mm-ip-md-btn');
            if (mdBtn) {
                const orig = mdBtn.textContent;
                mdBtn.textContent = '✓ 已复制';
                setTimeout(() => { if (mdBtn) mdBtn.textContent = orig; }, 1800);
            }
        }).catch(() => {
            alert('复制失败，请手动复制：\n\n' + md);
        });
    }
}

/**
 * 根据 ImageInsertOptions 生成 Markdown 片段
 * 扩展语法：![alt](url){.layout width=N%}
 */
export function buildImageMarkdown(opts: ImageInsertOptions): string {
    const alt = opts.alt || '图片';
    const attrs: string[] = [];

    if (opts.layout !== 'center') attrs.push(`.${opts.layout}`);
    if (opts.layout !== 'full' && opts.layout !== 'inline') {
        attrs.push(`width=${opts.width ?? 60}%`);
    }

    const attrStr = attrs.length ? `{${attrs.join(' ')}}` : '';
    const imgLine = `![${alt}](${opts.src})${attrStr}`;

    // 如果有独立的说明文字且与 alt 不同，追加斜体注记
    if (opts.caption && opts.caption !== alt) {
        return imgLine + '\n*' + opts.caption + '*';
    }
    return imgLine;
}

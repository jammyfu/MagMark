/**
 * MagMark Image Panel — v2.0 Smart Single-Window
 *
 * 极简智能图片面板：一个窗口完成所有操作
 *   • 拖拽 / 粘贴图片 → 直接上传
 *   • 输入 URL → 自动加载图片
 *   • 输入描述文字 → AI 生成（Gemini / OpenAI）
 *   • 什么都不输入 → 插入占位图（按选定比例）
 *
 * 自动判断意图，一键插入
 */

export interface ImageInsertOptions {
    src: string;
    alt: string;
    caption?: string;
    layout: 'center' | 'float-left' | 'float-right' | 'full' | 'inline';
    width?: number;
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

type InputMode = 'empty' | 'url' | 'ai' | 'image';

export class ImagePanel {
    private overlay: HTMLElement | null = null;
    private onInsert: ImageInsertCallback;
    private currentImageSrc = '';
    private currentRatioIdx = 4;
    private mode: InputMode = 'empty';

    constructor(onInsert: ImageInsertCallback) {
        this.onInsert = onInsert;
    }

    open() {
        if (this.overlay) { this.overlay.style.display = 'flex'; return; }
        this.createPanel();
    }

    openWithSrc(src: string, preset: EditPreset) {
        if (this.overlay) this.destroy();
        this.createPanel();
        this.setPreviewImage(src, preset.alt || '图片');
        this.applyPreset(preset);
    }

    close() { if (this.overlay) this.overlay.style.display = 'none'; }

    destroy() {
        this.overlay?.remove();
        this.overlay = null;
        this.currentImageSrc = '';
        this.mode = 'empty';
    }

    // ─── DOM ─────────────────────────────────────────────────────────────────

    private createPanel() {
        const overlay = document.createElement('div');
        overlay.id = 'mm-image-panel-overlay';
        overlay.innerHTML = this.buildHTML();
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.injectStyles();
        this.attachEvents();
        this.currentRatioIdx = 4;
        this.selectAspectRatio(4);
        this.updateMode();
    }

    private injectStyles() {
        const existing = document.getElementById('mm-ip-styles');
        if (existing) existing.remove();
        const s = document.createElement('style');
        s.id = 'mm-ip-styles';
        s.textContent = `
/* Overlay */
#mm-image-panel-overlay {
    position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;z-index:99999;
}
#mm-image-panel {
    background:#1a1a22;border:1px solid rgba(255,255,255,.12);border-radius:16px;
    width:520px;max-width:calc(100vw - 32px);max-height:calc(100vh - 48px);
    overflow-y:auto;color:#e8e8f0;font-family:'Inter',sans-serif;font-size:13px;
    box-shadow:0 24px 64px rgba(0,0,0,.6);
}
/* Header */
.mm-ip-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 0}
.mm-ip-title{font-size:15px;font-weight:700;color:#d4af37}
.mm-ip-close{background:0;border:0;color:#888;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px}
.mm-ip-close:hover{background:rgba(255,255,255,.08);color:#fff}
/* Smart input zone */
.mm-ip-smart-zone{
    margin:14px 22px 0;border:2px dashed rgba(255,255,255,.12);border-radius:12px;
    padding:16px;transition:all .2s;position:relative;
}
.mm-ip-smart-zone:hover,.mm-ip-smart-zone.drag-over{
    border-color:#d4af37;background:rgba(212,175,55,.04);
}
.mm-ip-smart-hint{color:#555;font-size:11px;margin-bottom:10px;text-align:center;line-height:1.6}
.mm-ip-smart-hint b{color:#888}
.mm-ip-smart-input{
    width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:8px;padding:10px 12px;color:#e8e8f0;font-size:13px;resize:none;
    outline:0;transition:all .2s;min-height:42px;
}
.mm-ip-smart-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.12)}
.mm-ip-smart-input::placeholder{color:#555}
input#mm-ip-file-hidden{display:none}
/* Mode indicator */
.mm-ip-mode-tag{
    display:inline-flex;align-items:center;gap:4px;
    padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;
    text-transform:uppercase;letter-spacing:.06em;margin-top:10px;
    transition:all .2s;
}
.mm-ip-mode-tag.mode-empty{background:rgba(255,255,255,.06);color:#888}
.mm-ip-mode-tag.mode-url{background:rgba(59,130,246,.15);color:#60a5fa}
.mm-ip-mode-tag.mode-ai{background:rgba(168,85,247,.15);color:#c084fc}
.mm-ip-mode-tag.mode-image{background:rgba(34,197,94,.15);color:#4ade80}
/* AI controls */
.mm-ip-ai-bar{
    display:flex;align-items:center;gap:8px;margin-top:10px;
}
.mm-ip-ai-prov{
    background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
    color:#ccc;padding:5px 8px;border-radius:7px;font-size:11px;cursor:pointer;
}
.mm-ip-ai-key{
    flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    color:#e8e8f0;padding:5px 8px;border-radius:7px;font-size:11px;outline:0;
}
.mm-ip-ai-key:focus{border-color:#d4af37}
.mm-ip-gen-btn{
    background:linear-gradient(135deg,#d4af37,#b8942e);border:0;border-radius:7px;
    color:#000;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;
    transition:all .2s;white-space:nowrap;
}
.mm-ip-gen-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.mm-ip-gen-btn:disabled{opacity:.5;cursor:wait;transform:none}
/* Preview */
.mm-ip-preview-area{
    margin:12px 22px 0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);
    border-radius:10px;min-height:60px;display:flex;align-items:center;justify-content:center;
    overflow:hidden;position:relative;
}
.mm-ip-preview-area img{max-width:100%;max-height:180px;object-fit:contain;border-radius:8px}
.mm-ip-preview-clear{
    position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:0;
    color:#f88;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .2s;
}
.mm-ip-preview-clear:hover{background:rgba(231,76,60,.3);color:#fff}
.mm-ip-img-info{display:flex;gap:12px;margin:6px 22px;color:#666;font-size:10px}
.mm-ip-error{
    margin:8px 22px 0;background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.25);
    border-radius:7px;padding:7px 12px;color:#e74c3c;font-size:11px;
}
/* Ratio selector */
.mm-ip-ratio-section{margin:14px 22px 0}
.mm-ip-ratio-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.mm-ip-ratio-label{color:#888;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:5px}
.mm-ip-ratio-reset{background:0;border:0;color:#555;font-size:10px;cursor:pointer;text-decoration:underline;padding:0}
.mm-ip-ratio-reset:hover{color:#e8e8f0}
.mm-ip-ratio-panel{
    background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
    border-radius:10px;padding:14px 12px 10px;
    display:flex;flex-direction:column;align-items:stretch;gap:12px;
}
.mm-ip-ar-visual-row{display:flex;justify-content:center}
.mm-ip-ar-visual{
    width:120px;height:120px;background:rgba(255,255,255,.04);border-radius:8px;
    position:relative;display:flex;align-items:center;justify-content:center;
    border:1px solid rgba(255,255,255,.07);transition:all .2s;
}
.mm-ip-ar-visual.swappable{cursor:pointer}
.mm-ip-ar-visual.swappable:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}
.mm-ip-ar-inverse{position:absolute;border:2px dashed rgba(255,255,255,.18);pointer-events:none;transition:all .3s;opacity:.4}
.mm-ip-ar-active{
    position:relative;border:2px solid #d4af37;display:flex;align-items:center;justify-content:center;
    transition:all .3s;z-index:10;box-shadow:0 0 8px rgba(212,175,55,.2);
}
.mm-ip-ar-active-label{font-size:10px;font-weight:800;color:#d4af37;background:rgba(20,20,30,.8);padding:1px 5px;border-radius:3px}
.mm-ip-ar-swap-hint{position:absolute;bottom:3px;right:5px;font-size:8px;color:#555;transition:color .2s}
.mm-ip-ar-visual.swappable:hover .mm-ip-ar-swap-hint{color:#888}
.mm-ip-ar-cats{display:flex;gap:6px}
.mm-ip-ar-cat{
    flex:1;padding:4px;font-size:9px;font-weight:700;text-transform:uppercase;
    border-radius:16px;border:1px solid rgba(255,255,255,.1);background:0;color:#555;
    cursor:pointer;transition:all .2s;letter-spacing:.03em;text-align:center;
}
.mm-ip-ar-cat:hover{border-color:rgba(255,255,255,.2);color:#bbb}
.mm-ip-ar-cat.active{background:rgba(212,175,55,.15);color:#d4af37;border-color:rgba(212,175,55,.4)}
.mm-ip-ar-slider-wrap{position:relative;width:100%;display:block;box-sizing:border-box}
.mm-ip-ar-slider{
    display:block;width:100%!important;min-width:100%;height:3px;
    -webkit-appearance:none;appearance:none;
    background:rgba(255,255,255,.1);border-radius:3px;outline:0;cursor:pointer;
    margin:0;padding:0;box-sizing:border-box;
}
.mm-ip-ar-slider::-webkit-slider-thumb{
    -webkit-appearance:none;width:14px;height:14px;background:#d4af37;
    border-radius:50%;box-shadow:0 0 5px rgba(212,175,55,.4);cursor:pointer;
}
.mm-ip-ar-ticks{display:flex;justify-content:space-between;margin-top:5px;pointer-events:none;user-select:none}
.mm-ip-ar-tick{display:flex;flex-direction:column;align-items:center;gap:2px;width:16px}
.mm-ip-ar-tick-bar{width:1px;height:4px;background:rgba(255,255,255,.12);border-radius:1px;transition:background .2s}
.mm-ip-ar-tick.active .mm-ip-ar-tick-bar{background:#d4af37}
.mm-ip-ar-tick-label{font-size:7.5px;font-family:monospace;color:rgba(255,255,255,.2);white-space:nowrap;transition:color .2s}
.mm-ip-ar-tick.active .mm-ip-ar-tick-label{color:#d4af37;font-weight:700}
/* Crop fit buttons */
.mm-ip-crop-row{display:flex;align-items:center;gap:5px;margin-top:2px}
.mm-ip-crop-label{color:#888;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-right:4px}
.mm-ip-crop-btn{
    width:28px;height:28px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;
    color:#888;font-size:14px;cursor:pointer;transition:all .2s;padding:0;
}
.mm-ip-crop-btn:hover{border-color:rgba(255,255,255,.25);color:#ccc}
.mm-ip-crop-btn.active{background:rgba(212,175,55,.15);border-color:rgba(212,175,55,.4);color:#d4af37}
.mm-ip-crop-btn svg{width:16px;height:16px}
/* Layout */
.mm-ip-layout-section{padding:12px 22px 0}
.mm-ip-layout-section>label{color:#888;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px}
.mm-ip-layout-btns{display:flex;gap:5px;margin-bottom:8px}
.mm-ip-layout-btn{
    padding:5px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:7px;color:#888;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;
}
.mm-ip-layout-btn:hover{border-color:#d4af37;color:#d4af37}
.mm-ip-layout-btn.active{background:#d4af37;color:#000;border-color:#d4af37}
#mm-ip-width-row{display:flex;align-items:center;gap:8px}
#mm-ip-width-row label{color:#888;font-size:11px;white-space:nowrap}
#mm-ip-width-row input[type=range]{flex:1;accent-color:#d4af37}
#mm-ip-width-val{color:#d4af37;font-weight:700;font-size:11px;min-width:28px;text-align:right}
/* Caption */
.mm-ip-caption-row{padding:8px 22px 0}
.mm-ip-caption-row label{color:#888;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px}
.mm-ip-caption-input{
    width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:7px;padding:7px 10px;color:#e8e8f0;font-size:12px;outline:0;transition:all .2s;
}
.mm-ip-caption-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.1)}
/* Footer */
.mm-ip-footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px 18px}
.mm-ip-md-btn{
    background:0;border:1px solid rgba(255,255,255,.12);color:#888;padding:7px 14px;
    border-radius:7px;font-size:12px;cursor:pointer;transition:all .2s;
}
.mm-ip-md-btn:not(:disabled):hover{border-color:#d4af37;color:#d4af37}
.mm-ip-md-btn:disabled{opacity:.3;cursor:default}
.mm-ip-insert-btn{
    background:linear-gradient(135deg,#d4af37,#b8942e);border:0;color:#000;
    padding:7px 20px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;
}
.mm-ip-insert-btn:not(:disabled):hover{filter:brightness(1.1);transform:translateY(-1px)}
.mm-ip-insert-btn:disabled{opacity:.3;cursor:default;transform:none}
`;
        document.head.appendChild(s);
    }

    private buildHTML(): string {
        const provider = localStorage.getItem(LS_AI_PROVIDER) || 'gemini';
        const geminiKey = localStorage.getItem(LS_GEMINI_KEY) || '';
        const openaiKey = localStorage.getItem(LS_OPENAI_KEY) || '';
        const apiKey = provider === 'gemini' ? geminiKey : openaiKey;

        return `
<div id="mm-image-panel">
  <div class="mm-ip-header">
    <span class="mm-ip-title">🖼 插入图片</span>
    <button class="mm-ip-close" id="mm-ip-close">✕</button>
  </div>

  <!-- Smart input zone -->
  <div class="mm-ip-smart-zone" id="mm-ip-smart-zone">
    <div class="mm-ip-smart-hint">
      <b>拖拽图片</b> 到此 · 或输入 <b>URL</b> / <b>描述文字</b>生成AI图 · 留空插入占位图
    </div>
    <textarea class="mm-ip-smart-input" id="mm-ip-smart-input"
      placeholder="粘贴图片 URL / 输入 AI 生成描述…" rows="1"></textarea>
    <input type="file" id="mm-ip-file-hidden" accept="image/*">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
      <span class="mm-ip-mode-tag mode-empty" id="mm-ip-mode-tag">📌 占位图模式</span>
      <button style="background:0;border:0;color:#555;font-size:11px;cursor:pointer;text-decoration:underline"
              id="mm-ip-browse-btn">或 选择文件</button>
    </div>
  </div>

  <!-- AI bar (hidden until AI mode) -->
  <div class="mm-ip-ai-bar" id="mm-ip-ai-bar" style="display:none;margin:8px 22px 0">
    <select class="mm-ip-ai-prov" id="mm-ip-ai-prov">
      <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Gemini</option>
      <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI</option>
    </select>
    <input type="password" class="mm-ip-ai-key" id="mm-ip-ai-key"
           value="${apiKey}" placeholder="API Key…" autocomplete="off">
    <button class="mm-ip-gen-btn" id="mm-ip-gen-btn">✨ 生成</button>
  </div>

  <!-- Error -->
  <div class="mm-ip-error" id="mm-ip-error" style="display:none"></div>

  <!-- Preview (shown only when we have an image) -->
  <div class="mm-ip-preview-area" id="mm-ip-preview-area" style="display:none">
    <button class="mm-ip-preview-clear" id="mm-ip-preview-clear" title="清除图片">✕</button>
  </div>
  <div class="mm-ip-img-info" id="mm-ip-img-info" style="display:none">
    <span id="mm-ip-img-dim">—</span>
    <span id="mm-ip-img-size">—</span>
  </div>

  <!-- Ratio selector -->
  <div class="mm-ip-ratio-section" id="mm-ip-ratio-section">
    <div class="mm-ip-ratio-header">
      <label class="mm-ip-ratio-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        比例
      </label>
      <button class="mm-ip-ratio-reset" id="mm-ip-ratio-reset">重置</button>
    </div>
    <div class="mm-ip-ratio-panel">
      <div class="mm-ip-ar-visual-row">
        <div class="mm-ip-ar-visual" id="mm-ip-ar-visual">
          <div class="mm-ip-ar-inverse" id="mm-ip-ar-inverse"></div>
          <div class="mm-ip-ar-active" id="mm-ip-ar-active">
            <span class="mm-ip-ar-active-label" id="mm-ip-ar-active-label">1:1</span>
          </div>
          <span class="mm-ip-ar-swap-hint" id="mm-ip-ar-swap-hint">⇄</span>
        </div>
      </div>
      <div class="mm-ip-ar-cats" id="mm-ip-ar-cats">
        <button class="mm-ip-ar-cat" data-cat="Portrait">竖向</button>
        <button class="mm-ip-ar-cat active" data-cat="Square">方形</button>
        <button class="mm-ip-ar-cat" data-cat="Landscape">横向</button>
      </div>
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
      <!-- Crop fit mode -->
      <div class="mm-ip-crop-row" id="mm-ip-crop-row">
        <span class="mm-ip-crop-label">适配</span>
        <button class="mm-ip-crop-btn active" data-fit="cover" title="裁切填充 (Cover)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="1" width="12" height="22" rx="1" stroke-dasharray="3 2" opacity=".5"/></svg>
        </button>
        <button class="mm-ip-crop-btn" data-fit="contain" title="完整显示 (Contain)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2" opacity=".5"/><rect x="3" y="6" width="18" height="12" rx="1"/></svg>
        </button>
        <button class="mm-ip-crop-btn" data-fit="fill" title="拉伸填充 (Fill)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18M16 3v18M3 8h18M3 16h18" opacity=".3"/></svg>
        </button>
        <button class="mm-ip-crop-btn" data-fit="none" title="原始比例">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Caption -->
  <div class="mm-ip-caption-row">
    <label>说明文字（可选）</label>
    <input type="text" class="mm-ip-caption-input" id="mm-ip-caption" placeholder="图片说明…">
  </div>

  <!-- Layout -->
  <div class="mm-ip-layout-section">
    <label>图文混排</label>
    <div class="mm-ip-layout-btns">
      <button class="mm-ip-layout-btn active" data-layout="center">⬛ 居中</button>
      <button class="mm-ip-layout-btn" data-layout="float-left">◧ 浮左</button>
      <button class="mm-ip-layout-btn" data-layout="float-right">浮右 ◨</button>
      <button class="mm-ip-layout-btn" data-layout="full">↔ 全宽</button>
    </div>
    <div id="mm-ip-width-row">
      <label>宽度 <span id="mm-ip-width-val">60%</span></label>
      <input type="range" id="mm-ip-width" min="20" max="100" value="60">
    </div>
  </div>

  <!-- Footer -->
  <div class="mm-ip-footer">
    <button class="mm-ip-md-btn" id="mm-ip-md-btn" title="复制 Markdown">📋 复制</button>
    <button class="mm-ip-insert-btn" id="mm-ip-insert-btn">插入 →</button>
  </div>
</div>`;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    private attachEvents() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        // Close
        q<HTMLButtonElement>('#mm-ip-close').addEventListener('click', () => this.close());
        this.overlay!.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // ── Smart zone: text input ──
        const input = q<HTMLTextAreaElement>('#mm-ip-smart-input');
        input.addEventListener('input', () => this.updateMode());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.mode === 'url') this.loadUrl(input.value.trim());
                else if (this.mode === 'ai') this.handleGenerate();
            }
        });

        // ── Smart zone: drag & drop ──
        const zone = q<HTMLElement>('#mm-ip-smart-zone');
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const file = e.dataTransfer?.files[0];
            if (file && file.type.startsWith('image/')) this.handleFile(file);
        });

        // ── Smart zone: paste ──
        input.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) this.handleFile(file);
                    return;
                }
            }
        });

        // ── Browse file button ──
        const fileInput = q<HTMLInputElement>('#mm-ip-file-hidden');
        q('#mm-ip-browse-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (file) this.handleFile(file);
        });

        // ── Preview clear ──
        q('#mm-ip-preview-clear').addEventListener('click', () => this.clearImage());

        // ── AI bar ──
        q<HTMLSelectElement>('#mm-ip-ai-prov').addEventListener('change', (e) => {
            const prov = (e.target as HTMLSelectElement).value;
            localStorage.setItem(LS_AI_PROVIDER, prov);
            const key = prov === 'gemini'
                ? localStorage.getItem(LS_GEMINI_KEY) || ''
                : localStorage.getItem(LS_OPENAI_KEY) || '';
            q<HTMLInputElement>('#mm-ip-ai-key').value = key;
        });
        q<HTMLInputElement>('#mm-ip-ai-key').addEventListener('change', (e) => {
            const prov = q<HTMLSelectElement>('#mm-ip-ai-prov').value;
            const k = prov === 'gemini' ? LS_GEMINI_KEY : LS_OPENAI_KEY;
            localStorage.setItem(k, (e.target as HTMLInputElement).value.trim());
        });
        q<HTMLButtonElement>('#mm-ip-gen-btn').addEventListener('click', () => this.handleGenerate());

        // ── Ratio: slider ──
        const arSlider = q<HTMLInputElement>('#mm-ip-ar-slider');
        arSlider.addEventListener('input', () => this.selectAspectRatio(parseInt(arSlider.value)));

        // ── Ratio: cats ──
        q('#mm-ip-ar-cats').addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.mm-ip-ar-cat') as HTMLButtonElement | null;
            if (!btn) return;
            const map: Record<string, number> = { Portrait: 0, Square: 4, Landscape: 8 };
            this.selectAspectRatio(map[btn.dataset.cat!] ?? 4);
        });

        // ── Ratio: reset ──
        q('#mm-ip-ratio-reset').addEventListener('click', () => this.selectAspectRatio(4));

        // ── Ratio: visual box swap ──
        q('#mm-ip-ar-visual').addEventListener('click', () => {
            const r = ASPECT_RATIOS[this.currentRatioIdx];
            const [a, b] = r.value.split(':');
            const inv = `${b}:${a}`;
            const idx = ASPECT_RATIOS.findIndex(x => x.value === inv);
            if (idx !== -1 && r.value !== '1:1') this.selectAspectRatio(idx);
        });

        // ── Crop fit buttons ──
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-crop-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlay!.querySelectorAll('.mm-ip-crop-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // ── Layout ──
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlay!.querySelectorAll('.mm-ip-layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                q<HTMLElement>('#mm-ip-width-row').style.display =
                    btn.dataset.layout === 'full' ? 'none' : '';
            });
        });
        q<HTMLInputElement>('#mm-ip-width').addEventListener('input', (e) => {
            q<HTMLElement>('#mm-ip-width-val').textContent = (e.target as HTMLInputElement).value + '%';
        });

        // ── Footer ──
        q<HTMLButtonElement>('#mm-ip-insert-btn').addEventListener('click', () => this.handleInsert());
        q<HTMLButtonElement>('#mm-ip-md-btn').addEventListener('click', () => this.handleCopyMarkdown());
    }

    // ─── Smart mode detection ────────────────────────────────────────────────

    private updateMode() {
        if (!this.overlay) return;
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const text = q<HTMLTextAreaElement>('#mm-ip-smart-input').value.trim();

        // If we already have an uploaded/loaded image, mode stays 'image'
        if (this.mode === 'image' && this.currentImageSrc) {
            // But if text changes while in image mode, check URL override
            if (text && (text.match(/^https?:\/\//i) || text.startsWith('//'))) {
                this.mode = 'url';
            } else {
                return; // keep image mode
            }
        }

        let newMode: InputMode;
        if (!text) {
            newMode = 'empty';
        } else if (text.match(/^https?:\/\//i) || text.startsWith('//')) {
            newMode = 'url';
        } else {
            newMode = 'ai';
        }

        if (newMode === this.mode) return;
        this.mode = newMode;

        // Update tag
        const tag = q('#mm-ip-mode-tag');
        tag.className = `mm-ip-mode-tag mode-${newMode}`;
        const labels: Record<InputMode, string> = {
            empty: '📌 占位图模式',
            url: '🔗 URL 模式 · 按 Enter 加载',
            ai: '✨ AI 生成 · 按 Enter 生成',
            image: '📁 已选择图片',
        };
        tag.textContent = labels[newMode];

        // Show/hide AI bar
        q('#mm-ip-ai-bar').style.display = newMode === 'ai' ? 'flex' : 'none';
    }

    // ─── File handling ───────────────────────────────────────────────────────

    private handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            this.setPreviewImage(dataUrl, file.name.replace(/\.[^.]+$/, ''));
            this.mode = 'image';
            this.updateModeTag();

            // Show image info
            const sizeKb = (file.size / 1024).toFixed(0);
            const infoEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-img-info');
            const sizeEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-img-size');
            if (infoEl) infoEl.style.display = 'flex';
            if (sizeEl) sizeEl.textContent = `${sizeKb} KB`;

            const img = new Image();
            img.onload = () => {
                const dimEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-img-dim');
                if (dimEl) dimEl.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    private clearImage() {
        this.currentImageSrc = '';
        this.mode = 'empty';
        const preview = this.overlay?.querySelector<HTMLElement>('#mm-ip-preview-area');
        if (preview) { preview.innerHTML = '<button class="mm-ip-preview-clear" id="mm-ip-preview-clear" title="清除图片">✕</button>'; preview.style.display = 'none'; }
        const info = this.overlay?.querySelector<HTMLElement>('#mm-ip-img-info');
        if (info) info.style.display = 'none';
        // Re-attach clear button listener
        this.overlay?.querySelector('#mm-ip-preview-clear')?.addEventListener('click', () => this.clearImage());
        this.updateMode();
    }

    // ─── URL loading ─────────────────────────────────────────────────────────

    private loadUrl(url: string) {
        if (!url) return;
        const errEl = this.overlay?.querySelector<HTMLElement>('#mm-ip-error');
        if (errEl) errEl.style.display = 'none';

        if (!url.match(/^https?:\/\/.+/i) && !url.startsWith('//')) {
            if (errEl) { errEl.textContent = '无效的 URL 格式'; errEl.style.display = ''; }
            return;
        }

        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';
        testImg.onload = () => {
            this.setPreviewImage(url, url.split('/').pop() || '图片');
            this.mode = 'image';
            this.updateModeTag();
        };
        testImg.onerror = () => {
            if (errEl) { errEl.textContent = '图片加载失败'; errEl.style.display = ''; }
        };
        testImg.src = url;
    }

    // ─── AI Generation ───────────────────────────────────────────────────────

    private async handleGenerate() {
        if (!this.overlay) return;
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const prompt = q<HTMLTextAreaElement>('#mm-ip-smart-input').value.trim();
        const errEl = q<HTMLElement>('#mm-ip-error');
        const genBtn = q<HTMLButtonElement>('#mm-ip-gen-btn');
        errEl.style.display = 'none';

        if (!prompt) { errEl.textContent = '请输入描述文字'; errEl.style.display = ''; return; }

        genBtn.textContent = '⏳ 生成中…';
        genBtn.disabled = true;

        try {
            const provider = q<HTMLSelectElement>('#mm-ip-ai-prov').value;
            const imageB64 = provider === 'gemini'
                ? await this.generateWithGemini(prompt)
                : await this.generateWithOpenAI(prompt);
            this.setPreviewImage(`data:image/png;base64,${imageB64}`, prompt.slice(0, 40));
            this.mode = 'image';
            this.updateModeTag();
        } catch (err: unknown) {
            errEl.textContent = '生成失败：' + (err instanceof Error ? err.message : String(err));
            errEl.style.display = '';
        } finally {
            genBtn.textContent = '✨ 生成';
            genBtn.disabled = false;
        }
    }

    private async generateWithGemini(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-ai-key')?.value || '').trim();
        if (!apiKey) throw new Error('请先填写 Gemini API Key');

        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
            }
        );
        if (!resp.ok) {
            const d = await resp.json().catch(() => ({})) as { error?: { message?: string } };
            throw new Error(d?.error?.message || `HTTP ${resp.status}`);
        }
        const data = await resp.json() as { predictions?: Array<{ bytesBase64Encoded?: string }> };
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error('API 返回格式异常');
        return b64;
    }

    private async generateWithOpenAI(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-ai-key')?.value || '').trim();
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
        if (!b64) throw new Error('API 返回格式异常');
        return b64;
    }

    // ─── Aspect ratio ────────────────────────────────────────────────────────

    private selectAspectRatio(idx: number) {
        if (!this.overlay) return;
        this.currentRatioIdx = idx;
        const r = ASPECT_RATIOS[idx];
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        // Store placeholder SVG (used on insert when in empty mode)
        this.currentImageSrc = this.createPlaceholderSvg(r.rw, r.rh, r.label);

        // Update visual box
        const active = q<HTMLElement>('#mm-ip-ar-active');
        active.style.width = r.vw + 'px'; active.style.height = r.vh + 'px';
        q<HTMLElement>('#mm-ip-ar-active-label').textContent = r.label;

        // Inverse
        const inv = q<HTMLElement>('#mm-ip-ar-inverse');
        const [a, b] = r.value.split(':');
        const invVal = `${b}:${a}`;
        const canSwap = ASPECT_RATIOS.some(x => x.value === invVal) && r.value !== '1:1';
        const vis = q<HTMLElement>('#mm-ip-ar-visual');
        const hint = q<HTMLElement>('#mm-ip-ar-swap-hint');
        if (canSwap) {
            inv.style.width = r.vh + 'px'; inv.style.height = r.vw + 'px'; inv.style.display = '';
            vis.classList.add('swappable'); hint.style.display = '';
        } else {
            inv.style.display = 'none'; vis.classList.remove('swappable'); hint.style.display = 'none';
        }

        // Slider + ticks + cats
        q<HTMLInputElement>('#mm-ip-ar-slider').value = String(idx);
        this.overlay!.querySelectorAll<HTMLElement>('.mm-ip-ar-tick').forEach((t, i) => t.classList.toggle('active', i === idx));
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-ar-cat').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.cat === r.category));
    }

    private createPlaceholderSvg(w: number, h: number, label: string): string {
        const W = 400, H = Math.round(W * h / w);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2a3e"/><stop offset="100%" stop-color="#1a1a2e"/>
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

    // ─── Preview & Insert ────────────────────────────────────────────────────

    private setPreviewImage(src: string, alt: string) {
        this.currentImageSrc = src;
        const area = this.overlay?.querySelector<HTMLElement>('#mm-ip-preview-area');
        if (!area) return;
        // Keep the clear button
        area.innerHTML =
            `<img src="${src}" alt="${alt}">` +
            `<button class="mm-ip-preview-clear" id="mm-ip-preview-clear" title="清除图片">✕</button>`;
        area.style.display = 'flex';
        // Re-attach clear
        area.querySelector('#mm-ip-preview-clear')?.addEventListener('click', () => this.clearImage());
    }

    private updateModeTag() {
        if (!this.overlay) return;
        const tag = this.overlay.querySelector<HTMLElement>('#mm-ip-mode-tag');
        if (!tag) return;
        tag.className = `mm-ip-mode-tag mode-${this.mode}`;
        const labels: Record<InputMode, string> = {
            empty: '📌 占位图模式',
            url: '🔗 URL 模式 · 按 Enter 加载',
            ai: '✨ AI 生成 · 按 Enter 生成',
            image: '📁 已选择图片',
        };
        tag.textContent = labels[this.mode];

        // Hide AI bar unless in AI mode
        const aiBar = this.overlay.querySelector<HTMLElement>('#mm-ip-ai-bar');
        if (aiBar) aiBar.style.display = this.mode === 'ai' ? 'flex' : 'none';
    }

    private applyPreset(preset: EditPreset) {
        if (!this.overlay) return;
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        this.overlay.querySelectorAll('.mm-ip-layout-btn').forEach(b => {
            (b as HTMLElement).classList.toggle('active', (b as HTMLElement).dataset.layout === preset.layout);
        });
        q<HTMLInputElement>('#mm-ip-width').value = String(preset.width);
        q<HTMLElement>('#mm-ip-width-val').textContent = preset.width + '%';
        q<HTMLElement>('#mm-ip-width-row').style.display = preset.layout === 'full' ? 'none' : '';
        q<HTMLInputElement>('#mm-ip-caption').value = preset.caption || '';
    }

    private buildInsertOptions(): ImageInsertOptions {
        if (!this.overlay) return { src: '', alt: '图片', layout: 'center', width: 60 };
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        const layoutBtn = this.overlay.querySelector<HTMLButtonElement>('.mm-ip-layout-btn.active');
        const layout = (layoutBtn?.dataset.layout || 'center') as ImageInsertOptions['layout'];
        const width = parseInt(q<HTMLInputElement>('#mm-ip-width').value) || 60;
        const caption = q<HTMLInputElement>('#mm-ip-caption').value.trim();

        let src = this.currentImageSrc;
        // In URL mode, prefer the text input value
        if (this.mode === 'url') {
            const urlVal = q<HTMLTextAreaElement>('#mm-ip-smart-input').value.trim();
            if (urlVal) src = urlVal;
        }
        return { src, alt: caption || '图片', caption, layout, width };
    }

    private handleInsert() {
        if (!this.currentImageSrc && this.mode !== 'url') return;
        this.onInsert(this.buildInsertOptions());
        this.close();
    }

    private handleCopyMarkdown() {
        if (!this.currentImageSrc && this.mode !== 'url') return;
        const md = buildImageMarkdown(this.buildInsertOptions());
        navigator.clipboard?.writeText(md).then(() => {
            const btn = this.overlay?.querySelector<HTMLButtonElement>('#mm-ip-md-btn');
            if (btn) { const o = btn.textContent; btn.textContent = '✓ 已复制'; setTimeout(() => { btn.textContent = o; }, 1800); }
        }).catch(() => alert('复制失败：\n\n' + md));
    }
}

/**
 * 根据 ImageInsertOptions 生成 Markdown 片段
 */
export function buildImageMarkdown(opts: ImageInsertOptions): string {
    const alt = opts.alt || '图片';
    const attrs: string[] = [];
    if (opts.layout !== 'center') attrs.push(`.${opts.layout}`);
    if (opts.layout !== 'full' && opts.layout !== 'inline') attrs.push(`width=${opts.width ?? 60}%`);
    const attrStr = attrs.length ? `{${attrs.join(' ')}}` : '';
    const imgLine = `![${alt}](${opts.src})${attrStr}`;
    if (opts.caption && opts.caption !== alt) return imgLine + '\n*' + opts.caption + '*';
    return imgLine;
}

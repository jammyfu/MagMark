/**
 * MagMark Image Panel — v1.5.0
 *
 * 图片管理面板：
 *   • 占位图：选择比例 → 生成 SVG 占位图并插入
 *   • 本地上传：拖拽或点击选择图片文件
 *   • AI 生成：Gemini Imagen 3 / OpenAI DALL-E 3
 * 生成后可选择图文混排样式（居中 / 浮左 / 浮右 / 全宽）与宽度，插入 Markdown。
 */

export interface ImageInsertOptions {
    src: string;         // data URL or http URL
    alt: string;
    caption?: string;
    layout: 'center' | 'float-left' | 'float-right' | 'full' | 'inline';
    width?: number;      // percentage, e.g. 50
}

export type ImageInsertCallback = (opts: ImageInsertOptions) => void;

const ASPECT_RATIOS = [
    { label: '1:1',   w: 1,  h: 1  },
    { label: '4:3',   w: 4,  h: 3  },
    { label: '16:9',  w: 16, h: 9  },
    { label: '3:4',   w: 3,  h: 4  },
    { label: '9:16',  w: 9,  h: 16 },
    { label: '21:9',  w: 21, h: 9  },
];

const LS_GEMINI_KEY  = 'magmark_gemini_apikey';
const LS_OPENAI_KEY  = 'magmark_openai_apikey';
const LS_AI_PROVIDER = 'magmark_ai_provider';

export class ImagePanel {
    private overlay: HTMLElement | null = null;
    private panel:   HTMLElement | null = null;
    private onInsert: ImageInsertCallback;
    private currentImageSrc: string = '';
    private currentTab: 'placeholder' | 'upload' | 'ai' = 'placeholder';

    constructor(onInsert: ImageInsertCallback) {
        this.onInsert = onInsert;
    }

    /** Open the panel modal */
    open() {
        if (this.overlay) { this.overlay.style.display = 'flex'; return; }
        this.createPanel();
    }

    /** Close the panel modal */
    close() {
        if (this.overlay) this.overlay.style.display = 'none';
    }

    /** Destroy and remove the panel from DOM */
    destroy() {
        this.overlay?.remove();
        this.overlay = null;
        this.panel = null;
    }

    // ─────────────────────────────────────────────────────────────
    // DOM Creation
    // ─────────────────────────────────────────────────────────────

    private createPanel() {
        const overlay = document.createElement('div');
        overlay.id = 'mm-image-panel-overlay';
        overlay.innerHTML = this.buildHTML();
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.panel = overlay.querySelector('#mm-image-panel')!;
        this.attachEventListeners();
        // Set initial preview
        this.selectAspectRatio(0);
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
    <button class="mm-ip-tab" data-tab="ai">AI 生成</button>
  </div>

  <!-- Tab: Placeholder -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-placeholder">
    <p class="mm-ip-hint">选择比例，插入带比例的占位图</p>
    <div class="mm-ip-ratio-grid" id="mm-ip-ratio-grid">
      ${ASPECT_RATIOS.map((r, i) => `
        <button class="mm-ip-ratio-btn${i === 0 ? ' active' : ''}" data-ratio-idx="${i}"
                style="padding-bottom:${(r.h / r.w * 100).toFixed(1)}%">
          <span>${r.label}</span>
        </button>`).join('')}
    </div>
    <div class="mm-ip-field">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-ph-caption" placeholder="图片说明…">
    </div>
  </div>

  <!-- Tab: Upload -->
  <div class="mm-ip-tabcontent" id="mm-ip-tab-upload" style="display:none">
    <div class="mm-ip-dropzone" id="mm-ip-dropzone">
      <div class="mm-ip-drop-icon">📁</div>
      <p>拖拽图片至此，或点击选择文件</p>
      <p class="mm-ip-hint">支持 PNG、JPG、GIF、WebP、SVG</p>
      <input type="file" id="mm-ip-file" accept="image/*" hidden>
    </div>
    <div class="mm-ip-field" id="mm-ip-upload-caption-wrap" style="display:none">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-upload-caption" placeholder="图片说明…">
    </div>
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

    <div class="mm-ip-apikey-group" id="mm-ip-gemini-group" style="${provider !== 'gemini' ? 'display:none' : ''}">
      <div class="mm-ip-row">
        <label>Gemini API Key</label>
        <div class="mm-ip-key-wrap">
          <input type="password" id="mm-ip-gemini-key" value="${geminiKey}"
                 placeholder="AIza…" autocomplete="off">
          <button class="mm-ip-eye" data-target="mm-ip-gemini-key">👁</button>
        </div>
      </div>
    </div>

    <div class="mm-ip-apikey-group" id="mm-ip-openai-group" style="${provider !== 'openai' ? 'display:none' : ''}">
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
                placeholder="描述你想生成的图片，例如：一只在咖啡馆看书的猫，水彩画风格，温暖的午后阳光…"></textarea>
    </div>

    <div class="mm-ip-field">
      <label>参考图片（可选，用于风格参考）</label>
      <div class="mm-ip-ref-zone" id="mm-ip-ref-zone">
        <input type="file" id="mm-ip-ref-file" accept="image/*" hidden>
        <span id="mm-ip-ref-label">点击上传参考图片</span>
        <img id="mm-ip-ref-preview" style="display:none;max-height:80px;border-radius:4px" alt="参考图">
        <button class="mm-ip-ref-clear" id="mm-ip-ref-clear" style="display:none">✕</button>
      </div>
    </div>

    <div class="mm-ip-field">
      <label>说明文字（可选）</label>
      <input type="text" id="mm-ip-ai-caption" placeholder="图片说明…">
    </div>

    <button class="mm-ip-gen-btn" id="mm-ip-gen-btn">
      <span id="mm-ip-gen-label">✨ 生成图片</span>
      <span id="mm-ip-gen-spinner" style="display:none">⏳ 生成中…</span>
    </button>
    <div class="mm-ip-error" id="mm-ip-error" style="display:none"></div>
  </div>

  <!-- Preview (shared) -->
  <div class="mm-ip-preview-wrap" id="mm-ip-preview-wrap">
    <div class="mm-ip-preview" id="mm-ip-preview">
      <span class="mm-ip-preview-empty">预览将显示在此</span>
    </div>
  </div>

  <!-- Layout Options -->
  <div class="mm-ip-layout-section">
    <label>图文混排</label>
    <div class="mm-ip-layout-btns">
      <button class="mm-ip-layout-btn active" data-layout="center" title="居中">⬛ 居中</button>
      <button class="mm-ip-layout-btn" data-layout="float-left" title="浮左图文混排">⇐ 浮左</button>
      <button class="mm-ip-layout-btn" data-layout="float-right" title="浮右图文混排">浮右 ⇒</button>
      <button class="mm-ip-layout-btn" data-layout="full" title="全宽">↔ 全宽</button>
    </div>
    <div class="mm-ip-row" id="mm-ip-width-row">
      <label>宽度 <span id="mm-ip-width-val">60%</span></label>
      <input type="range" id="mm-ip-width" min="20" max="100" value="60">
    </div>
  </div>

  <!-- Footer: Insert Button -->
  <div class="mm-ip-footer">
    <button class="mm-ip-insert-btn" id="mm-ip-insert-btn" disabled>插入 Markdown</button>
  </div>
</div>`;
    }

    // ─────────────────────────────────────────────────────────────
    // Event Wiring
    // ─────────────────────────────────────────────────────────────

    private attachEventListeners() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        // Close button
        q<HTMLButtonElement>('#mm-ip-close').addEventListener('click', () => this.close());

        // Click outside panel to close
        this.overlay!.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Tab switching
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlay!.querySelectorAll('.mm-ip-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab as typeof this.currentTab;
                this.currentTab = tab;
                this.overlay!.querySelectorAll<HTMLElement>('.mm-ip-tabcontent').forEach(tc => tc.style.display = 'none');
                q<HTMLElement>(`#mm-ip-tab-${tab}`).style.display = 'block';
            });
        });

        // Aspect ratio buttons
        q('#mm-ip-ratio-grid').addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.mm-ip-ratio-btn') as HTMLElement | null;
            if (!btn) return;
            this.overlay!.querySelectorAll('.mm-ip-ratio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const idx = parseInt(btn.dataset.ratioIdx || '0');
            this.selectAspectRatio(idx);
        });

        // Upload drop zone
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

        // API key eye-toggle
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-eye').forEach(btn => {
            btn.addEventListener('click', () => {
                const inp = this.overlay!.querySelector<HTMLInputElement>(`#${btn.dataset.target}`);
                if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
            });
        });

        // Save API keys on change
        q<HTMLInputElement>('#mm-ip-gemini-key').addEventListener('change', (e) => {
            localStorage.setItem(LS_GEMINI_KEY, (e.target as HTMLInputElement).value.trim());
        });
        q<HTMLInputElement>('#mm-ip-openai-key').addEventListener('change', (e) => {
            localStorage.setItem(LS_OPENAI_KEY, (e.target as HTMLInputElement).value.trim());
        });

        // Generate button
        q<HTMLButtonElement>('#mm-ip-gen-btn').addEventListener('click', () => this.handleGenerate());

        // Layout buttons
        this.overlay!.querySelectorAll<HTMLButtonElement>('.mm-ip-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlay!.querySelectorAll('.mm-ip-layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const layout = btn.dataset.layout as ImageInsertOptions['layout'];
                // Show width row for non-full layouts
                const widthRow = q<HTMLElement>('#mm-ip-width-row');
                widthRow.style.display = layout === 'full' ? 'none' : '';
            });
        });

        // Width slider
        q<HTMLInputElement>('#mm-ip-width').addEventListener('input', (e) => {
            q<HTMLElement>('#mm-ip-width-val').textContent = (e.target as HTMLInputElement).value + '%';
        });

        // Insert button
        q<HTMLButtonElement>('#mm-ip-insert-btn').addEventListener('click', () => this.handleInsert());
    }

    // ─────────────────────────────────────────────────────────────
    // Tab Logic
    // ─────────────────────────────────────────────────────────────

    private selectAspectRatio(idx: number) {
        const r = ASPECT_RATIOS[idx];
        const svgSrc = this.createPlaceholderSvg(r.w, r.h, r.label);
        this.setPreviewImage(svgSrc, `placeholder-${r.label}`);
    }

    private createPlaceholderSvg(w: number, h: number, label: string): string {
        const W = 400;
        const H = Math.round(W * h / w);
        const color1 = '#2a2a3e';
        const color2 = '#1a1a2e';
        const textColor = '#888';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff10" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <line x1="0" y1="0" x2="${W}" y2="${H}" stroke="#ffffff08" stroke-width="1"/>
  <line x1="${W}" y1="0" x2="0" y2="${H}" stroke="#ffffff08" stroke-width="1"/>
  <text x="${W / 2}" y="${H / 2 - 10}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, sans-serif" font-size="32" fill="${textColor}" opacity="0.7">🖼</text>
  <text x="${W / 2}" y="${H / 2 + 22}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, sans-serif" font-size="14" fill="${textColor}">${label}</text>
  <text x="${W / 2}" y="${H / 2 + 42}" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, sans-serif" font-size="11" fill="${textColor}" opacity="0.5">${W} × ${H}</text>
</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    private handleFileUpload(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            this.setPreviewImage(dataUrl, file.name.replace(/\.[^.]+$/, ''));
            const captionWrap = this.overlay!.querySelector<HTMLElement>('#mm-ip-upload-caption-wrap');
            if (captionWrap) captionWrap.style.display = '';
        };
        reader.readAsDataURL(file);
    }

    private handleRefUpload(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const preview = this.overlay!.querySelector<HTMLImageElement>('#mm-ip-ref-preview');
            const label   = this.overlay!.querySelector<HTMLElement>('#mm-ip-ref-label');
            const clear   = this.overlay!.querySelector<HTMLElement>('#mm-ip-ref-clear');
            if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
            if (label)   label.style.display = 'none';
            if (clear)   clear.style.display = '';
        };
        reader.readAsDataURL(file);
    }

    // ─────────────────────────────────────────────────────────────
    // AI Generation
    // ─────────────────────────────────────────────────────────────

    private async handleGenerate() {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        const provider = q<HTMLSelectElement>('#mm-ip-provider').value;
        const prompt   = q<HTMLTextAreaElement>('#mm-ip-prompt').value.trim();
        const errorEl  = q<HTMLElement>('#mm-ip-error');
        const genLabel = q<HTMLElement>('#mm-ip-gen-label');
        const genSpinner = q<HTMLElement>('#mm-ip-gen-spinner');
        const genBtn   = q<HTMLButtonElement>('#mm-ip-gen-btn');

        errorEl.style.display = 'none';

        if (!prompt) {
            this.showError('请输入图片描述（Prompt）');
            return;
        }

        // Show loading state
        genLabel.style.display = 'none';
        genSpinner.style.display = '';
        genBtn.disabled = true;

        try {
            let imageB64 = '';
            if (provider === 'gemini') {
                imageB64 = await this.generateWithGemini(prompt);
            } else {
                imageB64 = await this.generateWithOpenAI(prompt);
            }

            const dataUrl = `data:image/png;base64,${imageB64}`;
            this.setPreviewImage(dataUrl, prompt.slice(0, 40));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.showError('生成失败：' + msg);
        } finally {
            genLabel.style.display = '';
            genSpinner.style.display = 'none';
            genBtn.disabled = false;
        }
    }

    private async generateWithGemini(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-gemini-key')?.value || '').trim();
        if (!apiKey) throw new Error('请先填写 Gemini API Key');

        // Check for reference image
        const refImg = this.overlay!.querySelector<HTMLImageElement>('#mm-ip-ref-preview');
        const hasRef = refImg && refImg.style.display !== 'none' && refImg.src;

        const instance: Record<string, unknown> = { prompt };
        if (hasRef && refImg.src.startsWith('data:')) {
            // Extract base64 from data URL
            const [header, data] = refImg.src.split(',');
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
            instance['referenceImages'] = [{
                referenceType: 'REFERENCE_TYPE_STYLE',
                referenceImage: {
                    bytesBase64Encoded: data,
                    mimeType,
                }
            }];
        }

        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [instance],
                    parameters: { sampleCount: 1 }
                }),
            }
        );

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error('API 返回数据格式异常，未找到图像数据');
        return b64;
    }

    private async generateWithOpenAI(prompt: string): Promise<string> {
        const apiKey = (this.overlay!.querySelector<HTMLInputElement>('#mm-ip-openai-key')?.value || '').trim();
        if (!apiKey) throw new Error('请先填写 OpenAI API Key');

        const resp = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1024',
                response_format: 'b64_json',
            }),
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) throw new Error('API 返回数据格式异常，未找到图像数据');
        return b64;
    }

    // ─────────────────────────────────────────────────────────────
    // Preview & Insert
    // ─────────────────────────────────────────────────────────────

    private setPreviewImage(src: string, alt: string) {
        this.currentImageSrc = src;
        const preview = this.overlay!.querySelector<HTMLElement>('#mm-ip-preview');
        if (!preview) return;

        preview.innerHTML = `<img src="${src}" alt="${alt}" style="max-width:100%;max-height:220px;border-radius:8px;object-fit:contain">`;

        // Enable insert button
        const insertBtn = this.overlay!.querySelector<HTMLButtonElement>('#mm-ip-insert-btn');
        if (insertBtn) insertBtn.disabled = false;
    }

    private showError(msg: string) {
        const errorEl = this.overlay!.querySelector<HTMLElement>('#mm-ip-error');
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = ''; }
    }

    private getCaption(): string {
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;
        if (this.currentTab === 'placeholder') {
            return q<HTMLInputElement>('#mm-ip-ph-caption').value.trim();
        } else if (this.currentTab === 'upload') {
            return q<HTMLInputElement>('#mm-ip-upload-caption').value.trim();
        } else {
            return q<HTMLInputElement>('#mm-ip-ai-caption').value.trim();
        }
    }

    private handleInsert() {
        if (!this.currentImageSrc) return;
        const q = <T extends HTMLElement>(s: string) => this.overlay!.querySelector(s) as T;

        const layoutBtn = this.overlay!.querySelector<HTMLButtonElement>('.mm-ip-layout-btn.active');
        const layout = (layoutBtn?.dataset.layout || 'center') as ImageInsertOptions['layout'];
        const width  = parseInt(q<HTMLInputElement>('#mm-ip-width').value) || 60;
        const caption = this.getCaption();

        // For placeholder SVGs, use a data URL directly; for uploads use data URL;
        // for AI-generated use data URL
        this.onInsert({
            src: this.currentImageSrc,
            alt: caption || '图片',
            caption,
            layout,
            width,
        });

        this.close();
    }
}

/**
 * Build the Markdown snippet from ImageInsertOptions.
 * Extended syntax:  ![alt](url){.layout width=N%}
 * This is processed by the extended inlineMarkdown parser in editor.ts.
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

    // Wrap with caption if provided
    if (opts.caption) {
        return `${imgLine}\n*${opts.caption}*`;
    }
    return imgLine;
}

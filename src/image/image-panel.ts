/**
 * MagMark 1.5 - Image Panel Component
 * A premium, glassmorphic image insertion & configuration panel
 */

interface ImageOpts {
    src: string;
    alt: string;
    layout: 'center' | 'float-left' | 'float-right' | 'full' | 'inline';
    width: string;
    caption: string;
}

export class ImagePanel {
    private overlay: HTMLElement | null = null;
    private onInsert: (opts: ImageOpts) => void;

    constructor(onInsert: (opts: ImageOpts) => void) {
        this.onInsert = onInsert;
        this.injectStyles();
    }

    private injectStyles() {
        if (document.getElementById('mm-image-panel-styles')) return;
        const style = document.createElement('style');
        style.id = 'mm-image-panel-styles';
        style.textContent = `
            .mm-ip-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .mm-ip-overlay.active {
                opacity: 1;
            }
            .mm-ip-modal {
                background: rgba(30, 30, 35, 0.85);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                width: 100%;
                max-width: 480px;
                padding: 32px;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
                color: #fff;
                transform: translateY(20px);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .mm-ip-overlay.active .mm-ip-modal {
                transform: translateY(0);
            }
            .mm-ip-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 24px;
                background: linear-gradient(135deg, #d4af37, #f1c40f);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .mm-ip-field {
                margin-bottom: 20px;
            }
            .mm-ip-label {
                display: block;
                font-size: 12px;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 8px;
            }
            .mm-ip-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 10px 14px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.2s;
            }
            .mm-ip-input:focus {
                background: rgba(255, 255, 255, 0.1);
                border-color: #d4af37;
                box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
            }
            .mm-ip-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            .mm-ip-layout-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-top: 8px;
            }
            .mm-ip-layout-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 8px;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s;
                text-align: center;
            }
            .mm-ip-layout-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .mm-ip-layout-btn.active {
                background: #d4af37;
                color: #000;
                border-color: #d4af37;
            }
            .mm-ip-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 32px;
            }
            .mm-ip-btn {
                padding: 10px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            .mm-ip-btn-cancel {
                background: transparent;
                color: rgba(255, 255, 255, 0.6);
            }
            .mm-ip-btn-cancel:hover {
                color: #fff;
            }
            .mm-ip-btn-primary {
                background: #d4af37;
                color: #000;
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            }
            .mm-ip-btn-primary:hover {
                background: #f1c40f;
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
            }
            /* File Input Hack */
            .mm-ip-file-row {
                display: flex;
                gap: 8px;
            }
            .mm-ip-file-btn {
                flex-shrink: 0;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            .mm-ip-file-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: #d4af37;
                color: #d4af37;
            }
        `;
        document.head.appendChild(style);
    }

    public open() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'mm-ip-overlay';

        this.overlay.innerHTML = `
            <div class="mm-ip-modal">
                <div class="mm-ip-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    插入杂志级图片
                </div>
                
                <div class="mm-ip-field">
                    <label class="mm-ip-label">图片来源 (URL 或 粘贴或浏览)</label>
                    <div class="mm-ip-file-row">
                        <input type="text" id="mm-ip-src" class="mm-ip-input" placeholder="https://example.com/image.jpg" autofocus>
                        <label class="mm-ip-file-btn" title="浏览本地文件">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <input type="file" id="mm-ip-file" accept="image/*" hidden>
                        </label>
                    </div>
                </div>

                <div class="mm-ip-field">
                    <label class="mm-ip-label">替代文本 (Alt)</label>
                    <input type="text" id="mm-ip-alt" class="mm-ip-input" placeholder="描述图片内容...">
                </div>

                <div class="mm-ip-grid">
                    <div class="mm-ip-field">
                        <label class="mm-ip-label">布局模式</label>
                        <div class="mm-ip-layout-grid" id="mm-ip-layout">
                            <div class="mm-ip-layout-btn active" data-layout="center">居中</div>
                            <div class="mm-ip-layout-btn" data-layout="float-left">左浮动</div>
                            <div class="mm-ip-layout-btn" data-layout="float-right">右浮动</div>
                            <div class="mm-ip-layout-btn" data-layout="full">全宽</div>
                            <div class="mm-ip-layout-btn" data-layout="inline">行内</div>
                        </div>
                    </div>
                    <div class="mm-ip-field">
                        <label class="mm-ip-label">显示宽度 (%)</label>
                        <input type="text" id="mm-ip-width" class="mm-ip-input" placeholder="例如: 100%, 50%">
                    </div>
                </div>

                <div class="mm-ip-field">
                    <label class="mm-ip-label">图注 (Caption)</label>
                    <input type="text" id="mm-ip-caption" class="mm-ip-input" placeholder="在图片下方显示的文字...">
                </div>

                <div class="mm-ip-actions">
                    <button class="mm-ip-btn mm-ip-btn-cancel" id="mm-ip-cancel">取消</button>
                    <button class="mm-ip-btn mm-ip-btn-primary" id="mm-ip-confirm">确认插入</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Interactions
        const confirmBtn = this.overlay.querySelector('#mm-ip-confirm') as HTMLButtonElement;
        const cancelBtn = this.overlay.querySelector('#mm-ip-cancel') as HTMLButtonElement;
        const layoutBtns = this.overlay.querySelectorAll('.mm-ip-layout-btn');
        const fileInput = this.overlay.querySelector('#mm-ip-file') as HTMLInputElement;
        const srcInput = this.overlay.querySelector('#mm-ip-src') as HTMLInputElement;

        let selectedLayout = 'center';

        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                layoutBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedLayout = (btn as HTMLElement).dataset.layout || 'center';
            });
        });

        fileInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                srcInput.value = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        });

        confirmBtn.addEventListener('click', () => {
            const opts: ImageOpts = {
                src: (this.overlay!.querySelector('#mm-ip-src') as HTMLInputElement).value,
                alt: (this.overlay!.querySelector('#mm-ip-alt') as HTMLInputElement).value,
                layout: selectedLayout as any,
                width: (this.overlay!.querySelector('#mm-ip-width') as HTMLInputElement).value,
                caption: (this.overlay!.querySelector('#mm-ip-caption') as HTMLInputElement).value,
            };
            if (!opts.src) {
                alert('请提供图片 URL 或选择本地文件');
                return;
            }
            this.onInsert(opts);
            this.close();
        });

        cancelBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Trigger animation
        requestAnimationFrame(() => {
            this.overlay!.classList.add('active');
        });
    }

    public close() {
        if (!this.overlay) return;
        this.overlay.classList.remove('active');
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        }, 300);
    }
}

/**
 * Builds the extended MagMark 1.5 image markdown syntax
 * Example: ![alt](src){.float-left width=50% caption=Hello%20World}
 */
export function buildImageMarkdown(opts: { src: string; alt: string; layout?: string; width?: string; caption?: string }) {
    const { src, alt, layout = 'center', width, caption } = opts;
    const attrs: string[] = [];

    // Default layout 'center' doesn't need a class if it's the default behavior
    if (layout && layout !== 'center') {
        attrs.push(`.${layout}`);
    }

    if (width) {
        // Ensure width has % or px
        const w = /^\d+$/.test(width) ? `${width}%` : width;
        attrs.push(`width=${w}`);
    }

    if (caption) {
        attrs.push(`caption=${encodeURIComponent(caption)}`);
    }

    const attrStr = attrs.length > 0 ? `{${attrs.join(' ')}}` : '';
    return `![${alt}](${src})${attrStr}`;
}

/**
 * CoverPanel — 封面生成面板
 * 功能：HTML模板预设 + AI (Gemini) 生成封面
 */

export type CoverData = {
    html: string;
    label: string;
};

type OnInsert = (coverHtml: string) => void;

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
    // Strip possible markdown code block wrapping
    return text.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();
}

// ─── Panel Class ─────────────────────────────────────────────────────────────

export class CoverPanel {
    private overlay!: HTMLElement;
    private onInsert: OnInsert;
    private selectedTemplate = 0;
    private currentTitle = '';
    private currentSubtitle = '';
    private previewFrame!: HTMLIFrameElement;

    constructor(onInsert: OnInsert) {
        this.onInsert = onInsert;
        this.buildDom();
    }

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

    <!-- Right: preview -->
    <div class="mm-cp-preview-wrap">
      <div class="mm-cp-section-label">预览</div>
      <div class="mm-cp-preview-box" id="mm-cp-preview-box">
        <iframe class="mm-cp-iframe" id="mm-cp-iframe" sandbox="allow-same-origin"></iframe>
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
                this.refreshPreview(COVER_TEMPLATES[this.selectedTemplate].html);
            });
        });
    }

    private bindEvents() {
        this.overlay.querySelector('.mm-cp-close')!.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        const subtitleInput = this.overlay.querySelector('#mm-cp-subtitle-input') as HTMLInputElement;

        titleInput.addEventListener('input', () => {
            this.currentTitle = titleInput.value;
            const tpl = COVER_TEMPLATES[this.selectedTemplate];
            if (tpl) this.refreshPreview(tpl.html);
        });
        subtitleInput.addEventListener('input', () => {
            this.currentSubtitle = subtitleInput.value;
            const tpl = COVER_TEMPLATES[this.selectedTemplate];
            if (tpl) this.refreshPreview(tpl.html);
        });

        // AI generate
        this.overlay.querySelector('#mm-cp-generate-btn')!.addEventListener('click', () => this.onGenerate());

        // Insert button
        this.overlay.querySelector('#mm-cp-insert-btn')!.addEventListener('click', () => {
            const frame = this.previewFrame;
            const html = frame?.contentDocument?.body?.innerHTML || '';
            if (html) { this.onInsert(html); this.close(); }
        });
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

    private refreshPreview(rawHtml: string) {
        const injected = this.injectTextIntoHtml(rawHtml);
        // Inherit the current theme CSS vars by copying root styles
        const rootVars = (() => {
            const s = getComputedStyle(document.documentElement);
            const keys = ['--th-bg-page','--th-text-page','--th-primary','--th-accent','--mm-font-family','--user-font-family'];
            return keys.map(k => `${k}:${s.getPropertyValue(k)};`).join('');
        })();
        const doc = this.previewFrame.contentDocument!;
        const googleFonts = (document.querySelector('link[href*="fonts.googleapis"]') as HTMLLinkElement)?.href || '';
        doc.open();
        doc.write(`<!DOCTYPE html><html><head>
            ${googleFonts ? `<link rel="stylesheet" href="${googleFonts}">` : ''}
            <style>*{margin:0;padding:0;box-sizing:border-box}
            html,body{width:100%;height:100%;overflow:hidden}
            body{:root{${rootVars}}</style>
        </head><body style="${rootVars}width:100%;height:100%">${injected}</body></html>`);
        doc.close();
    }

    private async onGenerate() {
        const apiKey = (this.overlay.querySelector('#mm-cp-apikey') as HTMLInputElement).value.trim();
        const prompt = (this.overlay.querySelector('#mm-cp-prompt') as HTMLTextAreaElement).value.trim();
        const statusEl = this.overlay.querySelector('#mm-cp-ai-status') as HTMLElement;
        const btn = this.overlay.querySelector('#mm-cp-generate-btn') as HTMLButtonElement;

        if (!apiKey) { statusEl.textContent = '请先输入 Gemini API Key'; statusEl.style.color = '#e55'; return; }
        if (!prompt) { statusEl.textContent = '请输入封面描述提示词'; statusEl.style.color = '#e55'; return; }

        btn.disabled = true;
        statusEl.textContent = '生成中…';
        statusEl.style.color = 'var(--th-primary, #d4af37)';

        try {
            const fullPrompt = `标题：${this.currentTitle || '(未填写)'}\n副标题：${this.currentSubtitle || '(未填写)'}\n\n${prompt}`;
            const html = await callGemini(apiKey, fullPrompt);
            this.refreshPreview(html);
            // Deselect templates since we have AI result
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

    open(title = '', subtitle = '') {
        this.currentTitle = title;
        this.currentSubtitle = subtitle;
        const titleInput = this.overlay.querySelector('#mm-cp-title-input') as HTMLInputElement;
        titleInput.value = title;
        this.overlay.style.display = 'flex';
        this.refreshPreview(COVER_TEMPLATES[this.selectedTemplate].html);
    }

    close() {
        this.overlay.style.display = 'none';
    }
}

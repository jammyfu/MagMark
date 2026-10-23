// A controlled layout fixture, not a screenshot or full editor/WeChat test.
window.paginationFixtureCSS = `
* { box-sizing: border-box; }
.magmark { font: var(--mm-font-size, 18px)/var(--mm-line-height, 1.6) sans-serif;
  letter-spacing: var(--mm-letter-spacing, 0em); overflow-wrap: break-word; }
p { margin: 0 0 12px; } h2 { margin: 0 0 16px; font-size: 26px; }
ul, ol { margin: 0 0 12px; padding-left: 28px; } li { margin: 0 0 4px; }
pre { margin: 0 0 12px; white-space: pre-wrap; font: 16px/24px monospace; }
table { width: 100%; border-collapse: collapse; } th,td { border: 1px solid; padding: 5px; }
.magmark .mm-split-fragment--before { margin-bottom: 0; }
.magmark .mm-split-fragment--after { margin-top: 0; }
`;
window.paginationCases = {};
(() => {
  const cases = window.paginationCases;
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const dom = html => { const el = document.createElement('div'); el.innerHTML = html; return el; };
  const state = extra => ({ ...window.mmState.initialState, fontSize: 18, lineHeight: 1.6,
    letterSpacing: 0, fontFamily: 'sans-serif', pageOverrides: {}, blockOverrides: {}, ...extra });
  const text = pages => pages.map(p => dom(p.html).textContent).join('');
  const render = (blocks, extra = {}, manual = false) => window.mmPagination.paginate(blocks, state(extra), manual);
  const fits = (pages, format = 'a4') => {
    const dims = window.mmPagination.getPageDimensions(format);
    const footer = { a4: 40, mobile: 36, desktop: 40, xiaohongshu: 0 }[format];
    const available = dims.h - dims.pt - dims.pb - dims.safetyMargin - footer;
    for (let i = 0; i < pages.length; i++) {
      const el = dom(pages[i].html); el.className = 'magmark';
      el.style.cssText = `width:${dims.w-dims.pl-dims.pr}px;--mm-font-size:${pages[i].settings.fontSize}px;--mm-line-height:${pages[i].settings.lineHeight};--mm-letter-spacing:${pages[i].settings.letterSpacing}em;`;
      document.body.append(el);
      try { assert(el.scrollHeight <= available + 1, `page ${i+1} height ${el.scrollHeight} exceeds ${available}`); }
      finally { el.remove(); }
    }
  };
  const listNumbers = html => {
    const all = [];
    for (const list of dom(html).querySelectorAll('ol')) {
      const items = [...list.children].filter(n => n.tagName === 'LI');
      let n = list.hasAttribute('start') ? list.start : list.reversed ? items.length : 1;
      for (const item of items) {
        if (item.hasAttribute('value')) n = item.value;
        all.push(n); n += list.reversed ? -1 : 1;
      }
    }
    return all;
  };
  cases['empty input and manual breaks'] = async () => {
    assert((await render([])).length === 0, 'empty document must have no pages');
    const pages = await render(['<p>甲</p>', '<hr>', '<p>乙</p>'], {}, true);
    assert(pages.length === 2 && text(pages) === '甲乙', 'manual break lost content');
    assert(dom(pages[1].html).firstElementChild.dataset.blockId === 'p1-b0', 'block ID changed');
  };
  cases['single paragraph spans three or more pages'] = async () => {
    const original = '中文 mixed typography needs stable pagination. '.repeat(360);
    const pages = await render([`<p>${original}</p>`]);
    assert(pages.length >= 3, 'oversized first paragraph was not fragmented');
    assert(text(pages) === original, 'paragraph text changed'); fits(pages);
  };
  cases['graphemes and cross-inline whitespace survive splitting'] = async () => {
    const html = '<p>' + '<span>𠀀e\u0301👩🏽‍💻中文</span> <strong>API</strong>\n<em>测试🇨🇳结束。</em>'.repeat(200) + '</p>';
    const original = dom(html).textContent;
    const boundaries = new Set([...new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(original)].map(s => s.index));
    boundaries.add(original.length);
    const pages = await render([html]);
    assert(pages.length >= 3, 'mixed paragraph was not fragmented');
    assert(text(pages) === original, 'whitespace/inline content was lost');
    let cursor = 0;
    for (const page of pages) { cursor += dom(page.html).textContent.length; assert(boundaries.has(cursor), 'split inside a grapheme'); }
    fits(pages);
  };
  cases['ordered list continuation including explicit item values'] = async () => {
    const html = '<ol start="7">' + Array.from({length: 140}, (_, i) => `<li${i===41 ? ' value="200"' : ''}>项目 ${i}</li>`).join('') + '</ol>';
    const pages = await render([html]);
    assert(pages.length >= 3, 'long list was not fragmented');
    assert(JSON.stringify(listNumbers(pages.map(p=>p.html).join(''))) === JSON.stringify(listNumbers(html)), 'ordered list numbering restarted');
    assert(text(pages) === dom(html).textContent, 'list text changed'); fits(pages);
  };
  cases['reversed list without explicit start preserves numbering'] = async () => {
    const html = '<ol reversed>' + Array.from({length: 100}, (_,i)=>`<li>倒数 ${i}</li>`).join('') + '</ol>';
    const pages = await render([html]);
    assert(pages.length >= 3, 'reversed list was not fragmented');
    assert(JSON.stringify(listNumbers(pages.map(p=>p.html).join(''))) === JSON.stringify(listNumbers(html)), 'reversed implicit start changed'); fits(pages);
  };
  cases['code newlines and syntax spans are conserved'] = async () => {
    const html = '<pre><code>' + Array.from({length:180}, (_,i)=>`<span class="token">const</span> x${i} = ${i};\n`).join('') + '</code></pre>';
    const pages = await render([html]);
    assert(pages.length >= 3, 'code was not fragmented');
    assert(text(pages) === dom(html).textContent, 'code newline or text lost at page boundary');
    assert(dom(pages.map(p=>p.html).join('')).querySelectorAll('.token').length === 180, 'syntax spans lost'); fits(pages);
  };
  cases['table bodies caption columns footer and header are preserved'] = async () => {
    const rows = start => Array.from({length:60}, (_,i)=>`<tr><td>${start+i}</td><td>单元格 ${start+i}</td></tr>`).join('');
    const html = `<table><caption>重要表格</caption><colgroup><col style="width:30%"><col></colgroup><thead><tr><th>编号</th><th>说明</th></tr></thead><tbody>${rows(0)}</tbody><tbody>${rows(60)}</tbody><tfoot><tr><td colspan="2">总计120</td></tr></tfoot></table>`;
    const pages = await render([html]);
    assert(pages.length >= 3, 'table was not fragmented');
    const out = dom(pages.map(p=>p.html).join(''));
    assert(out.querySelectorAll('tbody tr').length === 120, 'body rows lost');
    assert([...out.querySelectorAll('tbody td')].map(n=>n.textContent).join('|') === [...dom(html).querySelectorAll('tbody td')].map(n=>n.textContent).join('|'), 'table cell content changed');
    assert(out.querySelectorAll('caption').length === 1, 'caption lost or repeated');
    assert(out.querySelectorAll('tfoot').length === 1, 'footer lost or repeated');
    assert(out.querySelectorAll('colgroup').length === pages.length, 'column definitions lost');
    assert(out.querySelectorAll('thead').length === pages.length, 'header not repeated'); fits(pages);
  };
  cases['row spans stay in one fragment'] = async () => {
    const groups = Array.from({length:30}, (_, g) => `<tr data-group="${g}"><td rowspan="4">组${g}</td><td>A</td></tr>` + [1,2,3].map(i=>`<tr data-group="${g}"><td>${i}</td></tr>`).join('')).join('');
    const pages = await render([`<table><tbody>${groups}</tbody></table>`]);
    assert(pages.length >= 3, 'rowspan table was not fragmented');
    for (const page of pages) {
      const counts = {};
      dom(page.html).querySelectorAll('tr[data-group]').forEach(r => { counts[r.dataset.group] = (counts[r.dataset.group] || 0) + 1; });
      assert(Object.values(counts).every(n=>n===4), 'rowspan group split between pages');
    }
    fits(pages);
  };
  cases['block overrides are included in combined measurements'] = async () => {
    const original = '排版 override content. '.repeat(160);
    const pages = await render([`<p>${original}</p>`], {blockOverrides: {'p0-b0': {fontSize:36, lineHeight:1.8, letterSpacing:0}}});
    assert(pages.length >= 3, 'override fixture did not split');
    assert(text(pages) === original, 'override lost text'); fits(pages);
  };
  cases['unbreakable oversized block has an explicit diagnostic'] = async () => {
    const pages = await render(['<figure><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22200%22%20height=%222000%22/%3E" style="width:200px;height:2000px" alt="source"></figure>']);
    assert(pages.length === 1, 'atomic block should be kept intact');
    assert(pages[0].diagnostics?.some(d => d.code === 'oversized-block'), 'overflow silently accepted');
    assert(dom(pages[0].html).querySelector('img').getAttribute('alt') === 'source', 'image identity lost');
  };
  cases['measurement container is removed after an exception'] = async () => {
    const before = document.querySelectorAll('.page').length;
    const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
    assert(original?.get, 'scrollHeight getter is unavailable');
    let rejected = false;
    Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get() { throw new Error('fixture measurement failure'); } });
    try { await render(['<p>测试</p>']); }
    catch { rejected = true; }
    finally { Object.defineProperty(Element.prototype, 'scrollHeight', original); }
    assert(rejected, 'measurement error was swallowed');
    assert(document.querySelectorAll('.page').length === before, 'measurement container leaked');
  };
  cases['format dimensions and per-page settings remain usable'] = async () => {
    for (const format of ['a4','mobile','desktop','xiaohongshu']) {
      const pages = await render(['<p>阅读测试 Reading.</p>'], {format, pageOverrides:{1:{fontSize:20,lineHeight:1.7,letterSpacing:0}}});
      assert(pages.length === 1 && pages[0].settings.fontSize === 20, 'format/page settings regressed'); fits(pages, format);
    }
  };
  cases['Chinese punctuation and nonbreaking units are not cut incorrectly'] = async () => {
    const original = '「（中文）API，测试12\u00a0kg单位。下一句继续。」'.repeat(220);
    const pages = await render([`<p>${original}</p>`]);
    assert(pages.length >= 3 && text(pages) === original, 'punctuation fixture did not conserve content');
    for (let i = 1; i < pages.length; i++) {
      const left = dom(pages[i-1].html).textContent;
      const right = dom(pages[i].html).textContent;
      assert(!/[（(「『【《]$/.test(left), 'opening punctuation at page end');
      assert(!/^[，。！？、；：）)」』】》]/.test(right), 'closing punctuation at page start');
      assert(!left.endsWith('\u00a0') && !right.startsWith('\u00a0'), 'nonbreaking unit was split');
    }
    fits(pages);
  };
  cases['rowspan zero remains within its complete row group'] = async () => {
    const groups = Array.from({length: 12}, (_,g) => `<tbody data-group="${g}"><tr><td rowspan="0">组${g}</td><td>首行</td></tr>` + Array.from({length:7}, (_,i)=>`<tr><td>${i}</td></tr>`).join('') + '</tbody>').join('');
    const pages = await render([`<table>${groups}</table>`]);
    assert(pages.length >= 3, 'rowspan-zero fixture did not split');
    const bodies = dom(pages.map(p=>p.html).join('')).querySelectorAll('tbody');
    assert(bodies.length === 12 && [...bodies].every(body=>body.rows.length===8), 'rowspan zero group split or lost');
    fits(pages);
  };
  cases['inline image identities occur exactly once after fragmentation'] = async () => {
    const src = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%228%22%20height=%228%22/%3E';
    const html = '<p>' + Array.from({length:120}, (_,i)=>`图文混排 <strong>正文 ${i}</strong><img data-mm-src="assets/${i}.svg" src="${src}" style="width:8px;height:8px" alt="图${i}">正文结束。`).join('') + '</p>';
    const pages = await render([html]);
    assert(pages.length >= 3 && text(pages) === dom(html).textContent, 'inline image fixture did not conserve text');
    const images = [...dom(pages.map(p=>p.html).join('')).querySelectorAll('img')];
    assert(images.length === 120 && images.every((img,i)=>img.getAttribute('data-mm-src')===`assets/${i}.svg`), 'image source identity lost or duplicated');
    fits(pages);
  };
  cases['missing grapheme support preserves text and reports the limitation'] = async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter');
    const original = '中文𠀀👩🏽‍💻'.repeat(1000);
    Object.defineProperty(Intl, 'Segmenter', { configurable: true, value: undefined });
    try {
      const pages = await render([`<p>${original}</p>`]);
      assert(text(pages) === original, 'fallback corrupted text');
      assert(pages[0].diagnostics?.some(d=>d.reason==='grapheme-segmentation-unavailable'), 'missing Segmenter was not reported');
    } finally { Object.defineProperty(Intl, 'Segmenter', descriptor); }
  };
  cases['a lone heading and unbreakable content make forward progress'] = async () => {
    const pages = await render(['<h2 style="height:650px">标题</h2>', '<figure style="height:900px"><figcaption>图注</figcaption></figure>']);
    assert(pages.length === 2 && text(pages) === '标题图注', 'heading/atomic pair did not terminate conservatively');
    assert(pages[1].diagnostics?.some(d=>d.code==='oversized-block'), 'atomic overflow missing');
  };
})();

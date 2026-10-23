/** Split trusted, simple tables into readable landscape sheets before pagination. */
export function layoutTableSheets(html: string, options: {
  width: number; height: number; fontSize: number; lineHeight: number; fontFamily: string;
}): string {
  const host = document.createElement('div');
  host.className = 'magmark';
  host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  host.style.setProperty('--mm-font-size', `${options.fontSize}px`);
  host.style.setProperty('--mm-line-height', String(options.lineHeight));
  host.style.setProperty('--mm-font-family', options.fontFamily);
  host.innerHTML = html;
  document.body.append(host);
  try {
    for (const source of Array.from(host.querySelectorAll<HTMLTableElement>(':scope > table'))) {
      if (!source.tHead || !source.tBodies.length || source.querySelector('[colspan], [rowspan]')) continue;
      const headers = Array.from(source.tHead.rows[0].cells);
      const rows = Array.from(source.tBodies[0].rows);
      if (headers.length < 2 || !rows.length) continue;
      // Repeat the identifying first column when distributing remaining columns.
      const groups: number[][] = [];
      for (let start = 1; start < headers.length; start += 2) {
        groups.push([0, ...Array.from({ length: Math.min(2, headers.length - start) }, (_, j) => start + j)]);
      }
      const sheets: HTMLElement[] = [];
      for (const [groupIndex, indices] of groups.entries()) {
        let table: HTMLTableElement;
        let body: HTMLTableSectionElement;
        const create = () => {
          table = document.createElement('table');
          table.style.cssText = `width:${options.height}px;max-width:none;table-layout:fixed;margin:0;font-size:${options.fontSize}px;line-height:${options.lineHeight}`;
          table.createCaption().textContent = `第 ${groupIndex + 1} / ${groups.length} 组 · 第 ${sheets.length + 1} 张`;
          const head = table.createTHead().insertRow();
          indices.forEach(index => head.append(headers[index].cloneNode(true)));
          body = table.createTBody();
          host.append(table);
        };
        const finish = () => {
          if (!body.rows.length) { table.remove(); return; }
          const h = table.offsetHeight;
          const sheet = document.createElement('section');
          sheet.className = 'mm-rotated-table';
          sheet.setAttribute('aria-label', `表格第 ${groupIndex + 1} 组，第 ${sheets.length + 1} 张`);
          sheet.style.cssText = `position:relative;width:${h}px;max-width:100%;height:${options.height}px;margin:0;break-inside:avoid`;
          table.style.position = 'absolute';
          table.style.left = `${h}px`;
          table.style.top = '0';
          table.style.transformOrigin = '0 0';
          table.style.transform = 'rotate(90deg)';
          sheet.append(table);
          sheets.push(sheet);
        };
        create();
        for (const row of rows) {
          const cells = indices.map(index => row.cells[index] || document.createElement('td'));
          const full = document.createElement('tr');
          cells.forEach(cell => full.append(cell.cloneNode(true)));
          body!.append(full);
          if (table!.offsetHeight <= options.width) continue;
          full.remove();
          if (body!.rows.length) { finish(); create(); }
          body!.append(full);
          if (table!.offsetHeight <= options.width) continue;
          full.remove();
          // A single verbose row can span sheets. Slice DOM text ranges so code,
          // emphasis and links survive, without shrinking the readable font.
          const lengths = cells.map(cell => cell.textContent?.length || 0);
          const offsets = cells.map(() => 0);
          const fragment = (limit: number) => {
            const tr = document.createElement('tr');
            cells.forEach((cell, index) => {
              if (index === 0 && lengths[index] <= 80) { tr.append(cell.cloneNode(true)); return; }
              const copy = cell.cloneNode(false) as HTMLElement;
              const from = offsets[index];
              const to = Math.min(lengths[index], from + limit);
              copy.append(sliceCell(cell, from, to));
              tr.append(copy);
            });
            return tr;
          };
          while (offsets.some((offset, index) => offset < lengths[index])) {
            let low = 1, high = Math.max(...lengths.map((length, index) => length - offsets[index])), best = 0;
            while (low <= high) {
              const mid = Math.floor((low + high) / 2);
              const trial = fragment(mid);
              body!.append(trial);
              const fits = table!.offsetHeight <= options.width;
              trial.remove();
              if (fits) { best = mid; low = mid + 1; } else high = mid - 1;
            }
            if (!best) throw new Error('当前纸张无法容纳表头和一行文字，请减小字号或使用纵向记录模式。');
            body!.append(fragment(best));
            offsets.forEach((offset, index) => { offsets[index] = Math.min(lengths[index], offset + best); });
            finish(); create();
          }
        }
        finish();
      }
      source.replaceWith(...sheets);
    }
    return host.innerHTML;
  } finally { host.remove(); }
}

function sliceCell(cell: Element, from: number, to: number): DocumentFragment {
  let offset = 0;
  const copy = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const start = Math.max(0, from - offset), end = Math.min(text.length, to - offset);
      offset += text.length;
      return end > start ? document.createTextNode(text.slice(start, end)) : null;
    }
    const clone = node.cloneNode(false);
    for (const child of Array.from(node.childNodes)) { const part = copy(child); if (part) clone.appendChild(part); }
    return clone.hasChildNodes() || (node.nodeName === 'BR' && offset >= from && offset < to) ? clone : null;
  };
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(cell.childNodes)) { const part = copy(child); if (part) fragment.append(part); }
  return fragment;
}

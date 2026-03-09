import { AppState, PageSetting, getFormatDefaultSetting } from '../core/state';

export interface PageResult {
    html: string;
    settings: PageSetting;
}

/**
 * Page footer height in pixels (must stay in sync with .page-footer CSS).
 * Xiaohongshu has no footer.
 */
const FOOTER_HEIGHTS: Record<string, number> = {
    a4: 40,
    mobile: 36,
    desktop: 40,
    xiaohongshu: 0,
};

/**
 * Page dimensions — must stay in sync with editor.css .page-* rules.
 * safetyMargin buffers against:
 *   (a) sub-pixel rendering differences
 *   (b) CSS margin-collapse overestimation during isolated block measurement
 *   (c) general overflow prevention
 */
export function getPageDimensions(format: AppState['format']) {
    const formats = {
        a4:          { w: 595,  h: 842,  pt: 56, pb: 40, pl: 52, pr: 52, safetyMargin: 32 },
        mobile:      { w: 393,  h: 852,  pt: 32, pb: 32, pl: 24, pr: 24, safetyMargin: 24 },
        desktop:     { w: 800,  h: 1000, pt: 64, pb: 40, pl: 72, pr: 72, safetyMargin: 32 },
        xiaohongshu: { w: 1080, h: 1440, pt: 64, pb: 64, pl: 64, pr: 64, safetyMargin: 48 },
    };
    return formats[format];
}

function isHeadingBlock(html: string): boolean {
    return /^\s*<h[1-6][\s>]/i.test(html);
}

function isHrBlock(html: string): boolean {
    return /^\s*<hr\b/i.test(html);
}

function isParagraphBlock(html: string): boolean {
    return /^\s*<p[\s>]/i.test(html);
}

function isListBlock(html: string): boolean {
    return /^\s*<(ul|ol)[\s>]/i.test(html);
}

function isPreBlock(html: string): boolean {
    return /^\s*<pre[\s>]/i.test(html);
}

function collectTextNodes(root: Node): Text[] {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return node.textContent?.trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });

    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
        nodes.push(current as Text);
        current = walker.nextNode();
    }
    return nodes;
}

function normalizeSplitIndex(text: string, rawIndex: number): number {
    if (rawIndex <= 0) return 0;
    if (rawIndex >= text.length) return text.length;

    const preferred = /[\s,.;:!?，。；：！？、）)\]}」』】]/;
    for (let i = rawIndex; i >= Math.max(1, rawIndex - 24); i--) {
        if (preferred.test(text[i - 1])) return i;
    }

    for (let i = rawIndex; i <= Math.min(text.length, rawIndex + 16); i++) {
        if (preferred.test(text[i - 1])) return i;
    }

    return rawIndex;
}

function buildSplitFragment(
    element: HTMLElement,
    textNodes: Text[],
    splitIndex: number,
    takeBefore: boolean
): HTMLElement | null {
    const totalChars = textNodes.reduce((sum, node) => sum + (node.textContent?.length ?? 0), 0);
    if (splitIndex <= 0 || splitIndex >= totalChars) return null;

    const target = element.cloneNode(false) as HTMLElement;
    const range = document.createRange();

    let traversed = 0;
    let boundaryNode: Text | null = null;
    let boundaryOffset = 0;

    for (const node of textNodes) {
        const len = node.textContent?.length ?? 0;
        if (splitIndex <= traversed + len) {
            boundaryNode = node;
            boundaryOffset = splitIndex - traversed;
            break;
        }
        traversed += len;
    }

    if (!boundaryNode) return null;

    if (takeBefore) {
        range.setStart(element, 0);
        range.setEnd(boundaryNode, boundaryOffset);
    } else {
        range.setStart(boundaryNode, boundaryOffset);
        range.setEnd(element, element.childNodes.length);
    }

    target.appendChild(range.cloneContents());
    target.classList.add(takeBefore ? 'mm-split-fragment--before' : 'mm-split-fragment--after');
    target.dataset.splitFragment = takeBefore ? 'before' : 'after';
    return target.textContent?.trim() ? target : null;
}

function splitParagraphBlock(
    html: string,
    remainingHeight: number,
    availableH: number,
    measurer: HTMLElement,
    settings: PageSetting,
    blockOverride: PageSetting | undefined,
    fontFamily: string
): { before: string; after: string; beforeHeight: number } | null {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const paragraph = wrapper.firstElementChild as HTMLElement | null;
    if (!paragraph || paragraph.tagName !== 'P') return null;

    const textNodes = collectTextNodes(paragraph);
    if (textNodes.length === 0) return null;

    const totalText = paragraph.textContent ?? '';
    if (totalText.trim().length < 20) return null;

    const minSplitHeight = Math.max(settings.fontSize * settings.lineHeight * 1.2, 32);
    if (remainingHeight < minSplitHeight) return null;

    let low = 1;
    let high = totalText.length - 1;
    let bestIndex = -1;
    let bestHeight = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidateIndex = normalizeSplitIndex(totalText, mid);
        const beforeEl = buildSplitFragment(paragraph, textNodes, candidateIndex, true);
        const afterEl = buildSplitFragment(paragraph, textNodes, candidateIndex, false);

        if (!beforeEl || !afterEl) {
            high = mid - 1;
            continue;
        }

        const beforeHtml = beforeEl.outerHTML;
        const afterHtml = afterEl.outerHTML;
        const beforeHeight = measureBlock(beforeHtml, measurer, settings, blockOverride, fontFamily);
        const afterHeight = measureBlock(afterHtml, measurer, settings, blockOverride, fontFamily);

        if (beforeHeight <= remainingHeight && afterHeight <= availableH) {
            bestIndex = candidateIndex;
            bestHeight = beforeHeight;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (bestIndex === -1) return null;

    const beforeEl = buildSplitFragment(paragraph, textNodes, bestIndex, true);
    const afterEl = buildSplitFragment(paragraph, textNodes, bestIndex, false);
    if (!beforeEl || !afterEl) return null;

    return {
        before: beforeEl.outerHTML,
        after: afterEl.outerHTML,
        beforeHeight: bestHeight,
    };
}

function splitListBlock(
    html: string,
    remainingHeight: number,
    availableH: number,
    measurer: HTMLElement,
    settings: PageSetting,
    blockOverride: PageSetting | undefined,
    fontFamily: string
): { before: string; after: string; beforeHeight: number } | null {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const list = wrapper.firstElementChild as HTMLElement | null;
    if (!list || !['UL', 'OL'].includes(list.tagName)) return null;

    const items = Array.from(list.children).filter((child) => child.tagName === 'LI') as HTMLElement[];
    if (items.length < 2) return null;

    let low = 1;
    let high = items.length - 1;
    let bestCount = -1;
    let bestHeight = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        const beforeList = list.cloneNode(false) as HTMLElement;
        beforeList.append(...items.slice(0, mid).map((item) => item.cloneNode(true)));
        const afterList = list.cloneNode(false) as HTMLElement;
        afterList.append(...items.slice(mid).map((item) => item.cloneNode(true)));

        if (beforeList.children.length === 0 || afterList.children.length === 0) {
            high = mid - 1;
            continue;
        }

        const beforeHtml = beforeList.outerHTML;
        const afterHtml = afterList.outerHTML;
        const beforeHeight = measureBlock(beforeHtml, measurer, settings, blockOverride, fontFamily);
        const afterHeight = measureBlock(afterHtml, measurer, settings, blockOverride, fontFamily);

        if (beforeHeight <= remainingHeight && afterHeight <= availableH) {
            bestCount = mid;
            bestHeight = beforeHeight;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (bestCount === -1) return null;

    const beforeList = list.cloneNode(false) as HTMLElement;
    beforeList.append(...items.slice(0, bestCount).map((item) => item.cloneNode(true)));
    const afterList = list.cloneNode(false) as HTMLElement;
    afterList.append(...items.slice(bestCount).map((item) => item.cloneNode(true)));

    return {
        before: beforeList.outerHTML,
        after: afterList.outerHTML,
        beforeHeight: bestHeight,
    };
}

function splitPreBlock(
    html: string,
    remainingHeight: number,
    availableH: number,
    measurer: HTMLElement,
    settings: PageSetting,
    blockOverride: PageSetting | undefined,
    fontFamily: string
): { before: string; after: string; beforeHeight: number } | null {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const pre = wrapper.firstElementChild as HTMLElement | null;
    if (!pre || pre.tagName !== 'PRE') return null;

    const code = pre.querySelector('code');
    const contentEl = code || pre;
    const text = contentEl.textContent || '';
    const lines = text.split('\n');
    if (lines.length < 4) return null;

    const minLines = 2;
    let low = minLines;
    let high = lines.length - minLines;
    let bestCount = -1;
    let bestHeight = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        const beforePre = pre.cloneNode(false) as HTMLElement;
        const beforeCode = code ? (code.cloneNode(false) as HTMLElement) : beforePre;
        beforeCode.textContent = lines.slice(0, mid).join('\n');
        if (code) beforePre.appendChild(beforeCode);

        const afterPre = pre.cloneNode(false) as HTMLElement;
        const afterCode = code ? (code.cloneNode(false) as HTMLElement) : afterPre;
        afterCode.textContent = lines.slice(mid).join('\n');
        if (code) afterPre.appendChild(afterCode);

        const beforeHtml = beforePre.outerHTML;
        const afterHtml = afterPre.outerHTML;
        const beforeHeight = measureBlock(beforeHtml, measurer, settings, blockOverride, fontFamily);
        const afterHeight = measureBlock(afterHtml, measurer, settings, blockOverride, fontFamily);

        if (beforeHeight <= remainingHeight && afterHeight <= availableH) {
            bestCount = mid;
            bestHeight = beforeHeight;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (bestCount === -1) return null;

    const beforePre = pre.cloneNode(false) as HTMLElement;
    const beforeCode = code ? (code.cloneNode(false) as HTMLElement) : beforePre;
    beforeCode.textContent = lines.slice(0, bestCount).join('\n');
    if (code) beforePre.appendChild(beforeCode);

    const afterPre = pre.cloneNode(false) as HTMLElement;
    const afterCode = code ? (code.cloneNode(false) as HTMLElement) : afterPre;
    afterCode.textContent = lines.slice(bestCount).join('\n');
    if (code) afterPre.appendChild(afterCode);

    return {
        before: beforePre.outerHTML,
        after: afterPre.outerHTML,
        beforeHeight: bestHeight,
    };
}

/**
 * Measure a block's full rendered height including CSS margins (getComputedStyle).
 * The measurer must already be in the DOM with the correct width set.
 */
function measureBlock(
    html: string,
    measurer: HTMLElement,
    settings: PageSetting,
    blockOverride: PageSetting | undefined,
    fontFamily: string
): number {
    measurer.style.setProperty('--mm-font-size',      settings.fontSize + 'px');
    measurer.style.setProperty('--mm-line-height',    String(settings.lineHeight));
    measurer.style.setProperty('--mm-letter-spacing', settings.letterSpacing + 'em');
    measurer.style.setProperty('--mm-font-family',    fontFamily);
    measurer.innerHTML = html;

    const el = measurer.firstElementChild as HTMLElement | null;
    if (!el) return 0;

    if (blockOverride) {
        el.style.fontSize      = blockOverride.fontSize + 'px';
        el.style.lineHeight    = String(blockOverride.lineHeight);
        el.style.letterSpacing = blockOverride.letterSpacing + 'em';
    }

    // Force layout recalculation
    void el.offsetHeight;

    const cs = window.getComputedStyle(el);
    const marginTop    = parseFloat(cs.marginTop)    || 0;
    const marginBottom = parseFloat(cs.marginBottom) || 0;

    return el.offsetHeight + marginTop + marginBottom;
}

function measurePageContent(
    blocks: string[],
    measurer: HTMLElement,
    settings: PageSetting,
    fontFamily: string
): number {
    measurer.style.setProperty('--mm-font-size', settings.fontSize + 'px');
    measurer.style.setProperty('--mm-line-height', String(settings.lineHeight));
    measurer.style.setProperty('--mm-letter-spacing', settings.letterSpacing + 'em');
    measurer.style.setProperty('--mm-font-family', fontFamily);
    measurer.innerHTML = blocks.join('');
    void measurer.offsetHeight;
    return measurer.scrollHeight;
}

/**
 * Some formats hard-code typography via child-level CSS custom properties,
 * e.g. `.page-xiaohongshu .magmark { --mm-font-size: 32px; --mm-line-height: 1.8 }`.
 * That CSS wins over the inherited value set on the parent .page element,
 * so the measurer MUST use these same values — otherwise measured heights
 * can be ~2× off and pagination will be completely wrong.
 */
function getEffectiveMeasureBase(state: AppState): PageSetting {
    const defaults = getFormatDefaultSetting(state.format);
    return {
        fontSize:      state.fontSize ?? defaults.fontSize,
        lineHeight:    state.lineHeight ?? defaults.lineHeight,
        letterSpacing: state.letterSpacing ?? defaults.letterSpacing,
    };
}

/**
 * Pre-measure all blocks with base settings for a fast first pass.
 */
function preMeasureBlocks(
    blocks: string[],
    measurer: HTMLElement,
    base: PageSetting,
    fontFamily: string
): number[] {
    return blocks.map(block => isHrBlock(block) ? 0 : measureBlock(block, measurer, base, undefined, fontFamily));
}

/**
 * Main pagination engine — v1.5
 *
 * Key improvements over v1.4:
 *  1. Accurate margin measurement via getComputedStyle (replaces fontSize×1.5 hack)
 *  2. Footer-height deduction from available space
 *  3. Orphan-heading prevention: a lonely heading at page bottom moves to next page
 *  4. Oversized-block safety: a block taller than one page still gets its own page
 *  5. Two-pass approach: pre-measure then allocate, with targeted re-measurement
 *     when page settings override base settings
 *  6. Parallel height array eliminates index arithmetic bugs
 */
export async function paginate(
    blocks: string[],
    state: AppState,
    manualPagination: boolean
): Promise<PageResult[]> {
    if (blocks.length === 0) return [];
    const workBlocks = [...blocks];

    const dim        = getPageDimensions(state.format);
    const footerH    = FOOTER_HEIGHTS[state.format] ?? 0;
    const availableH = dim.h - dim.pt - dim.pb - dim.safetyMargin - footerH;

    // ── Hidden measurement container ─────────────────────────────────────────
    const measurePage = document.createElement('div');
    measurePage.className = `page page-${state.format}`;
    measurePage.style.cssText = [
        'visibility:hidden',
        'position:absolute',
        'top:-9999px',
        'left:-9999px',
        'pointer-events:none',
        'z-index:-1',
        'transform:none',
        'display:block',
        // Override the page-format CSS height (e.g. page-xiaohongshu: height:1440px) and
        // overflow:hidden so the measurer can grow beyond one page's worth of content.
        // Without this, scrollHeight/offsetHeight may be capped at 1440px and all content
        // appears to fit on a single page, preventing correct multi-page generation.
        'height:auto',
        'overflow:visible',
    ].join(';');
    const measurer = document.createElement('div');
    measurer.className = 'page-content magmark';
    measurer.style.width = `${dim.w - dim.pl - dim.pr}px`;
    // Disable CSS transitions so font-size/line-height changes apply instantly during measurement.
    measurer.style.transition = 'none';
    measurePage.appendChild(measurer);
    document.body.appendChild(measurePage);

    // Effective base must match the page-level CSS variables actually used when rendering.
    const measureBase = getEffectiveMeasureBase(state);

    // ── Pass 1: pre-measure all blocks with base settings ────────────────────
    const preHeights = preMeasureBlocks(workBlocks, measurer, measureBase, state.fontFamily);

    // ── Pass 2: allocate blocks to pages ─────────────────────────────────────
    const pages: PageResult[] = [];
    let pageBlocks:  string[] = [];
    let pageHeights: number[] = [];
    let pageHeight = 0;

    const flushPage = (settings: PageSetting) => {
        if (pageBlocks.length === 0) return;
        pages.push({ html: pageBlocks.join(''), settings: { ...settings } });
        pageBlocks  = [];
        pageHeights = [];
        pageHeight  = 0;
    };

    const remeasure = (html: string, settings: PageSetting, over?: PageSetting): number => {
        if (isHrBlock(html)) return 0;
        return measureBlock(html, measurer, settings, over, state.fontFamily);
    };

    const measureCurrentPage = (settings: PageSetting): number =>
        pageBlocks.length > 0
            ? measurePageContent(pageBlocks, measurer, settings, state.fontFamily)
            : 0;

    let idx = 0;

    while (idx < workBlocks.length) {
        const pageNum = pages.length + 1;
        // Fall back to measureBase (not raw state) so xiaohongshu pages default
        // to 32px/1.8 — matching what CSS renders — unless the user has a page override.
        const settings: PageSetting = state.pageOverrides[pageNum] ?? { ...measureBase };

        const block = workBlocks[idx];
        const isHr  = isHrBlock(block);

        // Manual page-break via HR
        if (manualPagination && isHr) {
            flushPage(settings);
            idx++;
            continue;
        }

        // Auto mode: HR is just a visual divider
        if (!manualPagination && isHr) {
            pageBlocks.push(block);
            pageHeights.push(0);
            pageHeight = measureCurrentPage(settings);
            idx++;
            continue;
        }

        // Determine actual height (re-measure only when page/block overrides differ from
        // the base that was used for Pass 1 — avoids redundant DOM measurements).
        const estBid = `p${pages.length}-b${pageBlocks.length}`;
        const blockOver = state.blockOverrides[estBid];
        const hasOverride =
            blockOver ||
            settings.fontSize      !== measureBase.fontSize      ||
            settings.lineHeight    !== measureBase.lineHeight    ||
            settings.letterSpacing !== measureBase.letterSpacing;

        const bHeight = hasOverride ? remeasure(block, settings, blockOver) : preHeights[idx];
        const candidateBlocks = [...pageBlocks, block];
        const candidateHeight = measurePageContent(candidateBlocks, measurer, settings, state.fontFamily);

        // Would this block cause the page to overflow?
        if (candidateHeight > availableH && pageBlocks.length > 0) {
            if (isPreBlock(block)) {
                const split = splitPreBlock(
                    block,
                    availableH - measureCurrentPage(settings),
                    availableH,
                    measurer,
                    settings,
                    blockOver,
                    state.fontFamily
                );

                if (split) {
                    const splitCandidateBlocks = [...pageBlocks, split.before];
                    const splitCandidateHeight = measurePageContent(splitCandidateBlocks, measurer, settings, state.fontFamily);

                    if (splitCandidateHeight <= availableH) {
                        pageBlocks.push(split.before);
                        pageHeights.push(split.beforeHeight);
                        pageHeight = splitCandidateHeight;
                        workBlocks[idx] = split.after;
                        preHeights[idx] = remeasure(split.after, settings, blockOver);
                        flushPage(settings);
                        continue;
                    }
                }
            }

            if (isListBlock(block)) {
                const split = splitListBlock(
                    block,
                    availableH - measureCurrentPage(settings),
                    availableH,
                    measurer,
                    settings,
                    blockOver,
                    state.fontFamily
                );

                if (split) {
                    const splitCandidateBlocks = [...pageBlocks, split.before];
                    const splitCandidateHeight = measurePageContent(splitCandidateBlocks, measurer, settings, state.fontFamily);

                    if (splitCandidateHeight <= availableH) {
                        pageBlocks.push(split.before);
                        pageHeights.push(split.beforeHeight);
                        pageHeight = splitCandidateHeight;
                        workBlocks[idx] = split.after;
                        preHeights[idx] = remeasure(split.after, settings, blockOver);
                        flushPage(settings);
                        continue;
                    }
                }
            }

            if (isParagraphBlock(block)) {
                const split = splitParagraphBlock(
                    block,
                    availableH - measureCurrentPage(settings),
                    availableH,
                    measurer,
                    settings,
                    blockOver,
                    state.fontFamily
                );

                if (split) {
                    const splitCandidateBlocks = [...pageBlocks, split.before];
                    const splitCandidateHeight = measurePageContent(splitCandidateBlocks, measurer, settings, state.fontFamily);

                    if (splitCandidateHeight <= availableH) {
                        pageBlocks.push(split.before);
                        pageHeights.push(split.beforeHeight);
                        pageHeight = splitCandidateHeight;
                        workBlocks[idx] = split.after;
                        preHeights[idx] = remeasure(split.after, settings, blockOver);
                        flushPage(settings);
                        continue;
                    }
                }
            }

            // Orphan-heading prevention: if the last block already added is a heading,
            // pull it off the current page and push it to the next one so the heading
            // stays with the content that follows it.
            if (isHeadingBlock(pageBlocks[pageBlocks.length - 1])) {
                const remainingAfterHeading = availableH - pageHeight;
                const minFollowSpace = Math.max(settings.fontSize * settings.lineHeight * 1.1, 48);

                if (remainingAfterHeading >= minFollowSpace) {
                    flushPage(settings);
                    continue;
                }

                const orphanHtml   = pageBlocks.pop()!;
                pageHeights.pop()!;
                pageHeight = measureCurrentPage(settings);

                flushPage(settings);

                // Orphan heading is first block of the new page
                pageBlocks.push(orphanHtml);
                pageHeights.push(remeasure(orphanHtml, settings));
                pageHeight = measureCurrentPage(settings);

                // Re-process current block on next iteration (don't increment idx)
                continue;
            }

            // Standard overflow: flush and reprocess on new page
            flushPage(settings);
            continue; // don't increment idx
        }

        // Block fits (or is the first block — always add regardless of height)
        pageBlocks.push(block);
        pageHeights.push(bHeight);
        pageHeight = candidateHeight;
        idx++;

        // Oversized single block: flush it immediately and move on
        if (pageHeight > availableH && pageBlocks.length === 1) {
            flushPage(settings);
        }
    }

    // Flush remaining content
    if (pageBlocks.length > 0) {
        const finalSettings: PageSetting = state.pageOverrides[pages.length + 1] ?? { ...measureBase };
        pages.push({ html: pageBlocks.join(''), settings: finalSettings });
    }

    // ── Pass 3: inject block IDs and restore saved overrides ─────────────────
    pages.forEach((p, pageIdx) => {
        const temp = document.createElement('div');
        temp.innerHTML = p.html;
        Array.from(temp.children).forEach((child, bIdx) => {
            const bid = `p${pageIdx}-b${bIdx}`;
            (child as HTMLElement).dataset.blockId = bid;

            const over = state.blockOverrides[bid];
            if (over) {
                const el = child as HTMLElement;
                el.style.setProperty('font-size',      over.fontSize + 'px');
                el.style.setProperty('line-height',    String(over.lineHeight));
                el.style.setProperty('letter-spacing', over.letterSpacing + 'em');
            }
        });
        p.html = temp.innerHTML;
    });

    document.body.removeChild(measurePage);
    return pages;
}

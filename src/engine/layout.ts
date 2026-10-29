import { AppState, PageSetting, getFormatDefaultSetting } from '../core/state';
import { splitContentBlock, countTextLines } from './block-fragmentation';
import { hasGraphemeSegmentation } from './text-boundaries';

export interface PaginationDiagnostic {
    code: 'oversized-block';
    reason: 'unsplittable' | 'grapheme-segmentation-unavailable';
    sourceBlockIndex: number;
    measuredHeight: number;
    availableHeight: number;
}

export interface PageResult {
    html: string;
    settings: PageSetting;
    diagnostics?: PaginationDiagnostic[];
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
        // safetyMargin: buffer for sub-pixel rounding + margin-collapse estimation
        // Kept small so pages pack tightly without visible overflow.
        a4:          { w: 595,  h: 842,  pt: 56, pb: 40, pl: 52, pr: 52, safetyMargin: 16 },
        mobile:      { w: 393,  h: 852,  pt: 32, pb: 32, pl: 24, pr: 24, safetyMargin: 12 },
        desktop:     { w: 800,  h: 1000, pt: 64, pb: 40, pl: 72, pr: 72, safetyMargin: 16 },
        xiaohongshu: { w: 1080, h: 1440, pt: 64, pb: 64, pl: 64, pr: 64, safetyMargin: 20 },
    };
    return formats[format];
}

function isHeadingBlock(html: string): boolean {
    return /^\s*<h[1-6][\s>]/i.test(html);
}

function isHrBlock(html: string): boolean {
    return /^\s*<hr\b/i.test(html);
}

/**
 * Best-effort image sizing for synchronous measurement, not a readiness barrier.
 * Cached/decoded images and explicit SVG sizes can provide dimensions. An
 * undecoded raster image cannot be assumed to load synchronously; unknown block
 * images keep the existing 16:9 estimate. Final resource readiness remains a
 * separate renderer task, and inline images retain their existing treatment.
 */
function fixImageDimensions(container: HTMLElement): void {
    const containerW = container.clientWidth || 400;

    container.querySelectorAll<HTMLImageElement>('img').forEach(img => {
        // Skip images that already have explicit CSS height set
        if (img.style.height || img.style.width) return;

        // ── Inline vs block distinction ──────────────────────────────────────
        // Inline images (badges, icons) live inside <p>, <a>, <li>, etc.
        // Their natural height is tiny (20–40 px) so measuring them as 0-height
        // while they're loading is fine — the paragraph's font-based line height
        // dominates anyway.
        //
        // Block images live inside <figure> elements and ARE the whole block.
        // If we leave them at 0-height the paginator thinks the block is empty
        // and puts it on the current page; when the image finally loads it
        // overflows the page boundary and gets clipped.
        //
        // Therefore: only apply dimension-fixing to <figure> images.
        const isBlockImage = !!img.closest('figure');
        if (!isBlockImage) return;

        let natW = 0, natH = 0;

        if (img.complete && img.naturalWidth > 0) {
            // Already decoded (cached or data URI resolved)
            natW = img.naturalWidth;
            natH = img.naturalHeight;
        } else if (img.src.startsWith('data:image/svg+xml')) {
            // Parse dimensions from inline SVG source
            try {
                const comma = img.src.indexOf(',');
                const raw   = img.src.slice(comma + 1);
                const text  = img.src.includes(';base64,') ? atob(raw) : decodeURIComponent(raw);
                const wm = text.match(/\bwidth="(\d+(?:\.\d+)?)"/);
                const hm = text.match(/\bheight="(\d+(?:\.\d+)?)"/);
                if (wm && hm) { natW = parseFloat(wm[1]); natH = parseFloat(hm[1]); }
            } catch { /* ignore malformed SVG */ }
        } else if (img.src.startsWith('data:image/')) {
            // For other data URIs (PNG, JPEG, etc.), probe with a temp Image object.
            // This is synchronous for data URIs that have already been decoded.
            try {
                const probe = new Image();
                probe.src = img.src;
                if (probe.complete && probe.naturalWidth > 0) {
                    natW = probe.naturalWidth;
                    natH = probe.naturalHeight;
                }
            } catch { /* ignore */ }
        }

        if (natW > 0 && natH > 0) {
            const dispW  = Math.min(natW, containerW);
            const dispH  = Math.round(dispW * natH / natW);
            img.style.width  = dispW  + 'px';
            img.style.height = dispH + 'px';
        } else if (!img.complete || img.naturalWidth === 0) {
            // Block image not yet loaded — apply 16:9 fallback so the figure block
            // is measured with a sensible height rather than 0.
            img.style.height = Math.round(containerW * 9 / 16) + 'px';
            img.style.width  = '100%';
        }
    });
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
    fixImageDimensions(measurer);
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
 * Pagination measures combined fragments so margins and overrides match output.
 * Supported blocks consume a fitting prefix and keep paginating the remainder.
 * Atomic overflow is preserved with diagnostics; resource readiness is separate.
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
        'height:auto',       // override page-xiaohongshu: height:1440px
        'overflow:visible',  // override page-xiaohongshu: overflow:hidden
    ].join(';');
    const measurer = document.createElement('div');
    measurer.className = 'page-content magmark';
    measurer.style.width = `${dim.w - dim.pl - dim.pr}px`;
    measurer.style.transition = 'none'; // prevent font-size transitions during measurement
    measurePage.appendChild(measurer);
    document.body.appendChild(measurePage);

    try {
        // Effective base must match the page-level CSS variables actually used when rendering.
        const measureBase = getEffectiveMeasureBase(state);

        // ── Allocate blocks to pages ─────────────────────────────────────
        const pages: PageResult[] = [];
        let pageBlocks:  string[] = [];
        let pageHeight = 0;
        let pageDiagnostics: PaginationDiagnostic[] = [];

        const flushPage = (settings: PageSetting) => {
            if (pageBlocks.length === 0) return;
            pages.push({ html: pageBlocks.join(''), settings: { ...settings },
                ...(pageDiagnostics.length ? { diagnostics: pageDiagnostics } : {}) });
            pageDiagnostics = [];
            pageBlocks  = [];
            pageHeight  = 0;
        };

        const measureCurrentPage = (settings: PageSetting): number =>
            pageBlocks.length > 0
                ? measurePageContent(pageBlocks, measurer, settings, state.fontFamily)
                : 0;

        let idx = 0;

        while (idx < workBlocks.length) {
            const pageNum = pages.length + 1;
            // Use the format defaults unless there is an explicit page override.
            const settings: PageSetting = state.pageOverrides[pageNum] ?? { ...measureBase };

            let block = workBlocks[idx];
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
                pageHeight = measureCurrentPage(settings);
                idx++;
                continue;
            }

            // Apply the same page/block typography used by the visible preview.
            const estBid = `p${pages.length}-b${pageBlocks.length}`;
            const blockOver = state.blockOverrides[estBid];
            // Measure the same effective inline typography that the final pass renders.
            if (blockOver) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = block;
                const element = wrapper.firstElementChild as HTMLElement | null;
                if (element) {
                    element.style.fontSize = blockOver.fontSize + 'px';
                    element.style.lineHeight = String(blockOver.lineHeight);
                    element.style.letterSpacing = blockOver.letterSpacing + 'em';
                    block = element.outerHTML;
                }
            }
            const candidateBlocks = [...pageBlocks, block];
            const candidateHeight = measurePageContent(candidateBlocks, measurer, settings, state.fontFamily);

            // Would this block cause the page to overflow?
            if (candidateHeight > availableH) {
                // Helper: apply a successful split result to the current page.
                // split.beforeHeight is now the *total page height* after adding the before-fragment
                // (measured in combined context by the split function itself).
                const applySplit = (split: { before: string; after: string; beforeHeight: number }): boolean => {
                    // Final safety-check using combined measurement (should always pass, but be safe).
                    const verifiedH = measurePageContent([...pageBlocks, split.before], measurer, settings, state.fontFamily);
                    if (verifiedH > availableH) return false;

                    pageBlocks.push(split.before);
                    pageHeight = verifiedH;
                    workBlocks[idx] = split.after;
                    flushPage(settings);
                    return true;
                };

                const split = splitContentBlock(block, {
                    availableHeight: availableH,
                    measurePrefix: html => {
                        const height = measurePageContent([...pageBlocks, html], measurer, settings, state.fontFamily);
                        return { height, lines: countTextLines(measurer.lastElementChild as HTMLElement | null, 2) };
                    },
                    measureRemainder: html => {
                        const height = measurePageContent([html], measurer, settings, state.fontFamily);
                        return { height, lines: countTextLines(measurer.firstElementChild as HTMLElement | null, 2) };
                    },
                });
                if (split && applySplit(split)) continue;

                // An atomic block cannot make progress by flushing an empty page.
                // Keep the content and report the overflow instead of claiming a fit.
                if (pageBlocks.length === 0) {
                    pageBlocks.push(block);
                    pageDiagnostics.push({ code: 'oversized-block', sourceBlockIndex: idx,
                        reason: !hasGraphemeSegmentation() && /^\s*<p(?:\s|>)/i.test(block)
                            ? 'grapheme-segmentation-unavailable' : 'unsplittable',
                        measuredHeight: candidateHeight, availableHeight: availableH });
                    idx++;
                    flushPage(settings);
                    continue;
                }

                // Figure/image blocks are never split — always push intact to the next page.
                // (No split function is attempted; fall through to standard overflow below.)

                // Orphan-heading prevention: if the last block already added is a heading,
                // pull it off the current page and push it to the next one so the heading
                // stays with the content that follows it.
                // Require at least 2 lines of follow-space — 1 line is not enough for readability.
                if (pageBlocks.length > 1 && isHeadingBlock(pageBlocks[pageBlocks.length - 1])) {
                    const remainingAfterHeading = availableH - pageHeight;
                    const minFollowSpace = Math.max(settings.fontSize * settings.lineHeight * 2.2, 80);

                    if (remainingAfterHeading >= minFollowSpace) {
                        flushPage(settings);
                        continue;
                    }

                    const orphanHtml   = pageBlocks.pop()!;
                    pageHeight = measureCurrentPage(settings);

                    flushPage(settings);

                    // Orphan heading is first block of the new page
                    pageBlocks.push(orphanHtml);
                    pageHeight = measureCurrentPage(settings);

                    // Re-process current block on next iteration (don't increment idx)
                    continue;
                }

                // Standard overflow: flush and reprocess on new page
                flushPage(settings);
                continue; // don't increment idx
            }

            // This complete block fits; preserve its effective typography.
            pageBlocks.push(block);
            pageHeight = candidateHeight;
            idx++;


        }

        // Flush remaining content
        if (pageBlocks.length > 0) {
            const finalSettings: PageSetting = state.pageOverrides[pages.length + 1] ?? { ...measureBase };
            flushPage(finalSettings);
        }

        // ── Inject block IDs and restore saved overrides ─────────────────
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

        return pages;
    } finally {
        measurePage.remove();
    }
}

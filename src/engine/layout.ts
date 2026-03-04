import { AppState, PageSetting } from '../core/state';

export interface PageResult {
    html: string;
    settings: PageSetting;
}

/**
 * Page dimensions MUST stay in sync with editor.css .page-a4 / .page-mobile / .page-desktop
 * w: CSS width, h: CSS height
 * pt: padding-top, pb: padding-bottom, pl: padding-left, pr: padding-right
 * safetyMargin: extra buffer so content never reaches the exact bottom edge
 */
export function getPageDimensions(format: AppState['format']) {
    const formats = {
        // .page-a4: width:595px; height:842px; padding:56px 52px 40px
        a4: { w: 595, h: 842, pt: 56, pb: 40, pl: 52, pr: 52, safetyMargin: 24 },
        // .page-mobile: width:393px; height:852px; padding:32px 24px 32px
        mobile: { w: 393, h: 852, pt: 32, pb: 32, pl: 24, pr: 24, safetyMargin: 20 },
        // .page-desktop: width:800px; height:1000px; padding:64px 72px 40px
        desktop: { w: 800, h: 1000, pt: 64, pb: 40, pl: 72, pr: 72, safetyMargin: 24 },
        // .page-xiaohongshu: 1080×1440px 原尺寸 (官方标准 3:4)，safetyMargin 要大
        xiaohongshu: { w: 1080, h: 1440, pt: 80, pb: 80, pl: 64, pr: 64, safetyMargin: 80 },
    };
    return formats[format];
}

export async function paginate(
    blocks: string[],
    state: AppState,
    manualPagination: boolean
): Promise<PageResult[]> {
    const dim = getPageDimensions(state.format);
    // How many CSS pixels of content can fit vertically on one page
    const availableHeight = dim.h - dim.pt - dim.pb - dim.safetyMargin;

    const measurer = document.createElement('div');
    measurer.className = 'magmark-measurer magmark';
    // Match exact content-box width of the page
    measurer.style.width = `${dim.w - dim.pl - dim.pr}px`;
    measurer.style.visibility = 'hidden';
    measurer.style.position = 'absolute';
    measurer.style.top = '-9999px';
    document.body.appendChild(measurer);

    const pages: PageResult[] = [];
    let currentPageBlocks: string[] = [];
    let currentHeight = 0;
    let blockIdx = 0;

    while (blockIdx < blocks.length) {
        const pageNum = pages.length + 1;
        const currentSettings = state.pageOverrides[pageNum] || {
            fontSize: state.fontSize,
            lineHeight: state.lineHeight,
            letterSpacing: state.letterSpacing
        };

        const block = blocks[blockIdx];

        // 1. Check for manual page break
        if (manualPagination && block.includes('<hr')) {
            if (currentPageBlocks.length > 0) {
                pages.push({
                    html: currentPageBlocks.join(''),
                    settings: { ...currentSettings }
                });
                currentPageBlocks = [];
                currentHeight = 0;
            }
            blockIdx++;
            continue;
        }

        // 2. Apply styling and measure
        measurer.style.setProperty('--mm-font-size', currentSettings.fontSize + 'px');
        measurer.style.setProperty('--mm-line-height', String(currentSettings.lineHeight));
        measurer.style.setProperty('--mm-letter-spacing', currentSettings.letterSpacing + 'em');
        measurer.style.setProperty('--mm-font-family', state.fontFamily);

        // Measure block height
        measurer.innerHTML = block;

        // Handle block-level overrides during measurement
        const blockId = `p${pages.length}-b${currentPageBlocks.length}`;
        const bOver = state.blockOverrides[blockId];
        if (bOver) {
            const firstChild = measurer.firstElementChild as HTMLElement;
            if (firstChild) {
                firstChild.style.fontSize = bOver.fontSize + 'px';
                firstChild.style.lineHeight = String(bOver.lineHeight);
                firstChild.style.letterSpacing = bOver.letterSpacing + 'em';
            }
        }

        const bHeight = (measurer.firstElementChild as HTMLElement)?.offsetHeight || 0;
        const margin = currentSettings.fontSize * 1.5;

        // 3. Decide whether to break page
        if (currentHeight + bHeight + margin > availableHeight && currentPageBlocks.length > 0) {
            pages.push({
                html: currentPageBlocks.join(''),
                settings: { ...currentSettings }
            });
            currentPageBlocks = [];
            currentHeight = 0;
            // Don't increment blockIdx, it will be processed on next page
        } else {
            currentPageBlocks.push(block);
            currentHeight += bHeight + margin;
            blockIdx++;
        }
    }

    if (currentPageBlocks.length > 0) {
        const finalSettings = state.pageOverrides[pages.length + 1] || {
            fontSize: state.fontSize,
            lineHeight: state.lineHeight,
            letterSpacing: state.letterSpacing
        };
        pages.push({
            html: currentPageBlocks.join(''),
            settings: { ...finalSettings }
        });
    }

    // Final Post-processing: Inject Block IDs
    pages.forEach((p, pageIdx) => {
        const temp = document.createElement('div');
        temp.innerHTML = p.html;
        Array.from(temp.children).forEach((child, blockIdx) => {
            const bid = `p${pageIdx}-b${blockIdx}`;
            (child as HTMLElement).dataset.blockId = bid;

            const over = state.blockOverrides[bid];
            if (over) {
                (child as HTMLElement).style.setProperty('font-size', over.fontSize + 'px');
                (child as HTMLElement).style.setProperty('line-height', String(over.lineHeight));
                (child as HTMLElement).style.setProperty('letter-spacing', over.letterSpacing + 'em');
            }
        });
        p.html = temp.innerHTML;
    });

    document.body.removeChild(measurer);
    return pages;
}

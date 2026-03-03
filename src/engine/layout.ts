import { AppState, PageSetting } from '../core/state';

export interface PageResult {
    html: string;
    settings: PageSetting;
}

export function getPageDimensions(format: AppState['format']) {
    const formats = {
        a4: { w: 794, h: 1123, pt: 60, pb: 60 },
        mobile: { w: 393, h: 852, pt: 40, pb: 40 },
        desktop: { w: 800, h: 1200, pt: 50, pb: 50 }
    };
    return formats[format];
}

export async function paginate(
    blocks: string[],
    state: AppState,
    manualPagination: boolean
): Promise<PageResult[]> {
    const dim = getPageDimensions(state.format);
    const availableHeight = dim.h - dim.pt - dim.pb;

    const measurer = document.createElement('div');
    measurer.className = 'magmark-measurer magmark';
    measurer.style.width = `${dim.w - 80}px`; // 40px padding each side
    measurer.style.visibility = 'hidden';
    measurer.style.position = 'absolute';
    measurer.style.top = '-9999px';
    document.body.appendChild(measurer);

    const pages: PageResult[] = [];
    let currentPageBlocks: string[] = [];
    let currentHeight = 0;
    let blockIdx = 0;

    // Measurement cache to avoid DOM thrashing
    const heightCache = new Map<string, number>();

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

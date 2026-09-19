import { CoverPanel as FreeformCoverPanel } from './cover-panel-legacy';
import { ResponsiveCoverPanel } from './responsive/panel';
import { preserveLazyCoverInvoker } from './lazy-cover-focus';
export type { CoverData } from './cover-panel-legacy';

/** Preserve existing freeform APIs and drafts; add an opt-in structured workflow. */
export class CoverPanel extends FreeformCoverPanel {
  private responsive?: ResponsiveCoverPanel;
  private disposeFocus?: () => void;
  constructor(onInsert: (coverHtml: string) => void) {
    super(onInsert);
    const overlays = document.querySelectorAll<HTMLDialogElement>('.mm-cp-overlay');
    const overlay = overlays.item(overlays.length - 1);
    if (!overlay) return;
    this.disposeFocus = preserveLazyCoverInvoker(overlay);
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'mm-cp-responsive';
    button.textContent = '一稿多比例';
    button.title = '以当前标题、副标题和首张本地图片创建联动设计；自由排版原稿保留';
    button.style.cssText = 'margin-left:auto;padding:8px 12px;border:1px solid currentColor;border-radius:7px;background:transparent;color:inherit;font:inherit;cursor:pointer';
    overlay.querySelector('.mm-cp-header')?.append(button);
    button.addEventListener('click', () => {
      const seed = {
        title: overlay.querySelector<HTMLTextAreaElement>('#mm-cp-title-input')?.value || '',
        subtitle: overlay.querySelector<HTMLTextAreaElement>('#mm-cp-subtitle-input')?.value || '',
        image: overlay.querySelector<HTMLIFrameElement>('#mm-cp-iframe')?.contentDocument?.querySelector<HTMLImageElement>('.mm-cover img')?.getAttribute('src') || '',
      };
      this.responsive ??= new ResponsiveCoverPanel(onInsert, () => super.open());
      super.close();
      this.responsive.open(seed);
    });
  }
  override destroy() {
    this.responsive?.destroy();
    super.destroy();
    this.disposeFocus?.();
  }
}

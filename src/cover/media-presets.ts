/** Checked 2026-09-18. Pixel dimensions are export presets, not universal upload limits. */
export const MEDIA_PRESETS = [
  { id: 'xhs-note', name: '小红书 · 图文封面 / 内页', ratio: '3:4', width: 1080, height: 1440, note: '常用推荐；同组图片保持一致比例。', source: 'https://xiaohongshu.oimi.ai/zh/blog/xiaohongshu-image-ratio' },
  { id: 'xhs-square', name: '小红书 · 方形预览图', ratio: '1:1', width: 1080, height: 1080, note: '可选设计比例，并非唯一要求。', source: 'https://xiaohongshu.oimi.ai/zh/blog/xiaohongshu-image-ratio' },
  { id: 'wx-wide', name: '公众号 · 横版封面', ratio: '2.35:1', width: 940, height: 400, note: '与方形封面分别检查裁切；文字避免贴边。', source: 'https://framelab.cn/guides/wechat-article-image-size' },
  { id: 'wx-square', name: '公众号 · 方形列表预览', ratio: '1:1', width: 1080, height: 1080, note: '不同列表入口可能裁切，不代表所有入口固定展示。', source: 'https://framelab.cn/guides/wechat-article-image-size' },
  { id: 'article-hero', name: '公众号 / 网站 · 正文头图', ratio: '16:9', width: 1600, height: 900, note: '编辑建议：正文图片没有统一强制宽高比。', source: 'https://framelab.cn/guides/wechat-article-image-size' },
  { id: 'vertical-video', name: '短视频 · 竖屏画面', ratio: '9:16', width: 1080, height: 1920, note: '通用画面预设，不等同于各平台主页封面；列表可能另行裁切。', source: 'https://support.google.com/youtube/answer/6375112' },
  { id: 'bili-cover', name: '哔哩哔哩 · 4:3 封面', ratio: '4:3', width: 1200, height: 900, note: '社区实测参考；建议同时准备 16:9，以上传界面为准。', source: 'https://www.bilibili.com/read/cv11029957/' },
  { id: 'youtube-cover', name: 'YouTube · 视频缩略图', ratio: '16:9', width: 3840, height: 2160, note: '官方当前推荐分辨率；移动端上传限 2MB，桌面端 50MB。', source: 'https://support.google.com/youtube/answer/72431' },
  { id: 'youtube-shorts', name: 'YouTube · Shorts 封面', ratio: '9:16', width: 2160, height: 3840, note: '官方当前推荐；其他平台主页封面不可直接照搬。', source: 'https://support.google.com/youtube/answer/72431' },
] as const;

export interface MediaDraft { title: string; subtitle: string; html: string; ratio: number }
export function updateMediaDrafts(drafts: Record<string, MediaDraft>, id: string, next: MediaDraft, shared: boolean) {
  return Object.fromEntries(Object.entries(drafts).map(([key, value]) => [key,
    key === id ? { ...next } : shared ? { ...next, ratio: value.ratio } : { ...value }]));
}

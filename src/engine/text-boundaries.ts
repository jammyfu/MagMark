/** Interior UTF-16 offsets at safe grapheme/word boundaries, never code-unit guesses. */
interface Segment { segment: string; index: number }
interface SegmenterInstance { segment(text: string): Iterable<Segment> }
type SegmenterConstructor = new (locale?: string, options?: { granularity: 'grapheme' }) => SegmenterInstance;

const ideograph = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const pictograph = /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u;
const opening = /[（(\[｛{〈《「『【〔〖〘〚“‘]$/u;
const closing = /^[，。！？、；：）)\]｝}〉》」』】〕〗〙〛”’…,.!?;:]/u;
const nonBreaking = /[\u00a0\u202f\u2060\ufeff]/u;

export function hasGraphemeSegmentation(): boolean {
  return typeof Intl !== 'undefined' &&
    typeof (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter === 'function';
}

export function legalTextBreaks(text: string): number[] {
  // Conservative fallback: keep an atomic block instead of corrupting a grapheme.
  // The caller reports oversized content; code-point iteration is NOT a full fallback.
  if (!hasGraphemeSegmentation()) return [];
  const Segmenter = (Intl as unknown as { Segmenter: SegmenterConstructor }).Segmenter;
  const segments = [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
  const result: number[] = [];
  for (let i = 1; i < segments.length; i++) {
    const left = segments[i - 1].segment;
    const right = segments[i].segment;
    if (nonBreaking.test(left + right) || opening.test(left) || closing.test(right)) continue;
    // Keep alphabetic words intact. Chinese/Japanese/Korean, punctuation, ordinary
    // whitespace and whole emoji provide candidate boundaries, not inserted text.
    if (/\s|[-‐–—/]/u.test(left) || /[，。！？、；：）)\]」』】,.;:!?]$/u.test(left) ||
        ideograph.test(left + right) || pictograph.test(left + right)) {
      result.push(segments[i].index);
    }
  }
  return result;
}

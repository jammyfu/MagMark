import { describe, expect, it } from 'vitest';
import { generateOpenGraphTags, generateTwitterTags, type ArticleData } from '../src/seo/meta-tags';
import { generateSitemap } from '../src/seo/sitemap-generator';
const article: ArticleData = { headline:'中文 English',description:'摘要',author:'作者',publishedTime:'2026-09-15T00:00:00Z',images:[],tags:[],category:'技术' };
describe('legacy generators with optional values', () => {
  it('generates OG tags with absent optional metadata', () => {
    const tags = generateOpenGraphTags(article, 'https://example.test');
    expect(tags.join('')).toContain('中文 English'); expect(tags.join('')).not.toContain('article:modified_time');
  });
  it('generates OG tags with present optional metadata', () => {
    const tags = generateOpenGraphTags({...article,modifiedTime:'2026-09-16T00:00:00Z',tags:['排版']}, 'https://example.test');
    expect(tags.join('')).toContain('article:modified_time'); expect(tags.join('')).toContain('排版');
  });
  it('generates Twitter tags without an invented image', () => {
    const tags = generateTwitterTags(article, 'https://example.test');
    expect(tags.join('')).toContain('twitter:title'); expect(tags.join('')).not.toContain('twitter:image');
  });
  it('uses sitemap defaults when optional fields are explicitly undefined', () => {
    const result = generateSitemap([{loc:'https://example.test/article'}],{excludePaths:undefined,maxURLsPerFile:undefined});
    expect(result.xml).toContain('https://example.test/article'); expect(result.files).toEqual(['sitemap.xml']);
  });
  it('rejects a nonpositive split size instead of looping', () => {
    expect(() => generateSitemap([{loc:'https://example.test/a'}],{maxURLsPerFile:0})).toThrow(RangeError);
  });
});

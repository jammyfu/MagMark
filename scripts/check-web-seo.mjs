import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const base = new URL(process.env.MAGMARK_SITE_URL || 'https://magmark.cn/').href;
for (const path of ['', 'guide/', 'guide/en/']) {
  const html = readFileSync(`dist-web/${path}index.html`, 'utf8');
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, base + path);
  assert.ok(doc.title.length > 15);
  assert.ok(doc.querySelector('meta[name="description"]').content.length > 40);
  assert.ok(!doc.querySelector('meta[name="robots"]').content.includes('noindex'));
  assert.ok(!doc.querySelector('link[rel="manifest"]'));
  assert.ok(!html.includes('%BASE_URL%') && !/127\.0\.0\.1|localhost/.test(html));
  for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) JSON.parse(el.textContent);
  for (const el of doc.querySelectorAll('[src], link[href], meta[property="og:image"]')) {
    const value = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('content');
    const url = new URL(value, base + path);
    if (url.href.startsWith(base)) {
      const local = 'dist-web/' + url.pathname.slice(new URL(base).pathname.length);
      assert.ok(existsSync(local), `Missing built resource: ${url.href}`);
    }
  }
  if (path) {
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.querySelectorAll('link[hreflang]').length, 3);
    assert.ok(doc.querySelector('main').textContent.length > 800);
    assert.equal(doc.querySelectorAll('table tbody tr').length, 6);
  } else assert.ok(doc.querySelector('a.workspace-guide-link'));
}
assert.ok(readFileSync('dist-web/robots.txt', 'utf8').includes(`Sitemap: ${base}sitemap.xml`));
const sitemap = readFileSync('dist-web/sitemap.xml','utf8');
if (base === 'https://magmark.cn/') {
  for (const file of (await import('node:fs')).readdirSync('dist-web/assets').filter(f => /\.(js|css)$/.test(f))) {
    const content = readFileSync(`dist-web/assets/${file}`, 'utf8');
    assert.ok(!/bubufu\.com\/tools\/magmark|magamark\.cn/.test(content), `Old MagMark URL in ${file}`);
  }
}
for (const path of ['', 'guide/', 'guide/en/']) assert.ok(sitemap.includes(`<loc>${base+path}</loc>`));
assert.ok(readFileSync('dist-web/llms.txt','utf8').includes(base+'guide/en/'));
console.log('SEO checks passed: canonical, crawlable guides, alternates, metadata, schema, sitemap and local assets.');

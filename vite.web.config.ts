import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const siteUrl = new URL(process.env.MAGMARK_SITE_URL || 'https://magmark.cn/');
const base = process.env.MAGMARK_BASE_PATH || siteUrl.pathname;
if (!siteUrl.pathname.endsWith('/') || siteUrl.search || siteUrl.hash || siteUrl.protocol !== 'https:') {
  throw new Error('MAGMARK_SITE_URL must be an HTTPS URL ending in / without query or fragment');
}
if (base !== siteUrl.pathname) throw new Error('MAGMARK_BASE_PATH must match MAGMARK_SITE_URL pathname');

// Standalone editor; keep the existing library build independent.
export default defineConfig({
  base,
  plugins: [react(), {
    name: 'magmark-site-identity',
    transformIndexHtml: {
      order: 'pre',
      handler: html => html.replaceAll('https://magmark.cn/', siteUrl.href),
    },
  }],
  publicDir: 'web-public',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist-web', sourcemap: false, minify: 'terser' },
});

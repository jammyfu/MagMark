import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const base = process.env.MAGMARK_BASE_PATH || '/tools/magmark2/';

// Standalone editor; keep the existing library build independent.
export default defineConfig({
  base,
  plugins: [react()],
  publicDir: 'web-public',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist-web', sourcemap: false, minify: 'terser' },
});

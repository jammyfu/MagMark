import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { dependencies } from './package.json';

/** The default build is the user-facing web app; SDK packaging is explicit. */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build: mode === 'library' ? {
    outDir: 'dist/lib',
    lib: { entry: path.resolve(__dirname, 'src/index.ts'), name: 'MagMark', fileName: format => `magmark.${format}.js` },
    rollupOptions: {
      external: (id: string) => id.startsWith('node:') || builtinModules.includes(id) || Object.keys(dependencies).some(name => id === name || id.startsWith(name + '/')),
    },
    sourcemap: true,
  } : {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: { input: path.resolve(__dirname, 'index.html') },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { globals: true, environment: 'node', include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] },
}));

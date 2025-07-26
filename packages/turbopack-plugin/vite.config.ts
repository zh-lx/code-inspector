import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['cjs', 'es'],
      fileName: '[name]',
      name: 'TurbopackCodeInspectorPlugin',
    },
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      external: ['code-inspector-core', 'webpack-code-inspector-plugin', 'path', 'fs'],
    },
    target: ['node8', 'es2015'],
  },
});
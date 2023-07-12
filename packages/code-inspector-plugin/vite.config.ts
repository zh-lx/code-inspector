import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['cjs', 'es'],
      fileName: '[name]',
      name: 'CodeInspectorPlugin',
    },
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ['vite-code-inspector-plugin', 'webpack-code-inspector-plugin'],
    },
    target: ['node8', 'es2015']
  },
});

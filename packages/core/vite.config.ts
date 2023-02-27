import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['umd'],
      fileName: '[name]',
      name: 'viteInspectorCore',
    },
    minify: true,
    emptyOutDir: false,
  },
});

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/client/index.ts'],
      formats: ['umd'],
      fileName: 'client',
      name: 'vueInspectorClient',
    },
    minify: true,
    emptyOutDir: false,
    target: ['node8', 'es2015'],
  },
});

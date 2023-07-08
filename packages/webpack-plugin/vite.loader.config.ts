import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/loader.ts'],
      formats: ['cjs'],
      fileName: '[name]',
    },
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      external: ['code-inspector-core', '@vue/compiler-sfc', 'path'],
      output: {
        exports: 'default', // 设置默认导出
      },
    },
  },
});

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['umd', 'es'],
      fileName: '[name]',
      name: 'ViteCodeInspectorPlugin',
    },
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ['code-inspector-core', 'path'],
      // output: {
      //   exports: 'default', // 设置默认导出
      // },
    },
  },
});

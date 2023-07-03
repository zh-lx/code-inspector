import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['umd', 'es'],
      fileName: '[name]',
      name: 'CodeInspectorPlugin',
    },
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      external: ['vite-code-inspector-plugin', 'webpack-code-inspector-plugin'],
      // input: path.resolve('./lib/index.ts'),
      // output: [
      //   {
      //     exports: 'auto',
      //     file: path.resolve(__dirname, './dist/index.js'),
      //     format: 'umd',
      //     name: 'pinyinPro',
      //   },
      //   {
      //     exports: 'auto',
      //     file: path.resolve(__dirname, './dist/index.mjs'),
      //     format: 'es',
      //     sourcemap: false,
      //   },
      // ],
    },
  },
});

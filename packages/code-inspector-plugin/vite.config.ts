import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve('./src/index.ts'),
      output: [
        {
          exports: 'auto',
          file: path.resolve(__dirname, './lib/index.js'),
          format: 'umd',
          name: 'pinyinPro',
        },
        {
          exports: 'auto',
          file: path.resolve(__dirname, './lib/index.mjs'),
          format: 'es',
          sourcemap: false,
        },
      ],
    },
  },
});

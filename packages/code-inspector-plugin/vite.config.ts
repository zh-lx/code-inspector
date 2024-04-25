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
    emptyOutDir: false,
    rollupOptions: {
      external: [
        'vite-code-inspector-plugin',
        'webpack-code-inspector-plugin',
        'chalk',
        'fs',
        'path',
      ],
    },
    target: ['node8', 'es2015'],
  },
});

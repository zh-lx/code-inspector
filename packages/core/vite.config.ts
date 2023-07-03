import { defineConfig } from 'vite';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['umd', 'es'],
      fileName: '[name]',
      name: 'viteInspectorCore',
    },
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      external: [
        'os',
        'path',
        'fs',
        'process',
        'crypto',
        'http',
        'https',
        'chalk',
      ],
    },
  },
  plugins: [nodePolyfills()],
});

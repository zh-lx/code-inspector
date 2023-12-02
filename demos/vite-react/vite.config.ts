import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import { CodeInspectorPlugin } from 'code-inspector-plugin';

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    // code-inspector-plugin need to be used before @vitejs/plugin-react
    CodeInspectorPlugin({
      bundler: 'vite'
    }),
    react(),
    splitVendorChunkPlugin(),
    AutoImport({
      imports: ['react'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/hooks', 'src/store/reducer'],
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      }
    })
  ]
});

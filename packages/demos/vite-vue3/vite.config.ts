import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), ViteCodeInspectorPlugin()],
});

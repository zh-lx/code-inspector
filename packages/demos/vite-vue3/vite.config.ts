import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import d from 'vite-vue-inspector-plugin';
console.log(d);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), d.myVueTransformPlugin({ ok: 111 })],
});

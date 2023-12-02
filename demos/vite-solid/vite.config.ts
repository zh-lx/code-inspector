import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { CodeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  plugins: [
    // code-inspector-plugin need to be used before vite-plugin-solid
    CodeInspectorPlugin({
      bundler: 'vite',
    }),
    solid(),
  ],
});

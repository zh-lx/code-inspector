import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
const { codeInspectorPlugin } = require('code-inspector-plugin');

export default defineConfig({
  plugins: [
    pluginVue()
  ],
  tools: {
    rspack: {
      plugins: [
        codeInspectorPlugin({
          bundler: "rspack"
        })
      ]
    }
  }
});

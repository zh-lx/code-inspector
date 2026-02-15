import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { CodeInspectorPlugin } from 'code-inspector-plugin';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    CodeInspectorPlugin({
      bundler: 'vite',
      behavior: {
        ai: {
          claudeCode: {
            // agent: 'sdk',
            // sdkOptions: {
            //   model: 'claude-opus-4-5-20251101',
            //   maxTurns: 50,
            // },
          }
        }
      }    
      // pathFormat: ['-g', '-r', '{file}:{line}:{column}']
    }),
    vueJsx(),
  ],
});

import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';
import type { Plugin } from 'vite';

// Plugin to rename Lit global variables to avoid conflicts with user's Lit installation
function renameLitGlobals(): Plugin {
  const litGlobals = [
    'litElementVersions',
    'reactiveElementVersions',
    'litHtmlVersions',
    'litIssuedWarnings',
    'litElementHydrateSupport',
    'litElementPolyfillSupport',
  ];

  const prefix = '__codeInspector_';

  return {
    name: 'rename-lit-globals',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          let code = chunk.code;

          // Replace .litXXX with .__codeInspector_litXXX
          litGlobals.forEach((globalVar) => {
            const regex = new RegExp(`\\.${globalVar}`, 'g');
            code = code.replace(regex, `.${prefix}${globalVar}`);
          });

          // Replace Trusted Types policy name to avoid conflicts
          // trustedTypes.createPolicy("lit-html", ...) -> trustedTypes.createPolicy("__codeInspector_lit-html", ...)
          code = code.replace(
            /createPolicy\s*\(\s*["']lit-html["']/g,
            'createPolicy("__codeInspector_lit-html"',
          );

          chunk.code = code;
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/client/index.ts'],
      formats: ['umd', 'iife'],
      fileName: 'client',
      name: 'vueInspectorClient',
    },
    minify: true,
    emptyOutDir: false,
    target: ['node8', 'es2015'],
  },
  plugins: [
    renameLitGlobals(),
    // @ts-ignore
    terser({
      format: {
        comments: false,
      },
    }),
  ],
});

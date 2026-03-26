import {
  transformCode,
  normalizePath,
  CodeOptions,
  getCodeWithWebComponent,
  RecordInfo,
  isJsTypeFile,
  isDev,
  getMappingFilePath,
  isExcludedFile,
} from '@code-inspector/core';
import chalk from 'chalk';

const PluginName = '@code-inspector/vite';

// Patch React 19's jsx-dev-runtime to restore source info on fibers.
// React 19 removed _debugSource (facebook/react#32574) but still receives `source`
// in jsxDEV(). This patch injects it into _debugInfo so the client can read it.
// Adapted from vite-plugin-react-click-to-component by ArnaudBarre.
function patchReact19JsxDevRuntime(code: string): string | undefined {
  if (code.includes('_source')) return undefined; // React <19, already has source

  const defineIndex = code.indexOf('"_debugInfo"');
  if (defineIndex === -1) return undefined;
  const valueIndex = code.indexOf('value: null', defineIndex);
  if (valueIndex === -1) return undefined;

  let patched =
    code.slice(0, valueIndex) + 'value: source' + code.slice(valueIndex + 11);

  // React 19.0-19.1: source is already a param of ReactElement
  if (patched.includes('function ReactElement(type, key, self, source,')) {
    return patched;
  }

  // React 19.2+: source needs to be threaded through jsxDEV → jsxDEVImpl → ReactElement
  patched = patched.replace(
    /maybeKey,\s*isStaticChildren/g,
    'maybeKey, isStaticChildren, source',
  );
  patched = patched.replace(
    /(\w+)?,\s*debugStack,\s*debugTask/g,
    (m: string, previousArg: string) => {
      if (previousArg === 'source') return m;
      return m.replace('debugTask', 'debugTask, source');
    },
  );
  return patched;
}

const OrderedPlugins = [
  {
    name: 'vite:react-babel',
    package: '@vitejs/plugin-react',
  },
  {
    name: 'vite:react-swc',
    package: '@vitejs/plugin-react-swc',
  },
  {
    name: 'vite:react-oxc:config',
    package: '@vitejs/plugin-react-oxc',
  },
  {
    name: 'solid',
    package: 'vite-plugin-solid',
  },
  {
    name: 'vite-plugin-qwik',
    package: 'qwikVite',
  },
  {
    name: 'vite-plugin-qwik-city',
    package: 'qwikCity',
  },
  {
    name: 'vite-plugin-qwik-react',
    package: 'qwikReact',
  },
  {
    name: 'vite:preact-jsx',
    package: '@preact/preset-vite',
  },
  {
    name: 'vite-plugin-svelte',
    package: '@sveltejs/vite-plugin-svelte',
  },
];

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

function printOrderWarning(plugins: { name: string }[] = []) {
  const pluginIndex = plugins.findIndex((plugin) => plugin.name === PluginName);
  OrderedPlugins.forEach((p) => {
    const _pluginIndex = plugins.findIndex((plugin) => plugin.name === p.name);
    if (_pluginIndex !== -1 && _pluginIndex < pluginIndex) {
      const info = [
        chalk.yellow('[WARNING]'),
        'You need to put',
        chalk.green('code-inspector-plugin'),
        'before',
        chalk.green(p.package),
        'in the vite config file.',
      ];
      console.log(info.join(' '));
    }
  });
}

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function ViteCodeInspectorPlugin(options: Options) {
  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
    envDir: '',
  };
  return {
    name: PluginName,
    ...(options.enforcePre === false ? {} : { enforce: 'pre' as 'pre' }),
    apply(_, { command }) {
      return !options.close && isDev(options.dev, command === 'serve');
    },
    configResolved(config) {
      record.envDir = config.envDir || config.root;
      record.root = config.root;
    },
    async transform(code: string, id: string) {
      // Patch React 19 jsx-dev-runtime to re-inject source into _debugInfo
      if (id.includes('jsx-dev-runtime') && id.includes('.js')) {
        return patchReact19JsxDevRuntime(code);
      }

      if (isExcludedFile(id, options)) {
        return code;
      }

      code = await getCodeWithWebComponent({
        options,
        file: id,
        code,
        record,
      });

      const { escapeTags = [], mappings } = options;

      const [_completePath, query] = id.split('?', 2); // 当前文件的绝对路径
      let filePath = normalizePath(_completePath);
      filePath = getMappingFilePath(filePath, mappings);
      const params = new URLSearchParams(query);
      // 仅对符合正则的生效
      if (options.match && !options.match.test(filePath)) {
        return code;
      }

      let fileType = '';
      if (
        isJsTypeFile(filePath) ||
        (filePath.endsWith('.vue') &&
          (jsxParamList.some((param) => params.get(param) !== null) ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'))
      ) {
        // jsx 代码
        fileType = 'jsx';
      } else if (
        filePath.endsWith('.html') &&
        params.get('type') === 'template' &&
        params.has('vue')
      ) {
        // <template src="xxx.html"></template>
        fileType = 'vue';
      } else if (
        filePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null
      ) {
        // vue 代码
        fileType = 'vue';
      } else if (filePath.endsWith('.svelte')) {
        // svelte 代码
        fileType = 'svelte';
      }

      if (fileType) {
        return await transformCode({
          content: code,
          filePath,
          fileType,
          escapeTags,
          pathType: options.pathType,
        });
      }

      return code;
    },
    // 追加到 html 中，适配 MPA 项目
    async transformIndexHtml(html) {
      if (options.skipSnippets?.includes?.('htmlScript')) {
        return html;
      }
      const code = await getCodeWithWebComponent({
        options: { ...options, importClient: 'code' },
        file: 'main.js',
        code: '',
        record,
        inject: true,
      });
      return html.replace(
        '<head>',
        `<head><script type="module">\n${code}\n</script>`
      );
    },
    configureServer(server) {
      const originalLog = server.config.logger.info;

      server.config.logger.info = function (message, options) {
        originalLog.call(this, message, options);

        printOrderWarning(server.config.plugins);

        server.config.logger.info = originalLog;
      };
    },
  };
}

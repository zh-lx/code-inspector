import {
  CodeOptions,
  RecordInfo,
  getCodeWithWebComponent,
  getProjectRecord,
  isDev,
  isNextjsProject,
} from '@code-inspector/core';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWebpackEntrys } from './entry';

const compatibleDirname = path.dirname(fileURLToPath(import.meta.url));

interface LoaderOptions extends CodeOptions {
  record: RecordInfo;
}

const baseLoaderPath = path.resolve(compatibleDirname, './loader.js');
const injectLoaderPath = path.resolve(compatibleDirname, './inject-loader.js');

function hasRegisteredCodeInspectorLoader(rules: any[]) {
  return rules.some((rule) =>
    rule?.use?.some?.(
      (item: any) =>
        item?.loader === baseLoaderPath || item?.loader === injectLoaderPath,
    ),
  );
}

const applyLoader = (options: LoaderOptions, compiler: any) => {
  // 适配 webpack 各个版本
  const _compiler = compiler?.compiler || compiler;
  const module = _compiler?.options?.module;
  const rules = module?.rules || module?.loaders || [];

  if (hasRegisteredCodeInspectorLoader(rules)) {
    return;
  }

  rules.push(
    {
      test: options.match ?? /\.html$/,
      resourceQuery: /vue/,
      use: [
        {
          loader: baseLoaderPath,
          options,
        },
      ],
      ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
    },
    {
      test: /\.(vue|jsx|tsx|js|ts|mjs|mts|svelte)$/,
      use: [
        {
          loader: baseLoaderPath,
          options,
        },
      ],
      ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
    },
    {
      ...(options.injectTo
        ? { resource: options.injectTo }
        : {
            test: /\.(jsx|tsx|js|ts|mjs|mts)$/,
            exclude: /node_modules/,
          }),
      use: [
        {
          loader: injectLoaderPath,
          options,
        },
      ],
      enforce: isNextjsProject() ? 'pre' : 'post',
    },
  );
};

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

function getPureClientCodeString(
  options: Options,
  record: RecordInfo,
  server?: boolean,
): Promise<string> {
  return getCodeWithWebComponent({
    options: { ...options, importClient: 'code' },
    file: 'main.js',
    code: '',
    record,
    inject: true,
    server,
  });
}

async function replaceHtml({
  options,
  record,
  assets,
}: {
  options: Options;
  record: RecordInfo;
  assets: { [filename: string]: any };
}) {
  const files = Object.keys(assets).filter((name) => /\.html$/.test(name));
  if (files.length) {
    const code = await getPureClientCodeString(options, record);
    files.forEach((filename: string) => {
      const source = assets[filename]?.source?.();
      if (typeof source === 'string') {
        const sourceCode = source.replace(
          '<head>',
          `<head><script type="module">\n${code}\n</script>`,
        );
        assets[filename] = {
          source: () => sourceCode,
          size: () => sourceCode.length,
        };
      }
    });
  }
}

class WebpackCodeInspectorPlugin {
  options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  async apply(compiler) {
    if (
      this.options.close ||
      !isDev(
        this.options.dev,
        compiler?.options?.mode === 'development' ||
          process.env.NODE_ENV === 'development',
      )
    ) {
      return;
    }

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: this.options.output,
      inputs: getWebpackEntrys(
        compiler?.options?.entry,
        compiler?.options?.context,
      ),
      envDir: compiler?.options?.context,
      root: compiler?.options?.context,
    };

    // webpack cache || rspack persistent cache
    const cache =
      compiler?.options?.cache || compiler?.options?.experiments?.cache;
    // webpack file system cache
    if (cache?.type === 'filesystem') {
      if (this.options.cache) {
        // 用来在 cache 情况下启动 node server
        record.port =
          this.options.port || getProjectRecord(record)?.previousPort;
        getPureClientCodeString(this.options, record, true);
      } else {
        cache.version = `code-inspector-${Date.now()}`;
      }
    }

    applyLoader({ ...this.options, record }, compiler);

    if (
      compiler?.hooks?.emit &&
      !this.options.skipSnippets?.includes?.('htmlScript')
    ) {
      const options = this.options;
      compiler.hooks.emit.tapAsync(
        'WebpackCodeInspectorPlugin',
        async (compilation, cb) => {
          let assets = {};
          if (compilation.getAssets) {
            assets = await compilation.getAssets();
          } else {
            assets = compilation.assets;
          }
          await replaceHtml({
            options,
            record,
            assets,
          });
          cb();
        },
      );
    }
  }
}

export default WebpackCodeInspectorPlugin;

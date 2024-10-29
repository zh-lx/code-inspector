import {
  CodeOptions,
  RecordInfo,
  fileURLToPath,
  getCodeWithWebComponent,
  isDev,
} from 'code-inspector-core';
import path, { dirname } from 'path';
import { getWebpackEntrys } from './entry';

let compatibleDirname = '';

if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

let isFirstLoad = true;

interface LoaderOptions extends CodeOptions {
  record: RecordInfo;
}

const applyLoader = (options: LoaderOptions, compiler: any) => {
  if (!isFirstLoad) {
    return;
  }
  isFirstLoad = false;
  // 适配 webpack 各个版本
  const _compiler = compiler?.compiler || compiler;
  const module = _compiler?.options?.module;
  const rules = module?.rules || module?.loaders || [];
  rules.push(
    {
      test: options?.match ?? /\.(vue|jsx|tsx|js|ts|mjs|mts)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: path.resolve(compatibleDirname, `./loader.js`),
          options,
        },
      ],
      ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
    },
    {
      ...(options?.injectTo
        ? { resource: options?.injectTo }
        : {
            test: /\.(jsx|tsx|js|ts|mjs|mts)$/,
            exclude: /node_modules/,
          }),
      use: [
        {
          loader: path.resolve(compatibleDirname, `./inject-loader.js`),
          options,
        },
      ],
      enforce: 'post',
    }
  );
};

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
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
    const code = await getCodeWithWebComponent({
      options: { ...options, importClient: 'code' },
      file: 'main.js',
      code: '',
      record,
      inject: true,
    });
    files.forEach((filename: string) => {
      const source = assets[filename].source();
      const sourceCode = source.replace(
        '<head>',
        `<head><script type="module">\n${code}\n</script>`
      );
      assets[filename] = {
        source: () => sourceCode,
        size: () => sourceCode.length,
      };
    });
  }
}

class WebpackCodeInspectorPlugin {
  options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  async apply(compiler) {
    isFirstLoad = true;

    if (
      this.options.close ||
      !isDev(
        this.options.dev,
        compiler?.options?.mode === 'development' ||
          process.env.NODE_ENV === 'development'
      )
    ) {
      return;
    }

    if (compiler?.options?.cache?.type === 'filesystem') {
      compiler.options.cache.version = `code-inspector-${Date.now()}`;
    }

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: this.options.output,
      inputs: getWebpackEntrys(
        compiler?.options?.entry,
        compiler?.options?.context
      ),
    };

    applyLoader({ ...this.options, record }, compiler);

    if (compiler?.hooks?.emit) {
      const options = this.options;
      compiler.hooks.emit.tapAsync(
        'WebpackCodeInspectorPlugin',
        async (compilation, cb) => {
          const { assets = {} } = compilation;
          await replaceHtml({
            options,
            record,
            assets,
          });
          cb();
        }
      );
    }
  }
}

export default WebpackCodeInspectorPlugin;

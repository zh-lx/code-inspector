import {
  CodeOptions,
  RecordInfo,
  fileURLToPath,
  isDev,
} from 'code-inspector-core';
import path, { dirname } from 'path';

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

class WebpackCodeInspectorPlugin {
  options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  apply(compiler) {
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
    };

    applyLoader({ ...this.options, record }, compiler);
  }
}

export default WebpackCodeInspectorPlugin;

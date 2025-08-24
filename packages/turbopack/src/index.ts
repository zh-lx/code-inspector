import { CodeOptions, RecordInfo, isDev } from '@code-inspector/core';
import path from 'path';
import { fileURLToPath } from 'url';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function TurbopackCodeInspectorPlugin(
  options: Options
): Record<string, any> {
  if (
    options.close ||
    !isDev(options.dev, process.env.NODE_ENV === 'development')
  ) {
    return {};
  }

  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
  };

  let WebpackEntry = null;
  if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
    WebpackEntry = require.resolve('@code-inspector/webpack');
  }
  if (typeof import.meta.resolve === 'function') {
    const dir = import.meta.resolve(
      '@code-inspector/webpack'
    ) as unknown as string;
    WebpackEntry = fileURLToPath(dir);
  }
  const WebpackDistDir = path.resolve(WebpackEntry, '..');

  return {
    '**/*.{jsx,tsx,js,ts,mjs,mts}': {
      loaders: [
        {
          loader: `${WebpackDistDir}/loader.js`,
          options: {
            ...options,
            record,
          },
          ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
        },
        {
          loader: `${WebpackDistDir}/inject-loader.js`,
          options: {
            ...options,
            record,
          },
          enforce: 'pre',
        },
      ],
    },
  };
}

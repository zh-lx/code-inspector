import { CodeOptions, RecordInfo, isDev } from '@code-inspector/core';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function TurbopackCodeInspectorPlugin(
  options: Options
): Record<string, any> {
  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
  };

  if (
    options.close ||
    !isDev(options.dev, process.env.NODE_ENV === 'development')
  ) {
    return {};
  }

  return {
    '**/*.{jsx,tsx,js,ts,mjs,mts}': {
      loaders: [
        {
          loader: '@code-inspector/webpack/dist/loader.js',
          options: {
            ...options,
            record,
          },
          ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
        },
        {
          loader: '@code-inspector/webpack/dist/inject-loader.js',
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

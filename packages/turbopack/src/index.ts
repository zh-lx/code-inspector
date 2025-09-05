import { 
  CodeOptions, 
  RecordInfo, 
  isDev
} from '@code-inspector/core';

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

  return {
    '**/*.{jsx,tsx}': {
      loaders: [{
        loader: '@code-inspector/turbopack/dist/turbopack-loader.js',
        options: {
          ...options,
          record,
          inject: true,
        }
      }]
    }
  };
}

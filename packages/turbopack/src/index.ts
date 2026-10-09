import {
  CodeOptions,
  RecordInfo,
  isDev,
  isNextGET16,
  startServer,
} from '@code-inspector/core';
import path from 'path';
import { fileURLToPath } from 'url';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function resolveWebpackEntry(params: {
  requireResolve?: (id: string) => string;
  importMetaResolve?: (id: string) => string | Promise<string>;
}) {
  if (typeof params.importMetaResolve === 'function') {
    const resolved = params.importMetaResolve(
      '@code-inspector/webpack',
    ) as unknown as string;
    return fileURLToPath(resolved);
  }

  return typeof params.requireResolve === 'function'
    ? params.requireResolve('@code-inspector/webpack')
    : null;
}

export function TurbopackCodeInspectorPlugin(
  options: Options,
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

  if (options.server !== 'close') {
    // Turbopack evaluates the configured loaders in multiple worker processes.
    // Start the shared Inspector server from the plugin process first so those
    // workers reuse the published runtime state instead of racing to allocate
    // different ports during the first compilation.
    void startServer(options, record).catch(() => {
      // Loader-side startup remains as a fallback if the plugin process cannot
      // start the server.
    });
  }

  const WebpackEntry = resolveWebpackEntry({
    /* v8 ignore next */
    requireResolve: typeof require === 'undefined' ? null : require.resolve,
    importMetaResolve: import.meta.resolve,
  });
  const WebpackDistDir = path.resolve(WebpackEntry, '..');

  // according to: https://nextjs.org/docs/app/getting-started/project-structure#routing-files
  // compatible for nextjs below 15.x
  const validFiles = [
    '*.jsx',
    '*.tsx',
    'layout.js',
    'layout.ts',
    'page.js',
    'page.ts',
    'loading.js',
    'loading.ts',
    'not-found.js',
    'not-found.ts',
    'error.js',
    'error.ts',
    'global-error.js',
    'global-error.ts',
    'template.js',
    'template.ts',
    'default.js',
    'default.ts',
  ];

  const matchFiles = `**/{${validFiles.join(',')}}`;
  const files = isNextGET16(process.cwd())
    ? '**/*.{jsx,tsx,js,ts,mjs,mts}'
    : matchFiles;
  const loaderOptions = {
    ...options,
    importClient: options.importClient ?? 'file',
    record,
  };

  return {
    [files]: {
      loaders: [
        {
          loader: `${WebpackDistDir}/loader.js`,
          options: loaderOptions,
        },
        {
          loader: `${WebpackDistDir}/inject-loader.js`,
          options: loaderOptions,
        },
      ],
    },
  };
}

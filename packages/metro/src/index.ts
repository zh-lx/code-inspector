import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { delimiter, join } from 'node:path';
import { startServer, type CodeOptions, type RecordInfo } from '@code-inspector/core';

export type MetroInspectorOptions = {
  projectRoot: string;
  injectTo: string;
  showSwitch?: boolean;
  hotKeys?: CodeOptions['hotKeys'];
  editor?: CodeOptions['editor'];
};

export type MetroConfigLike = {
  transformer?: { babelTransformerPath?: string; [key: string]: unknown };
  server?: { enhanceMiddleware?: unknown; [key: string]: unknown };
  [key: string]: unknown;
};

type Middleware = (request: { url?: string }, response: unknown, next: (error?: unknown) => void) => void;

function isWebDevelopmentBundle(url: string | undefined) {
  const request = new URL(url || '/', 'http://localhost');
  return (
    request.pathname.endsWith('.bundle') &&
    request.searchParams.get('platform') === 'web' &&
    request.searchParams.get('dev') === 'true'
  );
}

function resolveEditorCli(editor: CodeOptions['editor']) {
  if (!editor || process.env.CODE_EDITOR || editor.includes('/') || editor.includes('\\')) {
    return;
  }
  const cli = process.env.PATH?.split(delimiter)
    .map((directory) => join(directory, editor))
    .find(existsSync);
  if (cli) {
    process.env.CODE_EDITOR = cli;
  }
}

/** Add Code Inspector to Expo web development bundles. */
export function withCodeInspectorMetro<T extends MetroConfigLike>(
  config: T,
  options: MetroInspectorOptions,
): T {
  if (!options.projectRoot || !options.injectTo) {
    throw new Error('Code Inspector Metro requires projectRoot and injectTo.');
  }
  resolveEditorCli(options.editor);
  const originalTransformerPath = config.transformer?.babelTransformerPath;
  if (!originalTransformerPath) {
    throw new Error('Code Inspector Metro requires an existing Babel transformer.');
  }
  process.env.CODE_INSPECTOR_METRO_CONFIG = JSON.stringify({
    projectRoot: options.projectRoot,
    injectTo: options.injectTo,
    showSwitch: options.showSwitch ?? false,
    hotKeys: options.hotKeys,
    editor: options.editor,
    originalTransformerPath,
  });
  const originalEnhance = config.server?.enhanceMiddleware as
    | ((middleware: Middleware, metroServer: unknown) => Middleware)
    | undefined;
  let serverStartup: Promise<void> | undefined;
  const ensureInspectorServer = () => {
    if (!serverStartup) {
      const record: RecordInfo = {
        output: join(options.projectRoot, 'node_modules/.cache/code-inspector-metro'),
        root: options.projectRoot,
        envDir: options.projectRoot,
        entry: '',
        port: 0,
      };
      const inspectorOptions: CodeOptions = {
        bundler: 'metro',
        showSwitch: options.showSwitch ?? false,
        hotKeys: options.hotKeys,
        editor: options.editor,
        pathType: 'relative',
      };
      serverStartup = startServer(inspectorOptions, record).catch((error) => {
        serverStartup = undefined;
        throw error;
      });
    }
    return serverStartup;
  };
  const moduleUrl = import.meta.url;
  return {
    ...config,
    server: {
      ...config.server,
      enhanceMiddleware(middleware: Middleware, metroServer: unknown) {
        const enhanced = originalEnhance?.call(config.server, middleware, metroServer) || middleware;
        return (request: { url?: string }, response: unknown, next: (error?: unknown) => void) => {
          if (!isWebDevelopmentBundle(request.url)) {
            enhanced(request, response, next);
            return;
          }
          void ensureInspectorServer().then(
            () => enhanced(request, response, next),
            next,
          );
        };
      },
    },
    transformer: {
      ...config.transformer,
      babelTransformerPath: fileURLToPath(new URL('./transformer.cjs', moduleUrl)),
    },
  } as T;
}

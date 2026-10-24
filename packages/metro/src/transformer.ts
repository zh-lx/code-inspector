import path from 'node:path';
import { createRequire } from 'node:module';
import {
  getInjectedCode,
  getProjectRecord,
  startServer,
  transformCode,
  type CodeOptions,
  type RecordInfo,
} from '@code-inspector/core';

type TransformerInput = {
  filename: string;
  src: string;
  options: {
    dev?: boolean;
    platform?: string;
    projectRoot?: string;
    customTransformOptions?: { environment?: string };
  };
  plugins?: unknown[];
};

type RuntimeConfig = {
  projectRoot: string;
  injectTo: string;
  showSwitch: boolean;
  editor?: CodeOptions['editor'];
  originalTransformerPath: string;
};

const requireModule = createRequire(import.meta.url);

function getConfig(): RuntimeConfig {
  const value = process.env.CODE_INSPECTOR_METRO_CONFIG;
  if (!value) throw new Error('Code Inspector Metro configuration is missing.');
  return JSON.parse(value) as RuntimeConfig;
}

function getOriginalTransformer() {
  return requireModule(getConfig().originalTransformerPath);
}

export async function transform(input: TransformerInput) {
  const upstream = getOriginalTransformer();
  if (
    input.options.platform !== 'web' ||
    input.options.dev !== true ||
    input.options.customTransformOptions?.environment === 'node' ||
    input.options.customTransformOptions?.environment === 'react-server'
  ) {
    return upstream.transform(input);
  }

  const config = getConfig();
  const relative = path.relative(config.projectRoot, input.filename);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    relative.split(path.sep).includes('node_modules') ||
    !/\.[cm]?[jt]sx?$/.test(input.filename)
  ) {
    return upstream.transform(input);
  }

  let src = await transformCode({
    content: input.src,
    filePath: input.filename,
    fileType: 'jsx',
    escapeTags: [],
    pathType: 'relative',
    reactNativeWeb: true,
  });

  if (path.resolve(input.filename) === path.resolve(config.injectTo)) {
    const options: CodeOptions = {
      bundler: 'metro',
      showSwitch: config.showSwitch,
      editor: config.editor,
      pathType: 'relative',
    };
    const record: RecordInfo = {
      output: path.join(config.projectRoot, 'node_modules/.cache/code-inspector-metro'),
      root: config.projectRoot,
      envDir: config.projectRoot,
      entry: '',
      port: 0,
    };
    await startServer(options, record);
    src = `${getInjectedCode(options, getProjectRecord(record)?.port || 0, false)}\n${src}`;
  }
  return upstream.transform({ ...input, src });
}

export function getCacheKey(options: unknown) {
  return `code-inspector-metro-1:${getOriginalTransformer().getCacheKey?.(options) || ''}`;
}

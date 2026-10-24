import { fileURLToPath } from 'node:url';

export type MetroInspectorOptions = {
  projectRoot: string;
  injectTo: string;
  showSwitch?: boolean;
};

export type MetroConfigLike = {
  transformer?: { babelTransformerPath?: string; [key: string]: unknown };
  [key: string]: unknown;
};

/** Add Code Inspector to Expo web development bundles. */
export function withCodeInspectorMetro<T extends MetroConfigLike>(
  config: T,
  options: MetroInspectorOptions,
): T {
  if (!options.projectRoot || !options.injectTo) {
    throw new Error('Code Inspector Metro requires projectRoot and injectTo.');
  }
  const originalTransformerPath = config.transformer?.babelTransformerPath;
  if (!originalTransformerPath) {
    throw new Error('Code Inspector Metro requires an existing Babel transformer.');
  }
  process.env.CODE_INSPECTOR_METRO_CONFIG = JSON.stringify({
    projectRoot: options.projectRoot,
    injectTo: options.injectTo,
    showSwitch: options.showSwitch ?? false,
    originalTransformerPath,
  });
  const moduleUrl = import.meta.url;
  return {
    ...config,
    transformer: {
      ...config.transformer,
      babelTransformerPath: fileURLToPath(new URL('./transformer.cjs', moduleUrl)),
    },
  } as T;
}

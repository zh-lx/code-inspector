import type { CodeOptions } from '@code-inspector/core';
export type MetroInspectorOptions = {
    projectRoot: string;
    injectTo: string;
    showSwitch?: boolean;
    editor?: CodeOptions['editor'];
};
export type MetroConfigLike = {
    transformer?: {
        babelTransformerPath?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};
/** Add Code Inspector to Expo web development bundles. */
export declare function withCodeInspectorMetro<T extends MetroConfigLike>(config: T, options: MetroInspectorOptions): T;

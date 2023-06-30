import { StartServer, getEnhanceContent, _normalizePath } from './server';
export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type CodeOptions = {
    hotKeys?: HotKey[] | false;
    showSwitch?: boolean;
    autoToggle?: boolean;
};
export declare const getInjectCode: (port: number, options?: CodeOptions) => string;
export declare const startServer: typeof StartServer;
export declare const enhanceVueCode: typeof getEnhanceContent;
export declare const normalizePath: typeof _normalizePath;
export declare const parseSFC: typeof import("@vue/compiler-sfc").parse;

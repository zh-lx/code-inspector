export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type CodeOptions = {
    hotKeys?: HotKey[] | false;
    showSwitch?: boolean;
    autoToggle?: boolean;
};
export declare function getInjectCode(port: number, options?: CodeOptions): string;
export { startServer, enhanceCode, normalizePath, parseSFC } from './server';

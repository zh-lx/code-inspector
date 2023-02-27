import { StartServer, getEnhanceContent } from './server';
type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export declare const getInjectCode: (port: number, hotKeys?: HotKey[]) => string;
export declare const startServer: typeof StartServer;
export declare const enhanceVueCode: typeof getEnhanceContent;
export {};

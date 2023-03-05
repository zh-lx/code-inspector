import { StartServer, getEnhanceContent } from './server';
export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export declare const getInjectCode: (port: number, hotKeys?: HotKey[], disableTriggerByKey?: boolean, hideButton?: boolean) => string;
export declare const startServer: typeof StartServer;
export declare const enhanceVueCode: typeof getEnhanceContent;

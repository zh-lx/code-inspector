export type ClientLang = 'en' | 'zh';
type TemplateVars = Record<string, string | number>;
export declare function normalizeClientLang(lang?: string | null): ClientLang;
export declare function getClientText(lang: string | null | undefined, key: string, vars?: TemplateVars): string;
export declare function formatHistoryDateText(timestamp: number, lang: string | null | undefined): string;
export declare function formatFileCountText(count: number, lang: string | null | undefined): string;
export {};

import type { OpenCodeOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
export declare function handleOpenCodeRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, openCodeOptions: OpenCodeOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;
export declare function getModelInfo(openCodeOptions: OpenCodeOptions | undefined): Promise<string>;

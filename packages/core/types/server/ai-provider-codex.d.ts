import type { CodexOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
import { __TEST_ONLY__ } from './ai-provider-common';
export { __TEST_ONLY__ };
export { CODEX_PROVIDER_RUNTIME } from './ai-provider-common';
export type { CodexProviderRuntime } from './ai-provider-common';
export declare function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string>;
export declare function handleCodexRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, codexOptions: CodexOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;

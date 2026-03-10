import type { CodexOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
import {
  CODEX_PROVIDER_RUNTIME,
  __TEST_ONLY__,
  getModelInfo as getSharedCodexModelInfo,
  handleCodexRequest as handleSharedCodexRequest,
} from './ai-provider-common';

export { __TEST_ONLY__ };
export { CODEX_PROVIDER_RUNTIME } from './ai-provider-common';
export type { CodexProviderRuntime } from './ai-provider-common';

export async function getModelInfo(
  codexOptions: CodexOptions | undefined,
): Promise<string> {
  return await getSharedCodexModelInfo(codexOptions);
}

export function handleCodexRequest(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  sessionId: string | undefined,
  cwd: string,
  codexOptions: CodexOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  return handleSharedCodexRequest(
    message,
    context,
    history,
    sessionId,
    cwd,
    codexOptions,
    callbacks,
    CODEX_PROVIDER_RUNTIME,
  );
}

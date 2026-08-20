export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Injection token — services/controllers depend on this, never on a concrete provider class. */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

/**
 * Abstraction over a chat-completion backend. OpenAiProvider implements this today;
 * a future ClaudeProvider/GeminiProvider would implement the same contract and just be
 * swapped in at the AI_PROVIDER injection site in AiModule.
 */
export interface AiProvider {
  generateResponse(messages: ChatMessage[], model: string): Promise<string>;
  streamResponse(
    messages: ChatMessage[],
    model: string,
    signal?: AbortSignal,
  ): AsyncIterable<string>;
}

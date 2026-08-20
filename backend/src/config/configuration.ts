import { registerAs } from '@nestjs/config';

export interface AiModelConfig {
  id: string;
  label: string;
  provider: string;
}

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_SECRET as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));

export const aiConfig = registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  systemPrompt:
    process.env.AI_SYSTEM_PROMPT ??
    'You are Codeles AI, an intelligent AI assistant. Provide accurate, practical and concise answers while expanding when the user asks for detail.',
  maxContextMessages: parseInt(process.env.AI_MAX_CONTEXT_MESSAGES ?? '20', 10),
  // A small, config-driven catalogue of models. Adding a ClaudeProvider/GeminiProvider later
  // just means adding entries here (with a matching `provider` value) and extending
  // AiModule's provider factory — nothing in the controllers/services needs to change.
  models: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai' },
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
  ] as AiModelConfig[],
}));

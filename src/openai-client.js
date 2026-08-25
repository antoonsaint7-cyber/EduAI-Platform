import OpenAI from 'openai';

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey });
}

export function getModel() {
  return process.env.OPENAI_MODEL || 'gpt-5-mini';
}

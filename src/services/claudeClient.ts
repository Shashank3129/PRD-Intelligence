// Claude (Anthropic) API client. Falls back gracefully when no key is set.
// Set VITE_ANTHROPIC_API_KEY in a .env.local file to enable live calls.
// For production, route through a backend proxy instead of exposing key.

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_ANTHROPIC_MODEL as string | undefined) || 'claude-opus-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeCallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export function hasApiKey(): boolean {
  return Boolean(API_KEY && API_KEY.trim().length > 0);
}

export async function callClaude(
  messages: ClaudeMessage[],
  opts: ClaudeCallOptions = {}
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('No API key configured');
  }

  const body = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    ...(opts.system ? { system: opts.system } : {}),
    messages
  };

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY as string,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Network failure calling Claude: ${msg}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const j = await response.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      detail = await response.text().catch(() => '');
    }
    throw new Error(`Claude API error ${response.status}: ${detail || response.statusText}`);
  }

  let data: { content?: Array<{ type: string; text?: string }> };
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid JSON response from Claude API');
  }

  const text = (data.content || [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Empty response from Claude API');
  }

  return text;
}

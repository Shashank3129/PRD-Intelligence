// OpenRouter API client with automatic model fallback.
// Free models are tried first; if all fail, falls back to the single cheapest paid model.
// Set VITE_OPENROUTER_API_KEY in .env, then restart the dev server.

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const ENV_FREE_MODELS = import.meta.env.VITE_OPENROUTER_FREE_MODELS as string | undefined;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// How long to wait for the initial HTTP response (connect + first byte)
const CONNECT_TIMEOUT_MS = 20_000;
// How long streaming can go idle (no new chunk) before we abort
const STREAM_IDLE_TIMEOUT_MS = 60_000;
// Absolute max for non-streaming requests (PRD generation can take 2+ min)
const TOTAL_TIMEOUT_MS = 180_000;

// ── FREE MODELS (from your verified list, $0 input / $0 output) ────────────
// Tried in order. All four are free-tier on OpenRouter.
const DEFAULT_FREE_TEXT_MODELS = [
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
] as const;

// ── SINGLE CHEAPEST PAID FALLBACK ─────────────────────────────────────────
// Mistral Nemo: $0.02 input + $0.04 output = $0.06 per 1M tokens total.
// This is the cheapest paid model from your list.
const PAID_FALLBACK_MODELS: readonly string[] = [
  'mistralai/mistral-nemo',
];

function parseModelList(raw?: string): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  return raw
    .split(',')
    .map((model) => model.trim())
    .filter((model) => {
      if (!model || seen.has(model)) return false;
      seen.add(model);
      return true;
    });
}

const configuredFreeModels = parseModelList(ENV_FREE_MODELS);

export const FREE_MODELS = (configuredFreeModels.length > 0
  ? configuredFreeModels
  : [...DEFAULT_FREE_TEXT_MODELS]) as readonly string[];

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterOptions {
  temperature?: number;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

interface ModelAttemptFailure {
  model: string;
  message: string;
}

export function hasOpenRouterKey(): boolean {
  return Boolean(API_KEY && API_KEY.trim().length > 10);
}

// ─── Non-streaming call ────────────────────────────────────────────────────

async function callModel(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
  maxTokens?: number
): Promise<string> {
  if (!API_KEY) throw new Error('No API key');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://prd-intelligence.app',
        'X-Title': 'PRD Intelligence',
      },
      body: JSON.stringify({ model, messages, temperature, ...(maxTokens ? { max_tokens: maxTokens } : {}) }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TOTAL_TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message: string };
  };

  if (data.error) throw new Error(data.error.message);

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from model');
  return content;
}

// ─── Streaming call ────────────────────────────────────────────────────────

async function streamModel(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
  onChunk: (accumulated: string) => void,
  maxTokens?: number
): Promise<string> {
  if (!API_KEY) throw new Error('No API key');

  const controller = new AbortController();

  // Connect timeout — aborts if we don't get a response header quickly
  const connectTimeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://prd-intelligence.app',
        'X-Title': 'PRD Intelligence',
      },
      body: JSON.stringify({ model, messages, temperature, stream: true, ...(maxTokens ? { max_tokens: maxTokens } : {}) }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${CONNECT_TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(connectTimeoutId);
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let accumulated = '';
  let sseBuffer = '';
  let sawTerminalEvent = false;

  // Idle timeout — resets every time a chunk arrives
  let idleTimer: ReturnType<typeof setTimeout>;
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      controller.abort();
    }, STREAM_IDLE_TIMEOUT_MS);
  };
  resetIdleTimer();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetIdleTimer();
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          sawTerminalEvent = true;
          continue;
        }
        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
          };
          if (parsed.choices?.[0]?.finish_reason) {
            sawTerminalEvent = true;
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            onChunk(accumulated);
          }
        } catch { /* malformed SSE line — skip */ }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      const partialInfo = accumulated.length > 0 ? ` after streaming ${accumulated.length} chars` : '';
      throw new Error(`Stream idle timeout${partialInfo} — no data for ${STREAM_IDLE_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(idleTimer!);
    reader.releaseLock();
  }

  if (!accumulated) throw new Error('Empty streaming response');
  if (!sawTerminalEvent) {
    console.warn(`[OpenRouter] ${model} stream ended without an explicit terminal event; accepting response body as complete`);
  }
  return accumulated;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const j = await response.json();
    return j?.error?.message || JSON.stringify(j);
  } catch {
    return await response.text().catch(() => response.statusText);
  }
}

function isAuthError(msg: string): boolean {
  return msg.includes('401') || msg.includes('403') || msg.includes('Authentication failed') || msg.includes('Invalid API key');
}

function summarizeFailures(errors: ModelAttemptFailure[]): string {
  if (errors.length === 0) return 'unknown';

  const preview = errors
    .slice(0, 5)
    .map(({ model, message }, index) => `${index + 1}. ${model}: ${message}`)
    .join('\n');

  const remaining = errors.length - 5;
  return remaining > 0 ? `${preview}\n...and ${remaining} more attempts failed.` : preview;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Call OpenRouter with automatic fallback across FREE_MODELS.
 * If all free models fail, tries the single cheapest paid fallback.
 * No max_tokens — let the model decide how much to write.
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  opts: OpenRouterOptions = {}
): Promise<string> {
  if (!hasOpenRouterKey()) {
    throw new Error('VITE_OPENROUTER_API_KEY is not set. Add it to your .env file and restart the dev server.');
  }

  const temperature = opts.temperature ?? 0.7;
  const allMessages: OpenRouterMessage[] = [
    ...(opts.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
    ...messages,
  ];

  if (opts.model) {
    return callModel(opts.model, allMessages, temperature, opts.maxTokens);
  }

  const errors: ModelAttemptFailure[] = [];

  // 1️⃣ Try all free models first
  for (const [index, model] of FREE_MODELS.entries()) {
    try {
      console.info(`[OpenRouter] trying free ${index + 1}/${FREE_MODELS.length}: ${model}`);
      const result = await callModel(model, allMessages, temperature, opts.maxTokens);
      console.info(`[OpenRouter] ✓ free ${model}`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenRouter] ✗ free ${model}: ${msg}`);
      errors.push({ model, message: msg });

      if (isAuthError(msg)) {
        throw new Error(
          `API key rejected by OpenRouter. Check VITE_OPENROUTER_API_KEY in your .env and restart the dev server.\nDetail: ${msg}`
        );
      }
      // Model unavailable, rate-limited, or timed out → try next
    }
  }

  // 2️⃣ All free models failed — try the single cheapest paid model
  console.warn('[OpenRouter] All free models failed. Trying cheapest paid fallback…');
  for (const [index, model] of PAID_FALLBACK_MODELS.entries()) {
    try {
      console.info(`[OpenRouter] paid fallback ${index + 1}/${PAID_FALLBACK_MODELS.length}: ${model}`);
      const result = await callModel(model, allMessages, temperature, opts.maxTokens);
      console.info(`[OpenRouter] ✓ paid fallback ${model}`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenRouter] ✗ paid fallback ${model}: ${msg}`);
      errors.push({ model, message: msg });
      if (isAuthError(msg)) {
        throw new Error(`API key rejected by OpenRouter. Check VITE_OPENROUTER_API_KEY in your .env.\nDetail: ${msg}`);
      }
    }
  }

  throw new Error(
    `All ${FREE_MODELS.length} free models and ${PAID_FALLBACK_MODELS.length} paid fallback model failed.\n${summarizeFailures(errors)}\n\nCheck the browser console for details.`
  );
}

/**
 * Stream OpenRouter with automatic fallback across FREE_MODELS.
 * If all free models fail, tries the single cheapest paid fallback.
 * Calls onChunk(accumulated) on every token. Returns the full text when done.
 */
export async function streamOpenRouter(
  messages: OpenRouterMessage[],
  opts: OpenRouterOptions = {},
  onChunk: (accumulated: string) => void
): Promise<string> {
  if (!hasOpenRouterKey()) {
    throw new Error('VITE_OPENROUTER_API_KEY is not set. Add it to your .env file and restart the dev server.');
  }

  const temperature = opts.temperature ?? 0.7;
  const allMessages: OpenRouterMessage[] = [
    ...(opts.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
    ...messages,
  ];

  if (opts.model) {
    return streamModel(opts.model, allMessages, temperature, onChunk, opts.maxTokens);
  }

  const errors: ModelAttemptFailure[] = [];

  // 1️⃣ Try all free models first
  for (const [index, model] of FREE_MODELS.entries()) {
    try {
      console.info(`[OpenRouter] trying free stream ${index + 1}/${FREE_MODELS.length}: ${model}`);
      const result = await streamModel(model, allMessages, temperature, (accumulated) => {
        onChunk(accumulated);
      }, opts.maxTokens);
      console.info(`[OpenRouter] ✓ free stream ${model} (${result.length} chars)`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenRouter] ✗ free stream ${model}: ${msg}`);
      errors.push({ model, message: msg });

      if (isAuthError(msg)) {
        throw new Error(
          `API key rejected by OpenRouter. Check VITE_OPENROUTER_API_KEY in your .env and restart the dev server.\nDetail: ${msg}`
        );
      }
      // Model unavailable, rate-limited, or timed out → try next
    }
  }

  // 2️⃣ All free models failed — try the single cheapest paid model
  console.warn('[OpenRouter] All free stream models failed. Trying cheapest paid fallback…');
  for (const [index, model] of PAID_FALLBACK_MODELS.entries()) {
    try {
      console.info(`[OpenRouter] paid fallback stream ${index + 1}/${PAID_FALLBACK_MODELS.length}: ${model}`);
      const result = await streamModel(model, allMessages, temperature, (accumulated) => {
        onChunk(accumulated);
      }, opts.maxTokens);
      console.info(`[OpenRouter] ✓ paid fallback stream ${model} (${result.length} chars)`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenRouter] ✗ paid fallback stream ${model}: ${msg}`);
      errors.push({ model, message: msg });
      if (isAuthError(msg)) {
        throw new Error(`API key rejected by OpenRouter. Check VITE_OPENROUTER_API_KEY in your .env.\nDetail: ${msg}`);
      }
    }
  }

  throw new Error(
    `All ${FREE_MODELS.length} free models and ${PAID_FALLBACK_MODELS.length} paid fallback model failed.\n${summarizeFailures(errors)}\n\nCheck the browser console for details.`
  );
}
interface AiCompletionResult {
  success: boolean;
  text?: string;
  error?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostUsd?: number;
}

// Approximate cost per 1M tokens (USD) for common models
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o':         { input: 5.00,  output: 15.00  },
  'gpt-4o-mini':    { input: 0.15,  output: 0.60   },
  'gpt-4-turbo':    { input: 10.00, output: 30.00  },
  'gpt-3.5-turbo':  { input: 0.50,  output: 1.50   },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25,  output: 5.00   },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
};

/**
 * Estimate cost in USD for a completion.
 * Returns null if the model is not in the known price list.
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  const key = Object.keys(MODEL_COSTS).find((k) => model.toLowerCase().includes(k));
  if (!key) return null;
  const { input, output } = MODEL_COSTS[key];
  return (promptTokens * input + completionTokens * output) / 1_000_000;
}

type ProviderErrorObject = {
  code?: number;
  message?: string;
  status?: string;
  details?: unknown[];
};

function getMaxRetries() {
  const raw = Number(process.env.AI_MAX_RETRIES ?? 2);
  if (!Number.isFinite(raw)) return 2;
  return Math.min(Math.max(Math.floor(raw), 0), 5);
}

function getRetryBaseMs() {
  const raw = Number(process.env.AI_RETRY_BASE_MS ?? 1200);
  if (!Number.isFinite(raw)) return 1200;
  return Math.min(Math.max(Math.floor(raw), 200), 15000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDurationToMs(raw: string | undefined | null) {
  if (!raw) return null;
  const value = raw.trim();
  const durationMatch = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/i);
  if (durationMatch) {
    const amount = Number(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (!Number.isFinite(amount)) return null;
    if (unit === 'ms') return Math.max(Math.floor(amount), 200);
    if (unit === 's') return Math.max(Math.floor(amount * 1000), 200);
    if (unit === 'm') return Math.max(Math.floor(amount * 60_000), 200);
    if (unit === 'h') return Math.max(Math.floor(amount * 3_600_000), 200);
  }

  const sentenceMatch = value.match(/retry\s+in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (sentenceMatch) {
    const seconds = Number(sentenceMatch[1]);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.max(Math.floor(seconds * 1000), 200);
    }
  }

  return null;
}

function parseRetryAfterMs(retryAfterHeader: string | null) {
  if (!retryAfterHeader) return null;

  const seconds = Number(retryAfterHeader);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(Math.floor(seconds * 1000), 200);
  }

  const dateMs = Date.parse(retryAfterHeader);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    if (delta > 0) return delta;
  }

  return null;
}

function unwrapProviderErrorObject(data: unknown): ProviderErrorObject | null {
  if (Array.isArray(data) && data.length > 0) {
    return unwrapProviderErrorObject(data[0]);
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidate = data as { error?: unknown };
  if (candidate.error && typeof candidate.error === 'object') {
    return candidate.error as ProviderErrorObject;
  }

  return data as ProviderErrorObject;
}

function sanitizeErrorMessage(message: string) {
  return message.replace(/\s+/g, ' ').trim().slice(0, 700);
}

function getProviderRetryDelayMs(providerError: ProviderErrorObject | null, providerMessage: string) {
  const details = providerError?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (!detail || typeof detail !== 'object') continue;
      const maybeRetry = detail as { retryDelay?: unknown };
      if (typeof maybeRetry.retryDelay === 'string') {
        const parsed = parseDurationToMs(maybeRetry.retryDelay);
        if (parsed) return parsed;
      }
    }
  }

  return parseDurationToMs(providerMessage);
}

function isZeroQuotaFailure(providerError: ProviderErrorObject | null, providerMessage: string) {
  const messageHasZeroLimit = /limit:\s*0/i.test(providerMessage);
  if (!messageHasZeroLimit) return false;

  const details = providerError?.details;
  if (!Array.isArray(details)) return true;

  for (const detail of details) {
    if (!detail || typeof detail !== 'object') continue;
    const candidate = detail as { violations?: unknown[] };
    if (!Array.isArray(candidate.violations)) continue;

    for (const violation of candidate.violations) {
      if (!violation || typeof violation !== 'object') continue;
      const quotaMetric = (violation as { quotaMetric?: unknown }).quotaMetric;
      if (typeof quotaMetric === 'string' && quotaMetric.includes('free_tier')) {
        return true;
      }
    }
  }

  return true;
}

function readProviderErrorMessage(data: unknown, fallback: string) {
  const providerError = unwrapProviderErrorObject(data);
  if (providerError && typeof providerError.message === 'string') {
    const message = providerError.message.trim();
    if (message) return sanitizeErrorMessage(message);
  }

  return sanitizeErrorMessage(fallback);
}

async function parseProviderResponse(response: Response) {
  const rawText = await response.text().catch(() => '');
  const trimmed = rawText.trim();

  if (!trimmed) {
    return {
      data: null as unknown,
      messageFallback: '',
    };
  }

  try {
    return {
      data: JSON.parse(trimmed) as unknown,
      messageFallback: trimmed,
    };
  } catch {
    return {
      data: null as unknown,
      messageFallback: trimmed,
    };
  }
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';
  const baseUrl = process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';

  return {
    apiKey,
    model,
    baseUrl,
  };
}

export function getAiConfigStatus() {
  const { apiKey, model, baseUrl } = getAiConfig();

  return {
    configured: Boolean(apiKey),
    model,
    baseUrl,
  };
}

export async function generateAiCompletion(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<AiCompletionResult> {
  const { apiKey, model, baseUrl } = getAiConfig();

  if (!apiKey) {
    return {
      success: false,
      error: 'AI_API_KEY is missing in environment.',
    };
  }

  const maxRetries = getMaxRetries();
  const retryBaseMs = getRetryBaseMs();
  let lastError = 'Failed to call AI provider.';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 600,
        }),
      });

      const { data, messageFallback } = await parseProviderResponse(response);

      if (!response.ok) {
        const fallbackMessage = messageFallback || `AI provider request failed with status ${response.status}.`;
        const providerMessage = readProviderErrorMessage(data, fallbackMessage);
        const providerError = unwrapProviderErrorObject(data);
        const retryFromBodyMs = getProviderRetryDelayMs(providerError, providerMessage);
        const hardZeroQuota = response.status === 429 && isZeroQuotaFailure(providerError, providerMessage);
        const isRetriable = !hardZeroQuota && (response.status === 429 || response.status >= 500) && attempt < maxRetries;

        if (isRetriable) {
          const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
          const waitMs = retryAfterMs ?? retryFromBodyMs ?? retryBaseMs * Math.pow(2, attempt);
          await sleep(waitMs);
          continue;
        }

        if (response.status === 429) {
          const retrySeconds = Math.max(Math.ceil((retryFromBodyMs ?? 0) / 1000), 0);
          const retryHint = retrySeconds > 0 ? ` Retry after about ${retrySeconds}s.` : '';

          if (hardZeroQuota) {
            return {
              success: false,
              error:
                'AI provider quota is currently zero for this Gemini project/key (free-tier limit is 0). Enable billing/quota in Google Cloud for Gemini API or switch to a key/project with available quota.',
            };
          }

          return {
            success: false,
            error: `AI provider rate limit reached (429). ${providerMessage}${retryHint}`,
          };
        }

        return {
          success: false,
          error: providerMessage,
        };
      }

      const completionData = data as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = completionData?.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return {
          success: false,
          error: 'AI provider returned an empty response.',
        };
      }

      const promptTokens     = completionData?.usage?.prompt_tokens ?? 0;
      const completionTokens = completionData?.usage?.completion_tokens ?? 0;
      const cost             = promptTokens > 0 ? calculateCost(model, promptTokens, completionTokens) : null;

      return {
        success: true,
        text,
        promptTokens:     promptTokens || undefined,
        completionTokens: completionTokens || undefined,
        estimatedCostUsd: cost ?? undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Failed to call AI provider.';

      if (attempt < maxRetries) {
        const waitMs = retryBaseMs * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

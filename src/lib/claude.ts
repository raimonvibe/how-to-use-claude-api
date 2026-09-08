import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeModel, Effort } from './models'

/**
 * Browser-side Claude client.
 *
 * Calling the Messages API straight from a browser needs two opt-ins: the
 * SDK's `dangerouslyAllowBrowser` flag and the CORS header
 * `anthropic-dangerous-direct-browser-access`. Both are named "dangerous" for
 * a reason — anyone with devtools can read the key in the request. That is
 * acceptable here only because this is a bring-your-own-key playground where
 * the key belongs to the person typing it and never leaves their machine.
 * A production app must proxy through a server instead.
 */
export function createClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    maxRetries: 1,
  })
}

/** Server-side refusal fallbacks: re-run a declined request on another model. */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'

/**
 * Build a `thinking` config that the chosen model will actually accept.
 * Each model family has different rules, and sending the wrong shape is a 400.
 */
function buildThinking(
  model: ClaudeModel,
  showReasoning: boolean,
  maxTokens: number,
): Anthropic.Beta.BetaThinkingConfigParam | undefined {
  const display = showReasoning ? 'summarized' : 'omitted'
  switch (model.thinking) {
    case 'always-on':
      // Thinking cannot be disabled. `{type: "disabled"}` returns a 400.
      return { type: 'adaptive', display }
    case 'adaptive-default':
      // Adaptive already runs when `thinking` is omitted, so only send the
      // param when we want the reasoning summary streamed back.
      return showReasoning ? { type: 'adaptive', display: 'summarized' } : undefined
    case 'adaptive-opt-in':
      // Omitting `thinking` means no thinking at all — always ask for adaptive.
      return { type: 'adaptive', display }
    case 'budget-tokens': {
      // Pre-4.6 models still use a fixed budget, which must be >= 1024 and
      // strictly less than max_tokens.
      if (!showReasoning) return undefined
      const budget = Math.max(1024, Math.min(4096, maxTokens - 1))
      return budget < maxTokens ? { type: 'enabled', budget_tokens: budget } : undefined
    }
  }
}

export interface StreamRequest {
  apiKey: string
  model: ClaudeModel
  prompt: string
  system?: string
  effort?: Effort
  /** Stream Claude's reasoning summary alongside the answer. */
  showReasoning: boolean
  maxTokens: number
  signal?: AbortSignal
  onText: (delta: string) => void
  onReasoning?: (delta: string) => void
}

export interface StreamResult {
  message: Anthropic.Beta.BetaMessage
  /** Wall-clock time from request start to final event, in ms. */
  elapsedMs: number
}

/**
 * Send one message and stream the response back.
 *
 * Streaming is the default here rather than an enhancement: with a large
 * `max_tokens` a non-streaming request can outlive the HTTP timeout.
 */
export async function streamMessage(req: StreamRequest): Promise<StreamResult> {
  const client = createClient(req.apiKey)
  const started = performance.now()

  const thinking = buildThinking(req.model, req.showReasoning, req.maxTokens)

  // `effort` is rejected outright by models that don't support it.
  const effort =
    req.effort && req.model.effortLevels?.includes(req.effort) ? req.effort : undefined

  // Disabling thinking is only legal at effort <= high, so never pair a high
  // effort level with a thinking-off request.
  const params: Anthropic.Beta.MessageCreateParamsStreaming = {
    model: req.model.id,
    max_tokens: req.maxTokens,
    messages: [{ role: 'user', content: req.prompt }],
    stream: true,
    ...(req.system ? { system: req.system } : {}),
    ...(thinking ? { thinking } : {}),
    ...(effort ? { output_config: { effort } } : {}),
    // Opt into refusal fallbacks on the models that support them: if a safety
    // classifier declines, the API retries on another model inside the same
    // call instead of simply stopping.
    ...(req.model.supportsFallbacks
      ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const }
      : {}),
  }

  const stream = client.beta.messages.stream(params, { signal: req.signal })

  for await (const event of stream) {
    if (event.type !== 'content_block_delta') continue
    if (event.delta.type === 'text_delta') {
      req.onText(event.delta.text)
    } else if (event.delta.type === 'thinking_delta') {
      req.onReasoning?.(event.delta.thinking)
    }
  }

  const message = await stream.finalMessage()
  return { message, elapsedMs: performance.now() - started }
}

/**
 * Ask the API how many tokens a piece of text costs on a given model.
 *
 * Token counts are model-specific, and a tokeniser built for a different
 * model family is simply wrong here — this endpoint is the only accurate
 * answer, and it is free to call.
 */
export async function countTokens(
  apiKey: string,
  modelId: string,
  text: string,
  system?: string,
): Promise<number> {
  const client = createClient(apiKey)
  const result = await client.messages.countTokens({
    model: modelId,
    messages: [{ role: 'user', content: text }],
    ...(system ? { system } : {}),
  })
  return result.input_tokens
}

/** A cheap, offline sanity check on a key's shape. Never proves it works. */
export function looksLikeApiKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim())
}

/**
 * Turn an SDK error into something a beginner can act on.
 * Uses the SDK's typed error classes rather than string-matching messages.
 */
export function describeError(error: unknown): { title: string; detail: string } {
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      title: 'That API key was rejected',
      detail:
        'Check for a stray space, a truncated paste, or a key that has since been revoked in the Console.',
    }
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return {
      title: 'The key is valid but not allowed to do this',
      detail:
        'The workspace may not have access to the selected model, or the key is scoped too narrowly.',
    }
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      title: 'Rate limited',
      detail: 'You have sent too many requests or tokens for now. Wait a moment and try again.',
    }
  }
  if (error instanceof Anthropic.BadRequestError) {
    return {
      title: 'The API rejected this request',
      detail:
        error.message ||
        'Usually a parameter the chosen model does not accept — try a different model or turn reasoning off.',
    }
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      title: 'Could not reach the API',
      detail:
        'Check your network. Browser extensions and strict corporate proxies can also block the request.',
    }
  }
  if (error instanceof Anthropic.APIError) {
    return { title: `API error ${error.status ?? ''}`.trim(), detail: error.message }
  }
  if (error instanceof Error) {
    return { title: 'Something went wrong', detail: error.message }
  }
  return { title: 'Something went wrong', detail: String(error) }
}

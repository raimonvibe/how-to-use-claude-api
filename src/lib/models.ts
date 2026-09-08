/**
 * Claude model catalogue.
 *
 * Prices are Anthropic first-party API rates in USD per million tokens.
 * Cache writes cost ~1.25x the input rate; cache reads are ~0.1x the input
 * rate, except where a model publishes its own flat read rate.
 *
 * The `thinking` and `effort` fields are not cosmetic — the Messages API
 * genuinely rejects the wrong combination for a given model, so the
 * playground reads these flags to build a valid request.
 */

export type ThinkingMode =
  | 'always-on' // thinking cannot be turned off; omit the `thinking` param
  | 'adaptive-default' // adaptive runs by default; can be disabled at effort <= high
  | 'adaptive-opt-in' // adaptive is the only on-mode; omitting it means no thinking
  | 'budget-tokens' // legacy: {type: "enabled", budget_tokens: N}

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export interface ClaudeModel {
  id: string
  name: string
  tagline: string
  /** Maximum input context window, in tokens. */
  contextWindow: number
  /** Maximum tokens the model can generate in one response. */
  maxOutput: number
  inputPer1M: number
  outputPer1M: number
  cacheWritePer1M: number
  cacheReadPer1M: number
  thinking: ThinkingMode
  /** Effort levels this model accepts, or null when `effort` is rejected. */
  effortLevels: Effort[] | null
  /** Opt into server-side refusal fallbacks for this model. */
  supportsFallbacks: boolean
  accent: string
  bestFor: string
}

export const MODELS: ClaudeModel[] = [
  {
    id: 'claude-fable-5-1',
    name: 'Claude Fable 5.1',
    tagline: 'The most capable widely released model',
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    inputPer1M: 10,
    outputPer1M: 50,
    cacheWritePer1M: 12.5,
    cacheReadPer1M: 0.25,
    thinking: 'always-on',
    effortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
    supportsFallbacks: true,
    accent: 'from-violet-500 to-fuchsia-500',
    bestFor: 'Hardest reasoning, long-horizon agents, deep research',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    tagline: 'The everyday flagship — start here',
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    inputPer1M: 5,
    outputPer1M: 25,
    cacheWritePer1M: 6.25,
    cacheReadPer1M: 0.5,
    thinking: 'adaptive-default',
    effortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
    supportsFallbacks: true,
    accent: 'from-orange-500 to-amber-500',
    bestFor: 'Coding, agents, analysis — the sensible default',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    tagline: 'Balanced speed, cost, and smarts',
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    inputPer1M: 2,
    outputPer1M: 10,
    cacheWritePer1M: 2.5,
    cacheReadPer1M: 0.2,
    thinking: 'adaptive-opt-in',
    effortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
    supportsFallbacks: false,
    accent: 'from-sky-500 to-cyan-500',
    bestFor: 'High-volume production traffic, chat, summarisation',
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    tagline: 'Small, quick, and cheap',
    contextWindow: 200_000,
    maxOutput: 64_000,
    inputPer1M: 1,
    outputPer1M: 5,
    cacheWritePer1M: 1.25,
    cacheReadPer1M: 0.1,
    thinking: 'budget-tokens',
    effortLevels: null,
    supportsFallbacks: false,
    accent: 'from-emerald-500 to-teal-500',
    bestFor: 'Classification, extraction, cheap sub-agents',
  },
]

export const DEFAULT_MODEL = 'claude-opus-5'

export function getModel(id: string): ClaudeModel {
  return MODELS.find((m) => m.id === id) ?? MODELS[1]
}

export interface CostBreakdown {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
  total: number
}

/** Cost in USD for a given token mix on a given model. */
export function estimateCost(
  model: ClaudeModel,
  tokens: {
    input?: number
    output?: number
    cacheWrite?: number
    cacheRead?: number
  },
): CostBreakdown {
  const per = (count: number, rate: number) => (count / 1_000_000) * rate
  const input = per(tokens.input ?? 0, model.inputPer1M)
  const output = per(tokens.output ?? 0, model.outputPer1M)
  const cacheWrite = per(tokens.cacheWrite ?? 0, model.cacheWritePer1M)
  const cacheRead = per(tokens.cacheRead ?? 0, model.cacheReadPer1M)
  return {
    input,
    output,
    cacheWrite,
    cacheRead,
    total: input + output + cacheWrite + cacheRead,
  }
}

/** Format a dollar amount, keeping small amounts legible rather than "$0.00". */
export function formatUSD(amount: number): string {
  if (amount === 0) return '$0.00'
  if (amount < 0.01) return `$${amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`
  if (amount < 1) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(2)}`
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}K`
  return String(count)
}

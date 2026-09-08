import { useMemo, useRef, useState } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import { Brain, CircleStop, Play, Sparkles, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stat } from '@/components/common'
import { describeError, streamMessage } from '@/lib/claude'
import { MODELS, estimateCost, formatUSD, getModel, type Effort } from '@/lib/models'

const PRESETS = [
  {
    label: 'Explain a concept',
    prompt: 'Explain what an API key is to someone who has never written code. Three sentences.',
  },
  {
    label: 'Write code',
    prompt: 'Write a Python function that retries a flaky HTTP call with exponential backoff.',
  },
  {
    label: 'Reason it through',
    prompt:
      'A shop sells pens at 3 for 2 pounds and notebooks at 2 for 5 pounds. I spent exactly 31 pounds and bought more pens than notebooks. What did I buy?',
  },
  {
    label: 'Extract structure',
    prompt:
      'Pull the name, date and total from this line into JSON: "Invoice #221, A. Okafor, 14 March 2026, 1204.50 due"',
  },
]

interface RunState {
  text: string
  reasoning: string
  message: Anthropic.Beta.BetaMessage | null
  elapsedMs: number
  error: { title: string; detail: string } | null
}

const EMPTY_RUN: RunState = {
  text: '',
  reasoning: '',
  message: null,
  elapsedMs: 0,
  error: null,
}

export function Playground({ apiKey }: { apiKey: string }) {
  const [modelId, setModelId] = useState(MODELS[1].id)
  const [effort, setEffort] = useState<Effort>('medium')
  const [showReasoning, setShowReasoning] = useState(true)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [system, setSystem] = useState('')
  const [prompt, setPrompt] = useState(PRESETS[0].prompt)
  const [running, setRunning] = useState(false)
  const [run, setRun] = useState<RunState>(EMPTY_RUN)
  const abortRef = useRef<AbortController | null>(null)

  const model = getModel(modelId)
  const supportsEffort = model.effortLevels !== null

  const usage = run.message?.usage
  const cost = useMemo(() => {
    if (!usage) return null
    return estimateCost(model, {
      input: usage.input_tokens,
      output: usage.output_tokens,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
      cacheRead: usage.cache_read_input_tokens ?? 0,
    })
  }, [usage, model])

  const tokensPerSecond =
    run.message && run.elapsedMs > 0
      ? Math.round(run.message.usage.output_tokens / (run.elapsedMs / 1000))
      : 0

  const send = async () => {
    if (!apiKey.trim() || !prompt.trim()) return

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setRun(EMPTY_RUN)

    try {
      const result = await streamMessage({
        apiKey: apiKey.trim(),
        model,
        prompt: prompt.trim(),
        system: system.trim() || undefined,
        effort: supportsEffort ? effort : undefined,
        showReasoning,
        maxTokens,
        signal: controller.signal,
        onText: (delta) => setRun((prev) => ({ ...prev, text: prev.text + delta })),
        onReasoning: (delta) =>
          setRun((prev) => ({ ...prev, reasoning: prev.reasoning + delta })),
      })
      setRun((prev) => ({ ...prev, message: result.message, elapsedMs: result.elapsedMs }))
    } catch (error) {
      // Aborting is a user action, not a failure: keep whatever already streamed.
      if (!controller.signal.aborted) {
        setRun((prev) => ({ ...prev, error: describeError(error) }))
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const stop = () => abortRef.current?.abort()

  const refused = run.message?.stop_reason === 'refusal'
  const truncated = run.message?.stop_reason === 'max_tokens'
  /** With fallbacks on, the model that answered may differ from the one asked. */
  const servedBy = run.message?.model
  const switched = Boolean(servedBy && servedBy !== model.id)

  return (
    <Card className="border-stone-200 bg-white/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:p-6">
        {/* ---------- Request side ---------- */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">Model</Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Effort
              </Label>
              <Select
                value={effort}
                onValueChange={(value) => setEffort(value as Effort)}
                disabled={!supportsEffort}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Not supported" />
                </SelectTrigger>
                <SelectContent>
                  {(model.effortLevels ?? []).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!supportsEffort ? (
            <p className="-mt-2 text-[11px] text-stone-500 dark:text-stone-500">
              {model.name} predates the <code className="font-mono">effort</code> parameter and
              rejects it, so this page leaves it out of the request rather than sending a 400.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Max output tokens
              </Label>
              <span className="font-mono text-xs text-stone-500">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([value]) => setMaxTokens(value)}
              min={256}
              max={8192}
              step={256}
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-500">
              A hard ceiling the model cannot see. Too low and the answer stops mid-sentence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="reasoning" checked={showReasoning} onCheckedChange={setShowReasoning} />
            <Label htmlFor="reasoning" className="text-xs text-stone-600 dark:text-stone-400">
              Stream the reasoning summary
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
              System prompt <span className="text-stone-400">(optional)</span>
            </Label>
            <Textarea
              value={system}
              onChange={(event) => setSystem(event.target.value)}
              placeholder="You are a concise assistant who answers in British English."
              className="min-h-[64px] resize-y text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-[120px] resize-y text-sm"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPrompt(preset.prompt)}
                  className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-orange-600 dark:hover:text-orange-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={send}
              disabled={running || !apiKey.trim() || !prompt.trim()}
              className="flex-1 gap-2 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700"
            >
              <Play className="h-4 w-4" />
              {running ? 'Streaming...' : 'Send to Claude'}
            </Button>
            {running ? (
              <Button variant="outline" onClick={stop} className="gap-2">
                <CircleStop className="h-4 w-4" />
                Stop
              </Button>
            ) : null}
          </div>

          {!apiKey.trim() ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Add your API key above to enable sending.
            </p>
          ) : null}
        </div>

        {/* ---------- Response side ---------- */}
        <div className="space-y-3">
          {run.reasoning ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900/60 dark:bg-violet-950/25">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                  Reasoning summary
                </span>
              </div>
              <p className="scroll-slim max-h-40 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-violet-900/90 dark:text-violet-200/80">
                {run.reasoning}
              </p>
            </div>
          ) : null}

          <div className="scroll-slim min-h-[260px] overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/60">
            {run.text ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                {run.text}
                {running ? <span className="ml-0.5 animate-pulse text-orange-500">|</span> : null}
              </p>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <Sparkles className="mb-2 h-6 w-6 text-stone-300 dark:text-stone-700" />
                <p className="text-sm text-stone-400 dark:text-stone-600">
                  {running ? 'Waiting for the first token...' : 'The response will stream in here.'}
                </p>
              </div>
            )}
          </div>

          {run.error ? (
            <Alert className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
              <TriangleAlert className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>{run.error.title}.</strong> {run.error.detail}
              </AlertDescription>
            </Alert>
          ) : null}

          {refused ? (
            <Alert className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Declined.</strong> A safety classifier refused this request. Always check{' '}
                <code className="font-mono">stop_reason</code> before reading content.
              </AlertDescription>
            </Alert>
          ) : null}

          {truncated ? (
            <Alert className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Cut off at the limit.</strong> That is{' '}
                <code className="font-mono">stop_reason: "max_tokens"</code> — raise the slider and
                send again.
              </AlertDescription>
            </Alert>
          ) : null}

          {switched ? (
            <Alert className="border-sky-300 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
              <AlertDescription className="text-sky-800 dark:text-sky-200">
                Answered by <code className="font-mono">{servedBy}</code> rather than the model you
                picked — a server-side fallback stepped in.
              </AlertDescription>
            </Alert>
          ) : null}

          {usage && cost ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Input" value={`${usage.input_tokens} tok`} />
              <Stat label="Output" value={`${usage.output_tokens} tok`} />
              <Stat label="Cost" value={formatUSD(cost.total)} hint="this call" />
              <Stat label="Speed" value={`${tokensPerSecond} tok/s`} />
              <Stat label="Elapsed" value={`${(run.elapsedMs / 1000).toFixed(1)}s`} />
              <Stat label="Stop reason" value={run.message?.stop_reason ?? '-'} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

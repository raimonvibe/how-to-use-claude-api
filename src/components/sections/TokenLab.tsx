import { useMemo, useState } from 'react'
import { Calculator, Loader2, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Stat } from '@/components/common'
import { countTokens, describeError } from '@/lib/claude'
import { MODELS, estimateCost, formatTokens, formatUSD } from '@/lib/models'
import { TOKEN_COLORS, approximateTokens } from '@/lib/tokenize'

const SAMPLES = [
  {
    label: 'Plain English',
    text: 'The cat sat on the mat and refused, absolutely refused, to move.',
  },
  {
    label: 'Code',
    text: 'const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);',
  },
  {
    label: 'Numbers and IDs',
    text: 'Order 8842301 shipped 2026-03-14 to postcode SW1A 2AA, ref ANTH-99127.',
  },
  {
    label: 'Not English',
    text: 'De kat zat op de mat en weigerde, absoluut weigerde, om te bewegen.',
  },
]

type ExactState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; tokens: number }
  | { status: 'error'; title: string; detail: string }

export function TokenLab({ apiKey }: { apiKey: string }) {
  const [text, setText] = useState(SAMPLES[0].text)
  const [exact, setExact] = useState<ExactState>({ status: 'idle' })

  const tokens = useMemo(() => approximateTokens(text), [text])

  const setSample = (sample: string) => {
    setText(sample)
    setExact({ status: 'idle' })
  }

  const fetchExact = async () => {
    setExact({ status: 'loading' })
    try {
      const count = await countTokens(apiKey.trim(), MODELS[1].id, text)
      setExact({ status: 'done', tokens: count })
    } catch (error) {
      setExact({ status: 'error', ...describeError(error) })
    }
  }

  // Cost is quoted against the exact count when we have one, otherwise the estimate.
  const countForCost = exact.status === 'done' ? exact.tokens : tokens.length
  const charsPerToken = tokens.length > 0 ? (text.length / tokens.length).toFixed(2) : '0'

  return (
    <Card className="border-stone-200 bg-white/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Tokeniser lab
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => setSample(sample.text)}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-orange-600 dark:hover:text-orange-300"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Type anything
          </Label>
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setExact({ status: 'idle' })
            }}
            className="min-h-[88px] resize-y text-sm"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-stone-600 dark:text-stone-400">
            Roughly how it gets chopped up
          </p>
          <div className="scroll-slim max-h-40 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/60">
            {tokens.length > 0 ? (
              <p className="leading-loose">
                {tokens.map((token) => (
                  <span
                    key={token.index}
                    className={`token-chip ${TOKEN_COLORS[token.index % TOKEN_COLORS.length]} text-stone-800 dark:text-stone-100`}
                  >
                    {token.text}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-600">Nothing to tokenise yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Characters" value={String(text.length)} />
          <Stat label="Approx. tokens" value={String(tokens.length)} hint="offline estimate" />
          <Stat label="Chars / token" value={charsPerToken} />
          <Stat
            label="Exact tokens"
            value={exact.status === 'done' ? String(exact.tokens) : '—'}
            hint={exact.status === 'done' ? 'from the API' : 'needs a key'}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExact}
            disabled={!apiKey.trim() || !text || exact.status === 'loading'}
            className="gap-2"
          >
            {exact.status === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Calculator className="h-3.5 w-3.5" />
            )}
            Get the exact count
          </Button>
          <p className="text-[11px] text-stone-500 dark:text-stone-500">
            {apiKey.trim()
              ? 'Uses the count_tokens endpoint, which is free.'
              : 'Add a key above to compare the estimate against the real number.'}
          </p>
        </div>

        {exact.status === 'error' ? (
          <p className="text-xs text-red-700 dark:text-red-400">
            <strong>{exact.title}.</strong> {exact.detail}
          </p>
        ) : null}

        {exact.status === 'done' ? (
          <p className="text-xs text-stone-600 dark:text-stone-400">
            The offline estimate was{' '}
            <strong>
              {tokens.length > exact.tokens ? 'high' : tokens.length < exact.tokens ? 'low' : 'exact'}
            </strong>{' '}
            by {Math.abs(tokens.length - exact.tokens)} token
            {Math.abs(tokens.length - exact.tokens) === 1 ? '' : 's'}. This is why you should never
            bill against a guess — and never use an OpenAI tokeniser for Claude, which undercounts
            by 15-20% on prose and far more on code.
          </p>
        ) : null}

        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/50">
          <p className="mb-2 text-xs font-medium text-stone-600 dark:text-stone-400">
            What this text costs as input, once, on each model
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-stone-900"
              >
                <span className="text-xs text-stone-600 dark:text-stone-400">{model.name}</span>
                <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {formatUSD(estimateCost(model, { input: countForCost }).total)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-500">
            Fractions of a cent — until you send it a million times. At{' '}
            {formatTokens(countForCost)} tokens per call, a million calls on Claude Opus 5 costs{' '}
            {formatUSD(estimateCost(MODELS[1], { input: countForCost * 1_000_000 }).total)}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

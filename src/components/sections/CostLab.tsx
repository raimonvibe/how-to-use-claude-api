import { useMemo, useState } from 'react'
import { Check, Coins, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { MODELS, estimateCost, formatTokens, formatUSD } from '@/lib/models'
import { cn } from '@/lib/utils'

/** Sliders move on a log scale so 10 and 10,000 are both reachable. */
function logSlider(position: number, min: number, max: number): number {
  const scale = (Math.log(max) - Math.log(min)) / 100
  return Math.round(Math.exp(Math.log(min) + scale * position))
}

export function CostLab() {
  const [requestsPos, setRequestsPos] = useState(50)
  const [inputPos, setInputPos] = useState(45)
  const [outputPos, setOutputPos] = useState(40)
  const [cacheHitRate, setCacheHitRate] = useState(0)

  const requestsPerDay = logSlider(requestsPos, 10, 1_000_000)
  const inputTokens = logSlider(inputPos, 100, 200_000)
  const outputTokens = logSlider(outputPos, 50, 20_000)

  const rows = useMemo(() => {
    const perMonth = requestsPerDay * 30
    // A cache hit re-reads the prefix at the cheap rate instead of full price.
    const cached = Math.round(inputTokens * (cacheHitRate / 100))
    const fresh = inputTokens - cached

    return MODELS.map((model) => {
      const monthly = estimateCost(model, {
        input: fresh * perMonth,
        cacheRead: cached * perMonth,
        output: outputTokens * perMonth,
      })
      const perCall = estimateCost(model, {
        input: fresh,
        cacheRead: cached,
        output: outputTokens,
      })
      return { model, monthly: monthly.total, perCall: perCall.total }
    })
  }, [requestsPerDay, inputTokens, outputTokens, cacheHitRate])

  const cheapest = Math.min(...rows.map((row) => row.monthly))

  return (
    <div className="space-y-5">
      <Card className="border-stone-200 bg-white/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              What would this actually cost?
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Requests per day
                </Label>
                <span className="font-mono text-xs text-stone-900 dark:text-stone-200">
                  {requestsPerDay.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[requestsPos]}
                onValueChange={([value]) => setRequestsPos(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Input tokens per request
                </Label>
                <span className="font-mono text-xs text-stone-900 dark:text-stone-200">
                  {formatTokens(inputTokens)}
                </span>
              </div>
              <Slider
                value={[inputPos]}
                onValueChange={([value]) => setInputPos(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Output tokens per request
                </Label>
                <span className="font-mono text-xs text-stone-900 dark:text-stone-200">
                  {formatTokens(outputTokens)}
                </span>
              </div>
              <Slider
                value={[outputPos]}
                onValueChange={([value]) => setOutputPos(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Share of input served from cache
                </Label>
                <span className="font-mono text-xs text-stone-900 dark:text-stone-200">
                  {cacheHitRate}%
                </span>
              </div>
              <Slider
                value={[cacheHitRate]}
                onValueChange={([value]) => setCacheHitRate(value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left dark:border-stone-800">
                  <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Model
                  </th>
                  <th className="pb-2 pr-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                    Per call
                  </th>
                  <th className="pb-2 pr-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                    Per month
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                    Relative
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.model.id}
                    className="border-b border-stone-100 last:border-0 dark:border-stone-800/60"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-r', row.model.accent)}
                        />
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {row.model.name}
                          </p>
                          <p className="text-xs text-stone-500">{row.model.bestFor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-stone-600 dark:text-stone-400">
                      {formatUSD(row.perCall)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {formatUSD(row.monthly)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-stone-500">
                      {row.monthly === cheapest
                        ? 'cheapest'
                        : `${(row.monthly / cheapest).toFixed(1)}x`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
            Estimates only, at first-party API rates, ignoring per-request overheads. Cache reads
            are billed at each model&apos;s cached-input rate; the first write to a cache costs about
            1.25x normal input. Batch processing halves the bill again for work that can wait.
          </p>
        </CardContent>
      </Card>

      {/* ---- Capability comparison ---- */}
      <Card className="border-stone-200 bg-white/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
        <CardContent className="p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-100">
            How the models differ, beyond price
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left dark:border-stone-800">
                  <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Model
                  </th>
                  <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Context
                  </th>
                  <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Max output
                  </th>
                  <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Thinking
                  </th>
                  <th className="pb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Effort
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-stone-100 last:border-0 dark:border-stone-800/60"
                  >
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-stone-900 dark:text-stone-100">{model.name}</p>
                      <code className="font-mono text-[11px] text-stone-500">{model.id}</code>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-stone-600 dark:text-stone-400">
                      {formatTokens(model.contextWindow)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-stone-600 dark:text-stone-400">
                      {formatTokens(model.maxOutput)}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-stone-600 dark:text-stone-400">
                      {model.thinking === 'always-on'
                        ? 'Always on'
                        : model.thinking === 'budget-tokens'
                          ? 'Fixed budget'
                          : 'Adaptive'}
                    </td>
                    <td className="py-2.5">
                      {model.effortLevels ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          {model.effortLevels.length} levels
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                          <Minus className="h-3.5 w-3.5" />
                          rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
            These differences are not trivia — send an <code className="font-mono">effort</code> to
            a model that does not accept one and the API returns a 400. Start on Claude Opus 5 and
            move down only once you have measured that a cheaper model still passes your own tests.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

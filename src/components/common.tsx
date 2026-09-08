import { useState, type ReactNode } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/** Copy-to-clipboard button that confirms in place, then resets. */
export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the text is still selectable on the page */
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      className={cn('h-7 gap-1.5 px-2 text-xs', className)}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{copied ? 'Copied' : label}</span>
    </Button>
  )
}

/** A single code panel with a filename strip and a copy button. */
export function CodeBlock({
  code,
  filename,
  className,
}: {
  code: string
  filename?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-stone-200 bg-stone-950 dark:border-stone-800',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-3 py-1.5">
        <span className="font-mono text-xs text-stone-400">{filename ?? 'example'}</span>
        <CopyButton value={code} className="text-stone-400 hover:bg-stone-800 hover:text-stone-100" />
      </div>
      <pre className="scroll-slim overflow-x-auto p-4 text-[13px] leading-relaxed text-stone-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export interface CodeSample {
  id: string
  label: string
  filename: string
  code: string
}

/** Same idea, one tab per language. */
export function CodeTabs({ samples, className }: { samples: CodeSample[]; className?: string }) {
  return (
    <Tabs defaultValue={samples[0].id} className={cn('w-full min-w-0', className)}>
      {/* The strip scrolls rather than overflowing on narrow screens. */}
      <div className="scroll-slim -mx-1 overflow-x-auto px-1">
        <TabsList className="w-max bg-stone-100 dark:bg-stone-800">
          {samples.map((sample) => (
            <TabsTrigger key={sample.id} value={sample.id} className="whitespace-nowrap text-xs">
              {sample.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {samples.map((sample) => (
        <TabsContent key={sample.id} value={sample.id} className="mt-3">
          <CodeBlock code={sample.code} filename={sample.filename} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Outward link styled as a button, always opened safely in a new tab. */
export function LinkButton({
  href,
  children,
  variant = 'outline',
  className,
}: {
  href: string
  children: ReactNode
  variant?: 'outline' | 'default' | 'secondary' | 'ghost'
  className?: string
}) {
  return (
    <Button variant={variant} size="sm" asChild className={cn('gap-2', className)}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Button>
  )
}

/** Consistent section heading with an anchor target for the nav. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div id={id} className="mb-8 scroll-mt-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-400">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-stone-600 dark:text-stone-400 sm:text-lg">
        {description}
      </p>
    </div>
  )
}

/** Small labelled statistic, used across the playground and estimator. */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2 dark:border-stone-800 dark:bg-stone-900/60">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-500">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{value}</p>
      {hint ? <p className="text-[11px] text-stone-500 dark:text-stone-500">{hint}</p> : null}
    </div>
  )
}

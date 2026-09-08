import { AlertTriangle, Check, Laptop, Puzzle, Smartphone, TerminalSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LinkButton } from '@/components/common'
import { cn } from '@/lib/utils'

/**
 * The single most common and most expensive misunderstanding for newcomers:
 * a Claude subscription and the Claude API are separate products with separate
 * billing. People buy Pro expecting API credit, get none, and conclude the API
 * is broken. This sits directly under the hero for that reason.
 */

const SUBSCRIPTION_POINTS = [
  'Claude Code in your terminal — macOS, Windows and Linux',
  'The Claude apps on phone, web and desktop, same account',
  'Subscribe anywhere, including in the phone app',
  'Far more usage per dollar than paying API rates for the same work',
]

const API_POINTS = [
  'Put Claude inside an app, script, bot or backend you are building',
  'Pay per token, from prepaid credit — no monthly fee',
  'Choose the model, effort and limits per request',
  'What the rest of this page sets up',
]

function Panel({
  badge,
  badgeClass,
  icon,
  title,
  price,
  priceNote,
  question,
  points,
  action,
  highlight,
}: {
  badge: string
  badgeClass: string
  icon: React.ReactNode
  title: string
  price: string
  priceNote: string
  question: string
  points: string[]
  action: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card
      className={cn(
        'relative h-full overflow-hidden border-2 bg-white/80 dark:bg-stone-900/60',
        highlight
          ? 'border-orange-400 shadow-md dark:border-orange-600'
          : 'border-stone-200 dark:border-stone-800',
      )}
    >
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', badgeClass)}>
            {badge}
          </span>
        </div>

        <div className="mb-1 flex items-center gap-2 text-stone-900 dark:text-stone-100">
          {icon}
          <h3 className="text-lg font-bold">{title}</h3>
        </div>

        <p className="mb-1 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {price}
        </p>
        <p className="mb-4 text-xs text-stone-500 dark:text-stone-500">{priceNote}</p>

        <p className="mb-4 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800 dark:bg-stone-800/70 dark:text-stone-200">
          {question}
        </p>

        <ul className="mb-5 space-y-2">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-stone-600 dark:text-stone-400">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">{action}</div>
      </CardContent>
    </Card>
  )
}

export function WhichOne() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          highlight
          badge="Coding with Claude"
          badgeClass="bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300"
          icon={<TerminalSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          title="Claude Pro or Max"
          price="$20 / month"
          priceNote="Pro, billed monthly ($17/mo on the annual plan). Max starts at $100/mo."
          question="Do you want Claude to help you write code?"
          points={SUBSCRIPTION_POINTS}
          action={
            <div className="flex flex-wrap gap-2">
              <LinkButton href="https://claude.com/pricing" variant="default">
                See plans
              </LinkButton>
              <LinkButton href="https://code.claude.com/docs/en/overview">
                What Claude Code is
              </LinkButton>
            </div>
          }
        />

        <Panel
          badge="Building with Claude"
          badgeClass="bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300"
          icon={<Puzzle className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
          title="Claude API"
          price="Pay per token"
          priceNote="From about $1 per million input tokens. No subscription; you buy credit up front."
          question="Do you want Claude inside something you are building?"
          points={API_POINTS}
          action={
            <div className="flex flex-wrap gap-2">
              <LinkButton href="https://console.anthropic.com/" variant="default">
                Open the Console
              </LinkButton>
            </div>
          }
        />
      </div>

      {/* The trap. */}
      <Alert className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>They are billed separately, and one does not include the other.</strong> A Pro or
          Max subscription comes with <em>no</em> API credit — if you are following this guide, you
          still need to buy credit in the Console. Paying for Pro and then wondering why your API
          calls fail is the single most common beginner mistake.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-stone-800 dark:bg-stone-900/50">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            <Smartphone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Yes, you can subscribe on your phone
          </h3>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            It is one account across everything. Subscribe in the Claude app on your phone, then
            sign in to Claude Code on your laptop and it just works — the same plan covers the
            phone app, the web, the desktop app and the terminal, and all of it draws on the same
            usage allowance.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-stone-800 dark:bg-stone-900/50">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            <Laptop className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Why the subscription is better value for coding
          </h3>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            A coding session burns through tokens fast: every file Claude reads is input, and the
            whole conversation is re-sent each turn. Paid per token that adds up quickly. A flat
            monthly plan does not, which is why day-to-day coding belongs on a subscription and the
            API is for what you ship.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-100/70 p-4 dark:border-stone-800 dark:bg-stone-900/40">
        <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
          Two things worth knowing before you pick
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
            <span>
              It is an <strong>allowance, not a token balance</strong>. Usage refills on rolling
              five-hour windows rather than sitting in a pot you spend however you like. Pro gives
              at least 5x the Free allowance; Max is 5x or 20x Pro again.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
            <span>
              <strong>Pro is the entry tier, not the heavy-use tier.</strong> If you code with
              Claude all day you will meet Pro&apos;s limits, and Max exists for that. Start on Pro
              and move up only if you actually hit the ceiling.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

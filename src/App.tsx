import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Menu, Moon, Sun, Terminal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LinkButton, SectionHeading } from '@/components/common'
import { ApiKeyPanel } from '@/components/ApiKeyPanel'
import { WhichOne } from '@/components/sections/WhichOne'
import { Steps, STEP_IDS } from '@/components/sections/Steps'
import { TokenLab } from '@/components/sections/TokenLab'
import { Playground } from '@/components/sections/Playground'
import { CostLab } from '@/components/sections/CostLab'
import { Concepts } from '@/components/sections/Concepts'
import { Footer } from '@/components/sections/Footer'
import { keyStore, progressStore, themeStore } from '@/lib/storage'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'which', label: 'Which one?' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'setup', label: 'Setup' },
  { id: 'playground', label: 'Playground' },
  { id: 'cost', label: 'Cost' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'resources', label: 'Resources' },
]

const RESOURCES = [
  {
    href: 'https://platform.claude.com/docs/en/api/overview',
    title: 'API reference',
    detail: 'Every parameter on every endpoint',
  },
  {
    href: 'https://console.anthropic.com/',
    title: 'Developer Console',
    detail: 'Keys, billing, usage and limits',
  },
  {
    href: 'https://platform.claude.com/docs/en/about-claude/pricing',
    title: 'Pricing',
    detail: 'The authoritative per-model rates',
  },
  {
    href: 'https://platform.claude.com/docs/en/api/rate-limits',
    title: 'Rate limits',
    detail: 'What happens when you send too much',
  },
  {
    href: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview',
    title: 'Prompt engineering',
    detail: 'Getting better answers out of the same model',
  },
  {
    href: 'https://console.anthropic.com/workbench',
    title: 'Workbench',
    detail: 'Anthropic-hosted prompt playground',
  },
]

export default function App() {
  const [dark, setDark] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [remember, setRemember] = useState(false)
  const [done, setDone] = useState<string[]>([])
  const [active, setActive] = useState(NAV[0].id)
  const [menuOpen, setMenuOpen] = useState(false)

  // ---- Restore persisted state once, on mount ----
  useEffect(() => {
    const savedTheme = themeStore.read()
    const prefersDark =
      savedTheme === null &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = savedTheme === 'dark' || prefersDark
    setDark(useDark)
    document.documentElement.classList.toggle('dark', useDark)

    setApiKey(keyStore.read())
    setRemember(keyStore.readRemember())
    setDone(progressStore.read())
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    themeStore.write(next ? 'dark' : 'light')
  }

  const updateKey = useCallback(
    (key: string) => {
      setApiKey(key)
      keyStore.write(key, remember)
    },
    [remember],
  )

  const updateRemember = useCallback(
    (value: boolean) => {
      setRemember(value)
      keyStore.write(apiKey, value)
    },
    [apiKey],
  )

  const toggleStep = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      progressStore.write(next)
      return next
    })
  }

  // ---- Highlight the nav entry for whichever section is on screen ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-88px 0px -55% 0px', threshold: [0.1, 0.5] },
    )

    for (const item of NAV) {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [])

  // ---- Close the mobile menu on Escape, and whenever we grow to desktop ----
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    // 1024px is Tailwind's `lg`, where the full nav takes over again.
    const wide = window.matchMedia('(min-width: 1024px)')
    const onWidthChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    wide.addEventListener('change', onWidthChange)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      wide.removeEventListener('change', onWidthChange)
    }
  }, [menuOpen])

  const completed = done.filter((id) => STEP_IDS.includes(id)).length

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/85 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex min-w-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-600">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Claude API Guide
            </span>
          </a>

          {/* Full nav from `lg` up; the hamburger takes over below that. */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  active === item.id
                    ? 'bg-orange-100 font-medium text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span
              className="hidden rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-600 sm:inline dark:border-stone-700 dark:text-stone-400"
              title="Setup steps completed"
            >
              {completed}/{STEP_IDS.length} done
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* ---- Mobile menu ---- */}
        <nav
          id="mobile-nav"
          hidden={!menuOpen}
          className="border-t border-stone-200 bg-stone-50 px-4 py-3 shadow-lg lg:hidden dark:border-stone-800 dark:bg-stone-950"
        >
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm transition-colors',
                    active === item.id
                      ? 'bg-orange-100 font-medium text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900',
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-500 sm:hidden dark:border-stone-800">
            {completed} of {STEP_IDS.length} setup steps done
          </p>
        </nav>
      </header>

      {/* Tap-anywhere-to-close backdrop, below the header but above the page. */}
      {menuOpen ? (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-stone-900/20 lg:hidden dark:bg-black/40"
        />
      ) : null}

      <main id="top" className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {/* ---------------- Hero ---------------- */}
        <section className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
            <BookOpen className="h-3.5 w-3.5" />
            Read it, then run it — on this page
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Learn the{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Claude API
            </span>{' '}
            by using it
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            Get a key, cap your spending, and send your first request — then keep the tab open as a
            working scratchpad. Every number on this page is measured, not made up: real token
            counts, real costs, real streamed responses.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700">
              <a href="#setup">Start the setup</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#playground">Skip to the playground</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-500">
            Just want Claude to help you code?{' '}
            <a
              href="#which"
              className="font-medium text-orange-700 underline underline-offset-4 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
            >
              You probably want the $20/month plan, not the API
            </a>
            .
          </p>
        </section>

        {/* ---------------- Subscription vs API ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="which"
            eyebrow="Start here"
            title="Do you actually need the API?"
            description="There are two separate ways to pay for Claude, and picking the wrong one wastes money. If you want Claude to help you write code, a $20/month subscription is almost certainly what you want — not this. The API is for putting Claude inside something you are building."
          />
          <WhichOne />
        </section>

        {/* ---------------- Tokens ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="tokens"
            eyebrow="First principles"
            title="Everything is tokens"
            description="Claude never sees your words. Text is split into tokens — chunks of a few characters — and tokens are the unit you are billed in, the unit context windows are measured in, and the unit rate limits count. Get a feel for them and the rest of the API stops being mysterious."
          />
          <TokenLab apiKey={apiKey} />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'A token is not a word',
                detail:
                  'Common English words are usually one token; rare words, code, punctuation and non-English text fragment into several. That is why the same sentence costs different amounts in different languages.',
              },
              {
                title: 'You pay both ways',
                detail:
                  'Input tokens (everything you send, including the whole conversation history) and output tokens (what Claude writes) are billed at different rates. Output is the expensive half.',
              },
              {
                title: 'Context is finite',
                detail:
                  'A context window is the ceiling on what fits in one request. It is generous now — a million tokens on current models — but a long agent loop will still find the edge.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-stone-800 dark:bg-stone-900/50"
              >
                <h3 className="mb-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Setup ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="setup"
            eyebrow="Getting access"
            title="Five steps to your first request"
            description="Tick them off as you go — your progress is remembered on this device. Step 2 is the one people skip and later regret."
          />
          <Alert className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Set a spending limit before you write any code.</strong> An accidental loop can
              burn through credit in minutes, and a cap is the only thing that reliably stops it.
            </AlertDescription>
          </Alert>
          <Steps done={done} onToggle={toggleStep} />
        </section>

        {/* ---------------- Playground ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="playground"
            eyebrow="Try it"
            title="Send a real request"
            description="This runs against the live Messages API with your own key, streaming the answer back token by token and showing exactly what it cost. Nothing is simulated."
          />
          <div className="mb-5">
            <ApiKeyPanel
              apiKey={apiKey}
              onKeyChange={updateKey}
              remember={remember}
              onRememberChange={updateRemember}
            />
          </div>
          <Playground apiKey={apiKey} />
        </section>

        {/* ---------------- Cost ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="cost"
            eyebrow="Money"
            title="Choosing a model, with the bill in view"
            description="Model choice is mostly an economics decision. Drag the sliders to match the traffic you expect and see what each model would cost you per month."
          />
          <CostLab />
        </section>

        {/* ---------------- Concepts ---------------- */}
        <section className="mb-16">
          <SectionHeading
            id="concepts"
            eyebrow="Next"
            title="The six things you will need soon"
            description="Once a plain request works, these are what you reach for next — and the mistakes each one invites."
          />
          <Concepts />
        </section>

        {/* ---------------- Resources ---------------- */}
        <section>
          <SectionHeading
            id="resources"
            eyebrow="Keep going"
            title="Where to look next"
            description="Pricing and model names move faster than any tutorial. When this page and the official docs disagree, believe the docs."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((resource) => (
              <a
                key={resource.href}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-stone-200 bg-white/70 p-4 transition-colors hover:border-orange-400 dark:border-stone-800 dark:bg-stone-900/50 dark:hover:border-orange-600"
              >
                <p className="font-medium text-stone-900 group-hover:text-orange-700 dark:text-stone-100 dark:group-hover:text-orange-400">
                  {resource.title}
                </p>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{resource.detail}</p>
              </a>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href="https://github.com/raimonvibe/how-to-use-claude-api">
              Source on GitHub
            </LinkButton>
            <LinkButton href="https://platform.claude.com/docs/en/api/getting-started">
              Official quickstart
            </LinkButton>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

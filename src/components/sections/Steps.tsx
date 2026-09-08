import type { ReactNode } from 'react'
import { Check, CreditCard, KeyRound, Lock, Rocket, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CodeBlock, CodeTabs, CopyButton, LinkButton, type CodeSample } from '@/components/common'
import { cn } from '@/lib/utils'

const FIRST_CALL: CodeSample[] = [
  {
    id: 'ts',
    label: 'TypeScript',
    filename: 'first-call.ts',
    code: `import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment - never hardcode the key.
const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  messages: [
    { role: "user", content: "Explain the Claude API in one sentence." },
  ],
});

// content is a discriminated union - narrow on .type before reading .text
for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}`,
  },
  {
    id: 'py',
    label: 'Python',
    filename: 'first_call.py',
    code: `from anthropic import Anthropic

# Reads ANTHROPIC_API_KEY from the environment - never hardcode the key.
client = Anthropic()

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    messages=[
        {"role": "user", "content": "Explain the Claude API in one sentence."}
    ],
)

for block in response.content:
    if block.type == "text":
        print(block.text)`,
  },
  {
    id: 'curl',
    label: 'cURL',
    filename: 'first-call.sh',
    code: `curl https://api.anthropic.com/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-opus-5",
    "max_tokens": 16000,
    "messages": [
      {"role": "user", "content": "Explain the Claude API in one sentence."}
    ]
  }'`,
  },
]

const ENV_SETUP: CodeSample[] = [
  {
    id: 'unix',
    label: 'macOS / Linux',
    filename: '.env',
    code: `# .env  (add this file to .gitignore first)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# ...or export it for the current shell
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"`,
  },
  {
    id: 'win',
    label: 'Windows',
    filename: 'PowerShell',
    code: `# Current session only
$env:ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here"

# Persist it for your user account
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_API_KEY", "sk-ant-api03-your-key-here", "User")`,
  },
  {
    id: 'gitignore',
    label: '.gitignore',
    filename: '.gitignore',
    code: `# Keep secrets out of version control
.env
.env.local
*.pem`,
  },
]

interface Step {
  id: string
  number: number
  title: string
  summary: string
  icon: ReactNode
  accent: string
  body: ReactNode
}

const STEPS: Step[] = [
  {
    id: 'step-account',
    number: 1,
    title: 'Create an Anthropic Console account',
    summary: 'The Console is separate from the Claude chat app — a Claude.ai login is not enough.',
    icon: <UserPlus className="h-5 w-5" />,
    accent: 'from-orange-500 to-amber-500',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Sign up at the Claude Developer Console. This is a different product from the Claude chat
          app you may already use: a Claude Pro subscription gives you no API credit, and API
          spending is billed separately.
        </p>
        <LinkButton href="https://console.anthropic.com/">Open the Console</LinkButton>
      </div>
    ),
  },
  {
    id: 'step-budget',
    number: 2,
    title: 'Add credit and cap your spending',
    summary: 'Do this before you create a key, not after your first surprise bill.',
    icon: <CreditCard className="h-5 w-5" />,
    accent: 'from-emerald-500 to-teal-500',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          The API is prepaid: you buy credit, and requests draw it down. Buy the smallest amount
          offered while you are learning — $5 is thousands of ordinary requests.
        </p>
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Then, in <strong>Billing → Usage limits</strong>, set a monthly cap and an email alert
          below it. A runaway loop is the single most common way beginners lose money, and a cap
          turns a bad afternoon into a $5 lesson.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="https://console.anthropic.com/settings/billing">Billing</LinkButton>
          <LinkButton href="https://console.anthropic.com/settings/limits">Usage limits</LinkButton>
        </div>
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Turn <strong>off</strong> auto-reload while you are experimenting. It exists to keep
            production running, and it will happily refill an account that a bug is draining.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: 'step-key',
    number: 3,
    title: 'Create your API key',
    summary: 'Shown once. Copy it straight into a password manager.',
    icon: <KeyRound className="h-5 w-5" />,
    accent: 'from-violet-500 to-fuchsia-500',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Go to <strong>API keys → Create key</strong>. Name it after the thing that will use it
          (<code className="font-mono text-xs">laptop-dev</code>,{' '}
          <code className="font-mono text-xs">ci</code>) so you can revoke one without breaking
          everything else. Keys look like{' '}
          <code className="font-mono text-xs">sk-ant-api03-…</code>.
        </p>
        <LinkButton href="https://console.anthropic.com/settings/keys">API keys</LinkButton>
        <Alert className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            The key is displayed once and never again. If you lose it, revoke it and make a new one
            — and if you ever paste one into a commit, a screenshot, or a chat message, revoke it
            immediately. Leaked keys get scraped from public repositories within minutes.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: 'step-store',
    number: 4,
    title: 'Store it in an environment variable',
    summary: 'Every official SDK reads ANTHROPIC_API_KEY on its own.',
    icon: <Lock className="h-5 w-5" />,
    accent: 'from-sky-500 to-cyan-500',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Put the key in the environment and construct the client with no arguments. The SDK picks
          it up, and the secret never appears in a file you might commit.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 dark:border-stone-800 dark:bg-stone-800/60">
          <code className="font-mono text-xs text-stone-800 dark:text-stone-200">
            ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
          </code>
          <CopyButton value="ANTHROPIC_API_KEY=sk-ant-api03-your-key-here" />
        </div>
        <CodeTabs samples={ENV_SETUP} />
      </div>
    ),
  },
  {
    id: 'step-call',
    number: 5,
    title: 'Make your first call',
    summary: 'One endpoint does almost everything: POST /v1/messages.',
    icon: <Rocket className="h-5 w-5" />,
    accent: 'from-rose-500 to-orange-500',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Install the SDK, then send a message. Tools, images, PDFs, streaming and structured
          output are all parameters on this same endpoint rather than separate APIs.
        </p>
        <CodeBlock code="npm install @anthropic-ai/sdk    # or: pip install anthropic" filename="install" />
        <CodeTabs samples={FIRST_CALL} />
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Prefer not to install anything yet? Scroll to the playground below and run the same
          request from this page.
        </p>
      </div>
    ),
  },
]

export function Steps({
  done,
  onToggle,
}: {
  done: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-5">
      {STEPS.map((step) => {
        const complete = done.includes(step.id)
        return (
          <Card
            key={step.id}
            id={step.id}
            className={cn(
              'scroll-mt-24 overflow-hidden border-stone-200 bg-white/80 shadow-sm transition-opacity dark:border-stone-800 dark:bg-stone-900/60',
              complete && 'opacity-75',
            )}
          >
            <CardHeader className={cn('bg-gradient-to-r p-4 text-white sm:p-5', step.accent)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    {step.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      <span className="mr-2 opacity-75">{step.number}.</span>
                      {step.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-white/80">
                      {step.summary}
                    </CardDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(step.id)}
                  aria-pressed={complete}
                  aria-label={complete ? `Mark step ${step.number} as not done` : `Mark step ${step.number} as done`}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/60 transition-colors',
                    complete ? 'bg-white text-emerald-600' : 'text-transparent hover:bg-white/20',
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">{step.body}</CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export const STEP_IDS = STEPS.map((step) => step.id)

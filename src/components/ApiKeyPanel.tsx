import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { countTokens, describeError, looksLikeApiKey } from '@/lib/claude'
import { DEFAULT_MODEL } from '@/lib/models'
import { LinkButton } from '@/components/common'

type VerifyState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid' }
  | { status: 'invalid'; title: string; detail: string }

export function ApiKeyPanel({
  apiKey,
  onKeyChange,
  remember,
  onRememberChange,
}: {
  apiKey: string
  onKeyChange: (key: string) => void
  remember: boolean
  onRememberChange: (remember: boolean) => void
}) {
  const [visible, setVisible] = useState(false)
  const [verify, setVerify] = useState<VerifyState>({ status: 'idle' })

  const shapeOk = looksLikeApiKey(apiKey)

  /**
   * Verifying costs nothing: `count_tokens` is a free endpoint, so it proves
   * the key authenticates without spending a cent of the user's balance.
   */
  const runVerify = async () => {
    setVerify({ status: 'checking' })
    try {
      await countTokens(apiKey.trim(), DEFAULT_MODEL, 'ping')
      setVerify({ status: 'valid' })
    } catch (error) {
      setVerify({ status: 'invalid', ...describeError(error) })
    }
  }

  const clearKey = () => {
    onKeyChange('')
    setVerify({ status: 'idle' })
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/50 dark:bg-orange-950/20 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Your API key
        </h3>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-800 dark:bg-orange-900/60 dark:text-orange-200">
          Stays in your browser
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type={visible ? 'text' : 'password'}
            value={apiKey}
            onChange={(event) => {
              onKeyChange(event.target.value)
              setVerify({ status: 'idle' })
            }}
            placeholder="sk-ant-api03-..."
            spellCheck={false}
            autoComplete="off"
            aria-label="Anthropic API key"
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            aria-label={visible ? 'Hide API key' : 'Show API key'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runVerify}
            disabled={!apiKey.trim() || verify.status === 'checking'}
            size="sm"
            className="h-9 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700"
          >
            {verify.status === 'checking' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Verify
          </Button>
          {apiKey ? (
            <Button variant="outline" size="sm" onClick={clearKey} className="h-9" aria-label="Clear key">
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="remember-key" checked={remember} onCheckedChange={onRememberChange} />
          <Label htmlFor="remember-key" className="text-xs text-stone-600 dark:text-stone-400">
            Remember on this device
            <span className="ml-1 text-stone-400 dark:text-stone-600">
              (otherwise cleared when the tab closes)
            </span>
          </Label>
        </div>
        <LinkButton href="https://console.anthropic.com/settings/keys" variant="ghost">
          Get a key
        </LinkButton>
      </div>

      {apiKey && !shapeOk && verify.status === 'idle' ? (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          That does not look like an Anthropic key — they start with{' '}
          <code className="font-mono">sk-ant-</code>. Check for a truncated paste.
        </p>
      ) : null}

      {verify.status === 'valid' ? (
        <Alert className="mt-3 border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            Key works. Verified with a free <code className="font-mono">count_tokens</code> call, so
            this cost you nothing.
          </AlertDescription>
        </Alert>
      ) : null}

      {verify.status === 'invalid' ? (
        <Alert className="mt-3 border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>{verify.title}.</strong> {verify.detail}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
        <p>
          This page has no backend. It talks to the Claude API directly from your browser, so your
          key goes nowhere except Anthropic — it is not logged, proxied or sent to whoever hosts
          this site. You can check that yourself: the{' '}
          <a
            href="https://github.com/raimonvibe/how-to-use-claude-api/blob/main/src/lib/claude.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300"
          >
            source is public
          </a>
          , and your browser&apos;s network tab shows every request it makes.
        </p>
        <p>
          Even so, treat a key you paste into any website as spent: use one created for
          experimenting, keep a low spending cap on it, and revoke it in the Console when you are
          done. And do not copy this pattern into a product of your own — anyone who opens devtools
          on a page can read a key that page is holding, so real applications keep the key on a
          server.
        </p>
      </div>
    </div>
  )
}

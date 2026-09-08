# Claude API Setup Guide

An interactive, beginner-friendly guide to the **Claude API** — read the explanation, then run
a real request from the same page.

This is a rebuild of [how-to-use-open-ai-api](https://github.com/raimonvibe/how-to-use-open-ai-api)
for Claude, with the static explainers replaced by things you can actually operate.

## What it does

**Do you actually need the API?** — the first thing on the page, because it is the mistake that
costs people money. A Claude Pro/Max subscription (from $20/month) covers Claude Code and the
Claude apps; the API is for putting Claude inside something you are building. They are billed
separately, and a subscription includes **no** API credit.

**Everything is tokens** — a live tokeniser lab. Type anything and watch it get chopped into
coloured chunks, with a character count, an offline estimate, and — if you have supplied a key —
the *exact* token count from the API, so you can see how far the guess was off. The same text is
priced against every current model underneath.

**Five steps to your first request** — account, spending cap, key, environment variable, first
call. Each step has a checkbox, and your progress is remembered on the device. Code samples come
in TypeScript, Python and cURL.

**A live playground** — pick a model, set the effort level and output ceiling, optionally stream
Claude's reasoning summary, and send a real message. The answer streams in token by token, and
afterwards you get input/output token counts, the actual cost of that call, tokens per second,
and the `stop_reason`.

**A cost calculator** — drag sliders for requests per day, prompt size, response size and cache
hit rate, and compare what each model would cost per month.

**Concepts you will need next** — streaming, prompt caching, tool use, multi-turn history, batch
processing, and error handling, each with working code and the mistake it invites.

## What is different from the OpenAI original

The original is a static explainer: you read about API keys, then leave to go and use one. This
version is built around the idea that you learn an API by calling it.

| | OpenAI version | This version |
|---|---|---|
| Token explanation | A fixed example: `"cat"` → `[0.2, -0.1, 0.8, ...]` | Live tokeniser, plus real counts from `count_tokens` |
| Costs | Prose about a $5 limit | Calculator with current per-model rates |
| Trying the API | Links out to the docs | Streams a real response in the page |
| Progress | None | Per-step checkboxes, persisted |
| Model choice | Not covered | Side-by-side price *and* capability comparison |
| Key handling | Not applicable | Session-only by default, opt-in persistence, free verification |

It is also deliberately accurate about the API's sharp edges. Model families disagree about
what they accept — `effort` is rejected outright by Claude Haiku 4.5, thinking cannot be turned
off on some models and is off by default on others — so the request builder in
[`src/lib/claude.ts`](src/lib/claude.ts) shapes each request to the selected model rather than
sending one shape and hoping.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build    # typecheck + production build
npm run preview  # serve the production build
npm run lint
```

Requires Node 18+.

## About the API key

The playground calls the Claude API **directly from your browser**. That needs two explicit
opt-ins — the SDK's `dangerouslyAllowBrowser` flag and the
`anthropic-dangerous-direct-browser-access` header — and both are named "dangerous" on purpose.

For this page that is the right trade: the key is yours, you type it in, and it goes nowhere
except Anthropic. It is held in `sessionStorage` and disappears when the tab closes unless you
tick "remember on this device".

**Do not copy this pattern into a product.** Anyone who can open devtools on a page can read a
key that page is holding. Real applications keep the key on a server and proxy requests through
it.

Verifying a key uses the `count_tokens` endpoint, which is free — checking that your key works
costs nothing.

## Tech

React 18, TypeScript, Vite, Tailwind CSS, Radix UI primitives (shadcn/ui), lucide-react, and the
official [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript).

## A caveat on the numbers

Model names, prices and capabilities move faster than any tutorial. The figures here are
first-party API rates at the time of writing. When this page and the
[official documentation](https://platform.claude.com/docs) disagree, believe the documentation.

## Licence

MIT — see [LICENSE](LICENSE).

## Connect with Raimon

- **X**: [@raimonvibe](https://x.com/raimonvibe/)
- **YouTube**: [Raimon's channel](https://www.youtube.com/channel/UCDGDNuYb2b2Ets9CYCNVbuA/videos/)
- **TikTok**: [@raimonvibe](https://www.tiktok.com/@raimonvibe/)
- **Instagram**: [@raimonvibe](https://www.instagram.com/raimonvibe/)
- **Medium**: [@raimonvibe](https://medium.com/@raimonvibe/)
- **LinkedIn**: [raimonvibe](https://www.linkedin.com/in/raimonvibe/)
- **GitHub**: [raimonvibe](https://github.com/raimonvibe/)

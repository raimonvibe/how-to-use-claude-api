import type { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { CodeBlock } from '@/components/common'

interface Concept {
  id: string
  title: string
  hook: string
  body: ReactNode
}

const CONCEPTS: Concept[] = [
  {
    id: 'streaming',
    title: 'Streaming',
    hook: 'Not a nicety — long replies time out without it.',
    body: (
      <div className="space-y-3">
        <p>
          A non-streaming request holds the connection open until the whole answer exists. Ask for a
          large <code className="font-mono">max_tokens</code> and you can hit the SDK&apos;s HTTP
          timeout before the model finishes. Stream instead, and take the assembled result from{' '}
          <code className="font-mono">finalMessage()</code> when you still want the whole object.
        </p>
        <CodeBlock
          filename="stream.ts"
          code={`const stream = client.messages.stream({
  model: "claude-opus-5",
  max_tokens: 64000,
  messages: [{ role: "user", content: "Write a short story." }],
});

// The "text" event hands you just the delta string.
stream.on("text", (delta) => process.stdout.write(delta));

// finalMessage() handles completion, errors and aborts for you -
// don't hand-roll a Promise around the events.
const message = await stream.finalMessage();
console.log(message.usage.output_tokens);`}
        />
      </div>
    ),
  },
  {
    id: 'caching',
    title: 'Prompt caching',
    hook: 'The one optimisation to reach for before any other.',
    body: (
      <div className="space-y-3">
        <p>
          If every request re-sends the same long system prompt or document, you are paying full
          price for the same tokens over and over. Caching stores that prefix and re-reads it at a
          fraction of the cost.
        </p>
        <p>
          The catch is that caching is a <strong>prefix match</strong>. One changed byte anywhere in
          the prefix invalidates everything after it — so a timestamp or a request ID near the top
          of a system prompt silently destroys the cache. Put stable content first and volatile
          content last.
        </p>
        <CodeBlock
          filename="caching.ts"
          code={`const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  cache_control: { type: "ephemeral" }, // caches the last cacheable block
  system: largeStableDocument,
  messages: [{ role: "user", content: question }], // volatile part last
});

// Prove it is working. If this stays 0 across identical-prefix
// requests, something in the prefix is changing between calls.
console.log(response.usage.cache_read_input_tokens);`}
        />
      </div>
    ),
  },
  {
    id: 'tools',
    title: 'Tool use',
    hook: 'Let Claude call your code, without writing the loop yourself.',
    body: (
      <div className="space-y-3">
        <p>
          You describe a function; Claude decides when to call it and with what arguments; your code
          runs it and hands back the result. The SDK&apos;s tool runner drives that back-and-forth
          so you only write the function.
        </p>
        <CodeBlock
          filename="tools.ts"
          code={`import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const getWeather = betaZodTool({
  name: "get_weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City and country, e.g. Lisbon, Portugal"),
  }),
  run: async ({ location }) => \`18C and raining in \${location}\`,
});

const runner = client.beta.messages.toolRunner({
  model: "claude-opus-5",
  max_tokens: 16000,
  tools: [getWeather],
  messages: [{ role: "user", content: "Should I take a coat in Lisbon?" }],
});

const finalMessage = await runner;`}
        />
      </div>
    ),
  },
  {
    id: 'conversation',
    title: 'Multi-turn conversations',
    hook: 'The API remembers nothing. That is your job.',
    body: (
      <div className="space-y-3">
        <p>
          There is no session or thread ID. Every request carries the entire history, which is why a
          long conversation gets steadily more expensive — and why caching matters so much once the
          history grows.
        </p>
        <CodeBlock
          filename="conversation.ts"
          code={`const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "My name is Alice." },
  { role: "assistant", content: "Hello Alice, nice to meet you." },
  { role: "user", content: "What is my name?" },
];

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  messages, // the whole history, every time
});`}
        />
      </div>
    ),
  },
  {
    id: 'batch',
    title: 'Batch processing',
    hook: 'Half price, if the answer can wait.',
    body: (
      <div className="space-y-3">
        <p>
          For work with no user waiting on it — nightly classification, backfills, evaluations —
          submit a batch and collect results later at half the per-token cost.
        </p>
        <p>
          Results come back in <strong>any order</strong>. Match them by{' '}
          <code className="font-mono">custom_id</code>, never by position in the array.
        </p>
        <CodeBlock
          filename="batch.ts"
          code={`const batch = await client.messages.batches.create({
  requests: rows.map((row) => ({
    custom_id: row.id,
    params: {
      model: "claude-opus-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: row.text }],
    },
  })),
});

// Poll until processing_status === "ended", then stream the results
// and key them by custom_id.`}
        />
      </div>
    ),
  },
  {
    id: 'errors',
    title: 'Errors and refusals',
    hook: 'A 200 response does not always mean you got an answer.',
    body: (
      <div className="space-y-3">
        <p>
          Catch a chain of specific error classes rather than one broad one: a 429 is worth
          retrying, a 400 never is. And check{' '}
          <code className="font-mono">stop_reason</code> before you read the content — a request
          that was declined, or that hit the token ceiling, still arrives as a successful HTTP
          response.
        </p>
        <CodeBlock
          filename="errors.ts"
          code={`try {
  const response = await client.messages.create({ /* ... */ });

  if (response.stop_reason === "refusal") {
    // Declined on safety grounds - content will not be useful.
  } else if (response.stop_reason === "max_tokens") {
    // Truncated mid-thought - raise max_tokens and retry.
  }
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) {
    // Bad or revoked key - do not retry.
  } else if (error instanceof Anthropic.RateLimitError) {
    // Back off and retry.
  } else if (error instanceof Anthropic.APIError) {
    console.error(error.status, error.message);
  }
}`}
        />
      </div>
    ),
  },
]

export function Concepts() {
  return (
    <Card className="border-stone-200 bg-white/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
      <CardContent className="p-2 sm:p-4">
        <Accordion type="single" collapsible className="w-full">
          {CONCEPTS.map((concept) => (
            <AccordionItem key={concept.id} value={concept.id} className="border-stone-200 dark:border-stone-800">
              <AccordionTrigger className="px-2 text-left hover:no-underline sm:px-3">
                <div className="pr-3">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{concept.title}</p>
                  <p className="mt-0.5 text-sm font-normal text-stone-500 dark:text-stone-400">
                    {concept.hook}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 sm:px-3">
                <div className="space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {concept.body}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

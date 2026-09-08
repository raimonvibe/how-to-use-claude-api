/**
 * A local, approximate tokeniser used only for the visualiser.
 *
 * Claude's real tokeniser is not published, and a tokeniser borrowed from
 * another model family is materially wrong here — those undercount by roughly
 * 15-20% on prose and much more on code. So this splitter exists to *show the
 * shape* of tokenisation instantly and offline; the exact number always comes
 * from the `count_tokens` endpoint, which is free to call.
 */

export interface ApproxToken {
  text: string
  /** Stable index used to pick a colour, so re-renders don't reshuffle. */
  index: number
}

/** Longest-first list of common English word endings that split off cleanly. */
const SUFFIXES = ['ing', 'tion', 'ally', 'ness', 'ment', 'able', 'ed', 'ly', 'es', 's']

function splitWord(word: string): string[] {
  // Short words are almost always a single token.
  if (word.length <= 6) return [word]

  for (const suffix of SUFFIXES) {
    if (word.length > suffix.length + 3 && word.toLowerCase().endsWith(suffix)) {
      return [word.slice(0, -suffix.length), word.slice(-suffix.length)]
    }
  }

  // Otherwise chunk it, which is roughly what byte-pair encoding does to
  // words it has never seen.
  const pieces: string[] = []
  for (let i = 0; i < word.length; i += 5) {
    pieces.push(word.slice(i, i + 5))
  }
  return pieces
}

export function approximateTokens(input: string): ApproxToken[] {
  if (!input) return []

  // Keep whitespace attached to the following word, the way real tokenisers do.
  const chunks = input.match(/\s*[A-Za-z]+|\s*\d+|\s*[^\sA-Za-z\d]|\s+/g) ?? []

  const tokens: ApproxToken[] = []
  for (const chunk of chunks) {
    const leading = chunk.match(/^\s*/)?.[0] ?? ''
    const body = chunk.slice(leading.length)

    if (!body) {
      tokens.push({ text: chunk, index: tokens.length })
      continue
    }

    if (/^[A-Za-z]+$/.test(body)) {
      const parts = splitWord(body)
      parts.forEach((part, i) => {
        tokens.push({ text: i === 0 ? leading + part : part, index: tokens.length })
      })
    } else if (/^\d+$/.test(body)) {
      // Digits tokenise densely — roughly a token per 1-3 characters.
      for (let i = 0; i < body.length; i += 3) {
        const part = body.slice(i, i + 3)
        tokens.push({ text: i === 0 ? leading + part : part, index: tokens.length })
      }
    } else {
      tokens.push({ text: chunk, index: tokens.length })
    }
  }

  return tokens
}

/** Colour classes cycled across token chips so boundaries are visible. */
export const TOKEN_COLORS = [
  'bg-orange-200/70 dark:bg-orange-500/25',
  'bg-sky-200/70 dark:bg-sky-500/25',
  'bg-emerald-200/70 dark:bg-emerald-500/25',
  'bg-violet-200/70 dark:bg-violet-500/25',
  'bg-amber-200/70 dark:bg-amber-500/25',
  'bg-rose-200/70 dark:bg-rose-500/25',
]

/**
 * Small wrappers around browser storage.
 *
 * Every access is guarded: private windows, cleared site data, and browsers
 * configured to block storage can all make these throw rather than return
 * null, and a guide page should never white-screen because of that.
 */

const KEY_STORAGE = 'claude-guide:api-key'
const REMEMBER_STORAGE = 'claude-guide:remember-key'
const PROGRESS_STORAGE = 'claude-guide:progress'
const THEME_STORAGE = 'claude-guide:theme'

function safeGet(store: Storage | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSet(store: Storage | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value)
  } catch {
    /* storage unavailable — degrade to in-memory only */
  }
}

function safeRemove(store: Storage | undefined, key: string): void {
  try {
    store?.removeItem(key)
  } catch {
    /* nothing to do */
  }
}

const session = typeof window !== 'undefined' ? window.sessionStorage : undefined
const local = typeof window !== 'undefined' ? window.localStorage : undefined

/**
 * The API key lives in sessionStorage by default, so it disappears when the
 * tab closes. Persisting to localStorage is opt-in and clearly labelled.
 */
export const keyStore = {
  read(): string {
    return safeGet(session, KEY_STORAGE) ?? safeGet(local, KEY_STORAGE) ?? ''
  },
  readRemember(): boolean {
    return safeGet(local, REMEMBER_STORAGE) === 'true'
  },
  write(key: string, remember: boolean): void {
    if (!key) {
      this.clear()
      return
    }
    safeSet(session, KEY_STORAGE, key)
    if (remember) {
      safeSet(local, KEY_STORAGE, key)
      safeSet(local, REMEMBER_STORAGE, 'true')
    } else {
      safeRemove(local, KEY_STORAGE)
      safeSet(local, REMEMBER_STORAGE, 'false')
    }
  },
  clear(): void {
    safeRemove(session, KEY_STORAGE)
    safeRemove(local, KEY_STORAGE)
    safeRemove(local, REMEMBER_STORAGE)
  },
}

export const progressStore = {
  read(): string[] {
    const raw = safeGet(local, PROGRESS_STORAGE)
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  },
  write(done: string[]): void {
    safeSet(local, PROGRESS_STORAGE, JSON.stringify(done))
  },
}

export const themeStore = {
  read(): 'light' | 'dark' | null {
    const value = safeGet(local, THEME_STORAGE)
    return value === 'light' || value === 'dark' ? value : null
  },
  write(theme: 'light' | 'dark'): void {
    safeSet(local, THEME_STORAGE, theme)
  },
}

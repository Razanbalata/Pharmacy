/**
 * The outbox holds actions made while offline (for now: confirmed sales) and sends them
 * in order when the connection is back. Each entry carries a client id the server uses
 * to ignore duplicates, so sending twice never creates two invoices.
 */
export interface OutboxEntry<TPayload = unknown> {
  /** Client-made id. The server must treat it as an idempotency key. */
  id: string
  /** What kind of action, e.g. "sale.confirm". */
  type: string
  payload: TPayload
  createdAt: string
  attempts: number
  /** Set when the server refused it (4xx); needs a person to look at it. */
  failedReason?: string
}

/** Where entries are kept. Memory now; IndexedDB later so they survive a reload. */
export interface OutboxStorage {
  all(): Promise<OutboxEntry[]>
  put(entry: OutboxEntry): Promise<void>
  remove(id: string): Promise<void>
}

export type SendResult = { ok: true } | { ok: false; retry: boolean; reason: string }

/** Sends one entry to the server. Network errors → retry later; 4xx → stop and mark failed. */
export type OutboxSender = (entry: OutboxEntry) => Promise<SendResult>

export function createMemoryStorage(): OutboxStorage {
  const entries = new Map<string, OutboxEntry>()
  return {
    all: async () => [...entries.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    put: async (entry) => {
      entries.set(entry.id, entry)
    },
    remove: async (id) => {
      entries.delete(id)
    },
  }
}

export interface Outbox {
  enqueue<TPayload>(type: string, payload: TPayload): Promise<OutboxEntry<TPayload>>
  pending(): Promise<OutboxEntry[]>
  /** Sends waiting entries oldest first; stops at the first one that should be retried. */
  flush(send: OutboxSender): Promise<{ sent: number; failed: number }>
  subscribe(listener: () => void): () => void
}

export function createOutbox(
  storage: OutboxStorage,
  now: () => Date = () => new Date(),
  makeId: () => string = () => crypto.randomUUID(),
): Outbox {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  let flushing: Promise<{ sent: number; failed: number }> | null = null

  async function runFlush(send: OutboxSender) {
    let sent = 0
    let failed = 0
    for (const entry of await storage.all()) {
      if (entry.failedReason) continue
      const result = await send(entry)
      if (result.ok) {
        await storage.remove(entry.id)
        sent += 1
        continue
      }
      if (result.retry) {
        await storage.put({ ...entry, attempts: entry.attempts + 1 })
        break
      }
      await storage.put({ ...entry, attempts: entry.attempts + 1, failedReason: result.reason })
      failed += 1
    }
    notify()
    return { sent, failed }
  }

  return {
    async enqueue(type, payload) {
      const entry = { id: makeId(), type, payload, createdAt: now().toISOString(), attempts: 0 }
      await storage.put(entry)
      notify()
      return entry
    },
    pending: () => storage.all(),
    flush(send) {
      // One flush at a time, so the same entry is never sent twice in parallel.
      flushing ??= runFlush(send).finally(() => {
        flushing = null
      })
      return flushing
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

import { describe, expect, it, vi } from 'vitest'
import { createMemoryStorage, createOutbox, type OutboxSender } from './outbox'

function setup() {
  let clock = 0
  let ids = 0
  const outbox = createOutbox(
    createMemoryStorage(),
    () => new Date(Date.UTC(2026, 10, 24, 9, 0, clock++)),
    () => `id-${++ids}`,
  )
  return outbox
}

describe('outbox', () => {
  it('sends entries oldest first and removes them', async () => {
    const outbox = setup()
    await outbox.enqueue('sale.confirm', { invoice: 1 })
    await outbox.enqueue('sale.confirm', { invoice: 2 })
    const order: unknown[] = []
    const send: OutboxSender = async (entry) => {
      order.push(entry.payload)
      return { ok: true }
    }

    expect(await outbox.flush(send)).toEqual({ sent: 2, failed: 0 })
    expect(order).toEqual([{ invoice: 1 }, { invoice: 2 }])
    expect(await outbox.pending()).toHaveLength(0)
  })

  it('stops at a network error and keeps the rest in order', async () => {
    const outbox = setup()
    await outbox.enqueue('sale.confirm', { invoice: 1 })
    await outbox.enqueue('sale.confirm', { invoice: 2 })
    const send = vi
      .fn<OutboxSender>()
      .mockResolvedValue({ ok: false, retry: true, reason: 'offline' })

    expect(await outbox.flush(send)).toEqual({ sent: 0, failed: 0 })
    expect(send).toHaveBeenCalledOnce()
    const [first] = await outbox.pending()
    expect(first?.attempts).toBe(1)
  })

  it('marks a refused entry as failed and moves on', async () => {
    const outbox = setup()
    await outbox.enqueue('sale.confirm', { invoice: 1 })
    await outbox.enqueue('sale.confirm', { invoice: 2 })
    const send = vi
      .fn<OutboxSender>()
      .mockResolvedValueOnce({ ok: false, retry: false, reason: 'out of stock' })
      .mockResolvedValueOnce({ ok: true })

    expect(await outbox.flush(send)).toEqual({ sent: 1, failed: 1 })
    const [left] = await outbox.pending()
    expect(left?.failedReason).toBe('out of stock')
  })

  it('never runs two flushes at once', async () => {
    const outbox = setup()
    await outbox.enqueue('sale.confirm', { invoice: 1 })
    const send = vi.fn<OutboxSender>().mockResolvedValue({ ok: true })

    await Promise.all([outbox.flush(send), outbox.flush(send)])
    expect(send).toHaveBeenCalledOnce()
  })

  it('tells listeners when something is added', async () => {
    const outbox = setup()
    const listener = vi.fn<() => void>()
    outbox.subscribe(listener)
    await outbox.enqueue('sale.confirm', {})
    expect(listener).toHaveBeenCalled()
  })
})

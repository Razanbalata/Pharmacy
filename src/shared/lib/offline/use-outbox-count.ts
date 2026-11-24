import { useEffect, useState } from 'react'
import type { Outbox } from './outbox'

/** How many entries are waiting, kept up to date. */
export function useOutboxCount(outbox: Outbox): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void outbox.pending().then((entries) => {
        if (active) setCount(entries.length)
      })
    }
    refresh()
    const unsubscribe = outbox.subscribe(refresh)
    return () => {
      active = false
      unsubscribe()
    }
  }, [outbox])

  return count
}

import { createMemoryStorage, createOutbox } from './outbox'

export { createMemoryStorage, createOutbox } from './outbox'
export type { Outbox, OutboxEntry, OutboxSender, OutboxStorage, SendResult } from './outbox'
export { useOnlineStatus } from './online-status'
export { useOutboxCount } from './use-outbox-count'

/** The app's single outbox. Swap the storage for IndexedDB when offline selling is finished. */
export const outbox = createOutbox(createMemoryStorage())

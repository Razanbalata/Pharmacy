export const ACTIVITY_KINDS = ['sale', 'sensitive', 'stock', 'settings', 'login'] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const ACTIVITY_EVENTS = [
  'discount',
  'settingsChanged',
  'bulkEdit',
  'damage',
  'returnApproved',
  'countStarted',
  'login',
  'shiftOpened',
  'staffAdded',
  'staffStopped',
] as const
export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number]

/**
 * One line in the log. The server sends a code and values, not a sentence,
 * so the line reads right in Arabic and English.
 */
export interface ActivityEntry {
  id: number
  at: string
  actor: { id: number; name: string }
  kind: ActivityKind
  event: ActivityEvent
  params: Record<string, string | number>
  /** Short extra line under the sentence, as the server wrote it. */
  detail: string | null
}

export type ActivityPeriod = 'today' | 'week' | 'month'

export interface ActivityFilters {
  period: ActivityPeriod
  actorId: number | null
  kind: ActivityKind | null
  sensitiveOnly: boolean
  search: string
}

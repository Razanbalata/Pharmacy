import type { ActivityEntry } from '@/entities/activity'
import { db } from './db'

/** Writes a line in the activity log, the way the real server does after each action. */
export function logActivity(entry: Omit<ActivityEntry, 'id' | 'at' | 'actor'>): void {
  db.activity.unshift({
    ...entry,
    id: Math.max(0, ...db.activity.map((item) => item.id)) + 1,
    at: new Date().toISOString(),
    actor: { id: 1, name: 'رزان' },
  })
}

import { http } from '@/shared/api'
import type { ActivityEntry, ActivityFilters } from '../model/types'

export async function listActivity(filters: ActivityFilters): Promise<ActivityEntry[]> {
  const response = await http.get<{ data: ActivityEntry[] }>('/api/activity', {
    query: {
      period: filters.period,
      actor: filters.actorId ?? undefined,
      kind: filters.kind ?? undefined,
      sensitive: filters.sensitiveOnly ? 1 : undefined,
      search: filters.search.trim() || undefined,
    },
  })
  return response.data
}

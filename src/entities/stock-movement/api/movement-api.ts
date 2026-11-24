import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { MovementEntry, MovementFilters, MovementTotals } from '../model/types'

export async function listMovements(
  filters: MovementFilters,
): Promise<{ data: MovementEntry[]; totals: MovementTotals }> {
  return http.get('/api/stock/movements', {
    query: {
      actor: filters.actorId ?? undefined,
      days: filters.days,
      kind: filters.kind ?? undefined,
    },
  })
}

export const movementQueries = {
  all: ['stock-movements'] as const,
  list: (filters: MovementFilters) =>
    queryOptions({
      queryKey: [...movementQueries.all, filters],
      queryFn: () => listMovements(filters),
      placeholderData: keepPreviousData,
    }),
}

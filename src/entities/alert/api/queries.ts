import { queryOptions, useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { AlertSummary } from '../model/types'

async function getAlertSummary(): Promise<AlertSummary> {
  const response = await http.get<{ data: AlertSummary }>('/api/alerts/summary')
  return response.data
}

export const alertQueries = {
  all: ['alerts'] as const,
  summary: () =>
    queryOptions({
      queryKey: [...alertQueries.all, 'summary'],
      queryFn: getAlertSummary,
      // New alerts appear without a reload.
      refetchInterval: 60_000,
    }),
}

export function useAlertSummary() {
  return useQuery(alertQueries.summary())
}

import { queryOptions, useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { AlertList, AlertSummary } from '../model/types'

async function getAlertSummary(): Promise<AlertSummary> {
  const response = await http.get<{ data: AlertSummary }>('/api/alerts/summary')
  return response.data
}

export async function listAlerts(): Promise<AlertList> {
  return http.get<AlertList>('/api/alerts')
}

export async function markAlertRead(id: string): Promise<void> {
  await http.post(`/api/alerts/${encodeURIComponent(id)}/read`)
}

export async function markAllAlertsRead(): Promise<void> {
  await http.post('/api/alerts/read-all')
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
  list: () => queryOptions({ queryKey: [...alertQueries.all, 'list'], queryFn: listAlerts }),
}

export function useAlertSummary() {
  return useQuery(alertQueries.summary())
}

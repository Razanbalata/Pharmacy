import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Dashboard, TrendDays, TrendPoint } from '../model/types'

export const dashboardQueries = {
  all: ['dashboard'] as const,
  summary: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all, 'summary'],
      queryFn: async () => (await http.get<{ data: Dashboard }>('/api/dashboard')).data,
      refetchInterval: 60_000,
    }),
  trend: (days: TrendDays) =>
    queryOptions({
      queryKey: [...dashboardQueries.all, 'trend', days],
      queryFn: async () =>
        (await http.get<{ data: TrendPoint[] }>('/api/dashboard/sales', { query: { days } })).data,
      placeholderData: keepPreviousData,
    }),
}

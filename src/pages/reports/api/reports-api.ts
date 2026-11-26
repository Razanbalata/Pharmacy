import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  DebtsReport,
  ProfitReport,
  ReportPeriod,
  SalesReport,
  StockReport,
} from '../model/types'

const get = async <T>(path: string, period?: ReportPeriod) =>
  (await http.get<{ data: T }>(path, period ? { query: { period } } : {})).data

export const reportQueries = {
  all: ['reports'] as const,
  sales: (period: ReportPeriod) =>
    queryOptions({
      queryKey: [...reportQueries.all, 'sales', period],
      queryFn: () => get<SalesReport>('/api/reports/sales', period),
      placeholderData: keepPreviousData,
    }),
  profit: (period: ReportPeriod) =>
    queryOptions({
      queryKey: [...reportQueries.all, 'profit', period],
      queryFn: () => get<ProfitReport>('/api/reports/profit', period),
      placeholderData: keepPreviousData,
    }),
  stock: () =>
    queryOptions({
      queryKey: [...reportQueries.all, 'stock'],
      queryFn: () => get<StockReport>('/api/reports/stock'),
    }),
  debts: () =>
    queryOptions({
      queryKey: [...reportQueries.all, 'debts'],
      queryFn: () => get<DebtsReport>('/api/reports/debts'),
    }),
}

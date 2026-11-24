import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { CountLineInput, CountSummary, StockCount } from '../model/types'

export async function listCounts(): Promise<CountSummary[]> {
  return (await http.get<{ data: CountSummary[] }>('/api/stock/counts')).data
}

export async function getCount(id: number): Promise<StockCount> {
  return (await http.get<{ data: StockCount }>(`/api/stock/counts/${id}`)).data
}

/** Only one count can be open; the server answers 409 if there is one. */
export async function startCount(categoryId: number | null): Promise<StockCount> {
  return (await http.post<{ data: StockCount }>('/api/stock/counts', { categoryId })).data
}

export async function saveCountLines(id: number, lines: CountLineInput[]): Promise<StockCount> {
  return (await http.put<{ data: StockCount }>(`/api/stock/counts/${id}/lines`, { lines })).data
}

/** Adjusts stock for every difference. Every difference needs a reason first. */
export async function approveCount(id: number): Promise<StockCount> {
  return (await http.post<{ data: StockCount }>(`/api/stock/counts/${id}/approve`)).data
}

export const countQueries = {
  all: ['stock-counts'] as const,
  list: () => queryOptions({ queryKey: [...countQueries.all, 'list'], queryFn: listCounts }),
  detail: (id: number) =>
    queryOptions({ queryKey: [...countQueries.all, 'detail', id], queryFn: () => getCount(id) }),
}

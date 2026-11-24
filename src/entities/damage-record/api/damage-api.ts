import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { DamageInput, DamageRecord, DamageSummary } from '../model/types'

/** This month's records, newest first, with the month's totals. */
export async function listDamage(): Promise<{ data: DamageRecord[]; summary: DamageSummary }> {
  return http.get('/api/stock/damage')
}

export async function recordDamage(input: DamageInput): Promise<DamageRecord> {
  return (await http.post<{ data: DamageRecord }>('/api/stock/damage', input)).data
}

/** Writes off every expired batch still in stock, reason "expired". */
export async function recordExpired(): Promise<{ count: number; loss: number }> {
  return (await http.post<{ data: { count: number; loss: number } }>('/api/stock/damage/expired'))
    .data
}

export const damageQueries = {
  all: ['damage'] as const,
  list: () => queryOptions({ queryKey: [...damageQueries.all, 'list'], queryFn: listDamage }),
}

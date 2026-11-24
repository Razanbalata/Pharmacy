import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { SupplierOption } from '../model/types'

export async function listSupplierOptions(): Promise<SupplierOption[]> {
  return (await http.get<{ data: SupplierOption[] }>('/api/suppliers/options')).data
}

export const supplierQueries = {
  all: ['suppliers'] as const,
  options: () =>
    queryOptions({
      queryKey: [...supplierQueries.all, 'options'],
      queryFn: listSupplierOptions,
      staleTime: 5 * 60_000,
    }),
}

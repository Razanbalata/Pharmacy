import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { CustomerOption } from '../model/types'

export async function searchCustomers(search: string): Promise<CustomerOption[]> {
  return (
    await http.get<{ data: CustomerOption[] }>('/api/customers/options', { query: { search } })
  ).data
}

export const customerQueries = {
  all: ['customers'] as const,
  options: (search: string) =>
    queryOptions({
      queryKey: [...customerQueries.all, 'options', search],
      queryFn: () => searchCustomers(search),
    }),
}

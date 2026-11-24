import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { ProductFilters } from '../model/types'
import { getProduct, listProducts, searchCatalog } from './product-api'

export const productQueries = {
  all: ['products'] as const,
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: [...productQueries.all, 'list', filters],
      queryFn: () => listProducts(filters),
      placeholderData: keepPreviousData,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...productQueries.all, 'detail', id],
      queryFn: () => getProduct(id),
    }),
  catalog: (search: string) =>
    queryOptions({
      queryKey: [...productQueries.all, 'catalog', search],
      queryFn: () => searchCatalog(search),
      enabled: search.trim().length >= 2,
      staleTime: 5 * 60_000,
    }),
}

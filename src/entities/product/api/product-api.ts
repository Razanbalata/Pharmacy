import { http } from '@/shared/api'
import { env } from '@/shared/config'
import type {
  BulkChanges,
  CatalogEntry,
  Product,
  ProductDetail,
  ProductFilters,
  ProductInput,
  ProductPage,
} from '../model/types'

export async function listProducts(filters: ProductFilters): Promise<ProductPage> {
  return http.get<ProductPage>('/api/products', {
    query: {
      tab: filters.tab === 'all' ? undefined : filters.tab,
      category: filters.categoryId ?? undefined,
      ingredient: filters.ingredientId ?? undefined,
      supplier: filters.supplierId ?? undefined,
      sort: filters.sort,
      search: filters.search.trim() || undefined,
      page: filters.page,
      perPage: filters.perPage,
    },
  })
}

export async function getProduct(id: number): Promise<ProductDetail> {
  return (await http.get<{ data: ProductDetail }>(`/api/products/${id}`)).data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return (await http.post<{ data: Product }>('/api/products', input)).data
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  return (await http.put<{ data: Product }>(`/api/products/${id}`, input)).data
}

export async function bulkUpdateProducts(ids: number[], changes: BulkChanges): Promise<void> {
  await http.post('/api/products/bulk', { ids, changes })
}

/** Gives a product with no barcode an internal one and saves it on the product. */
export async function generateBarcode(id: number): Promise<{ barcode: string }> {
  return (await http.post<{ data: { barcode: string } }>(`/api/products/${id}/barcode`)).data
}

export async function searchCatalog(search: string): Promise<CatalogEntry[]> {
  return (await http.get<{ data: CatalogEntry[] }>('/api/catalog', { query: { search } })).data
}

/** A spreadsheet of the given products, or of every product when none are given. */
export function productsExportUrl(ids: number[] = []): string {
  const url = new URL('/api/products/export', env.VITE_API_URL)
  if (ids.length > 0) url.searchParams.set('ids', ids.join(','))
  return url.toString()
}

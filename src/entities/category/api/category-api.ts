import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Category, CategoryInput } from '../model/types'

export async function listCategories(): Promise<Category[]> {
  return (await http.get<{ data: Category[] }>('/api/categories')).data
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return (await http.post<{ data: Category }>('/api/categories', input)).data
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  return (await http.put<{ data: Category }>(`/api/categories/${id}`, input)).data
}

/** Moves every product of `id` into `targetId`, then removes `id`. */
export async function mergeCategory(id: number, targetId: number): Promise<void> {
  await http.post(`/api/categories/${id}/merge`, { targetId })
}

/** Only an empty category can be deleted; the server answers 409 otherwise. */
export async function deleteCategory(id: number): Promise<void> {
  await http.delete(`/api/categories/${id}`)
}

export const categoryQueries = {
  all: ['categories'] as const,
  list: () => queryOptions({ queryKey: [...categoryQueries.all, 'list'], queryFn: listCategories }),
}

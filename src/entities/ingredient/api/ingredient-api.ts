import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Ingredient, IngredientDuplicate, IngredientInput } from '../model/types'

export async function listIngredients(): Promise<Ingredient[]> {
  return (await http.get<{ data: Ingredient[] }>('/api/ingredients')).data
}

export async function listIngredientDuplicates(): Promise<IngredientDuplicate[]> {
  return (await http.get<{ data: IngredientDuplicate[] }>('/api/ingredients/duplicates')).data
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  return (await http.post<{ data: Ingredient }>('/api/ingredients', input)).data
}

export async function updateIngredient(id: number, input: IngredientInput): Promise<Ingredient> {
  return (await http.put<{ data: Ingredient }>(`/api/ingredients/${id}`, input)).data
}

/** Moves every product of `id` to `targetId` and removes `id`. */
export async function mergeIngredient(id: number, targetId: number): Promise<void> {
  await http.post(`/api/ingredients/${id}/merge`, { targetId })
}

export const ingredientQueries = {
  all: ['ingredients'] as const,
  list: () =>
    queryOptions({ queryKey: [...ingredientQueries.all, 'list'], queryFn: listIngredients }),
  duplicates: () =>
    queryOptions({
      queryKey: [...ingredientQueries.all, 'duplicates'],
      queryFn: listIngredientDuplicates,
    }),
}

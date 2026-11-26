import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Analysis } from '../model/types'

/** Same key as before the move, under "assistant", so a fresh chat answer can refresh it. */
export const analysisQuery = (language: string) =>
  queryOptions({
    queryKey: ['assistant', 'analysis', language],
    queryFn: async () =>
      (await http.get<{ data: Analysis }>('/api/assistant/analysis', { query: { language } })).data,
  })

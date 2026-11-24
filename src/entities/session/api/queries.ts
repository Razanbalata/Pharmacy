import { queryOptions, useQuery } from '@tanstack/react-query'
import { getCurrentUser } from './session-api'

export const sessionQueries = {
  all: ['session'] as const,
  me: () =>
    queryOptions({
      queryKey: [...sessionQueries.all, 'me'],
      queryFn: getCurrentUser,
      staleTime: 5 * 60_000,
    }),
}

/** The signed-in user, their role and their pharmacy. */
export function useCurrentUser() {
  return useQuery(sessionQueries.me())
}

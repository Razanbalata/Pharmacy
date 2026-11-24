import { queryOptions } from '@tanstack/react-query'
import type { JoinRequestStatus } from '../model/types'
import { getActivation, listJoinRequests } from './join-request-api'

export const joinRequestQueries = {
  all: ['join-requests'] as const,
  list: (status: JoinRequestStatus | 'all') =>
    queryOptions({
      queryKey: [...joinRequestQueries.all, 'list', status],
      queryFn: () => listJoinRequests(status),
    }),
  activation: (token: string) =>
    queryOptions({
      queryKey: ['activation', token],
      queryFn: () => getActivation(token),
      retry: false,
    }),
}

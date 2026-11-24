import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { ActivityFilters } from '../model/types'
import { listActivity } from './activity-api'

export const activityQueries = {
  all: ['activity'] as const,
  list: (filters: ActivityFilters) =>
    queryOptions({
      queryKey: [...activityQueries.all, filters],
      queryFn: () => listActivity(filters),
      // Keep the old lines on screen while a new filter loads, instead of flashing empty.
      placeholderData: keepPreviousData,
    }),
}

import { queryOptions } from '@tanstack/react-query'
import { listStaff } from './staff-api'

export const staffQueries = {
  all: ['staff'] as const,
  list: () => queryOptions({ queryKey: [...staffQueries.all, 'list'], queryFn: listStaff }),
}

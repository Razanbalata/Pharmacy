import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { PharmacyDetail, PharmacyFilter, PharmacyList, Plan } from '../model/types'

export interface PharmacyQuery {
  filter: PharmacyFilter
  city: string | null
  search: string
}

const base = '/api/platform/pharmacies'

export async function extendTrial(id: number, days: 7 | 14): Promise<PharmacyDetail> {
  return (await http.post<{ data: PharmacyDetail }>(`${base}/${id}/extend-trial`, { days })).data
}

/** Sets the plan by hand, for a payment made outside the app. */
export async function changePlan(
  id: number,
  plan: Exclude<Plan, 'trial'>,
  months: number,
): Promise<PharmacyDetail> {
  return (await http.post<{ data: PharmacyDetail }>(`${base}/${id}/plan`, { plan, months })).data
}

/** Read-only from then on; nothing is deleted. */
export async function suspendPharmacy(id: number, reason: string): Promise<PharmacyDetail> {
  return (await http.post<{ data: PharmacyDetail }>(`${base}/${id}/suspend`, { reason })).data
}

export async function resumePharmacy(id: number): Promise<PharmacyDetail> {
  return (await http.post<{ data: PharmacyDetail }>(`${base}/${id}/resume`)).data
}

/** Asks the owner to let support in; it is logged in the pharmacy's activity log. */
export async function requestSupportAccess(id: number): Promise<PharmacyDetail> {
  return (await http.post<{ data: PharmacyDetail }>(`${base}/${id}/support-access`)).data
}

export const platformPharmacyQueries = {
  all: ['platform-pharmacies'] as const,
  list: (query: PharmacyQuery) =>
    queryOptions({
      queryKey: [...platformPharmacyQueries.all, 'list', query],
      queryFn: () =>
        http.get<PharmacyList>(base, {
          query: {
            filter: query.filter,
            city: query.city ?? undefined,
            search: query.search || undefined,
          },
        }),
      placeholderData: keepPreviousData,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...platformPharmacyQueries.all, 'detail', id],
      queryFn: async () => (await http.get<{ data: PharmacyDetail }>(`${base}/${id}`)).data,
    }),
}

import { queryOptions } from '@tanstack/react-query'
import { getCities, getOnboarding, getPharmacyProfile } from './pharmacy-api'
import { getSettings } from './settings-api'

export const pharmacyQueries = {
  all: ['pharmacy'] as const,
  profile: () =>
    queryOptions({ queryKey: [...pharmacyQueries.all, 'profile'], queryFn: getPharmacyProfile }),
  cities: () =>
    queryOptions({ queryKey: ['cities'], queryFn: getCities, staleTime: Number.POSITIVE_INFINITY }),
  settings: () =>
    queryOptions({ queryKey: [...pharmacyQueries.all, 'settings'], queryFn: getSettings }),
  onboarding: () =>
    queryOptions({ queryKey: [...pharmacyQueries.all, 'onboarding'], queryFn: getOnboarding }),
}

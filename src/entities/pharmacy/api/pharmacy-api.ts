import { http } from '@/shared/api'
import type {
  OnboardingStatus,
  PharmacyProfile,
  PharmacyProfileInput,
  StartMethod,
} from '../model/types'

export async function getPharmacyProfile(): Promise<PharmacyProfile> {
  const response = await http.get<{ data: PharmacyProfile }>('/api/pharmacy')
  return response.data
}

export async function updatePharmacyProfile(input: PharmacyProfileInput): Promise<PharmacyProfile> {
  const response = await http.put<{ data: PharmacyProfile }>('/api/pharmacy', input)
  return response.data
}

/** Logo for receipts and invoices. Saved right away, apart from the settings form. */
export async function uploadPharmacyLogo(file: File): Promise<PharmacyProfile> {
  const body = new FormData()
  body.append('logo', file)
  const response = await http.post<{ data: PharmacyProfile }>('/api/pharmacy/logo', body)
  return response.data
}

export async function getCities(): Promise<string[]> {
  const response = await http.get<{ data: string[] }>('/api/cities')
  return response.data
}

export function chooseStartMethod(method: StartMethod): Promise<void> {
  return http.post<void>('/api/onboarding/start', { method })
}

export async function getOnboarding(): Promise<OnboardingStatus> {
  const response = await http.get<{ data: OnboardingStatus }>('/api/onboarding')
  return response.data
}

export function dismissOnboarding(): Promise<void> {
  return http.post<void>('/api/onboarding/dismiss')
}

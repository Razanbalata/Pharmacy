import { env } from '@/shared/config'
import { http } from '@/shared/api'
import type { PharmacySettings, PharmacySettingsInput } from '../model/settings'

export async function getSettings(): Promise<PharmacySettings> {
  return (await http.get<{ data: PharmacySettings }>('/api/settings')).data
}

export async function updateSettings(input: PharmacySettingsInput): Promise<PharmacySettings> {
  return (await http.put<{ data: PharmacySettings }>('/api/settings', input)).data
}

/** A plain link: the browser downloads the file with the session cookie. */
export const backupDownloadUrl = new URL('/api/backup/export', env.VITE_API_URL).toString()

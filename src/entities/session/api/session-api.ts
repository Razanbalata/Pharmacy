import { http } from '@/shared/api'
import type { CurrentUser } from '../model/types'

/** Laravel API resources wrap the object in "data". */
interface MeResponse {
  data: CurrentUser
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await http.get<MeResponse>('/api/me')
  return response.data
}

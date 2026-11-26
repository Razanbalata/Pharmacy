import { http } from '@/shared/api'
import type {
  ActivationInfo,
  JoinRequest,
  JoinRequestInput,
  JoinRequestStatus,
} from '../model/types'

/** Public: the join form. Sends a multipart form when a licence photo is attached. */
export async function submitJoinRequest(
  input: JoinRequestInput,
): Promise<Pick<JoinRequest, 'reference'>> {
  const response = await http.post<{ data: Pick<JoinRequest, 'reference'> }>(
    '/api/join-requests',
    input,
  )
  return response.data
}

/** Public: what the activation link is for. 410 when it expired, 404 when unknown. */
export async function getActivation(token: string): Promise<ActivationInfo> {
  const response = await http.get<{ data: ActivationInfo }>(
    `/api/activation/${encodeURIComponent(token)}`,
  )
  return response.data
}

export function resendActivation(token: string): Promise<void> {
  return http.post<void>(`/api/activation/${encodeURIComponent(token)}/resend`)
}

/** Sets the owner's password; the server signs her in. */
export function activateAccount(
  token: string,
  input: { password: string; email?: string },
): Promise<void> {
  return http.post<void>(`/api/activation/${encodeURIComponent(token)}`, input)
}

/** Platform owner: the requests waiting for a decision. */
export async function listJoinRequests(status: JoinRequestStatus | 'all'): Promise<JoinRequest[]> {
  const response = await http.get<{ data: JoinRequest[] }>('/api/platform/join-requests', {
    query: { status: status === 'all' ? undefined : status },
  })
  return response.data
}

export async function approveJoinRequest(id: number): Promise<JoinRequest> {
  const response = await http.post<{ data: JoinRequest }>(
    `/api/platform/join-requests/${id}/approve`,
  )
  return response.data
}

export async function rejectJoinRequest(id: number, reason: string): Promise<JoinRequest> {
  const response = await http.post<{ data: JoinRequest }>(
    `/api/platform/join-requests/${id}/reject`,
    {
      reason,
    },
  )
  return response.data
}

/** Platform owner adds a pharmacy by hand (e.g. after a phone call); it is approved at once. */
export async function addPharmacyManually(input: JoinRequestInput): Promise<JoinRequest> {
  const response = await http.post<{ data: JoinRequest }>('/api/platform/join-requests', input)
  return response.data
}

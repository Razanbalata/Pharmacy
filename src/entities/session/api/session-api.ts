import { http } from '@/shared/api'
import type { SessionUser } from '../model/types'

/** Laravel API resources wrap the object in "data". */
interface UserResponse {
  data: SessionUser
}

export async function getCurrentUser(): Promise<SessionUser> {
  const response = await http.get<UserResponse>('/api/me')
  return response.data
}

export interface LoginInput {
  /** Phone or email. */
  login: string
  password: string
  remember: boolean
}

export async function login(input: LoginInput): Promise<SessionUser> {
  const response = await http.post<UserResponse>('/api/login', input)
  return response.data
}

export function logout(): Promise<void> {
  return http.post<void>('/api/logout')
}

export interface ResetCodeSent {
  /** Last three digits of the number the code went to. */
  last: string
  resendInSeconds: number
}

export async function requestResetCode(input: {
  login: string
  channel: 'whatsapp' | 'sms'
}): Promise<ResetCodeSent> {
  const response = await http.post<{ data: ResetCodeSent }>('/api/password/otp', input)
  return response.data
}

export async function verifyResetCode(input: { login: string; code: string }): Promise<string> {
  const response = await http.post<{ data: { resetToken: string } }>('/api/password/verify', input)
  return response.data.resetToken
}

/** Also signs the account out on every other device. */
export function resetPassword(input: { resetToken: string; password: string }): Promise<void> {
  return http.post<void>('/api/password/reset', input)
}

import { http } from '@/shared/api'
import type { StaffInput, StaffMember, TemporaryPassword } from '../model/types'

export async function listStaff(): Promise<StaffMember[]> {
  return (await http.get<{ data: StaffMember[] }>('/api/staff')).data
}

export async function createStaff(input: StaffInput): Promise<StaffMember & TemporaryPassword> {
  return (await http.post<{ data: StaffMember & TemporaryPassword }>('/api/staff', input)).data
}

export async function updateStaff(id: number, input: StaffInput): Promise<StaffMember> {
  return (await http.put<{ data: StaffMember }>(`/api/staff/${id}`, input)).data
}

export async function setStaffActive(id: number, active: boolean): Promise<StaffMember> {
  return (await http.patch<{ data: StaffMember }>(`/api/staff/${id}/status`, { active })).data
}

export async function resetStaffPassword(id: number): Promise<TemporaryPassword> {
  return (await http.post<{ data: TemporaryPassword }>(`/api/staff/${id}/reset-password`)).data
}

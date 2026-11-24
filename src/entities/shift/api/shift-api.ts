import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  ClosedShift,
  CloseShiftInput,
  CurrentShift,
  Shift,
  ShiftSummary,
} from '../model/types'

export async function getCurrentShift(): Promise<CurrentShift> {
  return (await http.get<{ data: CurrentShift }>('/api/shifts/current')).data
}

/** Refused (409) while another shift is open. */
export async function openShift(openingCash: number): Promise<Shift> {
  return (await http.post<{ data: Shift }>('/api/shifts', { openingCash })).data
}

export async function getShiftSummary(): Promise<ShiftSummary> {
  return (await http.get<{ data: ShiftSummary }>('/api/shifts/current/summary')).data
}

/** Refused (409) while invoices are held; a difference needs a note (422). */
export async function closeShift(input: CloseShiftInput): Promise<ClosedShift> {
  return (await http.post<{ data: ClosedShift }>('/api/shifts/current/close', input)).data
}

export const shiftQueries = {
  all: ['shift'] as const,
  current: () =>
    queryOptions({ queryKey: [...shiftQueries.all, 'current'], queryFn: getCurrentShift }),
  summary: () =>
    queryOptions({ queryKey: [...shiftQueries.all, 'summary'], queryFn: getShiftSummary }),
}

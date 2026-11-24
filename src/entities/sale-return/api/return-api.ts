import { http } from '@/shared/api'
import type { ReturnInput, SaleReturn } from '../model/types'

/** Refused (422) past the return period, or for more than was sold minus returned before. */
export async function createReturn(input: ReturnInput): Promise<SaleReturn> {
  return (await http.post<{ data: SaleReturn }>('/api/returns', input)).data
}

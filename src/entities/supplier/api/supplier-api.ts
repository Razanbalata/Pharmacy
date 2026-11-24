import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  OpenInvoice,
  StatementPeriod,
  Supplier,
  SupplierInput,
  SupplierOption,
  SupplierPaymentInput,
  SuppliersSummary,
  SupplierStatement,
} from '../model/types'

export async function listSupplierOptions(): Promise<SupplierOption[]> {
  return (await http.get<{ data: SupplierOption[] }>('/api/suppliers/options')).data
}

export async function listSuppliers(): Promise<{ data: Supplier[]; summary: SuppliersSummary }> {
  return http.get<{ data: Supplier[]; summary: SuppliersSummary }>('/api/suppliers')
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  return (await http.post<{ data: Supplier }>('/api/suppliers', input)).data
}

export async function updateSupplier(id: number, input: SupplierInput): Promise<Supplier> {
  return (await http.put<{ data: Supplier }>(`/api/suppliers/${id}`, input)).data
}

export async function getStatement(
  id: number,
  period: StatementPeriod,
): Promise<SupplierStatement> {
  return (
    await http.get<{ data: SupplierStatement }>(`/api/suppliers/${id}/statement`, {
      query: { period },
    })
  ).data
}

export async function listOpenInvoices(id: number): Promise<OpenInvoice[]> {
  return (await http.get<{ data: OpenInvoice[] }>(`/api/suppliers/${id}/open-invoices`)).data
}

/** Returns the payment's receipt number, for the printed voucher. */
export async function recordSupplierPayment(
  id: number,
  input: SupplierPaymentInput,
): Promise<{ receipt: string; balance: number }> {
  return (
    await http.post<{ data: { receipt: string; balance: number } }>(
      `/api/suppliers/${id}/payments`,
      input,
    )
  ).data
}

export const supplierQueries = {
  all: ['suppliers'] as const,
  options: () =>
    queryOptions({
      queryKey: [...supplierQueries.all, 'options'],
      queryFn: listSupplierOptions,
      staleTime: 5 * 60_000,
    }),
  list: () => queryOptions({ queryKey: [...supplierQueries.all, 'list'], queryFn: listSuppliers }),
  statement: (id: number, period: StatementPeriod) =>
    queryOptions({
      queryKey: [...supplierQueries.all, 'statement', id, period],
      queryFn: () => getStatement(id, period),
      placeholderData: keepPreviousData,
    }),
  openInvoices: (id: number) =>
    queryOptions({
      queryKey: [...supplierQueries.all, 'open-invoices', id],
      queryFn: () => listOpenInvoices(id),
    }),
}

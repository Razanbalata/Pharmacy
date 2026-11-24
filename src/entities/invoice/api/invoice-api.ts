import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  HeldSale,
  HoldInput,
  Invoice,
  InvoiceFilters,
  InvoicePage,
  SaleInput,
} from '../model/types'

export async function createSale(input: SaleInput): Promise<Invoice> {
  return (await http.post<{ data: Invoice }>('/api/sales', input)).data
}

export async function listInvoices(filters: InvoiceFilters): Promise<InvoicePage> {
  return http.get<InvoicePage>('/api/invoices', {
    query: {
      period: filters.period,
      cashier: filters.cashierId ?? undefined,
      method: filters.method ?? undefined,
      status: filters.status ?? undefined,
      search: filters.search.trim() || undefined,
      page: filters.page,
    },
  })
}

export async function getInvoice(id: number): Promise<Invoice> {
  return (await http.get<{ data: Invoice }>(`/api/invoices/${id}`)).data
}

/** By the number on the receipt, e.g. INV-000241 or just 241. */
export async function findInvoice(number: string): Promise<Invoice> {
  return (await http.get<{ data: Invoice }>('/api/invoices/lookup', { query: { number } })).data
}

export async function listHeld(): Promise<HeldSale[]> {
  return (await http.get<{ data: HeldSale[] }>('/api/sales/held')).data
}

export async function holdSale(input: HoldInput): Promise<HeldSale> {
  return (await http.post<{ data: HeldSale }>('/api/sales/held', input)).data
}

export async function deleteHeld(id: number): Promise<void> {
  await http.delete(`/api/sales/held/${id}`)
}

export const invoiceQueries = {
  all: ['invoices'] as const,
  list: (filters: InvoiceFilters) =>
    queryOptions({
      queryKey: [...invoiceQueries.all, 'list', filters],
      queryFn: () => listInvoices(filters),
      placeholderData: keepPreviousData,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...invoiceQueries.all, 'detail', id],
      queryFn: () => getInvoice(id),
    }),
  held: () => queryOptions({ queryKey: [...invoiceQueries.all, 'held'], queryFn: listHeld }),
}

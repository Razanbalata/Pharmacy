import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  OrderFilters,
  OrderInput,
  OrderSummary,
  PurchaseOrder,
  ReceiveInput,
  ReceiveResult,
  Suggestion,
} from '../model/types'

export async function listOrders(filters: OrderFilters): Promise<OrderSummary[]> {
  return (
    await http.get<{ data: OrderSummary[] }>('/api/purchases', {
      query: {
        supplier: filters.supplierId ?? undefined,
        status: filters.status ?? undefined,
        payment: filters.payment ?? undefined,
        days: filters.days,
      },
    })
  ).data
}

export async function getOrder(id: number): Promise<PurchaseOrder> {
  return (await http.get<{ data: PurchaseOrder }>(`/api/purchases/${id}`)).data
}

export async function createOrder(input: OrderInput): Promise<PurchaseOrder> {
  return (await http.post<{ data: PurchaseOrder }>('/api/purchases', input)).data
}

/** Only a draft can change; a sent order is changed by receiving less or cancelling. */
export async function updateOrder(id: number, input: OrderInput): Promise<PurchaseOrder> {
  return (await http.put<{ data: PurchaseOrder }>(`/api/purchases/${id}`, input)).data
}

export async function markOrderSent(id: number): Promise<PurchaseOrder> {
  return (await http.post<{ data: PurchaseOrder }>(`/api/purchases/${id}/send`)).data
}

export async function cancelOrder(id: number): Promise<void> {
  await http.post(`/api/purchases/${id}/cancel`)
}

export async function listSuggestions(): Promise<Suggestion[]> {
  return (await http.get<{ data: Suggestion[] }>('/api/purchases/suggestions')).data
}

/** Makes one draft per supplier from the suggestions. Returns the drafts made. */
export async function createSuggestedDrafts(supplierIds: number[]): Promise<OrderSummary[]> {
  return (await http.post<{ data: OrderSummary[] }>('/api/purchases/suggestions', { supplierIds }))
    .data
}

export async function receiveOrder(id: number, input: ReceiveInput): Promise<ReceiveResult> {
  return (await http.post<{ data: ReceiveResult }>(`/api/purchases/${id}/receive`, input)).data
}

export const purchaseQueries = {
  all: ['purchases'] as const,
  list: (filters: OrderFilters) =>
    queryOptions({
      queryKey: [...purchaseQueries.all, 'list', filters],
      queryFn: () => listOrders(filters),
      placeholderData: keepPreviousData,
    }),
  detail: (id: number) =>
    queryOptions({ queryKey: [...purchaseQueries.all, 'detail', id], queryFn: () => getOrder(id) }),
  suggestions: () =>
    queryOptions({
      queryKey: [...purchaseQueries.all, 'suggestions'],
      queryFn: listSuggestions,
    }),
}

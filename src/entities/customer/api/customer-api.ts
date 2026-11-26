import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type {
  Customer,
  CustomerFilter,
  CustomerInput,
  CustomerOption,
  CustomerPaymentInput,
  CustomerPaymentResult,
  CustomersSummary,
  CustomerStatement,
  CustomerStatementPeriod,
} from '../model/types'

export async function searchCustomers(search: string): Promise<CustomerOption[]> {
  return (
    await http.get<{ data: CustomerOption[] }>('/api/customers/options', { query: { search } })
  ).data
}

export interface CustomerList {
  data: Customer[]
  summary: CustomersSummary
}

export async function listCustomers(filter: CustomerFilter, search: string): Promise<CustomerList> {
  return http.get<CustomerList>('/api/customers', { query: { filter, search } })
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  return (await http.post<{ data: Customer }>('/api/customers', input)).data
}

export async function updateCustomer(
  id: number,
  input: Omit<CustomerInput, 'openingDebt'>,
): Promise<Customer> {
  return (await http.put<{ data: Customer }>(`/api/customers/${id}`, input)).data
}

export async function getCustomerStatement(
  id: number,
  period: CustomerStatementPeriod,
): Promise<CustomerStatement> {
  return (
    await http.get<{ data: CustomerStatement }>(`/api/customers/${id}/statement`, {
      query: { period },
    })
  ).data
}

export async function recordCustomerPayment(
  id: number,
  input: CustomerPaymentInput,
): Promise<CustomerPaymentResult> {
  return (await http.post<{ data: CustomerPaymentResult }>(`/api/customers/${id}/payments`, input))
    .data
}

export const customerQueries = {
  all: ['customers'] as const,
  options: (search: string) =>
    queryOptions({
      queryKey: [...customerQueries.all, 'options', search],
      queryFn: () => searchCustomers(search),
    }),
  list: (filter: CustomerFilter, search: string) =>
    queryOptions({
      queryKey: [...customerQueries.all, 'list', filter, search],
      queryFn: () => listCustomers(filter, search),
      placeholderData: keepPreviousData,
    }),
  statement: (id: number, period: CustomerStatementPeriod) =>
    queryOptions({
      queryKey: [...customerQueries.all, 'statement', id, period],
      queryFn: () => getCustomerStatement(id, period),
      placeholderData: keepPreviousData,
    }),
}

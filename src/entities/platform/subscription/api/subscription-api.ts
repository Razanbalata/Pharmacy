import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Billing, PaidPlan, SubscriptionPayment } from '../model/types'

export async function setPlanPrice(plan: PaidPlan, price: number): Promise<void> {
  await http.put(`/api/platform/plans/${plan}`, { price })
}

/** Confirms the payment and starts (or extends) the pharmacy's plan. */
export async function confirmPayment(id: number): Promise<SubscriptionPayment> {
  return (await http.post<{ data: SubscriptionPayment }>(`/api/platform/payments/${id}/confirm`))
    .data
}

export async function rejectPayment(id: number, reason: string): Promise<SubscriptionPayment> {
  return (
    await http.post<{ data: SubscriptionPayment }>(`/api/platform/payments/${id}/reject`, {
      reason,
    })
  ).data
}

export const subscriptionQueries = {
  all: ['subscriptions'] as const,
  billing: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all, 'billing'],
      queryFn: async () => (await http.get<{ data: Billing }>('/api/platform/billing')).data,
    }),
}

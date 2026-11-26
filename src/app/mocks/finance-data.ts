import type { Expense } from '@/entities/expense'

/** The pharmacy's running costs, this month and last, as in the design. */
export function initialFinance() {
  let next = 0
  const expense = (
    date: string,
    category: Expense['category'],
    amount: number,
    actor: string,
    extra: Partial<Expense> = {},
  ): Expense => {
    next += 1
    return {
      id: next,
      date,
      category,
      amount,
      source: 'outside',
      shiftNumber: null,
      actor,
      note: '',
      monthly: false,
      ...extra,
    }
  }
  const monthly = { monthly: true }
  const drawer = (shiftNumber: number) => ({ source: 'drawer' as const, shiftNumber })

  const expenses: Expense[] = [
    expense('2026-10-01', 'rent', 1500, 'رزان', monthly),
    expense('2026-10-01', 'generatorSubscription', 600, 'رزان', monthly),
    expense('2026-10-01', 'internet', 120, 'رزان', monthly),
    expense('2026-10-09', 'generatorFuel', 250, 'محمد'),
    expense('2026-10-23', 'generatorFuel', 250, 'محمد'),
    expense('2026-10-17', 'maintenance', 250, 'رزان', { note: 'تصليح المكيف' }),
    expense('2026-10-14', 'supplies', 150, 'سارة'),
    expense('2026-11-01', 'rent', 1500, 'رزان', monthly),
    expense('2026-11-01', 'generatorSubscription', 600, 'رزان', monthly),
    expense('2026-11-01', 'internet', 120, 'رزان', monthly),
    expense('2026-11-08', 'generatorFuel', 250, 'محمد'),
    expense('2026-11-12', 'transport', 180, 'سارة', { note: 'نقل طلبية النور' }),
    expense('2026-11-15', 'supplies', 200, 'رزان'),
    expense('2026-11-20', 'maintenance', 350, 'رزان', { note: 'تصليح ثلاجة الأدوية' }),
    expense('2026-11-22', 'generatorFuel', 250, 'محمد', { ...drawer(12), note: 'جالون ديزل' }),
  ]
  return { expenses }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { setPlanPrice, subscriptionQueries, type PlanInfo } from '@/entities/platform/subscription'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

/** The price of one plan. Once saved, every pharmacy sees it in its settings. */
export function PlanPriceForm({ plan }: { plan: PlanInfo }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [price, setPrice] = useState(plan.price === null ? '' : String(plan.price))
  const [error, setError] = useState<string | undefined>()
  const name = t(`tenants.plans.${plan.key}`)
  const save = useMutation({
    mutationFn: () => setPlanPrice(plan.key, Number(price)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionQueries.all })
      toast.success(t('billing.priceSaved', { plan: name }))
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!(Number(price) > 0)) setError(t('billing.priceInvalid'))
    else {
      setError(undefined)
      save.mutate()
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex items-end gap-2">
      <Field label={t('billing.price', { per: t(`billing.per.${plan.per}`) })} error={error}>
        {(field) => (
          <Input
            {...field}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            aria-label={`${name}: ${t('billing.price', { per: t(`billing.per.${plan.per}`) })}`}
            className="tabular w-28"
          />
        )}
      </Field>
      <Button type="submit" size="sm" variant="secondary" disabled={save.isPending}>
        {t('billing.savePrice')}
      </Button>
    </form>
  )
}

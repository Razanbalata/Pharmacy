import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryName, categoryQueries } from '@/entities/category'
import { countQueries, startCount } from '@/entities/stock-count'
import { ApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

/** A count covers one category, or the whole pharmacy. Only one can be open at a time. */
export function StartCountForm() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery(categoryQueries.list())
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const start = useMutation({
    mutationFn: () => startCount(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: countQueries.all })
      toast.success(t('counts.started'))
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? t('counts.alreadyOpen')
          : t('validation.serverError'),
      ),
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label={t('counts.scope')} className="min-w-56">
        {(field) => (
          <select
            {...field}
            value={categoryId ?? ''}
            onChange={(event) =>
              setCategoryId(event.target.value ? Number(event.target.value) : null)
            }
            className="h-10 rounded-md border border-border-strong bg-surface-100 px-3 text-body"
          >
            <option value="">{t('counts.wholePharmacy')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryName(category, i18n.language)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Button disabled={start.isPending} onClick={() => start.mutate()}>
        {t('counts.startButton')}
      </Button>
    </div>
  )
}

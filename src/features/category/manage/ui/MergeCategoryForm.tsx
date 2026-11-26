import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryName, categoryQueries, mergeCategory, type Category } from '@/entities/category'
import { productQueries } from '@/entities/product'
import { Button } from '@/shared/ui/button'
import { toast } from '@/shared/ui/toast'

interface MergeCategoryFormProps {
  category: Category
  categories: Category[]
  onDone: () => void
}

/** Moves every product of one category into another, then removes the first. */
export function MergeCategoryForm({ category, categories, onDone }: MergeCategoryFormProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [targetId, setTargetId] = useState<number | null>(null)
  const others = categories.filter((item) => item.id !== category.id)
  const target = others.find((item) => item.id === targetId)

  const merge = useMutation({
    mutationFn: () => mergeCategory(category.id, targetId ?? 0),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(
        t('categories.merged', {
          from: categoryName(category, i18n.language),
          to: target ? categoryName(target, i18n.language) : '',
        }),
      )
      onDone()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  const label = t('categories.mergeWith', { name: categoryName(category, i18n.language) })

  return (
    <div className="flex flex-col gap-2 rounded-md border border-warning bg-warning-soft p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`merge-${category.id}`} className="font-semibold">
          {label}
        </label>
        <select
          id={`merge-${category.id}`}
          value={targetId ?? ''}
          onChange={(event) => setTargetId(event.target.value ? Number(event.target.value) : null)}
          className="h-9 rounded-lg border border-border bg-surface-100 px-2 text-small"
        >
          <option value="">{t('categories.chooseTarget')}</option>
          {others.map((item) => (
            <option key={item.id} value={item.id}>
              {categoryName(item, i18n.language)}
            </option>
          ))}
        </select>
      </div>
      <p className="text-small text-ink-muted">
        {t('categories.mergeNote', { count: category.productCount })}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={targetId === null || merge.isPending}
          onClick={() => merge.mutate()}
        >
          {t('categories.confirmMerge')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}

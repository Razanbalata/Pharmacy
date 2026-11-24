import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ingredientQueries, mergeIngredient, type Ingredient } from '@/entities/ingredient'
import { productQueries } from '@/entities/product'
import { Button } from '@/shared/ui/button'
import { Combobox } from '@/shared/ui/combobox'
import { Dialog } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

interface MergeIngredientDialogProps {
  open: boolean
  onClose: () => void
  ingredient: Ingredient
  ingredients: Ingredient[]
  /** Picked already, e.g. from the "these look the same" notice. */
  initialTargetId?: number | null
  onMerged?: (targetId: number) => void
}

/** Two names for the same substance split the alternatives; merging joins them again. */
export function MergeIngredientDialog({
  open,
  onClose,
  ingredient,
  ingredients,
  initialTargetId = null,
  onMerged,
}: MergeIngredientDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [targetId, setTargetId] = useState<number | null>(initialTargetId)
  const others = ingredients.filter((item) => item.id !== ingredient.id)
  const target = others.find((item) => item.id === targetId)

  const merge = useMutation({
    mutationFn: () => mergeIngredient(ingredient.id, targetId ?? 0),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(t('ingredients.merged', { from: ingredient.name, to: target?.name ?? '' }))
      if (targetId !== null) onMerged?.(targetId)
      onClose()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('ingredients.mergeTitle', { name: ingredient.name })}
      description={t('ingredients.mergeNote', { count: ingredient.productCount })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={targetId === null || merge.isPending} onClick={() => merge.mutate()}>
            {t('ingredients.confirmMerge')}
          </Button>
        </>
      }
    >
      <Field label={t('ingredients.mergeInto')}>
        {(field) => (
          <Combobox
            {...field}
            value={targetId === null ? null : String(targetId)}
            onChange={(next) => setTargetId(next === null ? null : Number(next))}
            options={others.map((item) => ({
              value: String(item.id),
              label: item.name,
              meta: t('categories.productCount', { count: item.productCount }),
              keywords: item.nameAr ?? '',
            }))}
          />
        )}
      </Field>
    </Dialog>
  )
}

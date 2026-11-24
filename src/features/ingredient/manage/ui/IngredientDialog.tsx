import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createIngredient,
  ingredientQueries,
  updateIngredient,
  type Ingredient,
} from '@/entities/ingredient'
import { productQueries } from '@/entities/product'
import { ApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

interface IngredientDialogProps {
  open: boolean
  onClose: () => void
  /** Renaming this ingredient; omitted to add one. */
  ingredient?: Ingredient | null
  onSaved?: (ingredient: Ingredient) => void
}

/** The scientific name, and an Arabic name that helps search. */
export function IngredientDialog({ open, onClose, ingredient, onSaved }: IngredientDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(ingredient?.name ?? '')
  const [nameAr, setNameAr] = useState(ingredient?.nameAr ?? '')
  const [error, setError] = useState<string | undefined>()

  const save = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), nameAr: nameAr.trim() || null }
      return ingredient ? updateIngredient(ingredient.id, input) : createIngredient(input)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(t(ingredient ? 'ingredients.saved' : 'ingredients.added', { name: saved.name }))
      onSaved?.(saved)
      onClose()
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError && failure.fieldErrors.name?.[0] === 'taken'
          ? t('ingredients.taken')
          : t('validation.serverError'),
      ),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    if (!name.trim()) setError(t('validation.required'))
    else save.mutate()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        ingredient
          ? t('ingredients.editTitle', { name: ingredient.name })
          : t('ingredients.newTitle')
      }
    >
      <form id="ingredient-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label={t('ingredients.name')} hint={t('ingredients.nameHint')} error={error}>
          {(field) => (
            <Input
              {...field}
              value={name}
              onChange={(event) => setName(event.target.value)}
              dir="ltr"
              className="text-start"
            />
          )}
        </Field>
        <Field label={t('ingredients.nameAr')} optional>
          {(field) => (
            <Input {...field} value={nameAr} onChange={(event) => setNameAr(event.target.value)} />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {t('ingredients.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

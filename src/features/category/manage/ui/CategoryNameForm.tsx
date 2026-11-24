import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api'
import { categoryQueries, createCategory, updateCategory, type Category } from '@/entities/category'
import { productQueries } from '@/entities/product'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

interface CategoryNameFormProps {
  /** Renaming this category; omitted for the "add" row at the top of the table. */
  category?: Category
  onDone?: () => void
}

/**
 * The two names in one line: Arabic (required) and English. Enter saves.
 * Used for the add row and for renaming a row in place.
 */
export function CategoryNameForm({ category, onDone }: CategoryNameFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [nameAr, setNameAr] = useState(category?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(category?.nameEn ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const input = { nameAr: nameAr.trim(), nameEn: nameEn.trim() }
      return category ? updateCategory(category.id, input) : createCategory(input)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(t(category ? 'categories.saved' : 'categories.added', { name: saved.nameAr }))
      if (!category) {
        setNameAr('')
        setNameEn('')
      }
      onDone?.()
    },
    onError: (failure) => {
      setError(
        failure instanceof ApiError && failure.fieldErrors.nameAr?.[0] === 'taken'
          ? t('categories.taken')
          : t('validation.serverError'),
      )
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!nameAr.trim()) {
      setError(t('validation.required'))
      return
    }
    save.mutate()
  }

  const errorId = category ? `category-${category.id}-error` : 'new-category-error'

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={nameAr}
          onChange={(event) => setNameAr(event.target.value)}
          aria-label={category ? t('categories.nameAr') : t('categories.newAr')}
          placeholder={category ? undefined : t('categories.newAr')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-9 w-48"
        />
        <Input
          value={nameEn}
          onChange={(event) => setNameEn(event.target.value)}
          aria-label={category ? t('categories.nameEn') : t('categories.newEn')}
          placeholder={category ? undefined : t('categories.newEn')}
          dir="ltr"
          className="h-9 w-48 text-start"
        />
        <Button type="submit" size="sm" disabled={save.isPending}>
          {category ? t('categories.save') : `+ ${t('categories.add')} ↵`}
        </Button>
        {category && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

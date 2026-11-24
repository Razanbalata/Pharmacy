import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryName, categoryQueries, deleteCategory, type Category } from '@/entities/category'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { toast } from '@/shared/ui/toast'

/** Only shows for an empty category: one with products is merged, never deleted. */
export function DeleteCategoryButton({ category }: { category: Category }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const name = categoryName(category, i18n.language)

  const remove = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: async () => {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      toast.success(t('categories.deleted', { name }))
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  if (category.productCount > 0) return null

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t('categories.delete')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => remove.mutate()}
        title={t('categories.deleteTitle', { name })}
        message={t('categories.deleteBody')}
        confirmLabel={t('categories.delete')}
        tone="danger"
        busy={remove.isPending}
      />
    </>
  )
}

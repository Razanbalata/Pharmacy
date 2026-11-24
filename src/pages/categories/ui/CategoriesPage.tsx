import { useQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { categoryQueries } from '@/entities/category'
import { canManageCatalog, useCurrentUser } from '@/entities/session'
import {
  CategoryNameForm,
  DeleteCategoryButton,
  MergeCategoryForm,
} from '@/features/category/manage'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { SkeletonRows } from '@/shared/ui/skeleton'

type Mode = { kind: 'edit' | 'merge'; id: number } | null

const th = 'px-4 py-3 text-start text-small font-semibold text-ink-muted whitespace-nowrap'
const td = 'px-4 py-3 align-middle'

export function CategoriesPage() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const canManage = user && 'pharmacy' in user ? canManageCatalog(user.role) : false
  const { data: categories = [], isPending } = useQuery(categoryQueries.list())
  const [mode, setMode] = useState<Mode>(null)
  const columns = canManage ? 5 : 4

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t('categories.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">
          {t('categories.subtitle', { count: categories.length })}
        </p>
      </div>

      {isPending ? (
        <SkeletonRows />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-100">
          <table className="w-full border-collapse text-body">
            <caption className="sr-only">{t('categories.title')}</caption>
            <thead>
              <tr className="border-b border-border">
                <th className={th}>{t('categories.nameAr')}</th>
                <th className={th}>{t('categories.nameEn')}</th>
                <th className={th}>{t('categories.products')}</th>
                <th className={th}>{t('categories.low')}</th>
                {canManage && (
                  <th className={th}>
                    <span className="sr-only">{t('categories.actions')}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {canManage && (
                <tr className="border-b border-border bg-surface-200/50">
                  <td className={td} colSpan={columns}>
                    <CategoryNameForm />
                  </td>
                </tr>
              )}
              {categories.map((category) => {
                const editing = mode?.kind === 'edit' && mode.id === category.id
                const merging = mode?.kind === 'merge' && mode.id === category.id
                return (
                  <Fragment key={category.id}>
                    <tr className="border-b border-border last:border-0">
                      {editing ? (
                        <td className={td} colSpan={2}>
                          <CategoryNameForm category={category} onDone={() => setMode(null)} />
                        </td>
                      ) : (
                        <>
                          <td className={`${td} font-semibold`}>{category.nameAr}</td>
                          <td className={`${td} text-ink-muted`} dir="ltr">
                            <bdi>{category.nameEn || '—'}</bdi>
                          </td>
                        </>
                      )}
                      <td className={td}>
                        <Link
                          to={`${paths.products}?category=${category.id}`}
                          className="tabular text-brand-strong hover:underline"
                        >
                          {t('categories.productCount', { count: category.productCount })}
                        </Link>
                      </td>
                      <td className={`${td} tabular`}>
                        {category.lowCount > 0 ? (
                          <Link
                            to={`${paths.products}?category=${category.id}&tab=low`}
                            className="text-warning hover:underline"
                          >
                            {category.lowCount}
                          </Link>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      {canManage && (
                        <td className={td}>
                          {!editing && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`${t('categories.edit')} ${category.nameAr}`}
                                onClick={() => setMode({ kind: 'edit', id: category.id })}
                              >
                                {t('categories.edit')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`${t('categories.merge')} ${category.nameAr}`}
                                onClick={() => setMode({ kind: 'merge', id: category.id })}
                              >
                                {t('categories.merge')}
                              </Button>
                              <DeleteCategoryButton category={category} />
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                    {merging && (
                      <tr className="border-b border-border">
                        <td className={td} colSpan={columns}>
                          <MergeCategoryForm
                            category={category}
                            categories={categories}
                            onDone={() => setMode(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-small text-ink-muted">{t('categories.note')}</p>
    </div>
  )
}

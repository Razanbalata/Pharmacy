import { SearchX } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { pharmacyQueries } from '@/entities/pharmacy'
import { productQueries } from '@/entities/product'
import { ProductForm } from '@/features/product/edit-product'
import { paths, to } from '@/shared/config'
import { buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** /products/new adds a product; /products/:id/edit changes one. Same form for both. */
export function ProductFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const id = params.id === undefined ? null : Number(params.id)
  const editing = id !== null
  const product = useQuery({
    ...productQueries.detail(id ?? 0),
    enabled: editing && Number.isInteger(id),
  })
  const settings = useQuery(pharmacyQueries.settings())

  if (editing && (product.isError || !Number.isInteger(id))) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('products.detail.notFound')}
        actions={
          <Link to={paths.products} className={buttonVariants({ variant: 'secondary' })}>
            {t('products.detail.back')}
          </Link>
        }
      />
    )
  }
  if ((editing && product.isPending) || settings.isPending) return <PageSkeleton variant="form" />

  const back = editing ? to(paths.productDetail, { id: id ?? 0 }) : paths.products

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav aria-label={t('common.breadcrumb')} className="text-small text-ink-muted">
          <Link to={paths.products} className="text-brand-strong hover:underline">
            {t('products.title')}
          </Link>
          {' › '}
          {editing ? t('nav.productEdit') : t('products.form.titleNew')}
        </nav>
        <h1 className="mt-1 font-display text-display">
          {editing && product.data ? (
            <bdi>{t('products.form.titleEdit', { name: product.data.name })}</bdi>
          ) : (
            t('products.form.titleNew')
          )}
        </h1>
      </div>
      <ProductForm
        {...(product.data ? { product: product.data } : {})}
        defaultMinStock={settings.data?.stock.defaultMinStock ?? 5}
        onSaved={(saved, again) => {
          if (!again) void navigate(to(paths.productDetail, { id: saved.id }))
        }}
        onCancel={() => void navigate(back)}
      />
    </div>
  )
}

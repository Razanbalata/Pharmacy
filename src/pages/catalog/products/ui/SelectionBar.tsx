import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { productsExportUrl } from '@/entities/product'
import { paths } from '@/shared/config'
import { Button, buttonVariants } from '@/shared/ui/button'

interface SelectionBarProps {
  ids: number[]
  onClear: () => void
  onBulkEdit: () => void
}

/** What can be done to the ticked products at once. Shows only while something is ticked. */
export function SelectionBar({ ids, onClear, onBulkEdit }: SelectionBarProps) {
  const { t } = useTranslation()
  const query = `ids=${ids.join(',')}`

  return (
    <section
      aria-label={t('products.selection.count', { count: ids.length })}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-brand bg-brand-soft px-4 py-2.5"
    >
      <span className="font-semibold text-brand-strong">
        {t('products.selection.count', { count: ids.length })}
      </span>
      <span className="grow" />
      <Button size="sm" onClick={onBulkEdit}>
        {t('products.selection.bulkEdit')}
      </Button>
      <Link
        to={`${paths.productLabels}?${query}`}
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        {t('products.selection.printLabels')}
      </Link>
      <Link
        to={`${paths.purchases}?${query}`}
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        {t('products.selection.addToPurchase')}
      </Link>
      <a
        href={productsExportUrl(ids)}
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        {t('products.selection.export')}
      </a>
      <Button size="sm" variant="ghost" onClick={onClear}>
        {t('products.selection.clear')}
      </Button>
    </section>
  )
}

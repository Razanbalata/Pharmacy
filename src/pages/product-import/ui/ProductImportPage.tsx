import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ImportWizard } from '@/features/product/import-products'
import { paths } from '@/shared/config'
import { buttonVariants } from '@/shared/ui/button'

export function ProductImportPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav aria-label={t('common.breadcrumb')} className="text-small text-ink-muted">
          <Link to={paths.products} className="text-brand-strong hover:underline">
            {t('products.title')}
          </Link>
          {' › '}
          {t('products.importLink')}
        </nav>
        <h1 className="mt-1 font-display text-display">{t('products.import.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('products.import.subtitle')}</p>
      </div>
      <ImportWizard
        productsLink={
          <Link to={paths.products} className={buttonVariants()}>
            {t('products.import.viewProducts')}
          </Link>
        }
      />
    </div>
  )
}
